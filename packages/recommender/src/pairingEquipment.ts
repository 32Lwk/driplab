import { METHOD_PROFILES, ALL_EQUIPMENT } from "./equipment";
import type { BeanProduct, EquipmentId } from "./types";
import type { FoodIdealProfile, FoodPreset } from "./foodPresets";

interface FoodBrewTarget {
  acidity: number;
  body: number;
  bitterness: number;
  clarity: number;
  intensity: number;
}

function foodToBrewTarget(ideal: FoodIdealProfile): FoodBrewTarget {
  return {
    acidity: ideal.target_acidity,
    body: ideal.target_body,
    bitterness: ideal.target_bitterness,
    clarity: Math.round(
      ideal.target_acidity * 0.5 + (100 - ideal.target_body) * 0.5,
    ),
    intensity: Math.round(ideal.target_body * 0.6 + ideal.target_bitterness * 0.4),
  };
}

function profileSimilarity(
  target: FoodBrewTarget,
  profile: (typeof METHOD_PROFILES)[EquipmentId],
): number {
  const terms = [
    { w: 0.28, d: Math.abs(target.acidity - profile.acidity) },
    { w: 0.22, d: Math.abs(target.body - profile.body) },
    { w: 0.15, d: Math.abs(target.bitterness - profile.bitterness) },
    { w: 0.2, d: Math.abs(target.clarity - profile.clarity) },
    { w: 0.15, d: Math.abs(target.intensity - profile.intensity) },
  ];
  const distance = terms.reduce((sum, t) => sum + t.w * (t.d / 100), 0);
  return Math.max(0, 1 - distance);
}

function beanRoastIndex(bean: BeanProduct): number {
  if (typeof bean.roast_index === "number" && !Number.isNaN(bean.roast_index)) {
    return bean.roast_index;
  }
  const map = { light: 0.3, medium: 1.1, medium_dark: 2.0, dark: 2.7 } as const;
  return map[bean.roast_level] ?? 1.1;
}

function roastAffinity(
  roastIndex: number,
  profile: (typeof METHOD_PROFILES)[EquipmentId],
): number {
  const delta = Math.abs(roastIndex - profile.roast_center);
  return Math.max(0, 1 - delta / profile.roast_span);
}

/**
 * Q9-C: Score equipment for food pairing — includes preset equipment_bias.
 */
export function scoreEquipmentForPairing(
  bean: BeanProduct,
  food: FoodPreset,
  equipment: EquipmentId,
): number {
  const profile = METHOD_PROFILES[equipment];
  const target = foodToBrewTarget(food.ideal);
  const tasteFit = profileSimilarity(target, profile);
  const roastFit = roastAffinity(beanRoastIndex(bean), profile);
  const foodBias = food.equipment_bias[equipment] ?? 0.5;

  const score =
    tasteFit * 0.45 + roastFit * 0.2 + foodBias * 0.35;

  return Math.round(Math.max(0, Math.min(1, score)) * 100) / 100;
}

export function pickBestEquipmentForPairing(
  bean: BeanProduct,
  food: FoodPreset,
  available?: EquipmentId[],
): { equipment: EquipmentId; score: number } {
  const pool = available && available.length > 0 ? available : ALL_EQUIPMENT;

  let best: EquipmentId = pool[0] ?? "drip";
  let bestScore = -1;

  for (const equipment of pool) {
    const s = scoreEquipmentForPairing(bean, food, equipment);
    if (s > bestScore) {
      bestScore = s;
      best = equipment;
    }
  }

  return { equipment: best, score: bestScore };
}

export function rankOtherEquipmentForPairing(
  bean: BeanProduct,
  food: FoodPreset,
  exclude: EquipmentId,
  available?: EquipmentId[],
): { equipment: EquipmentId; score: number }[] {
  const pool = available && available.length > 0 ? available : ALL_EQUIPMENT;

  return pool
    .filter((eq) => eq !== exclude)
    .map((equipment) => ({
      equipment,
      score: scoreEquipmentForPairing(bean, food, equipment),
    }))
    .sort((a, b) => b.score - a.score);
}

export function pairingEquipmentPhrase(
  food: FoodPreset,
  equipment: EquipmentId,
): string {
  const bias = food.equipment_bias[equipment] ?? 0.5;
  switch (equipment) {
    case "french_press":
      if (bias >= 0.85) {
        return `「${food.label_ja}」の重さに合わせ、油分とコクを残すフレンチプレス`;
      }
      return "まろやかな浸出で食後の余韻を整えるフレンチプレス";
    case "espresso":
      if (bias >= 0.85) {
        return `デザートの甘さと対比する濃縮感のエスプレッソ`;
      }
      return "短時間でコクを凝縮するエスプレッソ";
    case "siphon":
      if (bias >= 0.85) {
        return `繊細な食事に合わせ、香りをクリアに立てるサイフォン`;
      }
      return "香り高くクリアに淹れるサイフォン";
    default:
      if (bias >= 0.85) {
        return `「${food.label_ja}」に合わせ、バランスよく淹れるハンドドリップ`;
      }
      return "食事の味を邪魔しないバランス型ハンドドリップ";
  }
}
