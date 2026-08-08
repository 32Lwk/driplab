#!/usr/bin/env python3
import urllib.request, re, json
from html import unescape

UA = "DripLab/1.0"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "ja-JP"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")

def strip_tags(html):
    text = re.sub(r"<br\s*/?>", "\n", html, re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return unescape(re.sub(r"\s+", " ", text)).strip()

beans_ids = [
    "beans_0001", "beans_0004", "beans_0005", "beans_0006", "beans_0007",
    "beans_0010", "beans_0011",
    "seasonal_beans_0010", "seasonal_beans_0011", "seasonal_beans_0015",
    "seasonal_beans_0016", "seasonal_beans_0017",
    "seasonal_beans_25041601", "seasonal_beans_25041602", "seasonal_beans_25041603",
]
results = {}
for pid in beans_ids:
    url = f"https://item.rakuten.co.jp/tullyscoffee-official/{pid}/"
    html = fetch(url)
    og = re.search(r'property="og:title"\s+content="([^"]+)"', html)
    title = og.group(1) if og else ""
    # clean rakuten prefix
    title = re.sub(r"【楽天市場】", "", title)
    title = re.sub(r"：.*$", "", title).strip()
    price = re.search(r'itemprop="price"\s+content="(\d+)"', html)
    img = re.search(r'property="og:image"\s+content="([^"]+)"', html)
    is_bean = "豆" in title or "コーヒー" in title
    is_ground = "粉" in title and "豆" not in title
    results[pid] = {
        "title": title[:80],
        "price": int(price.group(1)) if price else None,
        "image": img.group(1) if img else None,
        "url": url,
        "is_bean": is_bean and not is_ground,
    }
    print(f"{pid}: {title[:60]} | bean={results[pid]['is_bean']} | {results[pid]['price']}")

json.dump(results, open("data/scraped/tullys/rakuten_beans_map.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
