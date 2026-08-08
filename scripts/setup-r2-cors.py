#!/usr/bin/env python3
"""Apply CORS policy to driplab-assets R2 bucket via Cloudflare API."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = Path(__file__).resolve().parent / "r2_config.json"
INFRA = Path(__file__).resolve().parent / ".driplab-infra.json"
CORS_FILE = Path(__file__).resolve().parent / "r2_cors.wrangler.json"


def load_account_id() -> str:
    if INFRA.exists():
        data = json.loads(INFRA.read_text(encoding="utf-8"))
        if data.get("cloudflare_account_id"):
            return data["cloudflare_account_id"]
    return os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()


def main() -> None:
    token = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
    if not token:
        print("ERROR: set CLOUDFLARE_API_TOKEN (Account → R2 Edit permission)", file=sys.stderr)
        sys.exit(1)

    account_id = load_account_id()
    if not account_id:
        print("ERROR: set cloudflare_account_id in .driplab-infra.json or CLOUDFLARE_ACCOUNT_ID", file=sys.stderr)
        sys.exit(1)

    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    bucket = cfg.get("bucket", "driplab-assets")
    cors = json.loads(CORS_FILE.read_text(encoding="utf-8"))

    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/buckets/{bucket}/cors"
    body = json.dumps(cors).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        method="PUT",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        err = exc.read().decode("utf-8", errors="replace")
        print(f"HTTP {exc.code}: {err}", file=sys.stderr)
        sys.exit(1)

    if not result.get("success"):
        print(json.dumps(result, indent=2), file=sys.stderr)
        sys.exit(1)

    print(f"CORS applied to {bucket} (account {account_id})")
    print(f"Origins: {cors['rules'][0]['allowed']['origins']}")


if __name__ == "__main__":
    main()
