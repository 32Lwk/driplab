import type { BeanProduct } from "./types";
import type { FoodIdealProfile } from "./foodPresets";

const ROAST_IDX = { light: 0, medium: 1, medium_dark: 2, dark: 3 } as const;

function beanRoastIndex(bean: BeanProduct): number {
  if (typeof bean.roast_index === "number" && !Number.isNaN(bean.roast_index)) {
    return bean.roast_index;
  }
  return ROAST_IDX[bean.roast_level] ?? 1;
}

/**
 * Score how well a bean fits a food ideal profile (0–1).
 */
export function scoreBeanForPairing(
  ideal: FoodIdealProfile,
  bean: BeanProduct,
): number {
  const align = (target: number, value: number) =>
    1 - Math.abs(target - value) / 100;

  const roastIdx = beanRoastIndex(bean);
  const roastAlign = 1 - Math.abs(ideal.target_roast_index - roastIdx) / 3;

  const terms = [
    align(ideal.target_acidity, bean.acidity),
    align(ideal.target_body, bean.body),
    align(ideal.target_bitterness, bean.bitterness),
    align(ideal.target_sweetness, bean.sweetness),
    roastAlign,
  ];

  const flavorBonus = flavorTagBonus(ideal, bean);
  const base = terms.reduce((sum, t) => sum + t, 0) / terms.length;
  return Math.round(Math.max(0, Math.min(1, base * 0.85 + flavorBonus * 0.15)) * 10000) / 10000;
}

function flavorTagBonus(ideal: FoodIdealProfile, bean: BeanProduct): number {
  if (!bean.flavor_tags?.length) return 0.5;

  const tags = bean.flavor_tags.join(" ").toLowerCase();
  let bonus = 0.5;

  if (ideal.target_acidity >= 60 && /柑橘|ベリー|フルーティ|酸味|lemon|berry/.test(tags)) {
    bonus += 0.3;
  }
  if (ideal.target_body >= 60 && /チョコ|ナッツ|コク|カカオ|chocolate|nutty/.test(tags)) {
    bonus += 0.3;
  }
  if (ideal.target_bitterness >= 55 && /ビター|ダーク|深煎|bitter/.test(tags)) {
    bonus += 0.2;
  }
  if (ideal.target_sweetness >= 55 && /キャラメル|はちみつ|甘|honey|caramel/.test(tags)) {
    bonus += 0.2;
  }

  return Math.min(1, bonus);
}
