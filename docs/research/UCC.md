# UCC（上島珈琲）— Research Notes

**Scraped:** 2026-08-08  
**Source:** https://store.ucc.co.jp/  
**Chain ID:** `ucc`

## 公式EC

| チャネル | URL |
|---------|-----|
| UCC ONLINE STORE | https://store.ucc.co.jp/ |
| コーヒー豆カテゴリ | https://store.ucc.co.jp/category/ITEM_210/ |
| 上島珈琲店 | https://store.ucc.co.jp/category/BRAND_10/ |
| 珈琲探究 | https://store.ucc.co.jp/category/BRAND_17/ |
| ゴールドスペシャル | https://store.ucc.co.jp/category/BRAND_2/ |
| GOLD SPECIAL PREMIUM | https://store.ucc.co.jp/category/BRAND_36/ |
| MOUNTAIN MIST | https://store.ucc.co.jp/category/BRAND_12/ |
| フェアトレード | https://store.ucc.co.jp/category/BRAND_33/ |

※ 旧「COFFEE STYLE UCC」「上島珈琲店 オンラインショップ」は UCC ONLINE STORE に統合済み。

## スクレイピング方針

1. サイトマップ `ext/sitemap.xml` + カテゴリ `ITEM_210` から SKU 収集
2. 商品名に `（豆）` を含む単品のみ（セット・粉は除外）
3. 各商品ページの **JSON-LD Product** から価格・説明を取得
4. レート: 0.5〜1 req/sec（`scripts/scrape_ucc_beans.py`）

## カタログ概要（54 品目）

| シリーズ | 件数 | 代表商品 |
|---------|------|---------|
| 上島珈琲店 | 12 | 上島珈琲店ブレンド、Bow-tie's pour、Black Amber Drop |
| 珈琲探究 | 4 | モカ・コロンビア・マンデリン・ブルーマウンテン |
| ゴールドスペシャル / PREMIUM | 6 | スぺシャルブレンド、ベリーフルーティ、ローステッドナッツ |
| フェアトレード / ヒルス / 進和 / デカフェ | 7 | キリマンジャロ、デカフェ ブラジル |
| MOUNTAIN MIST スペシャルティ | 9 | ケニア、ハワイコナ、ブルーマウンテン No.1 |
| 業務用ライン | 15 | カフェネイチャー、極味、グランゼ 等 |

**EC非掲載（粉のみ）:** 職人の珈琲、ゴールドスペシャル まろやか/コク/アイス 等

## MVP seeds（3）

| 商品 | product_id |
|------|------------|
| 【直営店限定】上島珈琲店ブレンド 250g（豆） | UCT0600000 |
| UCC 珈琲探究 炒り豆 モカブレンド 140g（豆） | TAN0600003 |
| UCC ゴールドスペシャル 炒り豆 スぺシャルブレンド 230g（豆） | GSP0600001 |

## 実行

```powershell
py -3 -S scripts/scrape_ucc_beans.py
py -3 -S scripts/merge_catalog.py
```
