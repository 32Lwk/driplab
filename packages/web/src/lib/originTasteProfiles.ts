/** 産地ごとの代表的な味わいプロファイル（0–100） */
export const ORIGIN_TASTE_PROFILES: Record<
  string,
  { acidity: number; body: number; bitterness: number; sweetness: number }
> = {
  ethiopia: { acidity: 82, body: 38, bitterness: 28, sweetness: 62 },
  kenya: { acidity: 88, body: 55, bitterness: 32, sweetness: 52 },
  tanzania: { acidity: 78, body: 52, bitterness: 35, sweetness: 50 },
  rwanda: { acidity: 75, body: 42, bitterness: 30, sweetness: 58 },
  uganda: { acidity: 65, body: 58, bitterness: 45, sweetness: 48 },
  burundi: { acidity: 76, body: 40, bitterness: 30, sweetness: 55 },
  zambia: { acidity: 62, body: 50, bitterness: 38, sweetness: 52 },
  brazil: { acidity: 35, body: 62, bitterness: 42, sweetness: 55 },
  colombia: { acidity: 58, body: 52, bitterness: 35, sweetness: 58 },
  guatemala: { acidity: 68, body: 58, bitterness: 40, sweetness: 52 },
  "costa-rica": { acidity: 65, body: 45, bitterness: 32, sweetness: 60 },
  panama: { acidity: 72, body: 42, bitterness: 28, sweetness: 65 },
  honduras: { acidity: 52, body: 55, bitterness: 38, sweetness: 55 },
  peru: { acidity: 48, body: 48, bitterness: 35, sweetness: 52 },
  mexico: { acidity: 42, body: 45, bitterness: 38, sweetness: 50 },
  "el-salvador": { acidity: 55, body: 50, bitterness: 32, sweetness: 62 },
  jamaica: { acidity: 40, body: 48, bitterness: 35, sweetness: 55 },
  nicaragua: { acidity: 58, body: 52, bitterness: 36, sweetness: 58 },
  bolivia: { acidity: 70, body: 40, bitterness: 28, sweetness: 55 },
  indonesia: { acidity: 32, body: 78, bitterness: 55, sweetness: 42 },
  vietnam: { acidity: 28, body: 72, bitterness: 68, sweetness: 38 },
  yemen: { acidity: 38, body: 72, bitterness: 52, sweetness: 45 },
  usa: { acidity: 38, body: 50, bitterness: 35, sweetness: 52 },
  japan: { acidity: 55, body: 35, bitterness: 25, sweetness: 58 },
  "papua-new-guinea": { acidity: 68, body: 55, bitterness: 38, sweetness: 50 },
};

export function getOriginTasteProfile(slug: string) {
  return ORIGIN_TASTE_PROFILES[slug];
}
