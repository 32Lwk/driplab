# DripLab インフラ

## 本番 URL

| 用途 | URL |
|------|-----|
| カスタムドメイン | https://coffee.yutok.dev |
| Cloud Run 直 URL | https://driplab-340042923793.asia-northeast1.run.app |

## 構成

- **GCP プロジェクト**: `medicine-recommend`
- **Cloud Run サービス**: `driplab`（`asia-northeast1`）
- **DNS**: Cloudflare `coffee` CNAME → `ghs.googlehosted.com`（**プロキシ OFF**）
- **状態ファイル**: `scripts/.driplab-infra.json`

## 初回セットアップ（済み 2026-08-08）

```powershell
# 1. Cloud Run デプロイ
gcloud run deploy driplab `
  --source infra/cloud-run `
  --region asia-northeast1 `
  --project medicine-recommend `
  --allow-unauthenticated

# 2. GCP ドメインマッピング
gcloud beta run domain-mappings create `
  --service driplab `
  --domain coffee.yutok.dev `
  --region asia-northeast1 `
  --project medicine-recommend

# 3. Cloudflare DNS（API）
$env:CLOUDFLARE_API_TOKEN = "<Zone.DNS.Edit for yutok.dev>"
powershell -ExecutionPolicy Bypass -File scripts/setup-cloudflare-coffee-dns.ps1
```

## 再デプロイ

```powershell
gcloud run deploy driplab `
  --source infra/cloud-run `
  --region asia-northeast1 `
  --project medicine-recommend `
  --allow-unauthenticated
```

## 確認

```powershell
curl https://driplab-340042923793.asia-northeast1.run.app/health
curl https://coffee.yutok.dev/health   # SSL 証明書発行後（数分〜数十分）
gcloud beta run domain-mappings describe `
  --domain coffee.yutok.dev `
  --region asia-northeast1 `
  --project medicine-recommend
```

## 注意

- Cloudflare プロキシ（オレンジ雲）は **OFF** 必須。ON にすると Cloud Run マネージド証明書が失敗します。
- `medicine.yutok.dev` と同じ CNAME パターン（`ghs.googlehosted.com`）を使用しています。
