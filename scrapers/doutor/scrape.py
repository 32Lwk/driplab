#!/usr/bin/env python3
"""Scrape Doutor whole-bean products from the official online shop."""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

from image_utils import USER_AGENT  # noqa: E402

BASE_URL = "https://onlineshop.doutor.co.jp"
JST = timezone(timedelta(hours=9))

RAW_PATH = ROOT / "data" / "scraped" / "doutor" / "beans_raw.json"
SEED_PATH = ROOT / "data" / "seeds" / "doutor.beans.seed.json"
IMAGES_DIR = ROOT / "data" / "images" / "doutor"

MVP_PRODUCT_IDS = [19, 21, 29]
MVP_SEED_IDS = {
    19: "doutor-mild-blend-500g",
    21: "doutor-golden-mocha-500g",
    29: "doutor-kilimanjaro-200g",
}
MVP_TASTE_LABELS = {
    19: "バランス",
    21: "まろやか",
    29: "すっきり・キレ",
}
MVP_DESCRIPTIONS = {
    19: "ドトールコーヒーショップの定番ブレンド。「香り高く、甘みのあるコーヒー」を追求し、バランスのとれた味わいに仕上げた逸品。",
    21: "モカの豊かな風味を活かした奥行きのある味わい。熟したベリーのような甘酸っぱさとローストナッツのような香ばしさが特長。",
    29: "レモングラスのようなすっきりとした香りに、シトラスを感じる爽やかな酸味、キレのあるのどごし。",
}

ROAST_MAP = {
    "ミディアムロースト": "medium",
    "ハイロースト": "medium_dark",
    "シティロースト": "medium_dark",
    "フレンチロースト": "dark",
}

FLAVOR_KEYWORDS = [
    ("シトラス", "シトラス"),
    ("レモン", "レモングラス"),
    ("ベリー", "ベリー"),
    ("ストロベリー", "ベリー"),
    ("クランベリー", "ベリー"),
    ("チョコ", "チョコ"),
    ("カラメル", "カラメル"),
    ("ナッツ", "ナッツ"),
    ("栗", "香ばしさ"),
    ("オレンジ", "柑橘"),
    ("イチジク", "ドライフルーツ"),
    ("リンゴ", "ドライフルーツ"),
    ("レーズン", "レーズン"),
    ("スパイス", "スパイス"),
    ("甘", "甘み"),
    ("香", "香ばしさ"),
    ("コク", "コク"),
    ("キレ", "キレ"),
]


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def abs_url(src: str) -> str:
    src = src.strip()
    if src.startswith("http://") or src.startswith("https://"):
        return re.sub(r"(?<=://[^/]+)//+", "/", src)
    if src.startswith("//"):
        return "https:" + src
    return BASE_URL.rstrip("/") + src


def parse_product_image(html: str) -> str | None:
    block_m = re.search(
        r'class="DoutorProductDetail__Image"[^>]*>(.*?)(?=</div>\s*</div>\s*<div class="DoutorProductDetail__)',
        html,
        re.S,
    )
    search_html = block_m.group(1) if block_m else html
    img_m = re.search(r'<img\s+src="([^"]+)"', search_html)
    if not img_m:
        return None
    src = img_m.group(1)
    if "save_image" not in src:
        return None
    return abs_url(src)


def parse_weight_g(name: str, og_description: str = "", content: str = "") -> int | None:
    for src in (name, og_description, content):
        m = re.search(r"＜容量＞\s*(\d+)\s*g", src)
        if m:
            return int(m.group(1))
        m = re.search(r"(\d+)\s*g", src, re.I)
        if m:
            return int(m.group(1))
    return None


def parse_roast_label(text: str) -> str:
    m = re.search(r"焙煎度\s*[　\s]*(.+?)\s+味わい", text)
    return m.group(1).strip() if m else ""


def parse_taste_label(text: str) -> str:
    m = re.search(r"味わい\s*[　\s]*(.+?)(?:\s+(?:アイスコーヒー|国内自社|※|＜容量＞)|$)", text)
    raw = m.group(1).strip() if m else ""
    parts: list[str] = []
    for token in re.split(r"[・\s]+", raw):
        if token in ("バランス", "すっきり", "まろやか", "コク", "キレ"):
            parts.append(token)
        elif token.endswith("・コク") or token.endswith("・すっきり"):
            parts.append(token)
            break
        else:
            break
    if parts:
        return "・".join(parts)
    return raw.split()[0] if raw else ""


def map_roast_level(roast_label: str) -> str:
    for key, level in ROAST_MAP.items():
        if key in roast_label:
            return level
    return "medium"


def extract_flavor_tags(text: str) -> list[str]:
    tags: list[str] = []
    for needle, tag in FLAVOR_KEYWORDS:
        if needle in text and tag not in tags:
            tags.append(tag)
    return tags[:5]


def score_from_labels(taste_label: str, flavor_tags: list[str]) -> dict[str, int]:
    acidity = body = bitterness = sweetness = 50
    taste = taste_label.replace("・", " ")
    if "すっきり" in taste or "キレ" in taste:
        acidity += 15
        body -= 10
    if "バランス" in taste:
        pass
    if "まろやか" in taste:
        sweetness += 10
        bitterness -= 5
    if "コク" in taste:
        body += 15
        bitterness += 10
    for tag in flavor_tags:
        if tag in ("シトラス", "柑橘", "レモングラス"):
            acidity += 8
        if tag in ("チョコ", "コク", "カラメル"):
            body += 8
            bitterness += 5
        if tag in ("甘み", "ベリー"):
            sweetness += 8
    clamp = lambda v: max(20, min(80, v))
    return {
        "acidity": clamp(acidity),
        "body": clamp(body),
        "bitterness": clamp(bitterness),
        "sweetness": clamp(sweetness),
    }


