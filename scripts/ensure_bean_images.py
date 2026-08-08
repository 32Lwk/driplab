#!/usr/bin/env python3
"""Ensure on-disk bean images exist for catalog entries (download or link)."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(ROOT / "scripts"))

from backfill_bean_images import local_image_path  # noqa: E402
from image_utils import download_image  # noqa: E402

VARIANT_SUFFIX = re.compile(r"-(?:100|200)g$", re.I)
IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp")


@dataclass
class EnsureStats:
    ok: int = 0
    linked: int = 0
    downloaded: int = 0
    normalized: int = 0
    skipped: int = 0
    failed: list[str] = field(default_factory=list)


def product_handle(product_id: str) -> str:
    return VARIANT_SUFFIX.sub("", product_id.strip())


def rel_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def expected_local_path(bean: dict) -> Path | None:
    local = bean.get("image_local")
    if local:
        return ROOT / str(local)
    chain_id = bean.get("chain_id")
    product_id = bean.get("product_id")
    if not chain_id or not product_id:
        return None
    existing = local_image_path(str(chain_id), str(product_id))
    if existing:
        return existing
    return ROOT / "data" / "images" / chain_id / f"{product_id}.jpg"


def find_existing_in_chain(chain_dir: Path, stem: str) -> Path | None:
    for ext in IMAGE_EXTS:
        candidate = chain_dir / f"{stem}{ext}"
        if candidate.is_file():
            return candidate
    return None


def copy_image(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)


def ensure_bean_image(bean: dict, *, delay_s: float = 0.0) -> str:
    """Return status: ok | linked | downloaded | normalized | skipped | failed."""
    chain_id = bean.get("chain_id")
    product_id = bean.get("product_id")
    if not chain_id or not product_id:
        return "skipped"

    chain_dir = ROOT / "data" / "images" / chain_id
    pid = str(product_id)
    handle = product_handle(pid)
    target = expected_local_path(bean)
    if target is None:
        return "skipped"

    if target.is_file():
        if handle != pid:
            preferred = find_existing_in_chain(chain_dir, handle)
            if preferred and preferred.is_file():
                bean["image_local"] = rel_path(preferred)
                return "normalized"
        bean["image_local"] = rel_path(target)
        return "ok"

    handle_file = find_existing_in_chain(chain_dir, handle) if handle else None

    # Prefer shared handle image for weight variants (Blue Bottle, etc.).
    if handle_file and handle != pid:
        bean["image_local"] = rel_path(handle_file)
        return "normalized"

    if handle_file and target.name != handle_file.name:
        copy_image(handle_file, target)
        bean["image_local"] = rel_path(target)
        return "linked"

    on_disk = local_image_path(str(chain_id), pid)
    if on_disk and on_disk.is_file():
        if on_disk != target:
            copy_image(on_disk, target)
            bean["image_local"] = rel_path(target)
            return "linked"
        bean["image_local"] = rel_path(on_disk)
        return "ok"

    image_url = bean.get("image_url")
    if not image_url:
        return "failed"

    if delay_s > 0:
        time.sleep(delay_s)

    download_id = handle if handle else pid
    _, local = download_image(str(image_url), chain_dir, download_id)
    if not local:
        return "failed"

    downloaded = ROOT / local
    bean["image_local"] = local

    if handle != pid and downloaded.is_file():
        variant_target = find_existing_in_chain(chain_dir, pid) or target
        if variant_target != downloaded and not variant_target.is_file():
            copy_image(downloaded, variant_target)
            return "downloaded"

    return "downloaded"


def ensure_bean_images(
    beans: list[dict],
    *,
    delay_s: float = 0.3,
) -> EnsureStats:
    stats = EnsureStats()
    for bean in beans:
        status = ensure_bean_image(bean, delay_s=0.0)
        if status == "ok":
            stats.ok += 1
        elif status == "linked":
            stats.linked += 1
        elif status == "downloaded":
            stats.downloaded += 1
            if delay_s > 0:
                time.sleep(delay_s)
        elif status == "normalized":
            stats.normalized += 1
        elif status == "skipped":
            stats.skipped += 1
        else:
            label = bean.get("id") or bean.get("product_id") or "?"
            stats.failed.append(str(label))
    return stats


def validate_bean_images(beans: list[dict]) -> list[str]:
    """Return human-readable issues for beans whose image_local file is missing."""
    issues: list[str] = []
    for bean in beans:
        local = bean.get("image_local")
        if not local:
            if not bean.get("image_url"):
                issues.append(
                    f"{bean.get('id', '?')}: no image_local and no image_url"
                )
            continue
        path = ROOT / str(local)
        if not path.is_file():
            issues.append(f"{bean.get('id', '?')}: missing file {local}")
    return issues


def load_chain_beans(chain_id: str) -> list[dict]:
    path = ROOT / "data" / "scraped" / chain_id / "beans_raw.json"
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, list) else data.get("beans", [])


def save_chain_beans(chain_id: str, beans: list[dict]) -> None:
    path = ROOT / "data" / "scraped" / chain_id / "beans_raw.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        path.write_text(json.dumps(beans, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        data["beans"] = beans
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--chain", help="Only process one chain's beans_raw.json")
    parser.add_argument(
        "--delay",
        type=float,
        default=0.3,
        help="Seconds between downloads (default: 0.3)",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit 1 if any image_local file is still missing after ensure",
    )
    args = parser.parse_args()

    if args.chain:
        beans = load_chain_beans(args.chain)
        if not beans:
            print(f"{args.chain}: no beans_raw.json")
            return
        stats = ensure_bean_images(beans, delay_s=args.delay)
        save_chain_beans(args.chain, beans)
        print(
            f"{args.chain}: ok={stats.ok} linked={stats.linked} "
            f"downloaded={stats.downloaded} normalized={stats.normalized} "
            f"skipped={stats.skipped} failed={len(stats.failed)}"
        )
        if stats.failed:
            print("  failed:", ", ".join(stats.failed))
        issues = validate_bean_images(beans)
    else:
        from merge_catalog import CHAINS, load_raw  # noqa: E402

        all_beans: list[dict] = []
        for chain_id in CHAINS:
            all_beans.extend(load_raw(chain_id))
        stats = ensure_bean_images(all_beans, delay_s=args.delay)
        print(
            f"all chains: ok={stats.ok} linked={stats.linked} "
            f"downloaded={stats.downloaded} normalized={stats.normalized} "
            f"skipped={stats.skipped} failed={len(stats.failed)}"
        )
        if stats.failed:
            print("  failed:", ", ".join(stats.failed[:20]))
            if len(stats.failed) > 20:
                print(f"  ... and {len(stats.failed) - 20} more")
        issues = validate_bean_images(all_beans)

    if issues:
        print(f"validation: {len(issues)} issue(s)")
        for issue in issues[:15]:
            print(f"  - {issue}")
        if len(issues) > 15:
            print(f"  ... and {len(issues) - 15} more")
        if args.strict:
            raise SystemExit(1)


if __name__ == "__main__":
    main()
