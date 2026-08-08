#!/usr/bin/env python3
"""Scrape Tully's Coffee whole-bean products from Ito En EC, store menu, and Rakuten."""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone, timedelta
from html import unescape
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
from image_utils import IMAGES_ROOT, download_image, extract_og_image

USER_AGENT = "DripLab/1.0 (research; +https://github.com/driplab)"
ITOEN_BASE = "https://shop.itoen.jp"
TULLYS_BASE = "https://www.tullys.co.jp"
RAKUTEN_SHOP = "https://item.rakuten.co.jp/tullyscoffee-official"
JST = timezone(timedelta(hours=9))
RATE_SEC = 1.0

ROOT = Path(__file__).resolve().parents[2]
RAW_OUT = ROOT / "data" / "scraped" / "tullys" / "beans_raw.json"
SEED_OUT = ROOT / "data" / "seeds" / "tullys.beans.seed.json"
IMAGES_DIR = IMAGES_ROOT / "tullys"

CATEGORY_PATHS = [
    "/shop/tullyscoffee/c/ctc01/",
    "/shop/tullyscoffee/c/ctc0102/",
    "/shop/tullyscoffee/c/ctc0103/",
    "/shop/tullyscoffee/c/ctc010202/",
    "/shop/tullyscoffee/c/cTC010203/",
    "/shop/tullyscoffee/c/cTC0106/",
    "/shop/tullyscoffee/c/ctc01_p2/",
    "/shop/tullyscoffee/c/ctc01_p3/",
    "/shop/tullyscoffee/c/ctc01_snd/",
    "/shop/tullyscoffee/c/ctc01_ssp/",
    "/shop/tullyscoffee/c/ctc01_sspd/",
]

RAKUTEN_CATEGORY_PATHS = [
    "/c/0000000003/",
    "/c/0000000012/",
]

TASTING_WORD_MAP = {
    "balanced": "バランス",
    "smooth": "まろやか",
    "bright": "明るい",
    "caramel": "カラメル",
    "complex": "複雑",
    "sweet": "甘み",
    "fruity": "フルーティ",
    "floral": "フローラル",
    "nutty": "ナッツ",
    "chocolate": "チョコ",
    "citrus": "柑橘",
    "berry": "ベリー",
    "spicy": "スパイス",
    "rich": "コク",
    "clean": "すっきり",
    "soft": "やわらか",
}

DESC_KEYWORD_TAGS = [
    (r"すっきり|キレ|爽やか|クリーン", "すっきり"),
    (r"まろやか|スムース|滑らか|マイルド", "まろやか"),
    (r"甘み|甘い|スイート|はちみつ|蜂蜜", "甘み"),
    (r"カラメル|キャラメル|糖質", "カラメル"),
    (r"チョコ|ココア|ビター", "チョコ"),
    (r"ナッツ|アーモンド|ヘーゼル", "ナッツ"),
    (r"柑橘|レモン|オレンジ|フルーティ", "フルーティ"),
    (r"フローラル|花|ジャスミン", "フローラル"),
    (r"スパイス|シナモン|クローブ", "スパイス"),
    (r"コク|ボディ|力強|深い", "コク"),
    (r"酸味|明るい|ブライト", "明るい"),
    (r"複雑|レイヤ|奥行", "複雑"),
    (r"エスプレッソ|クレマ|濃厚", "エスプレッソ"),
    (r"深煎|ダーク|ビター", "深煎り"),
]


