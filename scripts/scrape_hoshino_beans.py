#!/usr/bin/env python3
"""Scrape Hoshino Coffee (星乃珈琲店) whole bean products from official EC (安心堂)."""

from __future__ import annotations

import argparse
import html
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

from image_utils import USER_AGENT, download_image, extract_og_image  # noqa: E402

BASE = "https://anshindo-d.com"
CATEGORY = f"{BASE}/c/shop_category/shop_drink/shop_drink_coffee/345"
JST = timezone(timedelta(hours=9))
RATE_SEC = 1.0
RAW_PATH = ROOT / "data" / "scraped" / "hoshino" / "beans_raw.json"
SEED_PATH = ROOT / "data" / "seeds" / "hoshino.beans.seed.json"
IMAGES_DIR = ROOT / "data" / "images" / "hoshino"
NOTES_PATH = ROOT / "data" / "scraped" / "hoshino" / "SCRAPING_NOTES.md"

# Verified 2026-08-08: only these two SKUs are whole-bean listings online.
WHOLE_BEAN_PRODUCTS = [
    {
        "product_id": "34500100",
        "fs_product_id": "17974",
        "path": "/c/shop_category/shop_drink/shop_drink_coffee/345/34500100",
    },
    {
        "product_id": "34501100",
        "fs_product_id": "21765",
        "path": "/c/shop_category/shop_drink/shop_drink_coffee/345/34501100",
    },
]

MVP_PRODUCT_IDS = ["34500100", "34501100", "hikoboshi-store"]
MVP_SEED_IDS = {
    "34500100": "hoshino-blend-500g",
    "34501100": "hoshino-ice-blend-400g",
    "hikoboshi-store": "hoshino-hikoboshi-blend-100g",
}

# Drip-pack pages on 安心堂 EC — used as image proxy for in-store whole beans.
DRIP_IMAGE_PATHS = {
    "hoshino-blend-store-100g": "/c/shop_category/shop_drink/shop_drink_coffee/345/34500800",
    "orihime-store-100g": "/c/shop_category/shop_drink/shop_drink_coffee/345/34500900",
    "hikoboshi-store": "/c/shop_category/shop_drink/shop_drink_coffee/345/34501000",
}


STORE_BEAN_DEFS = [
    {
        "product_id": "hoshino-blend-store-100g",
        "name": "星乃ブレンド（豆）100g",
        "description": (
            "星乃珈琲店のメインブレンド。シティローストで深みのある香りと、"
            "コクがあり酸味と甘味のバランスがとれた味わい。"
            "店舗レジにて100g単位で購入可能（オンライン豆販売は500gのみ）。"
        ),
        "roast_level": "medium",
        "roast_label_ja": "シティロースト（中煎）",
        "origin": ["ブレンド"],
        "flavor_tags": ["コク", "酸味", "甘み", "香ばしさ"],
        "image_fallback_product_id": "34500100",
    },
    {
        "product_id": "hikoboshi-store",
        "name": "彦星ブレンド（豆）100g",
        "description": (
            "程よい苦味を味わいたい方への重厚なブレンド。"
            "香ばしさとコクが特徴で、酸味は控えめ。"
            "店舗レジにて100g単位で購入可能（オンライン豆販売なし）。"
        ),
        "roast_level": "dark",
        "roast_label_ja": "深煎り",
        "origin": ["グアテマラ", "コロンビア", "ブラジル", "ブレンド"],
        "flavor_tags": ["香ばしさ", "コク", "苦味"],
    },
    {
        "product_id": "orihime-store-100g",
        "name": "織姫ブレンド（豆）100g",
        "description": (
            "アメリカンタイプの軽やかな口当たりで、飲みやすいブレンド。"
            "やや華やかで酸味のある味わい。"
            "店舗レジにて100g単位で購入可能（オンライン豆販売なし）。"
        ),
        "roast_level": "medium_dark",
        "roast_label_ja": "中深煎り",
        "origin": ["ブレンド"],
        "flavor_tags": ["酸味", "軽やか", "すっきり"],
    },
    {
        "product_id": "decaf-store-100g",
        "name": "カフェインレス珈琲（豆）100g",
        "description": (
            "カフェインを控えたい方向けの店舗販売豆。"
            "やわらかな口当たりで、店舗により取り扱い・在庫が異なります。"
            "店舗レジにて100g単位で購入可能（オンライン豆販売なし）。"
        ),
        "roast_level": "medium",
        "roast_label_ja": "中煎り",
        "origin": ["ブレンド"],
        "flavor_tags": ["やわらか", "マイルド"],
        "caffeine": "decaf",
        "image_fallback_product_id": "34500100",
    },
]


def fetch(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept-Language": "ja-JP,ja;q=0.9"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", errors="replace")


