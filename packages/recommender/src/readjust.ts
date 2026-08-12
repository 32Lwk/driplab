import { getFoodPreset, matchPresetFromText } from "./foodPresets";
import { pickBestEquipment } from "./equipment";
import { pickBestEquipmentForPairing } from "./pairingEquipment";
import { buildPairingReasonParts } from "./pairingReason";
import { buildReasonParts } from "./reason";
import { pair } from "./pairing";
import { buildPairingRecipe } from "./pairingRecipe";
import { recommend } from "./recommend";
import { buildRecipe } from "./recipe";
import { resolveBeanImageUrls } from "./beanImage";
import { CHAIN_LABELS } from "./constants";
import type {
  BeanProduct,
  MoodProfile,
  PairingResponse,
  ReadjustDirection,
  ReadjustRequest,
  RecommendResponse,
} from "./types";

function applyMoodAdjustment(
  mood: MoodProfile,
  direction: ReadjustDirection,
): MoodProfile {
  const next = { ...mood };
  switch (direction) {
    case "more_acidity":
      next.acidity_pref = Math.min(100, mood.acidity_pref + 18);
      next.sweetness_pref = Math.max(0, mood.sweetness_pref - 8);
      break;
    case "less_bitterness":
      next.sweetness_pref = Math.min(100, mood.sweetness_pref + 18);
      next.acidity_pref = Math.min(100, mood.acidity_pref + 5);
      break;
    case "stronger":
      next.alertness = Math.min(100, mood.alertness + 20);
      next.body_pref = Math.min(100, mood.body_pref + 12);
      break;
    case "lighter":
      next.body_pref = Math.max(0, mood.body_pref - 18);
      next.alertness = Math.max(0, mood.alertness - 10);
      next.acidity_pref = Math.min(100, mood.acidity_pref + 8);
      break;
  }
  return next;
}

export interface ReadjustResponse {
  mode: ReadjustRequest["mode"];
  direction: ReadjustDirection;
  recipe_only: boolean;
  result: RecommendResponse | PairingResponse;
}

export function readjust(
  beans: BeanProduct[],
  request: ReadjustRequest,
): ReadjustResponse {
  const servings = request.servings && request.servings <= 1 ? 1 : 2;
  const equipment = request.equipment?.length ? request.equipment : undefined;

  if (request.mode === "mood") {
    const baseMood = request.mood ?? {
      alertness: 50,
      acidity_pref: 50,
      body_pref: 50,
      sweetness_pref: 50,
    };
    const adjustedMood = applyMoodAdjustment(baseMood, request.direction);

    if (request.fixed_bean_id) {
      const bean = beans.find((b) => b.id === request.fixed_bean_id);
      if (!bean) throw new Error(`Bean not found: ${request.fixed_bean_id}`);

      const full = recommend(beans, {
        mood: adjustedMood,
        equipment,
        chains: request.chains,
        servings,
      });

      const { equipment: eq, score: eqScore } = pickBestEquipment(
        bean,
        adjustedMood,
        equipment,
      );
      const recipe = buildRecipe(bean, eq, adjustedMood, servings);
      const reason_parts = buildReasonParts(bean, adjustedMood, recipe);
      const { src: imageUrl, fallbacks } = resolveBeanImageUrls(bean);

      return {
        mode: "mood",
        direction: request.direction,
        recipe_only: true,
        result: {
          ...full,
          primary: {
            ...full.primary,
            bean_id: bean.id,
            chain_id: bean.chain_id,
            chain_name_ja: CHAIN_LABELS[bean.chain_id],
            product_name: bean.display_name,
            description: bean.description,
            roast_level: bean.roast_level,
            roast_label_ja: bean.roast_label_ja,
            flavor_tags: bean.flavor_tags,
            price_jpy: bean.price_jpy,
            weight_g: bean.weight_g,
            buy_url: bean.buy_url,
            image_url: imageUrl,
            image_fallback_url: fallbacks[0],
            image_fallback_urls: fallbacks,
            recommended_equipment: eq,
            equipment_score: eqScore,
            recipe,
            reason_parts,
            reason: `${reason_parts.mood_summary}${reason_parts.bean_fit}${reason_parts.brew_fit}`,
            episode: bean.episode,
            episode_source: bean.episode_source,
            taste_notes: bean.taste_notes,
            processing: bean.processing,
          },
        },
      };
    }

    return {
      mode: "mood",
      direction: request.direction,
      recipe_only: false,
      result: recommend(beans, {
        mood: adjustedMood,
        equipment,
        chains: request.chains,
        servings,
      }),
    };
  }

  const preset =
    (request.food_preset_id ? getFoodPreset(request.food_preset_id) : undefined) ??
    (request.food_text
      ? matchPresetFromText(request.food_text).preset
      : getFoodPreset("croissant")!);
  const foodLabel = request.food_text?.trim() || preset.label_ja;

  if (request.fixed_bean_id) {
    const bean = beans.find((b) => b.id === request.fixed_bean_id);
    if (!bean) throw new Error(`Bean not found: ${request.fixed_bean_id}`);

    const full = pair(beans, {
      food_preset_id: preset.id,
      food_text: request.food_text,
      equipment,
      chains: request.chains,
      servings,
    });

    const { equipment: eq, score: eqScore } = pickBestEquipmentForPairing(
      bean,
      preset,
      equipment,
    );
    const recipe = buildPairingRecipe(bean, eq, preset, servings);
    const reason_parts = buildPairingReasonParts(
      bean,
      preset,
      foodLabel,
      recipe,
    );
    const { src: imageUrl, fallbacks } = resolveBeanImageUrls(bean);

    return {
      mode: "pairing",
      direction: request.direction,
      recipe_only: true,
      result: {
        ...full,
        primary: {
          ...full.primary,
          bean_id: bean.id,
          chain_id: bean.chain_id,
          chain_name_ja: CHAIN_LABELS[bean.chain_id],
          product_name: bean.display_name,
          description: bean.description,
          roast_level: bean.roast_level,
          roast_label_ja: bean.roast_label_ja,
          flavor_tags: bean.flavor_tags,
          price_jpy: bean.price_jpy,
          weight_g: bean.weight_g,
          buy_url: bean.buy_url,
          image_url: imageUrl,
          image_fallback_url: fallbacks[0],
          image_fallback_urls: fallbacks,
          recommended_equipment: eq,
          equipment_score: eqScore,
          recipe,
          reason_parts,
          reason: `${reason_parts.food_summary}${reason_parts.bean_fit}${reason_parts.brew_fit}`,
          pairing_reason: preset.pairing_hint,
          food_label: foodLabel,
          food_preset_id: preset.id,
          episode: bean.episode,
          episode_source: bean.episode_source,
          taste_notes: bean.taste_notes,
          processing: bean.processing,
        },
      },
    };
  }

  return {
    mode: "pairing",
    direction: request.direction,
    recipe_only: false,
    result: pair(beans, {
      food_preset_id: preset.id,
      food_text: request.food_text,
      equipment,
      chains: request.chains,
      servings,
    }),
  };
}
