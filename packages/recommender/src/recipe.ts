/**
 * Brewing ratios reference:
 * - SCA Golden Cup: ~55 g/L (≈1:18), water 90–96℃
 * - Starbucks hand drip (2 cups): 20g / 360ml
 *   https://www.starbucks.co.jp/hellocoffee/howto/howto-handdrip.html
 * Mood levers adjust temp / grind / ratio within specialty practice ranges.
 */

import { EQUIPMENT_OPTIONS, GRIND_LABELS } from "./constants";
import type {
  BeanProduct,
  BrewRecipe,
  EquipmentId,
  GrindSize,
  MoodProfile,
  RoastLevel,
} from "./types";

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

/** Absolute-roast-aware drip temperature (°C). */
function dripBaseTemp(roastIndex: number): number {
  if (roastIndex < 0.7) return 95;
  if (roastIndex < 1.5) return 93;
  if (roastIndex < 2.3) return 90;
  return 86; // deep: avoid harsh bitterness
}

function dripBaseGrind(roastIndex: number): GrindSize {
  if (roastIndex < 1.2) return "medium_fine";
  if (roastIndex < 2.2) return "medium";
  return "medium"; // slightly coarser feel via shorter contact / lower temp
}

/**
 * Map mood preferences onto extraction levers.
 * Positive tempDelta → hotter (more extraction / brighter acids).
 */
function moodBrewLevers(mood: MoodProfile): {
  tempDelta: number;
  grindShift: number; // -1 finer, +1 coarser
  ratio: number; // water per coffee gram
  bloomSecDelta: number;
  doseDelta: number;
} {
  let tempDelta = 0;
  let grindShift = 0;
  let ratio = 16; // specialty pour-over default (vs SCA batch 1:18)
  let bloomSecDelta = 0;
  let doseDelta = 0;

  // Acidity preference → hotter / finer / slightly stronger
  if (mood.acidity_pref >= 67) {
    tempDelta += 2;
    grindShift -= 1;
    ratio = Math.min(ratio, 15.5);
  } else if (mood.acidity_pref <= 33) {
    tempDelta -= 2;
    grindShift += 1;
  }

  // Body / sweetness → richer immersion-like levers on drip
  if (mood.body_pref >= 67 || mood.sweetness_pref >= 67) {
    ratio = Math.min(ratio, 15);
    bloomSecDelta += 5;
    tempDelta -= 1; // protect sweetness from harsh highs
  } else if (mood.body_pref <= 33) {
    ratio = Math.max(ratio, 17);
  }

  // Alertness → strength
  if (mood.alertness >= 67) {
    doseDelta += 1;
    ratio = Math.min(ratio, 15);
  } else if (mood.alertness <= 33) {
    tempDelta -= 1;
    ratio = Math.max(ratio, 17);
  }

  return { tempDelta, grindShift, ratio, bloomSecDelta, doseDelta };
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

function clampTemp(temp: number): number {
  return Math.max(82, Math.min(96, Math.round(temp)));
}

function dripRecipe(
  bean: BeanProduct,
  mood: MoodProfile,
  servings: number,
): BrewRecipe {
  const roastIndex = roastIndexOf(bean);
  const levers = moodBrewLevers(mood);
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
      "必要量に達したら、落ちきる前にドリッパーを外す",
    ],
    notes: `${cups}杯分・比率 1:${Math.round(water_ml / coffee_g)}。焙煎度と気分に合わせて湯温・挽き目・濃度を調整。参考: SCA帯 + スタバ手順 ${DRIP_REFERENCE}`,
    reference_url: DRIP_REFERENCE,
    suitability_note: "酸と香りの輪郭をクリアに出せます",
  });
}

function frenchPressRecipe(
  bean: BeanProduct,
  mood: MoodProfile,
): BrewRecipe {
  const roastIndex = roastIndexOf(bean);
  let coffee_g = 20;
  let ratio = 15; // immersion: typically richer than drip
  let water_temp_c = roastIndex < 1.2 ? 94 : roastIndex < 2.2 ? 92 : 88;
  let time_sec = 240;

  if (mood.body_pref >= 67 || mood.sweetness_pref >= 67) {
    ratio = 14;
    time_sec = 250;
  }
  if (mood.alertness >= 67) coffee_g += 2;
  if (mood.acidity_pref >= 67) water_temp_c += 1;
  if (mood.alertness <= 33) water_temp_c -= 1;

  const water_ml = Math.round(coffee_g * ratio);
  water_temp_c = clampTemp(water_temp_c);

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
      `フタを閉め約${Math.round(time_sec / 60)}分間静置`,
      "プランジャーをゆっくり押し下ろして完成",
    ],
    notes: `浸出法（比率 1:${ratio}）。金属フィルターで油分が残り、コクと甘みが厚くなります。`,
    suitability_note: "油分が残り、甘みとボディが厚くなります",
  });
}

function espressoRecipe(bean: BeanProduct, mood: MoodProfile): BrewRecipe {
  const roastIndex = roastIndexOf(bean);
  const coffee_g = roastIndex >= 1.8 ? 18 : 17;
  let yield_ml = 36;
  let time_sec = 28;
  let water_temp_c = 93;

  if (mood.alertness >= 67 || mood.body_pref >= 67) {
    yield_ml = 32; // slightly denser
    time_sec = 30;
  }
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
      "最初の数滴（プレインフュージョン）の色と流速を確認",
    ],
    notes: "短時間・高圧抽出（目安 1:2）。深煎りほどコクとビターが際立ちます。",
    suitability_note: "短時間で濃縮され、ミルクとも相性が良いです",
  });
}

function siphonRecipe(bean: BeanProduct, mood: MoodProfile): BrewRecipe {
  const roastIndex = roastIndexOf(bean);
  let water_temp_c = roastIndex < 1.2 ? 93 : 92;
  let stir_sec = 45;
  const coffee_g = 20;
  const water_ml = 300;

  if (mood.acidity_pref >= 67) {
    water_temp_c += 1;
    stir_sec = 40; // slightly shorter to keep brightness
  }
  if (mood.body_pref >= 67) {
    stir_sec = 50;
  }

  water_temp_c = clampTemp(water_temp_c);

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
      "火を止め、下球にコーヒーが戻るのを待つ",
      "サーバーに移して完成",
    ],
    notes: "真空浸出。酸味とアロマがクリアに立ちやすく、演出も楽しめます。",
    suitability_note: "香り立ちが良く、クリアな浸漬感になります",
  });
}

export function buildRecipe(
  bean: BeanProduct,
  equipment: EquipmentId,
  mood: MoodProfile,
  servings = 2,
): BrewRecipe {
  switch (equipment) {
    case "drip":
      return dripRecipe(bean, mood, servings);
    case "french_press":
      return frenchPressRecipe(bean, mood);
    case "espresso":
      return espressoRecipe(bean, mood);
    case "siphon":
      return siphonRecipe(bean, mood);
    default:
      return dripRecipe(bean, mood, servings);
  }
}
