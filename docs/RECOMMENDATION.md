# レコメンドロジック

## 概要

ルールベース + スコアリング（MVP）。LLM は説明文生成のみ（任意）。

## Step 1: 気分 → 理想プロファイル

```typescript
function moodToIdeal(mood: MoodProfile): IdealCoffeeProfile {
  return {
    target_acidity: mood.acidity_pref,
    target_body: mood.body_pref,
    target_bitterness: 100 - mood.sweetness_pref,
    target_sweetness: mood.sweetness_pref,
    target_caffeine:
      mood.alertness >= 67 ? "high" :
      mood.alertness >= 34 ? "medium" : "low",
    preferred_roast: roastFromMood(mood),
  };
}
```

### 焙煎度の目安

| 条件 | preferred_roast |
|------|-----------------|
| 覚醒度高 + コク高 | medium_dark, dark |
| 酸味好み高 | light, medium |
| 甘さ・リラックス | medium, medium_dark |
| 覚醒度低 | medium（刺激少なめ） |

## Step 2: 豆スコアリング

各 `BeanProduct` に対し weighted distance（小さいほど良い）:

| 次元 | 重み |
|------|------|
| acidity | 0.25 |
| body | 0.25 |
| bitterness | 0.15 |
| sweetness | 0.15 |
| caffeine 一致 | 0.10 |
| roast 一致 | 0.10 |

```typescript
score = 1 - normalizedDistance(ideal, bean);
```

- Top1 = primary
- Top2-3 = alternatives（**チェーン被りを避ける**）

## Step 3: 器具 → 抽出レシピ

豆の `roast_level` + `equipment` + `mood.alertness` からテンプレ選択。

### ドリップ（drip）ベース

| roast | coffee_g | water_ml | temp_c | time_sec | grind |
|-------|----------|----------|--------|----------|-------|
| light | 15 | 250 | 94 | 180 | medium-fine |
| medium | 15 | 240 | 92 | 150 | medium-fine |
| dark | 16 | 230 | 88 | 120 | medium |

**気分補正**

- 覚醒度低 → temp -2℃, time -15s
- 覚醒度高 → coffee_g +1g

### フレンチプレス（french_press）

| roast | coffee_g | water_ml | temp_c | time_sec | grind |
|-------|----------|----------|--------|----------|-------|
| medium | 20 | 300 | 92 | 240 | coarse |

### エスプレッソ（espresso）

| roast | coffee_g | yield_ml | time_sec | grind |
|-------|----------|----------|----------|-------|
| medium_dark | 18 | 36 | 28 | fine |

### サイフォン（siphon）

| roast | coffee_g | water_ml | temp_c | grind |
|-------|----------|----------|--------|-------|
| light/medium | 20 | 300 | 92 | medium |

## Step 4: 説明文（reason）

MVP: テンプレート

```
「{覚醒度の説明}で、{酸味/コク}のバランスから
{chain}の「{name}」を選びました。
{equipment}なら{特徴}が引き立ちます。」
```

将来: LLM で自然文化（API コスト注意）

## 器具が複数選択された場合

- primary 提案は **最もスコアが高い器具** 1 つ
- 他器具は「この豆でこう淹れても」の折りたたみ表示

## テストケース（必須）

| # | 気分 | 期待 |
|---|------|------|
| 1 | 覚醒度 max, コク max | 深煎り・高カフェイン寄り |
| 2 | 覚醒度 min, 甘さ max | 中煎り・マイルド |
| 3 | 酸味 max | 浅煎り・柑橘系タグ |
| 4 | 全中央 | バランス型ブレンド |
| 5 | 器具=espresso のみ | エスプレッソレシピ |
