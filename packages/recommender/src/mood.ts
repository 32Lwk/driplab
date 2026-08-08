import type { IdealCoffeeProfile, MoodProfile, RoastLevel } from "./types";

export function roastFromMood(mood: MoodProfile): RoastLevel[] {
  const roasts = new Set<RoastLevel>();

  if (mood.alertness >= 60 && mood.body_pref >= 60) {
    roasts.add("medium_dark");
    roasts.add("dark");
  }
  if (mood.acidity_pref >= 60) {
    roasts.add("light");
    roasts.add("medium");
  }
  if (mood.sweetness_pref >= 60 || mood.alertness <= 40) {
    roasts.add("medium");
    roasts.add("medium_dark");
  }
  if (mood.alertness <= 40) {
    roasts.add("medium");
  }

  if (roasts.size === 0) {
    return ["medium"];
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
    preferred_roast: roastFromMood(mood),
  };
}
