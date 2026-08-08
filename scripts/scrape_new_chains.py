#!/usr/bin/env python3
"""Scrape UCC, Hoshino, Ogawa, Sarutahiko, Blue Bottle into DripLab catalog."""
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

JST = timezone(timedelta(hours=9))
RATE_SEC = 1.0

CHAIN_DIRS = {
    "ucc": ROOT / "data" / "scraped" / "ucc",
    "hoshino": ROOT / "data" / "scraped" / "hoshino",
    "ogawa": ROOT / "data" / "scraped" / "ogawa",
    "sarutahiko": ROOT / "data" / "scraped" / "sarutahiko",
    "bluebottle": ROOT / "data" / "scraped" / "bluebottle",
}

MVP_IDS: dict[str, list[str]] = {
    "ucc": ["UCT0600001", "PRE0600007", "UCT0600006"],
    "hoshino": ["34500100", "34500400", "34500500"],
    "ogawa": ["930", "932", "929"],
    "sarutahiko": ["m-d", "m-ec", "m-de-251228"],
    "bluebottle": ["giant-steps", "bela-donovan", "nightlight-decaf"],
}

EXCLUDE_NAME = re.compile(
    r"ギフト|セット|詰め合わせ|ドリップ|インスタント|カプセル|"
    r"定期便|まとめ買い|選べる|バンドル|eギフト|送料込|"
    r"器具|マグ|タンブラー|サーバー|フィルター|"
    r"クッキー|バウム|チルド|リキッド|シロップ|"
    r"プロテイン|Proffee|量り売り|サブスクリプション|"
    r"カップ|ソーサー|ハンドソープ|クッキー",
    re.I,
)


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", errors="replace")


def fetch_json(url: str) -> dict:
    return json.loads(fetch(url))


def slugify(text: str, chain_id: str, suffix: str = "") -> str:
    base = re.sub(r"[^a-z0-9\u3040-\u30ff\u4e00-\u9fff]+", "-", text.lower())
    base = re.sub(r"-+", "-", base).strip("-")[:40] or suffix or "item"
    return f"{chain_id}-{base}"


