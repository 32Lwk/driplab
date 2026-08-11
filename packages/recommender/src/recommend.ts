import { resolveBeanImageUrls } from "./beanImage";
import { CHAIN_LABELS } from "./constants";
import { pickBestEquipment, rankOtherEquipment } from "./equipment";
import { moodToIdeal } from "./mood";
import { buildReason } from "./reason";
import { buildRecipe } from "./recipe";
import { scoreBean } from "./score";
import type {
  BeanProduct,
  BrewRecipe,
  CaffeineLevel,
  EquipmentId,
  IdealCoffeeProfile,
  MoodProfile,
  RecommendItem,
  RecommendRequest,
  RecommendResponse,
  RoastLevel,
} from "./types";

const BEAN_WEIGHT = 0.75;
const EQUIPMENT_WEIGHT = 0.25;
const AFFINITY_WEIGHT = 0.12;

const CAFFEINE_NUM: Record<CaffeineLevel, number> = {
  low: 25,
  medium: 50,
  high: 75,
};

const ROAST_IDX: Record<RoastLevel, number> = {
  light: 0,
  medium: 1,
  medium_dark: 2,
  dark: 3,
};

function beanRoastIndex(bean: BeanProduct): number {
  if (typeof bean.roast_index === "number" && !Number.isNaN(bean.roast_index)) {
    return bean.roast_index;
  }
  return ROAST_IDX[bean.roast_level] ?? 1;
}

interface ScoredCandidate {
  bean: BeanProduct;
  beanScore: number;
  equipment: EquipmentId;
  equipmentScore: number;
  affinityScore: number;
  combinedScore: number;
}

function moodAffinityBonus(
  mood: MoodProfile,
  bean: BeanProduct,
  ideal: IdealCoffeeProfile,
): number {
  const bitternessPref = 100 - mood.sweetness_pref;
  const roastIdx = beanRoastIndex(bean);
  const caffeine = CAFFEINE_NUM[bean.caffeine];

  const align = (pref: number, value: number) =>
    1 - Math.abs(pref - value) / 100;

  const emphasis = (pref: number, value: number) =>
    ((pref - 50) / 50) * ((value - 50) / 50);

  const dimension = (pref: number, value: number, weight = 0.3) =>
    align(pref, value) + emphasis(pref, value) * weight;

  const terms = [
    dimension(mood.acidity_pref, bean.acidity),
    dimension(mood.body_pref, bean.body),
    dimension(bitternessPref, bean.bitterness, 0.25),
    dimension(mood.sweetness_pref, bean.sweetness, 0.25),
    dimension(mood.alertness, caffeine),
    1 - Math.abs(ideal.target_roast_index - roastIdx) / 3,
  ];

  return terms.reduce((sum, term) => sum + term, 0) / terms.length;
}

function toRecommendItem(
  bean: BeanProduct,
  beanScore: number,
  equipment: EquipmentId,
  equipmentScore: number,
  combinedScore: number,
  mood: RecommendRequest["mood"],
): RecommendItem {
  const recipe = buildRecipe(bean, equipment, mood);
  const { src: imageUrl, fallbacks: imageFallbacks } = resolveBeanImageUrls(bean);
  return {
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
    reason: buildReason(bean, mood, recipe, equipmentScore),
  };
}

function scoreCandidates(
  beans: BeanProduct[],
  mood: RecommendRequest["mood"],
  available?: EquipmentId[],
): ScoredCandidate[] {
  const ideal = moodToIdeal(mood);

  return beans
    .filter((b) => b.available !== false)
    .map((bean) => {
      const beanScore = scoreBean(ideal, bean);
      const { equipment, score: equipmentScore } = pickBestEquipment(
        bean,
        mood,
        available,
      );
      const affinityScore = moodAffinityBonus(mood, bean, ideal);
      const combinedScore =
        Math.round(
          (beanScore * BEAN_WEIGHT +
            equipmentScore * EQUIPMENT_WEIGHT +
            affinityScore * AFFINITY_WEIGHT) *
            10000,
        ) / 10000;

      return {
        bean,
        beanScore,
        equipment,
        equipmentScore,
        affinityScore,
        combinedScore,
      };
    })
    .sort((a, b) => {
      if (b.combinedScore !== a.combinedScore) {
        return b.combinedScore - a.combinedScore;
      }
      if (b.affinityScore !== a.affinityScore) {
        return b.affinityScore - a.affinityScore;
      }
      if (b.beanScore !== a.beanScore) {
        return b.beanScore - a.beanScore;
      }
      return b.equipmentScore - a.equipmentScore;
    });
}

