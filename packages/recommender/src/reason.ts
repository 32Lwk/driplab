import { CHAIN_LABELS } from "./constants";
import {
  equipmentReasonPhrase,
  methodChangeNote,
} from "./equipment";
import type {
  BeanProduct,
  BrewRecipe,
  EquipmentId,
  MoodProfile,
  RecommendReasonParts,
} from "./types";

function alertnessPhrase(alertness: number): string {
  if (alertness >= 67) return "シャキッとしたい";
  if (alertness <= 33) return "リラックスしたい";
  return "バランスよく過ごしたい";
}

function dominantTaste(mood: MoodProfile): string {
  const entries: [string, number][] = [
    ["酸味をしっかり感じたい", mood.acidity_pref],
    ["コクを求めたい", mood.body_pref],
    ["甘みやまろやかさを好む", mood.sweetness_pref],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  if (entries[0][1] >= 60) return entries[0][0];
  if (mood.acidity_pref <= 35 && mood.body_pref >= 55) {
    return "苦味・コク寄りで酸は控えめにしたい";
  }
  return "味のバランスを大切にしたい";
}

function brewParamPhrase(bean: BeanProduct, recipe: BrewRecipe): string {
  const bits: string[] = [];
  if (recipe.method === "drip" || recipe.method === "french_press" || recipe.method === "siphon") {
    bits.push(`湯温${recipe.water_temp_c}℃`);
  }
  bits.push(recipe.grind_ja);
  if (recipe.water_ml && recipe.coffee_g) {
    bits.push(`比率1:${Math.round(recipe.water_ml / recipe.coffee_g)}`);
  } else if (recipe.yield_ml && recipe.coffee_g) {
    bits.push(`約1:${Math.round(recipe.yield_ml / recipe.coffee_g)}`);
  }

  const roastHint =
    bean.roast_level === "light"
      ? "浅めの焙煎なので成分を引き出しつつ雑味を抑える設定"
      : bean.roast_level === "dark"
        ? "深煎りなので過抽出の苦渋を避ける設定"
        : "焙煎度に合わせた抽出設定";

  return `${bits.join("・")}（${roastHint}）`;
}

export function buildReasonParts(
  bean: BeanProduct,
  mood: MoodProfile,
  recipe: BrewRecipe,
): RecommendReasonParts {
  const chain = CHAIN_LABELS[bean.chain_id] ?? bean.chain_id;
  const mood_summary = `今日は${alertnessPhrase(mood.alertness)}気分で、${dominantTaste(mood)}意向です。`;

  const tags =
    bean.flavor_tags && bean.flavor_tags.length > 0
      ? bean.flavor_tags.slice(0, 2).join("・")
      : bean.taste_label_ja ?? "個性";

  const bean_fit = `${chain}の「${bean.display_name}」は、${tags}の方向があなたの志向に近く選ばれました。`;

  const equipWhy = equipmentReasonPhrase(mood, recipe.method);
  const brew_fit = `${equipWhy}を推奨します。${brewParamPhrase(bean, recipe)}です。`;

  return { mood_summary, bean_fit, brew_fit };
}

export function buildReason(
  bean: BeanProduct,
  mood: MoodProfile,
  recipe: BrewRecipe,
  _equipmentScore: number,
): string {
  const parts = buildReasonParts(bean, mood, recipe);
  return `${parts.mood_summary}${parts.bean_fit}${parts.brew_fit}`;
}

export function otherMethodBlurb(
  equipment: EquipmentId,
  score: number,
): string {
  const note = methodChangeNote(equipment);
  return `${note}（適合 ${Math.round(score * 100)}%）`;
}
