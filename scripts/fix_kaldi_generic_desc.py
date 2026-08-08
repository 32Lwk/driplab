"""Post-process KALDI beans_raw.json: fix boilerplate descriptions."""

import json
import re
from pathlib import Path

RAW = Path(__file__).resolve().parents[1] / "data" / "scraped" / "kaldi" / "beans_raw.json"
GENERIC = "公式オンラインストアです"


def fallback_description(bean: dict) -> str:
    parts = []
    if bean.get("taste_balance"):
        parts.append(f"テイスト: {bean['taste_balance']}")
    if bean.get("body_label"):
        parts.append(f"ボディ: {bean['body_label']}")
    if bean.get("origin"):
        parts.append(f"生産国: {bean['origin']}")
    return "。".join(parts) + "。" if parts else bean["name"]


def main() -> None:
    data = json.loads(RAW.read_text(encoding="utf-8"))
    fixed = 0
    for bean in data["beans"]:
        desc = bean.get("description") or ""
        if GENERIC in desc or len(desc) < 8:
            bean["description"] = fallback_description(bean)
            fixed += 1
        desc = bean["description"]
        if desc.startswith("@charset"):
            bean["description"] = fallback_description(bean)
            fixed += 1
    data["skipped_ids"] = sorted(set(data.get("skipped_ids", [])))
    RAW.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"fixed {fixed} descriptions")


if __name__ == "__main__":
    main()
