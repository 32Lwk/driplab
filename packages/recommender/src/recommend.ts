import { CHAIN_LABELS } from "./constants";
import { moodToIdeal } from "./mood";
import { buildReason } from "./reason";
import { buildRecipe, pickPrimaryEquipment } from "./recipe";
import { scoreBean } from "./score";
import type {
  BeanProduct,
  BrewRecipe,
  EquipmentId,
  RecommendItem,
  RecommendRequest,
  RecommendResponse,
} from "./types";

function beanImageUrl(bean: BeanProduct): string | undefined {
  return bean.image_cdn_url ?? bean.image_url ?? undefined;
}

function toRecommendItem(
  bean: BeanProduct,
  score: number,
  equipment: EquipmentId,
  mood: RecommendRequest["mood"],
): RecommendItem {
  const recipe = buildRecipe(bean, equipment, mood);
  return {
    chain_id: bean.chain_id,
    chain_name_ja: CHAIN_LABELS[bean.chain_id],
    product_name: bean.name,
    description: bean.description,
    roast_level: bean.roast_level,
    roast_label_ja: bean.roast_label_ja,
    flavor_tags: bean.flavor_tags,
    price_jpy: bean.price_jpy,
    weight_g: bean.weight_g,
    buy_url: bean.buy_url,
    image_url: beanImageUrl(bean),
    match_score: score,
    recipe,
    reason: buildReason(bean, mood, recipe),
  };
}

function pickTopBeans(
  beans: BeanProduct[],
  ideal: ReturnType<typeof moodToIdeal>,
  count: number,
): { bean: BeanProduct; score: number }[] {
  const scored = beans
    .filter((b) => b.available !== false)
    .map((bean) => ({ bean, score: scoreBean(ideal, bean) }))
    .sort((a, b) => b.score - a.score);

  const picked: { bean: BeanProduct; score: number }[] = [];
  const usedChains = new Set<string>();

  for (const item of scored) {
    if (picked.length >= count) break;
    if (usedChains.has(item.bean.chain_id) && picked.length > 0) continue;
    picked.push(item);
    usedChains.add(item.bean.chain_id);
  }

  if (picked.length < count) {
    for (const item of scored) {
      if (picked.length >= count) break;
      if (picked.some((p) => p.bean.id === item.bean.id)) continue;
      picked.push(item);
    }
  }

  return picked.slice(0, count);
}

export function recommend(
  beans: BeanProduct[],
  request: RecommendRequest,
): RecommendResponse {
  const equipment =
    request.equipment.length > 0
      ? request.equipment
      : (["drip"] as EquipmentId[]);

  const primaryEquipment = pickPrimaryEquipment(equipment);
  const ideal = moodToIdeal(request.mood);
  const top = pickTopBeans(beans, ideal, 3);

  if (top.length === 0) {
    throw new Error("No beans available for recommendation");
  }

  const [first, ...rest] = top;
  const primary = toRecommendItem(
    first.bean,
    first.score,
    primaryEquipment,
    request.mood,
  );

  const alternatives = rest.map((item) =>
    toRecommendItem(item.bean, item.score, primaryEquipment, request.mood),
  );

  const otherEquipment = equipment.filter((e) => e !== primaryEquipment);
  const other_recipes: BrewRecipe[] = otherEquipment.map((eq) =>
    buildRecipe(first.bean, eq, request.mood),
  );

  return { primary, alternatives, other_recipes };
}
