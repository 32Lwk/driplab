import type {
  BeanProduct,
  CaffeineLevel,
  IdealCoffeeProfile,
  RoastLevel,
} from "./types";

const WEIGHTS = {
  acidity: 0.25,
  body: 0.25,
  bitterness: 0.15,
  sweetness: 0.15,
  caffeine: 0.1,
  roast: 0.1,
} as const;

const CAFFEINE_NUM: Record<CaffeineLevel, number> = {
  low: 25,
  medium: 50,
  high: 75,
};

function dimDistance(a: number, b: number): number {
  const d = Math.abs(a - b) / 100;
  return d * d;
}

const ROAST_ORDER: RoastLevel[] = ["light", "medium", "medium_dark", "dark"];

function beanRoastIndex(bean: BeanProduct): number {
  if (typeof bean.roast_index === "number" && !Number.isNaN(bean.roast_index)) {
    return bean.roast_index;
  }
  const idx = ROAST_ORDER.indexOf(bean.roast_level);
  return idx >= 0 ? idx : 1;
}

function roastDistance(
  preferred: RoastLevel[],
  bean: BeanProduct,
  idealIndex: number,
): number {
  const actualIdx = beanRoastIndex(bean);
  const span = ROAST_ORDER.length - 1;

  if (preferred.includes(bean.roast_level)) {
    return (Math.abs(idealIndex - actualIdx) / span) * 0.35;
  }

  return Math.abs(idealIndex - actualIdx) / span;
}

export function scoreBean(
  ideal: IdealCoffeeProfile,
  bean: BeanProduct,
): number {
  const distance =
    WEIGHTS.acidity * dimDistance(ideal.target_acidity, bean.acidity) +
    WEIGHTS.body * dimDistance(ideal.target_body, bean.body) +
    WEIGHTS.bitterness *
      dimDistance(ideal.target_bitterness, bean.bitterness) +
    WEIGHTS.sweetness *
      dimDistance(ideal.target_sweetness, bean.sweetness) +
    WEIGHTS.caffeine *
      dimDistance(ideal.target_caffeine_num, CAFFEINE_NUM[bean.caffeine]) +
    WEIGHTS.roast *
      roastDistance(ideal.preferred_roast, bean, ideal.target_roast_index);

  return Math.round((1 - distance) * 10000) / 10000;
}
