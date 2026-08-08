# タリーズコーヒー データ調査レポート

調査日: 2026-08-08  
調査者: DripLab プロジェクト  
結論: **21 品目の豆カタログを構築済み（EC 8 + 店舗限定 13）。スクレイピング実施可能。**

---

## 1. エグゼクティブサマリー

| 観点 | 結果 |
|------|------|
| 公式 EC の豆（ホール） | **8 品目**（バライエタル 5 + ブレンド 2 + デカフェ 1） |
| 店舗メニュー豆（ホール） | **21 品目**（バライエタル 10 + ブレンド 11） |
| マージ後カタログ | **21 品目**（重複統合後） |
| 味わい・焙煎度の構造化 | テイスティングワード（EC）+ 店舗 taste_column + 説明文キーワード |
| 購入 URL | EC 8 件は伊藤園 EC、店舗限定 13 件は店舗メニュー URL |
| 商品画像 | 全 21 件 `data/images/tullys/` にダウンロード済み |
| スクレイピング | `robots.txt` 上 **許可**（Disallow なし） |

**DripLab 方針（2026-08-08 更新）**

- データソース: 伊藤園 EC + 店舗メニュー + 楽天公式店（参考）
- MVP seed: **3 品目**（ハウスブレンド / アニバーサリーブレンド / キリマンジャロ）
- フル catalog: 21 品目 `data/scraped/tullys/beans_raw.json`

---

## 2. 根本原因（Root Cause）

**Ito En EC（`shop.itoen.jp/tullyscoffee`）はホール豆 SKU が約 8 件のみ。**

店舗メニュー（`tullys.co.jp/menu/beans/`）には EC にない定番豆が多数存在する:

| 店舗のみ（EC 未販売） | 例 |
|----------------------|-----|
| 定番ブレンド | ハウスブレンド、モカジャバ、フレンチロースト、エスプレッソクラシコ |
| 季節・限定ストレート | ホンジュラス 森のエランディケ、エチオピア シダモ G1 |
| その他 | クレセントムーン、マスターズノート、ブラック スリー 等 |

**なぜ EC が少ないか**

- 伊藤園運営 EC は「オンライン向け限定 SKU」中心。定番店舗豆の多くは EC 非掲載
- ハウスブレンド等は EC では **400g 粉のみ**（ホール豆なし）
- 楽天公式店もホール豆は EC 品目とほぼ重複。店舗定番のホール豆は **400g 粉** のみ販売

**DripLab 対応（Expansion Strategy）**

1. **伊藤園 EC** — ホール豆 8 件を正規データ源（`purchase_channel: "ec"`, buy_url → Ito En）
2. **店舗メニュー** — EC にない 13 件を追加（`purchase_channel: "store"`, buy_url → menu detail URL）
3. **楽天** — 200g ホール豆が見つかれば buy_url を上書き（現状 EC 品目と重複のみ）
4. **名前正規化でマージ** — 「タリーズ ブラジル バウ」と「【限定パッケージ】タリーズ ブラジル バウ」を統合
5. **画像** — EC og:image 優先、なければ店舗メニュー画像を `data/images/tullys/` に保存

---

## 3. データソース

### 3.1 公式オンラインストア（主データ源 — EC 8 件）

| 項目 | 内容 |
|------|------|
| 公式案内 URL | https://www.tullys.co.jp/onlinestore/ |
| EC 実体 URL | https://shop.itoen.jp/tullyscoffee/index.html |
| 運営 | 伊藤園（ITOEN GROUP ONLINE MALL 内タリーズブランド） |
| 豆カテゴリ | `/shop/tullyscoffee/c/ctc01/` およびサブカテゴリ |
| コーヒー豆（ホール） | **8 件**（EC 全 42 SKU 中） |

### 3.2 店舗メニュー（拡張データ源 — 21 件）

