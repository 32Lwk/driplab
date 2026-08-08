# ドトールコーヒー データ調査レポート

調査日: 2026-08-08  
調査者: DripLab プロジェクト  
結論: **MVP に十分な豆データあり（オンラインショップで 12 品目）。スクレイピング実施可能。**

---

## 1. エグゼクティブサマリー

当初の懸念「ドトールは豆情報が少ない」は **半分正しく半分誤り** でした。

| 観点 | 結果 |
|------|------|
| 公式 EC の豆（ホール） | **12 品目**（ブレンド 5 + ストレート 6 + カフェインレス 1） |
| 味わい・焙煎度の構造化 | **公式に記載あり**（レコメンドに直結） |
| 購入 URL | 全商品で取得可能 |
| スクレイピング | `robots.txt` 上 **許可**（`*.csv` のみ禁止） |
| 店舗限定豆 | EC にない品目あり（後述） |

**DripLab MVP 方針（確定）**

- データソース: `https://onlineshop.doutor.co.jp`
- MVP seed: **3 品目**（マイルド / ゴールデンモカ / キリマンジャロ）
- フル catalog: 12 品目すべて `data/scraped/doutor/beans_raw.json` に取得済み

---

## 2. データソース

### 2.1 公式オンラインショップ（主数据源）

| 項目 | 内容 |
|------|------|
| URL | https://onlineshop.doutor.co.jp |
| プラットフォーム | EC-CUBE（CSRF トークンあり） |
| 商品総数 | 58 件（全カテゴリ） |
| コーヒー豆（ホール） | **12 件** |
| 会員 | なしでも購入可（ゲスト可） |

### 2.2 店舗サイト（補助）

| URL | 用途 |
|-----|------|
| https://www.doutor.co.jp/dcs/ | ブランド・メニュー情報 |
| https://www.doutor.co.jp/dcs/service/list/regularcoffee.html | ギフトセット（店舗宅配） |
| https://www.doutor.co.jp/news/2026priceDCS.pdf | **店舗販売**豆価格表（2026/7/23〜） |

店舗 PDF には EC にない「イタリアンエスプレッソ」「アイスコーヒー（豆）」等があるが、**DripLab は購入 URL 必須**のため EC 12 品目を正とする。

### 2.3 robots.txt

```
User-agent: *
Disallow: /*.csv$
Sitemap: https://onlineshop.doutor.co.jp/sitemap.xml
```

- 商品ページ `/products/detail/{id}` は **Disallow なし**
- sitemap.xml は取得時 500 エラー（2026-08-08 時点）→ 一覧ページから ID 収集で代替

---

## 3. 取得可能な豆一覧（12 品目）

### 3.1 ブレンド（5 品目）

