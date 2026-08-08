#!/usr/bin/env python3
"""Shared utilities for downloading bean product images."""

from __future__ import annotations

import re
import time
import urllib.error
import urllib.request
from pathlib import Path

USER_AGENT = "DripLab/1.0 (research; +https://github.com/driplab)"
ROOT = Path(__file__).resolve().parents[1]
IMAGES_ROOT = ROOT / "data" / "images"


def guess_ext(content_type: str, url: str) -> str:
    ct = (content_type or "").lower()
    if "png" in ct:
        return ".png"
    if "webp" in ct:
        return ".webp"
    if "gif" in ct:
        return ".gif"
    if "jpeg" in ct or "jpg" in ct:
        return ".jpg"
    path = url.split("?", 1)[0].lower()
    for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        if path.endswith(ext):
            return ext if ext != ".jpeg" else ".jpg"
    return ".jpg"


def sanitize_product_id(product_id: str) -> str:
    safe = re.sub(r"[^\w\-]+", "_", product_id.strip())
    return safe[:120] or "unknown"


def download_image(
    url: str,
    dest_dir: Path,
    product_id: str,
    *,
    delay_s: float = 0.0,
) -> tuple[str | None, str | None]:
    """Download image; return (image_url, image_local relative path from project root)."""
    if not url:
        return None, None
    if delay_s > 0:
        time.sleep(delay_s)

    dest_dir.mkdir(parents=True, exist_ok=True)
    safe_id = sanitize_product_id(product_id)

    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
            ext = guess_ext(resp.headers.get("Content-Type", ""), url)
            dest = dest_dir / f"{safe_id}{ext}"
            dest.write_bytes(data)
            rel = dest.relative_to(ROOT).as_posix()
            return url, rel
    except (urllib.error.URLError, TimeoutError, OSError):
        return url, None


def extract_og_image(html: str) -> str | None:
    for pat in (
        r'property="og:image"\s+content="([^"]+)"',
        r'content="([^"]+)"\s+property="og:image"',
        r'<meta[^>]+name="og:image"[^>]+content="([^"]+)"',
    ):
        m = re.search(pat, html)
        if m:
            return m.group(1)
    return None
