"use client";

import { useState } from "react";
import type { ReadjustDirection, RecommendMode } from "@driplab/recommender";
import { addFavorite, isFavorite } from "@/lib/favorites";
import type { FavoriteEntry } from "@/lib/favorites";

interface FavoriteButtonProps {
  beanId: string;
  mode: RecommendMode;
  chainName: string;
  productName: string;
  buyUrl: string;
  imageUrl?: string;
  recipe: FavoriteEntry["recipe"];
  mood?: FavoriteEntry["mood"];
  foodLabel?: string;
  foodPresetId?: string;
  pairingReason?: string;
}

export function FavoriteButton(props: FavoriteButtonProps) {
  const [saved, setSaved] = useState(() =>
    isFavorite(props.beanId, props.recipe.method),
  );

  function handleClick() {
    if (saved) return;
    addFavorite({
      mode: props.mode,
      bean_id: props.beanId,
      chain_name_ja: props.chainName,
      product_name: props.productName,
      buy_url: props.buyUrl,
      image_url: props.imageUrl,
      recipe: props.recipe,
      mood: props.mood,
      food_label: props.foodLabel,
      food_preset_id: props.foodPresetId,
      pairing_reason: props.pairingReason,
    });
    setSaved(true);
  }

  return (
    <button
      type="button"
      className={`favorite-btn${saved ? " saved" : ""}`}
      onClick={handleClick}
      disabled={saved}
      aria-label={saved ? "お気に入り済み" : "お気に入りに保存"}
    >
      {saved ? "★ 保存済み" : "☆ お気に入り"}
    </button>
  );
}

interface ReadjustButtonsProps {
  mode: RecommendMode;
  loading: boolean;
  onReadjust: (direction: ReadjustDirection, recipeOnly: boolean) => void;
}

const READJUST_OPTIONS: { direction: ReadjustDirection; label: string }[] = [
  { direction: "more_acidity", label: "もっと酸を" },
  { direction: "less_bitterness", label: "苦み抑え" },
  { direction: "stronger", label: "濃く" },
  { direction: "lighter", label: "軽く" },
];

export function ReadjustButtons({
  mode,
  loading,
  onReadjust,
}: ReadjustButtonsProps) {
  return (
    <div className="readjust-panel">
      <p className="section-title">再調整（同じ豆）</p>
      <div className="readjust-chips">
        {READJUST_OPTIONS.map(({ direction, label }) => (
          <button
            key={direction}
            type="button"
            className="filter-chip"
            disabled={loading}
            onClick={() => onReadjust(direction, true)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="input-hint">
        {mode === "pairing"
          ? "同じ豆のまま、湯温・挽き目・比率を食事向けに微調整します。"
          : "同じ豆のまま、湯温・挽き目・比率を気分向けに微調整します。"}
      </p>
    </div>
  );
}
