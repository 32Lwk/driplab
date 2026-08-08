"use client";

import type { RecommendItem, BrewRecipe } from "@driplab/recommender";
import { storyTextsEqual } from "@driplab/recommender";
import { BeanImage } from "@/components/BeanImage";
import { RecipeDetails } from "@/components/RecipeDetails";
import { showEpisodeSourceLink } from "@/lib/beanLinks";

function formatPrice(yen?: number): string | null {
  if (yen == null) return null;
  return `¥${yen.toLocaleString("ja-JP")}`;
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
          <BeanImage
            src={item.image_url}
            fallbacks={item.image_fallback_urls ?? (item.image_fallback_url ? [item.image_fallback_url] : undefined)}
            alt={item.product_name}
            loading="lazy"
          />
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
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            器具: {item.recipe.method_ja}
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
          <BeanImage
            src={item.image_url}
            fallbacks={item.image_fallback_urls ?? (item.image_fallback_url ? [item.image_fallback_url] : undefined)}
            alt={item.product_name}
            loading="eager"
          />
        </div>
      )}
      <div className="result-body">
        <div className="result-chain">{item.chain_name_ja}</div>
        <h2 className="result-name">{item.product_name}</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <span className="result-score">
            マッチ度 {Math.round(item.match_score * 100)}%
          </span>
          <span className="equipment-badge">
            おすすめ器具: {item.recipe.method_ja}
          </span>
        </div>
        {(price || weight) && (
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem" }}>
            {[price, weight].filter(Boolean).join(" · ")}
          </p>
        )}
        <p className="result-reason">{item.reason}</p>
        {item.episode && (
          <div className="episode-box">
            <h4>この豆のストーリー</h4>
            <p>{item.episode}</p>
            {showEpisodeSourceLink(item) && (
              <a
                href={item.episode_source}
                target="_blank"
                rel="noopener noreferrer"
                className="episode-source"
              >
                出典: 公式サイト →
              </a>
            )}
          </div>
        )}
        {item.taste_notes &&
          item.episode &&
          !storyTextsEqual(item.taste_notes, item.episode) &&
          item.taste_notes !== "不明" && (
            <div className="episode-box">
              <h4>味わいの特徴</h4>
              <p>{item.taste_notes}</p>
            </div>
          )}
        {item.processing && item.processing !== "不明" && (
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              margin: "0 0 1rem",
            }}
          >
            精製: {item.processing}
          </p>
        )}
        {item.flavor_tags && item.flavor_tags.length > 0 && (
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              margin: "0 0 1rem",
            }}
          >
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
  otherRecipes?: BrewRecipe[];
}

export function ResultPanel({
  primary,
  alternatives,
  otherRecipes,
}: ResultPanelProps) {
  return (
    <div className="result-panel">
      <p className="section-title">今日の一杯</p>
      <ResultCardInner item={primary} variant="primary" />

      {otherRecipes && otherRecipes.length > 0 && (
        <details className="alternatives">
          <summary className="alternatives-toggle">
            この豆で他の淹れ方（{otherRecipes.length}件）
            <span aria-hidden>▼</span>
          </summary>
          <div className="alternatives-list">
            {otherRecipes.map((recipe) => (
              <RecipeDetails
                key={recipe.method}
                recipe={recipe}
                title={recipe.method_ja}
              />
            ))}
          </div>
        </details>
      )}

      {alternatives.length > 0 && (
        <details className="alternatives">
          <summary className="alternatives-toggle">
            他の豆の候補（{alternatives.length}件）
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
