#!/usr/bin/env python3
"""Upload data/images/* to Cloudflare R2 (driplab-assets bucket).

Modes:
  --wrangler   Use `npx wrangler r2 object put` (requires `wrangler login`)
  --boto3      Use S3-compatible API (requires R2 API token env vars)

After upload, patches beans JSON with image_cdn_url and writes manifest.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(ROOT / "scripts"))

from r2_utils import (  # noqa: E402
    CONFIG_PATH,
    guess_content_type,
    image_cdn_url,
    image_local_to_key,
    iter_local_images,
    load_r2_config,
)

JST = timezone(timedelta(hours=9))
SCRAPED_CHAINS = ["doutor", "starbucks", "maruyama", "tullys", "kaldi"]
CATALOG_PATH = ROOT / "data" / "catalog" / "beans.json"
MANIFEST_PATH = ROOT / "data" / "catalog" / "image_manifest.json"


def resolve_npx() -> str:
    """Windows needs npx.cmd; plain 'npx' raises WinError 2 in subprocess."""
    for name in ("npx.cmd", "npx.exe", "npx"):
        path = shutil.which(name)
        if path:
            return path
    return "npx"


def upload_wrangler(bucket: str, key: str, local_path: Path, dry_run: bool) -> None:
    target = f"{bucket}/{key}"
    cmd = [
        resolve_npx(),
        "--yes",
        "wrangler@latest",
        "r2",
        "object",
        "put",
        target,
        "--file",
        str(local_path.resolve()),
        "--content-type",
        guess_content_type(local_path),
        "--remote",
    ]
    if dry_run:
        print(f"  [dry-run] {' '.join(cmd)}")
        return
    subprocess.run(cmd, check=True, cwd=ROOT)


def upload_boto3(
    bucket: str,
    key: str,
    local_path: Path,
    account_id: str,
    access_key: str,
    secret_key: str,
    dry_run: bool,
) -> None:
    if dry_run:
        print(f"  [dry-run] put s3://{bucket}/{key} <- {local_path}")
        return
    try:
        import boto3
    except ImportError as exc:
        raise SystemExit(
            "boto3 required for --boto3 mode. Install: pip install boto3"
        ) from exc

    client = boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
    )
    with local_path.open("rb") as fh:
        client.put_object(
            Bucket=bucket,
            Key=key,
            Body=fh,
            ContentType=guess_content_type(local_path),
            CacheControl="public, max-age=86400",
        )


def patch_json_beans(path: Path, public_base: str, key_prefix: str) -> int:
    if not path.exists():
        return 0
    raw = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(raw, list):
        beans = raw
        wrapper = None
    else:
        beans = raw.get("beans", [])
        wrapper = raw

    updated = 0
    for bean in beans:
        local = bean.get("image_local")
        if not local:
            continue
        url = image_cdn_url(local, public_base, key_prefix)
        if url and bean.get("image_cdn_url") != url:
            bean["image_cdn_url"] = url
            updated += 1

    if wrapper is not None:
        wrapper["beans"] = beans
        path.write_text(json.dumps(wrapper, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        path.write_text(json.dumps(beans, ensure_ascii=False, indent=2), encoding="utf-8")
    return updated


def patch_all_cdn_urls(public_base: str, key_prefix: str) -> int:
    total = 0
    for chain in SCRAPED_CHAINS:
        total += patch_json_beans(
            ROOT / "data" / "scraped" / chain / "beans_raw.json",
            public_base,
            key_prefix,
        )
    seeds = ROOT / "data" / "seeds"
    for seed in seeds.glob("*.beans.seed.json"):
        total += patch_json_beans(seed, public_base, key_prefix)
    total += patch_json_beans(CATALOG_PATH, public_base, key_prefix)
    mvp = ROOT / "data" / "catalog" / "mvp_beans.json"
    total += patch_json_beans(mvp, public_base, key_prefix)
    return total


def main() -> None:
    parser = argparse.ArgumentParser(description="Upload bean images to Cloudflare R2")
    parser.add_argument(
        "--mode",
        choices=("wrangler", "boto3"),
        default="wrangler",
        help="Upload backend (default: wrangler)",
    )
    parser.add_argument("--dry-run", action="store_true", help="Print actions only")
    parser.add_argument("--skip-upload", action="store_true", help="Only patch image_cdn_url")
    parser.add_argument("--bucket", help="Override bucket name")
    parser.add_argument("--public-base", help="Override public CDN base URL")
    args = parser.parse_args()

    cfg = load_r2_config()
    bucket = args.bucket or cfg.get("bucket") or "driplab-assets"
    key_prefix = cfg.get("key_prefix", "beans")
    public_base = args.public_base or cfg.get("public_base_url", "")

    images = iter_local_images()
    print(f"Found {len(images)} local images under data/images/")

    uploaded = 0
    failed = 0
    manifest_entries: list[dict] = []

    if not args.skip_upload:
        account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
        access_key = os.environ.get("R2_ACCESS_KEY_ID", "").strip()
        secret_key = os.environ.get("R2_SECRET_ACCESS_KEY", "").strip()

        for local_path, image_local in images:
            key = image_local_to_key(image_local, key_prefix)
            if not key:
                print(f"  ! skip (bad path): {image_local}")
                failed += 1
                continue
            try:
                if args.mode == "wrangler":
                    upload_wrangler(bucket, key, local_path, args.dry_run)
                else:
                    if not all([account_id, access_key, secret_key]):
                        raise SystemExit(
                            "Set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY"
                        )
                    upload_boto3(
                        bucket, key, local_path, account_id, access_key, secret_key, args.dry_run
                    )
                uploaded += 1
                manifest_entries.append(
                    {
                        "image_local": image_local,
                        "r2_key": key,
                        "image_cdn_url": image_cdn_url(image_local, public_base, key_prefix),
                        "size_bytes": local_path.stat().st_size,
                    }
                )
                print(f"  + {key}")
            except subprocess.CalledProcessError as exc:
                failed += 1
                print(f"  ! failed {key}: exit {exc.returncode}")
            except Exception as exc:
                failed += 1
                print(f"  ! failed {key}: {exc}")

    if public_base and not args.dry_run:
        patched = patch_all_cdn_urls(public_base, key_prefix)
        print(f"Patched image_cdn_url on {patched} bean records")

        manifest = {
            "generated_at": datetime.now(JST).isoformat(),
            "bucket": bucket,
            "public_base_url": public_base,
            "uploaded": uploaded,
            "failed": failed,
            "entries": manifest_entries,
        }
        MANIFEST_PATH.write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(f"Manifest -> {MANIFEST_PATH}")

    print(f"Done: uploaded={uploaded}, failed={failed}")
    if failed and not args.dry_run:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
