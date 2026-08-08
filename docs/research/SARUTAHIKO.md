# 猿田彦珈琲 (Sarutahiko Coffee) — Research Notes

**Scraped:** 2026-08-08T19:48:36+09:00
**Re-verified:** 2026-08-08（Shopify JSON API ライブ照合）
**Source:** https://sarutahiko.jp
**Chain ID:** `sarutahiko`

## 再調査結論（2026-08-08）

**カタログ 16 品目 = EC 単品豆の全件。漏れなし。**

| 指標 | 数値 |
|------|------|
| コレクション総商品 | 29 |
| 単品豆（ホール/粉 SKU） | **16** ← DripLab 収録 |
| セット・定期便・送料込 | 13（意図的除外） |
| ライブ vs カタログ差分 | **0** |

他チェーン（小川 72 / UCC 54）と比べ少なく見えるのは、**ローテーション型マイクロロット＋セット除外**のため。定番ブレンド（大吉・恵比寿シティ・フレンチ等）は網羅済み。

### 終売・期間限定（カタログ外）

| 商品 | handle | 状態 |
|------|--------|------|
| アニバーサリーブレンド 2026 | `m-anni260519` | **404**（2026/5 発売・単品 EC 終了） |
| 15 周年 3 種セット | `15anniv-specialset` | セット（230g 混在）→ 単品除外 |
| 猿田彦クラシック豆 | `wbe1` | **404**（終売） |

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

- **Whole bean single products:** 16
- **Excluded bundles/sets:** 13

## MVP seeds (3)

| Product | Price (100g) | URL |
|---------|--------------|-----|
| 【深煎り】大吉ブレンド | ¥980 | https://sarutahiko.jp/products/m-d |
| 【中深煎り】恵比寿シティ | ¥1,000 | https://sarutahiko.jp/products/m-ec |
| 【中煎り】TOKYO ’til Infinity | ¥1,200 | https://sarutahiko.jp/products/m-t-spring2026 |

## Full catalog

- [<8/11より順次発送>【浅煎り】ホンジュラス／La Orquidea Pacas Anaerobic Washed](https://sarutahiko.jp/products/m-hon20260807-mame) — ¥1,380 / 100g ✓
- [<8/12より順次発送>【浅煎り】コロンビア／Peñas Blancas Geisha Washed](https://sarutahiko.jp/products/m-col20260711) — ¥2,980 / 50g ✓
- [【オンラインショップ限定】巣ごもりブレンド(500g)](https://sarutahiko.jp/products/m-su500) — ¥3,000 / 500g ✓
- [【中深煎り】サンフレッチェ広島×猿田彦珈琲](https://sarutahiko.jp/products/m-hiroshima) — ¥1,150 / 100g ✓
- [【中深煎り】恵比寿シティ](https://sarutahiko.jp/products/m-ec) — ¥1,000 / 100g ✓
- [【中深煎り】花火ブレンド](https://sarutahiko.jp/products/m-hana2026) — ¥1,200 / 100g ✓
- [【中煎り】TOKYO ’til Infinity](https://sarutahiko.jp/products/m-t-spring2026) — ¥1,200 / 100g ✓
- [【浅煎り】ケニア／Marua AA](https://sarutahiko.jp/products/m-ken260717) — ¥1,680 / 100g ✓
- [【浅煎り】バレルエイジドブラジル∕ Monte Alegre Anaerobic with Yeast](https://sarutahiko.jp/products/m-balbra20260723) — ¥1,580 / 100g ✓
- [【浅煎り】パナマ／Janson Los Alpes Geisha Washed Lot770](https://sarutahiko.jp/products/m-pan260717) — ¥3,080 / 50g ✓
- [【浅煎り】ブラジル／Boa Vista Catuai Pulped Natural 2025COE#2](https://sarutahiko.jp/products/m-braboa260530) — ¥2,080 / 100g ✓
- [【浅煎り】ブラジル／Um Yellow Bourbon Anaerobic Natural](https://sarutahiko.jp/products/m-braum260529) — ¥1,580 / 100g ✓
- [【深煎り】ディカフェ エチオピア／Bombe Natural](https://sarutahiko.jp/products/m-de-251228) — ¥980 / 100g ✓
- [【深煎り】バレルエイジド   グアテマラ／San Cristobal Natural](https://sarutahiko.jp/products/m-balgua20260723) — ¥1,580 / 100g ✓
- [【深煎り】大吉ブレンド](https://sarutahiko.jp/products/m-d) — ¥980 / 100g ✓
- [【深煎り】猿田彦フレンチ](https://sarutahiko.jp/products/m-stf) — ¥1,080 / 100g ✓

## Excluded (not whole-bean singles)

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
- ＜送料込み＞ブレンド飲み比べ3種セット【花火ブレンド】 — bundle/set excluded
- ＜送料込み＞芳醇でリッチなコーヒー豆 飲み比べ2種セット — bundle/set excluded
