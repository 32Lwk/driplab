# 丸山珈琲 データ調査レポート

調査日: 2026-08-08  
調査者: DripLab プロジェクト  
結論: **MVP に十分な豆データあり（公式 EC で 51 品目のホール豆を確認）。スクレイピング実施済み。**

---

## 1. エグゼクティブサマリー

| 観点 | 結果 |
|------|------|
| 公式 EC の豆（ホール） | **51 品目**（ブレンド系 32 + シングルオリジン/スペシャルティ 17 + カフェインレス 2） |
| 味わい・焙煎度の構造化 | **公式に記載あり**（●チャート + フレーバーノート） |
| 購入 URL | 全商品で取得可能 |
| 商品画像 | **51/51** 取得済み（`og:image` → `data/images/maruyama/{id}.jpg`） |
| スクレイピング | `robots.txt` 上 **許可**（`/wp/wp-admin/` のみ Disallow） |
| 店舗限定豆 | 多数（通信販売限定表記あり） |

**DripLab MVP 方針（確定）**

- データソース: `https://www.maruyamacoffee.com/ec`
- MVP seed: **3 品目**（丸山珈琲のブレンド / モカブレンド 茜すみれ / サマンバイア ゲイシャ 中煎り）
- フル catalog: 51 品目すべて `data/scraped/maruyama/beans_raw.json` に取得済み

---

## 2. データソース

### 2.1 公式オンラインショップ（主数据源）

| 項目 | 内容 |
|------|------|
| URL | https://www.maruyamacoffee.com/ec |
| プラットフォーム | EC-CUBE 4 |
| コーヒー豆（ホール） | **51 件**（ドリップバッグ・リキッド・ギフトセット除外） |
| 会員 | なしでも購入可 |

**注意**: `chains.json` および旧資料の `https://www.maruyama-coffee.com/` は **DNS 未解決**（2026-08-08 時点）。正しい EC ドメインは **`maruyamacoffee.com`**（ハイフンなし）。

### 2.2 ブランドサイト（補助）

| URL | 用途 |
|-----|------|
| https://www.maruyamacoffee.com/ | コーポレート・店舗情報 |
| https://www.maruyamacoffee.com/ec/ | オンラインストア TOP |

### 2.3 robots.txt

```
User-agent: *
Disallow: /wp/wp-admin/
Allow: /wp/wp-admin/admin-ajax.php
```

- 商品ページ `/ec/products/detail/{id}` は **Disallow なし**
- sitemap.xml は `/ec/sitemap.xml` で **404**（2026-08-08）→ カテゴリ一覧から ID 収集で代替

---

## 3. 取得可能な豆一覧（51 品目）

### 3.1 ブレンド（32 品目）

