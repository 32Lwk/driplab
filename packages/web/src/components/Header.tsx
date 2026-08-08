import { CoffeeIcon } from "./CoffeeIcon";

export function Header() {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-elevated)",
        padding: "1rem",
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <CoffeeIcon size={36} />
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            DripLab
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
            }}
          >
            気分で選ぶ、今日の一杯
          </p>
        </div>
      </div>
    </header>
  );
}
