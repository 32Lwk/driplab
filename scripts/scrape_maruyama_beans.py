#!/usr/bin/env python3
"""Maruyama Coffee whole-bean scraper and enhancer for DripLab."""

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

BASE = "https://www.maruyamacoffee.com/ec"
JST = timezone(timedelta(hours=9))
RAW_PATH = ROOT / "data" / "scraped" / "maruyama" / "beans_raw.json"
SEED_PATH = ROOT / "data" / "seeds" / "maruyama.beans.seed.json"
IMAGES_DIR = ROOT / "data" / "images" / "maruyama"
RATE_SEC = 0.5

CATS = [9, 7, 48, 52, 13, 165, 225, 21, 22, 107, 116, 180, 167, 168, 169, 164, 51, 79, 120]
EXCLUDE = [
    "ドリップバッグ", "コーヒーバッグ", "リキッド", "どら焼", "バーム", "ドーナuts",
    "フィルタ", "プレス", "サーバー", "ケトル", "マグ", "タンブラー", "サイフォン", "書籍", "器具",
]

MVP_PRODUCT_IDS = [24, 26, 3087]
MVP_SEED_IDS = {
    24: "maruyama-blend-100g",
    26: "maruyama-mocha-akane-100g",
    3087: "maruyama-samanbaia-geisha-80g",
}

ORIGIN_COUNTRIES = (
    "エルサルバドル", "エチオピア", "ケニア", "コロンビア", "グアテマラ", "ブラジル",
    "ホンジュラス", "コスタリカ", "インドネシア", "パナマ", "ルワンダ", "ブルンジ",
    "タンザニア", "ニカラグア", "ペルー", "ボリビア", "イエメン", "ハワイ", "メキシコ", "ウガンダ",
)


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def decode_unicode_escapes(text: str) -> str:
    def repl(m: re.Match[str]) -> str:
        return chr(int(m.group(1), 16))

    return re.sub(r"\\u([0-9a-fA-F]{4})", repl, text)


def parse_class_categories(html: str) -> dict | None:
    m = re.search(r"eccube\.classCategories\s*=\s*(\{.*?\});", html, re.DOTALL)
    if not m:
        m = re.search(r"classCategories\s*=\s*(\{.*?\});", html, re.DOTALL)
    if not m:
        return None
    raw = decode_unicode_escapes(m.group(1))
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def find_bean_variant(categories: dict | None) -> dict | None:
    if not categories:
        return None
    for group in categories.values():
        if not isinstance(group, dict):
            continue
        for key, variant in group.items():
            if not isinstance(variant, dict):
                continue
            if variant.get("name") == "豆":
                return variant
    return None


def parse_bean_price(html: str, categories: dict | None = None) -> int | None:
    variant = find_bean_variant(categories or parse_class_categories(html))
    if variant and variant.get("price02"):
        try:
            return int(str(variant["price02"]).replace(",", ""))
        except ValueError:
            pass
    m = re.search(r'class="price02_default"[^>]*>\s*([0-9,]+)\s*<', html)
    if m:
        return int(m.group(1).replace(",", ""))
    return None


def parse_weight_g(name: str, html: str) -> int | None:
    m = re.search(r"(\d+)g", name, re.I)
    if m:
        return int(m.group(1))
    m = re.search(r'<option value="\d+">(\d+)g</option>', html)
    if m:
        return int(m.group(1))
    return None


def parse_pack_count(name: str) -> int:
    m = re.search(r"(\d+)g\s*(\d+)袋", name)
    if m:
        return int(m.group(2))
    return 1


def parse_flavor_notes(og: str) -> str | None:
    if not og:
        return None
    m = re.search(r"香り[：:●○\s]+(.+?)(?:\s*$|▼|※|＜)", og)
    if m:
        return m.group(1).strip()
    m = re.search(r"([^\s、,]+(?:、[^\s、,]+){1,8})(?:\s*$|▼|※)", og)
    return m.group(1).strip() if m else None


def parse_description(og: str) -> str | None:
    if not og:
        return None
    desc = og.split("※")[0].strip()
    desc = re.split(r"●\s*賞味期限", desc)[0].strip()
    return desc or None