def infer_origin(name: str) -> list[str]:
    origins = [
        ("ゴールデンモカ", ["エチオピア（モカ）", "ブレンド"]),
        ("キリマンジャロ", ["タンザニア"]),
        ("モカ", ["エチオピア"]),
        ("マンデリン", ["インドネシア"]),
        ("ケニア", ["ケニア"]),
        ("グアテマラ", ["グアテマラ"]),
        ("ハワイコナ", ["ハワイ"]),
        ("ブルーマウンテン", ["ジャマイカ", "ブレンド"]),
        ("カフェインレス", ["コロンビア"]),
    ]
    for key, value in origins:
        if key in name:
            return value
    return ["ブレンド"]


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
    except (urllib.error.URLError, TimeoutError, OSError):
        return None


def load_existing_beans() -> list[dict]:
    if not RAW_PATH.exists():
        return []
    data = json.loads(RAW_PATH.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return data
    return data.get("beans", [])


def enrich_bean(bean: dict, html: str) -> dict:
    image_url = parse_product_image(html)
    weight_g = parse_weight_g(
        bean.get("name", ""),
        bean.get("og_description", ""),
        bean.get("content", ""),
    )
    image_local = download_product_image(image_url, bean["product_id"]) if image_url else None

    enriched = dict(bean)
    enriched["weight_g"] = weight_g
    enriched["image_url"] = image_url
    enriched["image_local"] = image_local
    return enriched


def build_seed_entry(raw: dict) -> dict:
    text = raw.get("og_description") or raw.get("content") or ""
    roast_label = parse_roast_label(text)
    product_id = raw["product_id"]
    seed_id = MVP_SEED_IDS.get(product_id, f"doutor-{product_id}")
    flavor_tags = extract_flavor_tags(text)
    taste_label = MVP_TASTE_LABELS.get(product_id, parse_taste_label(text).replace("　", "・"))
    scores = score_from_labels(taste_label, flavor_tags)

    desc = MVP_DESCRIPTIONS.get(product_id)
    if not desc:
        desc = re.sub(r"\s+", " ", unescape(text)).strip()
        desc = re.sub(r"^焙煎度.*?味わい\s*[　\s]*[^。]+?\s+", "", desc)
        desc = re.sub(r"＜容量＞.*$", "", desc).strip()
        desc = desc[:200]

    caffeine = "decaf" if "カフェインレス" in raw.get("name", "") else "medium"

    entry = {
        "id": seed_id,
        "chain_id": "doutor",
        "name": raw.get("name", "").replace("\u3000", " ").strip(),
        "description": desc,
        "roast_level": map_roast_level(roast_label),
        "roast_label_ja": roast_label,
        "taste_label_ja": taste_label,
        "origin": infer_origin(raw.get("name", "")),
        "flavor_tags": flavor_tags or ["香ばしさ"],
        **scores,
        "caffeine": caffeine,
        "price_jpy": raw.get("price_jpy"),
        "weight_g": raw.get("weight_g"),
        "buy_url": raw.get("buy_url"),
        "product_id": product_id,
        "image_url": raw.get("image_url"),
        "image_local": raw.get("image_local"),
        "source": "scraped",
        "available": True,
    }
    # Normalize name spacing for known MVP items
    name_fixes = {
        19: "マイルドブレンド コーヒー（豆）500g",
        21: "ゴールデンモカブレンド コーヒー（豆）500g",
        29: "キリマンジャロ（豆）200g",
    }
    if product_id in name_fixes:
        entry["name"] = name_fixes[product_id]
    return entry


def main() -> None:
    beans = load_existing_beans()
    if not beans:
        raise SystemExit(f"No beans found at {RAW_PATH}")

    print(f"Enhancing {len(beans)} Doutor beans...")
    enriched: list[dict] = []

    for i, bean in enumerate(beans):
        if i > 0:
            time.sleep(0.5)
        buy_url = bean.get("buy_url") or f"{BASE_URL}/products/detail/{bean['product_id']}"
        print(f"  [{i + 1}/{len(beans)}] product_id={bean['product_id']} {buy_url}")
        html = fetch(buy_url)
        item = enrich_bean(bean, html)
        enriched.append(item)
        print(
            f"       weight_g={item.get('weight_g')} "
            f"image={'ok' if item.get('image_local') else 'missing'}"
        )
        time.sleep(0.5)

    enriched.sort(key=lambda x: x["product_id"])
    RAW_PATH.parent.mkdir(parents=True, exist_ok=True)
    RAW_PATH.write_text(json.dumps(enriched, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {RAW_PATH} ({len(enriched)} items)")

    scraped_at = datetime.now(JST).strftime("%Y-%m-%dT%H:%M:%S+09:00")
    seed_beans = [
        build_seed_entry(next(b for b in enriched if b["product_id"] == pid))
        for pid in MVP_PRODUCT_IDS
    ]
    seed_payload = {
        "version": "0.1.0",
        "chain_id": "doutor",
        "scraped_at": scraped_at,
        "source": BASE_URL,
        "beans": seed_beans,
    }
    SEED_PATH.write_text(json.dumps(seed_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {SEED_PATH} ({len(seed_beans)} MVP items)")

    images_ok = sum(1 for b in enriched if b.get("image_local"))
    weights_ok = sum(1 for b in enriched if b.get("weight_g"))
    print(f"Images downloaded: {images_ok}/{len(enriched)}")
    print(f"weight_g populated: {weights_ok}/{len(enriched)}")


if __name__ == "__main__":
    main()
