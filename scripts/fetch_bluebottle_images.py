#!/usr/bin/env python3
"""Download Blue Bottle product images (wrapper around ensure_bean_images)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    cmd = [sys.executable, "-S", str(ROOT / "scripts" / "ensure_bean_images.py"), "--chain", "bluebottle"]
    raise SystemExit(subprocess.call(cmd))


if __name__ == "__main__":
    main()