def table_field(page: str, label: str) -> str | None:
    pat = rf"<th[^>]*>\s*{re.escape(label)}\s*</th>\s*<td[^>]*>(.*?)</td>"
    m = re.search(pat, page, re.DOTALL | re.I)
    if not m:
        return None
    text = re.sub(r"<[^>]+>", "", m.group(1))
    return unescape(re.sub(r"\s+", " ", text)).strip()


def parse_price(page: str) -> int | None:
    m = re.search(
        r'class="fs-c-price__value">\s*([\d,]+)\s*<',
        page,
    )
    if m:
        return int(m.group(1).replace(",", ""))
    m = re.search(r'product:price:amount"\s+content="(\d+)"', page)
    if m:
        return int(m.group(1))
    return None


def parse_name(page: str) -> str | None:
    m = re.search(
        r'class="fs-c-productNameHeading__name">\s*(.*?)\s*</span>',
        page,
        re.DOTALL,
    )
    if m:
        return unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", m.group(1)))).strip()
    m = re.search(r'property="og:title"\s+content="([^"|]+)', page)
    if m:
        return unescape(m.group(1)).strip()
    return None


def parse_weight_g(name: str, content: str | None) -> int | None:
    for src in (name or "", content or ""):
        m = re.search(r"(\d+)\s*g", src, re.I)
        if m:
            return int(m.group(1))
    return None


def decode_og_image(page: str) -> str | None:
    m = re.search(r'property="og:image"\s+content="([^"]+)"', page)
    if not m:
        return extract_og_image(page)
    return html.unescape(m.group(1))


def clean_image_url(url: str | None) -> str | None:
    if not url:
        return None
    return url.split("?", 1)[0] + "?size=l&w=800"


def extract_lead_description(page: str) -> str:
    m = re.search(
        r'<div class="product_summary">(.*?)</div>',
        page,
        re.DOTALL,
    )
    if m:
        text = unescape(re.sub(r"<br\s*/?>", " ", m.group(1)))
        return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", text)).strip()
    return ""


def build_description(name: str, lead: str, page: str) -> str:
    parts: list[str] = []
    if lead:
        parts.append(lead.split("。※")[0].strip())
    if "シティロースト" in page and "星乃ブレンド" in name:
        parts.append(
            "シティロースト。深みがあって余韻のある香りと、コクがあり酸味と甘味のバランスがとれた味わい。"
        )
    if "深炒" in lead and "アイス" in name:
        if "アイスコーヒー用に深炒り" not in " ".join(parts):
            parts.append("アイスコーヒー用に深炒りで仕上げ。")
    return " ".join(dict.fromkeys(parts))


def infer_roast(name: str, description: str, page: str) -> tuple[str, str]:
    blob = f"{name} {description} {page}"
    if "深炒" in blob or "深煎" in blob or "アイス" in name:
        return "dark", "深煎り（深炒り）"
    if "シティロースト" in blob:
        return "medium", "シティロースト（中煎）"
    return "medium", "シティロースト（中煎）"


def infer_taste(name: str, description: str) -> str:
    if "アイス" in name or "アイス" in description:
        return "コク・深煎り"
    if "彦星" in name:
        return "重厚・苦味"
    if "織姫" in name:
        return "すっきり・軽やか"
    return "バランス"


def score_hoshino_blend(name: str) -> dict[str, int]:
    """Map Hoshino menu star ratings (1-5) to 0-100 scale."""
    if "カフェイン" in name:
        return {"acidity": 45, "body": 48, "bitterness": 40, "sweetness": 55}
    if "彦星" in name:
        return {"acidity": 35, "body": 72, "bitterness": 75, "sweetness": 45}
    if "織姫" in name:
        return {"acidity": 78, "body": 42, "bitterness": 28, "sweetness": 62}
    if "アイス" in name:
        return {"acidity": 40, "body": 68, "bitterness": 70, "sweetness": 48}
    # 星乃ブレンド: 甘5 酸3 苦3 焙煎3
    return {"acidity": 55, "body": 58, "bitterness": 52, "sweetness": 72}


