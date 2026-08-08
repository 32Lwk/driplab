#!/usr/bin/env python3
"""Switch coffee.yutok.dev DNS to Cloudflare Worker (proxied AAAA 100::)."""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ZONE_NAME = "yutok.dev"
HOSTNAME = "coffee.yutok.dev"
RECORD_NAME = "coffee"
ZONE_ID = "054f6999172b4e0240ff2e8fb2cc6fd1"
WRANGLER_CONFIG = Path(os.environ.get("WRANGLER_CONFIG", Path.home() / "AppData/Roaming/xdg.config/.wrangler/config/default.toml"))


def load_token() -> str:
    token = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
    if token:
        return token
    if not WRANGLER_CONFIG.is_file():
        raise RuntimeError("Set CLOUDFLARE_API_TOKEN (Zone.DNS.Edit) or run wrangler login")
    text = WRANGLER_CONFIG.read_text(encoding="utf-8")
    match = re.search(r'^oauth_token\s*=\s*"([^"]+)"', text, re.MULTILINE)
    if not match:
        raise RuntimeError(f"oauth_token not found in {WRANGLER_CONFIG}")
    return match.group(1)


def api(method: str, url: str, token: str, payload: dict | None = None) -> dict:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {url} -> {exc.code}: {body}") from exc


def main() -> int:
    token = load_token()
    listed = api(
        "GET",
        f"https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/dns_records?name={HOSTNAME}",
        token,
    )
    for rec in listed.get("result") or []:
        print(f"Deleting {rec.get('type')} {rec.get('name')} -> {rec.get('content')}")
        api(
            "DELETE",
            f"https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/dns_records/{rec['id']}",
            token,
        )

    print("Creating proxied AAAA coffee.yutok.dev -> 100::")
    created = api(
        "POST",
        f"https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/dns_records",
        token,
        {
            "type": "AAAA",
            "name": RECORD_NAME,
            "content": "100::",
            "proxied": True,
            "ttl": 1,
            "comment": "DripLab -> Cloudflare Worker proxy",
        },
    )
    if not created.get("success"):
        raise RuntimeError(f"create failed: {created}")
    print(f"Record ID: {created['result']['id']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
