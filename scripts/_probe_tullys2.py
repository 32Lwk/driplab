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

# Parse menu listing
html = open("data/scraped/tullys/menu_beans.html", encoding="utf-8").read()
items = []
for m in re.finditer(
    r'<a href="(/menu/beans/(?:varietal|blend)/[^"]+\.html)">\s*<img src="([^"]+)" alt="([^"]+)"',
    html,
):
    path, img, name = m.group(1), m.group(2), unescape(m.group(3))
    items.append({"name": name, "path": path, "image_url": BASE + img})

print(f"Menu beans (varietal+blend): {len(items)}")
for it in items:
    print(f"  {it['name'][:50]}")

# Fetch one detail page
sample = fetch(BASE + items[-3]["path"])
with open("data/scraped/tullys/sample_detail.html", "w", encoding="utf-8") as f:
    f.write(sample)

# Try to extract description fields
for pat in [
    r'class="[^"]*description[^"]*"[^>]*>(.*?)</',
    r'class="[^"]*detail[^"]*"[^>]*>(.*?)</',
    r'<p[^>]*>(.*?)</p>',
]:
    ms = re.findall(pat, sample, re.S|re.I)
    if ms:
        print(f"\nPattern {pat[:40]}: {len(ms)} matches")
        for x in ms[:3]:
            t = strip_tags(x)
            if len(t) > 30:
                print(" ", t[:120])

# Rakuten - try shop search API style
print("\n=== RAKUTEN SHOP ===")
rak = fetch("https://search.rakuten.co.jp/search/mall/?sid=402407&st=A&p=1")
with open("data/scraped/tullys/rakuten_p1.html", "w", encoding="utf-8") as f:
    f.write(rak)

# product titles on rakuten
for pat in [
    r'<a[^>]+class="[^"]*title[^"]*"[^>]*>([^<]+)</a>',
    r'data-link="[^"]*"[^>]*title="([^"]+)"',
    r'href="https://item\.rakuten\.co\.jp/tullyscoffee-official/[^"]*"[^>]*>([^<]+)',
]:
    ms = re.findall(pat, rak, re.I)
    if ms:
        print(f"Rakuten pattern: {len(ms)}")
        for x in ms[:15]:
            print(" ", x.strip()[:80])
