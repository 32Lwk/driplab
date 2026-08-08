#!/usr/bin/env python3
"""Configure coffee.yutok.dev DNS in Cloudflare.

Modes:
  cloudflare  (default) CNAME -> Cloud Run URL, proxied ON (works immediately)
  google      CNAME -> ghs.googlehosted.com, proxied OFF (Google managed cert)
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

ZONE_NAME = "yutok.dev"
HOSTNAME = "coffee.yutok.dev"
RECORD_NAME = "coffee"
GOOGLE_CNAME = "ghs.googlehosted.com"
DEFAULT_RUN_HOST = "driplab-4jnmo2x4wa-an.a.run.app"


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


def get_zone_id(token: str) -> str:
    zones = api("GET", f"https://api.cloudflare.com/client/v4/zones?name={ZONE_NAME}", token)
    if not zones.get("success") or not zones.get("result"):
        raise RuntimeError(f"zone not found: {zones}")
    return zones["result"][0]["id"]


def list_records(token: str, zone_id: str) -> list[dict]:
    listed = api(
        "GET",
        f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records?name={HOSTNAME}",
        token,
    )
    if not listed.get("success"):
        raise RuntimeError(f"list failed: {listed}")
    return listed.get("result") or []


def delete_record(token: str, zone_id: str, record_id: str) -> None:
    deleted = api(
        "DELETE",
        f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{record_id}",
        token,
    )
    if not deleted.get("success"):
        raise RuntimeError(f"delete failed: {deleted}")


def upsert(token: str, zone_id: str, content: str, proxied: bool, comment: str) -> dict:
    for rec in list_records(token, zone_id):
        if (
            rec.get("type") == "CNAME"
            and rec.get("content") == content
            and rec.get("proxied") is proxied
        ):
            print(f"OK: existing CNAME {HOSTNAME} -> {content} (proxied={proxied})")
            return rec
        print(f"Deleting stale record: {rec.get('type')} {rec.get('name')} -> {rec.get('content')}")
        delete_record(token, zone_id, rec["id"])

    print(f"Creating CNAME {HOSTNAME} -> {content} (proxied={proxied})")
    created = api(
        "POST",
        f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records",
        token,
        {
            "type": "CNAME",
            "name": RECORD_NAME,
            "content": content,
            "proxied": proxied,
            "ttl": 1,
            "comment": comment,
        },
    )
    if not created.get("success"):
        raise RuntimeError(f"create failed: {created}")
    result = created["result"]
    return result[0] if isinstance(result, list) else result


def verify_https() -> bool:
    proc = subprocess.run(
        [
            "curl",
            "-sf",
            f"https://{HOSTNAME}/health",
        ],
        capture_output=True,
        text=True,
    )
    if proc.returncode == 0 and "ok" in proc.stdout:
        print(f"OK https://{HOSTNAME}/health -> {proc.stdout.strip()}")
        return True
    print(f"WARN health check failed: {proc.stderr.strip() or proc.stdout.strip()}")
    return False


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--mode",
        choices=("cloudflare", "google"),
        default="cloudflare",
        help="cloudflare=proxied to run.app (immediate), google=ghs.googlehosted.com (managed cert)",
    )
    parser.add_argument("--run-host", default=os.environ.get("DRIPLAB_RUN_HOST", DEFAULT_RUN_HOST))
    args = parser.parse_args()

    token = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
    if not token:
        print("ERROR: set CLOUDFLARE_API_TOKEN", file=sys.stderr)
        return 1

    zone_id = get_zone_id(token)
    print(f"Zone: {ZONE_NAME} ({zone_id})")

    if args.mode == "google":
        content = GOOGLE_CNAME
        proxied = False
        comment = "DripLab -> Cloud Run custom domain (Google managed cert)"
    else:
        content = args.run_host
        proxied = True
        comment = "DripLab -> Cloud Run via Cloudflare proxy (immediate HTTPS)"

    record = upsert(token, zone_id, content, proxied, comment)
    print(f"Record ID: {record.get('id')}")

    print("Waiting for DNS / edge propagation...")
    for attempt in range(1, 13):
        if verify_https():
            return 0
        print(f"  attempt {attempt}/12 ...")
        subprocess.run(["powershell", "-Command", "Start-Sleep -Seconds 5"], check=False)

    print("WARN: DNS updated but HTTPS not confirmed yet.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
