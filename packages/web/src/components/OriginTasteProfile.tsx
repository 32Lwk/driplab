const TASTE_DIMS = [
  { key: "acidity" as const, label: "酸味" },
  { key: "body" as const, label: "コク" },
  { key: "bitterness" as const, label: "苦味" },
  { key: "sweetness" as const, label: "甘さ" },
];

export interface TasteProfileValues {
  acidity: number;
  body: number;
  bitterness: number;
  sweetness: number;
}

interface OriginTasteProfileProps {
  profile: TasteProfileValues;
}

export function OriginTasteProfile({ profile }: OriginTasteProfileProps) {
  return (
    <dl className="bean-taste-profile origin-taste-profile">
      {TASTE_DIMS.map(({ key, label }) => (
        <div key={key} className="bean-taste-row">
          <dt>{label}</dt>
          <dd>
            <span
              className="bean-taste-bar"
              role="meter"
              aria-label={`${label} ${profile[key]}`}
              aria-valuenow={profile[key]}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span
                className="bean-taste-fill"
                style={{ width: `${profile[key]}%` }}
              />
            </span>
            <span className="bean-taste-value">{profile[key]}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
