#!/usr/bin/env python3
"""Download product images for Doutor store-only beans."""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.request
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from image_utils import USER_AGENT, download_image  # noqa: E402

STORE_PATH = ROOT / "data" / "scraped" / "doutor" / "beans_store_menu.json"
IMAGES_DIR = ROOT / "data" / "images" / "doutor"

PRODUCT_PAGES = {
    "store-2107": "https://www.doutor.co.jp/dcs/products/detail/2107.html",
    "store-209705": "https://www.doutor.co.jp/dcs/products/detail/209705.html",
}


def fetch(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept-Language": "ja-JP,ja;q=0.9"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_product_image(html: str) -> str | None:
    m = re.search(r'property="og:image"\s+content="([^"]+)"', html)
    if m:
        return unescape(m.group(1))
    for pat in (
        r'class="[^"]*product[^"]*"[^>]*>.*?<img[^>]+src="([^"]+)"',
        r'<img[^>]+src="(/dcs/[^"]+\.(?:jpg|png|webp))"',
        r'<img[^>]+src="(https://www\.doutor\.co\.jp/dcs/[^"]+\.(?:jpg|png|webp))"',
    ):
        m = re.search(pat, html, re.I | re.S)
        if m:
            src = unescape(m.group(1))
            if src.startswith("/"):
                return f"https://www.doutor.co.jp{src}"
            return src
    return None


def main() -> None:
    data = json.loads(STORE_PATH.read_text(encoding="utf-8"))
    beans = data.get("beans", [])
    by_id = {b["product_id"]: b for b in beans}

    for product_id, url in PRODUCT_PAGES.items():
        print(f"Fetching {url}")
        html = fetch(url)
        time.sleep(0.5)
        image_url = parse_product_image(html)
        if not image_url:
            print(f"  no image found for {product_id}")
            continue
        _, local = download_image(image_url, IMAGES_DIR, product_id, delay_s=0.3)
        row = by_id.get(product_id)
        if not row:
            continue
        row["image_url"] = image_url
        if local:
            row["image_local"] = local
        print(f"  {product_id} -> {image_url}")

    STORE_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Updated {STORE_PATH}")


if __name__ == "__main__":
    main()
