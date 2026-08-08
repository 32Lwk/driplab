"""Post-process Maruyama beans_raw.json: fix availability from stock_find."""
import json
import re
import time
from pathlib import Path
from urllib.request import Request, urlopen

HEADERS = {"User-Agent": "DripLab-Research/1.0"}
RAW = Path(r"C:\Users\yutok\Projects\driplab\data\scraped\maruyama\beans_raw.json")


def check_available(html: str) -> bool:
    if re.search(r'class="productDetailInfo".*?販売終了', html, re.DOTALL):
        return False
    decoded = html
    if r"\u8c46" in html:
        try:
            decoded = html.encode("utf-8").decode("unicode_escape")
        except Exception:
            pass
    if '"name":"豆"' in decoded:
        for m in re.finditer(
            r'"name":"豆"[^}]*"stock_find":(true|false)', decoded
        ):
            if m.group(1) == "true":
                return True
        return False
    return "販売終了いたしました" not in html


def main():
    items = json.loads(RAW.read_text(encoding="utf-8"))
    for item in items:
        url = item["buy_url"]
        html = urlopen(Request(url, headers=HEADERS)).read().decode()
        item["available"] = check_available(html)
        time.sleep(0.5)
        print(item["product_id"], item["name"][:40], item["available"])
    RAW.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