def fetch(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept-Language": "ja-JP,ja;q=0.9"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def strip_tags(html: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", html, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return unescape(re.sub(r"\s+", " ", text)).strip()


def clean_name(name: str) -> str:
    name = re.sub(r":\s*タリーズ\s*$", "", name).strip()
    name = re.sub(r"\s+", " ", name)
    return name


def normalize_key(name: str) -> str:
    s = clean_name(name)
    s = re.sub(r"【[^】]*】", "", s)
    s = re.sub(r"タリーズ\s*", "", s)
    s = re.sub(r"限定パッケージ", "", s)
    s = re.sub(r"\s*200g.*", "", s, flags=re.I)
    s = re.sub(r"\s*150g.*", "", s, flags=re.I)
    s = re.sub(r"（豆）|\(豆\)|\s*豆\s*$", "", s)
    s = re.sub(r"\s+", "", s)
    return s.lower()


def slugify(text: str) -> str:
    s = re.sub(r"[^\w\-]+", "-", text.lower(), flags=re.UNICODE)
    return re.sub(r"-+", "-", s).strip("-")[:60] or "item"


def parse_spec_table(html: str) -> dict[str, str]:
    spec: dict[str, str] = {}
    for table_m in re.finditer(r"<table[^>]*>(.*?)</table>", html, re.S):
        rows = re.findall(r"<tr[^>]*>(.*?)</tr>", table_m.group(1), re.S)
        for row in rows:
            cells = re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", row, re.S)
            if len(cells) >= 2:
                key = strip_tags(cells[0])
                val = strip_tags(cells[1])
                if key:
                    spec[key] = val
    return spec


def parse_price(html: str) -> int | None:
    for pat in [
        r'class="[^"]*block-goods-price[^"]*"[^>]*>.*?([0-9,]+)\s*円',
        r'class="[^"]*goods_price[^"]*"[^>]*>.*?([0-9,]+)\s*円',
        r'"price"\s*:\s*"?([0-9,]+)"?',
    ]:
        m = re.search(pat, html, re.S)
        if m:
            return int(m.group(1).replace(",", ""))
    prices = [int(x.replace(",", "")) for x in re.findall(r"([0-9,]+)\s*円", html)]
    return prices[0] if prices else None


def parse_weight(name: str, spec: dict[str, str]) -> int | None:
    for src in (spec.get("内容量", ""), name):
        m = re.search(r"(\d+)\s*g", src, re.I)
        if m:
            return int(m.group(1))
    return None


def parse_tasting_words(spec: dict[str, str]) -> tuple[list[str], list[str]]:
    raw = spec.get("テイスティングワード", "")
    if not raw:
        return [], []
    en_words = [w.strip() for w in raw.split(",") if w.strip()]
    ja_tags = [TASTING_WORD_MAP.get(w.lower(), w) for w in en_words]
    return en_words, ja_tags


def parse_origin(spec: dict[str, str]) -> list[str]:
    raw = spec.get("生豆生産国名", "")
    if not raw:
        return []
    parts = re.split(r"[、,/]", raw)
    return [p.strip() for p in parts if p.strip()]


def is_whole_bean(spec: dict[str, str], name: str) -> bool:
    product_type = spec.get("名称", "")
    if "（豆）" in product_type or "（豆" in product_type:
        return True
    if re.search(r"レギュラーコーヒー\s*（豆", product_type):
        return True
    if "（粉）" in name or "粉）" in name:
        return False
    if re.search(r"（豆）|\s豆\s*$|200g\s*豆", name):
        return True
    return False


def flavor_from_description(text: str) -> list[str]:
    tags: list[str] = []
    for pat, tag in DESC_KEYWORD_TAGS:
        if re.search(pat, text) and tag not in tags:
            tags.append(tag)
    return tags


def flavor_from_taste_levels(html: str) -> list[str]:
    tags: list[str] = []
    for dt, dd in re.findall(
        r"<dt>([^<]+)</dt>\s*<dd[^>]*class=\"level_(\d+)\"", html, re.S
    ):
        level = int(dd)
        label = dt.strip()
        if label in ("すっきり感", "酸味") and level >= 5:
            tags.append("すっきり")
        if label == "ボディ" and level >= 5:
            tags.append("コク")
        if label == "ボディ" and level <= 4:
            tags.append("ライト")
        if label in ("甘み", "コク") and level >= 5:
            tags.append("甘み")
    return tags


def merge_flavor_tags(*sources: list[str]) -> list[str]:
    seen: set[str] = set()
    merged: list[str] = []
    for src in sources:
        for tag in src:
            if tag and tag not in seen:
                seen.add(tag)
                merged.append(tag)
    return merged


def collect_ec_urls() -> list[str]:
    urls: set[str] = set()
    for path in CATEGORY_PATHS:
        html = fetch(ITOEN_BASE + path)
        for m in re.finditer(r'href="(/shop/tullyscoffee/g/[^"]+)"', html):
            urls.add(ITOEN_BASE + m.group(1))
        time.sleep(RATE_SEC)
    return sorted(urls)


def parse_ec_product(url: str, html: str) -> dict | None:
    title_m = re.search(r'property="og:title"\s+content="([^"]+)"', html)
    name = clean_name(title_m.group(1)) if title_m else ""

    spec = parse_spec_table(html)
    if not is_whole_bean(spec, name):
        return None

    desc_m = re.search(r'class="[^"]*goods_comment[^"]*"[^>]*>(.*?)</div>', html, re.S)
    comment = strip_tags(desc_m.group(1)) if desc_m else ""
    og_desc_m = re.search(r'property="og:description"\s+content="([^"]+)"', html)
    og_desc = og_desc_m.group(1) if og_desc_m else ""
    description = comment or og_desc or name
    if description == name and og_desc and og_desc != name:
        description = og_desc

    tasting_en, flavor_tags = parse_tasting_words(spec)
    origin = parse_origin(spec)
    weight = parse_weight(name, spec)
    price = parse_price(html)

    product_id_m = re.search(r"/shop/tullyscoffee/g/([^/\"?]+)", url)
    product_id = product_id_m.group(1) if product_id_m else ""

    image_url = extract_og_image(html)

    return {
        "product_id": product_id,
        "product_code": "",
        "name": name,
        "price_jpy": price,
        "weight_g": weight,
        "product_type": spec.get("名称", ""),
        "origin_countries": origin,
        "tasting_words_en": tasting_en,
        "flavor_tags": flavor_tags,
        "description": description,
        "buy_url": url,
        "purchase_channel": "ec",
        "source": "https://shop.itoen.jp/tullyscoffee/index.html",
        "image_url": image_url,
        "image_local": None,
        "menu_url": None,
    }


def parse_menu_listing(html: str) -> list[dict]:
    items: list[dict] = []
    for m in re.finditer(
        r'<a href="(/menu/beans/(?:varietal|blend)/[^"]+\.html)">\s*'
        r'<img src="([^"]+)" alt="([^"]+)"',
        html,
        re.S,
    ):
        path, img, alt = m.group(1), m.group(2), unescape(m.group(3))
        items.append(
            {
                "menu_path": path,
                "menu_url": TULLYS_BASE + path,
                "list_name": alt.strip(),
                "list_image_url": TULLYS_BASE + img,
            }
        )
    return items


def parse_menu_detail(path: str, html: str, list_item: dict) -> dict:
    name_m = re.search(
        r'<span class="title-text">([^<]+)</span>', html
    )
    name = clean_name(name_m.group(1)) if name_m else list_item["list_name"]

    desc_m = re.search(
        r'class="common__description"[^>]*>(.*?)</div>', html, re.S
    )
    description = strip_tags(desc_m.group(1)) if desc_m else ""
    if not description:
        meta = re.search(r'name="description"\s+content="([^"]+)"', html)
        description = meta.group(1) if meta else name

    origin: list[str] = []
    origin_m = re.search(
        r"<strong>原産地\s*</strong>\s*<span>([^<]+)</span>", html
    )
    if origin_m:
        origin = [p.strip() for p in re.split(r"[、,]", origin_m.group(1)) if p.strip()]

    price = None
    weight = None
    price_m = re.search(
        r"<strong>(\d+)g\s*</strong>\s*<span>￥([0-9,]+)", html
    )
    if price_m:
        weight = int(price_m.group(1))
        price = int(price_m.group(2).replace(",", ""))

    if weight is None:
        weight = parse_weight(name, {})

    flavor_tags = flavor_from_taste_levels(html)
    flavor_tags = merge_flavor_tags(flavor_tags, flavor_from_description(description))

    img_m = re.search(
        r'class="thumbnail__pic_image"[^>]*>\s*<img src="([^"]+)"', html, re.S
    )
    image_url = TULLYS_BASE + img_m.group(1) if img_m else list_item["list_image_url"]

    slug = path.rsplit("/", 1)[-1].replace(".html", "")
    return {
        "product_id": f"menu-{slug}",
        "product_code": "",
        "name": name,
        "price_jpy": price,
        "weight_g": weight,
        "product_type": "レギュラーコーヒー（豆）",
        "origin_countries": origin,
        "tasting_words_en": [],
        "flavor_tags": flavor_tags,
        "description": description,
        "buy_url": list_item["menu_url"],
        "purchase_channel": "store",
        "source": "https://www.tullys.co.jp/menu/beans/",
        "image_url": image_url,
        "image_local": None,
        "menu_url": list_item["menu_url"],
    }


def collect_rakuten_product_urls() -> list[str]:
    urls: set[str] = set()
    for path in RAKUTEN_CATEGORY_PATHS:
        try:
            html = fetch(RAKUTEN_SHOP + path)
        except urllib.error.HTTPError:
            continue
        for m in re.finditer(
            r'href="(https://item\.rakuten\.co\.jp/tullyscoffee-official/(?:beans|seasonal_beans)[^"]+)"',
            html,
        ):
            url = m.group(1).split("?")[0]
            if not url.endswith("/"):
                url += "/"
            urls.add(url)
        time.sleep(RATE_SEC)
    return sorted(urls)


def parse_rakuten_product(url: str, html: str) -> dict | None:
    og_title = re.search(r'property="og:title"\s+content="([^"]+)"', html)
    title = og_title.group(1) if og_title else ""
    title = re.sub(r"【楽天市場】", "", title)
    title = re.sub(r"：タリーズコーヒー.*$", "", title).strip()

    if not title:
        return None

    is_ground = bool(re.search(r"（粉）|粉\s*[\d]|400g.*粉|コーヒー粉|挽", title))
    is_bean = bool(re.search(r"（豆）|200g.*豆|\s豆\s|コーヒー豆", title))
    is_zips = "ジップス" in title or "ZIPS" in title.upper() or "ドリップ" in title
    is_gift = "ギフト" in title and not is_bean

    if is_ground or is_zips or is_gift or not is_bean:
        return None

    price_m = re.search(r'itemprop="price"\s+content="(\d+)"', html)
    price = int(price_m.group(1)) if price_m else None

    weight = parse_weight(title, {})
    image_url = extract_og_image(html)

    desc_m = re.search(r'class="item_desc[^"]*"[^>]*>(.*?)</', html, re.S)
    description = strip_tags(desc_m.group(1)) if desc_m else title

    product_id = url.rstrip("/").rsplit("/", 1)[-1]
    flavor_tags = flavor_from_description(description + " " + title)

    origin: list[str] = []
    for pat in [
        r"原産国[：:]\s*([^<\n]+)",
        r"生豆生産国[：:]\s*([^<\n]+)",
    ]:
        m = re.search(pat, html)
        if m:
            origin = [p.strip() for p in re.split(r"[、,/]", strip_tags(m.group(1))) if p.strip()]
            break

    return {
        "product_id": f"rakuten-{product_id}",
        "product_code": product_id,
        "name": clean_name(title),
        "price_jpy": price,
        "weight_g": weight,
        "product_type": "レギュラーコーヒー（豆）",
        "origin_countries": origin,
        "tasting_words_en": [],
        "flavor_tags": flavor_tags,
        "description": description,
        "buy_url": url,
        "purchase_channel": "rakuten",
        "source": "https://www.rakuten.co.jp/tullyscoffee-official/",
        "image_url": image_url,
        "image_local": None,
        "menu_url": None,
    }


def merge_records(store: dict, ec: dict | None, rakuten: dict | None) -> dict:
    base = dict(store)
    if ec:
        for key in (
            "product_id", "name", "price_jpy", "weight_g", "product_type",
            "origin_countries", "tasting_words_en", "description", "buy_url",
            "purchase_channel", "source", "image_url",
        ):
            val = ec.get(key)
            if val:
                base[key] = val
        base["flavor_tags"] = merge_flavor_tags(
            ec.get("flavor_tags", []),
            store.get("flavor_tags", []),
            flavor_from_description(ec.get("description", "")),
        )
        base["tasting_words_en"] = ec.get("tasting_words_en", [])
        base["menu_url"] = store.get("menu_url")
    elif rakuten and store.get("purchase_channel") == "store":
        if rakuten.get("buy_url"):
            base["buy_url"] = rakuten["buy_url"]
            base["purchase_channel"] = "rakuten"
        if rakuten.get("price_jpy") and not base.get("price_jpy"):
            base["price_jpy"] = rakuten["price_jpy"]
        if rakuten.get("image_url") and not base.get("image_url"):
            base["image_url"] = rakuten["image_url"]
        base["flavor_tags"] = merge_flavor_tags(
            store.get("flavor_tags", []),
            rakuten.get("flavor_tags", []),
        )
        base["rakuten_product_id"] = rakuten.get("product_code")

    if not base.get("description") or base["description"] == base["name"]:
        for src in (store, ec, rakuten):
            if src and src.get("description") and src["description"] != base["name"]:
                base["description"] = src["description"]
                break

    base["flavor_tags"] = merge_flavor_tags(
        base.get("flavor_tags", []),
        flavor_from_description(base.get("description", "")),
    )

    if not base.get("origin_countries"):
        for src in (ec, store, rakuten):
            if src and src.get("origin_countries"):
                base["origin_countries"] = src["origin_countries"]
                break

    return base


def score_from_flavor(flavor_tags: list[str]) -> dict:
    acidity = body = bitterness = sweetness = 50
    for tag in flavor_tags:
        if tag in ("柑橘", "明るい", "すっきり"):
            acidity += 15
        if tag in ("チョコ", "コク", "複雑", "深煎り", "エスプレッソ"):
            body += 10
            bitterness += 8
        if tag in ("甘み", "カラメル", "まろやか"):
            sweetness += 10
        if tag in ("フローラル", "ベリー", "フルーティ"):
            acidity += 8
            sweetness += 5
        if tag == "ライト":
            body -= 8
    clamp = lambda v: max(20, min(80, v))
    return {
        "acidity": clamp(acidity),
        "body": clamp(body),
        "bitterness": clamp(bitterness),
        "sweetness": clamp(sweetness),
    }


def infer_roast(name: str, flavor_tags: list[str]) -> tuple[str, str]:
    if any(x in name for x in ("フレンチロースト", "エスプレッソ", "ブラック スリー")):
        return "dark", "深煎り"
    if any(x in name for x in ("ピッコロ", "モカジャバ")):
        return "medium_dark", "中深煎り"
    if "深煎" in "".join(flavor_tags):
        return "dark", "深煎り"
    return "medium", ""


def pick_mvp_seed(beans: list[dict]) -> list[str]:
    preferred = [
        "ハウスブレンド",
        "アニバーサリーブレンド",
        "キリマンジャロ",
        "コスタリカ",
        "モカジャバ",
    ]
    picked: list[str] = []
    for key in preferred:
        for b in beans:
            if key in b["name"] and b["product_id"] not in picked:
                picked.append(b["product_id"])
                break
        if len(picked) >= 3:
            break
    if len(picked) < 3:
        for b in beans:
            if b["product_id"] not in picked:
                picked.append(b["product_id"])
            if len(picked) >= 3:
                break
    return picked[:3]


def scrape_all() -> tuple[list[dict], dict]:
    stats = {
        "ec_count": 0,
        "menu_count": 0,
        "rakuten_count": 0,
        "merged_count": 0,
        "images_downloaded": 0,
        "images_failed": 0,
    }

    print("=== Ito En EC ===")
    ec_by_key: dict[str, dict] = {}
    ec_urls = collect_ec_urls()
    print(f"Collected {len(ec_urls)} EC product URLs")
    for i, url in enumerate(ec_urls):
        if i > 0:
            time.sleep(RATE_SEC)
        html = fetch(url)
        item = parse_ec_product(url, html)
        if item:
            key = normalize_key(item["name"])
            ec_by_key[key] = item
            print(f"  + EC: {item['name']}")
    stats["ec_count"] = len(ec_by_key)

    print("\n=== Store menu ===")
    menu_html = fetch(TULLYS_BASE + "/menu/beans/")
    menu_list = parse_menu_listing(menu_html)
    store_by_key: dict[str, dict] = {}
    for i, list_item in enumerate(menu_list):
        if i > 0:
            time.sleep(RATE_SEC)
        detail_html = fetch(list_item["menu_url"])
        item = parse_menu_detail(list_item["menu_path"], detail_html, list_item)
        key = normalize_key(item["name"])
        store_by_key[key] = item
        print(f"  + Menu: {item['name']}")
    stats["menu_count"] = len(store_by_key)

    print("\n=== Rakuten ===")
    rakuten_by_key: dict[str, dict] = {}
    rakuten_urls = collect_rakuten_product_urls()
    print(f"Collected {len(rakuten_urls)} Rakuten product URLs")
    for i, url in enumerate(rakuten_urls):
        if i > 0:
            time.sleep(RATE_SEC)
        try:
            html = fetch(url)
        except urllib.error.HTTPError as e:
            print(f"  - skip {url}: {e.code}")
            continue
        item = parse_rakuten_product(url, html)
        if item:
            key = normalize_key(item["name"])
            rakuten_by_key[key] = item
            print(f"  + Rakuten: {item['name']}")
    stats["rakuten_count"] = len(rakuten_by_key)

    print("\n=== Merge ===")
    all_keys = sorted(set(store_by_key) | set(ec_by_key))
    beans: list[dict] = []
    added_from_ec_only: list[str] = []

    for key in all_keys:
        store = store_by_key.get(key)
        ec = ec_by_key.get(key)
        rakuten = rakuten_by_key.get(key)

        if store:
            merged = merge_records(store, ec, rakuten)
        elif ec:
            merged = dict(ec)
            merged["flavor_tags"] = merge_flavor_tags(
                ec.get("flavor_tags", []),
                flavor_from_description(ec.get("description", "")),
            )
            added_from_ec_only.append(ec["name"])
        else:
            continue

        beans.append(merged)

    beans.sort(key=lambda x: x["name"])
    stats["merged_count"] = len(beans)
    stats["added_from_ec_only"] = added_from_ec_only

    print(f"\n=== Download images ({len(beans)} items) ===")
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    for i, bean in enumerate(beans):
        img_url = bean.get("image_url")
        if not img_url:
            stats["images_failed"] += 1
            continue
        if i > 0:
            time.sleep(0.5)
        _, local = download_image(img_url, IMAGES_DIR, bean["product_id"], delay_s=0)
        bean["image_url"] = img_url
        bean["image_local"] = local
        if local:
            stats["images_downloaded"] += 1
            print(f"  img: {bean['name'][:40]} -> {local}")
        else:
            stats["images_failed"] += 1

    return beans, stats


def main():
    RAW_OUT.parent.mkdir(parents=True, exist_ok=True)

    beans, stats = scrape_all()
    scraped_at = datetime.now(JST).strftime("%Y-%m-%dT%H:%M:%S+09:00")

    raw_payload = {
        "chain_id": "tullys",
        "scraped_at": scraped_at,
        "source": "https://shop.itoen.jp/tullyscoffee/index.html + https://www.tullys.co.jp/menu/beans/ + https://www.rakuten.co.jp/tullyscoffee-official/",
        "source_note": (
            "Merged catalog: Ito En EC (whole bean), Tully's store menu, Rakuten official shop. "
            "Root cause: Ito En EC sells only ~8 whole-bean SKUs; store menu lists 20+ beans."
        ),
        "count": len(beans),
        "stats": stats,
        "beans": beans,
    }
    RAW_OUT.write_text(json.dumps(raw_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nWrote {RAW_OUT} ({len(beans)} items)")

    mvp_ids = pick_mvp_seed(beans)
    seed_beans = []
    for pid in mvp_ids:
        b = next(x for x in beans if x["product_id"] == pid)
        scores = score_from_flavor(b.get("flavor_tags", []))
        roast_level, roast_label = infer_roast(b["name"], b.get("flavor_tags", []))
        seed_beans.append({
            "id": f"tullys-{slugify(b['name'])}",
            "chain_id": "tullys",
            "name": b["name"],
            "description": b["description"][:200],
            "roast_level": roast_level,
            "roast_label_ja": roast_label,
            "taste_label_ja": "・".join(b.get("flavor_tags", [])[:2]),
            "origin": b.get("origin_countries") or ["ブレンド"],
            "flavor_tags": b.get("flavor_tags", []),
            **scores,
            "caffeine": "decaf" if "デカフェ" in b["name"] else "medium",
            "price_jpy": b.get("price_jpy"),
            "weight_g": b.get("weight_g"),
            "buy_url": b["buy_url"],
            "image_url": b.get("image_url"),
            "image_local": b.get("image_local"),
            "product_id": b["product_id"],
            "purchase_channel": b.get("purchase_channel"),
            "source": "scraped",
            "available": True,
        })

    seed_payload = {
        "version": "0.1.0",
        "chain_id": "tullys",
        "scraped_at": scraped_at,
        "source": raw_payload["source"],
        "beans": seed_beans,
    }
    SEED_OUT.write_text(json.dumps(seed_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {SEED_OUT} ({len(seed_beans)} MVP items)")

    print("\n=== Summary ===")
    print(f"Total beans: {len(beans)}")
    print(f"EC: {stats['ec_count']}, Menu: {stats['menu_count']}, Rakuten: {stats['rakuten_count']}")
    print(f"Images: {stats['images_downloaded']} ok, {stats['images_failed']} failed")
    if stats.get("added_from_ec_only"):
        print(f"EC-only (not on menu): {stats['added_from_ec_only']}")


if __name__ == "__main__":
    main()
