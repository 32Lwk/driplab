#!/usr/bin/env python3
import urllib.request, re, json
from html import unescape

UA = "DripLab/1.0"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")

def strip_tags(html):
    text = re.sub(r"<br\s*/?>", "\n", html, re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return unescape(re.sub(r"\s+", " ", text)).strip()

# Rakuten coffee beans category
for url in [
    "https://item.rakuten.co.jp/tullyscoffee-official/c/0000000003/",
    "https://item.rakuten.co.jp/tullyscoffee-official/c/0000000012/",
]:
    html = fetch(url)
    fname = url.split("/")[-2]
    open(f"data/scraped/tullys/rakuten_{fname}.html", "w", encoding="utf-8").write(html)
    items = re.findall(r'href="(https://item\.rakuten\.co\.jp/tullyscoffee-official/[a-z0-9_\-]+/)"', html)
    titles = re.findall(r'class="[^"]*item-name[^"]*"[^>]*>([^<]+)', html)
    print(f"\n=== {url} ===")
    print("product links:", len(set(items)))
    for u in sorted(set(items))[:30]:
        print(" ", u)
    if titles:
        print("titles:", titles[:15])

# Sample rakuten product
sample = "https://item.rakuten.co.jp/tullyscoffee-official/beans_0007/"
html = fetch(sample)
open("data/scraped/tullys/rakuten_sample.html", "w", encoding="utf-8").write(html)
title = re.search(r'<title>([^<]+)</title>', html)
og = re.search(r'property="og:title"\s+content="([^"]+)"', html)
price = re.search(r'itemprop="price"\s+content="([^"]+)"', html)
print("\nSample product:", title.group(1) if title else "?")
print("OG:", og.group(1) if og else "?")
print("Price:", price.group(1) if price else "?")
desc = re.search(r'class="item_desc[^"]*"[^>]*>(.*?)</', html, re.S)
if desc:
    print("Desc:", strip_tags(desc.group(1))[:200])
