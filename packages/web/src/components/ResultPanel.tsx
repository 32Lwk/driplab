"use client";

import type {
  PairingItem,
  PairingReasonParts,
  ReadjustDirection,
  RecommendItem,
  RecommendMode,
  RecommendReasonParts,
  MoodProfile,
  BrewRecipe,
} from "@driplab/recommender";
import { storyTextsEqual } from "@driplab/recommender";
import { BeanImage } from "@/components/BeanImage";
import { FavoriteButton, ReadjustButtons } from "@/components/FavoriteButton";
import { RecipeDetails } from "@/components/RecipeDetails";
import { showEpisodeSourceLink } from "@/lib/beanLinks";

function formatPrice(yen?: number): string | null {
  if (yen == null) return null;
  return `¥${yen.toLocaleString("ja-JP")}`;
}

function ReasonBlocks({
  mode,
  reasonParts,
  fallbackReason,
}: {
  mode: RecommendMode;
  reasonParts?: RecommendReasonParts | PairingReasonParts;
  fallbackReason: string;
}) {
  if (!reasonParts) {
    return <>{fallbackReason}</>;
  }

  if (mode === "pairing" && "food_summary" in reasonParts) {
    const p = reasonParts as PairingReasonParts;
    return (
      <>
        <span className="reason-block">
          <strong>食事</strong>
          {p.food_summary}
        </span>
        <span className="reason-block">
          <strong>豆</strong>
          {p.bean_fit}
        </span>
        <span className="reason-block">
          <strong>淹れ方</strong>
          {p.brew_fit}
        </span>
      </>
    );
  }

  const p = reasonParts as RecommendReasonParts;
  return (
    <>
      <span className="reason-block">
        <strong>志向</strong>
        {p.mood_summary}
      </span>
      <span className="reason-block">
        <strong>豆</strong>
        {p.bean_fit}
      </span>
      <span className="reason-block">
        <strong>淹れ方</strong>
        {p.brew_fit}
      </span>
    </>
  );
}

function ResultCardInner({
  item,
  variant,
  mode,
  mood,
  foodLabel,
  foodPresetId,
  pairingReason,
}: {
  item: RecommendItem | PairingItem;
  variant: "primary" | "alt";
  mode: RecommendMode;
  mood?: MoodProfile;
  foodLabel?: string;
  foodPresetId?: string;
  pairingReason?: string;
}) {
  const price = formatPrice(item.price_jpy);
  const weight = item.weight_g ? `${item.weight_g}g` : null;

  if (variant === "alt") {
    return (
      <div className="alt-card">
        {item.image_url ? (
          <BeanImage
            src={item.image_url}
            fallbacks={
              item.image_fallback_urls ??
              (item.image_fallback_url ? [item.image_fallback_url] : undefined)
            }
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
            fallbacks={
              item.image_fallback_urls ??
              (item.image_fallback_url ? [item.image_fallback_url] : undefined)
            }
            alt={item.product_name}
            loading="eager"
          />
        </div>
      )}
      <div className="result-body">
        <div className="result-chain">{item.chain_name_ja}</div>
        <h2 className="result-name">{item.product_name}</h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginBottom: "0.75rem",
          }}
        >
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
        {pairingReason && mode === "pairing" && (
          <div className="pairing-reason-box">
            <h4>なぜこの食事に合う？</h4>
            <p>{pairingReason}</p>
          </div>
        )}
        <p className="result-reason">
          <ReasonBlocks
            mode={mode}
            reasonParts={item.reason_parts}
            fallbackReason={item.reason}
          />
        </p>
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
        <div className="result-actions">
          <FavoriteButton
            beanId={item.bean_id}
            mode={mode}
            chainName={item.chain_name_ja}
            productName={item.product_name}
            buyUrl={item.buy_url}
            imageUrl={item.image_url}
            recipe={item.recipe}
            mood={mood}
            foodLabel={foodLabel}
            foodPresetId={foodPresetId}
            pairingReason={pairingReason}
          />
          <a
            className="buy-link"
            href={item.buy_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            購入ページへ
          </a>
        </div>
      </div>
    </article>
  );
}

interface ResultPanelProps {
  mode: RecommendMode;
  primary: RecommendItem | PairingItem;
  alternatives: (RecommendItem | PairingItem)[];
  otherRecipes?: BrewRecipe[];
  pairingReason?: string;
  foodLabel?: string;
  foodPresetId?: string;
  mood?: MoodProfile;
  loading?: boolean;
  onReadjust?: (direction: ReadjustDirection, recipeOnly: boolean) => void;
  onEditConditions?: () => void;
}

export function ResultPanel({
  mode,
  primary,
  alternatives,
  otherRecipes,
  pairingReason,
  foodLabel,
  foodPresetId,
  mood,
  loading = false,
  onReadjust,
  onEditConditions,
}: ResultPanelProps) {
  return (
    <div className="result-panel">
      <p className="section-title">
        {mode === "pairing" ? "食事に合う一杯" : "今日の一杯"}
      </p>
      <ResultCardInner
        item={primary}
        variant="primary"
        mode={mode}
        mood={mood}
        foodLabel={foodLabel}
        foodPresetId={foodPresetId}
        pairingReason={pairingReason ?? (primary as PairingItem).pairing_reason}
      />

      {onReadjust && (
        <ReadjustButtons
          mode={mode}
          loading={loading}
          onReadjust={onReadjust}
        />
      )}

      {onEditConditions && (
        <button
          type="button"
          className="ghost-btn"
          style={{ marginTop: "0.5rem" }}
          onClick={onEditConditions}
        >
          条件を編集して豆も再提案
        </button>
      )}

      {otherRecipes && otherRecipes.length > 0 && (
        <details className="alternatives">
          <summary className="alternatives-toggle">
            この豆で他の淹れ方（{otherRecipes.length}件）
            <span aria-hidden>▼</span>
          </summary>
          <div className="alternatives-list">
            {otherRecipes.map((recipe) => (
              <div key={recipe.method} className="other-recipe-block">
                {recipe.suitability_note && (
                  <p className="other-recipe-why">{recipe.suitability_note}</p>
                )}
                <RecipeDetails recipe={recipe} title={recipe.method_ja} />
              </div>
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
                mode={mode}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
