#!/usr/bin/env python3
"""Scrape Saza Coffee whole bean products from saza.coffee official EC."""

from __future__ import annotations

import html
import json
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

JST = timezone(timedelta(hours=9))
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from image_utils import USER_AGENT  # noqa: E402

BASE = "https://saza.coffee"
LIST_URL = f"{BASE}/Form/Product/ProductList.aspx?sort=10&cat=030"
RAW_PATH = ROOT / "data" / "scraped" / "saza" / "beans_raw.json"
SEED_PATH = ROOT / "data" / "seeds" / "saza.beans.seed.json"
RATE_SEC = 1.0

HEADERS = {
    "Accept-Language": "ja-JP,ja;q=0.9",
    "User-Agent": USER_AGENT,
}

MVP_PIDS = [
    "103091",  # 将軍珈琲
    "103001",  # サザスペシャルブレンド
    "103077",  # 将軍ケニア
]

ROAST_FROM_TEXT = [
    (r"浅煎|ライト|ブロンド|シナモン", "light", "浅煎り"),
    (r"中浅|ライトミディアム", "light", "中浅煎り"),
    (r"フルシティ|フル・シティ|full\s*city", "medium_dark", "フルシティロースト"),
    (r"中深|ハイロースト|ハイ\s*ロースト", "medium_dark", "中深煎り"),
    (r"フレンチ|ダーク|深煎|極深|イタリアン", "dark", "深煎り"),
    (r"シティ|中煎|ミディアム|マイルド", "medium", "中煎り"),
]

EXCLUDE_NAME = re.compile(
    r"セット|飲み比べ|ギフト|お試し|ドリップ|カップオン|生豆|"
    r"粉末|（粉）|\(粉\)|粉\)|×\d+|まとめ|詰め合わせ|アソート"
)

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
    "甘": "甘み",
}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", errors="replace")


