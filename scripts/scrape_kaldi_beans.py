#!/usr/bin/env python3
"""Scrape KALDI online store coffee beans (whole bean available)."""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.request
from datetime import datetime, timedelta, timezone
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from image_utils import USER_AGENT, extract_og_image  # noqa: E402

BASE = "https://www.kaldi.co.jp"
CATEGORY = f"{BASE}/ec/Facet?category_0=11010100000"
JST = timezone(timedelta(hours=9))
RATE_SEC = 1.0
RAW_PATH = ROOT / "data" / "scraped" / "kaldi" / "beans_raw.json"
SEED_PATH = ROOT / "data" / "seeds" / "kaldi.beans.seed.json"
IMAGES_DIR = ROOT / "data" / "images" / "kaldi"

MVP_PRODUCT_IDS = ["4515996019050", "4515996015052", "4515996015120"]
MVP_SEED_IDS = {
    "4515996019050": "kaldi-mild-kaldi-200g",
    "4515996015052": "kaldi-mocha-blend-200g",
    "4515996015120": "kaldi-kilimanjaro-200g",
}

GENERIC_DESC_MARKERS = ("公式オンラインストアです", "@charset")


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", errors="replace")


def abs_url(src: str) -> str:
    src = src.strip()
    if src.startswith("http://") or src.startswith("https://"):
        return src
    if src.startswith("//"):
        return "https:" + src
    return BASE.rstrip("/") + src


def extract_listing_product_ids(html: str) -> list[str]:
    """Listing grid links use ?sFlg=2; avoids sidebar/ranking duplicates."""
    return re.findall(r"/ec/pro/disp/1/([A-Za-z0-9_-]+)\?sFlg=2", html)


def table_field(html: str, label: str) -> str | None:
    pat = rf"<th>{re.escape(label)}</th>\s*<td>(.*?)</td>"
    m = re.search(pat, html, re.DOTALL)
    if not m:
        return None
    text = re.sub(r"<[^>]+>", "", m.group(1))
    return unescape(re.sub(r"\s+", " ", text)).strip()


def parse_weight_g(name: str, content: str | None) -> int | None:
    for src in (content or "", name):
        m = re.search(r"(\d+)\s*g", src, re.I)
        if m:
            return int(m.group(1))
    return None


def has_whole_bean_option(html: str) -> bool:
    if re.search(r'<option value="MAME">豆</option>', html):
        return True
    if re.search(r'value="MAME"', html) and "豆" in html:
        return True
    return False


def parse_price(html: str) -> int | None:
    prices = [
        int(v)
        for v in re.findall(
            r'id="standardMtx_\d+_0_0_SellingPriceIncTax"\s+value="(\d+)"', html
        )
        if int(v) > 0
    ]
    if prices:
        return prices[0]
    m = re.search(r'id="hidSinglePrice"\s+value="(\d+)"', html)
    if m and int(m.group(1)) > 0:
        return int(m.group(1))
    m = re.search(r"通常価格\s*<strong[^>]*>([\d,]+)</strong>", html)
    if m:
        return int(m.group(1).replace(",", ""))
    m = re.search(r"販売価格\s*<strong[^>]*>([\d,]+)</strong>", html)
    if m:
        return int(m.group(1).replace(",", ""))
    return None


def parse_product_detail_text(html: str) -> str:
    """Extract headline + body from pro_detail_* blocks."""
    parts: list[str] = []
    for block in re.finditer(
        r'<div class="pro_detail_text\d*_style">(.*?)</div>', html, re.DOTALL | re.I
    ):
        headline = re.search(
            r'class="pro_detail_headline\d*_style">\s*(.*?)\s*</h3>',
            block.group(1),
            re.DOTALL,
        )
        body = re.search(
            r'class="pro_detail_desp\d*_style">\s*(.*?)\s*</p>',
            block.group(1),
            re.DOTALL,
        )
        if headline:
            h = unescape(re.sub(r"<[^>]+>", "", headline.group(1)))
            h = re.sub(r"\s+", " ", h).strip()
            if h:
                parts.append(h)
        if body:
            b = unescape(re.sub(r"<[^>]+>", "", body.group(1)))
            b = re.sub(r"\s+", " ", b).strip()
            if b:
                parts.append(b)
    if parts:
        return "。".join(dict.fromkeys(parts))[:500]
    return ""