function pickTopCandidates(
  candidates: ScoredCandidate[],
  count: number,
): ScoredCandidate[] {
  const picked: ScoredCandidate[] = [];
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

function moodSeed(mood: MoodProfile, id: string): number {
  const key = `${mood.alertness},${mood.acidity_pref},${mood.body_pref},${mood.sweetness_pref},${id}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function moodBeanRank(
  mood: MoodProfile,
  bean: BeanProduct,
  ideal: IdealCoffeeProfile,
): number {
  const bitternessPref = 100 - mood.sweetness_pref;
  const roastIdx = beanRoastIndex(bean);
  const caffeine = CAFFEINE_NUM[bean.caffeine];

  const distance =
    Math.abs(mood.acidity_pref - bean.acidity) +
    Math.abs(mood.body_pref - bean.body) +
    Math.abs(bitternessPref - bean.bitterness) +
    Math.abs(mood.sweetness_pref - bean.sweetness) +
    Math.abs(mood.alertness - caffeine) +
    Math.abs(ideal.target_roast_index - roastIdx) * 25;

  return -distance;
}

function pickPrimaryCandidate(
  candidates: ScoredCandidate[],
  mood: MoodProfile,
): ScoredCandidate {
  if (candidates.length === 0) {
    throw new Error("No candidates available");
  }

  const ideal = moodToIdeal(mood);
  const bestScore = candidates[0].combinedScore;
  const pool = candidates.filter((c) => c.combinedScore >= bestScore - 0.006);
  if (pool.length < 12) {
    pool.push(
      ...candidates.filter((c) => !pool.includes(c)).slice(0, 12 - pool.length),
    );
  }

  pool.sort((a, b) => {
    const rankA =
      moodBeanRank(mood, a.bean, ideal) * 0.25 +
      (moodSeed(mood, a.bean.id) / 0xffffffff) * 14;
    const rankB =
      moodBeanRank(mood, b.bean, ideal) * 0.25 +
      (moodSeed(mood, b.bean.id) / 0xffffffff) * 14;
    return rankB - rankA;
  });

  return pool[0] ?? candidates[0];
}

export function recommend(
  beans: BeanProduct[],
  request: RecommendRequest,
): RecommendResponse {
  const available = request.equipment?.length ? request.equipment : undefined;
  let pool = beans.filter((b) => b.available !== false);
  if (request.chains?.length) {
    const allowed = new Set(request.chains);
    pool = pool.filter((b) => allowed.has(b.chain_id));
  }

  const candidates = scoreCandidates(pool, request.mood, available);
  const primaryCandidate = pickPrimaryCandidate(candidates, request.mood);
  const top = pickTopCandidates(
    candidates.filter((c) => c.bean.id !== primaryCandidate.bean.id),
    4,
  );

  if (!primaryCandidate) {
    throw new Error("No beans available for recommendation");
  }

  const primary = toRecommendItem(
    primaryCandidate.bean,
    primaryCandidate.beanScore,
    primaryCandidate.equipment,
    primaryCandidate.equipmentScore,
    primaryCandidate.combinedScore,
    request.mood,
  );

  const alternatives = top.map((item) =>
    toRecommendItem(
      item.bean,
      item.beanScore,
      item.equipment,
      item.equipmentScore,
      item.combinedScore,
      request.mood,
    ),
  );

  const other_recipes: BrewRecipe[] = rankOtherEquipment(
    primaryCandidate.bean,
    request.mood,
    primaryCandidate.equipment,
    available,
  ).map(({ equipment }) =>
    buildRecipe(primaryCandidate.bean, equipment, request.mood),
  );

  return { primary, alternatives, other_recipes };
}
