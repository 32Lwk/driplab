#!/usr/bin/env python3
"""Scrape UCC official store whole bean products for DripLab catalog."""

import json
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

JST = timezone(timedelta(hours=9))
BASE = Path(__file__).resolve().parents[1]
RAW_PATH = BASE / "data/scraped/ucc/beans_raw.json"
SEED_PATH = BASE / "data/seeds/ucc.beans.seed.json"
SOURCE = "https://store.ucc.co.jp/category/ITEM_210/"
RATE = 0.5

HEADERS = {
    "Accept-Language": "ja-JP,ja;q=0.9",
    "User-Agent": "DripLab/0.1 (research; +https://github.com/driplab)",
}

MVP_PICKS = [
    "UCT0600000",  # 上島珈琲店ブレンド 250g
    "TAN0600003",  # 珈琲探究 モカブレンド
    "GSP0600001",  # ゴールドスペシャル スペシャルブレンド
]

ROAST_FROM_TEXT = [
    (r"浅煎|ライト|ブロンド|シナモン", "light", "浅煎り"),
    (r"中深|ハイロースト|シティ", "medium_dark", "中深煎り"),
    (r"深煎|フレンチ|ダーク|極深|W cracking Deep|ディープ", "dark", "深煎り"),
    (r"中煎|ミディアム|マイルド", "medium", "中煎り"),
]

TASTE_HINTS = {
    "バランス": "バランス",
    "まろやか": "まろやか",
    "すっきり": "すっきり",
    "コク": "コク",
    "キレ": "キレ",
    "華やか": "華やか",
    "フルーティ": "フルーティ",
    "リッチ": "リッチ",
    "芳醇": "芳醇",
    "優雅": "優雅",
    "マイルド": "マイルド",
}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def discover_urls() -> list[str]:
    found = set()

    xml = fetch("https://store.ucc.co.jp/ext/sitemap.xml")
    for url in re.findall(r"<loc>(https://store\.ucc\.co\.jp/category/[^<]+\.html)</loc>", xml):
        sku = url.rsplit("/", 1)[-1].replace(".html", "")
        if sku.endswith("OL1") or sku.startswith("SET"):
            continue
        if re.search(r"0600|3332500|SAI3301|UMM", sku):
            found.add(url)

    for page in [
        "https://store.ucc.co.jp/category/ITEM_210/?limit=100",
        "https://store.ucc.co.jp/category/BRAND_10/?limit=100",
        "https://store.ucc.co.jp/category/BRAND_12/?limit=100",
        "https://store.ucc.co.jp/category/BRAND_17/?limit=100",
        "https://store.ucc.co.jp/category/BRAND_2/?limit=100",
        "https://store.ucc.co.jp/category/BRAND_33/?limit=100",
        "https://store.ucc.co.jp/category/BRAND_36/?limit=100",
    ]:
        try:
            html = fetch(page)
            time.sleep(RATE)
        except Exception:
            continue
        for m in re.finditer(r'href="(https://store\.ucc\.co\.jp/category/[^"]+\.html)"', html):
            found.add(m.group(1))

    return sorted(found)


