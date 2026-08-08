import json
import re
import time
from pathlib import Path
from urllib.request import Request, urlopen

HEADERS = {"User-Agent": "DripLab-Research/1.0"}
RAW = Path(r"C:\Users\yutok\Projects\driplab\data\scraped\maruyama\beans_raw.json")


def bean_in_stock(html: str) -> bool:
    if "販売終了いたしました" in html and "productDetailInfo" in html:
        # only if main product sold out message near title
        m = re.search(
            r"productDetailInfo[\s\S]{0,800}?販売終了", html
        )
        if m:
            return False
    if re.search(r"\\u8c46[^}]*stock_find.:true", html):
        return True
    try:
        decoded = html.encode("utf-8").decode("unicode_escape")
        if re.search(r'"name":"豆"[^}]*"stock_find":true', decoded):
            return True
    except Exception:
        pass
    return True  # default optimistic if bean option exists


def main():
    items = json.loads(RAW.read_text(encoding="utf-8"))
    for item in items:
        html = urlopen(Request(item["buy_url"], headers=HEADERS)).read().decode()
        item["available"] = bean_in_stock(html)
        time.sleep(0.4)
    RAW.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
    print("available", sum(1 for x in items if x["available"]), "/", len(items))


if __name__ == "__main__":
    main()
