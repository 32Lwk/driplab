const ONBOARDING_KEY = "driplab_onboarding_done_v1";

export function isOnboardingDone(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDING_KEY) === "1";
}

export function markOnboardingDone(): void {
  localStorage.setItem(ONBOARDING_KEY, "1");
}

export const ONBOARDING_STEPS = [
  {
    title: "気分 or 食事で選ぶ",
    body: "「気分で選ぶ」ではスライダーで今日の一杯を。「食事に合わせる」ではスイーツや食事に合う豆と淹れ方を提案します。",
  },
  {
    title: "理由付きで提案",
    body: "豆・淹れ方・レシピを、なぜその組み合わせなのか理由付きで表示。気に入ったらお気に入り保存もできます。",
  },
] as const;
