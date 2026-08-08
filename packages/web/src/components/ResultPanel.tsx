"use client";

import type { RecommendItem, BrewRecipe } from "@driplab/recommender";

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${m}分`;
}

function formatPrice(yen?: number): string | null {
  if (yen == null) return null;
  return `¥${yen.toLocaleString("ja-JP")}`;
}

function RecipeDetails({ recipe }: { recipe: BrewRecipe }) {
  return (
    <div className="recipe-box">
      <h4>{recipe.method_ja} のレシピ</h4>
      <dl className="recipe-grid">
        <dt>挽き目</dt>
        <dd>{recipe.grind_ja}</dd>
        <dt>コーヒー量</dt>
        <dd>{recipe.coffee_g}g</dd>
        {recipe.water_ml != null && (
          <>
            <dt>お湯</dt>
            <dd>{recipe.water_ml}ml</dd>
          </>
        )}
        {recipe.yield_ml != null && (
          <>
            <dt>抽出量</dt>
            <dd>{recipe.yield_ml}ml</dd>
          </>
        )}
        <dt>水温</dt>
        <dd>{recipe.water_temp_c}℃</dd>
        <dt>時間</dt>
        <dd>{formatTime(recipe.time_sec)}</dd>
      </dl>
      {recipe.notes && (
        <p style={{ margin: "0.75rem 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          {recipe.notes}
        </p>
      )}
    </div>
  );
}

function ResultCardInner({
  item,
  variant,
}: {
  item: RecommendItem;
  variant: "primary" | "alt";
}) {
  const price = formatPrice(item.price_jpy);
  const weight = item.weight_g ? `${item.weight_g}g` : null;

  if (variant === "alt") {
    return (
      <div className="alt-card">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.product_name} loading="lazy" />
        ) : (
          <div
            style={{
              width: 72,
              height: 72,
              background: "#efebe9",
              borderRadius: 8,
            }}
          />
        )}
        <div>
          <h5>{item.product_name}</h5>
          <p>
            {item.chain_name_ja} · マッチ {Math.round(item.match_score * 100)}%
          </p>
          <a
            href={item.buy_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "0.8125rem" }}
          >
            購入ページ →
          </a>
        </div>
      </div>
    );
  }

  return (
    <article className="result-card primary">
      {item.image_url && (
        <div className="result-image-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image_url} alt={item.product_name} />
        </div>
      )}
      <div className="result-body">
        <div className="result-chain">{item.chain_name_ja}</div>
        <h2 className="result-name">{item.product_name}</h2>
        <span className="result-score">
          マッチ度 {Math.round(item.match_score * 100)}%
        </span>
        {(price || weight) && (
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem" }}>
            {[price, weight].filter(Boolean).join(" · ")}
          </p>
        )}
        <p className="result-reason">{item.reason}</p>
        {item.flavor_tags && item.flavor_tags.length > 0 && (
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: "0 0 1rem" }}>
            {item.flavor_tags.slice(0, 4).join(" · ")}
          </p>
        )}
        <RecipeDetails recipe={item.recipe} />
        <a
          className="buy-link"
          href={item.buy_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          購入ページへ
        </a>
      </div>
    </article>
  );
}

interface ResultPanelProps {
  primary: RecommendItem;
  alternatives: RecommendItem[];
}

export function ResultPanel({ primary, alternatives }: ResultPanelProps) {
  return (
    <div className="result-panel">
      <p className="section-title">今日の一杯</p>
      <ResultCardInner item={primary} variant="primary" />

      {alternatives.length > 0 && (
        <details className="alternatives">
          <summary className="alternatives-toggle">
            他の候補を見る（{alternatives.length}件）
            <span aria-hidden>▼</span>
          </summary>
          <div className="alternatives-list">
            {alternatives.map((item) => (
              <ResultCardInner
                key={`${item.chain_id}-${item.product_name}`}
                item={item}
                variant="alt"
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