def build_store_bean(defn: dict, online_by_id: dict[str, dict]) -> dict:
    """In-store whole bean (100g ¥500) — not sold online except 星乃 500g pack."""
    name = defn["name"]
    desc = defn["description"]
    scores = score_hoshino_blend(name)
    product_id = defn["product_id"]
    image_url: str | None = None
    image_local: str | None = None

    fallback_pid = defn.get("image_fallback_product_id")
    if fallback_pid and fallback_pid in online_by_id:
        image_url = online_by_id[fallback_pid].get("image_url")
        image_local = online_by_id[fallback_pid].get("image_local")

    return {
        "product_id": product_id,
        "chain_id": "hoshino",
        "name": name,
        "description": desc,
        "roast_level": defn["roast_level"],
        "roast_label_ja": defn["roast_label_ja"],
        "taste_label_ja": infer_taste(name, desc),
        "origin": defn["origin"],
        "flavor_tags": defn["flavor_tags"],
        **scores,
        "caffeine": defn.get("caffeine", "medium"),
        "price_jpy": 500,
        "weight_g": 100,
        "buy_url": "https://hoshinocoffee.com/shop.html",
        "menu_url": "https://hoshinocoffee.com/menu.html",
        "image_url": image_url,
        "image_local": image_local,
        "source": "store_menu",
        "available": True,
        "purchase_channel": "store",
        "online_note": "Whole bean sold in-store at register; 100g units.",
    }


def fetch_drip_pack_image(product_id: str) -> tuple[str | None, str | None]:
    """Fetch og:image from drip-pack listing as proxy for store bean."""
    path = DRIP_IMAGE_PATHS.get(product_id)
    if not path:
        return None, None
    try:
        page = fetch(BASE + path)
        image_url = clean_image_url(decode_og_image(page))
        if not image_url:
            return None, None
        _, local = download_image(image_url, IMAGES_DIR, product_id, delay_s=0.5)
        return image_url, local
    except Exception as exc:
        print(f"  drip image skip {product_id}: {exc}")
        return None, None


def parse_product(page: str, meta: dict) -> dict:
    name = parse_name(page) or ""
    content = table_field(page, "内容量")
    item_name = table_field(page, "品名") or name
    lead = extract_lead_description(page)
    roast_level, roast_label_ja = infer_roast(name, lead, page)
    taste = infer_taste(name, lead)
    scores = score_hoshino_blend(name)
    weight_g = parse_weight_g(name, content)
    price_jpy = parse_price(page)
    image_url = clean_image_url(decode_og_image(page))
    product_id = meta["product_id"]
    buy_url = BASE + meta["path"]
    description = build_description(name, lead, page)

    flavor_tags: list[str] = []
    if "コク" in description or "深み" in description:
        flavor_tags.append("コク")
    if "酸味" in description or "甘味" in description or "甘み" in description:
        if "酸味" in description:
            flavor_tags.append("酸味")
        flavor_tags.append("甘み")
    if "香" in description:
        flavor_tags.append("香ばしさ")
    if "アイス" in name:
        flavor_tags.append("アイス向き")
    if "深炒" in description or roast_level == "dark":
        flavor_tags.append("苦味")
    flavor_tags = list(dict.fromkeys(flavor_tags)) or ["バランス"]

    return {
        "product_id": product_id,
        "fs_product_id": meta["fs_product_id"],
        "chain_id": "hoshino",
        "name": name,
        "description": description,
        "roast_level": roast_level,
        "roast_label_ja": roast_label_ja,
        "taste_label_ja": taste,
        "origin": ["ブレンド"],
        "flavor_tags": flavor_tags,
        **scores,
        "caffeine": "medium",
        "price_jpy": price_jpy,
        "weight_g": weight_g,
        "buy_url": buy_url,
        "image_url": image_url,
        "image_local": f"data/images/hoshino/{product_id}.jpg",
        "source": "scraped",
        "available": True,
        "purchase_channel": "online",
        "seller": table_field(page, "販売者"),
        "item_name_ja": item_name,
        "content_label": content,
    }


def to_seed_entry(raw: dict) -> dict:
    pid = raw["product_id"]
    entry = {
        "id": MVP_SEED_IDS.get(pid, f"hoshino-{pid}"),
        "chain_id": "hoshino",
        "name": raw["name"],
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
        "source": raw.get("source", "scraped"),
        "available": raw["available"],
    }
    if raw.get("image_url"):
        entry["image_url"] = raw["image_url"]
        entry["image_local"] = raw.get("image_local")
        entry["image_cdn_url"] = (
            f"https://assets.coffee.yutok.dev/beans/hoshino/{pid}.jpg"
        )
    return entry


