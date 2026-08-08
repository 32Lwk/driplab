#!/usr/bin/env python3
"""Scrape Starbucks Japan whole bean products from menu.starbucks.co.jp."""

import json
import re
import sys
import time
import html
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from image_utils import download_image, IMAGES_ROOT

JST = timezone(timedelta(hours=9))
BASE = Path(__file__).resolve().parents[1]
RAW_PATH = BASE / "data/scraped/starbucks/beans_raw.json"
SEED_PATH = BASE / "data/seeds/starbucks.beans.seed.json"
IMAGES_DIR = IMAGES_ROOT / "starbucks"
RATE_LIMIT_S = 0.8

ROAST_MAP = {
    "STARBUCKS_BLONDE_ROAST": ("light", "ブロンド ロースト（軽やかな風味）"),
    "STARBUCKS_MEDIUM_ROAST": ("medium", "ミディアム ロースト（豊かな風味）"),
    "STARBUCKS_DARK_ROAST": ("dark", "ダーク ロースト（力強い風味）"),
    "STARBUCKS_RESERVE": ("medium_dark", "STARBUCKS RESERVE®"),
}

ORIGIN_MAP = {
    "LATIN_AMERICA": "ラテンアメリカ",
    "AFRICA": "アフリカ",
    "ASIA_PACIFIC": "アジア・太平洋",
    "MULTI_REGION": "マルチリージョン",
}

ACIDITY_SCORE = {
    "LOW": 30, "MEDIUM-LOW": 40, "MEDIUM": 50,
    "MEDIUM-HIGH": 65, "HIGH": 80,
}
BODY_SCORE = {
    "LIGHT": 35, "MEDIUM-LIGHT": 45, "MEDIUM": 55,
    "MEDIUM-FULL": 65, "FULL": 75,
}
ROAST_BITTERNESS = {"light": 25, "medium": 45, "medium_dark": 55, "dark": 65}

