import re
import urllib.request

UA = "DripLab/1.0"
all_ids = []
for page in [1, 2]:
    url = (
        "https://www.kaldi.co.jp/ec/Facet?category_0=11010100000"
        if page == 1
        else "https://www.kaldi.co.jp/ec/Facet?category_0=11010100000&page=2"
    )
    html = urllib.request.urlopen(
        urllib.request.Request(url, headers={"User-Agent": UA})
    ).read().decode("utf-8", "replace")
    ids = re.findall(r"/ec/pro/disp/1/([A-Za-z0-9_-]+)\?sFlg=2", html)
    print("page", page, "count", len(ids))
    all_ids.extend(ids)

print("total unique", len(set(all_ids)))
