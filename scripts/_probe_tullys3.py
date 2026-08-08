#!/usr/bin/env python3
import urllib.request, re, json
from html import unescape

UA = "DripLab/1.0"
BASE = "https://www.tullys.co.jp"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")

def strip_tags(html):
    text = re.sub(r"<br\s*/?>", "\n", html, re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return unescape(re.sub(r"\s+", " ", text)).strip()

# Fetch house blend detail
url = BASE + "/menu/beans/blend/house_blend.html"
html = fetch(url)
open("data/scraped/tullys/house_blend.html", "w", encoding="utf-8").write(html)

for pat in [
    r'class="description"[^>]*>(.*?)</div>',
    r'property="og:description"\s+content="([^"]+)"',
    r'class="item_detail[^"]*"[^>]*>(.*?)</div>',
]:
    m = re.search(pat, html, re.S | re.I)
    if m:
        print("PAT:", strip_tags(m.group(1))[:300])

# Fetch all detail pages for descriptions
menu = open("data/scraped/tullys/menu_beans.html", encoding="utf-8").read()
paths = re.findall(r'href="(/menu/beans/(?:varietal|blend)/[^"]+\.html)"', menu)
print(f"\nFetching {len(paths)} detail pages...")
details = {}
for i, path in enumerate(paths):
    h = fetch(BASE + path)
    name_m = re.search(r"<h1[^>]*>([^<]+)</h1>", h)
    desc_m = re.search(r'class="description"[^>]*>(.*?)</div>', h, re.S)
    name = strip_tags(name_m.group(1)) if name_m else path
    desc = strip_tags(desc_m.group(1)) if desc_m else ""
    details[path] = {"name": name, "description": desc}
    print(f"  {name[:40]}: {desc[:60]}...")
    if i > 0:
        import time; time.sleep(0.5)

json.dump(details, open("data/scraped/tullys/menu_details.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)

# Rakuten shop top
print("\n=== RAKUTEN SHOP TOP ===")
rak = fetch("https://www.rakuten.co.jp/tullyscoffee-official/")
open("data/scraped/tullys/rakuten_shop.html", "w", encoding="utf-8").write(rak)
items = re.findall(r'href="(https://item\.rakuten\.co\.jp/tullyscoffee-official/[^"]+)"', rak)
print("Item links:", len(set(items)))
for u in sorted(set(items))[:20]:
    print(" ", u)
