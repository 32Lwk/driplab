# スクレイピング方針

## 原則

1. **展示・審査の正は手動シード**（`data/seeds/`）。スクレイパーは更新・拡張用。
2. **利用規約・robots.txt を確認**し、禁止されている場合は手動入力のみ。
3. **アクセス頻度を抑える**（1 サイト 1 req/sec 以下、バッチは夜間）。
4. **生 HTML は保存しない**（必要最小の JSON のみ）。画像は URL 参照。
5. エントリー資料に「データ出典: 各社公式サイト（取得日）」を明記。

## チェーン別調査タスク

| チェーン | 想定 URL | 優先度 | 想定難易度 | 備考 |
|----------|----------|--------|------------|------|
| スターバックス | オンラインストア コーヒー豆 | P0 | 中 | 構造比較的安定 |
| カルディ | 公式 EC コーヒー | P0 | 中 | 商品数多い |
| 丸山コーヒー | オンラインショップ | P1 | 中 | |
| タリーズ | オンラインストア | P1 | 中 | |
| ドトール | EC / 商品情報 | P2 | **高** | 豆ラインナップ薄い可能性 |

## スクレイパー構成

```
scrapers/
├── common/
│   ├── fetch.py       # レート制限付き HTTP
│   ├── normalize.py   # 共通正規化
│   └── roast_map.py   # 焙煎度マッピング
├── starbucks/
│   ├── scrape.py
│   └── parser.py
├── maruyama/
├── doutor/
├── tullys/
├── kaldi/
└── merge_catalog.py   # seeds + scraped → catalog/beans.json
```

## 取得フィールド（最小）

- 商品名
- 説明文（フレーバーノート）
- 価格（任意）
- 容量
- 購入 URL
- 画像 URL（任意）

## 正規化パイプライン

```
raw.json
  → 重複排除（chain_id + name）
  → roast_level マッピング
  → flavor_tags 抽出（キーワード辞書）
  → acidity/body/bitterness/sweetness スコアリング（ルール）
  → catalog/beans.json
```

### フレーバーノート → スコア（例）

| キーワード | acidity | body | bitterness |
|------------|---------|------|------------|
| 柑橘 / レモン | +20 | | |
| チョコ / カカオ | | +15 | +10 |
| ナッツ | | +10 | |
| フローラル | +10 | -5 | |

## 実行方法（案）

```bash
# 1 チェーン実行
python scrapers/starbucks/scrape.py --out data/scraped/starbucks/raw.json

# 全チェーン + マージ
python scrapers/run_all.py
python scrapers/merge_catalog.py
```

## 法務・表示

- アプリ内に「商品情報は各社公式サイトを参照しています」
- 商標: スターバックス、タリーズ等は各社の商標
- 非 affiliation: 各チェーンとの提携はない旨（必要なら）

## フォールバック

| 状況 | 対応 |
|------|------|
| scraper 失敗 | seed JSON を API が読む |
| サイト構造変更 | 該当 chain の seed のみ更新 |
| buy_url 404 | 定期チェック script（Week 3） |
