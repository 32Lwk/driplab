# 猿田彦珈琲 (Sarutahiko Coffee) — Research Notes

**Scraped:** 2026-09-04T01:15:17+09:00
**Source:** https://sarutahiko.jp
**Chain ID:** `sarutahiko`

## Official EC

- URL: https://sarutahiko.jp/
- Platform: Shopify
- Whole bean collection: https://sarutahiko.jp/collections/coffeebeans-groundcoffee

## Scraping notes

1. Primary source: Shopify JSON API `collections/coffeebeans-groundcoffee/products.json`
2. Verified product pages: `/products/m-d` (大吉 ¥980), `/products/m-ec` (恵比寿シティ ¥1,000)
3. Include: `product_type=コーヒー豆/粉` single-SKU items (not sets/subscriptions)
4. Price/weight: smallest bean tier (typically 100g; Geisha lots 50g; 巣ごもり 500g)
5. Variant format: some products use `100g / 豆のまま`, others just `100g` (both are whole bean)
6. Descriptions parsed from `body_html` 商品説明 section
7. Excluded: 13 bundle/set/subscription items in same collection
8. `wbe1` (猿田彦クラシック豆) returns 404 — discontinued from EC

## Catalog summary

- **Whole bean single products:** 15
- **Excluded bundles/sets:** 14

## MVP seeds (3)

| Product | Price (100g) | URL |
|---------|--------------|-----|
| 【深煎り】大吉ブレンド | ¥980 | https://sarutahiko.jp/products/m-d |
| <9/10より順次発送>【中深煎り】恵比寿シティ | ¥1,000 | https://sarutahiko.jp/products/m-ec |
| 【中煎り】TOKYO ’til Infinity | ¥1,200 | https://sarutahiko.jp/products/m-t-spring2026 |

## Full catalog

- [<9/10より順次発送>【中深煎り】サンフレッチェ広島×猿田彦珈琲](https://sarutahiko.jp/products/m-hiroshima) — ¥1,150 / 100g ✓
- [<9/10より順次発送>【中深煎り】恵比寿シティ](https://sarutahiko.jp/products/m-ec) — ¥1,000 / 100g ✓
- [<9/14より順次発送>【浅煎り】ぺルー／Corralpampa Geisha Washed 2025COE#6](https://sarutahiko.jp/products/m-peru20260812) — ¥2,680 / 80g ✓
- [<9/14より順次発送>【浅煎り】バレルエイジド ブラジル／Monte Alegre Anaerobic with Yeast](https://sarutahiko.jp/products/m-balbra20260723) — ¥1,580 / 100g ✓
- [【オンラインショップ限定】巣ごもりブレンド(500g)](https://sarutahiko.jp/products/m-su500) — ¥3,000 / 500g ✓
- [【中深煎り】お月見ブレンド](https://sarutahiko.jp/products/m-moon20260821) — ¥1,200 / 100g ✓
- [【中煎り】TOKYO ’til Infinity](https://sarutahiko.jp/products/m-t-spring2026) — ¥1,200 / 100g ✓
- [【浅煎り】イエメン／Wadi Dayan Yemenia Natural](https://sarutahiko.jp/products/m-yeme20260827) — ¥2,580 / 100g ✓
- [【浅煎り】エチオピア／Nigusse Gemeda Karamo Natural Anaerobic](https://sarutahiko.jp/products/m-eth20260811) — ¥1,680 / 100g ✓
- [【浅煎り】ケニア／Marua AA](https://sarutahiko.jp/products/m-ken260717) — ¥1,680 / 100g ✓
- [【浅煎り】コロンビア／Peñas Blancas Geisha Washed](https://sarutahiko.jp/products/m-col20260711) — ¥2,980 / 50g ✓
- [【深煎り】ディカフェ エチオピア／Bombe Natural](https://sarutahiko.jp/products/m-de-251228) — ¥980 / 100g ✓
- [【深煎り】バレルエイジド   グアテマラ／San Cristobal Natural](https://sarutahiko.jp/products/m-balgua20260723) — ¥1,580 / 100g ✓
- [【深煎り】大吉ブレンド](https://sarutahiko.jp/products/m-d) — ¥980 / 100g ✓
- [【深煎り】猿田彦フレンチ](https://sarutahiko.jp/products/m-stf) — ¥1,080 / 100g ✓

## Excluded (not whole-bean singles)

- <9/14より順次発送> ゲイシャ品種の浅煎りコーヒー飲み比べ2種セット | コロンビアとペルー — bundle/set excluded
- Drippen＆コーヒー豆300gセット — bundle/set excluded
- 猿田彦珈琲の定番セット300g — bundle/set excluded
- ＜定期便限定＞コーヒー豆バラエティ300gセット — bundle/set excluded
- ＜定期便限定＞コーヒー豆バラエティ500gセット — bundle/set excluded
- ＜定期便限定＞ディカフェ エチオピア／Bombe Natural 400g — bundle/set excluded
- ＜定期便限定＞フルーティで香り高いコーヒー豆 200gセット — bundle/set excluded
- ＜定期便＞まろやかで安らぐ コーヒー豆 200gセット — bundle/set excluded
- ＜定期便＞芳醇でリッチなコーヒー豆 200gセット — bundle/set excluded
- ＜送料込み＞TOKYO ’til Infinityと浅煎りコーヒー飲み比べセット — bundle/set excluded
- ＜送料込み＞まろやかで安らぐコーヒー豆 飲み比べ2種セット — bundle/set excluded
- ＜送料込み＞バレルエイジドコーヒー2種飲み比べセット — bundle/set excluded
- ＜送料込み＞ブレンド飲み比べ3種セット【お月見ブレンド】 — bundle/set excluded
- ＜送料込み＞芳醇でリッチなコーヒー豆 飲み比べ2種セット — bundle/set excluded