def fallback_description(
    *,
    taste: str | None,
    body: str | None,
    origin: str | None,
    name: str,
) -> str:
    parts = []
    if taste:
        parts.append(f"テイスト: {taste}")
    if body:
        parts.append(f"ボディ: {body}")
    if origin:
        parts.append(f"生産国: {origin}")
    return "。".join(parts) + "。" if parts else name


def is_generic_description(desc: str) -> bool:
    if not desc or len(desc.strip()) < 8:
        return True
    return any(marker in desc for marker in GENERIC_DESC_MARKERS)


def parse_description(html: str, *, taste: str | None = None, body: str | None = None, origin: str | None = None, name: str = "") -> str:
    detail = parse_product_detail_text(html)
    if detail:
        return detail

    for pat in (
        r'property="og:description"\s+content="([^"]*)"',
        r'content="([^"]*)"\s+property="og:description"',
        r'name="description"\s+content="([^"]*)"',
        r'content="([^"]*)"\s+name="description"',
    ):
        m = re.search(pat, html)
        if m and m.group(1).strip():
            text = unescape(m.group(1).strip())
            if not is_generic_description(text):
                return text

    m = re.search(r'<div class="description">\s*(.*?)\s*</div>', html, re.DOTALL)
    if m:
        text = re.sub(r"<style[^>]*>.*?</style>", "", m.group(1), flags=re.DOTALL)
        text = re.sub(r"<[^>]+>", "", text)
        text = unescape(re.sub(r"\s+", " ", text)).strip()
        for marker in ("-->", "国際品評会", "カルディコーヒーファーム"):
            idx = text.find(marker)
            if idx > 0 and marker == "-->":
                text = text[idx + 3 :].strip()
            elif idx >= 0 and marker != "-->":
                text = text[idx:].strip()
                break
        if text and not is_generic_description(text):
            return text[:500]

    return fallback_description(taste=taste, body=body, origin=origin, name=name)


def parse_product_image(html: str, product_id: str) -> str | None:
    url = extract_og_image(html)
    if not url:
        m = re.search(r'content="([^"]+)"\s+property="og:image"', html)
        url = m.group(1) if m else None
    if not url:
        m = re.search(rf'/ec/img/\d+/{re.escape(product_id)}_[^"\']+\.(?:jpg|png|webp)', html, re.I)
        if m:
            url = m.group(0)
    if not url:
        m = re.search(rf'src="(/ec/img/[^"]*{re.escape(product_id)}[^"]+\.(?:jpg|png|webp))"', html, re.I)
        if m:
            url = m.group(1)
    if url:
        return abs_url(url)
    return None


