#!/usr/bin/env python3
import urllib.request
import re
from html import unescape

UA = "DripLab/1.0"
def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")

# Tullys menu beans
html = fetch("https://www.tullys.co.jp/menu/beans/")
print("=== MENU BEANS PAGE ===")
print("Length:", len(html))

# Save snippet for analysis
with open("data/scraped/tullys/menu_beans.html", "w", encoding="utf-8") as f:
    f.write(html)

# Try to find bean items
for pat in [
    r'<h[23][^>]*class="[^"]*"[^>]*>([^<]+)</h[23]>',
    r'class="[^"]*title[^"]*"[^>]*>([^<]+)<',
    r'data-name="([^"]+)"',
    r'alt="([^"]*ブレンド[^"]*)"',
    r'alt="([^"]*コーヒー[^"]*)"',
]:
    m = re.findall(pat, html, re.I)
    if m:
        print(f"\nPattern {pat[:50]}: {len(m)} matches")
        for x in m[:25]:
            print(" ", unescape(x.strip()))

# Rakuten store
print("\n=== RAKUTEN ===")
try:
    rak_html = fetch("https://search.rakuten.co.jp/search/mall/?sid=402407")
    with open("data/scraped/tullys/rakuten_search.html", "w", encoding="utf-8") as f:
        f.write(rak_html)
    items = re.findall(r'class="[^"]*title[^"]*"[^>]*>([^<]+)<', rak_html)
    print("Rakuten items:", len(items))
    for x in items[:20]:
        print(" ", x.strip())
except Exception as e:
    print("Rakuten error:", e)
