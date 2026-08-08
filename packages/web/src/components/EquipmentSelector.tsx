"use client";

import { EQUIPMENT_OPTIONS } from "@driplab/recommender";
import type { EquipmentId } from "@driplab/recommender";

interface EquipmentSelectorProps {
  selected: EquipmentId[];
  onChange: (selected: EquipmentId[]) => void;
}

export function EquipmentSelector({
  selected,
  onChange,
}: EquipmentSelectorProps) {
  const toggle = (id: EquipmentId) => {
    if (selected.includes(id)) {
      const next = selected.filter((s) => s !== id);
      onChange(next.length > 0 ? next : [id]);
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="equipment-grid">
      {EQUIPMENT_OPTIONS.map(({ id, name_ja }) => (
        <label
          key={id}
          className={`equipment-chip${selected.includes(id) ? " selected" : ""}`}
        >
          <input
            type="checkbox"
            checked={selected.includes(id)}
            onChange={() => toggle(id)}
          />
          <span>{name_ja}</span>
        </label>
      ))}
    </div>
  );
}