def download_product_image(image_url: str, product_id: str) -> str | None:
    if not image_url:
        return None
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    dest = IMAGES_DIR / f"{product_id}.jpg"
    req = urllib.request.Request(image_url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            dest.write_bytes(resp.read())
        return dest.relative_to(ROOT).as_posix()
    except Exception:
        return None


def parse_product(product_id: str, html: str | None = None) -> dict | None:
    url = f"{BASE}/ec/pro/disp/1/{product_id}"
    html = html or fetch(url)

    if "この商品は現在お取り扱いしておりません" in html:
        return None

    name_m = re.search(r'name="productName"\s+value="([^"]*)"', html)
    if not name_m or not name_m.group(1).strip():
        og = re.search(r'property="og:title"\s+content="([^"]+)"', html)
        name = og.group(1).split(" - ")[0] if og else ""
    else:
        name = unescape(name_m.group(1).strip())

    if not name:
        return None

    if not has_whole_bean_option(html):
        return None

    roast = table_field(html, "ロースト")
    origin = table_field(html, "生豆生産国")
    content = table_field(html, "内容量")
    taste = table_field(html, "テイストバランス")
    body = table_field(html, "ボディ")
    coffee_type = table_field(html, "コーヒーの種類")

    description = parse_description(html, taste=taste, body=body, origin=origin, name=name)
    description = re.sub(r"<[^>]+>", "", description)
    price = parse_price(html)
    weight = parse_weight_g(name, content)

    unavailable = "この商品は現在お取り扱いしておりません" in html
    stock_msg = bool(re.search(r"売り切れ|在庫がありません|SOLD OUT", html, re.I))

    image_url = parse_product_image(html, product_id)
    image_local = download_product_image(image_url, product_id) if image_url else None

    return {
        "product_id": product_id,
        "chain_id": "kaldi",
        "name": name,
        "price_jpy": price,
        "weight_g": weight,
        "roast": roast,
        "roast_label_ja": roast,
        "origin": origin,
        "coffee_type": coffee_type,
        "taste_balance": taste,
        "body_label": body,
        "description": description,
        "buy_url": url,
        "grind_options_include_bean": True,
        "available": not (unavailable or stock_msg),
        "image_url": image_url,
        "image_local": image_local,
    }


def enrich_existing_bean(bean: dict, html: str) -> tuple[dict, int]:
    fixes = 0
    enriched = dict(bean)

    price = parse_price(html)
    if price and bean.get("price_jpy") != price:
        enriched["price_jpy"] = price
        fixes += 1
    elif not bean.get("price_jpy") and price:
        enriched["price_jpy"] = price
        fixes += 1

    roast = table_field(html, "ロースト")
    origin = table_field(html, "生豆生産国")
    content = table_field(html, "内容量")
    taste = table_field(html, "テイストバランス")
    body = table_field(html, "ボディ")

    new_desc = parse_description(html, taste=taste, body=body, origin=origin, name=bean.get("name", ""))
    new_desc = re.sub(r"<[^>]+>", "", new_desc)
    old_desc = re.sub(r"<[^>]+>", "", bean.get("description") or "")
    if new_desc and (
        is_generic_description(old_desc)
        or old_desc.startswith("テイスト:")
        or len(new_desc) > len(old_desc) + 5
    ):
        enriched["description"] = new_desc
        fixes += 1

    for key, val in (
        ("roast", roast),
        ("roast_label_ja", roast),
        ("origin", origin),
        ("taste_balance", taste),
        ("body_label", body),
    ):
        if val and enriched.get(key) != val:
            enriched[key] = val
            fixes += 1

    weight = parse_weight_g(bean.get("name", ""), content)
    if weight and not bean.get("weight_g"):
        enriched["weight_g"] = weight
        fixes += 1

    image_url = parse_product_image(html, str(bean["product_id"]))
    if image_url:
        enriched["image_url"] = image_url
        if not bean.get("image_local"):
            local = download_product_image(image_url, str(bean["product_id"]))
            if local:
                enriched["image_local"] = local
                fixes += 1

    return enriched, fixes


def collect_listing_ids() -> list[str]:
    ids: list[str] = []
    page = 1
    while True:
        suffix = f"&page={page}" if page > 1 else ""
        html = fetch(f"{CATEGORY}{suffix}")
        page_ids = extract_listing_product_ids(html)
        for pid in page_ids:
            if pid not in ids:
                ids.append(pid)
        has_next = bool(
            re.search(rf'category_0=11010100000&amp;page={page + 1}', html)
        )
        if not has_next:
            break
        page += 1
        time.sleep(RATE_SEC)
    return ids


def load_raw_payload() -> dict:
    if not RAW_PATH.exists():
        return {"beans": [], "skipped_ids": []}
    return json.loads(RAW_PATH.read_text(encoding="utf-8"))


def map_roast_level(roast: str | None) -> str:
    if not roast:
        return "medium"
    if "中深" in roast:
        return "medium_dark"
    if "深" in roast:
        return "dark"
    return "medium"


def taste_scores(taste: str | None) -> dict[str, int]:
    if taste == "爽やかな酸味":
        return {"acidity": 72, "body": 50, "bitterness": 35, "sweetness": 50}
    if taste == "やわらかな甘み":
        return {"acidity": 45, "body": 50, "bitterness": 40, "sweetness": 65}
    if taste == "強い香りと苦み":
        return {"acidity": 35, "body": 70, "bitterness": 70, "sweetness": 40}
    return {"acidity": 50, "body": 55, "bitterness": 45, "sweetness": 55}


def build_seed_entry(raw: dict) -> dict:
    taste = raw.get("taste_balance")
    scores = taste_scores(taste)
    origin_parts = [o.strip() for o in re.split(r"[、,/]", raw.get("origin") or "") if o.strip()]
    if raw.get("coffee_type") == "ブレンド" and "ブレンド" not in origin_parts:
        origin_parts.append("ブレンド")

    desc = re.sub(r"\s+", " ", raw.get("description") or "").strip()[:220]
    flavor_tags = []
    for kw, tag in (
        ("甘", "甘み"),
        ("モカ", "芳醇"),
        ("酸味", "酸味"),
        ("苦", "苦味"),
        ("チョコ", "チョコ"),
        ("ベリー", "ベリー"),
        ("ナッツ", "ナッツ"),
        ("シトラス", "シトラス"),
    ):
        if kw in desc and tag not in flavor_tags:
            flavor_tags.append(tag)
    if not flavor_tags:
        flavor_tags = ["バランス"]

    return {
        "id": MVP_SEED_IDS.get(raw["product_id"], f"kaldi-{raw['product_id']}"),
        "chain_id": "kaldi",
        "name": raw["name"],
        "description": desc,
        "roast_level": map_roast_level(raw.get("roast")),
        "roast_label_ja": raw.get("roast") or "中煎り",
        "taste_label_ja": taste or "バランス",
        "origin": origin_parts or ["ブレンド"],
        "flavor_tags": flavor_tags[:4],
        **scores,
        "caffeine": "decaf" if "デカフェ" in raw.get("name", "") else "medium",
        "price_jpy": raw.get("price_jpy"),
        "weight_g": raw.get("weight_g"),
        "buy_url": raw.get("buy_url"),
        "product_id": raw["product_id"],
        "image_url": raw.get("image_url"),
        "image_local": raw.get("image_local"),
        "source": "scraped",
        "available": raw.get("available", True),
    }


def write_seed(beans: list[dict]) -> None:
    by_id = {b["product_id"]: b for b in beans}
    seed_beans = [build_seed_entry(by_id[pid]) for pid in MVP_PRODUCT_IDS if pid in by_id]
    payload = {
        "version": "0.1.0",
        "chain_id": "kaldi",
        "scraped_at": datetime.now(JST).strftime("%Y-%m-%dT%H:%M:%S+09:00"),
        "source": CATEGORY,
        "beans": seed_beans,
    }
    SEED_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved seed {len(seed_beans)} items -> {SEED_PATH}")


def summarize(beans: list[dict]) -> dict:
    return {
        "count": len(beans),
        "images": sum(1 for b in beans if b.get("image_local")),
        "missing_price": sum(1 for b in beans if not b.get("price_jpy")),
        "generic_desc": sum(
            1 for b in beans if is_generic_description(b.get("description", ""))
            or (b.get("description") or "").startswith("テイスト:")
        ),
        "issues": [
            f"product_id={b['product_id']} missing image"
            for b in beans
            if not b.get("image_local")
        ],
    }


def run_full_scrape() -> dict:
    RAW_PATH.parent.mkdir(parents=True, exist_ok=True)
    print("Collecting product IDs from category 11010100000...")
    product_ids = collect_listing_ids()
    print(f"Found {len(product_ids)} listing URLs")

    beans: list[dict] = []
    skipped: list[str] = []
    for i, pid in enumerate(product_ids, 1):
        print(f"[{i}/{len(product_ids)}] {pid}")
        try:
            item = parse_product(pid)
            if item:
                beans.append(item)
            else:
                skipped.append(pid)
        except Exception as exc:
            print(f"  ERROR: {exc}")
            skipped.append(pid)
        time.sleep(RATE_SEC)

    beans.sort(key=lambda x: x["name"])
    payload = {
        "chain_id": "kaldi",
        "source": CATEGORY,
        "scraped_at": datetime.now(JST).strftime("%Y-%m-%dT%H:%M:%S+09:00"),
        "count": len(beans),
        "skipped_ids": skipped,
        "beans": beans,
    }
    RAW_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    write_seed(beans)
    stats = summarize(beans)
    stats["skipped"] = len(skipped)
    return stats


def run_enhance() -> dict:
    payload = load_raw_payload()
    beans = payload.get("beans", [])
    if not beans:
        raise SystemExit(f"No beans at {RAW_PATH}")

    print(f"Enhancing {len(beans)} Kaldi beans...")
    total_fixes = 0
    for i, bean in enumerate(beans, 1):
        url = bean.get("buy_url") or f"{BASE}/ec/pro/disp/1/{bean['product_id']}"
        print(f"[{i}/{len(beans)}] {bean['product_id']}")
        html = fetch(url)
        enriched, fixes = enrich_existing_bean(bean, html)
        beans[i - 1] = enriched
        total_fixes += fixes
        time.sleep(RATE_SEC)

    payload["beans"] = beans
    payload["scraped_at"] = datetime.now(JST).strftime("%Y-%m-%dT%H:%M:%S+09:00")
    payload["count"] = len(beans)
    RAW_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    write_seed(beans)
    stats = summarize(beans)
    stats["data_fixes"] = total_fixes
    return stats


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape or enhance Kaldi beans")
    parser.add_argument(
        "--full",
        action="store_true",
        help="Full category scrape (default: enhance existing beans_raw.json)",
    )
    args = parser.parse_args()

    stats = run_full_scrape() if args.full else run_enhance()
    print(json.dumps(stats, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