def write_notes(online_count: int, store_count: int = 0) -> None:
    NOTES_PATH.parent.mkdir(parents=True, exist_ok=True)
    NOTES_PATH.write_text(
        """# 星乃珈琲店 (Hoshino Coffee) — Scraping Notes

## Official channels

| Channel | URL | Role |
|---------|-----|------|
| Brand site | https://hoshinocoffee.com/ | Menu, shops (no direct EC) |
| Official EC (beans) | https://anshindo-d.com/c/shop_category/shop_drink/shop_drink_coffee/345 | 日本レストランシステム運営の「厳選食品安心堂」 |
| **Not** this chain | https://hoshino-coffee.shop-pro.jp/ | 別店舗「ほしの珈琲」（神奈川） |

星乃珈琲店チェーン自体は自社ECを持たず、豆のオンライン販売は安心堂のみ。

## Platform

- **FutureShop / itembox.cloud** (`anshindo-d.com`)
- Category slug: `/c/shop_category/shop_drink/shop_drink_coffee/345`
- Product URLs: `/c/shop_category/shop_drink/shop_drink_coffee/345/{product_id}`
- Listing filter: product name contains `珈琲豆` and `(500g)` or `(400g)` — excludes drip packs

## Online whole-bean SKUs (verified {online_count})

1. **34500100** — 星乃ブレンド 500g — ¥2,500 税込
2. **34501100** — アイスブレンド 400g — ¥2,000 税込

店舗レジ豆 {store_count} 品（100g ¥500 税込）: 星乃・彦星・織姫・カフェインレス。オンライン豆は EC 2 品のみ。

## Scrape strategy

```python
# 1. Fetch category page; collect links matching 珈琲豆
# 2. For each product URL, parse:
#    - og:image, og:price (product:price:amount)
#    - h1 title, fs-c-price__value
#    - table: 品名, 内容量, 販売者
#    - lead paragraph (fs-c-productDescription)
# 3. Roast/taste: from page copy (シティロースト / 深炒り)
# 4. Scores: derived from published menu balance (甘/酸/苦/焙煎 ★1-5)
```

## Selectors

| Field | Selector / pattern |
|-------|-------------------|
| Price | `span.fs-c-price__value` or `meta[property="product:price:amount"]` |
| Image | `meta[property="og:image"]` → strip to `?size=l&w=800` |
| Name | `h1` or `span.fs-c-productName__name` |
| Spec table | `th`/`td` pairs (品名, 内容量) |
| FS internal ID | `data-product-id` on `.fs-c-productListItem` |

## Rate limiting

- 1 req/sec between product pages
- User-Agent: `DripLab/1.0 (research)`

## MVP seed

3 entries: 2 online beans + 彦星ブレンド (store-only, `available: false`) for brand trio coverage.

Run: `python scripts/scrape_hoshino_beans.py`
""".replace("{online_count}", str(online_count)).replace(
            "{store_count}", str(store_count)
        ),
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-images", action="store_true")
    args = parser.parse_args()

    scraped_at = datetime.now(JST).strftime("%Y-%m-%dT%H:%M:%S%z")
    beans: list[dict] = []

    for meta in WHOLE_BEAN_PRODUCTS:
        url = BASE + meta["path"]
        print(f"Fetching {url}")
        page = fetch(url)
        time.sleep(RATE_SEC)
        row = parse_product(page, meta)
        if not args.skip_images and row.get("image_url"):
            _, local = download_image(
                row["image_url"],
                IMAGES_DIR,
                row["product_id"],
                delay_s=0.5,
            )
            if local:
                row["image_local"] = local
        beans.append(row)

    online_by_id = {b["product_id"]: b for b in beans}
    store_beans: list[dict] = []
    for defn in STORE_BEAN_DEFS:
        row = build_store_bean(defn, online_by_id)
        if not args.skip_images and not row.get("image_url"):
            img_url, img_local = fetch_drip_pack_image(defn["product_id"])
            if img_url:
                row["image_url"] = img_url
                row["image_local"] = img_local or f"data/images/hoshino/{defn['product_id']}.jpg"
            time.sleep(RATE_SEC)
        store_beans.append(row)

    all_beans = beans + store_beans
    raw_doc = {
        "chain_id": "hoshino",
        "source": CATEGORY,
        "brand_site": "https://hoshinocoffee.com/",
        "seller": "日本レストランシステム株式会社",
        "scraped_at": scraped_at,
        "count": len(all_beans),
        "online_whole_bean_count": len(beans),
        "store_bean_count": len(store_beans),
        "note": (
            "2 whole-bean SKUs on 安心堂 EC; 4 additional blends sold at store register (100g)."
        ),
        "beans": all_beans,
    }

    RAW_PATH.parent.mkdir(parents=True, exist_ok=True)
    RAW_PATH.write_text(
        json.dumps(raw_doc, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Wrote {RAW_PATH} ({len(beans)} online + {len(store_beans)} store = {len(all_beans)} beans)"
    )

    seed_beans = [to_seed_entry(b) for b in all_beans if b["product_id"] in MVP_PRODUCT_IDS]

    seed_doc = {
        "version": "0.1.0",
        "chain_id": "hoshino",
        "scraped_at": scraped_at,
        "source": CATEGORY,
        "beans": seed_beans,
    }
    SEED_PATH.write_text(
        json.dumps(seed_doc, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {SEED_PATH} ({len(seed_beans)} MVP beans)")

    write_notes(len(beans), len(store_beans))


if __name__ == "__main__":
    main()
