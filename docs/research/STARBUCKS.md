# スターバックス データ調査レポート

調査日: 2026-08-08  
調査者: DripLab プロジェクト  
結論: **MVP に十分な豆データあり（オンラインストアで 32 品目）。公開 API + 商品ページ JSON による取得が可能。**

---

## 1. エグゼクティブサマリー

| 観点 | 結果 |
|------|------|
| 公式 EC の豆（ホール / Whole Bean） | **32 品目**（CORE 16 + SEASONAL 5 + RESERVE 11） |
| 味わい・焙煎度の構造化 | **公式に記載あり**（bean_classification, whole_bean_acidity/body, product_keywords） |
| 購入 URL | 全商品で `menu.starbucks.co.jp/{JAN}` 形式 |
| スクレイピング | `robots.txt` 上 **Disallow なし**（全パス許可） |
| 100g 袋・セット商品 | ホール豆単品 250g が主。100g 袋は別 SKU（今回は whole bean 250g 中心） |

**DripLab MVP 方針（確定）**

- データソース: `https://menu.starbucks.co.jp`（オンラインストア在庫あり Whole Bean）
- MVP seed: **3 品目**（ライトノート / パイクプレイス / ケニア）
- フル catalog: 32 品目すべて `data/scraped/starbucks/beans_raw.json` に取得済み

---

## 2. データソース

### 2.1 公式オンラインストア（主数据源）

| 項目 | 内容 |
|------|------|
| ポータル | https://www.starbucks.co.jp/onlinestore/ |
| 商品カタログ | https://product.starbucks.co.jp/beans/（Vue SPA、API 経由で一覧） |
| 商品詳細 | https://menu.starbucks.co.jp/{item_code}（JAN コード） |
| 一覧 API | `GET https://menu.starbucks.co.jp/api/v1/list?category_code=beans&...` |
| コーヒー豆（ホール・オンラインストア） | **32 件** |
| 容量 | 250g（Reserve 高級品は同一） |
| 価格帯 | ¥1,480〜¥8,940（税込） |

### 2.2 関連サイト（参考）

| URL | 用途 |
|-----|------|
| https://www.starbucks.co.jp/coffee/roast.html | 焙煎度ガイド |
| https://www.starbucks.co.jp/reserve/roastery/onlinestore/coffee_beans/ | Reserve Roastery 限定（一部 EC 非掲載あり） |

### 2.3 robots.txt

```
Sitemap: https://www.starbucks.co.jp/sitemap.xml

User-Agent: *
（Disallow 行なし）
```

- `menu.starbucks.co.jp` も Disallow なし（2026-08-08 確認）
- ただし **利用規約・過度なアクセスは自己責任**。DripLab 方針どおり 1 req / 0.8 sec 以上を推奨

---

## 3. 取得可能な豆一覧（32 品目）

### 3.1 CORE COFFEE（16 品目）

