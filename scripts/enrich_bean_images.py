#!/usr/bin/env python3
"""Backfill image_url/image_local for a chain's beans_raw.json from product pages."""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.image_utils import download_image, extract_og_image  # noqa: E402

import re
import urllib.request

USER_AGENT = "DripLab/1.0 (research; +https://github.com/driplab)"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def product_image_from_html(html: str, chain: str) -> str | None:
    og = extract_og_image(html)
    if og:
        return og
    if chain == "kaldi":
        m = re.search(r'class="[^"]*itemPhoto[^"]*"[^>]*>.*?src="([^"]+)"', html, re.S)
        if m:
            return m.group(1)
    if chain == "maruyama":
        m = re.search(r'class="[^"]*productPhoto[^"]*"[^>]*>.*?src="([^"]+)"', html, re.S)
        if m:
            src = m.group(1)
            if src.startswith("//"):
                return "https:" + src
            return src
    return None


def load_beans(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, list) else data.get("beans", [])


def save_beans(path: Path, beans: list[dict], chain: str) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        path.write_text(json.dumps(beans, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        data["beans"] = beans
        data["count"] = len(beans)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("chain", choices=["maruyama", "kaldi", "doutor", "tullys", "starbucks"])
    parser.add_argument("--delay", type=float, default=0.8)
    args = parser.parse_args()

    raw_path = ROOT / "data" / "scraped" / args.chain / "beans_raw.json"
    image_dir = ROOT / "data" / "images" / args.chain
    beans = load_beans(raw_path)

    updated = 0
    for i, bean in enumerate(beans):
        if bean.get("image_local"):
            continue
        url = bean.get("buy_url")
        pid = str(bean.get("product_id", i))
        if not url:
            continue
        if i > 0:
            time.sleep(args.delay)
        try:
            html = fetch(url)
            img_url = product_image_from_html(html, args.chain)
            if not img_url:
                continue
            if img_url.startswith("/"):
                from urllib.parse import urljoin

                img_url = urljoin(url, img_url)
            _, local = download_image(img_url, image_dir, pid)
            bean["image_url"] = img_url
            if local:
                bean["image_local"] = local
                updated += 1
                print(f"  + {bean.get('name', pid)}")
        except Exception as exc:
            print(f"  ! {pid}: {exc}")

    save_beans(raw_path, beans, args.chain)
    print(f"{args.chain}: {updated} images added -> {raw_path}")


if __name__ == "__main__":
    main()
