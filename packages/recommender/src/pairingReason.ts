import { CHAIN_LABELS } from "./constants";
import { pairingEquipmentPhrase } from "./pairingEquipment";
import { methodChangeNote } from "./equipment";
import type {
  BeanProduct,
  BrewRecipe,
  EquipmentId,
  PairingReasonParts,
} from "./types";
import type { FoodPreset } from "./foodPresets";

function brewParamPhrase(bean: BeanProduct, recipe: BrewRecipe): string {
  const bits: string[] = [];
  if (
    recipe.method === "drip" ||
    recipe.method === "french_press" ||
    recipe.method === "siphon"
  ) {
    bits.push(`湯温${recipe.water_temp_c}℃`);
  }
  bits.push(recipe.grind_ja);
  if (recipe.water_ml && recipe.coffee_g) {
    bits.push(`比率1:${Math.round(recipe.water_ml / recipe.coffee_g)}`);
  } else if (recipe.yield_ml && recipe.coffee_g) {
    bits.push(`約1:${Math.round(recipe.yield_ml / recipe.coffee_g)}`);
  }

  const roastHint =
    bean.roast_level === "light"
      ? "浅煎りで食事の風味を引き立てる設定"
      : bean.roast_level === "dark"
        ? "深煎りで食事のコクと調和する設定"
        : "食事のバランスに合わせた抽出設定";

  return `${bits.join("・")}（${roastHint}）`;
}

export function buildPairingReasonParts(
  bean: BeanProduct,
  food: FoodPreset,
  foodLabel: string,
  recipe: BrewRecipe,
): PairingReasonParts {
  const chain = CHAIN_LABELS[bean.chain_id] ?? bean.chain_id;
  const food_summary = `「${foodLabel}」に合わせて、${food.description}方向の一杯を選びました。`;

  const tags =
    bean.flavor_tags && bean.flavor_tags.length > 0
      ? bean.flavor_tags.slice(0, 2).join("・")
      : bean.taste_label_ja ?? "個性";

  const bean_fit = `${chain}の「${bean.display_name}」は、${tags}の方向がこの食事との相性が良く選ばれました。`;

  const equipWhy = pairingEquipmentPhrase(food, recipe.method);
  const brew_fit = `${equipWhy}を推奨します。${brewParamPhrase(bean, recipe)}です。`;

  return { food_summary, bean_fit, brew_fit };
}

export function pairingMethodBlurb(
  equipment: EquipmentId,
  score: number,
  food: FoodPreset,
): string {
  const note = methodChangeNote(equipment);
  return `${note}。「${food.label_ja}」向け適合 ${Math.round(score * 100)}%`;
}
