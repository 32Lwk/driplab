"use client";

import type { RecommendMode } from "@driplab/recommender";

interface ModeToggleProps {
  mode: RecommendMode;
  onChange: (mode: RecommendMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="mode-toggle" role="tablist" aria-label="提案モード">
      <button
        type="button"
        role="tab"
        aria-selected={mode === "mood"}
        className={`mode-toggle-btn${mode === "mood" ? " active" : ""}`}
        onClick={() => onChange("mood")}
      >
        気分で選ぶ
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "pairing"}
        className={`mode-toggle-btn${mode === "pairing" ? " active" : ""}`}
        onClick={() => onChange("pairing")}
      >
        食事に合わせる
      </button>
    </div>
  );
}