MVP_MATCH = [
    ("ライトノート ブレンド", "starbucks-light-note-blend-250g"),
    ("パイクプレイス", "starbucks-pike-place-roast-250g"),
    ("ケニア", "starbucks-kenya-250g"),
]


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={
        "Accept-Language": "ja-JP,ja;q=0.9",
        "User-Agent": "DripLab/0.1 (research; +https://github.com/driplab)",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8")


def get_category(categories: list) -> str:
    for c in categories:
        for sub in c.get("categories") or []:
            if sub.get("parent_category_code") == "beans" and sub.get("category_type") == "PRODUCT":
                return sub.get("category_name", "コーヒー豆")
    return "コーヒー豆"


def get_weight(spec_infos: list | None, description: str = "") -> int | None:
    for s in spec_infos or []:
        if s.get("name") == "内容量":
            m = re.search(r"(\d+)\s*g", s.get("value", ""), re.I)
            if m:
                return int(m.group(1))
    weights = [int(m) for m in re.findall(r"(\d+)\s*g", description or "", re.I)]
    if len(weights) > 1:
        return sum(weights)
    if weights:
        return weights[0]
    return None


def slugify(name: str, weight: int | None) -> str:
    s = re.sub(r"[®™]", "", name.lower())
    s = re.sub(r"[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]+", "-", s).strip("-")
    s = s[:60]
    sid = f"starbucks-{s}"
    if weight:
        sid += f"-{weight}g"
    return sid


def sweetness_score(desc: str, roast_level: str) -> int:
    base = {"light": 55, "medium": 50, "medium_dark": 45, "dark": 40}.get(roast_level, 50)
    if re.search(r"甘|キャラメル|チョコ|モルト|蜂蜜|ハチミツ", desc):
        base += 10
    if re.search(r"すっきり|キレ|爽やか", desc):
        base -= 5
    return max(25, min(85, base))


def parse_detail(item_code: str) -> dict:
    page = fetch(f"https://menu.starbucks.co.jp/{item_code}")
    m = re.search(r'data-page="([^"]+)"', page)
    if not m:
        raise ValueError(f"No data-page for {item_code}")
    data = json.loads(html.unescape(m.group(1)))
    return data["props"]["data"]["_source"]


def build_bean(
    item: dict,
    src: dict,
    *,
    image_url: str | None = None,
    image_local: str | None = None,
) -> dict:
    attrs = src.get("attributes") or {}
    roast_key = attrs.get("bean_classification", "")
    roast_level, roast_label = ROAST_MAP.get(roast_key, ("medium", roast_key))

    desc = src.get("description") or ""
    weight = get_weight((src.get("spec_info") or {}).get("spec_infos"), desc)
    category = get_category(src.get("categories") or [])

    origin = []
    if attrs.get("country_code_of_origin"):
        origin.append(ORIGIN_MAP.get(attrs["country_code_of_origin"], attrs["country_code_of_origin"]))
    blend = attrs.get("blend_and_single_origin")
    if blend == "BLEND":
        origin.append("ブレンド")
    elif blend == "SINGLE_ORIGIN":
        origin.append("シングルオリジン")
    if not origin:
        origin = ["ブレンド"]

    flavor_tags = list(attrs.get("compatible_flavors") or [])
    for kw in attrs.get("product_keywords") or []:
        km = re.search(r"（(.+)）", kw)
        if km:
            flavor_tags.append(km.group(1))
    flavor_tags = list(dict.fromkeys(flavor_tags))

    taste_label = src.get("memo") or "・".join(flavor_tags[:2]) or ""

    acidity = ACIDITY_SCORE.get(attrs.get("whole_bean_acidity"), 50)
    body = BODY_SCORE.get(attrs.get("whole_bean_body"), 50)
    bitterness = ROAST_BITTERNESS.get(roast_level, 45)
    sweetness = sweetness_score(desc, roast_level)

    is_decaf = "ディカフェ" in src.get("item_name", "") or attrs.get("grind_and_type") == "WHOLE_BEAN_DECAF"

    content_parts = []
    if roast_label:
        content_parts.append(f"焙煎度: {roast_label}")
    if taste_label:
        content_parts.append(f"味わい: {taste_label}")
    if attrs.get("whole_bean_acidity"):
        content_parts.append(f"酸味: {attrs['whole_bean_acidity']}")
    if attrs.get("whole_bean_body"):
        content_parts.append(f"コク: {attrs['whole_bean_body']}")
    if attrs.get("product_keywords"):
        content_parts.append(f"キーワード: {', '.join(attrs['product_keywords'])}")
    if attrs.get("compatible_flavors"):
        content_parts.append(f"相性のよいフレーバー: {', '.join(attrs['compatible_flavors'])}")
    if attrs.get("bean_processing_content"):
        content_parts.append(f"加工方法: {attrs['bean_processing_content']}")
    if weight:
        content_parts.append(f"内容量: {weight}g")
    content_parts.append(desc)

    return {
        "product_id": item["item_code"],
        "name": src["item_name"],
        "price_jpy": item["price_in_vat"],
        "weight_g": weight,
        "buy_url": f"https://menu.starbucks.co.jp/{item['item_code']}",
        "image_url": image_url or item.get("image_url"),
        "image_local": image_local,
        "og_description": desc,
        "content": "\n".join(content_parts),
        "category": category,
        "roast_level": roast_level,
        "roast_label_ja": roast_label,
        "taste_label_ja": taste_label,
        "flavor_tags": flavor_tags,
        "origin": origin,
        "acidity": acidity,
        "body": body,
        "bitterness": bitterness,
        "sweetness": sweetness,
        "caffeine": "decaf" if is_decaf else "medium",
        "available": True,
    }


def main():
    RAW_PATH.parent.mkdir(parents=True, exist_ok=True)

    list_url = (
        "https://menu.starbucks.co.jp/api/v1/list"
        "?category_code=beans&grind_and_type=WHOLE_BEAN,WHOLE_BEAN_DECAF"
        "&purchase_methods=ONLINE_STORE&limit=100"
    )
    listing = json.loads(fetch(list_url))
    print(f"Found {listing['count']} whole bean products")

    beans = []
    downloaded = 0
    for i, item in enumerate(listing["item"], 1):
        code = item["item_code"]
        print(f"[{i}/{listing['count']}] {code} {item['item_name']}")
        time.sleep(RATE_LIMIT_S)
        src = parse_detail(code)
        img_url, img_local = download_image(
            item.get("image_url"),
            IMAGES_DIR,
            code,
            delay_s=RATE_LIMIT_S,
        )
        if img_local:
            downloaded += 1
        beans.append(build_bean(item, src, image_url=img_url, image_local=img_local))

    with RAW_PATH.open("w", encoding="utf-8") as f:
        json.dump(beans, f, ensure_ascii=False, indent=2)
    print(f"Saved {RAW_PATH} ({len(beans)} items, {downloaded} images)")

    seed_beans = []
    for pattern, seed_id in MVP_MATCH:
        match = next((b for b in beans if pattern in b["name"]), None)
        if match:
            seed_beans.append({
                "id": seed_id,
                "chain_id": "starbucks",
                "name": match["name"],
                "description": match["og_description"],
                "roast_level": match["roast_level"],
                "roast_label_ja": match["roast_label_ja"],
                "taste_label_ja": match["taste_label_ja"],
                "origin": match["origin"],
                "flavor_tags": match["flavor_tags"],
                "acidity": match["acidity"],
                "body": match["body"],
                "bitterness": match["bitterness"],
                "sweetness": match["sweetness"],
                "caffeine": match["caffeine"],
                "price_jpy": match["price_jpy"],
                "weight_g": match["weight_g"],
                "buy_url": match["buy_url"],
                "product_id": match["product_id"],
                "image_url": match.get("image_url"),
                "image_local": match.get("image_local"),
                "source": "scraped",
                "available": match["available"],
            })

    seed = {
        "version": "0.1.0",
        "chain_id": "starbucks",
        "scraped_at": datetime.now(JST).strftime("%Y-%m-%dT%H:%M:%S+09:00"),
        "source": "https://menu.starbucks.co.jp",
        "beans": seed_beans,
    }
    with SEED_PATH.open("w", encoding="utf-8") as f:
        json.dump(seed, f, ensure_ascii=False, indent=2)
    print(f"Saved {SEED_PATH} ({len(seed_beans)} MVP items)")


if __name__ == "__main__":
    main()
