import { CHAIN_LABELS } from "./constants";
import type { BeanProduct, BrewRecipe, MoodProfile } from "./types";

function alertnessPhrase(alertness: number): string {
  if (alertness >= 67) return "シャキッとしたい気分";
  if (alertness <= 33) return "リラックスしたい気分";
  return "バランスの取れた気分";
}

function tastePhrase(mood: MoodProfile): string {
  if (mood.acidity_pref >= 60) return "酸味を楽しみたい";
  if (mood.body_pref >= 60) return "コクを求める";
  if (mood.sweetness_pref >= 60) return "甘みやまろやかさを好む";
  return "味のバランス";
}

export function buildReason(
  bean: BeanProduct,
  mood: MoodProfile,
  recipe: BrewRecipe,
): string {
  const chain = CHAIN_LABELS[bean.chain_id] ?? bean.chain_id;
  const alert = alertnessPhrase(mood.alertness);
  const taste = tastePhrase(mood);

  return `${alert}で、${taste}のバランスから${chain}の「${bean.name}」を選びました。${recipe.method_ja}なら${bean.taste_label_ja ?? "個性"}が引き立ちます。`;
}
