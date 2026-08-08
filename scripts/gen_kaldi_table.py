"""Generate markdown table for KALDI.md from beans_raw.json."""

import json
from pathlib import Path

RAW = Path(__file__).resolve().parents[1] / "data" / "scraped" / "kaldi" / "beans_raw.json"


def main() -> None:
    data = json.loads(RAW.read_text(encoding="utf-8"))
    beans = [
        b
        for b in data["beans"]
        if "セット" not in b["name"]
        and "送料無料" not in b["name"]
        and "予約販売" not in b["name"]
    ]
    print(f"table_rows={len(beans)}")
    for b in sorted(beans, key=lambda x: x["name"]):
        short = b["name"].replace("【焙煎珈琲】", "")
        print(
            f"| {b['product_id']} | {short} | {b['weight_g']}g | "
            f"¥{b['price_jpy']:,} | {b['roast'] or '-'} | "
            f"{b['origin'] or '-'} | [link]({b['buy_url']}) |"
        )


if __name__ == "__main__":
    main()
