import { EQUIPMENT_OPTIONS, EQUIPMENT_PRIORITY } from "./constants";
import type { BeanProduct, EquipmentId, MoodProfile } from "./types";

const ALL_EQUIPMENT: EquipmentId[] = [
  "drip",
  "french_press",
  "espresso",
  "siphon",
];

/**
 * Extraction character of each method on the shared 0–100 taste space.
 * Used to match user mood ideals (Plan: brew recommendation redesign).
 */
interface MethodProfile {
  /** How strongly the method surfaces acidity / brightness */
  acidity: number;
  /** Body / oil / mouthfeel contribution */
  body: number;
  /** Tendency toward roast bitterness */
  bitterness: number;
  /** Clarity / filter transparency */
  clarity: number;
  /** Perceived strength / concentration */
  intensity: number;
  /** Ideal absolute roast_index center */
  roast_center: number;
  /** Distance at which roast affinity → 0 */
  roast_span: number;
}

const METHOD_PROFILES: Record<EquipmentId, MethodProfile> = {
  drip: {
    acidity: 72,
    body: 45,
    bitterness: 35,
    clarity: 82,
    intensity: 52,
    roast_center: 1.0,
    roast_span: 1.4,
  },
  french_press: {
    acidity: 42,
    body: 78,
    bitterness: 52,
    clarity: 32,
    intensity: 62,
    roast_center: 1.8,
    roast_span: 1.2,
  },
  espresso: {
    acidity: 38,
    body: 82,
    bitterness: 72,
    clarity: 48,
    intensity: 92,
    roast_center: 2.3,
    roast_span: 1.1,
  },
  siphon: {
    acidity: 76,
    body: 50,
    bitterness: 34,
    clarity: 86,
    intensity: 50,
    roast_center: 0.9,
    roast_span: 1.2,
  },
};

interface MoodBrewTarget {
  acidity: number;
  body: number;
  bitterness: number;
  clarity: number;
  intensity: number;
}

function moodToBrewTarget(mood: MoodProfile): MoodBrewTarget {
  return {
    acidity: mood.acidity_pref,
    body: mood.body_pref,
    bitterness: 100 - mood.sweetness_pref,
    // High acidity + lighter body → prefer clarity (paper / vacuum clarity)
    clarity: Math.round(
      mood.acidity_pref * 0.55 + (100 - mood.body_pref) * 0.45,
    ),
    intensity: mood.alertness,
  };
}

function beanRoastIndex(bean: BeanProduct): number {
  if (typeof bean.roast_index === "number" && !Number.isNaN(bean.roast_index)) {
    return bean.roast_index;
  }
  const map = { light: 0.3, medium: 1.1, medium_dark: 2.0, dark: 2.7 } as const;
  return map[bean.roast_level] ?? 1.1;
}

function profileSimilarity(
  target: MoodBrewTarget,
  profile: MethodProfile,
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

function roastAffinity(roastIndex: number, profile: MethodProfile): number {
  const delta = Math.abs(roastIndex - profile.roast_center);
  return Math.max(0, 1 - delta / profile.roast_span);
}

/**
 * Score how well an equipment fits this bean + mood.
 * Returns 0–1. No constant drip bias; acidity preference raises drip/siphon.
 */
export function scoreEquipment(
  bean: BeanProduct,
  mood: MoodProfile,
  equipment: EquipmentId,
): number {
  const profile = METHOD_PROFILES[equipment];
  const target = moodToBrewTarget(mood);
  const tasteFit = profileSimilarity(target, profile);
  const roastFit = roastAffinity(beanRoastIndex(bean), profile);

  // Soft penalty for classic espresso on very light roasts (still allowed)
  let soft = 1;
  if (equipment === "espresso" && beanRoastIndex(bean) < 0.7) {
    soft = 0.92;
  }

  const score = (tasteFit * 0.72 + roastFit * 0.28) * soft;
  return Math.round(Math.max(0, Math.min(1, score)) * 100) / 100;
}

export function pickBestEquipment(
  bean: BeanProduct,
  mood: MoodProfile,
  available?: EquipmentId[],
): { equipment: EquipmentId; score: number } {
  const pool =
    available && available.length > 0 ? available : ALL_EQUIPMENT;

  let best: EquipmentId = pool[0] ?? "drip";
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

export function methodChangeNote(equipment: EquipmentId): string {
  switch (equipment) {
    case "drip":
      return "酸と香りの輪郭がはっきり出ます";
    case "french_press":
      return "油分が残り、甘みとボディが厚くなります";
    case "espresso":
      return "短時間で濃縮され、ミルクとも相性が良いです";
    case "siphon":
      return "香り立ちが良く、クリアな浸漬感になります";
    default:
      return "";
  }
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
      if (mood.body_pref >= 60) {
        return "コクを凝縮して味わえるエスプレッソ";
      }
      return "濃厚な一杯に仕上げるエスプレッソ";
    case "french_press":
      if (mood.body_pref >= 55 || mood.sweetness_pref >= 60) {
        return "コクと油分・甘みを残して淹れるフレンチプレス";
      }
      return "まろやかに楽しめるフレンチプレス";
    case "siphon":
      if (mood.acidity_pref >= 60) {
        return "酸味と香りをクリアに立てるサイフォン";
      }
      return "香り高くクリアに淹れるサイフォン";
    default:
      if (mood.acidity_pref >= 60) {
        return "酸味と香りの層を調整しやすいハンドドリップ";
      }
      if (mood.body_pref <= 40) {
        return "すっきりクリアに仕上げやすいハンドドリップ";
      }
      return "バランスよく淹れられるハンドドリップ";
  }
}

export function equipmentLabel(id: EquipmentId): string {
  return EQUIPMENT_OPTIONS.find((e) => e.id === id)?.name_ja ?? id;
}

/** @deprecated use pickBestEquipment */
export function pickPrimaryEquipment(selected: EquipmentId[]): EquipmentId {
  for (const id of EQUIPMENT_PRIORITY) {
    if (selected.includes(id)) return id;
  }
  return "drip";
}

export { METHOD_PROFILES, ALL_EQUIPMENT };
