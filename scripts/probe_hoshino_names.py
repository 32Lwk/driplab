import re
import urllib.request

UA = {"User-Agent": "Mozilla/5.0"}
codes = [
    "34500005",
    "34500100",
    "34500400",
    "34500500",
    "34500600",
    "34500700",
    "34500800",
    "34500900",
    "34501000",
    "34501100",
    "99900032",
]
for code in codes:
    url = f"https://anshindo-d.com/c/shop_category/shop_drink/shop_drink_coffee/345/{code}"
    html = urllib.request.urlopen(
        urllib.request.Request(url, headers=UA), timeout=60
    ).read().decode("utf-8", "replace")
    name_m = re.search(r'class="fs-c-productNameHeading__name">([^<]+)</span>', html)
    name = name_m.group(1) if name_m else "?"
    print(code, name)
