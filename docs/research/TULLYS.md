# タリーズコーヒー データ調査レポート

調査日: 2026-08-08（更新: 店舗メニュー統合）  
調査者: DripLab プロジェクト  
結論: **EC 単体では 8 品目だが、店舗メニュー統合で 22 品目に拡張済み。画像取得済み。**

---

## 1. エグゼクティブサマリー

| 観点 | 結果 |
|------|------|
| 公式 EC の豆（ホール） | **8 品目**（伊藤園 EC の全 SKU 中、ホール豆のみ） |
| 店舗メニュー豆（200g/150g） | **21 品目**（blend + varietal） |
| **統合カタログ** | **22 品目**（EC 8 + 店舗のみ 14、7 品目は EC/店舗両方） |
| 品目が少ない原因 | **スクレイパー不具合ではなく、伊藤園 EC の品揃えが限定的** |
| 味わい・焙煎度 | テイスティングワード（英語）が EC 一部 / 店舗は og:description |
| 購入 URL | EC 品目は Ito En URL、店舗のみは menu ページ URL |
| 商品画像 | `data/images/tullys/` に 21 件ダウンロード済み |
| スクレイピング | `robots.txt` 上 **許可** |

**DripLab 方針（更新）**

- **EC データ**: `beans_ec.json` ← `scrapers/tullys/scrape_beans.py`
- **店舗メニュー**: `beans_store_menu.json` ← `scrapers/tullys/scrape_store_menu.py`
- **統合**: `beans_raw.json` ← `scrapers/tullys/merge_catalog.py`
- MVP seed: **ハウスブレンド / アニバーサリーブレンド / キリマンジャロ**（店舗定番を含む）

---

## 2. データソース

### 2.1 公式オンラインストア（主データ源）

| 項目 | 内容 |
|------|------|
| 公式案内 URL | https://www.tullys.co.jp/onlinestore/ |
| EC 実体 URL | https://shop.itoen.jp/tullyscoffee/index.html |
| 運営 | 伊藤園（ITOEN GROUP ONLINE MALL 内タリーズブランド） |
| 豆カテゴリ | `/shop/tullyscoffee/c/ctc01/` およびサブカテゴリ |
| コーヒー豆（ホール） | **8 件**（EC 全 42 SKU 中） |
| 副次 EC | 楽天公式店（https://www.rakuten.co.jp/tullyscoffee-official/）— 今回は伊藤園 EC を正とする |

### 2.2 公式サイト（補助）

| URL | 用途 |
|-----|------|
| https://www.tullys.co.jp/menu/beans/ | 店舗メニュー豆一覧（価格なし・購入 URL なし） |
| https://shop.tullys.co.jp/ | 店舗検索（EC ではない） |

店舗メニューには EC にない「ハウスブレンド」「モカジャバ」「エスプレッソクラシコ」等がある。**2026-08-08 より店舗メニューを補助カタログとして統合**（`purchase_channel: store`, `availability: ["store"]`）。

### 品目不足の根本原因

| 要因 | 詳細 |
|------|------|
| EC 運営 | 伊藤園モールはホール豆 **8 SKU のみ**（粉・ZIPS・ギフト中心） |
| 店舗定番 | ハウスブレンド 200g 豆は **店舗 ¥1,470**（2026/7/28 改定）だが EC 未掲載 |
| 楽天公式店 | 豆はアイスブレンド等少数。EC より品揃え少 |
| スクレイパー | カテゴリ 11 URL を巡回済み。**フィルタで落としているわけではない** |

**対応**: EC 8 品目を正（購入可能 URL）とし、店舗メニュー 21 品目でレコメンド幅を拡張。重複 7 品目は `availability: ["ec","store"]` でマージ。

### 2.3 robots.txt

**www.tullys.co.jp**

```
User-Agent: Googlebot
Sitemap: https://www.tullys.co.jp/sitemap.xml
```

- 一般 User-agent 向け Disallow なし（Googlebot のみ明記）
- sitemap はニュース・店舗情報中心（EC 商品 URL なし）

**shop.itoen.jp**

```
User-agent: *
Sitemap: https://shop.itoen.jp/cms/sitemap/www/Sitemap_0_Index.xml
```

- **Disallow なし** → 商品ページ取得可
- レート制限: 1 req/sec 以上の間隔を推奨

---

## 3. 取得可能な豆一覧（8 品目）

### 3.1 バライエタル / ストレート（5 品目）

