"""Generate MARUYAMA.md research report from beans_raw.json."""
import json
from pathlib import Path

RAW = Path(r"C:\Users\yutok\Projects\driplab\data\scraped\maruyama\beans_raw.json")
OUT = Path(r"C:\Users\yutok\Projects\driplab\docs\research\MARUYAMA.md")

items = json.loads(RAW.read_text(encoding="utf-8"))
items.sort(key=lambda x: (x.get("origin") or "ZZZ", x["name"]))

blend = [x for x in items if x.get("origin") == "ブレンド" or "ブレンド" in x["name"]]
single = [x for x in items if x not in blend and x.get("origin") != "カフェインレス"]
decaf = [x for x in items if "カフェインレス" in x["name"] or x.get("origin") == "カフェインレス"]
special = [x for x in items if x not in blend and x not in single and x not in decaf]


def row(p):
    roast = p.get("roast") or "—"
    w = f"{p.get('weight_g')}g" if p.get("weight_g") else "—"
    price = f"¥{p.get('price_jpy'):,}" if p.get("price_jpy") else "—"
    origin = (p.get("origin") or "—")[:20]
    notes = (p.get("flavor_notes") or "—").split("▼")[0].strip()[:40]
    return f"| {p['product_id']} | {p['name']} | {w} | {price} | {roast} | {origin} | {notes} | [detail]({p['buy_url']}) |"


def table(group, title):
    lines = [f"### {title}（{len(group)} 品目）", ""]
    lines.append("| ID | 商品名 | 容量 | 価格(税抜) | 焙煎 | 産地/系統 | フレーバーノート | URL |")
    lines.append("|----|--------|------|------------|------|-----------|------------------|-----|")
    for p in sorted(group, key=lambda x: x["name"]):
        lines.append(row(p))
    lines.append("")
    return lines


md = """# 丸山珈琲 データ調査レポート

調査日: 2026-08-08  
調査者: DripLab プロジェクト  
結論: **MVP に十分な豆データあり（公式 EC で 51 品目のホール豆を確認）。スクレイピング実施済み。**

---

## 1. エグゼクティブサマリー

| 観点 | 結果 |
|------|------|
| 公式 EC の豆（ホール） | **51 品目**（ブレンド 35 + シングルオリジン 12 + カフェインレス 2 + その他 2） |
| 味わい・焙煎度の構造化 | **公式に記載あり**（●チャート + フレーバーノート） |
| 購入 URL | 全商品で取得可能 |
| スクレイピング | `robots.txt` 上 **許可**（`/wp/wp-admin/` のみ Disallow） |
| 店舗限定豆 | 多数（通信販売限定表記あり） |

**DripLab MVP 方針（確定）**

- データソース: `https://www.maruyamacoffee.com/ec`
- MVP seed: **3 品目**（丸山珈琲のブレンド / モカブレンド 茜すみれ / サマンバイア ゲイシャ 中煎り）
- フル catalog: 51 品目すべて `data/scraped/maruyama/beans_raw.json` に取得済み

---

## 2. データソース

### 2.1 公式オンラインショップ（主数据源）

| 項目 | 内容 |
|------|------|
| URL | https://www.maruyamacoffee.com/ec |
| プラットフォーム | EC-CUBE 4 |
| コーヒー豆（ホール） | **51 件**（ドリップバッグ・リキッド・ギフトセット除外） |
| 会員 | なしでも購入可 |

**注意**: `chains.json` および旧資料の `https://www.maruyama-coffee.com/` は **DNS 未解決**（2026-08-08 時点）。正しい EC ドメインは **`maruyamacoffee.com`**（ハイフンなし）。

### 2.2 ブランドサイト（補助）

| URL | 用途 |
|-----|------|
| https://www.maruyamacoffee.com/ | コーポレート・店舗情報 |
| https://www.maruyamacoffee.com/ec/ | オンラインストア TOP |

### 2.3 robots.txt

```
User-agent: *
Disallow: /wp/wp-admin/
Allow: /wp/wp-admin/admin-ajax.php
```

- 商品ページ `/ec/products/detail/{id}` は **Disallow なし**
- sitemap.xml は `/ec/sitemap.xml` で **404**（2026-08-08）→ カテゴリ一覧から ID 収集で代替

---

## 3. 取得可能な豆一覧（51 品目）

"""

md += "\n".join(table(blend, "3.1 ブレンド"))
md += "\n".join(table(single, "3.2 シングルオリジン / スペシャルティ"))
md += "\n".join(table(decaf, "3.3 カフェインレス"))
if special:
    md += "\n".join(table(special, "3.4 その他"))

