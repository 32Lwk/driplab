#!/usr/bin/env python3
"""Merge Tully's EC beans + store menu into unified beans_raw.json."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EC_PATH = ROOT / "data" / "scraped" / "tullys" / "beans_ec.json"
STORE_PATH = ROOT / "data" / "scraped" / "tullys" / "beans_store_menu.json"
LEGACY_EC = ROOT / "data" / "scraped" / "tullys" / "beans_raw.json"
OUT = ROOT / "data" / "scraped" / "tullys" / "beans_raw.json"
JST = timezone(timedelta(hours=9))


def normalize_name(name: str) -> str:
    s = name.lower()
    s = re.sub(r"【[^】]+】", "", s)
    s = re.sub(r"\d+\s*g\s*（[豆粉]）?", "", s)
    s = re.sub(r"（豆）|（粉）", "", s)
    s = re.sub(r"タリーズ\s*", "", s)
    s = re.sub(r"\s+", "", s)
    return s


def load_beans(path: Path) -> list[dict]:
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return data.get("beans", data if isinstance(data, list) else [])


def merge_ec_store(ec: list[dict], store: list[dict]) -> list[dict]:
    merged: list[dict] = []
    by_norm: dict[str, dict] = {}

    for item in ec:
        item = dict(item)
        item.setdefault("purchase_channel", "ec")
        item["availability"] = ["ec"]
        norm = normalize_name(item.get("name", ""))
        by_norm[norm] = item
        merged.append(item)

    for item in store:
        norm = normalize_name(item.get("name", ""))
        if norm in by_norm:
            existing = by_norm[norm]
            if "store" not in existing.get("availability", []):
                existing.setdefault("availability", ["ec"]).append("store")
            existing.setdefault("menu_url", item.get("menu_url"))
            if not existing.get("image_url") and item.get("image_url"):
                existing["image_url"] = item["image_url"]
                existing["image_local"] = item.get("image_local")
            if not existing.get("description") or len(existing["description"]) < len(item.get("description", "")):
                existing["description"] = item.get("description", existing.get("description"))
            if not existing.get("flavor_tags"):
                existing["flavor_tags"] = item.get("flavor_tags", [])
            if not existing.get("price_jpy") and item.get("price_jpy"):
                existing["price_jpy"] = item["price_jpy"]
            continue

        item = dict(item)
        item["availability"] = ["store"]
        merged.append(item)
        by_norm[norm] = item

    merged.sort(key=lambda x: x.get("name", ""))
    return merged


def main() -> None:
    ec = load_beans(EC_PATH)
    if not ec and LEGACY_EC.exists():
        raw = json.loads(LEGACY_EC.read_text(encoding="utf-8"))
        ec = raw.get("beans", [])
        # If legacy file already merged, split by purchase_channel
        if ec and any("store" in b.get("availability", []) for b in ec):
            print("beans_raw.json already merged; skipping")
            return

    store = load_beans(STORE_PATH)
    merged = merge_ec_store(ec, store)

    payload = {
        "chain_id": "tullys",
        "scraped_at": datetime.now(JST).strftime("%Y-%m-%dT%H:%M:%S+09:00"),
        "sources": [
            "https://shop.itoen.jp/tullyscoffee/index.html",
            "https://www.tullys.co.jp/menu/beans/",
        ],
        "source_note": (
            "EC (Ito En) has ~8 whole-bean SKUs; store menu adds retail-only beans. "
            "Merged by normalized product name."
        ),
        "count": len(merged),
        "ec_count": len(ec),
        "store_only_count": sum(1 for b in merged if b.get("availability") == ["store"]),
        "beans": merged,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Merged {len(merged)} beans (ec={len(ec)}, store_pages={len(store)}) -> {OUT}")


if __name__ == "__main__":
    main()
