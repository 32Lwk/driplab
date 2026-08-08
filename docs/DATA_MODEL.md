# データモデル

## チェーン（Chain）

```typescript
type ChainId =
  | "starbucks"
  | "maruyama"
  | "doutor"
  | "tullys"
  | "kaldi";

interface Chain {
  id: ChainId;
  name_ja: string;
  name_en: string;
  website: string;
  logo_url?: string;
}
```

## 豆商品（BeanProduct）

各チェーンから取得する 1 商品 = 1 レコード。

```typescript
interface BeanProduct {
  id: string;                    // 例: "starbucks-house-blend-250g"
  chain_id: ChainId;
  name: string;                  // 商品名
  description?: string;          // 公式説明文（短縮可）
  roast_level: "light" | "medium" | "medium_dark" | "dark";
  origin?: string[];             // ["エチオピア", "コロンビア"]
  flavor_tags: string[];         // ["チョコ", "ナッツ", "柑橘", " floral"]
  acidity: number;               // 0-100（正規化）
  body: number;                  // 0-100
  bitterness: number;            // 0-100
  sweetness: number;             // 0-100
  caffeine: "low" | "medium" | "high";
  price_jpy?: number;
  weight_g?: number;
  buy_url: string;
  image_url?: string;
  image_local?: string;          // repo-relative path e.g. data/images/starbucks/xxx.jpg
  purchase_channel?: "ec" | "store" | "both";
  availability?: ("ec" | "store")[];
  menu_url?: string;             // tullys.co.jp product page when store-only
  scraped_at?: string;           // ISO8601
  available: boolean;            // 入手可否（MVP は true 固定可）
}
```

### 属性の付与方法

| 属性 | 取得元 |
|------|--------|
| name, description, price, buy_url | スクレイピング / 手動 |
| roast_level | 公式表記をマッピング |
| acidity, body, bitterness, sweetness | 公式フレーバーノート → ルールで 0-100 化 |
| flavor_tags | 説明文からキーワード抽出 |
| caffeine | 焙煎度 + 品種から推定（深煎りデカフェ等は例外） |

## 気分（MoodProfile）

```typescript
interface MoodProfile {
  alertness: number;       // 0-100 覚醒度
  acidity_pref: number;    // 0-100 酸味好み
  body_pref: number;       // 0-100 コク好み
  sweetness_pref: number;  // 0-100 甘さ好み
}
```

## 器具（Equipment）

```typescript
type EquipmentId =
  | "drip"
  | "french_press"
  | "espresso"
  | "siphon";

interface Equipment {
  id: EquipmentId;
  name_ja: string;
  default_recipe_template: string;  // recipes.json のキー
}
```

## 抽出レシピ（BrewRecipe）

```typescript
interface BrewRecipe {
  method: EquipmentId;
  grind: "extra_fine" | "fine" | "medium_fine" | "medium" | "coarse";
  coffee_g: number;
  water_ml?: number;
  yield_ml?: number;       // エスプレッソ用
  water_temp_c: number;
  time_sec: number;
  pressure_bar?: number;   // エスプレッソ
  steps?: string[];        // サイフォン等
  notes?: string;
}
```

## 理想プロファイル（IdealCoffeeProfile）

気分から変換する中間表現。

```typescript
interface IdealCoffeeProfile {
  target_acidity: number;
  target_body: number;
  target_bitterness: number;
  target_sweetness: number;
  target_caffeine: "low" | "medium" | "high";
  preferred_roast: RoastLevel[];
}
```

## ファイル配置

```
data/
├── seeds/
│   ├── chains.json
│   └── beans.seed.json      # MVP の正（15〜25 件）
├── scraped/
│   ├── starbucks/raw.json
│   ├── maruyama/raw.json
│   └── ...
└── catalog/
    └── beans.json           # seed + scraped マージ後（API が読む）
```

## MVP 目標件数

| チェーン | 最低件数 | 備考 |
|----------|----------|------|
| スターバックス | 3 | オンラインストア豆 |
| 丸山コーヒー | 3 | EC 単品豆 |
| ドトール | 3 | EC 12 品目中から MVP 3 件選定済み |
| タリーズ | 3 | EC |
| カルディ | 3 | 商品ページ |
| **合計** | **15** | 理想 25 |
