#!/usr/bin/env python3
"""Merge Doutor EC beans + store-only beans into beans_raw.json."""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EC_LEGACY = ROOT / "data" / "scraped" / "doutor" / "beans_ec_backup.json"
RAW_PATH = ROOT / "data" / "scraped" / "doutor" / "beans_raw.json"
STORE_PATH = ROOT / "data" / "scraped" / "doutor" / "beans_store_menu.json"
OUT = RAW_PATH
JST = timezone(timedelta(hours=9))


def load_beans(path: Path) -> list[dict]:
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, list) else data.get("beans", [])


def is_store_id(product_id: object) -> bool:
    return str(product_id).startswith("store-")


def merge_ec_store(ec: list[dict], store: list[dict]) -> list[dict]:
    ec_only = [dict(b) for b in ec if not is_store_id(b.get("product_id"))]
    merged = ec_only
    by_id = {str(b.get("product_id")): b for b in merged}

    for item in store:
        pid = str(item.get("product_id"))
        if pid in by_id:
            row = by_id[pid]
            for key in ("image_url", "image_local", "menu_url", "description", "price_jpy"):
                if item.get(key) is not None:
                    row[key] = item[key]
            continue
        row = dict(item)
        row.setdefault("chain_id", "doutor")
        row.setdefault("purchase_channel", "store")
        merged.append(row)
        by_id[pid] = row

    merged.sort(key=lambda x: str(x.get("product_id", "")))
    return merged


def main() -> None:
    raw = load_beans(RAW_PATH)
    ec = [b for b in raw if not is_store_id(b.get("product_id"))]
    if not ec:
        raise SystemExit(f"No EC beans at {RAW_PATH}")

    store = load_beans(STORE_PATH)
    merged = merge_ec_store(ec, store)

    payload = {
        "chain_id": "doutor",
        "scraped_at": datetime.now(JST).strftime("%Y-%m-%dT%H:%M:%S+09:00"),
        "sources": [
            "https://onlineshop.doutor.co.jp",
            "https://www.doutor.co.jp/dcs/products/",
        ],
        "source_note": (
            "EC 12 whole-bean SKUs + 2 store-only beans "
            "(Italian Espresso, Iced Coffee)."
        ),
        "count": len(merged),
        "ec_count": len(ec),
        "store_only_count": sum(1 for b in merged if is_store_id(b.get("product_id"))),
        "beans": merged,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"Merged {len(merged)} beans (ec={len(ec)}, store={payload['store_only_count']}) -> {OUT}"
    )


if __name__ == "__main__":
    main()