def parse_blend_origins(html: str) -> list[str] | None:
    m = re.search(r'class="productDetailExplain"[^>]*>(.*?)</div>', html, re.DOTALL)
    if not m:
        return None
    text = re.sub(r"<[^>]+>", " ", m.group(1))
    text = re.sub(r"\s+", " ", unescape(text)).strip()
    if "ブレンド配合" not in text:
        return None
    found = [country for country in ORIGIN_COUNTRIES if country in text]
    if "他" in text and found:
        found.append("他")
    return found or None


def parse_origin(name: str, og: str, html: str | None = None) -> str | list[str] | None:
    if html:
        blend = parse_blend_origins(html)
        if blend:
            return blend

    m = re.search(r"＜([^＞>]+)＞", og or "")
    if m:
        return m.group(1).strip()
    origin_name_pattern = (
        r"(エチオピア|ケニア|コロンビア|グアテマラ|ブラジル|ホンジュラス|コスタリカ|エルサルバドル|"
        r"インドネシア|パナマ|ルワンダ|ブルンジ|タンザニア|ニカラグア|ペルー|ボリビア|イエメン|"
        r"ハワイ|メキシコ|ウガンダ|スマトラ|モカ|キリマンジャロ|ゲイシャ|アグロタケシ|軽井沢|名古屋)"
    )
    m2 = re.search(origin_name_pattern, name)
    if m2:
        return m2.group(1)
    if "ブレンド" in name:
        return "ブレンド"
    if "カフェインレス" in name:
        return "カフェインレス"
    return None


def parse_gallery_images(html: str) -> list[str]:
    urls: list[str] = []
    gallery = re.search(r"productDetailInfoGallery.*?</ul>", html, re.DOTALL)
    if not gallery:
        return urls
    for m in re.finditer(
        r"background-image:\s*url\(['\"]?([^'\"]+)['\"]?\)",
        gallery.group(0),
    ):
        url = abs_url(m.group(1))
        if url not in urls:
            urls.append(url)
    return urls


def parse_roast(name: str) -> str | None:
    for r in ["極深煎り", "中深煎り", "深煎り", "中煎り", "浅煎り"]:
        if r in name:
            return r
    if "深煎" in name:
        return "深煎り"
    if "中煎" in name:
        return "中煎り"
    if "浅煎" in name:
        return "浅煎り"
    return None


def has_bean_option(html: str, categories: dict | None = None) -> bool:
    variant = find_bean_variant(categories or parse_class_categories(html))
    if variant:
        return True
    decoded = unescape(html)
    return ('"name":"豆"' in decoded) or ("\\u8c46" in html)


def bean_in_stock(html: str, categories: dict | None = None) -> bool:
    variant = find_bean_variant(categories or parse_class_categories(html))
    if variant is not None:
        return bool(variant.get("stock_find", True))
    if "販売終了" in html or "SOLD OUT" in html:
        return False
    return True


def abs_url(src: str) -> str:
    if src.startswith("http://") or src.startswith("https://"):
        return src
    if src.startswith("//"):
        return "https:" + src
    if src.startswith("/ec/"):
        return "https://www.maruyamacoffee.com" + src
    return BASE.rstrip("/") + src


def parse_product_image(html: str) -> str | None:
    url = extract_og_image(html)
    if url:
        return abs_url(url)
    for pat in (
        r'class="productDetailVisual_image"[^>]*>\s*<img[^>]+src="([^"]+)"',
        r'id="detail_image_box__img"[^>]+src="([^"]+)"',
        r'<img[^>]+src="(/upload/save_image/[^"]+)"',
    ):
        m = re.search(pat, html, re.I | re.DOTALL)
        if m:
            return abs_url(m.group(1))
    return None


def download_product_image(image_url: str, product_id: int | str) -> str | None:
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


