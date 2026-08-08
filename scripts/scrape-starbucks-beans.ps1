# Starbucks Japan whole bean scraper for DripLab
# Source: menu.starbucks.co.jp API + product pages (Inertia data-page JSON)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ROAST_MAP = @{
    'STARBUCKS_BLONDE_ROAST' = @{ level = 'light'; label = 'ブロンド ロースト（軽やかな風味）' }
    'STARBUCKS_MEDIUM_ROAST'  = @{ level = 'medium'; label = 'ミディアム ロースト（豊かな風味）' }
    'STARBUCKS_DARK_ROAST'    = @{ level = 'dark'; label = 'ダーク ロースト（力強い風味）' }
    'STARBUCKS_RESERVE'       = @{ level = 'medium_dark'; label = 'STARBUCKS RESERVE®' }
}

$ORIGIN_MAP = @{
    'LATIN_AMERICA' = 'ラテンアメリカ'
    'AFRICA'        = 'アフリカ'
    'ASIA_PACIFIC'  = 'アジア・太平洋'
    'MULTI_REGION'  = 'マルチリージョン'
}

$ACIDITY_SCORE = @{ 'LOW'=30; 'MEDIUM-LOW'=40; 'MEDIUM'=50; 'MEDIUM-HIGH'=65; 'HIGH'=80 }
$BODY_SCORE    = @{ 'LIGHT'=35; 'MEDIUM-LIGHT'=45; 'MEDIUM'=55; 'MEDIUM-FULL'=65; 'FULL'=75 }
$ROAST_BITTERNESS = @{ 'light'=25; 'medium'=45; 'medium_dark'=55; 'dark'=65 }

function Get-CategoryName($categories) {
    foreach ($c in $categories) {
        if ($c.category_type -eq 'CATEGORY' -and $c.parent_category_code -eq 'beans') {
            return $c.category_name
        }
        if ($c.categories) {
            foreach ($sub in $c.categories) {
                if ($sub.category_type -eq 'CATEGORY' -and $sub.parent_category_code -eq 'beans') {
                    return $sub.category_name
                }
            }
        }
    }
    return 'コーヒー豆'
}

function Get-WeightG($specInfos) {
    foreach ($s in $specInfos) {
        if ($s.name -eq '内容量') {
            if ($s.value -match '(\d+)\s*g') { return [int]$Matches[1] }
        }
    }
    return $null
}

function Get-Slug($name) {
    $slug = $name.ToLower()
    $slug = $slug -replace '[®™]', ''
    $slug = $slug -replace '[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]+', '-'
    $slug = $slug -replace '^-|-$', ''
    if ($slug.Length -gt 60) { $slug = $slug.Substring(0, 60) }
    return "starbucks-$slug"
}

function Get-SweetnessScore($desc, $roastLevel) {
    $base = switch ($roastLevel) {
        'light' { 55 }
        'medium' { 50 }
        'medium_dark' { 45 }
        'dark' { 40 }
        default { 50 }
    }
    if ($desc -match '甘|キャラメル|チョコ|モルト|蜂蜜|ハチミツ') { $base += 10 }
    if ($desc -match 'すっきり|キレ|爽やか') { $base -= 5 }
    return [Math]::Min(85, [Math]::Max(25, $base))
}

function Fetch-ProductDetail($itemCode) {
    $url = "https://menu.starbucks.co.jp/$itemCode"
    Start-Sleep -Milliseconds 800
    $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -Headers @{ 'Accept-Language' = 'ja-JP' }
    if ($resp.Content -notmatch 'data-page="([^"]+)"') {
        throw "No data-page for $itemCode"
    }
    $json = [System.Net.WebUtility]::HtmlDecode($Matches[1])
    $page = $json | ConvertFrom-Json
    return $page.props.data._source
}

Write-Host "Fetching product list..."
$listUrl = 'https://menu.starbucks.co.jp/api/v1/list?category_code=beans&grind_and_type=WHOLE_BEAN,WHOLE_BEAN_DECAF&purchase_methods=ONLINE_STORE&limit=100'
$listResp = Invoke-WebRequest -Uri $listUrl -UseBasicParsing
$list = ($listResp.Content | ConvertFrom-Json)

Write-Host "Found $($list.count) whole bean products on online store"