| ID | 商品名 | 容量 | 価格(税込) | 焙煎度 | 購入 URL |
|----|--------|------|------------|--------|----------|
| 4524785492462 | スターバックス ライトノート ブレンド® | 250g | ¥1,480 | ブロンド | [詳細](https://menu.starbucks.co.jp/4524785492462) |
| 4524785492479 | ブレックファースト ブレンド | 250g | ¥1,480 | ミディアム | [詳細](https://menu.starbucks.co.jp/4524785492479) |
| 4524785492486 | サイレン ブレンド® | 250g | ¥1,590 | ミディアム | [詳細](https://menu.starbucks.co.jp/4524785492486) |
| 4524785492493 | ケニア | 250g | ¥1,740 | ミディアム | [詳細](https://menu.starbucks.co.jp/4524785492493) |
| 4524785492509 | パイクプレイス® ロースト | 250g | ¥1,480 | ミディアム | [詳細](https://menu.starbucks.co.jp/4524785492509) |
| 4524785492523 | グアテマラ アンティグア | 250g | ¥1,740 | ミディアム | [詳細](https://menu.starbucks.co.jp/4524785492523) |
| 4524785492547 | ハウス ブレンド | 250g | ¥1,480 | ミディアム | [詳細](https://menu.starbucks.co.jp/4524785492547) |
| 4524785492561 | ディカフェ ハウス ブレンド | 250g | ¥1,590 | ミディアム | [詳細](https://menu.starbucks.co.jp/4524785492561) |
| 4524785492578 | コロンビア | 250g | ¥1,740 | ミディアム | [詳細](https://menu.starbucks.co.jp/4524785492578) |
| 4524785379572 | TOKYO ロースト | 250g | ¥1,590 | ダーク | [詳細](https://menu.starbucks.co.jp/4524785379572) |
| 4524785492592 | スマトラ | 250g | ¥1,740 | ダーク | [詳細](https://menu.starbucks.co.jp/4524785492592) |
| 4524785492608 | コモド ドラゴン ブレンド® | 250g | ¥1,740 | ダーク | [詳細](https://menu.starbucks.co.jp/4524785492608) |
| 4524785492615 | カフェ ベロナ® | 250g | ¥1,590 | ダーク | [詳細](https://menu.starbucks.co.jp/4524785492615) |
| 4524785492639 | エスプレッソ ロースト | 250g | ¥1,590 | ダーク | [詳細](https://menu.starbucks.co.jp/4524785492639) |
| 4524785515079 | イタリアン ロースト | 250g | ¥1,480 | ダーク | [詳細](https://menu.starbucks.co.jp/4524785515079) |
| 4524785492653 | フレンチ ロースト | 250g | ¥1,480 | ダーク | [詳細](https://menu.starbucks.co.jp/4524785492653) |

### 3.2 SEASONAL COFFEE（5 品目）

| ID | 商品名 | 容量 | 価格(税込) | 購入 URL |
|----|--------|------|------------|----------|
| 4524785647589 | JAPAN'S 30TH ANNIVERSARY スマトラ マサ デパン Daisuke Kondo | 250g | ¥2,580 | [詳細](https://menu.starbucks.co.jp/4524785647589) |
| 4524785647596 | JAPAN'S 30TH ANNIVERSARY スマトラ マサ デパン Shogo Ota | 250g | ¥2,580 | [詳細](https://menu.starbucks.co.jp/4524785647596) |
| 4524785647602 | JAPAN'S 30TH ANNIVERSARY スマトラ マサ デパン nico ito | 250g | ¥2,580 | [詳細](https://menu.starbucks.co.jp/4524785647602) |
| 4524785557536 | スターバックス® カティ カティ ブレンド | 250g | ¥2,180 | [詳細](https://menu.starbucks.co.jp/4524785557536) |
| 4524785598683 | スターバックス® アイスコーヒー ブレンド | 250g | ¥1,980 | [詳細](https://menu.starbucks.co.jp/4524785598683) |

### 3.3 STARBUCKS RESERVE®（11 品目）

| ID | 商品名 | 容量 | 価格(税込) | 購入 URL |
|----|--------|------|------------|----------|
| 4524785647824 | ウガンダ マウント エルゴン | 250g | ¥3,580 | [詳細](https://menu.starbucks.co.jp/4524785647824) |
| 4524785643383 | ルワンダ アバクンダカワ | 250g | ¥2,970 | [詳細](https://menu.starbucks.co.jp/4524785643383) |
| 4524785637047 | コロンビア フィンカ ポトシ ブラック ハニー | 250g | ¥8,940 | [詳細](https://menu.starbucks.co.jp/4524785637047) |
| 4524785637054 | サンドライド ブラジル ファゼンダ サン ジョアン | 250g | ¥2,970 | [詳細](https://menu.starbucks.co.jp/4524785637054) |
| 4524785629387 | ナチュラル エチオピア チェレレクツ | 250g | ¥4,200 | [詳細](https://menu.starbucks.co.jp/4524785629387) |
| 4524785629394 | ニカラグア ブエノスアイレス マラゴジッペ | 250g | ¥4,200 | [詳細](https://menu.starbucks.co.jp/4524785629394) |
| 4524785478190 | プリンチ® ブレンド | 250g | ¥2,690 | [詳細](https://menu.starbucks.co.jp/4524785478190) |
| 4524785553880 | マイクロブレンド™ No.21 | 250g | ¥2,690 | [詳細](https://menu.starbucks.co.jp/4524785553880) |
| 4524785553873 | マイクロブレンド™ No.10 | 250g | ¥2,690 | [詳細](https://menu.starbucks.co.jp/4524785553873) |
| 4524785478183 | ディカフェ コスタリカ ハシエンダ アルサシア® | 250g | ¥2,980 | [詳細](https://menu.starbucks.co.jp/4524785478183) |
| 4524785557826 | STARBUCKS RESERVE® コーヒーセレクション | 250g | ¥5,767 | [詳細](https://menu.starbucks.co.jp/4524785557826) |

---

## 4. 商品ページのデータ構造（スクレイピング用）

### 4.1 取得フロー

```
1. GET menu.starbucks.co.jp/api/v1/list
   ?category_code=beans
   &grind_and_type=WHOLE_BEAN,WHOLE_BEAN_DECAF
   &purchase_methods=ONLINE_STORE
   &limit=100
2. 各 item_code で GET menu.starbucks.co.jp/{item_code}
3. HTML 内 data-page 属性（Inertia.js JSON）をパース
4. props.data._source からフィールド抽出
```

### 4.2 主要フィールドマッピング

| DripLab フィールド | ソース（`_source` 内） |
|-------------------|------------------------|
| product_id | `item_code`（JAN） |
| name | `item_name` |
| price_jpy | 一覧 API `price_in_vat` |
| weight_g | `spec_info.spec_infos[name=内容量]` |
| description | `description` |
| roast_label_ja | `attributes.bean_classification` → DEF.flags マップ |
| taste_label_ja | `memo` |
| flavor_tags | `attributes.compatible_flavors` + `product_keywords` |
| origin | `attributes.country_code_of_origin` + `blend_and_single_origin` |
| acidity/body | `attributes.whole_bean_acidity/body` → 0-100 スコア |
| buy_url | `https://menu.starbucks.co.jp/{item_code}` |
| image_url | 一覧 API `image_url`（`asset.menu.starbucks.co.jp/public/sku_images/...`） |
| image_local | `data/images/starbucks/{product_id}.jpg`（スクレイプ時にダウンロード） |

### 4.3 焙煎度マッピング

| スタバ公式 | roast_level |
|-----------|-------------|
| STARBUCKS_BLONDE_ROAST | light |
| STARBUCKS_MEDIUM_ROAST | medium |
| STARBUCKS_DARK_ROAST | dark |
| STARBUCKS_RESERVE | medium_dark |

### 4.4 味スコアリング（ルールベース）

| ソース | マッピング |
|--------|-----------|
| whole_bean_acidity LOW→HIGH | 30→80 |
| whole_bean_body LIGHT→FULL | 35→75 |
| roast_level | bitterness 25〜65 |
| 説明文キーワード（甘/チョコ等） | sweetness ±10 |

---

## 5. EC に含まれない商品（参考）

beans カテゴリ全体 106 件のうち、今回 **除外** したもの:

| 種別 | 例 | 除外理由 |
|------|-----|----------|
| オリガミ®（ドリップ） | パーソナルドリップ 各種 | grind_and_type ≠ WHOLE_BEAN |
| ヴィア®（インスタント） | コーヒーエッセンス各種 | インスタント |
| 100g 袋 | ライトノート (100g/袋) | 別 SKU（必要なら追加取得可） |
| セット・ギフト | コーヒースターターセット | 複数商品セット |
| Roastery 店舗限定 | ウィスキー バレル等 | ONLINE_STORE 非掲載 |

---

## 6. スクレイピング実装

### 6.1 実行方法

```bash
# Python（推奨）
PYTHONUTF8=1 python -S scripts/scrape_starbucks_beans.py
```

### 6.2 注意事項

| 項目 | 対策 |
|------|------|
| レート制限 | **0.8 sec / req**（32 品目 ≈ 30 秒） |
| 認証 | 不要（公開 API + 公開 HTML） |
| エンコーディング | Windows では `PYTHONUTF8=1` 推奨 |
| API limit | 最大 100 件/リクエスト |
| 季節商品 | SEASONAL は入替あり。定期バッチ推奨 |
| 商標 | ® / ™ を name に含む。表示時は各社ガイドライン遵守 |

### 6.3 出力ファイル

| ファイル | 内容 |
|----------|------|
| `data/scraped/starbucks/beans_raw.json` | 全 32 品目 raw（`image_url` / `image_local` 含む） |
| `data/images/starbucks/{product_id}.jpg` | 商品画像（32 件） |
| `data/seeds/starbucks.beans.seed.json` | MVP 3 品目 seed |
| `docs/research/STARBUCKS.md` | 本レポート |

---

## 7. MVP seed 選定理由

| seed ID | 商品 | 選定理由 |
|---------|------|----------|
| starbucks-light-note-blend-250g | ライトノート ブレンド | ブロンド（軽煎）。acidity/body 低め。初心者向け |
| starbucks-pike-place-roast-250g | パイクプレイス ロースト | 定番ミディアム。バランス型 |
| starbucks-kenya-250g | ケニア | シングルオリジン。酸味 HIGH。ドトール キリマンジャロと対比 |

---

## 8. ドトール調査との比較

| 項目 | ドトール | スターバックス |
|------|----------|----------------|
| 豆品目数 | 12 | 32 |
| 容量 | 200g / 500g | 250g 統一 |
| 価格帯 | ¥1,130〜¥3,380 | ¥1,480〜¥8,940 |
| 焙煎ラベル | 日本式（中煎/深煎等） | スタバ式（Blonde/Medium/Dark） |
| 味わいラベル | 固定 4 分類 | memo + フレーバーノート |
| API | なし（HTML 直パース） | **公開 JSON API あり** |
| 取得難易度 | 中 | 中（API 安定、詳細は Inertia JSON） |

---

## 9. 次のアクション

- [x] 32 品目スクレイピング完了
- [x] MVP seed 3 品目作成
- [x] 商品画像 32 件取得（一覧 API `image_url` → ローカル保存）
- [ ] `merge_catalog.py` で beans.json へマージ
- [ ] 定期バッチ（SEASONAL 入替監視）
- [ ] buy_url 死活監視（404 チェック）
