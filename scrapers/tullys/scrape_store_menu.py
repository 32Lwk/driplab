#!/usr/bin/env python3
"""Scrape Tully's store-menu whole-bean catalog from tullys.co.jp (shop purchase)."""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone, timedelta
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.image_utils import download_image, extract_og_image  # noqa: E402

USER_AGENT = "DripLab/1.0 (research; +https://github.com/driplab)"
BASE = "https://www.tullys.co.jp"
JST = timezone(timedelta(hours=9))

OUT = ROOT / "data" / "scraped" / "tullys" / "beans_store_menu.json"
IMAGE_DIR = ROOT / "data" / "images" / "tullys"

# Whole-bean pages only (exclude ZIPS single-serve and tea)
INCLUDE_PREFIXES = (
    "/menu/beans/blend/",
    "/menu/beans/varietal/",
)

SLIDER_MAP = {
    "すっきり感": "acidity_hint",
    "ボディ": "body_hint",
}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def strip_tags(html: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", html, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return unescape(re.sub(r"\s+", " ", text)).strip()


def list_bean_pages() -> list[str]:
    html = fetch(f"{BASE}/menu/beans/")
    paths = sorted(set(re.findall(r'href="(/menu/beans/[^"]+\.html)"', html)))
    return [p for p in paths if p.startswith(INCLUDE_PREFIXES)]


def parse_detail(path: str, html: str) -> dict:
    url = BASE + path

    og_title_m = re.search(r'property="og:title"\s+content="([^"]+)"', html)
    if og_title_m:
        name = og_title_m.group(1).split("|")[0].strip()
    else:
        title_m = re.search(r"<title>([^<]+)</title>", html)
        name = title_m.group(1).split("|")[0].strip() if title_m else path.split("/")[-1]

    og_desc_m = re.search(r'property="og:description"\s+content="([^"]+)"', html)
    desc = og_desc_m.group(1).strip() if og_desc_m else ""

    if not desc:
        body_m = re.search(r"<h1[^>]*>.*?</h1>(.*?)(?:<h[23]|<ul)", html, re.S)
        if body_m:
            paras = re.findall(r"<p[^>]*>(.*?)</p>", body_m.group(1), re.S)
            for p in paras:
                t = strip_tags(p)
                if t and "画像はイメージ" not in t and "100g" not in t:
                    desc = t
                    break

    origin: list[str] = []
    price_jpy: int | None = None
    weight_g: int | None = None
    for li in re.findall(r"<li[^>]*>(.*?)</li>", html, re.S):
        t = strip_tags(li)
        if t.startswith("原産地"):
            raw = re.sub(r"^原産地\s*", "", t)
            origin = [x.strip() for x in re.split(r"[、,/]", raw) if x.strip()]
        wm = re.search(r"(\d+)\s*g\s*￥\s*([0-9,]+)", t)
        if wm:
            weight_g = int(wm.group(1))
            price_jpy = int(wm.group(2).replace(",", ""))

    sliders: dict[str, str] = {}
    for label in SLIDER_MAP:
        if label in html:
            sliders[label] = label

    product_id = re.sub(r"\.html$", "", path.split("/")[-1])
    og_image = extract_og_image(html)
    image_url, image_local = None, None
    if og_image:
        image_url, image_local = download_image(
            og_image, IMAGE_DIR, f"store-{product_id}", delay_s=0.5
        )

    flavor_tags: list[str] = []
    if "すっきり" in desc or "酸味" in desc:
        flavor_tags.append("すっきり")
    if "ボディ" in desc or "コク" in desc:
        flavor_tags.append("コク")
    if "まろやか" in desc or "スムース" in desc:
        flavor_tags.append("まろやか")
    if "バランス" in desc:
        flavor_tags.append("バランス")

    return {
        "product_id": f"store-{product_id}",
        "name": name,
        "description": desc or name,
        "price_jpy": price_jpy,
        "weight_g": weight_g or 200,
        "origin_countries": origin,
        "flavor_tags": flavor_tags,
        "tasting_words_en": [],
        "buy_url": url,
        "menu_url": url,
        "purchase_channel": "store",
        "source": "https://www.tullys.co.jp/menu/beans/",
        "image_url": image_url,
        "image_local": image_local,
        "store_sliders": sliders,
    }


def main() -> None:
    paths = list_bean_pages()
    print(f"Store menu whole-bean pages: {len(paths)}")

    beans: list[dict] = []
    for i, path in enumerate(paths):
        if i > 0:
            time.sleep(0.8)
        html = fetch(BASE + path)
        item = parse_detail(path, html)
        beans.append(item)
        print(f"  + {item['name']}")

    payload = {
        "chain_id": "tullys",
        "scraped_at": datetime.now(JST).strftime("%Y-%m-%dT%H:%M:%S+09:00"),
        "source": "https://www.tullys.co.jp/menu/beans/",
        "source_note": "Store retail catalog; many SKUs not sold as whole bean on Ito En EC",
        "count": len(beans),
        "beans": beans,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} ({len(beans)} items)")


if __name__ == "__main__":
    main()
