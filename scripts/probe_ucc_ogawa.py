#!/usr/bin/env python3
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UA = "Mozilla/5.0 (compatible; DripLab/1.0)"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", errors="replace")


def main() -> None:
    # UCC bean index
    try:
        html = fetch("https://www.ucc.co.jp/product/regular/bean/")
        links = sorted(set(re.findall(r'href="(/product/regular/bean/[^"]+\.html)"', html)))
        print("UCC bean pages:", len(links))
        for l in links[:25]:
            print(" ", l)
        (ROOT / "tmp_ucc_bean_links.txt").write_text("\n".join(links), encoding="utf-8")
    except Exception as e:
        print("UCC bean index fail:", e)

    # UCC store BRAND_10
    try:
        html = fetch("https://store.ucc.co.jp/category/BRAND_10/")
        links = sorted(set(re.findall(r'href="([^"]*UCT[^"]*\.html)"', html)))
        print("UCC store UCT links:", len(links))
        for l in links[:15]:
            print(" ", l)
    except Exception as e:
        print("UCC store fail:", e)

    # Ogawa domains
    for url in [
        "https://www.ogawa-coffee.com/",
        "https://www.ogawa-coffee.com/shop/",
        "https://www.ogawa-coffee.com/onlineshop/",
        "https://shop.ogawa-coffee.com/",
    ]:
        try:
            html = fetch(url)
            print(f"OGAWA OK {url} len={len(html)} shopify={'shopify' in html.lower()}")
            shop = [m for m in re.findall(r'href="(https?://[^"]+)"', html) if "shop" in m.lower()]
            for s in shop[:5]:
                print(" ", s)
        except Exception as e:
            print(f"OGAWA FAIL {url}: {e}")

    # Shopify ogawa
    for base in ["https://shop.ogawa-coffee.com", "https://www.ogawa-coffee.com"]:
        try:
            data = json.loads(fetch(f"{base}/collections/all/products.json?limit=250"))
            print(f"OGAWA SHOPIFY {base}: {len(data.get('products', []))}")
        except Exception as e:
            print(f"OGAWA SHOPIFY FAIL {base}: {e}")


if __name__ == "__main__":
    main()
