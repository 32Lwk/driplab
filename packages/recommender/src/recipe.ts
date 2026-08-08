import { EQUIPMENT_OPTIONS, GRIND_LABELS } from "./constants";
import type {
  BeanProduct,
  BrewRecipe,
  EquipmentId,
  MoodProfile,
  RoastLevel,
} from "./types";

function equipmentLabel(id: EquipmentId): string {
  return EQUIPMENT_OPTIONS.find((e) => e.id === id)?.name_ja ?? id;
}

function withGrindJa(recipe: Omit<BrewRecipe, "grind_ja" | "method_ja">): BrewRecipe {
  return {
    ...recipe,
    method_ja: equipmentLabel(recipe.method),
    grind_ja: GRIND_LABELS[recipe.grind] ?? recipe.grind,
  };
}

function dripRecipe(roast: RoastLevel, mood: MoodProfile): BrewRecipe {
  const base: Record<
    RoastLevel,
    { coffee_g: number; water_ml: number; water_temp_c: number; time_sec: number }
  > = {
    light: { coffee_g: 15, water_ml: 250, water_temp_c: 94, time_sec: 180 },
    medium: { coffee_g: 15, water_ml: 240, water_temp_c: 92, time_sec: 150 },
    medium_dark: { coffee_g: 16, water_ml: 230, water_temp_c: 90, time_sec: 130 },
    dark: { coffee_g: 16, water_ml: 230, water_temp_c: 88, time_sec: 120 },
  };

  const b = base[roast] ?? base.medium;
  let { coffee_g, water_ml, water_temp_c, time_sec } = b;

  if (mood.alertness <= 33) {
    water_temp_c -= 2;
    time_sec -= 15;
  } else if (mood.alertness >= 67) {
    coffee_g += 1;
  }

  return withGrindJa({
    method: "drip",
    grind: "medium_fine",
    coffee_g,
    water_ml,
    water_temp_c,
    time_sec,
    notes: "最初に30ml注いで30秒蒸らし、その後ゆっくり注ぎます。",
  });
}

function frenchPressRecipe(roast: RoastLevel, mood: MoodProfile): BrewRecipe {
  const recipe = withGrindJa({
    method: "french_press",
    grind: "coarse",
    coffee_g: 20,
    water_ml: 300,
    water_temp_c: 92,
    time_sec: 240,
    notes: "4分間浸した後、ゆっくりプランジャーを押します。",
  });

  if (mood.alertness >= 67) recipe.coffee_g += 2;
  return recipe;
}

function espressoRecipe(roast: RoastLevel): BrewRecipe {
  const coffee_g = roast === "dark" || roast === "medium_dark" ? 18 : 17;
  return withGrindJa({
    method: "espresso",
    grind: "fine",
    coffee_g,
    yield_ml: 36,
    water_temp_c: 93,
    time_sec: 28,
    notes: "25〜30秒で36mlを抽出。",
  });
}

function siphonRecipe(roast: RoastLevel): BrewRecipe {
  return withGrindJa({
    method: "siphon",
    grind: "medium",
    coffee_g: 20,
    water_ml: 300,
    water_temp_c: 92,
    time_sec: 90,
    notes: "下球のお湯が上球に上がったら粉を入れ、45秒かき混ぜて火を止めます。",
  });
}

export function buildRecipe(
  bean: BeanProduct,
  equipment: EquipmentId,
  mood: MoodProfile,
): BrewRecipe {
  const roast = bean.roast_level;

  switch (equipment) {
    case "drip":
      return dripRecipe(roast, mood);
    case "french_press":
      return frenchPressRecipe(roast, mood);
    case "espresso":
      return espressoRecipe(roast);
    case "siphon":
      return siphonRecipe(roast);
    default:
      return dripRecipe(roast, mood);
  }
}

export function pickPrimaryEquipment(
  selected: EquipmentId[],
): EquipmentId {
  const order: EquipmentId[] = [
    "drip",
    "french_press",
    "espresso",
    "siphon",
  ];
  for (const id of order) {
    if (selected.includes(id)) return id;
  }
  return "drip";
}
