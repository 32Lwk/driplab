"use client";

import type { MoodProfile } from "@driplab/recommender";

const SLIDERS: {
  key: keyof MoodProfile;
  label: string;
  low: string;
  high: string;
}[] = [
  {
    key: "alertness",
    label: "覚醒度",
    low: "リラックス",
    high: "シャキッと",
  },
  {
    key: "acidity_pref",
    label: "酸味",
    low: "少なめ",
    high: "好き",
  },
  {
    key: "body_pref",
    label: "コク",
    low: "すっきり",
    high: "しっかり",
  },
  {
    key: "sweetness_pref",
    label: "甘さ",
    low: "ビター寄り",
    high: "甘み・ナッツ",
  },
];

interface MoodSlidersProps {
  mood: MoodProfile;
  onChange: (mood: MoodProfile) => void;
}

export function MoodSliders({ mood, onChange }: MoodSlidersProps) {
  return (
    <div className="slider-group">
      {SLIDERS.map(({ key, label, low, high }) => (
        <div className="slider-field" key={key}>
          <label>
            <span>{label}</span>
            <span>{mood[key]}</span>
          </label>
          <div className="slider-hint">
            {low} ↔ {high}
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={mood[key]}
            onChange={(e) =>
              onChange({ ...mood, [key]: Number(e.target.value) })
            }
          />
        </div>
      ))}
    </div>
  );
}