def strip_html(html: str) -> str:
    text = re.sub(r"<style[^>]*>.*?</style>", " ", html, flags=re.DOTALL | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(re.sub(r"\s+", " ", text)).strip()
    return text


def parse_weight_g(name: str, extra: str = "") -> int | None:
    for src in (name, extra):
        m = re.search(r"(\d+)\s*g", src, re.I)
        if m:
            return int(m.group(1))
    return None


def map_roast_level(text: str) -> str:
    t = text or ""
    if re.search(r"浅煎|ライト|ブロンド|シティ|light", t, re.I):
        return "light"
    if re.search(r"中深|ハイ|medium_dark|medium-dark", t, re.I):
        return "medium_dark"
    if re.search(r"深煎|ダーク|フレンチ|イタリアン|dark|エスプレッソ", t, re.I):
        return "dark"
    if re.search(r"中煎|ミディアム|medium", t, re.I):
        return "medium"
    return "medium"


def extract_roast_label(text: str) -> str | None:
    m = re.search(r"【([^】]*(?:煎|ロースト|Roast)[^】]*)】", text)
    if m:
        return m.group(1)
    for label in ("浅煎り", "中煎り", "中深煎り", "深煎り", "シティロースト", "フレンチロースト"):
        if label in text:
            return label
    return None


def infer_origin(name: str, desc: str) -> list[str]:
    origins = []
    patterns = [
        (r"エチオピア|モカ|イルガ|シダモ|ウラガ|ゲイシャ", "エチオピア"),
        (r"ケニア|キリマンジャロ|タンザニア", "ケニア/タンザニア"),
        (r"ブラジル|ブルボン|サントス", "ブラジル"),
        (r"コロンビア", "コロンビア"),
        (r"グアテマラ", "グアテマラ"),
        (r"コスタリカ", "コスタリカ"),
        (r"ホンジュラス", "ホンジュラス"),
        (r"パナマ", "パナマ"),
        (r"インドネシア|マンデリン|スマトラ", "インドネシア"),
        (r"ハワイ|コナ", "ハワイ"),
        (r"ルワンダ|ウガンダ|ニカラグア", "中央アメリカ/アフリカ"),
    ]
    hay = f"{name} {desc}"
    for pat, label in patterns:
        if re.search(pat, hay) and label not in origins:
            origins.append(label)
    if re.search(r"ブレンド|Blend", hay, re.I) and "ブレンド" not in origins:
        origins.append("ブレンド")
    return origins or ["ブレンド"]


def flavor_tags_from_text(text: str) -> list[str]:
    tags: list[str] = []
    mapping = [
        ("甘", "甘み"),
        ("チョコ|カカオ|ココア", "チョコ"),
        ("ナッツ|アーモンド", "ナッツ"),
        ("ベリー|ブルーベリー|ラズベリー", "ベリー"),
        ("シトラス|レモン|オレンジ", "シトラス"),
        ("フルーティ|フルーツ|トロピカル", "フルーティ"),
        ("花|フローラル|ジャスミン", "フローラル"),
        ("香ば|ロースト|キャラメル|トースト", "香ばしさ"),
        ("コク|ボディ|まろやか", "コク"),
        ("すっきり|キレ|爽やか", "キレ"),
        ("酸味|アシッド", "酸味"),
        ("苦", "苦味"),
        ("スパイス|シナモン", "スパイス"),
        ("ワイン|バレル|ウィスキー", "バレル"),
    ]
    for pat, tag in mapping:
        if re.search(pat, text) and tag not in tags:
            tags.append(tag)
    return tags[:5] or ["バランス"]


def taste_scores(text: str, roast_level: str) -> dict[str, int]:
    acidity = body = bitterness = sweetness = 50
    if re.search(r"酸味|爽やか|シトラス|フルーティ|キレ|すっきり", text):
        acidity += 18
    if re.search(r"苦|ビター|ダーク|深煎|エスプレッソ|フレンチ", text):
        bitterness += 18
        body += 10
    if re.search(r"甘|チョコ|キャラメル|ハチミツ|まろやか", text):
        sweetness += 15
    if re.search(r"コク|ボディ|しっかり|リッチ|芳醇", text):
        body += 15
    if roast_level == "light":
        acidity += 10
        bitterness -= 8
    elif roast_level == "dark":
        bitterness += 12
        body += 8
        acidity -= 10
    elif roast_level == "medium_dark":
        body += 6
        bitterness += 6
    return {
        "acidity": max(0, min(100, acidity)),
        "body": max(0, min(100, body)),
        "bitterness": max(0, min(100, bitterness)),
        "sweetness": max(0, min(100, sweetness)),
    }


def infer_caffeine(name: str, desc: str) -> str:
    hay = f"{name} {desc}"
    if re.search(r"カフェインレス|デカフェ|ディカフェ|Decaf|decaf", hay, re.I):
        return "low"
    if re.search(r"エスプレッソ|深煎|ダーク|フレンチ", hay):
        return "high"
    return "medium"


def download_image(url: str, chain_id: str, product_id: str) -> str | None:
    if not url:
        return None
    dest_dir = ROOT / "data" / "images" / chain_id
    dest_dir.mkdir(parents=True, exist_ok=True)
    safe_id = re.sub(r"[^\w.-]", "_", str(product_id))[:80]
    dest = dest_dir / f"{safe_id}.jpg"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            dest.write_bytes(resp.read())
        return dest.relative_to(ROOT).as_posix()
    except Exception:
        return None


def is_whole_bean_product(title: str, tags: list[str] | None = None) -> bool:
    if EXCLUDE_NAME.search(title):
        return False
    if re.search(r"（粉）|\(粉\)|/粉|粉のみ|挽|粉\s*\d", title):
        return False
    if re.search(r"エアロプレス用|ドリップバッグ|ドリップコーヒー|ドリップパック", title):
        return False
    if re.search(r"（豆）|豆のまま|/豆|レギュラー.*豆|コーヒー豆|珈琲豆", title):
        return True
    if tags and any("コーヒー豆" in t or "whole bean" in t.lower() for t in tags):
        return True
    # Shopify blends often omit 豆 but are whole bean
    if re.search(r"ブレンド|Blend|シングル|Single|オリジン|Origin", title, re.I):
        if not re.search(r"粉|ドリップ|インスタント", title):
            return True
    return False


def build_bean(
    *,
    chain_id: str,
    name: str,
    description: str,
    buy_url: str,
    product_id: str,
    price_jpy: int | None,
    weight_g: int | None,
    image_url: str | None,
    roast_label: str | None = None,
    taste_label: str | None = None,
    origin: list[str] | None = None,
    available: bool = True,
) -> dict:
    roast_level = map_roast_level(f"{name} {roast_label or ''} {description}")
    roast_label_ja = roast_label or extract_roast_label(name) or {
        "light": "浅煎り",
        "medium": "中煎り",
        "medium_dark": "中深煎り",
        "dark": "深煎り",
    }[roast_level]
    desc = re.sub(r"\s+", " ", description).strip()[:500]
    scores = taste_scores(f"{name} {desc}", roast_level)
    origins = origin or infer_origin(name, desc)
    tags = flavor_tags_from_text(f"{name} {desc}")
    taste = taste_label or (tags[0] if tags else "バランス")
    image_local = download_image(image_url, chain_id, product_id) if image_url else None
    return {
        "id": slugify(name, chain_id, product_id),
        "chain_id": chain_id,
        "name": name,
        "description": desc[:220] if desc else name,
        "roast_level": roast_level,
        "roast_label_ja": roast_label_ja,
        "taste_label_ja": taste,
        "origin": origins,
        "flavor_tags": tags,
        **scores,
        "caffeine": infer_caffeine(name, desc),
        "price_jpy": price_jpy,
        "weight_g": weight_g,
        "buy_url": buy_url,
        "product_id": product_id,
        "image_url": image_url,
        "image_local": image_local,
        "source": "scraped",
        "available": available,
    }


# --- Shopify chains ---

SHOPIFY_CONFIG = {
    "bluebottle": {
        "base": "https://store.bluebottlecoffee.jp",
        "collection": "coffee",
        "source": "https://store.bluebottlecoffee.jp/collections/coffee",
    },
    "sarutahiko": {
        "base": "https://sarutahiko.jp",
        "collection": "coffeebeans-groundcoffee",
        "source": "https://sarutahiko.jp/collections/coffeebeans-groundcoffee",
    },
    "ogawa": {
        "base": "https://oc-shop.co.jp",
        "collection": "coffee-beans",
        "source": "https://oc-shop.co.jp/collections/coffee-beans",
    },
}


def shopify_pick_variant(product: dict) -> dict | None:
    variants = product.get("variants") or []
    for v in variants:
        title = (v.get("title") or "").lower()
        if "豆" in title or "whole" in title or "bean" in title:
            return v
    for v in variants:
        if v.get("available"):
            return v
    return variants[0] if variants else None


def scrape_shopify(chain_id: str) -> list[dict]:
    cfg = SHOPIFY_CONFIG[chain_id]
    base = cfg["base"]
    url = f"{base}/collections/{cfg['collection']}/products.json?limit=250"
    data = fetch_json(url)
    beans: list[dict] = []
    for p in data.get("products", []):
        title = p.get("title", "").strip()
        tags = p.get("tags") or []
        if not is_whole_bean_product(title, tags):
            continue
        if p.get("product_type", "").lower() in ("bundle", "gift"):
            continue
        variant = shopify_pick_variant(p)
        if not variant:
            continue
        vtitle = variant.get("title") or ""
        if re.search(r"粉|ground", vtitle, re.I) and "豆" not in vtitle:
            continue
        handle = p["handle"]
        buy_url = f"{base}/products/{handle}"
        price = int(float(variant.get("price", 0) or 0))
        desc = strip_html(p.get("body_html") or "")
        weight = parse_weight_g(title, desc) or parse_weight_g(vtitle)
        images = p.get("images") or []
        image_url = images[0]["src"] if images else None
        roast_label = extract_roast_label(title)
        bean = build_bean(
            chain_id=chain_id,
            name=title,
            description=desc or title,
            buy_url=buy_url,
            product_id=handle,
            price_jpy=price or None,
            weight_g=weight,
            image_url=image_url,
            roast_label=roast_label,
            available=bool(variant.get("available", True)),
        )
        beans.append(bean)
        time.sleep(0.05)
    beans.sort(key=lambda b: b["name"])
    return beans


# --- UCC store.ucc.co.jp ---

UCC_BEAN_URLS = [
    "https://store.ucc.co.jp/category/BRAND_10/UCT0600001.html",
    "https://store.ucc.co.jp/category/BRAND_10/UCT0600006.html",
    "https://store.ucc.co.jp/category/BRAND_10/UCT0600007.html",
    "https://store.ucc.co.jp/category/BRAND_10/UCT0600008.html",
    "https://store.ucc.co.jp/category/BRAND_10/UCT0600009.html",
    "https://store.ucc.co.jp/category/BRAND_10/UCT0600010.html",
    "https://store.ucc.co.jp/category/BRAND_10/UCT0600011.html",
    "https://store.ucc.co.jp/category/BRAND_10/UCT0600000.html",
]


def discover_ucc_bean_urls() -> list[str]:
    """Collect bean product URLs from UCC ONLINE STORE listings."""
    seed_pages = [
        "https://store.ucc.co.jp/",
        "https://store.ucc.co.jp/category/BRAND_10/",
        "https://store.ucc.co.jp/category/COFFEE/",
        "https://store.ucc.co.jp/category/REGULAR_COFFEE/",
    ]
    listing_urls: list[str] = []
    product_urls: list[str] = []

    for page in seed_pages:
        try:
            html = fetch(page)
        except Exception:
            continue
        for m in re.findall(r'href="(https://store\.ucc\.co\.jp/category/[^"]+\.html)"', html):
            if m not in listing_urls:
                listing_urls.append(m)
        for m in re.findall(r'href="(/category/[^"]+\.html)"', html):
            full = f"https://store.ucc.co.jp{m}"
            if full not in listing_urls:
                listing_urls.append(full)
        # Product links with 豆 in anchor text nearby
        for m in re.findall(
            r'href="(https://store\.ucc\.co\.jp/category/[^"]+\.html)"[^>]*>[^<]*（豆）',
            html,
        ):
            if m not in product_urls:
                product_urls.append(m)
        time.sleep(RATE_SEC)

    for page in listing_urls:
        try:
            html = fetch(page)
        except Exception:
            continue
        for m in re.findall(r'href="(https://store\.ucc\.co\.jp/category/[^"]+\.html)"', html):
            if "（豆）" in html[max(0, html.find(m) - 80) : html.find(m) + 120]:
                if m not in product_urls:
                    product_urls.append(m)
            elif re.search(r"UCT\d{6,}", m) and "CS" not in m.split("/")[-1]:
                if m not in product_urls:
                    product_urls.append(m)
        time.sleep(RATE_SEC)

    return sorted(set(product_urls))


def parse_ucc_product(url: str, html: str | None = None) -> dict | None:
    html = html or fetch(url)
    if "レギュラーコーヒー（豆" not in html and "（豆）" not in html:
        if not re.search(r"品名：レギュラーコーヒー（豆", html):
            return None
    title_m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.DOTALL)
    name = unescape(re.sub(r"<[^>]+>", "", title_m.group(1))).strip() if title_m else ""
    if not name:
        og = re.search(r'property="og:title"\s+content="([^"]+)"', html)
        name = og.group(1).split("|")[0].strip() if og else ""
    if not name or EXCLUDE_NAME.search(name):
        return None

    price = None
    pm = re.search(r"(\d{2,5})円\s*円?\(税込\)", html)
    if pm:
        price = int(pm.group(1))
    sku_m = re.search(r"(UCT\d+[A-Z0-9]*)", url)
    product_id = sku_m.group(1) if sku_m else url.rsplit("/", 1)[-1].replace(".html", "")

    desc_parts = []
    for block in re.findall(r"## 商品説明\s*(.*?)(?=##|$)", html, re.DOTALL):
        text = strip_html(block)
        if text:
            desc_parts.append(text)
    lead_m = re.search(r"<h1[^>]*>.*?</h1>\s*<p[^>]*>(.*?)</p>", html, re.DOTALL)
    if lead_m:
        desc_parts.insert(0, strip_html(lead_m.group(1)))
    description = "。".join(dict.fromkeys(desc_parts))[:500]

    origin_m = re.search(r"生豆生産国名[：:]\s*([^・\n<]+)", html)
    origin = [o.strip() for o in re.split(r"[、,]", origin_m.group(1)) if o.strip()] if origin_m else None

    weight_m = re.search(r"内容量[：:]\s*(\d+)g", html)
    weight = int(weight_m.group(1)) if weight_m else parse_weight_g(name)

    image_url = extract_og_image(html)
    if not image_url:
        im = re.search(r'property="og:image"\s+content="([^"]+)"', html)
        image_url = im.group(1) if im else None

    return build_bean(
        chain_id="ucc",
        name=name,
        description=description or name,
        buy_url=url,
        product_id=product_id,
        price_jpy=price,
        weight_g=weight,
        image_url=image_url,
        origin=origin,
    )


