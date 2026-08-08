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

function roastDistance(
  preferred: RoastLevel[],
  actual: RoastLevel,
  idealIndex: number,
): number {
  if (preferred.includes(actual)) {
    const order: RoastLevel[] = ["light", "medium", "medium_dark", "dark"];
    const actualIdx = order.indexOf(actual);
    if (actualIdx >= 0) {
      return Math.abs(idealIndex - actualIdx) / (order.length - 1) * 0.35;
    }
    return 0;
  }

  const order: RoastLevel[] = ["light", "medium", "medium_dark", "dark"];
  const actualIdx = order.indexOf(actual);
  if (actualIdx < 0) return 0.5;
  return Math.abs(idealIndex - actualIdx) / (order.length - 1);
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
      roastDistance(ideal.preferred_roast, bean.roast_level, ideal.target_roast_index);

  return Math.round((1 - distance) * 10000) / 10000;
}
