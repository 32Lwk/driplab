# Configure coffee.yutok.dev DNS in Cloudflare for Cloud Run custom domain.
# Requires: $env:CLOUDFLARE_API_TOKEN with Zone.DNS.Edit on yutok.dev

$ErrorActionPreference = "Stop"

$ZoneName = "yutok.dev"
$Hostname = "coffee.yutok.dev"
$RecordName = "coffee"
$CnameTarget = "ghs.googlehosted.com"

$token = $env:CLOUDFLARE_API_TOKEN
if (-not $token) {
    Write-Error "Set CLOUDFLARE_API_TOKEN (Zone.DNS.Edit for yutok.dev)"
}

$headers = @{
    Authorization = "Bearer $token"
    "Content-Type"  = "application/json"
}

$zoneResp = Invoke-RestMethod -Method Get -Uri "https://api.cloudflare.com/client/v4/zones?name=$ZoneName" -Headers $headers
if (-not $zoneResp.success -or -not $zoneResp.result) {
    throw "Zone not found: $ZoneName"
}
$zoneId = $zoneResp.result[0].id
Write-Host "Zone: $ZoneName ($zoneId)"

$listResp = Invoke-RestMethod -Method Get -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records?name=$Hostname" -Headers $headers
foreach ($rec in @($listResp.result)) {
    if ($rec.type -eq "CNAME" -and $rec.content -eq $CnameTarget -and $rec.proxied -eq $false) {
        Write-Host "OK: existing CNAME $Hostname -> $CnameTarget (DNS only)"
        exit 0
    }
    Write-Host "Deleting stale record: $($rec.type) $($rec.name) -> $($rec.content)"
    Invoke-RestMethod -Method Delete -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records/$($rec.id)" -Headers $headers | Out-Null
}

$body = @{
    type    = "CNAME"
    name    = $RecordName
    content = $CnameTarget
    proxied = $false
    ttl     = 1
    comment = "DripLab -> Cloud Run custom domain (DNS only)"
} | ConvertTo-Json

Write-Host "Creating CNAME $Hostname -> $CnameTarget (proxied=false)"
$created = Invoke-RestMethod -Method Post -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records" -Headers $headers -Body $body
if (-not $created.success) {
    throw "Create failed: $($created | ConvertTo-Json -Compress)"
}

Write-Host "Record ID: $($created.result.id)"
Write-Host "Waiting for DNS propagation..."
for ($i = 1; $i -le 12; $i++) {
    try {
        $dns = Resolve-DnsName $Hostname -Type CNAME -ErrorAction Stop
        $target = ($dns | Select-Object -First 1).NameHost
        if ($target -like "*$CnameTarget*") {
            Write-Host "OK: $Hostname CNAME -> $target"
            exit 0
        }
    } catch {
        Write-Host "  attempt $i/12 ..."
    }
    Start-Sleep -Seconds 5
}

Write-Host "WARN: DNS record created but propagation not confirmed yet."
