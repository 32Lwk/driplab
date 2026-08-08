import json
import re
import time
import urllib.request
from pathlib import Path

import scrape_kaldi_beans as sk

RAW = Path(__file__).resolve().parents[1] / "data" / "scraped" / "kaldi" / "beans_raw.json"


def listing_ids() -> list[str]:
    ids: list[str] = []
    for page in (1, 2):
        url = sk.CATEGORY if page == 1 else f"{sk.CATEGORY}&page=2"
        html = sk.fetch(url)
        for pid in sk.extract_listing_product_ids(html):
            if pid not in ids:
                ids.append(pid)
    return ids


def main() -> None:
    existing = json.loads(RAW.read_text(encoding="utf-8"))
    have = {b["product_id"] for b in existing["beans"]}
    all_ids = listing_ids()
    missing = [pid for pid in all_ids if pid not in have]
    print(f"Total listing: {len(all_ids)}, have: {len(have)}, missing: {len(missing)}")

    for i, pid in enumerate(missing, 1):
        print(f"[{i}/{len(missing)}] {pid}", flush=True)
        try:
            item = sk.parse_product(pid)
            if item:
                existing["beans"].append(item)
            else:
                existing.setdefault("skipped_ids", []).append(pid)
        except Exception as exc:
            print(f"  ERROR: {exc}", flush=True)
            existing.setdefault("skipped_ids", []).append(pid)
        time.sleep(sk.RATE_SEC)

    existing["beans"].sort(key=lambda x: x["name"])
    existing["count"] = len(existing["beans"])
    existing["scraped_at"] = "2026-08-08T15:45:00+09:00"
    RAW.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Updated total: {existing['count']}")


if __name__ == "__main__":
    main()
