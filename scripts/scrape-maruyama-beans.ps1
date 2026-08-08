# Maruyama Coffee bean scraper for DripLab
# Usage: powershell -File scripts/scrape-maruyama-beans.ps1

$ErrorActionPreference = 'Continue'
$BaseUrl = 'https://www.maruyamacoffee.com/ec'
$Headers = @{ 'User-Agent' = 'DripLab-Research/1.0 (+research)' }
$OutDir = 'C:\Users\yutok\Projects\driplab\data\scraped\maruyama'
$DelayMs = 800

# Bean-related category IDs (deduplicated product collection)
$Categories = @(9, 7, 48, 52, 13, 165, 225, 21, 22, 107, 116, 180, 167, 168, 169, 164, 51, 116, 79, 120)

$ExcludeNamePatterns = @(
    'ドリップバッグ', 'コーヒーバッグ', 'リキッド', 'アイスコーヒー', 'カフェラテ',
    'ギフト(?!.*100g)', 'どら焼', 'ラングドシャ', 'バームクーヘン', 'ドーナツ', 'マシュマロ',
    'カステラ', 'タルト', 'コーヒー飴', 'くるみトルテ', 'ボダム', 'ハリオ', 'カリタ', 'KEURIG',
    'グラス', '食器', '書籍', 'フィルタ', 'メッシュ', 'プレス', 'サーバー', 'ミル(?!ク)',
    'ケトル', 'スプーン', 'マグ', 'タンブラー', 'キャニスター', 'ロゴタオル', 'エプロン',
    'コーヒーメーカー', '電動', '器具', 'グッズ', 'BONMAC', 'サイフォン'
)

function Get-ProductIdsFromCategory {
    param([int]$CategoryId)
    $ids = @()
    $page = 1
    do {
        $url = "$BaseUrl/index.php/products/list?category_id=$CategoryId&disp_number=100&pageno=$page"
        try {
            $r = Invoke-WebRequest -Uri $url -Headers $Headers -UseBasicParsing -TimeoutSec 30
            $pageIds = [regex]::Matches($r.Content, 'products/detail/(\d+)') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
            if ($pageIds.Count -eq 0) { break }
            $ids += $pageIds
            $hasNext = $r.Content -match "pageno=" + ($page + 1)
            $page++
            Start-Sleep -Milliseconds $DelayMs
        } catch {
            Write-Warning "Category $CategoryId page $page failed: $_"
            break
        }
    } while ($hasNext -and $page -le 10)
    return $ids | Sort-Object -Unique
}

function Decode-UnicodeEscapes {
    param([string]$Text)
    if (-not $Text) { return $Text }
    return [regex]::Replace($Text, '\\u([0-9a-fA-F]{4})', { [char][int]::Parse($args[0].Groups[1].Value, 'HexNumber') })
}