def parse_product_detail(pid: str, html: str | None = None) -> dict | None:
    url = f"{BASE}/products/detail/{pid}"
    html = html or fetch(url)

    m = re.search(r'property="og:title"\s+content="([^"]+)"', html)
    if not m:
        return None
    name = re.sub(r"\s*\|\s*丸山珈琲.*", "", unescape(m.group(1))).strip()
    if any(x in name for x in EXCLUDE):
        return None

    categories = parse_class_categories(html)
    looks_like_bean = bool(
        re.search(r"(中煎|深煎|浅煎|ブレンド|ゲイシャ|カフェインレス).*\d+g", name)
    )
    if not has_bean_option(html, categories) and not looks_like_bean:
        return None
    if re.search(r"ドリップ|バッグ|リキッド", name):
        return None

    og = ""
    m4 = re.search(r'property="og:description"\s+content="([^"]*)"', html)
    if m4:
        og = unescape(m4.group(1))

    gallery_images = parse_gallery_images(html)
    image_url = gallery_images[0] if gallery_images else parse_product_image(html)
    image_local = download_product_image(image_url, pid) if image_url else None
    extra_images = [u for u in gallery_images[1:] if u != image_url] or None

    return {
        "product_id": int(pid),
        "name": name,
        "price_jpy": parse_bean_price(html, categories),
        "weight_g": parse_weight_g(name, html),
        "pack_count": parse_pack_count(name),
        "roast": parse_roast(name),
        "description": parse_description(og),
        "flavor_notes": parse_flavor_notes(og),
        "origin": parse_origin(name, og, html),
        "buy_url": url,
        "has_bean_option": has_bean_option(html, categories),
        "available": bean_in_stock(html, categories),
        "og_description": og,
        "image_url": image_url,
        "image_local": image_local,
        "extra_images": extra_images,
    }


def enrich_existing_bean(bean: dict, html: str) -> tuple[dict, int]:
    fixes = 0
    categories = parse_class_categories(html)
    enriched = dict(bean)

    price = parse_bean_price(html, categories)
    if price and price != bean.get("price_jpy"):
        enriched["price_jpy"] = price
        fixes += 1
    elif not bean.get("price_jpy") and price:
        enriched["price_jpy"] = price
        fixes += 1

    weight = parse_weight_g(bean.get("name", ""), html)
    if weight and weight != bean.get("weight_g"):
        enriched["weight_g"] = weight
        fixes += 1
    elif not bean.get("weight_g") and weight:
        enriched["weight_g"] = weight
        fixes += 1

    enriched["available"] = bean_in_stock(html, categories)
    enriched["has_bean_option"] = has_bean_option(html, categories)

    gallery_images = parse_gallery_images(html)
    image_url = gallery_images[0] if gallery_images else parse_product_image(html)
    if image_url:
        enriched["image_url"] = image_url
        if not bean.get("image_local"):
            local = download_product_image(image_url, bean["product_id"])
            if local:
                enriched["image_local"] = local
                fixes += 1
        elif bean.get("image_url") != image_url:
            enriched["image_url"] = image_url
            fixes += 1

    extra = [u for u in gallery_images[1:] if u != image_url]
    if extra:
        if enriched.get("extra_images") != extra:
            enriched["extra_images"] = extra
            fixes += 1
    elif enriched.get("extra_images"):
        del enriched["extra_images"]
        fixes += 1

    origin = parse_origin(bean.get("name", ""), bean.get("og_description", ""), html)
    if origin and origin != bean.get("origin"):
        enriched["origin"] = origin
        fixes += 1

    return enriched, fixes


def load_raw_beans() -> list[dict]:
    if not RAW_PATH.exists():
        return []
    data = json.loads(RAW_PATH.read_text(encoding="utf-8"))
    return data if isinstance(data, list) else data.get("beans", [])


def save_raw_beans(beans: list[dict]) -> None:
    RAW_PATH.parent.mkdir(parents=True, exist_ok=True)
    RAW_PATH.write_text(json.dumps(beans, ensure_ascii=False, indent=2), encoding="utf-8")


def score_from_og(og: str) -> dict[str, int]:
    bitterness = 50
    acidity = 50
    body = 50
    sweetness = 50
    if og:
        b = len(re.findall(r"苦味[：:●○\s]*●", og))
        a = len(re.findall(r"酸味[：:●○\s]*●", og))
        k = len(re.findall(r"コク[：:●○\s]*●", og))
        bitterness = min(85, 25 + b * 12)
        acidity = min(85, 25 + a * 12)
        body = min(85, 25 + k * 12)
        if re.search(r"甘|ハチミツ|キャラメル|チョコ", og):
            sweetness += 10
    return {
        "acidity": acidity,
        "body": body,
        "bitterness": bitterness,
        "sweetness": sweetness,
    }


def map_roast_level(roast: str | None) -> str:
    if not roast:
        return "medium"
    if "浅" in roast:
        return "light"
    if "中深" in roast or "極深" in roast:
        return "medium_dark"
    if "深" in roast:
        return "dark"
    return "medium"


