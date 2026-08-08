# GitHub → Cloud Run デプロイ手順

## GCP の場所

| 項目 | 値 |
|------|-----|
| GCP プロジェクト | **`medicine-recommend`** |
| プロジェクト番号 | `340042923793` |
| リージョン | **`asia-northeast1`**（東京） |
| Cloud Run サービス | **`driplab`** |
| GitHub リポジトリ | https://github.com/32Lwk/driplab |

医薬品ツール（`medicine-recommend` サービス）と **同一 GCP プロジェクト** 内の別 Cloud Run サービスです。

## 1. GitHub リポジトリ接続（初回のみ）

Cloud Build が `32Lwk/driplab` を認識するため、以下で接続してください。

https://console.cloud.google.com/cloud-build/triggers;region=asia-northeast1/connect?project=340042923793

1. **GitHub (Cloud Build GitHub App)** を選択
2. リポジトリ **`32Lwk/driplab`** を接続
3. 接続後、以下でトリガー作成:

```powershell
gcloud builds triggers create github `
  --name="driplab-deploy-main" `
  --repo-name="driplab" `
  --repo-owner="32Lwk" `
  --branch-pattern="^main$" `
  --build-config="cloudbuild.yaml" `
  --region="asia-northeast1" `
  --project="medicine-recommend"
```

## 2. デプロイの流れ

```
git push origin main
  → GitHub Actions (.github/workflows/deploy.yml)
  → Cloud Build トリガー driplab-deploy-main
  → cloudbuild.yaml
  → Artifact Registry
  → Cloud Run driplab
```

GitHub Actions が Workload Identity Federation で GCP に認証し、Cloud Build トリガーを起動します。
Cloud Build GitHub App の push Webhook だけではトリガーが動かない場合があるため、Actions を正としています。

## 3. 手動デプロイ（ローカル）

Cloud Build トリガーを手動実行（推奨）:

```powershell
gcloud builds triggers run driplab-deploy-main `
  --branch=main `
  --region=asia-northeast1 `
  --project=medicine-recommend
```

またはリポジトリルートをコンテキストに Docker ビルド:

```powershell
gcloud builds submit . `
  --config=cloudbuild.yaml `
  --region=asia-northeast1 `
  --project=medicine-recommend
```

## 4. coffee.yutok.dev について

- DNS: Cloudflare `coffee` CNAME → `ghs.googlehosted.com`（プロキシ **OFF**）
- SSL: Google マネージド証明書（発行に **最大 1 時間** かかる場合あり）
- 証明書発行待ちの間: https://driplab-4jnmo2x4wa-an.a.run.app

```powershell
gcloud beta run domain-mappings describe `
  --domain coffee.yutok.dev `
  --region asia-northeast1 `
  --project medicine-recommend
```

`CertificateProvisioned: True` になれば https://coffee.yutok.dev/ が開きます。
