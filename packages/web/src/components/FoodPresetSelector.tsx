"use client";

import { FOOD_PRESETS } from "@driplab/recommender";

interface FoodPresetSelectorProps {
  value: string | null;
  onChange: (presetId: string) => void;
}

export function FoodPresetSelector({ value, onChange }: FoodPresetSelectorProps) {
  return (
    <div className="food-preset-grid">
      {FOOD_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className={`food-preset-chip${value === preset.id ? " active" : ""}`}
          onClick={() => onChange(preset.id)}
          title={preset.description}
        >
          <span className="food-preset-emoji" aria-hidden>
            {preset.emoji}
          </span>
          {preset.label_ja}
        </button>
      ))}
    </div>
  );
}
