# 星乃珈琲店 (Hoshino Coffee) — Scraping Notes

## Official channels

| Channel | URL | Role |
|---------|-----|------|
| Brand site | https://hoshinocoffee.com/ | Menu, shops (no direct EC) |
| Official EC (beans) | https://anshindo-d.com/c/shop_category/shop_drink/shop_drink_coffee/345 | 日本レストランシステム運営の「厳選食品安心堂」 |
| **Not** this chain | https://hoshino-coffee.shop-pro.jp/ | 別店舗「ほしの珈琲」（神奈川） |

星乃珈琲店チェーン自体は自社ECを持たず、豆のオンライン販売は安心堂のみ。

## Platform

- **FutureShop / itembox.cloud** (`anshindo-d.com`)
- Category slug: `/c/shop_category/shop_drink/shop_drink_coffee/345`
- Product URLs: `/c/shop_category/shop_drink/shop_drink_coffee/345/{product_id}`
- Listing filter: product name contains `珈琲豆` and `(500g)` or `(400g)` — excludes drip packs

## Online whole-bean SKUs (verified 2)

1. **34500100** — 星乃ブレンド 500g — ¥2,500 税込
2. **34501100** — アイスブレンド 400g — ¥2,000 税込

店舗レジ豆 4 品（100g ¥500 税込）: 星乃・彦星・織姫・カフェインレス。オンライン豆は EC 2 品のみ。

## Scrape strategy

```python
# 1. Fetch category page; collect links matching 珈琲豆
# 2. For each product URL, parse:
#    - og:image, og:price (product:price:amount)
#    - h1 title, fs-c-price__value
#    - table: 品名, 内容量, 販売者
#    - lead paragraph (fs-c-productDescription)
# 3. Roast/taste: from page copy (シティロースト / 深炒り)
# 4. Scores: derived from published menu balance (甘/酸/苦/焙煎 ★1-5)
```

## Selectors

| Field | Selector / pattern |
|-------|-------------------|
| Price | `span.fs-c-price__value` or `meta[property="product:price:amount"]` |
| Image | `meta[property="og:image"]` → strip to `?size=l&w=800` |
| Name | `h1` or `span.fs-c-productName__name` |
| Spec table | `th`/`td` pairs (品名, 内容量) |
| FS internal ID | `data-product-id` on `.fs-c-productListItem` |

## Rate limiting

- 1 req/sec between product pages
- User-Agent: `DripLab/1.0 (research)`

## MVP seed

3 entries: 2 online beans + 彦星ブレンド (store-only, `available: false`) for brand trio coverage.

Run: `python scripts/scrape_hoshino_beans.py`