| URL | 用途 |
|-----|------|
| https://www.tullys.co.jp/menu/beans/ | 豆一覧（バライエタル 10 + ブレンド 11） |
| `/menu/beans/varietal/*.html` | ストレート詳細（説明文・原産地・価格・味わいレベル） |
| `/menu/beans/blend/*.html` | ブレンド詳細 |

店舗詳細ページから取得するフィールド:

| フィールド | セレクタ |
|------------|----------|
| 商品名 | `span.title-text` |
| 説明文 | `.common__description` または `meta[name=description]` |
| 原産地 | `.price_list` 内「原産地」行 |
| 価格・容量 | `.price_list` 内「200g」「150g」行 |
| 味わいレベル | `.taste_column` の `level_N`（すっきり感 / ボディ） |
| 画像 | `.thumbnail__pic_image img` |

### 3.3 楽天公式店（副次 — 参考）

| URL | 結果 |
|-----|------|
| https://www.rakuten.co.jp/tullyscoffee-official/ | ホール豆は EC 品目と重複。店舗定番は 400g 粉のみ |
| `beans_0004` | ハウスブレンド **400g 粉**（ホール豆ではない） |
| `beans_0007` | デカフェ 200g 豆（EC と同一） |

---

## 4. 取得済み豆一覧（21 品目）

### 4.1 EC 購入可（8 件 — `purchase_channel: "ec"`）

| product_id | 商品名 | 容量 | 価格(税込) |
|------------|--------|------|------------|
| gTCJ-beans-260318-0001 | 【限定】タリーズ ブラジル バウ | 200g | ¥1,755 |
| gTCJ-beans-260318-0002 | タリーズ ブラジル バウ イエローブルボン | 200g | ¥1,535 |
| gTCJ-beans-260318-0003 | タリーズ ブラジル ファゼンダ バレ ド クリスタル | 200g | ¥1,845 |
| gTCJ-beans-25080113 | キリマンジャロ KIBO タリメ スイートウォッシュド | 200g | ¥1,755 |
| gTCJ-beans-25080103 | コスタリカ ラ ミニータ ウェットミル スイートウォッシュド | 200g | ¥1,755 |
| gTCJ-beans-260805-0001 | タリーズ アニバーサリーブレンド | 200g | ¥1,800 |
| gTCJ-beans-260415-0003 | アイスコーヒーブレンド | 200g | ¥1,690 |
| gTCJ-beans-25080118 | デカフェ ブラジル IP農園 | 200g | ¥1,810 |

### 4.2 店舗購入のみ（13 件 — `purchase_channel: "store"`）

| product_id | 商品名 | 容量 | 店舗価格(税込) |
|------------|--------|------|----------------|
| menu-house_blend | **ハウスブレンド** | 200g | ¥1,470 |
| menu-mocha_java | モカジャバ | 200g | ¥1,580 |
| menu-french_roast | フレンチロースト | 200g | ¥1,580 |
| menu-espresso_classico | エスプレッソクラシコ | 200g | ¥1,580 |
| menu-blackthree | ブラック スリー | 200g | ¥1,580 |
| menu-piccolo_bambino | ピッコロバンビーノ | 200g | ¥1,470 |
| menu-cafe_au_lait_monire | カフェオレ モナーレ | 200g | ¥1,470 |
| menu-26cresent_moon | クレセントムーン | 200g | — |
| menu-26tls_masters_note | タリーズコーヒーマスターズノート | 200g | — |
| menu-26honduras_erandique | ホンジュラス 森のエランディケ | 200g | — |
| menu-26_ethiopia_sidamo_g1 | エチオピア シダモ G1 シャキッソウォッシュド | 150g | ¥1,870 |
| menu-26mandeheling_g1 | スマトラ マンデリン G1 リントンニフタ | 150g | ¥1,870 |
| menu-ethiopia_uraga | エチオピアモカ G1 ウラガ ナチュラル | 200g | — |

---

## 5. 商品ページのデータ構造（スクレイピング用）

### 5.1 伊藤園 EC

