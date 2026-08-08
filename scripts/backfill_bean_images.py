#!/usr/bin/env python3
"""Link on-disk bean images and known retailer URLs into scraped/catalog beans."""

from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(ROOT / "scripts"))

from image_utils import USER_AGENT, extract_og_image  # noqa: E402

KALDI_BASE = "https://www.kaldi.co.jp"


def kaldi_product_image_url(product_id: str) -> str | None:
    if not product_id.isdigit():
        return None
    return f"{KALDI_BASE}/ec/img/{product_id[-3:]}/{product_id}_M_1m.jpg"


def local_image_path(chain_id: str, product_id: str) -> Path | None:
    chain_dir = ROOT / "data" / "images" / chain_id
    if not chain_dir.is_dir():
        return None
    safe_id = re.sub(r"[^\w\-]+", "_", product_id.strip())
    for ext in (".jpg", ".jpeg", ".png", ".webp"):
        candidate = chain_dir / f"{safe_id}{ext}"
        if candidate.is_file():
            return candidate
    return None


def fetch_retailer_image_url(buy_url: str) -> str | None:
    req = urllib.request.Request(
        buy_url,
        headers={"User-Agent": USER_AGENT, "Accept-Language": "ja-JP,ja;q=0.9"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    og = extract_og_image(html)
    if og:
        return og
    m = re.search(r'src="(/ec/img/[^"]+\.(?:jpg|png|webp))"', html, re.I)
    if m:
        return f"{KALDI_BASE}{m.group(1)}"
    return None


def link_local_bean_images(beans: list[dict]) -> int:
    """Set image_local (and kaldi image_url) when files already exist under data/images/."""
    updated = 0
    for bean in beans:
        if bean.get("image_local"):
            continue
        chain_id = bean.get("chain_id")
        product_id = bean.get("product_id")
        if not chain_id or not product_id:
            continue
        path = local_image_path(str(chain_id), str(product_id))
        if not path:
            continue
        bean["image_local"] = path.relative_to(ROOT).as_posix()
        if chain_id == "kaldi" and not bean.get("image_url"):
            url = kaldi_product_image_url(str(product_id))
            if url:
                bean["image_url"] = url
            elif bean.get("buy_url"):
                try:
                    bean["image_url"] = fetch_retailer_image_url(str(bean["buy_url"]))
                except OSError:
                    pass
        updated += 1
    return updated


def backfill_raw_chain(chain_id: str) -> int:
    raw_path = ROOT / "data" / "scraped" / chain_id / "beans_raw.json"
    if not raw_path.exists():
        return 0
    data = json.loads(raw_path.read_text(encoding="utf-8"))
    beans = data if isinstance(data, list) else data.get("beans", [])
    updated = link_local_bean_images(beans)
    if isinstance(data, list):
        raw_path.write_text(json.dumps(beans, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        data["beans"] = beans
        raw_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return updated


def main() -> None:
    total = 0
    for chain in ("kaldi", "hoshino"):
        count = backfill_raw_chain(chain)
        print(f"{chain}: linked {count} images")
        total += count
    print(f"total: {total}")


if __name__ == "__main__":
    main()