| product_id | 商品名 | 容量 | 価格(税込) | 産地 | テイスティングワード | 購入 URL |
|------------|--------|------|------------|------|---------------------|----------|
| gTCJ-beans-260318-0001 | 【限定】タリーズ ブラジル バウ | 200g | ¥1,755 | ブラジル セラード | — | [detail](https://shop.itoen.jp/shop/tullyscoffee/g/gTCJ-beans-260318-0001/) |
| gTCJ-beans-260318-0002 | タリーズ ブラジル バウ イエローブルボン | 200g | ¥1,535 | ブラジル セラード | — | [detail](https://shop.itoen.jp/shop/tullyscoffee/g/gTCJ-beans-260318-0002/) |
| gTCJ-beans-260318-0003 | タリーズ ブラジル ファゼンダ バレ ド クリスタル | 200g | ¥1,845 | ブラジル ジアマンチーナ | — | [detail](https://shop.itoen.jp/shop/tullyscoffee/g/gTCJ-beans-260318-0003/) |
| gTCJ-beans-25080113 | キリマンジャロ KIBO タリメ スイートウォッシュド | 200g | ¥1,755 | タンザニア タリメ | — | [detail](https://shop.itoen.jp/shop/tullyscoffee/g/gTCJ-beans-25080113/) |
| gTCJ-beans-25080103 | コスタリカ ラ ミニータ ウェットミル スイートウォッシュド | 200g | ¥1,755 | コスタリカ タラス | Clean, Smooth, Bright | [detail](https://shop.itoen.jp/shop/tullyscoffee/g/gTCJ-beans-25080103/) |

### 3.2 ブレンド（2 品目）

| product_id | 商品名 | 容量 | 価格(税込) | 産地 | テイスティングワード | 購入 URL |
|------------|--------|------|------------|------|---------------------|----------|
| gTCJ-beans-260805-0001 | タリーズ アニバーサリーブレンド | 200g | ¥1,800 | ブラジル・タンザニア・ペルー・インドネシア | Bright, Caramel, Complex | [detail](https://shop.itoen.jp/shop/tullyscoffee/g/gTCJ-beans-260805-0001/) |
| gTCJ-beans-260415-0003 | アイスコーヒーブレンド | 200g | ¥1,690 | ブラジル・グァテマラ・他 | — | [detail](https://shop.itoen.jp/shop/tullyscoffee/g/gTCJ-beans-260415-0003/) |

### 3.3 デカフェ（1 品目）

| product_id | 商品名 | 容量 | 価格(税込) | 産地 | テイスティングワード | 購入 URL |
|------------|--------|------|------------|------|---------------------|----------|
| gTCJ-beans-25080118 | デカフェ ブラジル IP農園 | 200g | ¥1,810 | ブラジル カルモ デ ミナス | Caramel, Sweet, Soft | [detail](https://shop.itoen.jp/shop/tullyscoffee/g/gTCJ-beans-25080118/) |

---

## 4. EC に含まれないが店舗メニューにある豆（参考）

`https://www.tullys.co.jp/menu/beans/` に掲載、EC 未販売の例:

- ハウスブレンド（EC には **400g 粉のみ** ¥3,060）
- モカジャバ / フレンチロースト / エスプレッソクラシコ
- エチオピア シダモ / スマトラ マンデリン / エチオピアモカ ウラガ
- ホンジュラス 森のエランディケ（季節限定）

**対応**: 深煎り・エスプレッソ系需要は EC「アイスコーヒーブレンド」「アニバーサリーブレンド」に加え、店舗データ「エスプレッソクラシコ」「フレンチロースト」「モカジャバ」でカバー。

---

## 4b. 統合カタログ（22 品目）

| 区分 | 件数 | 備考 |
|------|------|------|
| EC のみ | 1 | 限定パッケージ等 |
| EC + 店舗 | 7 | 名称正規化でマージ |
| 店舗のみ | 14 | ハウスブレンド、エスプレッソクラシコ等 |

取得ファイル:

- `data/scraped/tullys/beans_ec.json`（8 件）
- `data/scraped/tullys/beans_store_menu.json`（21 件）
- `data/scraped/tullys/beans_raw.json`（22 件・統合）
- `data/images/tullys/`（商品画像）

---

## 5. 商品ページのデータ構造（スクレイピング用）

### 5.1 HTML セレクタ

| フィールド | セレクタ / ソース |
|------------|-------------------|
| 商品名 | `meta[property="og:title"]` → `: タリーズ` を除去 |
| 価格 | `block-goods-price` 内 `N,NNN 円` |
| 豆/粉判定 | 仕様 `<table>` の `名称` 行（`レギュラーコーヒー（豆）`） |
| 産地 | 仕様表 `生豆生産国名` |
| フレーバー | 仕様表 `テイスティングワード`（英語カンマ区切り） |
| 容量 | 仕様表 `内容量` または商品名内 `200g` |
| 購入 URL | `/shop/tullyscoffee/g/{product_id}/` |

### 5.2 フィルタリングルール

EC カテゴリ `ctc01` には豆以外も混在（42 SKU）:

| 除外条件 | 例 |
|----------|-----|
| 名称が `（粉）` | ハウスブレンド 400g（粉） |
| シングルサーブ / ZIPS | ドリップバッグ系 |
| ギフト / セット | 複数商品セット |
| ティー | &TEA 商品 |

---

## 6. スクレイピング実装

### 6.1 推奨フロー

```
1. GET /shop/tullyscoffee/c/ctc01/ + サブカテゴリ（計 11 URL）
2. /shop/tullyscoffee/g/ リンクを重複排除
3. 各商品ページで 名称=レギュラーコーヒー（豆） を確認
4. 正規化 → data/scraped/tullys/beans_raw.json
```

### 6.2 注意事項

| 項目 | 対策 |
|------|------|
| レート制限 | 1 req / 1 sec（実装済み） |
| EC 運営主体 | 伊藤園。価格・在庫は Ito En 基準 |
| 名称フィールドの不整合 | 一部商品で `名称` が `（粉）` と誤記 → 商品名の `（豆）` で補正 |
| テイスティングワード | 全品目にはない（3/8 品目のみ） |
| 法務表示 | 「出典: タリーズ公式オンラインストア（伊藤園）（取得日）」 |

### 6.3 取得済み raw データ

- `data/scraped/tullys/beans_raw.json`（**22 件**、2026-08-08 統合）
- `data/seeds/tullys.beans.seed.json`（MVP 3 件: ハウスブレンド / アニバーサリーブレンド / キリマンジャロ）
- スクレイパー:
  - `scrapers/tullys/scrape_beans.py`（伊藤園 EC）
  - `scrapers/tullys/scrape_store_menu.py`（店舗メニュー）
  - `scrapers/tullys/merge_catalog.py`（統合）

---

## 7. MVP seed 推奨 3 品目

| # | 商品 | 選定理由 |
|---|------|----------|
| 1 | **ハウスブレンド 200g** | 店舗定番。バランス型・すっきり酸味 |
| 2 | **タリーズ アニバーサリーブレンド 200g** | 季節定番。Bright / Caramel / Complex |
| 3 | **キリマンジャロ KIBO タリメ 200g** | 単一産地・EC/店舗両方で購入可 |

---

## 8. 他チェーンとの比較

| 強み | 内容 |
|------|------|
| 産地情報 | 農園・地区レベルまで詳細 |
| テイスティングワード | 英語だが一貫した語彙（Bright, Caramel 等） |
| 価格帯 | ¥1,535〜1,845（200g 統一） |

| 弱み | 内容 |
|------|------|
| EC 品目数 | 伊藤園 EC は 8 品目のみ（**店舗統合で 22 品目に補完**） |
| 焙煎度ラベル | ドトールのような日本語焙煎度表記なし |
| 購入導線 | 店舗のみ 14 品目は EC URL なし（menu URL） |
| 二重 EC | 伊藤園 EC + 楽天。更新同期に注意 |

---

## 9. 次のアクション

- [x] EC 調査完了
- [x] 8 品目 EC raw JSON 取得
- [x] 店舗メニュー 21 品目 + 統合 22 品目
- [x] 商品画像ダウンロード
- [x] MVP seed 3 品目更新（ハウスブレンド含む）
- [ ] 定期バッチ（EC + store + merge）
- [ ] テイスティングワード → acidity/body スコア辞書を共通化

---

## 10. 参考リンク

- 公式オンラインストア案内: https://www.tullys.co.jp/onlinestore/
- EC TOP: https://shop.itoen.jp/tullyscoffee/index.html
- 豆カテゴリ: https://shop.itoen.jp/shop/tullyscoffee/c/ctc01/
- 店舗メニュー豆: https://www.tullys.co.jp/menu/beans/
- 楽天公式店: https://www.rakuten.co.jp/tullyscoffee-official/
