#!/usr/bin/env python3
"""Configure coffee.yutok.dev DNS in Cloudflare for Cloud Run custom domain."""
from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

ZONE_NAME = "yutok.dev"
HOSTNAME = "coffee.yutok.dev"
RECORD_NAME = "coffee"
CNAME_TARGET = "ghs.googlehosted.com"


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


def upsert_cname(token: str, zone_id: str) -> dict:
    records = list_records(token, zone_id)
    desired = {
        "type": "CNAME",
        "name": RECORD_NAME,
        "content": CNAME_TARGET,
        "proxied": False,
        "ttl": 1,
        "comment": "DripLab -> Cloud Run custom domain (DNS only)",
    }

    for rec in records:
        if rec.get("type") == "CNAME" and rec.get("content") == CNAME_TARGET and rec.get("proxied") is False:
            print(f"OK: existing CNAME {HOSTNAME} -> {CNAME_TARGET} (DNS only)")
            return rec
        print(f"Deleting stale record: {rec.get('type')} {rec.get('name')} -> {rec.get('content')}")
        delete_record(token, zone_id, rec["id"])

    print(f"Creating CNAME {HOSTNAME} -> {CNAME_TARGET} (proxied=false)")
    created = api(
        "POST",
        f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records",
        token,
        desired,
    )
    if not created.get("success"):
        raise RuntimeError(f"create failed: {created}")
    return created["result"][0]


def verify_dns() -> bool:
    proc = subprocess.run(
        ["powershell", "-Command", f"Resolve-DnsName {HOSTNAME} -Type CNAME | Select-Object -First 1 -ExpandProperty NameHost"],
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        return False
    target = proc.stdout.strip()
    print(f"DNS check: {HOSTNAME} CNAME -> {target or '(pending)'}")
    return CNAME_TARGET in target


def main() -> int:
    token = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
    if not token:
        print(
            "ERROR: set CLOUDFLARE_API_TOKEN (Zone.DNS.Edit for yutok.dev)",
            file=sys.stderr,
        )
        return 1

    zone_id = get_zone_id(token)
    print(f"Zone: {ZONE_NAME} ({zone_id})")

    record = upsert_cname(token, zone_id)
    print(f"Record ID: {record.get('id')}")

    print("Waiting for DNS propagation...")
    for attempt in range(1, 13):
        if verify_dns():
            print(f"OK: {HOSTNAME} resolves to {CNAME_TARGET}")
            return 0
        print(f"  attempt {attempt}/12 ...")
        subprocess.run(["powershell", "-Command", "Start-Sleep -Seconds 5"], check=False)

    print(f"WARN: DNS record created but propagation not confirmed yet.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
