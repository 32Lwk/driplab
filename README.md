# DripLab

チェーン各社の豆情報と、その日の気分（スライダー入力）から、**パーソナライズされた豆と抽出方法**を提案する Web アプリ。

## 対象チェーン（MVP）

- スターバックス
- 丸山コーヒー
- ドトールコーヒー
- タリーズコーヒー
- カルディ

## ドキュメント

| ファイル | 内容 |
|----------|------|
| [docs/PLAN.md](docs/PLAN.md) | 全体計画・スケジュール |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 技術構成 |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | データモデル |
| [docs/SCRAPING.md](docs/SCRAPING.md) | スクレイピング方針 |
| [docs/RECOMMENDATION.md](docs/RECOMMENDATION.md) | レコメンドロジック |
| [docs/INFRA.md](docs/INFRA.md) | GCP / Cloudflare インフラ |
| [docs/CATALOG.md](docs/CATALOG.md) | **全155品目** 一覧 |
| [docs/research/](docs/research/) | チェーン別調査レポート |

## データ

| ファイル | 内容 |
|----------|------|
| `data/catalog/beans.json` | 全チェーン raw 統合（155品目） |
| `data/catalog/mvp_beans.json` | MVP レコメンド用（15品目） |
| `data/scraped/{chain}/beans_raw.json` | チェーン別 raw |
| `data/seeds/{chain}.beans.seed.json` | チェーン別 MVP seed（各3品目） |

再生成: `py -3 -S scripts/merge_catalog.py`

## 目標

- **技育博 2026 Vol.2** エントリー（8/26 締切）
- ゲストデモ可能な Web アプリ（ログイン不要）

## 技術スタック

- フロント: Next.js
- API: Cloud Run（GCP）— https://coffee.yutok.dev
- データ: JSON（MVP）→ Firestore / PostgreSQL（将来）
