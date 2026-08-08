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
| カスタムドメイン | https://coffee.yutok.dev | SSL 証明書発行待ち |
| Cloud Run 直 URL | https://driplab-4jnmo2x4wa-an.a.run.app | 稼働中 |

## coffee.yutok.dev が開かない原因

1. **DNS** — Cloudflare `coffee` CNAME → `ghs.googlehosted.com`（プロキシ OFF）✅ 設定済み
2. **Cloud Run ドメインマッピング** — `coffee.yutok.dev` → サービス `driplab` ✅ 作成済み
3. **SSL 証明書** — Google マネージド証明書が **`CertificatePending`**（発行中）

`medicine.yutok.dev` も同じ構成で、ドメインマッピング作成から証明書発行まで **約 1 時間** かかっています。`coffee.yutok.dev` も同様に、DNS 設定後しばらく待つ必要があります。

**重要**: Cloudflare プロキシ（オレンジ雲）を ON にすると Google 側の証明書発行が失敗します。必ず **DNS only（グレー雲）** にしてください。

```powershell
# 証明書状態の確認
gcloud beta run domain-mappings describe `
  --domain coffee.yutok.dev `
  --region asia-northeast1 `
  --project medicine-recommend
```

`CertificateProvisioned: True` になれば https://coffee.yutok.dev/ が開きます。

## GitHub デプロイ

リポジトリ: https://github.com/32Lwk/driplab

手順: [docs/GITHUB_DEPLOY.md](GITHUB_DEPLOY.md)

`main` ブランチへの push → `cloudbuild.yaml` → Cloud Run `driplab` へ自動デプロイ（トリガー接続後）。

## Cloudflare DNS 設定

```powershell
$env:CLOUDFLARE_API_TOKEN = "<Zone.DNS.Edit>"
python scripts/setup-cloudflare-coffee-dns.py --mode google
```

| モード | CNAME 先 | プロキシ | 用途 |
|--------|----------|----------|------|
| `google`（推奨） | `ghs.googlehosted.com` | OFF | Google マネージド SSL |
| `cloudflare` | `*.run.app` | ON | Worker + Host 上書きが必要（未使用） |

## 手動デプロイ

```powershell
gcloud run deploy driplab `
  --source infra/cloud-run `
  --region asia-northeast1 `
  --project medicine-recommend `
  --allow-unauthenticated
```

## 状態ファイル

`scripts/.driplab-infra.json` — ゾーン ID、DNS レコード ID、サービス URL 等
