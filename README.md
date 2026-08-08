# DripLab

チェーン各社の豆情報と、その日の気分（スライダー入力）から、**パーソナライズされた豆と抽出方法**を提案する Web アプリ。

**デモ URL:** https://coffee.yutok.dev

## 対象チェーン

- スターバックス
- 丸山コーヒー
- ドトールコーヒー
- タリーズコーヒー
- カルディ

## 開発

```powershell
cd packages/web
npm install
npm run dev
# http://localhost:3000
```

本番ビルド:

```powershell
npm run build -w @driplab/web
```

## リポジトリ構成

```
driplab/
├── packages/
│   ├── web/          # Next.js 15（UI + API Routes）
│   └── recommender/  # レコメンドエンジン（160品目）
├── data/catalog/     # beans.json（160品目）
├── scrapers/         # チェーン別スクレイパー
├── infra/cloud-run/  # Cloud Run Dockerfile
└── docs/
```

## データ

| ファイル | 内容 |
|----------|------|
| `data/catalog/beans.json` | 全チェーン統合（160品目） |
| `data/catalog/mvp_beans.json` | シード15品目 |
| `data/catalog/image_manifest.json` | R2 アップロード manifest |
| `data/images/{chain}/` | 商品画像（R2 CDN に sync） |

再生成: `py -3 -S scripts/merge_catalog.py`  
R2 アップロード: `py -3 -S scripts/upload_images_r2.py`

## 技術スタック

- フロント: Next.js 15（App Router, standalone）
- API: Next.js API Routes（`/api/recommend`）
- ホスティング: Cloud Run + Cloudflare Worker プロキシ
- 画像 CDN: Cloudflare R2（`assets.coffee.yutok.dev`）
- データ: JSON（160品目）

## 目標

- **技育博 2026 Vol.2** エントリー（8/26 締切）
- ゲストデモ可能な Web アプリ（ログイン不要）

## ドキュメント

| ファイル | 内容 |
|----------|------|
| [docs/PLAN.md](docs/PLAN.md) | 全体計画 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 技術構成 |
| [docs/RECOMMENDATION.md](docs/RECOMMENDATION.md) | レコメンドロジック |
| [docs/INFRA.md](docs/INFRA.md) | GCP / Cloudflare |
| [docs/CATALOG.md](docs/CATALOG.md) | 全160品目一覧 |
