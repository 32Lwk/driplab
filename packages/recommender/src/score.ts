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
  low: 0,
  medium: 50,
  high: 100,
};

function dimDistance(a: number, b: number): number {
  return Math.abs(a - b) / 100;
}

function caffeineDistance(
  target: CaffeineLevel,
  bean: CaffeineLevel,
): number {
  return dimDistance(CAFFEINE_NUM[target], CAFFEINE_NUM[bean]);
}

function roastDistance(
  preferred: RoastLevel[],
  actual: RoastLevel,
): number {
  if (preferred.includes(actual)) return 0;
  const order: RoastLevel[] = ["light", "medium", "medium_dark", "dark"];
  const targetIdx = Math.min(
    ...preferred.map((r) => order.indexOf(r)).filter((i) => i >= 0),
  );
  const actualIdx = order.indexOf(actual);
  if (targetIdx < 0 || actualIdx < 0) return 0.5;
  return Math.abs(targetIdx - actualIdx) / (order.length - 1);
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
      caffeineDistance(ideal.target_caffeine, bean.caffeine) +
    WEIGHTS.roast * roastDistance(ideal.preferred_roast, bean.roast_level);

  return Math.round((1 - distance) * 100) / 100;
}
