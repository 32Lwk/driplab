import { resolveBeanImageUrls } from "./beanImage";
import { CHAIN_LABELS } from "./constants";
import {
  getFoodPreset,
  matchPresetFromText,
  type FoodPreset,
} from "./foodPresets";
import {
  pickBestEquipmentForPairing,
  rankOtherEquipmentForPairing,
  pairingEquipmentPhrase,
} from "./pairingEquipment";
import { buildPairingRecipe } from "./pairingRecipe";
import { buildPairingReasonParts, pairingMethodBlurb } from "./pairingReason";
import { scoreBeanForPairing } from "./pairingScore";
import type {
  BeanProduct,
  BrewRecipe,
  EquipmentId,
  PairingItem,
  PairingRequest,
  PairingResponse,
  RecommendItem,
} from "./types";

const BEAN_WEIGHT = 0.7;
const EQUIPMENT_WEIGHT = 0.3;

interface ScoredPairingCandidate {
  bean: BeanProduct;
  beanScore: number;
  equipment: EquipmentId;
  equipmentScore: number;
  combinedScore: number;
}

function resolveFoodContext(request: PairingRequest): {
  preset: FoodPreset;
  foodLabel: string;
  source: "preset" | "free_text";
  confidence: number;
} {
  if (request.food_preset_id) {
    const preset = getFoodPreset(request.food_preset_id);
    if (!preset) {
      throw new Error(`Unknown food preset: ${request.food_preset_id}`);
    }
    return {
      preset,
      foodLabel: preset.label_ja,
      source: "preset",
      confidence: 1,
    };
  }

  if (request.food_text?.trim()) {
    const { preset, confidence } = matchPresetFromText(request.food_text);
    return {
      preset,
      foodLabel: request.food_text.trim(),
      source: "free_text",
      confidence,
    };
  }

  throw new Error("food_preset_id または food_text が必要です");
}

function toPairingItem(
  bean: BeanProduct,
  beanScore: number,
  equipment: EquipmentId,
  equipmentScore: number,
  combinedScore: number,
  food: FoodPreset,
  foodLabel: string,
  servings: number,
): PairingItem {
  const recipe = buildPairingRecipe(bean, equipment, food, servings);
  const { src: imageUrl, fallbacks: imageFallbacks } = resolveBeanImageUrls(bean);
  const reason_parts = buildPairingReasonParts(bean, food, foodLabel, recipe);

  return {
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
    image_fallback_url: imageFallbacks[0],
    image_fallback_urls: imageFallbacks,
    match_score: combinedScore,
    bean_score: beanScore,
    equipment_score: equipmentScore,
    recommended_equipment: equipment,
    episode: bean.episode,
    episode_source: bean.episode_source,
    taste_notes: bean.taste_notes,
    processing: bean.processing,
    recipe,
    reason: `${reason_parts.food_summary}${reason_parts.bean_fit}${reason_parts.brew_fit}`,
    reason_parts,
    pairing_reason: food.pairing_hint,
    food_label: foodLabel,
    food_preset_id: food.id,
  };
}

function scoreCandidates(
  beans: BeanProduct[],
  food: FoodPreset,
  available?: EquipmentId[],
): ScoredPairingCandidate[] {
  return beans
    .filter((b) => b.available !== false)
    .map((bean) => {
      const beanScore = scoreBeanForPairing(food.ideal, bean);
      const { equipment, score: equipmentScore } = pickBestEquipmentForPairing(
        bean,
        food,
        available,
      );
      const combinedScore =
        Math.round(
          (beanScore * BEAN_WEIGHT + equipmentScore * EQUIPMENT_WEIGHT) * 10000,
        ) / 10000;

      return { bean, beanScore, equipment, equipmentScore, combinedScore };
    })
    .sort((a, b) => {
      if (b.combinedScore !== a.combinedScore) {
        return b.combinedScore - a.combinedScore;
      }
      return b.beanScore - a.beanScore;
    });
}

function pickTopCandidates(
  candidates: ScoredPairingCandidate[],
  count: number,
): ScoredPairingCandidate[] {
  const picked: ScoredPairingCandidate[] = [];
  const usedChains = new Set<string>();

  for (const item of candidates) {
    if (picked.length >= count) break;
    if (usedChains.has(item.bean.chain_id) && picked.length > 0) continue;
    picked.push(item);
    usedChains.add(item.bean.chain_id);
  }

  if (picked.length < count) {
    for (const item of candidates) {
      if (picked.length >= count) break;
      if (picked.some((p) => p.bean.id === item.bean.id)) continue;
      picked.push(item);
    }
  }

  return picked.slice(0, count);
}

export function pair(
  beans: BeanProduct[],
  request: PairingRequest,
): PairingResponse {
  const { preset, foodLabel, source, confidence } = resolveFoodContext(request);
  const available = request.equipment?.length ? request.equipment : undefined;
  const servings = request.servings && request.servings <= 1 ? 1 : 2;

  let pool = beans.filter((b) => b.available !== false);
  if (request.chains?.length) {
    const allowed = new Set(request.chains);
    pool = pool.filter((b) => allowed.has(b.chain_id));
  }

  const candidates = scoreCandidates(pool, preset, available);
  if (candidates.length === 0) {
    throw new Error("No beans available for pairing");
  }

  const primaryCandidate = candidates[0];
  const top = pickTopCandidates(
    candidates.filter((c) => c.bean.id !== primaryCandidate.bean.id),
    4,
  );

  const primary = toPairingItem(
    primaryCandidate.bean,
    primaryCandidate.beanScore,
    primaryCandidate.equipment,
    primaryCandidate.equipmentScore,
    primaryCandidate.combinedScore,
    preset,
    foodLabel,
    servings,
  );

  const alternatives = top.map((item) =>
    toPairingItem(
      item.bean,
      item.beanScore,
      item.equipment,
      item.equipmentScore,
      item.combinedScore,
      preset,
      foodLabel,
      servings,
    ),
  );

  const other_recipes: BrewRecipe[] = rankOtherEquipmentForPairing(
    primaryCandidate.bean,
    preset,
    primaryCandidate.equipment,
    available,
  ).map(({ equipment, score }) => {
    const recipe = buildPairingRecipe(
      primaryCandidate.bean,
      equipment,
      preset,
      servings,
    );
    return {
      ...recipe,
      suitability_note: pairingMethodBlurb(equipment, score, preset),
    };
  });

  return {
    primary,
    alternatives,
    other_recipes,
    food_preset_id: preset.id,
    food_label: foodLabel,
    food_source: source,
    match_confidence: confidence,
  };
}

export { pairingEquipmentPhrase };
