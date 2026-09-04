# Ogawa Coffee scraping notes

Scraped: 2026-09-03T16:16:57+09:00 (bundles removed 2026-09-05)
Source: https://oc-shop.co.jp

## Method
- Shopify public JSON API: `/products.json`, `/products/{handle}.json`
- Product pages fetched for 商品の基本情報 (origin countries from 原材料名)
- Taste scores estimated from 味わいコメント diamond ratings (◆) and description keywords

## Catalog scope
- **Included**: Single-SKU whole-bean products titled with `（豆）`, lab format `豆 150g`, or `no.XX ... 100g`
- **Excluded**: 粉 (ground), ドリップ, 生豆 (green), equipment, gifts, subscriptions, まとめ買い / multi-pack sets

## Counts
- Catalog (single SKUs): **52**
- Excluded bundles / まとめ買い / sets: **20**

## Not available as whole bean on EC
- キリマンジャロブレンド — powder only (R043)
- カフェインレスブレンド — powder only (R040); organic decaf mocha available as bean (No.967)
- Seasonal 春/夏/秋/冬珈琲 — powder or drip only

## MVP seeds (3)
- 小川プレミアムブレンド（豆）140g R025 (`r-ocpremium-b`)
- オーガニック エチオピア イルガチェフェ モカ（豆）150g No.932 (`932`)
- ブラジル ベレーダ（豆）150g No.959 (`959`)

## Errors
None
