"""Re-fetch descriptions/prices for existing beans_raw.json."""

import json
import time
from pathlib import Path

import scrape_kaldi_beans as sk

RAW = Path(__file__).resolve().parents[1] / "data" / "scraped" / "kaldi" / "beans_raw.json"


def main() -> None:
    data = json.loads(RAW.read_text(encoding="utf-8"))
    for i, bean in enumerate(data["beans"], 1):
        pid = bean["product_id"]
        print(f"[{i}] {pid}", flush=True)
        html = sk.fetch(bean["buy_url"])
        desc = sk.parse_description(html)
        price = sk.parse_price(html)
        if desc:
            bean["description"] = desc
        if price:
            bean["price_jpy"] = price
        roast = sk.table_field(html, "ロースト")
        if roast:
            bean["roast"] = roast
            bean["roast_label_ja"] = roast
        time.sleep(sk.RATE_SEC)

    data["skipped_ids"] = sorted(set(data.get("skipped_ids", [])))
    RAW.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    no_desc = sum(1 for b in data["beans"] if not b.get("description"))
    no_price = sum(1 for b in data["beans"] if not b.get("price_jpy"))
    print(f"done. no_desc={no_desc} no_price={no_price}")


if __name__ == "__main__":
    main()
