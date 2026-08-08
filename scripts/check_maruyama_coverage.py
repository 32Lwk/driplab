import json
import re
from urllib.request import Request, urlopen

HEADERS = {"User-Agent": "DripLab-Research/1.0"}
BASE = "https://www.maruyamacoffee.com/ec"

html = urlopen(Request(f"{BASE}/index.php/products/list?category_id=167&disp_number=100", headers=HEADERS)).read().decode()
ids167 = sorted(set(re.findall(r"products/detail/(\d+)", html)), key=int)
raw = json.load(open(r"C:\Users\yutok\Projects\driplab\data\scraped\maruyama\beans_raw.json", encoding="utf-8"))
raw_ids = {str(x["product_id"]) for x in raw}
missing = [i for i in ids167 if i not in raw_ids]
print("cat167 total", len(ids167), "in raw", len([i for i in ids167 if i in raw_ids]), "missing", len(missing))
print("missing", missing)

html24 = urlopen(Request(f"{BASE}/products/detail/24", headers=HEADERS)).read().decode()
for pat in ["販売終了", "SOLD OUT", "在庫切れ"]:
    print(pat, bool(re.search(pat, html24)))
print("sold out block", "soldout" in html24.lower())

for cat in [52, 48, 7, 9]:
    h = urlopen(Request(f"{BASE}/index.php/products/list?category_id={cat}&disp_number=100", headers=HEADERS)).read().decode()
    ids = sorted(set(re.findall(r"products/detail/(\d+)", h)), key=int)
    in_raw = [i for i in ids if i in raw_ids]
    print(f"cat{cat}: total={len(ids)} in_raw={len(in_raw)} missing={[i for i in ids if i not in raw_ids]}")

print("\nMissing product details:")
for pid in ["2229", "2845", "2957", "3002", "3042", "3076", "3038", "3041", "1837", "2361"]:
    h = urlopen(Request(f"{BASE}/products/detail/{pid}", headers=HEADERS)).read().decode()
    t = re.search(r'property="og:title"\s+content="([^"]+)"', h)
    bean = '"name":"豆"' in h or r"\u8c46" in h
    print(pid, (t.group(1)[:70] if t else "?"), "bean=" + str(bean))