| ID | 商品名 | 容量 | 価格(税込) | 焙煎度 | 味わい | 購入 URL |
|----|--------|------|------------|--------|--------|----------|
| 19 | マイルドブレンド | 500g | ¥2,781 | ハイロースト（中深煎） | バランス | [detail/19](https://onlineshop.doutor.co.jp/products/detail/19) |
| 20 | ロイヤルクリスタルブレンド | 500g | ¥3,230 | ハイロースト（中深煎） | すっきり | [detail/20](https://onlineshop.doutor.co.jp/products/detail/20) |
| 21 | ゴールデンモカブレンド | 500g | ¥2,850 | ミディアムロースト（中煎） | まろやか | [detail/21](https://onlineshop.doutor.co.jp/products/detail/21) |
| 22 | ハワイコナブレンド | 200g | ¥3,380 | フレンチロースト（極深煎） | コク | [detail/22](https://onlineshop.doutor.co.jp/products/detail/22) |
| 27 | ブルーマウンテンブレンド | 200g | ¥3,380 | ミディアムロースト（中煎） | すっきり・バランス | [detail/27](https://onlineshop.doutor.co.jp/products/detail/27) |

### 3.2 ストレート（6 品目）

| ID | 商品名 | 容量 | 価格(税込) | 焙煎度 | 味わい | 購入 URL |
|----|--------|------|------------|--------|--------|----------|
| 26 | カフェヨーロピアン | 200g | ¥1,130 | シティロースト（深煎） | バランス・コク | [detail/26](https://onlineshop.doutor.co.jp/products/detail/26) |
| 29 | キリマンジャロ | 200g | ¥1,200 | ミディアムロースト（中煎） | すっきり・キレ | [detail/29](https://onlineshop.doutor.co.jp/products/detail/29) |
| 30 | モカ | 200g | ¥1,200 | ミディアムロースト（中煎） | まろやか | [detail/30](https://onlineshop.doutor.co.jp/products/detail/30) |
| 32 | マンデリン | 200g | ¥1,290 | ミディアムロースト（中煎） | まろやか・コク | [detail/32](https://onlineshop.doutor.co.jp/products/detail/32) |
| 243 | ケニア | 200g | ¥1,290 | シティロースト（深煎） | バランス・すっきり | [detail/243](https://onlineshop.doutor.co.jp/products/detail/243) |
| 244 | グアテマラ | 200g | ¥1,260 | シティロースト（深煎） | バランス・コク | [detail/244](https://onlineshop.doutor.co.jp/products/detail/244) |

### 3.3 その他（1 品目）

| ID | 商品名 | 容量 | 価格(税込) | 備考 |
|----|--------|------|------------|------|
| 236 | カフェインレス | 200g | ¥1,420 | カフェイン 94% カット |

---

## 4. 商品ページのデータ構造（スクレイピング用）

### 4.1 HTML セレクタ

| フィールド | セレクタ / ソース |
|------------|-------------------|
| 商品名 | `h1.DoutorProductDetail__Name` |
| カテゴリ | `p.DoutorProductDetail__Category` |
| 価格 | `p.DoutorProductDetail__AfterPrice span` |
| 商品コード | `p.DoutorProductDetail__Code` |
| 説明（構造化） | `div.DoutorProductDetail__Content` |
| 商品画像 | `div.DoutorProductDetail__Image img`（swiper 1 枚目） |
| OG 説明（バックアップ） | `meta[property="og:description"]` |

### 4.2 説明文の固定フォーマット

各豆ページに以下が **必ず** 含まれる:

```
焙煎度　　{ロースト名（日本語）}
味わい　　{バランス | すっきり | まろやか | コク | 複合}
{フレーバーノート本文}
＜容量＞ {数値}g
```

**DripLab へのマッピング**

| ドトール「味わい」 | alertness | acidity | body | sweetness |
|-------------------|-----------|---------|------|-----------|
| すっきり・キレ | 中 | 高 | 低 | 中 |
| バランス | 中 | 中 | 中 | 中 |
| まろやか | 低 | 中 | 中 | 高 |
| コク | 高 | 低 | 高 | 低 |

| ドトール「焙煎度」 | roast_level |
|-------------------|-------------|
| ミディアムロースト | medium |
| ハイロースト / シティロースト | medium_dark |
| フレンチロースト | dark |

---

## 5. EC に含まれない商品（参考）

店舗 PDF（2026/7/23 改定）にのみ存在:

- イタリアンエスプレッソ（200g ¥1,210）
- アイスコーヒー（200g ¥1,240）
- 200g 版メインブレンド（EC は 500g のみ）

ギフト限定:

- 香り華やぐゲイシャブレンド（リキッドセットのみ、単品豆なし）

**対応**: エスプレッソ器具選択時は「カフェヨーロピアン」「ハワイコナブレンド」等、深煎り・コク系をルールで推奨。

---

## 6. スクレイピング実装方針

### 6.1 推奨フロー

```
1. GET /products/list?category_id=1&pageno={n}
2. /products/detail/(\d+) を抽出
3. 各 detail ページで category=コーヒー豆 & 名称に「（豆）」
4. 正規化 → data/catalog/beans.json
```

### 6.2 注意事項

| 項目 | 対策 |
|------|------|
| レート制限 | 1 req / 0.5 sec 以上 |
| CSRF | GET のみ（読取）なら不要 |
| 価格改定 | 2026/7/23 実施済み。定期バッチ or 手動確認 |
| 在庫切れ | `no-stock-msg` クラスを検出 → `available: false` |
| 法務表示 | 「出典: ドトールオンラインショップ（取得日）」 |

### 6.3 取得済み raw データ

`data/scraped/doutor/beans_raw.json`（12 件、2026-08-08 取得）

各レコードに以下を追加済み:

| フィールド | 内容 |
|------------|------|
| `weight_g` | 商品名 / OG 説明の `＜容量＞` から抽出（500g × 3、200g × 9） |
| `image_url` | `DoutorProductDetail__Image` 内の先頭 `img[src]`（絶対 URL） |
| `image_local` | `data/images/doutor/{product_id}.jpg` |

### 6.4 画像ダウンロード

```bash
py -3 scrapers/doutor/scrape.py
```

- 保存先: `data/images/doutor/{product_id}.jpg`（12 ファイル）
- レート制限: 0.5 sec / req（詳細ページ + 画像）
- 実行結果（2026-08-08）: **12/12 画像取得成功**

---

## 7. MVP seed 推奨 3 品目

気分スライダー × レコメンドの **バランスよくカバー** する組み合わせ:

| # | 商品 | 選定理由 |
|---|------|----------|
| 1 | **マイルドブレンド 500g** | 定番・バランス型。覚醒度中程度のデフォルト提案 |
| 2 | **ゴールデンモカブレンド 500g** | まろやか・甘酸っぱさ。甘さ・リラックス系 |
| 3 | **キリマンジャロ 200g** | すっきり・酸味・キレ。覚醒・酸味好み系 |

---

## 8. 他チェーンとの比較（ドトールの強み）

| 強み | 内容 |
|------|------|
| 構造化メタデータ | 「焙煎度」「味わい」が公式ラベル |
| フレーバーノート | 比喩的だが具体的（シトラス、ベリー、チョコ等） |
| 価格帯 | ¥1,130〜3,380 と幅広い |
| 自社農園ストーリー | マウカメドウズ（ハワイコナ） |

| 弱み | 内容 |
|------|------|
| 品目数 | スタバ・カルディより少ない（12 vs 数十） |
| 500g / 200g 混在 | 正規化時に `weight_g` 必須 |
| 店舗独自豆 | EC に載らない |

---

## 9. 次のアクション

- [x] EC 調査完了
- [x] 12 品目 raw JSON 取得
- [x] `scrapers/doutor/scrape.py` 実装（画像 DL + weight_g 補完）
- [x] `doutor.beans.seed.json` に MVP 3 品目 + `image_url` / `image_local`
- [ ] 正規化ルールを `scrapers/common/roast_map.py` に共通化

---

## 10. 参考リンク

- オンラインショップ TOP: https://onlineshop.doutor.co.jp/
- FAQ（店舗との同一性）: https://onlineshop.doutor.co.jp/products/listhelp/faq
- 店舗豆価格 PDF: https://www.doutor.co.jp/news/2026priceDCS.pdf
- マウカメドウズ: https://www.doutor.co.jp/brand/mauka/