| フィールド | セレクタ / ソース |
|------------|-------------------|
| 商品名 | `meta[property="og:title"]` → `: タリーズ` を除去 |
| 価格 | `block-goods-price` 内 `N,NNN 円` |
| 豆/粉判定 | 仕様 `<table>` の `名称` 行 |
| 産地 | 仕様表 `生豆生産国名` |
| フレーバー | 仕様表 `テイスティングワード`（英語カンマ区切り） |
| 画像 | `meta[property="og:image"]` |

### 5.2 マージルール

```
1. 店舗メニュー 21 件をベースに収集
2. normalize_key(name) で EC 8 件をオーバーレイ（buy_url, price, tasting words 優先）
3. 説明文は EC comment > 店舗 common__description > 商品名
4. flavor_tags = EC tasting words + 店舗 taste_column + 説明文キーワード
5. 画像ダウンロード → image_url + image_local を全件に付与
```

---

## 6. スクレイピング実装

### 6.1 フロー

```
1. GET Ito En EC カテゴリ 11 URL → ホール豆 8 件
2. GET tullys.co.jp/menu/beans/ → 詳細 21 件
3. GET 楽天カテゴリ（参考）→ 200g ホール豆のみ
4. normalize_key でマージ → beans_raw.json
5. 画像ダウンロード → data/images/tullys/{product_id}.jpg
6. MVP seed 3 件生成（ハウスブレンド含む）
```

### 6.2 実行

```bash
python scrapers/tullys/scrape_beans.py
```

### 6.3 取得済みファイル

| ファイル | 内容 |
|----------|------|
| `data/scraped/tullys/beans_raw.json` | 21 件（2026-08-08 取得） |
| `data/seeds/tullys.beans.seed.json` | MVP 3 件（ハウスブレンド / アニバーサリーブレンド / キリマンジャロ） |
| `data/images/tullys/*.jpg` | 商品画像 21 件 |
| `scrapers/tullys/scrape_beans.py` | 統合スクレイパー |

---

## 7. MVP seed 推奨 3 品目

| # | 商品 | 選定理由 |
|---|------|----------|
| 1 | **ハウスブレンド** | 店舗定番 No.1。EC 未販売だが DripLab カタログで代表格として必須 |
| 2 | **タリーズ アニバーサリーブレンド 200g** | EC 購入可。4 国ブレンド、Bright / Caramel / Complex |
| 3 | **キリマンジャロ KIBO タリメ 200g** | EC 購入可。Africa ストレート代表 |

---

## 8. 他チェーンとの比較

| 強み | 内容 |
|------|------|
| 店舗メニュー詳細 | 原産地・価格・味わいレベル・説明文が充実 |
| 産地情報 | 農園・地区レベルまで詳細（EC 品目） |
| テイスティングワード | 英語語彙（Bright, Caramel 等） |

| 弱み | 内容 |
|------|------|
| EC 品目数 | ホール豆 8 件のみ（ドトール 12 品目より少ない） |
| 店舗定番の EC 欠如 | ハウスブレンド等はオンライン購入不可 |
| 二重 EC | 伊藤園 EC + 楽天。更新同期に注意 |
| 焙煎度ラベル | ドトールのような日本語焙煎度表記なし |

---

## 9. 次のアクション

- [x] EC 調査完了
- [x] 店舗メニュー 21 件調査完了
- [x] 21 品目 raw JSON + 画像取得
- [x] MVP seed 3 品目（ハウスブレンド含む）
- [x] 統合スクレイパー `scrapers/tullys/scrape_beans.py`
- [ ] 定期バッチに組込
- [ ] テイスティングワード → acidity/body スコア辞書を共通化

---

## 10. 参考リンク

- 公式オンラインストア案内: https://www.tullys.co.jp/onlinestore/
- EC TOP: https://shop.itoen.jp/tullyscoffee/index.html
- 豆カテゴリ: https://shop.itoen.jp/shop/tullyscoffee/c/ctc01/
- 店舗メニュー豆: https://www.tullys.co.jp/menu/beans/
- 楽天公式店: https://www.rakuten.co.jp/tullyscoffee-official/