md += """
---

## 4. 商品ページのデータ構造（スクレイピング用）

### 4.1 HTML / JSON ソース

| フィールド | セレクタ / ソース |
|------------|-------------------|
| 商品名 | `meta[property="og:title"]` |
| 価格（税抜） | `em.price02_default` または `eccube.classCategories` 内 `"name":"豆"` の `price02` |
| 容量 | `select#classcategory_id1` の option（例: 80g, 100g, 200g, 400g） |
| 挽き目 | `select#classcategory_id2`（豆 / 粉 各種） |
| 説明 | `meta[property="og:description"]` |
| フレーバー | OG 説明内 `苦味：●… 香り：●…` 以降のテキスト |
| 産地 | OG 説明内 `＜{農園名}＞` または商品名 |

### 4.2 味わいチャート（全豆商品に共通）

```
苦味：●●●●
酸味：●●
コク：●●●
香り：●●●
{フレーバーノート}
```

**DripLab スコアリング（ルールベース）**

| ● の数（1-5） | 対応スコア目安 |
|---------------|----------------|
| 酸味 ●●●● | acidity 70-80 |
| コク ●●●● | body 65-75 |
| 苦味 ●●●● | bitterness 70-80 |

---

## 5. EC に含まれない / 除外した商品

以下は **ホール豆単品ではない** ため `beans_raw.json` から除外:

- ドリップバッグ / コーヒーバッグ
- リキッドコーヒー / カフェラテベース
- スイーツ・ギフトセット（豆 + 菓子）
- コーヒー器具・グッズ
- 複数袋セット（例: 400g 2袋 / 3袋）— 単品 400g は収録

---

## 6. スクレイピング実装

### 6.1 実行済みスクリプト

```
scripts/scrape_maruyama_beans.py
```

フロー:

1. カテゴリ ID（9, 52, 167-169 等）から product ID 収集
2. `/ec/products/detail/{id}` を 0.8 sec 間隔で GET
3. `eccube.classCategories` で「豆」オプション有無を判定
4. 正規化 → `data/scraped/maruyama/beans_raw.json`

### 6.2 注意事項

| 項目 | 対策 |
|------|------|
| レート制限 | 1 req / 0.8 sec（実施済み） |
| 正しいドメイン | `maruyamacoffee.com`（`maruyama-coffee.com` は不可） |
| 在庫 | `classCategories` 内 `"name":"豆"` の `stock_find` で判定 |
| 100g / 200g / 400g 混在 | `weight_g` 必須 |
| 店舗限定 | 名称に「通信販売限定」— EC からは購入可 |
| 法務表示 | 「出典: 丸山珈琲オンラインストア（取得日）」 |

---

## 7. MVP seed 推奨 3 品目

| # | 商品 | 選定理由 |
|---|------|----------|
| 1 | **丸山珈琲のブレンド 100g** | 定番 No.1。深煎り・コク系のデフォルト提案 |
| 2 | **モカブレンド 茜すみれ 100g** | フローラル・柑橘系。酸味・香り好み向け |
| 3 | **サマンバイア ゲイシャ 中煎り 80g** | スペシャルティ SO。ジャスミン・果実味 |

seed ファイル: `data/seeds/maruyama.beans.seed.json`

---

## 8. 他チェーンとの比較（丸山珈琲の強み）

| 強み | 内容 |
|------|------|
| 品目数 | 51 品目（ドトール 12 品目より多い） |
| スペシャルティ | ゲイシャ・アグロタケシ等の高単価 SO |
| 構造化メタデータ | 苦味/酸味/コク/香りの ● チャート |
| フレーバーノート | 具体的（ジャスミン、ダークチョコ、トロピカル等） |
| 産地情報 | 農園名・国名を OG 説明に記載 |

| 弱み | 内容 |
|------|------|
| 価格帯 | 100g ¥755〜、ゲイシャ 80g ¥7,500 と幅広い |
| 容量バリエーション | 40g / 80g / 100g / 200g / 400g 混在 |
| 店舗限定ブレンド | 名称上は限定だが EC 販売あり |

---

## 9. 次のアクション

- [x] EC 調査完了
- [x] 51 品目 raw JSON 取得
- [x] MVP seed 3 品目作成
- [ ] `scrapers/maruyama/scrape.py` へ Python スクリプト移植
- [ ] `chains.json` の website URL を `maruyamacoffee.com` に更新

---

## 10. 参考リンク

- オンラインストア TOP: https://www.maruyamacoffee.com/ec/
- コーヒー（豆・粉）カテゴリ: https://www.maruyamacoffee.com/ec/index.php/products/list?category_id=9
- 80-100g 一覧: https://www.maruyamacoffee.com/ec/index.php/products/list?category_id=167
- コーポレート: https://www.maruyamacoffee.com/
"""

OUT.write_text(md, encoding="utf-8")
print(f"Wrote {OUT} ({len(items)} products)")
