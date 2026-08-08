# 小川珈琲 — Research Notes

**Scraped:** 2026-08-08  
**Source:** https://oc-shop.co.jp/  
**Chain ID:** `ogawa`

## 公式EC

| ショップ | URL |
|---------|-----|
| 小川珈琲オンラインショップ | https://oc-shop.co.jp/ |
| 豆コレクション | https://oc-shop.co.jp/collections/coffee-beans |

※ 旧ドメイン `ogawa-coffee.co.jp` は存在せず。正は **oc-shop.co.jp**（Shopify）。

## スクレイピング方針

1. Shopify JSON API: `/collections/coffee-beans/products.json?limit=250`
2. 採用: 商品名に `（豆）` / `豆 150g` / `No.XXX`（レギュラー豆）
3. 除外: 粉、ドリップ、生豆、サブスクリプション、ギフト、器具
4. 説明文: `body_html` の味わいコメント・◆評価からスコア推定
5. 詳細: `data/scraped/ogawa/scraping_notes.md`

## カタログ概要（72 品目）

| カテゴリ | 件数 | 例 |
|---------|------|-----|
| 小川珈琲店シリーズ（140g/500g） | 8 | 小川プレミアム、コーヒーショップ、ブルーマウンテン |
| 有機珈琲シリーズ | 6 | オリジナル、モカ、グアテマラ |
| スペシャルティ（150g） | 15 | ケニア、コスタリカ、エルサルバドル等 |
| ラボラトリー量り売り（100g） | 27 | no.00〜no.49 系 |
| 限定・高級（100–150g） | 4 | パナマ デボラ エリプス等 |
| まとめ買い・セット | 20 | ×5/×25/12個セット等 |

### EC非掲載（粉のみ等）

- キリマンジャロブレンド（粉 R043）
- 季節限定 春/夏/秋/冬珈琲（粉・ドリップ中心）

## MVP seeds（3）

| 商品 | product_id |
|------|------------|
| 小川プレミアムブレンド（豆）140g R025 | r-ocpremium-b |
| オーガニック エチオピア イルガチェフェ モカ（豆）150g No.932 | 932 |
| ブラジル ベレーダ（豆）150g No.959 | 959 |

## 実行

```powershell
node scripts/scrape_ogawa_beans.mjs
py -3 -S scripts/merge_catalog.py
```