def scrape_ucc() -> list[dict]:
    urls = discover_ucc_bean_urls()
    if not urls:
        urls = UCC_BEAN_URLS
    beans: list[dict] = []
    seen: set[str] = set()
    for i, url in enumerate(urls, 1):
        if url in seen:
            continue
        seen.add(url)
        print(f"[UCC {i}/{len(urls)}] {url}")
        try:
            item = parse_ucc_product(url)
            if item:
                beans.append(item)
        except Exception as exc:
            print(f"  ERROR: {exc}")
        time.sleep(RATE_SEC)
    beans.sort(key=lambda b: b["name"])
    return beans


# --- Hoshino via 安心堂 ---

HOSHINO_LISTING = "https://anshindo-d.com/c/shop_category/shop_drink/shop_drink_coffee/345"
HOSHINO_PRODUCTS = [
    ("34500100", "星乃ブレンド", "500g"),
    ("34500400", "アイスブレンド", "400g"),
    ("34500500", "織姫ブレンド", "500g"),
    ("34500600", "彦星ブレンド", "500g"),
    ("34500700", "星降る夜に", "500g"),
    ("34500800", "星降る夜に（カフェインレス）", "500g"),
    ("34500005", "星乃ブレンド", "200g"),
    ("34501000", "星乃ブレンド", "100g"),
    ("34501100", "アイスブレンド", "200g"),
]


