import { GRIND_LABELS, EQUIPMENT_OPTIONS } from "./constants";
import type { BeanProduct, BrewRecipe, EquipmentId, GrindSize, RoastLevel } from "./types";
import type { FoodPreset } from "./foodPresets";

const DRIP_REFERENCE =
  "https://www.starbucks.co.jp/hellocoffee/howto/howto-handdrip.html";

function equipmentLabel(id: EquipmentId): string {
  return EQUIPMENT_OPTIONS.find((e) => e.id === id)?.name_ja ?? id;
}

function withGrindJa(
  recipe: Omit<BrewRecipe, "grind_ja" | "method_ja">,
): BrewRecipe {
  return {
    ...recipe,
    method_ja: equipmentLabel(recipe.method),
    grind_ja: GRIND_LABELS[recipe.grind] ?? recipe.grind,
  };
}

function roastIndexOf(bean: BeanProduct): number {
  if (typeof bean.roast_index === "number" && !Number.isNaN(bean.roast_index)) {
    return bean.roast_index;
  }
  const map: Record<RoastLevel, number> = {
    light: 0.3,
    medium: 1.1,
    medium_dark: 2.0,
    dark: 2.7,
  };
  return map[bean.roast_level];
}

function clampTemp(temp: number): number {
  return Math.max(82, Math.min(96, Math.round(temp)));
}

function shiftGrind(base: GrindSize, shift: number): GrindSize {
  const order: GrindSize[] = [
    "extra_fine",
    "fine",
    "medium_fine",
    "medium",
    "coarse",
  ];
  const idx = Math.max(0, Math.min(order.length - 1, order.indexOf(base) + shift));
  return order[idx];
}

/** Food-oriented brew levers (Q9-C: temp/grind/ratio + notes) */
function foodBrewLevers(food: FoodPreset): {
  tempDelta: number;
  grindShift: number;
  ratio: number;
  bloomSecDelta: number;
  doseDelta: number;
} {
  const { ideal } = food;
  let tempDelta = 0;
  let grindShift = 0;
  let ratio = 16;
  let bloomSecDelta = 0;
  let doseDelta = 0;

  if (ideal.target_acidity >= 65) {
    tempDelta += 2;
    grindShift -= 1;
    ratio = Math.min(ratio, 15.5);
  } else if (ideal.target_acidity <= 35) {
    tempDelta -= 2;
    grindShift += 1;
    ratio = Math.max(ratio, 17);
  }

  if (ideal.target_body >= 65) {
    ratio = Math.min(ratio, 14.5);
    bloomSecDelta += 5;
    tempDelta -= 1;
  } else if (ideal.target_body <= 40) {
    ratio = Math.max(ratio, 17);
  }

  if (ideal.target_bitterness >= 60) {
    tempDelta -= 1;
    doseDelta += 1;
  }

  return { tempDelta, grindShift, ratio, bloomSecDelta, doseDelta };
}

function dripBaseTemp(roastIndex: number): number {
  if (roastIndex < 0.7) return 95;
  if (roastIndex < 1.5) return 93;
  if (roastIndex < 2.3) return 90;
  return 86;
}

function dripBaseGrind(roastIndex: number): GrindSize {
  if (roastIndex < 1.2) return "medium_fine";
  return "medium";
}

function pairingDripRecipe(
  bean: BeanProduct,
  food: FoodPreset,
  servings: number,
): BrewRecipe {
  const roastIndex = roastIndexOf(bean);
  const levers = foodBrewLevers(food);
  const cups = servings <= 1 ? 1 : 2;

  let coffee_g = cups === 1 ? 12 : 20;
  coffee_g += levers.doseDelta;
  const water_ml = Math.round(coffee_g * levers.ratio);
  const water_temp_c = clampTemp(dripBaseTemp(roastIndex) + levers.tempDelta);
  const grind = shiftGrind(dripBaseGrind(roastIndex), levers.grindShift);
  const bloom_ml = Math.round(coffee_g * 2);
  const bloom_sec = 25 + levers.bloomSecDelta;
  const time_sec = bloom_sec + (cups === 1 ? 120 : 150);

  return withGrindJa({
    method: "drip",
    grind,
    coffee_g,
    water_ml,
    water_temp_c,
    bloom_ml,
    bloom_sec,
    time_sec,
    steps: [
      "ドリッパー・サーバー・カップを適温のお湯で温める",
      `フィルターに${coffee_g}g（${GRIND_LABELS[grind]}）の粉を平らにならす`,
      `1回目（蒸らし）: 中央から約${bloom_ml}mlを注ぎ、${bloom_sec}秒待つ`,
      "2回目: 中央から小さな円を描くようにゆっくり注ぎ、粉床の高さを70〜80%に",
      "3回目: 2回目の高さを維持しながら残りのお湯を数回に分けて注ぐ",
      `「${food.label_ja}」の後口を整えるため、落ちきる前にドリッパーを外す`,
    ],
    notes: `${cups}杯分・「${food.label_ja}」向けに湯温${water_temp_c}℃・比率1:${Math.round(water_ml / coffee_g)}に調整。${food.pairing_hint}`,
    reference_url: DRIP_REFERENCE,
    suitability_note: food.pairing_hint,
  });
}