$beans = @()
$i = 0
foreach ($item in $list.item) {
    $i++
    Write-Host "[$i/$($list.count)] $($item.item_code) $($item.item_name)"
    try {
        $src = Fetch-ProductDetail $item.item_code
    } catch {
        Write-Warning "Failed $($item.item_code): $_"
        continue
    }

    $attrs = $src.attributes
    $roastKey = $attrs.bean_classification
    $roast = $ROAST_MAP[$roastKey]
    if (-not $roast) { $roast = @{ level = 'medium'; label = $roastKey } }

    $weight = Get-WeightG $src.spec_info.spec_infos
    $category = Get-CategoryName $src.categories

    $origin = @()
    if ($attrs.country_code_of_origin) {
        $origin += $ORIGIN_MAP[$attrs.country_code_of_origin]
    }
    if ($attrs.blend_and_single_origin -eq 'BLEND') { $origin += 'ブレンド' }
    elseif ($attrs.blend_and_single_origin -eq 'SINGLE_ORIGIN') { $origin += 'シングルオリジン' }
    if ($origin.Count -eq 0) { $origin = @('ブレンド') }

    $flavorTags = @()
    if ($attrs.compatible_flavors) { $flavorTags += $attrs.compatible_flavors }
    if ($attrs.product_keywords) {
        foreach ($kw in $attrs.product_keywords) {
            if ($kw -match '（(.+)）') { $flavorTags += $Matches[1] }
        }
    }
    $flavorTags = $flavorTags | Select-Object -Unique

    $acidity = if ($attrs.whole_bean_acidity) { $ACIDITY_SCORE[$attrs.whole_bean_acidity] } else { 50 }
    $body = if ($attrs.whole_bean_body) { $BODY_SCORE[$attrs.whole_bean_body] } else { 50 }
    $bitterness = $ROAST_BITTERNESS[$roast.level]
    if (-not $bitterness) { $bitterness = 45 }
    $sweetness = Get-SweetnessScore $src.description $roast.level

    $tasteLabel = $src.memo
    if (-not $tasteLabel) { $tasteLabel = ($flavorTags -join '・') }

    $buyUrl = "https://menu.starbucks.co.jp/$($item.item_code)"
    $price = $item.price_in_vat

    $beans += [ordered]@{
        product_id     = $item.item_code
        name           = $src.item_name
        price_jpy      = $price
        weight_g       = $weight
        buy_url        = $buyUrl
        og_description = $src.description
        content        = @(
            if ($roast.label) { "焙煎度: $($roast.label)" }
            if ($tasteLabel) { "味わい: $tasteLabel" }
            if ($attrs.whole_bean_acidity) { "酸味: $($attrs.whole_bean_acidity)" }
            if ($attrs.whole_bean_body) { "コク: $($attrs.whole_bean_body)" }
            if ($attrs.product_keywords) { "キーワード: $($attrs.product_keywords -join ', ')" }
            if ($attrs.compatible_flavors) { "相性のよいフレーバー: $($attrs.compatible_flavors -join ', ')" }
            if ($attrs.bean_processing_content) { "加工方法: $($attrs.bean_processing_content)" }
            if ($weight) { "内容量: ${weight}g" }
            $src.description
        ) -join "`n"
        category       = $category
        roast_level    = $roast.level
        roast_label_ja = $roast.label
        taste_label_ja = $tasteLabel
        flavor_tags    = @($flavorTags)
        origin         = @($origin)
        acidity        = $acidity
        body           = $body
        bitterness     = $bitterness
        sweetness      = $sweetness
        caffeine       = if ($attrs.grind_and_type -eq 'WHOLE_BEAN_DECAF' -or $src.item_name -match 'ディカフェ') { 'decaf' } else { 'medium' }
        available      = $true
    }
}

$rawPath = 'C:\Users\yutok\Projects\driplab\data\scraped\starbucks\beans_raw.json'
$beans | ConvertTo-Json -Depth 10 | Set-Content -Path $rawPath -Encoding UTF8
Write-Host "Saved $rawPath ($($beans.Count) items)"

# MVP seed: ライトノート / パイクプレイス / ケニア (diverse roast & origin)
$mvpNames = @(
    'スターバックス ライトノート ブレンド',
    'パイクプレイス® ロースト',
    'ケニア'
)
$seedBeans = @()
foreach ($name in $mvpNames) {
    $b = $beans | Where-Object { $_.name -like "*$($name.Replace('®',''))*" } | Select-Object -First 1
    if ($b) {
        $id = Get-Slug $b.name
        if ($b.weight_g) { $id += "-$($b.weight_g)g" }
        $seedBeans += [ordered]@{
            id             = $id
            chain_id       = 'starbucks'
            name           = $b.name
            description    = $b.og_description
            roast_level    = $b.roast_level
            roast_label_ja = $b.roast_label_ja
            taste_label_ja = $b.taste_label_ja
            origin         = $b.origin
            flavor_tags    = $b.flavor_tags
            acidity        = $b.acidity
            body           = $b.body
            bitterness     = $b.bitterness
            sweetness      = $b.sweetness
            caffeine       = $b.caffeine
            price_jpy      = $b.price_jpy
            weight_g       = $b.weight_g
            buy_url        = $b.buy_url
            product_id     = $b.product_id
            source         = 'scraped'
            available      = $b.available
        }
    }
}

$seed = [ordered]@{
    version    = '0.1.0'
    chain_id   = 'starbucks'
    scraped_at = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss+09:00')
    source     = 'https://menu.starbucks.co.jp'
    beans      = $seedBeans
}
$seedPath = 'C:\Users\yutok\Projects\driplab\data\seeds\starbucks.beans.seed.json'
$seed | ConvertTo-Json -Depth 10 | Set-Content -Path $seedPath -Encoding UTF8
Write-Host "Saved $seedPath ($($seedBeans.Count) MVP items)"

Write-Host "DONE total=$($beans.Count)"
