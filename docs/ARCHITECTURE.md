# アーキテクチャ

## 構成図

```
┌─────────────────────────────────────────────────────────┐
│  Browser (Guest)                                        │
│  Next.js App (packages/web)                             │
│  - Mood sliders (4 axes)                                │
│  - Equipment selector                                   │
│  - Result: bean + recipe + buy link                     │
└───────────────────────┬─────────────────────────────────┘
                        │ REST / JSON
┌───────────────────────▼─────────────────────────────────┐
│  API (packages/api) — Cloud Run                         │
│  POST /recommend  { mood, equipment[] }                 │
│  GET  /beans      ?chain=starbucks                      │
│  GET  /health                                           │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ recommender  │ │ beans.json   │ │ recipes.json │
│ (pure TS/Py) │ │ (catalog)    │ │ (per method) │
└──────────────┘ └──────────────┘ └──────────────┘

┌─────────────────────────────────────────────────────────┐
│  Offline: scrapers/ (Python or Node)                  │
│  chain-specific → data/scraped/raw/ → normalize         │
└─────────────────────────────────────────────────────────┘
```

## パッケージ構成

```
driplab/
├── packages/
│   ├── web/          # Next.js 14+ App Router
│   ├── api/          # Fastify or Hono on Cloud Run
│   └── recommender/  # スコアリング・レシピ生成（共通ライブラリ）
├── scrapers/         # チェーン別スクレイパー
├── data/
│   ├── seeds/        # 手動シード（展示の正）
│   └── scraped/      # スクレイピング生データ
└── docs/
```

## 技術選定

| レイヤ | 選定 | 理由 |
|--------|------|------|
| フロント | Next.js 14+ | 医薬品ツールと同系、SSG/ISR 可 |
| API | Hono + Cloud Run | 軽量、GCP 既存知見 |
| スクレイパー | Python (httpx + BeautifulSoup) | 5 サイト並行開発しやすい |
| データ（MVP） | 静的 JSON | デプロイ簡単、審査安定 |
| ホスティング | Cloud Run + `coffee.yutok.dev` | 設定済み（2026-08-08） |

## API 設計（MVP）

### `POST /api/recommend`

**Request**

```json
{
  "mood": {
    "alertness": 70,
    "acidity_pref": 40,
    "body_pref": 60,
    "sweetness_pref": 50
  },
  "equipment": ["drip", "french_press"]
}
```

**Response**

```json
{
  "primary": {
    "chain": "kaldi",
    "product_name": "モカマタリ",
    "roast_level": "medium",
    "buy_url": "https://...",
    "match_score": 0.87,
    "recipe": {
      "method": "drip",
      "grind": "medium-fine",
      "coffee_g": 15,
      "water_ml": 240,
      "water_temp_c": 92,
      "time_sec": 150,
      "notes": "最初は30ml注いで30秒蒸らし"
    },
    "reason": "覚醒度が高めのため、カフェインとコクのバランスが良い中深煎りを選びました。"
  },
  "alternatives": [ "... 2 items ..." ]
}
```

## デプロイ

| 環境 | URL | 用途 |
|------|-----|------|
| local | localhost:3000 | 開発 |
| staging | `coffee-staging.yutok.dev`（案） | 動画撮影 |
| prod | `coffee.yutok.dev` | エントリー提出（設定済み 2026-08-08） |

## セキュリティ（MVP）

- 認証なし（ゲスト）
- CORS: 本番ドメインのみ
- スクレイパーは API サーバーに同梱しない（オフライン実行）
- レート制限: Cloud Run + 必要なら Cloud Armor
