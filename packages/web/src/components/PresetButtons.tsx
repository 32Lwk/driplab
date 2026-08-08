"use client";

import { MOOD_PRESETS } from "@driplab/recommender";
import type { MoodProfile } from "@driplab/recommender";

interface PresetButtonsProps {
  mood: MoodProfile;
  onSelect: (mood: MoodProfile) => void;
}

export function PresetButtons({ mood, onSelect }: PresetButtonsProps) {
  const isActive = (preset: (typeof MOOD_PRESETS)[number]) =>
    preset.mood.alertness === mood.alertness &&
    preset.mood.acidity_pref === mood.acidity_pref &&
    preset.mood.body_pref === mood.body_pref &&
    preset.mood.sweetness_pref === mood.sweetness_pref;

  return (
    <div className="preset-row">
      {MOOD_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className={`preset-chip${isActive(preset) ? " active" : ""}`}
          onClick={() => onSelect({ ...preset.mood })}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
