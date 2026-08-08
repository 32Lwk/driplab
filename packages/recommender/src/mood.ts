import type { IdealCoffeeProfile, MoodProfile, RoastLevel } from "./types";

const ROAST_ORDER: RoastLevel[] = ["light", "medium", "medium_dark", "dark"];

export function idealRoastIndex(mood: MoodProfile): number {
  let idx = 1;
  idx += ((mood.alertness - 50) / 50) * 0.9;
  idx += ((mood.body_pref - 50) / 50) * 0.7;
  idx -= ((mood.acidity_pref - 50) / 50) * 0.8;
  idx += ((50 - mood.sweetness_pref) / 50) * 0.35;
  return Math.max(0, Math.min(3, idx));
}

export function roastFromMood(mood: MoodProfile): RoastLevel[] {
  const idx = idealRoastIndex(mood);
  const centerIdx = Math.min(
    ROAST_ORDER.length - 1,
    Math.max(0, Math.round(idx)),
  );
  const roasts = new Set<RoastLevel>();
  roasts.add(ROAST_ORDER[centerIdx]);
  if (centerIdx > 0) roasts.add(ROAST_ORDER[centerIdx - 1]);
  if (centerIdx < ROAST_ORDER.length - 1) {
    roasts.add(ROAST_ORDER[centerIdx + 1]);
  }
  return [...roasts];
}

export function moodToIdeal(mood: MoodProfile): IdealCoffeeProfile {
  return {
    target_acidity: mood.acidity_pref,
    target_body: mood.body_pref,
    target_bitterness: 100 - mood.sweetness_pref,
    target_sweetness: mood.sweetness_pref,
    target_caffeine:
      mood.alertness >= 67 ? "high" : mood.alertness >= 34 ? "medium" : "low",
    target_caffeine_num: mood.alertness,
    preferred_roast: roastFromMood(mood),
    target_roast_index: idealRoastIndex(mood),
  };
}
