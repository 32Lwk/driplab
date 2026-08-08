import type { BeanProduct } from "@driplab/recommender";

const TASTE_DIMS: {
  key: keyof Pick<BeanProduct, "acidity" | "body" | "bitterness" | "sweetness">;
  label: string;
}[] = [
  { key: "acidity", label: "酸味" },
  { key: "body", label: "コク" },
  { key: "bitterness", label: "苦味" },
  { key: "sweetness", label: "甘さ" },
];

export function BeanTasteProfile({ bean }: { bean: BeanProduct }) {
  return (
    <dl className="bean-taste-profile">
      {TASTE_DIMS.map(({ key, label }) => (
        <div key={key} className="bean-taste-row">
          <dt>{label}</dt>
          <dd>
            <span
              className="bean-taste-bar"
              role="meter"
              aria-label={`${label} ${bean[key]}`}
              aria-valuenow={bean[key]}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span
                className="bean-taste-fill"
                style={{ width: `${bean[key]}%` }}
              />
            </span>
            <span className="bean-taste-value">{bean[key]}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