def strip_html(text: str) -> str:
    text = re.sub(r"<br\s*/?>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def unescape(text: str) -> str:
    return (
        text.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", '"')
        .replace("&#39;", "'")
    )


def parse_price(html: str, sku: str) -> int | None:
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            data = json.loads(m.group(1))
        except json.JSONDecodeError:
            continue
        if data.get("@type") != "Product":
            continue
        offers = data.get("offers") or {}
        price = offers.get("price")
        if price is not None:
            return int(float(str(price)))
    m = re.search(rf"{re.escape(sku)}\s*\n\s*([\d,]+)円", html)
    if m:
        return int(m.group(1).replace(",", ""))
    for m in re.finditer(r"([\d,]+)円\s*円?\(税込\)\s*\n?\s*獲得", html):
        return int(m.group(1).replace(",", ""))
    return None


def parse_jsonld(html: str) -> dict | None:
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            data = json.loads(m.group(1))
        except json.JSONDecodeError:
            continue
        if data.get("@type") == "Product":
            return data
    return None


def infer_roast(name: str, desc: str, tagline: str) -> tuple[str, str]:
    blob = f"{name} {desc} {tagline}"
    for pattern, level, label in ROAST_FROM_TEXT:
        if re.search(pattern, blob, re.I):
            return level, label
    if re.search(r"ブレンド|スペシャル|定番", blob):
        return "medium", "中煎り"
    return "medium", "中煎り"


def infer_taste(desc: str, tagline: str) -> str:
    blob = f"{desc} {tagline}"
    for key, label in TASTE_HINTS.items():
        if key in blob:
            return label
    if re.search(r"甘|蜂蜜|黒糖|チョコ|ベリー|柑橘", blob):
        return "まろやか"
    if re.search(r"苦|コク|深", blob):
        return "コク"
    return "バランス"


def flavor_tags(desc: str, tagline: str) -> list[str]:
    blob = f"{desc} {tagline}"
    tags = []
    mapping = [
        (r"チョコ|カカオ|cacao", "チョコ"),
        (r"ナッツ|アーモンド|ローストナッツ", "ナッツ"),
        (r"ベリー|ブルーベリー|ラズベリー", "ベリー"),
        (r"柑橘|オレンジ|レモン|グレープフルーツ", "シトラス"),
        (r"カラメル|黒糖|蜂蜜|はちみつ|甘", "甘み"),
        (r"スパイス|バニラ|シナモン", "スパイス"),
        (r"フルーティ|アプリコット|ドライフルーツ", "フルーティ"),
        (r"香ば|芳醇|香り", "香ばしさ"),
        (r"コク|深み|リッチ", "コク"),
        (r"酸味|爽やか|すっきり", "酸味"),
        (r"ワイン|メープル", "熟成感"),
    ]
    for pat, tag in mapping:
        if re.search(pat, blob, re.I) and tag not in tags:
            tags.append(tag)
    return tags[:6]


def score_fields(roast_level: str, desc: str, tagline: str, is_decaf: bool) -> dict:
    blob = f"{desc} {tagline}"
    acidity = {"light": 70, "medium": 50, "medium_dark": 40, "dark": 30}.get(roast_level, 50)
    body = {"light": 40, "medium": 55, "medium_dark": 65, "dark": 75}.get(roast_level, 55)
    bitterness = {"light": 30, "medium": 45, "medium_dark": 58, "dark": 72}.get(roast_level, 50)
    sweetness = {"light": 55, "medium": 52, "medium_dark": 48, "dark": 42}.get(roast_level, 50)

    if re.search(r"酸味|爽やか|フルーティ|柑橘|蜂蜜|甘", blob):
        acidity = min(95, acidity + 15)
        sweetness = min(90, sweetness + 10)
    if re.search(r"苦|深煎|W cracking|ディープ|マンデリン|濃厚", blob):
        bitterness = min(95, bitterness + 15)
        body = min(90, body + 10)
    if re.search(r"コク|リッチ|芳醇|なめらか", blob):
        body = min(90, body + 10)
    if re.search(r"甘|黒糖|チョコ|ミルクチョコ|まろやか", blob):
        sweetness = min(90, sweetness + 12)
    if re.search(r"すっきり|キレ|軽やか", blob):
        body = max(25, body - 10)

    caffeine = "low" if is_decaf else "medium"
    if re.search(r"デカフェ|カフェインレス|Night Owl|Time to Bed", blob, re.I):
        caffeine = "low"

    return {
        "acidity": acidity,
        "body": body,
        "bitterness": bitterness,
        "sweetness": sweetness,
        "caffeine": caffeine,
    }


def slugify(name: str, sku: str, weight: int | None) -> str:
    s = name.lower()
    s = re.sub(r"【[^】]+】", "", s)
    s = re.sub(r"（[^）]*）", "", s)
    s = re.sub(r"＜[^＞]+＞", "", s)
    s = re.sub(r"[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]+", "-", s).strip("-")
    s = re.sub(r"-+", "-", s)[:50]
    sid = f"ucc-{s or sku.lower()}"
    if weight and not sid.endswith(f"-{weight}g"):
        sid += f"-{weight}g"
    return sid


def parse_product(url: str) -> dict | None:
    html = fetch(url)
    sku = url.rsplit("/", 1)[-1].replace(".html", "")

    m = re.search(r"<h1[^>]*>([^<]+)</h1>", html)
    if not m:
        return None
    name = re.sub(r"\s+", " ", m.group(1)).strip()

    if "（豆）" not in name and "豆）" not in name:
        return None
    if re.search(r"セット|×|まとめて|福袋|ケース|アソート|コンプリート|ギフトボックス", name):
        return None

    tagline = ""
    m = re.search(r"<h1[^>]*>[^<]+</h1>\s*<p[^>]*>([^<]+)</p>", html, re.S)
    if m:
        tagline = strip_html(m.group(1))

    image_url = None
    jsonld = parse_jsonld(html)
    if jsonld:
        if not tagline and jsonld.get("description"):
            tagline = strip_html(jsonld["description"]).split("。")[0] + "。"
        if jsonld.get("image"):
            imgs = jsonld["image"]
            if isinstance(imgs, list) and imgs:
                image_url = imgs[0]
            elif isinstance(imgs, str):
                image_url = imgs

    desc_block = ""
    m = re.search(r"## 商品説明\s*(.+?)(?:## 商品情報|## お客様)", html, re.S)
    if m:
        desc_block = strip_html(m.group(1))
    if not desc_block:
        m = re.search(r'class="[^"]*item_description[^"]*"[^>]*>(.*?)</div>', html, re.S | re.I)
        if m:
            desc_block = strip_html(m.group(1))
    if not desc_block and jsonld and jsonld.get("description"):
        desc_block = strip_html(jsonld["description"])

    info_block = ""
    m = re.search(r"## 商品情報\s*(.+?)(?:## お客様|## レビュー|$)", html, re.S)
    if m:
        info_block = strip_html(m.group(1))
    if not info_block:
        m = re.search(r"生豆生産国名[：:]", html)
        if m:
            info_block = strip_html(html[m.start() : m.start() + 800])

    description = " ".join(x for x in [tagline, desc_block] if x).strip()
    if tagline and desc_block.startswith(tagline.rstrip("。")):
        description = desc_block

    weight = None
    wm = re.search(r"内容量[：:]\s*(\d+)g", info_block or html)
    if wm:
        weight = int(wm.group(1))

    origin_raw = ""
    om = re.search(r"生豆生産国名[：:]\s*([^・]+?)(?:・|$)", info_block or html)
    if om:
        origin_raw = om.group(1).strip()

    origin = []
    if origin_raw:
        origin_raw = strip_html(origin_raw)
        for part in re.split(r"[、,/]", origin_raw):
            p = part.strip()
            if p and p != "他":
                origin.append(p)
        if "他" in origin_raw:
            origin.append("他")
    if not origin:
        origin = ["ブレンド"]

    price = parse_price(html, sku)

    if not image_url:
        im = re.search(r'property="og:image"\s+content="([^"]+)"', html)
        if im:
            image_url = im.group(1)

    availability = True
    if jsonld:
        offers = jsonld.get("offers") or {}
        avail = str(offers.get("availability", ""))
        if "OutOfStock" in avail:
            availability = False
    if re.search(r"完売御礼|販売終了", name):
        availability = False

    is_decaf = bool(re.search(r"カフェインレス|デカフェ|decaf|ハーフカフェイン", name + description, re.I))
    roast_level, roast_label_ja = infer_roast(name, description, tagline)
    taste_label_ja = infer_taste(description, tagline)
    scores = score_fields(roast_level, description, tagline, is_decaf)

    return {
        "id": slugify(name, sku, weight),
        "chain_id": "ucc",
        "name": name,
        "description": description,
        "roast_level": roast_level,
        "roast_label_ja": roast_label_ja,
        "taste_label_ja": taste_label_ja,
        "origin": origin,
        "flavor_tags": flavor_tags(description, tagline),
        **scores,
        "price_jpy": price,
        "weight_g": weight,
        "buy_url": url,
        "product_id": sku,
        "image_url": image_url,
        "source": "scraped",
        "available": availability,
    }


def main():
    urls = discover_urls()
    beans = []
    seen = set()
    for url in urls:
        sku = url.rsplit("/", 1)[-1].replace(".html", "")
        if sku in seen:
            continue
        try:
            bean = parse_product(url)
            time.sleep(RATE)
        except Exception as e:
            print(f"ERR {url}: {e}", file=sys.stderr)
            continue
        if bean:
            seen.add(sku)
            beans.append(bean)
            print(f"OK {sku} {bean['price_jpy']} {bean['name'][:50]}")

    beans.sort(key=lambda b: (b.get("name") or ""))

    payload = {
        "version": "0.1.0",
        "chain_id": "ucc",
        "scraped_at": datetime.now(JST).strftime("%Y-%m-%dT%H:%M:%S%z"),
        "source": SOURCE,
        "count": len(beans),
        "beans": beans,
    }
    RAW_PATH.parent.mkdir(parents=True, exist_ok=True)
    RAW_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nSaved {len(beans)} beans -> {RAW_PATH}")

    mvp = [b for b in beans if b["product_id"] in MVP_PICKS]
    mvp.sort(key=lambda b: MVP_PICKS.index(b["product_id"]))
    seed = {
        "version": "0.1.0",
        "chain_id": "ucc",
        "scraped_at": payload["scraped_at"],
        "source": SOURCE,
        "beans": mvp,
    }
    SEED_PATH.write_text(json.dumps(seed, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved MVP seed ({len(mvp)}) -> {SEED_PATH}")


if __name__ == "__main__":
    main()