def strip_html(text: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", text or "", flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return html.unescape(re.sub(r"\s+", " ", text)).strip()


def discover_pids() -> list[str]:
    found: set[str] = set()
    for page in (1, 2):
        url = f"{LIST_URL}&pno={page}"
        page_html = fetch(url)
        for pid in re.findall(r"pid=(\d+)&amp;cat=030", page_html):
            found.add(pid)
        time.sleep(RATE_SEC)
    return sorted(found)


def spec_field(page: str, label: str) -> str | None:
    patterns = [
        rf"<span>{re.escape(label)}</span>：([^<\n]+)",
        rf"<!--[^>]*<span>{re.escape(label)}</span>：([^<\n]+)",
    ]
    for pat in patterns:
        m = re.search(pat, page)
        if m:
            return html.unescape(m.group(1)).strip()
    return None


def parse_price(page: str) -> int | None:
    m = re.search(
        r'class="productPrice"[^>]*>\s*<span[^>]*>&#165;([\d,]+)</span>\(税込\)',
        page,
    )
    if m:
        return int(m.group(1).replace(",", ""))
    m = re.search(r"&#165;([\d,]+)</span>\(税込\)", page)
    if m:
        return int(m.group(1).replace(",", ""))
    return None


def parse_name(page: str) -> str | None:
    m = re.search(r"<h2>([^<]+)</h2>", page)
    if not m:
        return None
    return html.unescape(re.sub(r"\s+", " ", m.group(1))).strip()


def parse_description(page: str) -> str:
    parts: list[str] = []
    for m in re.finditer(r'class="product-notes__txt"[^>]*>(.*?)</p>', page, re.S):
        text = strip_html(m.group(1))
        if not text or text.startswith("◇のし"):
            continue
        if "注文メモ" in text and len(text) < 80:
            continue
        parts.append(text)
    if parts:
        return " ".join(parts)[:500]
    for m in re.finditer(r'<p class="txt">\s*(.*?)\s*</p>', page, re.S):
        text = strip_html(m.group(1))
        if text and len(text) > 20:
            return text[:500]
    return ""


def parse_weight(name: str, page: str) -> int | None:
    for src in (spec_field(page, "内容量") or "", name):
        m = re.search(r"(\d+)\s*g", src, re.I)
        if m:
            return int(m.group(1))
    return None


def infer_roast(name: str, desc: str, roast_label: str | None) -> tuple[str, str]:
    blob = f"{name} {desc} {roast_label or ''}"
    for pattern, level, label in ROAST_FROM_TEXT:
        if re.search(pattern, blob, re.I):
            return level, roast_label or label
    if roast_label:
        return "medium", roast_label
    return "medium", "中煎り"


def parse_origin(raw: str | None, name: str) -> list[str]:
    if not raw:
        if "ブレンド" in name:
            return ["ブレンド"]
        return ["ブレンド"]
    raw = strip_html(raw)
    if "ブレンド" in raw and "・" not in raw and "、" not in raw:
        return ["ブレンド"]
    parts = re.split(r"[・、,/]", raw)
    origins = [p.strip() for p in parts if p.strip()]
    if "ブレンド" in name and "ブレンド" not in origins:
        origins.append("ブレンド")
    return origins or ["ブレンド"]


def flavor_tags(desc: str, name: str, origin: list[str]) -> list[str]:
    blob = f"{desc} {name} {' '.join(origin)}"
    tags: list[str] = []
    mapping = [
        (r"チョコ|カカオ", "チョコレート"),
        (r"ナッツ|アーモンド|クルミ", "ナッツ"),
        (r"ベリー|ブルーベリー", "ベリー"),
        (r"柑橘|オレンジ|レモン|グレープフルーツ|シトラス", "シトラス"),
        (r"カラメル|黒糖|蜂蜜|甘|ミルクチョコ", "甘み"),
        (r"スパイス|バニラ|シナモン|ワイン", "スパイス"),
        (r"フルーティ|アプリコット|ドライフルーツ|モカ", "フルーティ"),
        (r"香ば|芳醇|香り|ベルベット", "香ばしさ"),
        (r"コク|深み|リッチ|濃厚", "コク"),
        (r"酸味|爽やか|すっきり|キレ", "酸味"),
        (r"花|フローラル|ジャスミン", "フローラル"),
    ]
    for pat, tag in mapping:
        if re.search(pat, blob, re.I) and tag not in tags:
            tags.append(tag)
    return tags[:6]


def infer_taste(desc: str, name: str, flavor: list[str]) -> str:
    blob = f"{desc} {name}"
    for key, label in TASTE_HINTS.items():
        if key in blob:
            return label
    if flavor:
        return "・".join(flavor[:2])
    return "バランス"


def score_fields(
    roast_level: str,
    desc: str,
    name: str,
    *,
    is_decaf: bool,
) -> dict:
    blob = f"{desc} {name}"
    acidity = {"light": 70, "medium": 50, "medium_dark": 42, "dark": 32}.get(
        roast_level, 50
    )
    body = {"light": 38, "medium": 52, "medium_dark": 62, "dark": 72}.get(
        roast_level, 52
    )
    bitterness = {"light": 28, "medium": 44, "medium_dark": 56, "dark": 68}.get(
        roast_level, 45
    )
    sweetness = {"light": 54, "medium": 50, "medium_dark": 48, "dark": 44}.get(
        roast_level, 50
    )

    if re.search(r"酸味|爽やか|フルーティ|柑橘|蜂蜜|モカ|ベリー", blob):
        acidity = min(92, acidity + 12)
        sweetness = min(88, sweetness + 8)
    if re.search(r"苦|深煎|フレンチ|濃厚|マンデリン", blob):
        bitterness = min(92, bitterness + 12)
        body = min(88, body + 8)
    if re.search(r"コク|リッチ|芳醇|ベルベット|ワイン", blob):
        body = min(90, body + 10)
    if re.search(r"甘|黒糖|チョコ|キャラメル|まろやか", blob):
        sweetness = min(90, sweetness + 10)
    if re.search(r"すっきり|キレ|軽やか", blob):
        body = max(28, body - 8)

    caffeine = "low" if is_decaf else "medium"
    return {
        "acidity": acidity,
        "body": body,
        "bitterness": bitterness,
        "sweetness": sweetness,
        "caffeine": caffeine,
    }


def slugify(name: str, pid: str, weight: int | None) -> str:
    s = name
    s = re.sub(r"\([^)]*豆[^)]*\)", "", s)
    s = re.sub(r"\d+g", "", s)
    s = re.sub(r"[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]+", "-", s).strip("-")
    s = re.sub(r"-+", "-", s)[:40] or pid
    sid = f"saza-{s}"
    if weight and not sid.endswith(f"-{weight}g"):
        sid += f"-{weight}g"
    return sid


def is_whole_bean(name: str) -> tuple[bool, str]:
    if EXCLUDE_NAME.search(name):
        return False, "excluded keyword"
    if "(豆)" not in name and "（豆）" not in name:
        return False, "not whole bean"
    return True, "ok"


def parse_product(pid: str, page: str) -> dict | None:
    name = parse_name(page)
    if not name:
        return None

    ok, reason = is_whole_bean(name)
    if not ok:
        return None

    price = parse_price(page)
    description = parse_description(page)
    roast_label = spec_field(page, "焙煎")
    origin_raw = spec_field(page, "原産国")
    variety = spec_field(page, "品種")
    processing = spec_field(page, "精製方法")
    weight = parse_weight(name, page)

    origin = parse_origin(origin_raw, name)
    roast_level, roast_label_ja = infer_roast(name, description, roast_label)
    flavor = flavor_tags(description, name, origin)
    taste_label_ja = infer_taste(description, name, flavor)
    is_decaf = bool(
        re.search(r"カフェインレス|カフェインフリー|デカフェ|decaf", name + description, re.I)
    )
    scores = score_fields(roast_level, description, name, is_decaf=is_decaf)

    image_path = f"/Contents/ProductImages/0/{pid}_LL.jpg"
    image_url = f"{BASE}{image_path}"
    buy_url = f"{BASE}/Form/Product/ProductDetail.aspx?shop=0&pid={pid}&cat=030"

    available = not bool(re.search(r"売り切れ|在庫切れ|完売|SOLD\s*OUT|販売終了", page))

    return {
        "id": slugify(name, pid, weight),
        "chain_id": "saza",
        "name": name,
        "description": description,
        "roast_level": roast_level,
        "roast_label_ja": roast_label_ja,
        "taste_label_ja": taste_label_ja,
        "origin": origin,
        "flavor_tags": flavor,
        **scores,
        "price_jpy": price,
        "weight_g": weight,
        "buy_url": buy_url,
        "product_id": pid,
        "image_url": image_url,
        "image_local": f"data/images/saza/{pid}.jpg",
        "source": "scraped",
        "available": available,
        "variety": variety,
        "processing": processing,
        "roast": roast_label_ja,
    }


def main() -> None:
    scraped_at = datetime.now(JST).strftime("%Y-%m-%dT%H:%M:%S%z")
    pids = discover_pids()
    print(f"Discovered {len(pids)} product IDs from list pages")

    beans: list[dict] = []
    excluded: list[tuple[str, str]] = []

    for pid in pids:
        url = f"{BASE}/Form/Product/ProductDetail.aspx?shop=0&pid={pid}&cat=030"
        try:
            page = fetch(url)
            time.sleep(RATE_SEC)
        except Exception as exc:
            print(f"ERR fetch {pid}: {exc}", file=sys.stderr)
            continue

        name = parse_name(page) or pid
        item = parse_product(pid, page)
        if item:
            beans.append(item)
            print(f"OK {pid} ¥{item.get('price_jpy')} {item['name'][:50]}")
        else:
            ok, reason = is_whole_bean(name)
            excluded.append((name, reason if not ok else "parse failed"))
            print(f"SKIP {pid} {name[:50]} ({reason})")

    beans.sort(key=lambda b: b.get("name") or "")

    payload = {
        "version": "0.1.0",
        "chain_id": "saza",
        "scraped_at": scraped_at,
        "source": LIST_URL,
        "count": len(beans),
        "beans": beans,
    }
    RAW_PATH.parent.mkdir(parents=True, exist_ok=True)
    RAW_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nSaved {len(beans)} beans -> {RAW_PATH}")

    by_pid = {b["product_id"]: b for b in beans}
    mvp = [by_pid[pid] for pid in MVP_PIDS if pid in by_pid]
    seed = {
        "version": "0.1.0",
        "chain_id": "saza",
        "scraped_at": scraped_at,
        "source": LIST_URL,
        "beans": mvp,
    }
    SEED_PATH.write_text(json.dumps(seed, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved MVP seed ({len(mvp)}) -> {SEED_PATH}")

    if excluded:
        print(f"Excluded/skipped: {len(excluded)}")
        for title, reason in excluded[:10]:
            print(f"  - {title[:60]} ({reason})")


if __name__ == "__main__":
    main()
