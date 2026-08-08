"use client";

import { CHAIN_LABELS } from "@driplab/recommender";
import type { ChainId } from "@driplab/recommender";

interface ChainSelectorProps {
  value: ChainId | "all";
  onChange: (value: ChainId | "all") => void;
}

const CHAIN_ORDER = Object.keys(CHAIN_LABELS) as ChainId[];

export function ChainSelector({ value, onChange }: ChainSelectorProps) {
  return (
    <div className="filter-row" style={{ marginTop: "0.25rem" }}>
      <button
        type="button"
        className={`filter-chip${value === "all" ? " active" : ""}`}
        onClick={() => onChange("all")}
      >
        すべて
      </button>
      {CHAIN_ORDER.map((id) => (
        <button
          key={id}
          type="button"
          className={`filter-chip${value === id ? " active" : ""}`}
          onClick={() => onChange(id)}
        >
          {CHAIN_LABELS[id]}
        </button>
      ))}
    </div>
  );
}