def build_seed_entry(raw: dict) -> dict:
    og = raw.get("og_description") or raw.get("description") or ""
    flavor = (raw.get("flavor_notes") or "").split("▼")[0].strip()
    flavor_tags = [
        t.strip()
        for t in re.split(r"[、,]", flavor)
        if t.strip() and len(t.strip()) <= 16
    ][:4]
    if not flavor_tags:
        flavor_tags = ["香ばしさ"]

    desc = raw.get("description") or og
    desc = re.sub(r"\s+", " ", desc or "").strip()
    desc = re.split(r"▼|苦味[：:]", desc)[0].strip()[:220]

    product_id = raw["product_id"]
    origin_raw = raw.get("origin") or "ブレンド"
    if isinstance(origin_raw, list):
        origin = origin_raw
    else:
        origin = [origin_raw]
    scores = score_from_og(og)

    return {
        "id": MVP_SEED_IDS.get(product_id, f"maruyama-{product_id}"),
        "chain_id": "maruyama",
        "name": raw["name"],
        "description": desc,
        "roast_level": map_roast_level(raw.get("roast")),
        "roast_label_ja": raw.get("roast") or "中煎り",
        "taste_label_ja": flavor_tags[0] if flavor_tags else "バランス",
        "origin": origin,
        "flavor_tags": flavor_tags,
        **scores,
        "caffeine": "decaf" if "カフェインレス" in raw.get("name", "") else "medium",
        "price_jpy": raw.get("price_jpy"),
        "weight_g": raw.get("weight_g"),
        "buy_url": raw.get("buy_url"),
        "product_id": product_id,
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
        "chain_id": "maruyama",
        "scraped_at": datetime.now(JST).strftime("%Y-%m-%dT%H:%M:%S+09:00"),
        "source": BASE,
        "beans": seed_beans,
    }
    SEED_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved seed {len(seed_beans)} items -> {SEED_PATH}")


def collect_product_ids() -> list[str]:
    ids: set[str] = set()
    for cat in CATS:
        for page in range(1, 6):
            url = f"{BASE}/index.php/products/list?category_id={cat}&disp_number=100&pageno={page}"
            try:
                html = fetch(url)
            except Exception:
                break
            found = re.findall(r"products/detail/(\d+)", html)
            if not found:
                break
            ids.update(found)
            if f"pageno={page + 1}" not in html:
                break
            time.sleep(RATE_SEC)
        time.sleep(0.3)
    return sorted(ids, key=int)


def run_full_scrape() -> dict:
    ids = collect_product_ids()
    print(f"Collected {len(ids)} product IDs")

    beans: list[dict] = []
    for i, pid in enumerate(ids, 1):
        print(f"[{i}/{len(ids)}] {pid}")
        try:
            item = parse_product_detail(pid)
            if item:
                beans.append(item)
        except Exception as exc:
            print(f"  ERROR: {exc}")
        time.sleep(RATE_SEC)

    save_raw_beans(beans)
    write_seed(beans)
    return summarize(beans)


def run_enhance() -> dict:
    beans = load_raw_beans()
    if not beans:
        raise SystemExit(f"No beans at {RAW_PATH}")

    print(f"Enhancing {len(beans)} Maruyama beans...")
    total_fixes = 0
    images_ok = 0

    for i, bean in enumerate(beans, 1):
        url = bean.get("buy_url") or f"{BASE}/products/detail/{bean['product_id']}"
        print(f"[{i}/{len(beans)}] {bean['product_id']}")
        html = fetch(url)
        enriched, fixes = enrich_existing_bean(bean, html)
        beans[i - 1] = enriched
        total_fixes += fixes
        if enriched.get("image_local"):
            images_ok += 1
        time.sleep(RATE_SEC)

    save_raw_beans(beans)
    write_seed(beans)
    stats = summarize(beans)
    stats["data_fixes"] = total_fixes
    stats["images_downloaded"] = images_ok
    return stats


def summarize(beans: list[dict]) -> dict:
    return {
        "count": len(beans),
        "images": sum(1 for b in beans if b.get("image_local")),
        "missing_price": sum(1 for b in beans if not b.get("price_jpy")),
        "missing_weight": sum(1 for b in beans if not b.get("weight_g")),
        "issues": [
            f"product_id={b['product_id']} missing image"
            for b in beans
            if not b.get("image_local")
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape or enhance Maruyama beans")
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