def parse_hoshino_product(product_code: str, html: str) -> dict | None:
    name_m = re.search(
        r'class="fs-c-productNameHeading__name">([^<]+)</span>',
        html,
    )
    if not name_m:
        title_m = re.search(r"<title>([^<|]+)", html)
        name = title_m.group(1).strip() if title_m else ""
    else:
        name = unescape(name_m.group(1)).strip()

    if not name:
        return None
    if "ドリップ" in name or "ギフト" in name or "詰" in name:
        return None
    if "珈琲豆" not in name and "コーヒー豆" not in name:
        return None

    price = None
    pm = re.search(r'property="product:price:amount"\s+content="(\d+)"', html)
    if pm:
        price = int(pm.group(1))
    if not price:
        pm = re.search(r'class="fs-c-price__value">([\d,]+)</span>', html)
        if pm:
            price = int(pm.group(1).replace(",", ""))

    desc_parts = re.findall(r'class="shohindettext"><div>(.*?)</div>', html, re.DOTALL)
    description = strip_html(" ".join(desc_parts)) if desc_parts else name

    weight = parse_weight_g(name, html)
    buy_url = f"https://anshindo-d.com/c/shop_category/shop_drink/shop_drink_coffee/345/{product_code}"
    image_url = extract_og_image(html)
    if not image_url:
        im = re.search(r'property="og:image"\s+content="([^"]+)"', html)
        image_url = im.group(1) if im else None

    display_name = (
        name.replace("星乃珈琲・", "")
        .replace("珈琲豆【", "")
        .replace("】", " ")
        .strip()
    )

    roast_label = "シティロースト" if "星乃ブレンド" in name else None
    if "アイス" in name:
        roast_label = "深煎り"
    if "カフェインレス" in name or "デカフェ" in name:
        roast_label = roast_label or "中煎り"

    return build_bean(
        chain_id="hoshino",
        name=display_name,
        description=description,
        buy_url=buy_url,
        product_id=product_code,
        price_jpy=price,
        weight_g=weight,
        image_url=image_url,
        roast_label=roast_label,
        taste_label="バランス" if "星乃ブレンド" in name else None,
    )


