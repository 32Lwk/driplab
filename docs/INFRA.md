# DripLab インフラ

## GCP の場所（よくある質問）

| 項目 | 値 |
|------|-----|
| **GCP プロジェクト** | `medicine-recommend` |
| **プロジェクト番号** | `340042923793` |
| **リージョン** | `asia-northeast1`（東京） |
| **Cloud Run サービス名** | `driplab` |
| **コンソール** | https://console.cloud.google.com/run/detail/asia-northeast1/driplab?project=medicine-recommend |

医薬品レコメンド（`medicine-recommend` サービス）と **同じ GCP プロジェクト・同じリージョン** 内の別サービスです。

## URL

| 用途 | URL | 状態 |
|------|-----|------|
| カスタムドメイン | https://coffee.yutok.dev | **稼働中**（Cloudflare Worker 経由） |
| Cloud Run 直 URL | https://driplab-4jnmo2x4wa-an.a.run.app | 稼働中 |

## coffee.yutok.dev の構成（2026-08-08 修正）

以前は Google マネージド SSL（`ghs.googlehosted.com` + プロキシ OFF）を待っていましたが、証明書が **`CertificatePending` のまま進まず** HTTPS 接続できませんでした。

**現行構成**（即時アクセス可能）:

```
ブラウザ → coffee.yutok.dev
         → Cloudflare DNS（AAAA 100::, プロキシ ON）
         → Worker `driplab-proxy`（Host を run.app に上書き）
         → Cloud Run `driplab`
```

| 項目 | 値 |
|------|-----|
| DNS | `coffee` AAAA → `100::`（**プロキシ ON**） |
| Worker | `workers/driplab-proxy/`、ルート `coffee.yutok.dev/*` |
| Cloud Run | `driplab-4jnmo2x4wa-an.a.run.app` |

DNS 切り替え:

```powershell
$env:CLOUDFLARE_API_TOKEN = "<Zone.DNS.Edit>"
python scripts/setup-cloudflare-coffee-worker-dns.py
npx wrangler deploy --config workers/driplab-proxy/wrangler.toml
```

### Google マネージド SSL ルート（参考・未使用）

GCP ドメインマッピング `coffee.yutok.dev` → `driplab` は作成済みですが、Worker 運用時は DNS を `ghs.googlehosted.com` に戻さないでください（競合します）。

```powershell
# 証明書状態の確認（Pending のままの場合あり）
gcloud beta run domain-mappings describe `
  --domain coffee.yutok.dev `
  --region asia-northeast1 `
  --project medicine-recommend
```

## GitHub デプロイ

リポジトリ: https://github.com/32Lwk/driplab

手順: [docs/GITHUB_DEPLOY.md](GITHUB_DEPLOY.md)

`main` ブランチへの push → `cloudbuild.yaml` → Cloud Run `driplab` へ自動デプロイ（トリガー接続後）。

## Cloudflare DNS 設定

| モード | レコード | プロキシ | 用途 |
|--------|----------|----------|------|
| **worker**（現行） | AAAA `100::` | ON | Worker → Cloud Run |
| `google` | CNAME `ghs.googlehosted.com` | OFF | Google マネージド SSL |

Worker モード:

```powershell
$env:CLOUDFLARE_API_TOKEN = "<Zone.DNS.Edit>"
python scripts/setup-cloudflare-coffee-worker-dns.py
```

Google SSL モード:

```powershell
$env:CLOUDFLARE_API_TOKEN = "<Zone.DNS.Edit>"
python scripts/setup-cloudflare-coffee-dns.py --mode google
```

## 手動デプロイ

```powershell
gcloud run deploy driplab `
  --source infra/cloud-run `
  --region asia-northeast1 `
  --project medicine-recommend `
  --allow-unauthenticated
```

## 状態ファイル

`scripts/.driplab-infra.json` — ゾーン ID、DNS レコード ID、サービス URL、R2 バケット名 等

---

## 商品画像（Cloudflare R2）

| 項目 | 値 |
|------|-----|
| バケット | `driplab-assets`（APAC） |
| Account ID | `2a1ac0678cd0b207ca4fa5681a9a0690` |
| カスタムドメイン | `assets.coffee.yutok.dev`（Dashboard で **Initializing → Active** 待ち） |
| S3 API | `https://2a1ac0678cd0b207ca4fa5681a9a0690.r2.cloudflarestorage.com/driplab-assets` |
| ローカル | `data/images/` |
| 設定 | `scripts/r2_config.json` |

### セットアップ手順

#### 1. バケット（済み 2026-08-08）

`driplab-assets` を Cloudflare R2 に作成済み。

#### 2. 公開ドメイン（設定済み・証明書待ち）

Dashboard で `assets.coffee.yutok.dev` が **Active** になるまで数分待ちます（現在 Initializing）。

#### 3. CORS（ブラウザから `coffee.yutok.dev` が画像を読むため）

Dashboard → R2 → `driplab-assets` → Settings → **CORS Policy** → JSON タブに `scripts/r2_cors.json` を貼り付けて Save。

> **形式注意**: Dashboard は `[{ "AllowedOrigins": [...], "AllowedMethods": [...] }]` 形式。Wrangler / API は `scripts/r2_cors.wrangler.json` を使用。

または API トークン（Account → R2 Edit）で:

```powershell
$env:CLOUDFLARE_API_TOKEN = "<token>"
python -S scripts/setup-r2-cors.py
```

#### 4. アップロード

```powershell
# Wrangler（推奨）
npx wrangler login
python -S scripts/upload_images_r2.py

# boto3（API トークン使用）
pip install -r scripts/requirements-r2.txt
# scripts/.env.r2.example を参照して環境変数を設定
python -S scripts/upload_images_r2.py --mode boto3
```

**注意（2026-08-08 修正）**: Windows では `npx.cmd` を使う必要あり（スクリプト内で自動解決）。Wrangler はデフォルトが **local** のため `--remote` 必須（スクリプトに組み込み済み）。

CDN URL のみ JSON に反映（アップロード前の URL プレビュー）:

```powershell
python -S scripts/upload_images_r2.py --skip-upload
python -S scripts/merge_catalog.py
```

### フロントでの参照

```typescript
const src = bean.image_cdn_url ?? bean.image_local ?? bean.image_url;
```
