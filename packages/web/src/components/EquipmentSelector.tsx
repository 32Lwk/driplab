"use client";

import { EQUIPMENT_OPTIONS } from "@driplab/recommender";
import type { EquipmentId } from "@driplab/recommender";

interface EquipmentSelectorProps {
  value: EquipmentId[];
  onChange: (value: EquipmentId[]) => void;
}

export function EquipmentSelector({ value, onChange }: EquipmentSelectorProps) {
  const toggle = (id: EquipmentId) => {
    if (value.includes(id)) {
      if (value.length === 1) return; // keep at least one
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div>
      <div className="equipment-grid">
        {EQUIPMENT_OPTIONS.map(({ id, name_ja }) => {
          const selected = value.includes(id);
          return (
            <label
              key={id}
              className={`equipment-chip${selected ? " selected" : ""}`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggle(id)}
              />
              <span>{name_ja}</span>
            </label>
          );
        })}
      </div>
      <p
        style={{
          margin: "0.5rem 0 0",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
        }}
      >
        持っている器具だけ選んでください（未所持の器具は提案しません）
      </p>
    </div>
  );
}