function Parse-ProductDetail {
    param([string]$Id)
    $url = "$BaseUrl/products/detail/$Id"
    try {
        $r = Invoke-WebRequest -Uri $url -Headers $Headers -UseBasicParsing -TimeoutSec 30
    } catch {
        return $null
    }
    $html = $r.Content

    # Name
    $name = $null
    if ($html -match 'property="og:title"\s+content="([^"]+)"') {
        $name = $Matches[1] -replace '\s*\|\s*丸山珈琲.*$', ''
    }
    if (-not $name -and $html -match 'class="productDetailInfo_title"[^>]*>([^<]+)<') {
        $name = $Matches[1].Trim()
    }
    if (-not $name) { return $null }

    # Exclude non-bean products by name
    foreach ($pat in $ExcludeNamePatterns) {
        if ($name -match $pat) { return $null }
    }

    # Check for whole bean option in classCategories JSON
    $hasBeanOption = $html -match '\\u8c46"'  # 豆 in unicode escape
    $classCatJson = $null
    if ($html -match 'eccube\.classCategories\s*=\s*(\{[\s\S]*?\});') {
        $classCatJson = $Matches[1]
        $decoded = Decode-UnicodeEscapes $classCatJson
        if ($decoded -match '"name":"豆"') { $hasBeanOption = $true }
    }

    # Also accept products clearly named as beans (roast in name + weight)
    $looksLikeBean = ($name -match '(中煎り|深煎り|浅煎り|中深煎り|極深煎り|ロースト|ブレンド|ゲイシャ|カフェインレス|恩返し|シングル|SL28|ウォッシュド|ナチュラル|ハニー)') -and
                     ($name -match '\d+g' -or $hasBeanOption)

    if (-not $hasBeanOption -and -not $looksLikeBean) { return $null }

    # Exclude drip/bag even if misclassified
    if ($name -match 'ドリップ|バッグ|リキッド|缶(?!.*豆)') { return $null }

    # Price (tax-excluded base, from 豆 variant if possible)
    $priceJpy = $null
    if ($classCatJson) {
        $decoded = Decode-UnicodeEscapes $classCatJson
        if ($decoded -match '"name":"豆"[^}]*"price02":"([^"]+)"') {
            $priceJpy = [int]($Matches[1] -replace ',', '')
        }
    }
    if (-not $priceJpy -and $html -match 'class="price02_default"[^>]*>\s*([0-9,]+)\s*<') {
        $priceJpy = [int]($Matches[1] -replace ',', '')
    }

    # Weight
    $weightG = $null
    if ($name -match '(\d+)g') { $weightG = [int]$Matches[1] }
    if (-not $weightG -and $html -match '<option value="\d+">(\d+)g</option>') {
        $weightG = [int]$Matches[1]
    }
    # Multi-pack: e.g. 400g 3袋
    $packCount = 1
    if ($name -match '(\d+)g\s*(\d+)袋') {
        $weightG = [int]$Matches[1]
        $packCount = [int]$Matches[2]
    } elseif ($name -match '(\d+)袋') {
        if ($name -match '(\d+)g') { $weightG = [int]$Matches[1] }
    }

    # Roast level from name
    $roast = $null
    if ($name -match '(極深煎り|中深煎り|深煎り|中煎り|浅煎り|ロースト)') {
        $roast = $Matches[1]
    } elseif ($name -match '深煎') { $roast = '深煎り' }
    elseif ($name -match '中煎') { $roast = '中煎り' }
    elseif ($name -match '浅煎') { $roast = '浅煎り' }

    # OG description
    $ogDesc = $null
    if ($html -match 'property="og:description"\s+content="([^"]*)"') {
        $ogDesc = [System.Net.WebUtility]::HtmlDecode($Matches[1])
    }

    # Flavor notes from og:description or page
    $flavorNotes = $null
    if ($ogDesc -match '苦味[：:●○\s]+.*?香り[：:●○\s]+(.+?)(?:\s*$|※|＜|●)') {
        $flavorNotes = $Matches[1].Trim()
    } elseif ($ogDesc -match '([^\s、,]+(?:、[^\s、,]+){1,8})(?:\s*$|※)') {
        $flavorNotes = $Matches[1].Trim()
    }
    # Try inline flavor line
    if (-not $flavorNotes -and $html -match '>([^<]*(?:ダークチョコ|チョコ|ベリー|柑橘|フローラル|ナッツ|キャラメル|ジャスミン|トロピカル)[^<]{0,120})<') {
        $flavorNotes = $Matches[1].Trim()
    }

    # Description (first paragraph from og or page)
    $description = $ogDesc
    if ($description) {
        $description = ($description -split '※')[0].Trim()
        $description = ($description -split '●\s*賞味期限')[0].Trim()
    }

    # Origin
    $origin = $null
    if ($ogDesc -match '＜([^＞>]+)＞') { $origin = $Matches[1].Trim() }
    elseif ($name -match '(エチオピア|ケニア|コロンビア|グアテマラ|ブラジル|ホンジュラス|コスタリカ|エルサルバドル|インドネシア|パナマ|ルワンダ|ブルンジ|タンザニア|ニカラグア|ペルー|ボリビア|イエメン|ハワイ|メキシコ|ウガンダ|スマトラ|モカ|キリマンジャロ|ゲイシャ|アグロタケシ|軽井沢|名古屋|日本)') {
        $origin = $Matches[1]
    } elseif ($name -match 'ブレンド') { $origin = 'ブレンド' }
    elseif ($name -match 'カフェインレス') { $origin = 'カフェインレス' }

    # Available
    $available = -not ($html -match '販売終了|SOLD OUT|在庫切れ')

    return [ordered]@{
        product_id     = [int]$Id
        name           = $name
        price_jpy      = $priceJpy
        weight_g       = $weightG
        pack_count     = $packCount
        roast          = $roast
        description    = $description
        flavor_notes   = $flavorNotes
        origin         = $origin
        buy_url        = $url
        has_bean_option = $hasBeanOption
        available      = $available
        og_description = $ogDesc
    }
}

# Collect all product IDs
Write-Host 'Collecting product IDs from categories...'
$allIds = @()
foreach ($cat in ($Categories | Sort-Object -Unique)) {
    $ids = Get-ProductIdsFromCategory -CategoryId $cat
    Write-Host "  category $cat : $($ids.Count) products"
    $allIds += $ids
    Start-Sleep -Milliseconds 300
}
$allIds = $allIds | Sort-Object -Unique
Write-Host "Total unique IDs: $($allIds.Count)"

# Fetch details
$results = @()
$i = 0
foreach ($id in $allIds) {
    $i++
    Write-Host "[$i/$($allIds.Count)] Fetching $id..."
    $product = Parse-ProductDetail -Id $id
    if ($product) { $results += $product }
    Start-Sleep -Milliseconds $DelayMs
}

Write-Host "Filtered bean products: $($results.Count)"

# Save raw JSON
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$rawPath = Join-Path $OutDir 'beans_raw.json'
$results | ConvertTo-Json -Depth 5 | Set-Content -Path $rawPath -Encoding UTF8
Write-Host "Saved: $rawPath"
