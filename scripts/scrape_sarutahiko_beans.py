#!/usr/bin/env python3
"""Scrape Sarutahiko Coffee whole bean products from sarutahiko.jp (Shopify)."""

import json
import re
import html
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

JST = timezone(timedelta(hours=9))
ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "scraped" / "sarutahiko" / "beans_raw.json"
SEED_PATH = ROOT / "data/seeds/sarutahiko.beans.seed.json"
NOTES_PATH = ROOT / "docs/research/SARUTAHIKO.md"
BASE_URL = "https://sarutahiko.jp"
COLLECTION = "coffeebeans-groundcoffee"

ROAST_PATTERNS = [
    (r"浅煎り", ("light", "浅煎り")),
    (r"中浅煎り", ("light_medium", "中浅煎り")),
    (r"中煎り", ("medium", "中煎り")),
    (r"中深煎り", ("medium_dark", "中深煎り")),
    (r"深煎り", ("dark", "深煎り")),
]

EXCLUDE_TITLE = re.compile(
    r"セット|飲み比べ|定期便|Drippen|スターター|ギフト|お試し|"
    r"ドリップバッグ|リキッド|カフェオレ|ゼリー|バラエティ|"
    r"2種|3種|300gセット|500gセット|200gセット"
)

MVP_HANDLES = ["m-d", "m-ec", "m-t-spring2026"]


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={
        "Accept": "application/json",
        "Accept-Language": "ja-JP,ja;q=0.9",
        "User-Agent": "DripLab/0.1 (research; +https://github.com/driplab)",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def strip_html(text: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", text or "", flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    return html.unescape(text).strip()


def parse_roast(title: str, body: str) -> tuple[str, str]:
    for text in (title, body):
        for pat, val in ROAST_PATTERNS:
            if re.search(pat, text):
                return val
    return ("medium", "中煎り")


def parse_weight(title: str, body: str, variants: list) -> int:
    for v in variants:
        m = re.search(r"(\d+)\s*g", v.get("title", ""), re.I)
        if m:
            return int(m.group(1))
    for text in (title, body):
        m = re.search(r"(\d+)\s*g", text, re.I)
        if m:
            return int(m.group(1))
    return 100


def parse_description(body_html: str) -> str:
    body = strip_html(body_html)
    skip_headers = {
        "味わい", "ストーリー", "美味しい召上がり方", "猿田彦珈琲のコラム",
        "焙煎や配合のこだわり", "ブレンドコンセプト", "詳細情報", "注意事項",
    }
    parts: list[str] = []
    for line in (l.strip() for l in body.split("\n")):
        if not line or line in skip_headers:
            if parts:
                break
            continue
        if line.startswith("【詳しく") or line.startswith("・"):
            if parts:
                break
            continue
        if len(line) > 12:
            parts.append(line)
        if len("".join(parts)) >= 100:
            break
    return " ".join(parts)[:500] if parts else body[:500]


def fetch_page_metadata(handle: str) -> dict[str, str]:
    """Extract 【原材料】/【ブレンド配合】 from rendered product page."""
    url = f"{BASE_URL}/products/{handle}"
    req = urllib.request.Request(url, headers={
        "Accept-Language": "ja-JP,ja;q=0.9",
        "User-Agent": "DripLab/0.1 (research; +https://github.com/driplab)",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            page = resp.read().decode("utf-8", errors="replace")
    except Exception:
        return {}
    out: dict[str, str] = {}
    for key in ("内容量", "焙煎度合い", "焙煎度合", "原材料", "ブレンド配合"):
        m = re.search(rf"【{key}】([^【\n<]+)", page)
        if m:
            out[key] = m.group(1).strip()
    return out


def parse_origin(title: str, body: str, tags: list, meta: dict[str, str] | None = None) -> list[str]:
    origins: list[str] = []
    # Single origin: extract country before ／
    m = re.search(r"】\s*(?:ディカフェ\s+|バレルエイジド\s*)?([^／]+)／", title)
    if m:
        country = re.sub(r"\s+", " ", m.group(1)).strip()
        if country and country not in origins:
            origins.append(country)
    meta = meta or {}
    for key in ("原材料", "ブレンド配合"):
        raw = meta.get(key, "")
        if not raw:
            m2 = re.search(rf"【{key}】([^【\n]+)", body)
            raw = m2.group(1) if m2 else ""
        if raw:
            for part in re.split(r"[、,]", raw):
                p = part.replace("他", "").strip()
                if p and p not in origins:
                    origins.append(p)
    if "ブレンド" in title and "ブレンド" not in origins:
        origins.append("ブレンド")
    if "バレルエイジド" in title and "バレルエイジド" not in origins:
        origins.append("バレルエイジド")
    if not origins:
        if any("single" in t.lower() for t in tags):
            origins.append("シングルオリジン")
        else:
            origins.append("ブレンド")
    return origins


def flavor_tags_from_text(text: str) -> list[str]:
    mapping = [
        ("ダークチョコ", "ダークチョコレート"),
        ("チョコレート", "チョコレート"),
        ("チョコ", "チョコレート"),
        ("キャラメル", "キャラメル"),
        ("ナッツ", "ナッツ"),
        ("クルミ", "クルミ"),
        ("アーモンド", "アーモンド"),
        ("ベリー", "ベリー"),
        ("フルーティ", "フルーティ"),
        ("トロピカル", "トロピカル"),
        ("シトラス", "シトラス"),
        ("オレンジ", "オレンジ"),
        ("レモン", "レモン"),
        ("花", "フローラル"),
        ("フローラル", "フローラル"),
        ("甘み", "甘み"),
        ("黒糖", "黒糖"),
        ("コク", "コク"),
        ("香ばし", "香ばしさ"),
        ("キレ", "キレ"),
        ("すっきり", "すっきり"),
        ("まろやか", "まろやか"),
        ("芳醇", "芳醇"),
        ("ワイン", "ワイン"),
        ("紅茶", "紅茶"),
        ("ジャスミン", "ジャスミン"),
    ]
    tags: list[str] = []
    for kw, label in mapping:
        if kw in text and label not in tags:
            tags.append(label)
    return tags[:6]


def taste_label(title: str, body: str, flavor_tags: list[str]) -> str:
    for text in (body, title):
        if "まろやか" in text or "安らぐ" in text:
            return "まろやか"
        if "芳醇" in text or "リッチ" in text:
            return "芳醇・リッチ"
        if "すっきり" in text or "キレ" in text:
            return "すっきり・キレ"
        if "フルーティ" in text or "香り高" in text:
            return "フルーティ"
        if "バランス" in text:
            return "バランス"
    if flavor_tags:
        return "・".join(flavor_tags[:2])
    return "バランス"


def score_from_roast(roast_level: str) -> tuple[int, int, int, int]:
    acidity = {"light": 75, "light_medium": 65, "medium": 50, "medium_dark": 40, "dark": 30}.get(roast_level, 50)
    body = {"light": 35, "light_medium": 45, "medium": 50, "medium_dark": 60, "dark": 70}.get(roast_level, 50)
    bitterness = {"light": 30, "light_medium": 35, "medium": 45, "medium_dark": 55, "dark": 65}.get(roast_level, 45)
    sweetness = {"light": 55, "light_medium": 52, "medium": 50, "medium_dark": 48, "dark": 42}.get(roast_level, 50)
    return acidity, body, bitterness, sweetness


def slugify(handle: str, weight: int) -> str:
    return f"sarutahiko-{handle}-{weight}g"


def is_whole_bean_product(p: dict) -> tuple[bool, str]:
    title = p["title"]
    ptype = p.get("product_type", "")
    tags = p.get("tags") or []

    if ptype != "コーヒー豆/粉":
        return False, f"product_type={ptype}"
    if EXCLUDE_TITLE.search(title):
        return False, "bundle/set excluded"
    if any(t.startswith(("trialset_", "subscription_", "giftset_", "beans_set")) for t in tags):
        return False, "set tag excluded"
    return True, "ok"


def get_bean_price_variant(variants: list) -> tuple[dict, int]:
    """Return variant and weight for base listing (smallest weight tier)."""
    bean_variants = []
    for v in variants:
        t = v.get("title", "")
        if "粉" in t or "挽" in t:
            continue
        if "中挽" in t:
            continue
        bean_variants.append(v)

    if not bean_variants:
        bean_variants = variants

    def weight_of(v):
        m = re.search(r"(\d+)\s*g", v.get("title", ""), re.I)
        return int(m.group(1)) if m else 9999

    chosen = min(bean_variants, key=weight_of)
    weight = weight_of(chosen)
    if weight == 9999:
        weight = 100
    return chosen, weight


def build_raw_entry(p: dict, *, fetch_meta: bool = True) -> dict:
    title = p["title"]
    handle = p["handle"]
    body_html = p.get("body_html", "")
    body = strip_html(body_html)
    tags = p.get("tags") or []
    meta = fetch_page_metadata(handle) if fetch_meta else {}
    roast_level, roast_label = parse_roast(title, body)
    variant, weight = get_bean_price_variant(p["variants"])
    price = int(float(variant["price"]))
    available = p.get("available", False) or any(
        v.get("available") for v in p["variants"] if "粉" not in v.get("title", "")
    )

    origin = parse_origin(title, body, tags, meta)
    description = parse_description(body_html)
    flavor_tags = flavor_tags_from_text(title + " " + body)
    taste = taste_label(title, body, flavor_tags)
    acidity, body_s, bitterness, sweetness = score_from_roast(roast_level)

    if "ディカフェ" in title:
        caffeine = "decaf"
    else:
        caffeine = "medium"

    if re.search(r"甘|キャラメル|チョコ|黒糖|蜂蜜", body):
        sweetness = min(85, sweetness + 10)
    if re.search(r"すっきり|キレ|爽やか", body):
        acidity = min(90, acidity + 10)
    if re.search(r"コク|深み|リッチ", body):
        body_s = min(85, body_s + 10)

    images = p.get("images") or []
    image_url = images[0]["src"].split("?")[0] if images else None
    product_id = str(p["id"])

    return {
        "product_id": product_id,
        "handle": handle,
        "name": title,
        "price_jpy": price,
        "weight_g": weight,
        "pack_count": 1,
        "roast": roast_label,
        "roast_level": roast_level,
        "roast_label_ja": roast_label,
        "taste_label_ja": taste,
        "description": description,
        "flavor_tags": flavor_tags,
        "origin": origin,
        "acidity": acidity,
        "body": body_s,
        "bitterness": bitterness,
        "sweetness": sweetness,
        "caffeine": caffeine,
        "buy_url": f"{BASE_URL}/products/{handle}",
        "has_bean_option": True,
        "available": available,
        "image_url": image_url,
        "image_local": f"data/images/sarutahiko/{handle}.jpg",
        "image_cdn_url": f"https://assets.coffee.yutok.dev/beans/sarutahiko/{handle}.jpg",
        "tags": tags,
        "product_type": p.get("product_type"),
        "variants": [
            {
                "title": v.get("title"),
                "price": int(float(v.get("price", 0))),
                "available": v.get("available"),
                "sku": v.get("sku"),
            }
            for v in p.get("variants", [])
        ],
    }


def to_seed_bean(raw: dict) -> dict:
    name = raw["name"]
    if raw["weight_g"]:
        name = f"{raw['name']} - {raw['weight_g']}g / 豆のまま"
    return {
        "id": slugify(raw["handle"], raw["weight_g"]),
        "chain_id": "sarutahiko",
        "name": name,
        "description": raw["description"],
        "roast_level": raw["roast_level"],
        "roast_label_ja": raw["roast_label_ja"],
        "taste_label_ja": raw["taste_label_ja"],
        "origin": raw["origin"],
        "flavor_tags": raw["flavor_tags"],
        "acidity": raw["acidity"],
        "body": raw["body"],
        "bitterness": raw["bitterness"],
        "sweetness": raw["sweetness"],
        "caffeine": raw["caffeine"],
        "price_jpy": raw["price_jpy"],
        "weight_g": raw["weight_g"],
        "buy_url": raw["buy_url"],
        "product_id": raw["product_id"],
        "image_url": raw["image_url"],
        "image_local": raw["image_local"],
        "source": "scraped",
        "available": raw["available"],
        "image_cdn_url": raw["image_cdn_url"],
    }


def pick_mvp(beans: list[dict]) -> list[dict]:
    by_handle = {b["handle"]: b for b in beans}
    mvp = [by_handle[h] for h in MVP_HANDLES if h in by_handle]
    return mvp[:3]


def write_notes(beans: list[dict], excluded: list[tuple[str, str]], scraped_at: str):
    NOTES_PATH.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# 猿田彦珈琲 (Sarutahiko Coffee) — Research Notes",
        "",
        f"**Scraped:** {scraped_at}",
        f"**Source:** {BASE_URL}",
        "**Chain ID:** `sarutahiko`",
        "",
        "## Official EC",
        "",
        "- URL: https://sarutahiko.jp/",
        "- Platform: Shopify",
        "- Whole bean collection: https://sarutahiko.jp/collections/coffeebeans-groundcoffee",
        "",
        "## Scraping notes",
        "",
        "1. Primary source: Shopify JSON API `collections/coffeebeans-groundcoffee/products.json`",
        "2. Verified product pages: `/products/m-d` (大吉 ¥980), `/products/m-ec` (恵比寿シティ ¥1,000)",
        "3. Include: `product_type=コーヒー豆/粉` single-SKU items (not sets/subscriptions)",
        "4. Price/weight: smallest bean tier (typically 100g; Geisha lots 50g; 巣ごもり 500g)",
        "5. Variant format: some products use `100g / 豆のまま`, others just `100g` (both are whole bean)",
        "6. Descriptions parsed from `body_html` 商品説明 section",
        "7. Excluded: 13 bundle/set/subscription items in same collection",
        "8. `wbe1` (猿田彦クラシック豆) returns 404 — discontinued from EC",
        "",
        "## Catalog summary",
        "",
        f"- **Whole bean single products:** {len(beans)}",
        f"- **Excluded bundles/sets:** {len(excluded)}",
        "",
        "## MVP seeds (3)",
        "",
        "| Product | Price (100g) | URL |",
        "|---------|--------------|-----|",
    ]
    for b in pick_mvp(beans):
        lines.append(f"| {b['name']} | ¥{b['price_jpy']:,} | {b['buy_url']} |")

    lines.extend(["", "## Full catalog", ""])
    for b in sorted(beans, key=lambda x: x["name"]):
        avail = "✓" if b["available"] else "✗"
        lines.append(
            f"- [{b['name']}]({b['buy_url']}) — ¥{b['price_jpy']:,} / {b['weight_g']}g {avail}"
        )

    lines.extend(["", "## Excluded (not whole-bean singles)", ""])
    for title, reason in sorted(excluded):
        lines.append(f"- {title} — {reason}")

    NOTES_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    scraped_at = datetime.now(JST).strftime("%Y-%m-%dT%H:%M:%S%z")
    scraped_at_iso = scraped_at[:-2] + ":" + scraped_at[-2:]

    url = f"{BASE_URL}/collections/{COLLECTION}/products.json?limit=250"
    data = fetch_json(url)
    products = data.get("products", [])
    print(f"Fetched {len(products)} products from {COLLECTION}")

    beans: list[dict] = []
    excluded: list[tuple[str, str]] = []
    for p in sorted(products, key=lambda x: x["title"]):
        ok, reason = is_whole_bean_product(p)
        if ok:
            beans.append(build_raw_entry(p))
        else:
            excluded.append((p["title"], reason))

    RAW_PATH.parent.mkdir(parents=True, exist_ok=True)
    RAW_PATH.write_text(json.dumps(beans, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(beans)} beans to {RAW_PATH}")

    mvp = pick_mvp(beans)
    seed = {
        "version": "0.1.0",
        "chain_id": "sarutahiko",
        "scraped_at": scraped_at_iso,
        "source": BASE_URL,
        "beans": [to_seed_bean(b) for b in mvp],
    }
    SEED_PATH.write_text(json.dumps(seed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(mvp)} MVP seeds to {SEED_PATH}")

    write_notes(beans, excluded, scraped_at_iso)
    print(f"Wrote notes to {NOTES_PATH}")

    for b in beans:
        print(f"  {b['name'][:52]:52} ¥{b['price_jpy']:>5} {b['weight_g']:>3}g avail={b['available']}")


if __name__ == "__main__":
    main()
