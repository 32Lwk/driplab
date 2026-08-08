/**
 * Brewing ratios reference:
 * - Starbucks hand drip (2 cups): 20g / 360ml, 90–96℃, bloom 20–30s, 3 pours
 *   https://www.starbucks.co.jp/hellocoffee/howto/howto-handdrip.html
 * - Solo filter (1 cup): 10g / 180ml
 */

import { EQUIPMENT_OPTIONS, GRIND_LABELS } from "./constants";
import type {
  BeanProduct,
  BrewRecipe,
  EquipmentId,
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

function dripRecipe(roast: RoastLevel, mood: MoodProfile): BrewRecipe {
  let coffee_g = 20;
  let water_ml = 360;
  let water_temp_c = 93;
  const bloom_ml = 40;
  const bloom_sec = 25;
  let grind: BrewRecipe["grind"] = "medium_fine";

  if (roast === "light") {
    water_temp_c = 94;
    grind = "medium_fine";
  } else if (roast === "medium") {
    water_temp_c = 93;
    grind = "medium_fine";
  } else if (roast === "medium_dark") {
    water_temp_c = 91;
    grind = "medium";
  } else {
    water_temp_c = 90;
    grind = "medium";
  }

  if (mood.alertness <= 33) {
    water_temp_c -= 2;
  } else if (mood.alertness >= 67) {
    coffee_g += 1;
  }

  return withGrindJa({
    method: "drip",
    grind,
    coffee_g,
    water_ml,
    water_temp_c,
    bloom_ml,
    bloom_sec,
    time_sec: bloom_sec + 150,
    steps: [
      "ドリッパー・サーバー・カップを90〜96℃のお湯で温める",
      `フィルターに${coffee_g}g（${GRIND_LABELS[grind]}）の粉を平らにならす`,
      `1回目（蒸らし）: 中央から約${bloom_ml}mlを注ぎ、${bloom_sec}秒待つ`,
      "2回目: 中央から小さな円を描くようにゆっくり注ぎ、粉床の高さを70〜80%に",
      "3回目: 2回目の高さを維持しながら残りのお湯を数回に分けて注ぐ",
      "必要量に達したら、落ちきる前にドリッパーを外す",
    ],
    notes: `スターバックス公式比（2杯分・1:${Math.round(water_ml / coffee_g)}）。参考: ${DRIP_REFERENCE}`,
    reference_url: DRIP_REFERENCE,
  });
}

function frenchPressRecipe(roast: RoastLevel, mood: MoodProfile): BrewRecipe {
  let coffee_g = 20;
  const water_ml = 300;
  let water_temp_c = 92;
  const time_sec = 240;

  if (roast === "light") water_temp_c = 93;
  if (roast === "dark") water_temp_c = 90;
  if (mood.alertness >= 67) coffee_g += 2;

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
      "フタを閉め4分間静置",
      "プランジャーをゆっくり押し下ろして完成",
    ],
    notes: "コクと油分を残す浸出法。粉床が均一になるよう軽くかき混ぜる。",
  });
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
    steps: [
      "ポートafilterに18g前後（細挽き）をタンピング",
      "93℃前後で25〜30秒かけて36mlを抽出",
      "最初の数滴（プレインフュージョン）の色と流速を確認",
    ],
    notes: "短時間・高圧抽出。深煎り豆はコクとビターが際立つ。",
  });
}

function siphonRecipe(roast: RoastLevel): BrewRecipe {
  const water_temp_c = roast === "light" ? 93 : 92;
  return withGrindJa({
    method: "siphon",
    grind: "medium",
    coffee_g: 20,
    water_ml: 300,
    water_temp_c,
    time_sec: 90,
    steps: [
      "下球に300mlのお湯を入れ、加熱して上球に湯を上げる",
      "20g（中挽き）の粉を入れ、45秒間軽くかき混ぜる",
      "火を止め、下球にコーヒーが戻るのを待つ",
      "サーバーに移して完成",
    ],
    notes: "真空状態での抽出。酸味とアロマがクリアに立つ。",
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