function pairingFrenchPressRecipe(
  bean: BeanProduct,
  food: FoodPreset,
): BrewRecipe {
  const roastIndex = roastIndexOf(bean);
  const levers = foodBrewLevers(food);
  let coffee_g = 20;
  let ratio = 14.5;
  let water_temp_c = roastIndex < 1.2 ? 94 : roastIndex < 2.2 ? 92 : 88;
  let time_sec = 250;

  if (food.ideal.target_body >= 65) {
    ratio = 14;
    time_sec = 260;
  }
  coffee_g += levers.doseDelta;
  if (food.ideal.target_acidity <= 35) water_temp_c -= 1;

  const water_ml = Math.round(coffee_g * ratio);
  water_temp_c = clampTemp(water_temp_c + levers.tempDelta);

  return withGrindJa({
    method: "french_press",
    grind: "coarse",
    coffee_g,
    water_ml,
    water_temp_c,
    time_sec,
    steps: [
      "フレンチプレスをお湯で温める",
      `${coffee_g}g（粗挽き）の粉を入れ、平らにならす`,
      `${water_temp_c}℃のお湯${water_ml}mlを一気に注ぎ、粉を軽くかき混ぜる`,
      `フタを閉め約${Math.round(time_sec / 60)}分間静置（「${food.label_ja}」に合わせた浸出時間）`,
      "プランジャーをゆっくり押し下ろして完成",
    ],
    notes: `「${food.label_ja}」向け浸出法（比率1:${ratio}）。油分を残しコクで食後を整えます。${food.pairing_hint}`,
    suitability_note: food.pairing_hint,
  });
}

function pairingEspressoRecipe(
  bean: BeanProduct,
  food: FoodPreset,
): BrewRecipe {
  const roastIndex = roastIndexOf(bean);
  const coffee_g = roastIndex >= 1.8 ? 18 : 17;
  let yield_ml = food.ideal.target_body >= 65 ? 32 : 36;
  let time_sec = 28;
  let water_temp_c = 93;

  if (roastIndex < 1.0) {
    water_temp_c = 94;
    time_sec = 30;
  } else if (roastIndex >= 2.4) {
    water_temp_c = 92;
  }

  return withGrindJa({
    method: "espresso",
    grind: "fine",
    coffee_g,
    yield_ml,
    water_temp_c,
    time_sec,
    steps: [
      `ポートフィルターに${coffee_g}g前後（細挽き）をタンピング`,
      `${water_temp_c}℃前後で${time_sec - 3}〜${time_sec + 2}秒かけて約${yield_ml}mlを抽出`,
      `「${food.label_ja}」と一緒に、最初の数滴の色と流速を確認`,
    ],
    notes: `デザート・重い食事向けに短時間・高圧抽出。「${food.label_ja}」の甘さと対比するコクを狙います。`,
    suitability_note: food.pairing_hint,
  });
}

function pairingSiphonRecipe(
  bean: BeanProduct,
  food: FoodPreset,
): BrewRecipe {
  const roastIndex = roastIndexOf(bean);
  let water_temp_c = roastIndex < 1.2 ? 93 : 92;
  let stir_sec = food.ideal.target_acidity >= 60 ? 40 : 45;
  const coffee_g = 20;
  const water_ml = 300;

  if (food.ideal.target_body >= 60) stir_sec = 50;
  water_temp_c = clampTemp(water_temp_c + foodBrewLevers(food).tempDelta);

  return withGrindJa({
    method: "siphon",
    grind: "medium",
    coffee_g,
    water_ml,
    water_temp_c,
    time_sec: stir_sec + 45,
    steps: [
      `下球に${water_ml}mlのお湯を入れ、加熱して上球に湯を上げる`,
      `${coffee_g}g（中挽き）の粉を入れ、${stir_sec}秒間軽くかき混ぜる`,
      `「${food.label_ja}」の繊細な味を邪魔しないよう、火を止めて下球に戻す`,
      "サーバーに移して完成",
    ],
    notes: `「${food.label_ja}」向け真空浸出。香りをクリアに立て、食後の口を整えます。`,
    suitability_note: food.pairing_hint,
  });
}

export function buildPairingRecipe(
  bean: BeanProduct,
  equipment: EquipmentId,
  food: FoodPreset,
  servings = 2,
): BrewRecipe {
  switch (equipment) {
    case "drip":
      return pairingDripRecipe(bean, food, servings);
    case "french_press":
      return pairingFrenchPressRecipe(bean, food);
    case "espresso":
      return pairingEspressoRecipe(bean, food);
    case "siphon":
      return pairingSiphonRecipe(bean, food);
    default:
      return pairingDripRecipe(bean, food, servings);
  }
}
