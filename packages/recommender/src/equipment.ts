import { EQUIPMENT_PRIORITY } from "./constants";
import type { BeanProduct, EquipmentId, MoodProfile } from "./types";

const ALL_EQUIPMENT: EquipmentId[] = [
  "drip",
  "french_press",
  "espresso",
  "siphon",
];

export function scoreEquipment(
  bean: BeanProduct,
  mood: MoodProfile,
  equipment: EquipmentId,
): number {
  let score = 0.5;
  const roast = bean.roast_level;

  switch (equipment) {
    case "drip":
      score += 0.1;
      if (roast === "light" || roast === "medium") score += 0.08;
      score += ((mood.alertness - 50) / 50) * 0.04;
      score += ((50 - mood.acidity_pref) / 50) * 0.03;
      break;
    case "french_press":
      score += ((mood.body_pref - 50) / 50) * 0.14;
      score += ((mood.sweetness_pref - 50) / 50) * 0.1;
      if (roast === "medium" || roast === "medium_dark") score += 0.1;
      score += ((50 - mood.alertness) / 50) * 0.08;
      break;
    case "espresso":
      score += ((mood.alertness - 50) / 50) * 0.16;
      score += ((mood.body_pref - 50) / 50) * 0.12;
      if (roast === "medium_dark" || roast === "dark") score += 0.14;
      if (roast === "light") score -= 0.22;
      break;
    case "siphon":
      score += ((mood.acidity_pref - 50) / 50) * 0.16;
      if (roast === "light" || roast === "medium") score += 0.12;
      score += ((50 - mood.alertness) / 50) * 0.06;
      if (roast === "dark") score -= 0.1;
      break;
  }

  return Math.round(Math.max(0, Math.min(1, score)) * 100) / 100;
}

export function pickBestEquipment(
  bean: BeanProduct,
  mood: MoodProfile,
  available?: EquipmentId[],
): { equipment: EquipmentId; score: number } {
  const pool =
    available && available.length > 0 ? available : ALL_EQUIPMENT;

  let best: EquipmentId = "drip";
  let bestScore = -1;

  for (const equipment of pool) {
    const s = scoreEquipment(bean, mood, equipment);
    if (s > bestScore) {
      bestScore = s;
      best = equipment;
    }
  }

  return { equipment: best, score: bestScore };
}

export function rankOtherEquipment(
  bean: BeanProduct,
  mood: MoodProfile,
  exclude: EquipmentId,
  available?: EquipmentId[],
): { equipment: EquipmentId; score: number }[] {
  const pool =
    available && available.length > 0 ? available : ALL_EQUIPMENT;

  return pool
    .filter((eq) => eq !== exclude)
    .map((equipment) => ({
      equipment,
      score: scoreEquipment(bean, mood, equipment),
    }))
    .sort((a, b) => b.score - a.score);
}

export function equipmentReasonPhrase(
  mood: MoodProfile,
  equipment: EquipmentId,
): string {
  switch (equipment) {
    case "espresso":
      if (mood.alertness >= 65) {
        return "覚醒度が高いので、短時間でしっかり抽出できるエスプレッソ";
      }
      return "深いコクをコンパクトに味わえるエスプレッソ";
    case "french_press":
      if (mood.body_pref >= 55) {
        return "コクと油分を残して淹れるフレンチプレス";
      }
      return "まろやかに楽しめるフレンチプレス";
    case "siphon":
      if (mood.acidity_pref >= 60) {
        return "酸味と香りが立つサイフォン";
      }
      return "クリアな味わいのサイフォン";
    default:
      if (mood.acidity_pref >= 60) {
        return "酸味の層を調整しやすいハンドドリップ";
      }
      return "バランスよく淹れられるハンドドリップ";
  }
}

/** @deprecated use pickBestEquipment */
export function pickPrimaryEquipment(selected: EquipmentId[]): EquipmentId {
  for (const id of EQUIPMENT_PRIORITY) {
    if (selected.includes(id)) return id;
  }
  return "drip";
}
