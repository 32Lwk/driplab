import type { ChainId, RoastLevel } from "./types";

/**
 * Cross-chain taste / roast calibration (Plan A).
 *
 * Each chain publishes roast and taste labels on its own relative scale.
 * We first compute a within-chain local score (normalize.ts), then map to a
 * global 0–100 frame where ~50 ≈ Japanese city/high "everyday balanced" cup
 * (Kaldi Mild / Ogawa mid-band / Hoshino Blend).
 *
 *   score_global = clamp(0, 100, round(OFFSET + GAIN × score_local))
 */

export interface TasteScores {
  acidity: number;
  body: number;
  bitterness: number;
  sweetness: number;
}

export interface MetricCalibration {
  gain: number;
  offset: number;
}

export type TasteCalibration = Record<keyof TasteScores, MetricCalibration>;

/** Plan A coefficients — see research notes in PR / conversation. */
export const CHAIN_TASTE_CALIBRATION: Record<ChainId, TasteCalibration> = {
  kaldi: {
    acidity: { gain: 1.0, offset: 0 },
    body: { gain: 1.0, offset: 0 },
    bitterness: { gain: 1.0, offset: 0 },
    sweetness: { gain: 1.0, offset: 0 },
  },
  starbucks: {
    acidity: { gain: 0.9, offset: -5 },
    body: { gain: 1.05, offset: 5 },
    bitterness: { gain: 1.1, offset: 8 },
    sweetness: { gain: 0.95, offset: 0 },
  },
  bluebottle: {
    acidity: { gain: 1.15, offset: 5 },
    body: { gain: 0.95, offset: 0 },
    bitterness: { gain: 0.85, offset: -5 },
    sweetness: { gain: 1.1, offset: 5 },
  },
  ogawa: {
    acidity: { gain: 0.85, offset: 0 },
    body: { gain: 0.85, offset: 0 },
    bitterness: { gain: 0.85, offset: 0 },
    sweetness: { gain: 0.9, offset: 0 },
  },
  sarutahiko: {
    acidity: { gain: 1.2, offset: 8 },
    body: { gain: 1.0, offset: 3 },
    bitterness: { gain: 0.9, offset: -5 },
    sweetness: { gain: 1.15, offset: 8 },
  },
  maruyama: {
    acidity: { gain: 1.1, offset: 3 },
    body: { gain: 1.0, offset: 0 },
    bitterness: { gain: 0.95, offset: 0 },
    sweetness: { gain: 1.05, offset: 3 },
  },
  doutor: {
    acidity: { gain: 0.9, offset: -3 },
    body: { gain: 1.05, offset: 3 },
    bitterness: { gain: 1.1, offset: 6 },
    sweetness: { gain: 0.95, offset: 0 },
  },
  tullys: {
    acidity: { gain: 0.9, offset: -4 },
    body: { gain: 1.05, offset: 4 },
    bitterness: { gain: 1.1, offset: 6 },
    sweetness: { gain: 1.0, offset: 2 },
  },
  ucc: {
    acidity: { gain: 0.9, offset: -2 },
    body: { gain: 0.9, offset: 2 },
    bitterness: { gain: 0.95, offset: 2 },
    sweetness: { gain: 0.95, offset: 3 },
  },
  hoshino: {
    acidity: { gain: 0.95, offset: 0 },
    body: { gain: 1.0, offset: 0 },
    bitterness: { gain: 0.95, offset: 0 },
    sweetness: { gain: 1.1, offset: 5 },
  },
  saza: {
    acidity: { gain: 1.08, offset: 2 },
    body: { gain: 1.0, offset: 0 },
    bitterness: { gain: 0.95, offset: 0 },
    sweetness: { gain: 1.05, offset: 3 },
  },
};

/**
 * Absolute roast index (0 = true light … 3 = Italian / very dark).
 * Used when chain-specific labels are absent; label overrides win.
 */
const CHAIN_ROAST_INDEX: Record<ChainId, Record<RoastLevel, number>> = {
  kaldi: { light: 0.0, medium: 1.0, medium_dark: 2.0, dark: 2.7 },
  maruyama: { light: 0.0, medium: 1.0, medium_dark: 2.0, dark: 2.7 },
  starbucks: { light: 0.8, medium: 1.6, medium_dark: 2.2, dark: 2.8 },
  bluebottle: { light: 0.6, medium: 1.0, medium_dark: 1.6, dark: 2.0 },
  sarutahiko: { light: 0.2, medium: 1.0, medium_dark: 1.8, dark: 2.5 },
  doutor: { light: 0.5, medium: 1.3, medium_dark: 1.8, dark: 2.6 },
  tullys: { light: 0.4, medium: 1.3, medium_dark: 2.0, dark: 2.8 },
  ogawa: { light: 0.3, medium: 1.3, medium_dark: 2.0, dark: 2.6 },
  ucc: { light: 0.3, medium: 1.3, medium_dark: 2.0, dark: 2.6 },
  hoshino: { light: 0.4, medium: 1.3, medium_dark: 1.9, dark: 2.5 },
  saza: { light: 0.2, medium: 1.0, medium_dark: 1.8, dark: 2.6 },
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function applyMetric(local: number, cal: MetricCalibration): number {
  return clampScore(cal.offset + cal.gain * local);
}

export function calibrateTasteScores(
  chainId: ChainId,
  local: TasteScores,
): TasteScores {
  const cal = CHAIN_TASTE_CALIBRATION[chainId];
  return {
    acidity: applyMetric(local.acidity, cal.acidity),
    body: applyMetric(local.body, cal.body),
    bitterness: applyMetric(local.bitterness, cal.bitterness),
    sweetness: applyMetric(local.sweetness, cal.sweetness),
  };
}

export function roastIndexToLevel(index: number): RoastLevel {
  if (index < 0.5) return "light";
  if (index < 1.5) return "medium";
  if (index < 2.5) return "medium_dark";
  return "dark";
}

/**
 * Resolve absolute roast index from chain + local level + optional labels.
 */
export function absoluteRoastIndex(
  chainId: ChainId,
  localLevel: RoastLevel,
  roastLabel?: string,
  name?: string,
): number {
  const haystack = `${roastLabel ?? ""} ${name ?? ""}`.toLowerCase();

  // Label overrides (highest priority)
  if (/blond|ブロンド|ライトノート/.test(haystack)) return 0.8;
  if (/ボールド|bold/.test(haystack)) return 2.0;
  if (/イタリアン|italian/.test(haystack)) return 2.9;
  if (/フレンチ|french/.test(haystack)) {
    return chainId === "tullys" || chainId === "starbucks" ? 2.8 : 2.7;
  }
  if (/ハイロースト|high\s*roast/.test(haystack)) return 1.8;
  if (/シティロースト|city/.test(haystack) && chainId === "hoshino") return 1.4;
  if (/フルシティ|full\s*city/.test(haystack)) return 2.0;

  if (chainId === "doutor" && /バランス|マイルド/.test(haystack)) {
    return 1.8;
  }

  return CHAIN_ROAST_INDEX[chainId][localLevel];
}

export function calibrateRoastLevel(
  chainId: ChainId,
  localLevel: RoastLevel,
  roastLabel?: string,
  name?: string,
): { roast_level: RoastLevel; roast_index: number } {
  const roast_index = absoluteRoastIndex(
    chainId,
    localLevel,
    roastLabel,
    name,
  );
  return {
    roast_level: roastIndexToLevel(roast_index),
    roast_index,
  };
}