def scrape_hoshino() -> list[dict]:
    listing_html = fetch(HOSHINO_LISTING)
    codes = sorted(set(re.findall(r"/345/(\d+)", listing_html)))
    beans: list[dict] = []
    for code in codes:
        url = f"https://anshindo-d.com/c/shop_category/shop_drink/shop_drink_coffee/345/{code}"
        print(f"[Hoshino] {code}")
        try:
            html = fetch(url)
            item = parse_hoshino_product(code, html)
            if item:
                beans.append(item)
        except Exception as exc:
            print(f"  ERROR: {exc}")
        time.sleep(RATE_SEC)
    beans.sort(key=lambda b: b["name"])
    return beans


def write_chain(chain_id: str, beans: list[dict], source: str) -> None:
    out_dir = CHAIN_DIRS[chain_id]
    out_dir.mkdir(parents=True, exist_ok=True)
    now = datetime.now(JST).strftime("%Y-%m-%dT%H:%M:%S+09:00")
    payload = {
        "version": "0.1.0",
        "chain_id": chain_id,
        "scraped_at": now,
        "source": source,
        "count": len(beans),
        "beans": beans,
    }
    raw_path = out_dir / "beans_raw.json"
    raw_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(beans)} -> {raw_path}")

    mvp_keys = MVP_IDS.get(chain_id, [])
    seed_beans = []
    for key in mvp_keys:
        for b in beans:
            if b.get("product_id") == key or b.get("id", "").endswith(key):
                seed_beans.append(b)
                break
    if len(seed_beans) < 3:
        seed_beans = beans[:3]
    seed_payload = {
        "version": "0.1.0",
        "chain_id": chain_id,
        "scraped_at": now,
        "source": source,
        "beans": seed_beans[:3],
    }
    seed_path = ROOT / "data" / "seeds" / f"{chain_id}.beans.seed.json"
    seed_path.write_text(json.dumps(seed_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote seed {len(seed_beans[:3])} -> {seed_path}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--chains",
        nargs="*",
        default=["ucc", "hoshino", "ogawa", "sarutahiko", "bluebottle"],
    )
    args = parser.parse_args()
    for chain_id in args.chains:
        print(f"\n=== {chain_id} ===")
        if chain_id in SHOPIFY_CONFIG:
            beans = scrape_shopify(chain_id)
            source = SHOPIFY_CONFIG[chain_id]["source"]
        elif chain_id == "ucc":
            beans = scrape_ucc()
            source = "https://store.ucc.co.jp/"
        elif chain_id == "hoshino":
            beans = scrape_hoshino()
            source = HOSHINO_LISTING
        else:
            print(f"Unknown chain: {chain_id}")
            continue
        write_chain(chain_id, beans, source)
    print("\nDone.")


if __name__ == "__main__":
    main()