| ID | 商品名 | 容量 | 価格(税抜) | 焙煎 | 産地/系統 | フレーバーノート | URL |
|----|--------|------|------------|------|-----------|------------------|-----|
| 2371 | 【オンラインストア限定/大容量】軽井沢ブレンド 深煎り 400g | 400g | ¥3,072 | 深煎り | 軽井沢 | ダークチョコレート、マカダミアナッツ    オンラインストア限定オリジナルブレン | [detail](https://www.maruyamacoffee.com/ec/products/detail/2371) |
| 3031 | 【大容量】さわやかブレンド 400g | 400g | ¥3,240 | 浅煎り | ブレンド | オレンジ、ハチミツの風味。爽やかな後味。 | [detail](https://www.maruyamacoffee.com/ec/products/detail/3031) |
| 3033 | 【大容量】アイス用ブレンド 400g | 400g | ¥3,240 | — | ブレンド |  | [detail](https://www.maruyamacoffee.com/ec/products/detail/3033) |
| 1049 | 【大容量】マルケンの恩返し 特選ブレンド 400g | 400g | ¥3,220 | — | ブレンド | ダークチョコレート、アーモンドの風味。クリーミーな質感。 | [detail](https://www.maruyamacoffee.com/ec/products/detail/1049) |
| 1169 | 【大容量】マルケンの恩返し 特選ブレンド 中深煎り 400g | 400g | ¥3,220 | 中深煎り | ブレンド | チェリー、ミルクチョコレートの風味。バランスの良い味わい。 | [detail](https://www.maruyamacoffee.com/ec/products/detail/1169) |
| 3032 | 【大容量】モカブレンド 茜すみれ 400g | 400g | ¥3,240 | — | モカ | 花の香りと柑橘類の爽やかな風味。 | [detail](https://www.maruyamacoffee.com/ec/products/detail/3032) |
| 3030 | 【大容量】丸山珈琲のブレンド 400g | 400g | ¥3,240 | — | ブレンド | ダークチョコレートのような風味。味わい深いコク。 | [detail](https://www.maruyamacoffee.com/ec/products/detail/3030) |
| 1131 | さわやかブレンド | 100g | ¥810 | 浅煎り | ブレンド | オレンジ、ハチミツの風味。爽やかな後味。 | [detail](https://www.maruyamacoffee.com/ec/products/detail/1131) |
| 52 | アイス用ブレンド | 100g | ¥810 | — | ブレンド |  | [detail](https://www.maruyamacoffee.com/ec/products/detail/52) |
| 3074 | アグロタケシ ゲイシャブレンド | 80g | ¥2,780 | — | アグロタケシ農園 ボリビア | イエローピーチ、ジャスミン、トロピカルフルーツ、洋梨 | [detail](https://www.maruyamacoffee.com/ec/products/detail/3074) |
| 3075 | アグロタケシ ブレンド | 80g | ¥1,935 | — | アグロタケシ | アプリコット、チェリー、メープルシロップ | [detail](https://www.maruyamacoffee.com/ec/products/detail/3075) |
| 1986 | アメリカン・ブレンド 浅煎り | 200g | ¥1,796 | 浅煎り | ブレンド | オレンジ、カシューナッツのような風味。軽やかで爽やかな味わい | [detail](https://www.maruyamacoffee.com/ec/products/detail/1986) |
| 201 | エスプレッソブレンド 中深煎り | 100g | ¥810 | 中深煎り | ブレンド | チョコレートやナッツを彷彿とさせる風味 | [detail](https://www.maruyamacoffee.com/ec/products/detail/201) |
| 3012 | カフェインレス 丸山珈琲のブレンド | 100g | ¥915 | — | ブレンド | チョコレートのような風味とコク、ほのかに感じる甘み | [detail](https://www.maruyamacoffee.com/ec/products/detail/3012) |
| 2146 | ハルニレテラスブレンド【ハルニレテラス店・通信販売限定】 | 100g | ¥810 | — | ブレンド | オレンジ、ナッツの風味。    ハルニレテラス店・通信販売限定 | [detail](https://www.maruyamacoffee.com/ec/products/detail/2146) |
| 2287 | フルーティーブレンド | 100g | ¥1,296 | — | ブレンド | トロピカルフルーツのような風味。甘い後口。 | [detail](https://www.maruyamacoffee.com/ec/products/detail/2287) |
| 26 | モカブレンド 茜すみれ | 100g | ¥810 | — | モカ | 花の香りと柑橘類の爽やかな風味。 | [detail](https://www.maruyamacoffee.com/ec/products/detail/26) |
| 2620 | モダンブレンド【軽井沢バイパス店・通信販売限定】 | 100g | ¥843 | 中深煎り | 軽井沢 | ダークチョコレート、アプリコット    軽井沢バイパス店・通信販売限定 | [detail](https://www.maruyamacoffee.com/ec/products/detail/2620) |
| 84 | リゾナーレオリジナルマイルドブレンド【リゾナーレ八ヶ岳店・通信販売限定】 | 100g | ¥810 | 中深煎り | ブレンド | オレンジ、チョコレート、ほのかにフローラルな風味。爽やかな味わいと深みのある余韻 | [detail](https://www.maruyamacoffee.com/ec/products/detail/84) |
| 24 | 丸山珈琲のブレンド | 100g | ¥810 | — | ブレンド | ダークチョコレートのような風味。味わい深いコク。 | [detail](https://www.maruyamacoffee.com/ec/products/detail/24) |
| 97 | 丸山珈琲のブレンド・クラシック1991【軽井沢本店・通信販売限定】 | 100g | ¥900 | 深煎り | 軽井沢 | ビターチョコ、キャラメルの風味。スパイシーな後味と重厚感。    軽井沢本店・通 | [detail](https://www.maruyamacoffee.com/ec/products/detail/97) |
| 85 | 八ヶ岳ブレンド〜満天の星空〜【リゾナーレ八ヶ岳店・通信販売限定】 | 100g | ¥810 | 中深煎り | ブレンド | ダークチョコレート、オレンジピールの風味。　    リゾナーレ八ヶ岳店・通信販売 | [detail](https://www.maruyamacoffee.com/ec/products/detail/85) |
| 2420 | 北千住ブレンド【北千住マルイ店・通信販売限定】 | 100g | ¥855 | — | ブレンド | ダークチェリー、ビターキャラメルの風味。なめらかな口当たり。    北千住マルイ | [detail](https://www.maruyamacoffee.com/ec/products/detail/2420) |
| 3067 | 名古屋ブレンド【名古屋栄店・通信販売限定】 | 100g | ¥843 | 中深煎り | 2026年6月11日 オープン！名古屋栄 | ビターキャラメル、オレンジピール、なめらかな口当たり    名古屋栄店・通信販売 | [detail](https://www.maruyamacoffee.com/ec/products/detail/3067) |
| 2226 | 夏のスペシャルブレンド | 100g | ¥915 | — | ブレンド | パッションフルーツ、イエローピーチ、ブラックティー、シロップのような口当たり   | [detail](https://www.maruyamacoffee.com/ec/products/detail/2226) |
| 86 | 小諸ブレンド【小諸店・通信販売限定】 | 100g | ¥810 | — | ブレンド | ミルクチョコ、オレンジ、キャラメルの風味。爽やかさと心地良い舌触り。    小諸 | [detail](https://www.maruyamacoffee.com/ec/products/detail/86) |
| 79 | 尾山台オリジナルブレンド【尾山台店・通信販売限定】 | 100g | ¥810 | 深煎り | ブレンド | ダークチョコレート、ダークチェリーの風味。　    尾山台店・通信販売限定 | [detail](https://www.maruyamacoffee.com/ec/products/detail/79) |
| 2249 | 日本橋ブレンド【日本橋店・通信販売限定】 | 100g | ¥843 | — | 日本 | ビターキャラメル、ヘーゼルナッツの風味。クリーミーな質感。    日本橋店・通信 | [detail](https://www.maruyamacoffee.com/ec/products/detail/2249) |
| 2500 | 渋谷ブレンド【エキュートエディション渋谷店・通信販売限定】 | 100g | ¥843 | — | ブレンド | ミルクチョコレート、アーモンドプラリネの風味。    エキュートエディション渋谷 | [detail](https://www.maruyamacoffee.com/ec/products/detail/2500) |
| 2309 | 立川ブレンド【立川店・通信販売限定】 | 100g | ¥843 | — | ブレンド | ダークチョコレート、ハーブの風味。すっきりとした後味。    立川店・通信販売限 | [detail](https://www.maruyamacoffee.com/ec/products/detail/2309) |
| 2311 | 自由が丘ブレンド【自由が丘店・通信販売限定】 | 100g | ¥843 | — | ブレンド | アーモンド、オランジェット、ベリーの風味。上品な味わい。    自由が丘店・通信 | [detail](https://www.maruyamacoffee.com/ec/products/detail/2311) |
| 80 | 西麻布ブレンド【西麻布店・通信販売限定】 | 100g | ¥810 | 深煎り | ブレンド | ダークチョコレート、ビターキャラメルの風味。奥行きのある味わい。　    西麻布 | [detail](https://www.maruyamacoffee.com/ec/products/detail/80) |
### 3.2 シングルオリジン / スペシャルティ（18 品目）

| ID | 商品名 | 容量 | 価格(税抜) | 焙煎 | 産地/系統 | フレーバーノート | URL |
|----|--------|------|------------|------|-----------|------------------|-----|
| 3035 | 【大容量】アルトシエロ 中深煎り 400g | 400g | ¥3,104 | 中深煎り | — | ローストナッツの風味、バランスの良い味わい | [detail](https://www.maruyamacoffee.com/ec/products/detail/3035) |
| 3034 | 【大容量】アルトシエロ 中煎り 400g | 400g | ¥3,104 | 中煎り | — | 花の様な香り、軽やかな口当たり | [detail](https://www.maruyamacoffee.com/ec/products/detail/3034) |
| 3036 | 【大容量】アルトシエロ 深煎り 400g | 400g | ¥3,104 | 深煎り | — | ダークチョコレートの深いコク、豊かな香り | [detail](https://www.maruyamacoffee.com/ec/products/detail/3036) |
| 3073 | アグロタケシ ゲイシャ 40g | 40g | ¥3,811 | — | アグロタケシ農園  ボリビア | ジャスミン、ライチ、シャインマスカット、青りんご、はちみつ、咲きこぼれる花々を思 | [detail](https://www.maruyamacoffee.com/ec/products/detail/3073) |
| 3110 | アグロタケシ ゲイシャ 80g【オンラインストア限定】 | 80g | ¥7,500 | — | アグロタケシ農園  ボリビア | ジャスミン、ライチ、シャインマスカット、青りんご、はちみつ、咲きこぼれる花々を思 | [detail](https://www.maruyamacoffee.com/ec/products/detail/3110) |
| 1935 | アルトシエロ 中深煎り | 200g | ¥1,552 | 中深煎り | — | ローストナッツの風味、バランスの良い味わい | [detail](https://www.maruyamacoffee.com/ec/products/detail/1935) |
| 1936 | アルトシエロ 中煎り | 200g | ¥1,552 | 中煎り | — | 花の様な香り、軽やかな口当たり | [detail](https://www.maruyamacoffee.com/ec/products/detail/1936) |
| 1937 | アルトシエロ 深煎り | 200g | ¥1,552 | 深煎り | — | ダークチョコレートの深いコク、豊かな香り | [detail](https://www.maruyamacoffee.com/ec/products/detail/1937) |
| 2228 | ウッドノート | 100g | ¥818 | 中煎り | — | アップル、アーモンド、爽やかな味わい    夏限定の中煎りブレンド  6月1日～ | [detail](https://www.maruyamacoffee.com/ec/products/detail/2228) |
| 3087 | サマンバイア ゲイシャ 中煎り | 80g | ¥2,000 | 中煎り | ブラジル　サマンバイア | ジャスミン、アプリコット、オレンジ、ミント、なめらかな口当たり | [detail](https://www.maruyamacoffee.com/ec/products/detail/3087) |
| 3062 | サマンバイア 中煎り | 100g | ¥1,037 | 中煎り | ブラジル　サマンバイア農園 | オレンジ、チェリー、ヌガー、なめらかな口当たり | [detail](https://www.maruyamacoffee.com/ec/products/detail/3062) |
| 3095 | サンタ・イサベル 深煎り | 100g | ¥907 | 深煎り | グアテマラ　サンタ・イサベル農園 | ダークチョコレート、レーズン | [detail](https://www.maruyamacoffee.com/ec/products/detail/3095) |
| 2982 | サンタ・テレサ2000 ゲイシャ 中煎り | 80g | ¥2,000 | 中煎り | コスタリカ　サンタ・テレサ2000マイク | アップル、イエローピーチ、レモングラス、はちみつ、香水のような香り | [detail](https://www.maruyamacoffee.com/ec/products/detail/2982) |
| 3096 | セロ・アルト SL28 中煎り | 100g | ¥1,574 | 中煎り | コスタリカ　セロ・アルトマイクロミル | ラズベリー、ピーチ、はちみつ、ジューシーな味わい | [detail](https://www.maruyamacoffee.com/ec/products/detail/3096) |
| 3089 | ドン・カルロス 深煎り | 100g | ¥907 | 深煎り | ボリビア　ドン・カルロス農園 | ダークチョコレート、ドライフィグ | [detail](https://www.maruyamacoffee.com/ec/products/detail/3089) |
| 3088 | ハナン 中煎り | 100g | ¥907 | 中煎り | ペルー　ハナン | オレンジ、ブラックティー | [detail](https://www.maruyamacoffee.com/ec/products/detail/3088) |
| 2018 | フェアトレードコーヒー ニカラグア 深煎り | 100g | ¥755 | 深煎り | ニカラグア | ダークチョコレート、スイートスパイスの風味。クリーミーな質感。 | [detail](https://www.maruyamacoffee.com/ec/products/detail/2018) |
| 2227 | ヴェルデ | 100g | ¥818 | 深煎り | — | ダークチョコレート、オレンジピール、すっきりとした苦み    夏限定の深煎りブレ | [detail](https://www.maruyamacoffee.com/ec/products/detail/2227) |
### 3.3 カフェインレス（2 品目）

| ID | 商品名 | 容量 | 価格(税抜) | 焙煎 | 産地/系統 | フレーバーノート | URL |
|----|--------|------|------------|------|-----------|------------------|-----|
| 3012 | カフェインレス 丸山珈琲のブレンド | 100g | ¥915 | — | ブレンド | チョコレートのような風味とコク、ほのかに感じる甘み | [detail](https://www.maruyamacoffee.com/ec/products/detail/3012) |
| 2747 | カフェインレスコーヒー 中煎り | 100g | ¥890 | 中煎り | カフェインレス | ミルクキャラメル、オレンジ | [detail](https://www.maruyamacoffee.com/ec/products/detail/2747) |

---

## 4. 商品ページのデータ構造（スクレイピング用）

### 4.1 HTML / JSON ソース

| フィールド | セレクタ / ソース |
|------------|-------------------|
| 商品名 | `meta[property="og:title"]` |
| 価格（税抜） | `em.price02_default` または `eccube.classCategories` 内 `"name":"豆"` の `price02` |
| 容量 | `select#classcategory_id1` の option（例: 80g, 100g, 200g, 400g） |
| 挽き目 | `select#classcategory_id2`（豆 / 粉 各種） |
| 説明 | `meta[property="og:description"]` |
| 商品画像 | `meta[property="og:image"]`（`/upload/save_image/`） |
| フレーバー | OG 説明内 `苦味：●… 香り：●…` 以降のテキスト |
| 産地 | OG 説明内 `＜{農園名}＞` または商品名 |

### 4.2 味わいチャート（全豆商品に共通）

```
苦味：●●●●
酸味：●●
コク：●●●
香り：●●●
{フレーバーノート}
```

**DripLab スコアリング（ルールベース）**

| ● の数（1-5） | 対応スコア目安 |
|---------------|----------------|
| 酸味 ●●●● | acidity 70-80 |
| コク ●●●● | body 65-75 |
| 苦味 ●●●● | bitterness 70-80 |

---

## 5. EC に含まれない / 除外した商品

以下は **ホール豆単品ではない** ため `beans_raw.json` から除外:

- ドリップバッグ / コーヒーバッグ
- リキッドコーヒー / カフェラテベース
- スイーツ・ギフトセット（豆 + 菓子）
- コーヒー器具・グッズ
- 複数袋セット（例: 400g 2袋 / 3袋）— 単品 400g は収録

---

## 6. スクレイピング実装

### 6.1 実行済みスクリプト

```
scripts/scrape_maruyama_beans.py   # デフォルト: 既存 raw の enhance / --full: 全件再取得
```

フロー:

1. カテゴリ ID（9, 52, 167-169 等）から product ID 収集（`--full` 時）
2. `/ec/products/detail/{id}` を 0.5 sec 間隔で GET
3. `eccube.classCategories` で「豆」オプション有無・`price02`・`stock_find` を判定
4. `og:image` をダウンロード → `data/images/maruyama/{product_id}.jpg`
5. `image_url` / `image_local` を `beans_raw.json` に付与
6. MVP seed を `data/seeds/maruyama.beans.seed.json` に同期

### 6.2 raw JSON フィールド（追加分）

| フィールド | 例 |
|------------|-----|
| `image_url` | `https://www.maruyamacoffee.com/ec/upload/save_image/0820143311_5f3e0b177adf7.jpg` |
| `image_local` | `data/images/maruyama/24.jpg` |

### 6.3 注意事項

| 項目 | 対策 |
|------|------|
| レート制限 | 1 req / 0.8 sec（実施済み） |
| 正しいドメイン | `maruyamacoffee.com`（`maruyama-coffee.com` は不可） |
| 在庫 | `classCategories` 内 `"name":"豆"` の `stock_find` で判定 |
| 100g / 200g / 400g 混在 | `weight_g` 必須 |
| 店舗限定 | 名称に「通信販売限定」— EC からは購入可 |
| 法務表示 | 「出典: 丸山珈琲オンラインストア（取得日）」 |

---

## 7. MVP seed 推奨 3 品目

| # | 商品 | 選定理由 |
|---|------|----------|
| 1 | **丸山珈琲のブレンド 100g** | 定番 No.1。深煎り・コク系のデフォルト提案 |
| 2 | **モカブレンド 茜すみれ 100g** | フローラル・柑橘系。酸味・香り好み向け |
| 3 | **サマンバイア ゲイシャ 中煎り 80g** | スペシャルティ SO。ジャスミン・果実味 |

seed ファイル: `data/seeds/maruyama.beans.seed.json`

---

## 8. 他チェーンとの比較（丸山珈琲の強み）

| 強み | 内容 |
|------|------|
| 品目数 | 51 品目（ドトール 12 品目より多い） |
| スペシャルティ | ゲイシャ・アグロタケシ等の高単価 SO |
| 構造化メタデータ | 苦味/酸味/コク/香りの ● チャート |
| フレーバーノート | 具体的（ジャスミン、ダークチョコ、トロピカル等） |
| 産地情報 | 農園名・国名を OG 説明に記載 |

| 弱み | 内容 |
|------|------|
| 価格帯 | 100g ¥755〜、ゲイシャ 80g ¥7,500 と幅広い |
| 容量バリエーション | 40g / 80g / 100g / 200g / 400g 混在 |
| 店舗限定ブレンド | 名称上は限定だが EC 販売あり |

---

## 9. 次のアクション

- [x] EC 調査完了
- [x] 51 品目 raw JSON 取得
- [x] MVP seed 3 品目作成
- [x] 商品画像 51/51 ダウンロード・`image_url`/`image_local` 付与
- [ ] `scrapers/maruyama/scrape.py` へ Python スクリプト移植
- [ ] `chains.json` の website URL を `maruyamacoffee.com` に更新

---

## 10. 参考リンク

- オンラインストア TOP: https://www.maruyamacoffee.com/ec/
- コーヒー（豆・粉）カテゴリ: https://www.maruyamacoffee.com/ec/index.php/products/list?category_id=9
- 80-100g 一覧: https://www.maruyamacoffee.com/ec/index.php/products/list?category_id=167
- コーポレート: https://www.maruyamacoffee.com/
