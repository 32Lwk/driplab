"use client";

import { FOOD_PRESETS } from "@driplab/recommender";

interface FoodPresetSelectorProps {
  value: string | null;
  onChange: (presetId: string) => void;
}

const FOOD_ICONS: Record<string, string> = {
  chocolate: "✦",
  cheesecake: "◈",
  fruit_tart: "◇",
  croissant: "⌁",
  matcha_sweet: "◔",
  ice_cream: "✧",
  pancake: "⊙",
  cheese_plate: "⬡",
  savory_breakfast: "◒",
  salad: "❧",
  curry: "♨",
  japanese: "≋",
};

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
          <span className="food-preset-icon" aria-hidden>
            {FOOD_ICONS[preset.id] ?? "•"}
          </span>
          {preset.label_ja}
        </button>
      ))}
    </div>
  );
}
