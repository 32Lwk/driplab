#!/usr/bin/env python3
"""Shared helpers for DripLab R2 image storage."""

from __future__ import annotations

import json
import mimetypes
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = Path(__file__).resolve().parent / "r2_config.json"
IMAGES_ROOT = ROOT / "data" / "images"


def load_r2_config() -> dict:
    if not CONFIG_PATH.exists():
        return {}
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def image_local_to_key(image_local: str, key_prefix: str = "beans") -> str | None:
    """data/images/starbucks/x.jpg -> beans/starbucks/x.jpg"""
    if not image_local:
        return None
    prefix = f"data/images/"
    if not image_local.startswith(prefix):
        return None
    rel = image_local[len(prefix) :]
    return f"{key_prefix.strip('/')}/{rel}".replace("\\", "/")


def image_cdn_url(image_local: str, public_base_url: str, key_prefix: str = "beans") -> str | None:
    key = image_local_to_key(image_local, key_prefix)
    if not key or not public_base_url:
        return None
    return f"{public_base_url.rstrip('/')}/{key}"


def guess_content_type(path: Path) -> str:
    ct, _ = mimetypes.guess_type(path.name)
    return ct or "application/octet-stream"


def iter_local_images() -> list[tuple[Path, str]]:
    """Return (local_path, image_local repo-relative path) for every image file."""
    items: list[tuple[Path, str]] = []
    if not IMAGES_ROOT.exists():
        return items
    for path in sorted(IMAGES_ROOT.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT).as_posix()
        items.append((path, rel))
    return items
