#!/usr/bin/env python3
"""Probe candidate store URLs for new chains."""
import json
import re
import urllib.request

UA = "Mozilla/5.0 (compatible; DripLab/1.0)"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", errors="replace")


def try_shopify(base: str, collection: str = "all") -> None:
    url = f"{base.rstrip('/')}/collections/{collection}/products.json?limit=250"
    try:
        data = json.loads(fetch(url))
        products = data.get("products", [])
        print(f"SHOPIFY OK {url} -> {len(products)} products")
        for p in products[:8]:
            print(f"  - {p['title'][:60]}")
    except Exception as e:
        print(f"SHOPIFY FAIL {url}: {e}")


def probe_ucc() -> None:
    for path in [
        "https://store.ucc.co.jp/category/COFFEE_BEAN.html",
        "https://store.ucc.co.jp/category/BRAND_10/",
        "https://store.ucc.co.jp/search?q=%E8%B1%86",
    ]:
        try:
            html = fetch(path)
            links = re.findall(r'href="(/category/[^"]+\.html)"', html)
            print(f"UCC {path} len={len(html)} links={len(links)}")
            for l in links[:5]:
                print(f"  {l}")
        except Exception as e:
            print(f"UCC FAIL {path}: {e}")


def probe_ogawa() -> None:
    urls = [
        "https://www.ogawa-coffee.co.jp/onlineshop/",
        "https://shop.ogawa-coffee.co.jp/",
        "https://store.ogawa-coffee.co.jp/",
        "https://www.ogawa-coffee.co.jp/shop/",
        "https://ogawa-coffee.shop/",
    ]
    for url in urls:
        try:
            html = fetch(url)
            print(f"OGAWA OK {url} len={len(html)}")
            if "shopify" in html.lower():
                print("  -> Shopify detected")
        except Exception as e:
            print(f"OGAWA FAIL {url}: {e}")


def probe_hoshino() -> None:
    url = "https://anshindo-d.com/c/shop_category/shop_drink/shop_drink_coffee/345"
    try:
        html = fetch(url)
        links = re.findall(r'href="(/c/shop_category/shop_drink/shop_drink_coffee/345/\d+)"', html)
        print(f"HOSHINO anshindo links={len(set(links))}")
        for l in list(set(links))[:10]:
            print(f"  {l}")
    except Exception as e:
        print(f"HOSHINO FAIL: {e}")


if __name__ == "__main__":
    print("=== Shopify probes ===")
    try_shopify("https://store.bluebottlecoffee.jp", "coffee")
    try_shopify("https://sarutahiko.jp", "coffeebeans-groundcoffee")
    try_shopify("https://store.ogawa-coffee.co.jp")
    print("\n=== UCC ===")
    probe_ucc()
    print("\n=== Ogawa ===")
    probe_ogawa()
    print("\n=== Hoshino ===")
    probe_hoshino()
