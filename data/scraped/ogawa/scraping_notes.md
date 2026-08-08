# Ogawa Coffee scraping notes

Scraped: 2026-08-08T10:52:59+09:00
Source: https://oc-shop.co.jp

## Official store
- Brand site: https://www.ogawa-coffee.co.jp/
- **Online shop (EC)**: https://oc-shop.co.jp/ (Shopify)
- Corporate domain `ogawa-coffee.co.jp` links to the OC-shop storefront

## Method
- Shopify public JSON API: `/products.json`, `/products/{handle}.json`
- Product pages fetched for 商品の基本情報 (origin countries from 原材料名)
- Taste scores estimated from 味わいコメント diamond ratings (◆) and description keywords

## Catalog scope
- **Included**: Products titled with `（豆）`, lab format `豆 150g`, or `no.XX ... 100g` (roasted whole bean)
- **Excluded**: 粉 (ground), ドリップ, 生豆 (green), equipment, gifts with ground coffee, subscriptions

## Counts
- Total whole-bean SKUs: **72**
- Single-SKU products: **52**
- Bundles / まとめ買い / sets: **20**

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
