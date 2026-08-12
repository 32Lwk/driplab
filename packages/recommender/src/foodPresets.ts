import type { EquipmentId } from "./types";

export interface FoodIdealProfile {
  target_acidity: number;
  target_body: number;
  target_bitterness: number;
  target_sweetness: number;
  target_roast_index: number;
}

export interface FoodPreset {
  id: string;
  label_ja: string;
  emoji: string;
  category: "sweet" | "savory" | "light";
  description: string;
  ideal: FoodIdealProfile;
  /** Equipment affinity 0–1 per method (food-oriented, Q9-C) */
  equipment_bias: Record<EquipmentId, number>;
  pairing_hint: string;
  keywords: string[];
}

export const FOOD_PRESETS: FoodPreset[] = [
  {
    id: "chocolate",
    label_ja: "チョコレート",
    emoji: "🍫",
    category: "sweet",
    description: "カカオの苦みとコクを引き立てる一杯",
    ideal: {
      target_acidity: 35,
      target_body: 72,
      target_bitterness: 58,
      target_sweetness: 55,
      target_roast_index: 2.2,
    },
    equipment_bias: {
      french_press: 0.95,
      espresso: 0.85,
      drip: 0.55,
      siphon: 0.4,
    },
    pairing_hint: "カカオのビターさと重なり、甘さを引き立てます",
    keywords: ["チョコ", "チョコレート", "ガナッシュ", "ブラウニー", "cacao", "chocolate"],
  },
  {
    id: "cheesecake",
    label_ja: "チーズケーキ",
    emoji: "🍰",
    category: "sweet",
    description: "クリームのコクと軽い酸味のバランス",
    ideal: {
      target_acidity: 48,
      target_body: 58,
      target_bitterness: 42,
      target_sweetness: 62,
      target_roast_index: 1.5,
    },
    equipment_bias: {
      drip: 0.88,
      siphon: 0.82,
      french_press: 0.65,
      espresso: 0.55,
    },
    pairing_hint: "クリームのまろやかさに負けず、後口をすっきり整えます",
    keywords: ["チーズケーキ", "チーズ", "cheesecake", "レアチーズ"],
  },
  {
    id: "fruit_tart",
    label_ja: "フルーツタルト",
    emoji: "🍓",
    category: "sweet",
    description: "果実の酸味と香りを引き出す明るい一杯",
    ideal: {
      target_acidity: 72,
      target_body: 38,
      target_bitterness: 28,
      target_sweetness: 58,
      target_roast_index: 0.8,
    },
    equipment_bias: {
      siphon: 0.92,
      drip: 0.88,
      french_press: 0.35,
      espresso: 0.3,
    },
    pairing_hint: "ベリーや柑橘の酸味と響き合い、甘さを引き締めます",
    keywords: ["タルト", "フルーツ", "ベリー", "いちご", "柑橘", "tart", "fruit"],
  },
  {
    id: "croissant",
    label_ja: "クロワッサン・パン",
    emoji: "🥐",
    category: "sweet",
    description: "バターの香りに寄り添うバランス型",
    ideal: {
      target_acidity: 42,
      target_body: 52,
      target_bitterness: 45,
      target_sweetness: 55,
      target_roast_index: 1.3,
    },
    equipment_bias: {
      drip: 0.9,
      french_press: 0.7,
      siphon: 0.65,
      espresso: 0.6,
    },
    pairing_hint: "バターのコクを邪魔せず、朝の香りを広げます",
    keywords: ["クロワッサン", "パン", "トースト", "ベーグル", "croissant", "bread"],
  },
  {
    id: "matcha_sweet",
    label_ja: "抹茶スイーツ",
    emoji: "🍵",
    category: "sweet",
    description: "抹茶の渋みと甘さの調和",
    ideal: {
      target_acidity: 38,
      target_body: 55,
      target_bitterness: 38,
      target_sweetness: 52,
      target_roast_index: 1.1,
    },
    equipment_bias: {
      drip: 0.85,
      french_press: 0.75,
      siphon: 0.7,
      espresso: 0.45,
    },
    pairing_hint: "抹茶の草香と重ならず、甘さの余韻を整えます",
    keywords: ["抹茶", "和菓子", "どら焼き", "matcha", "あんこ"],
  },
  {
    id: "ice_cream",
    label_ja: "アイスクリーム",
    emoji: "🍦",
    category: "sweet",
    description: "冷たい甘さに負けないコクとビター",
    ideal: {
      target_acidity: 32,
      target_body: 68,
      target_bitterness: 55,
      target_sweetness: 48,
      target_roast_index: 2.4,
    },
    equipment_bias: {
      french_press: 0.92,
      espresso: 0.88,
      drip: 0.5,
      siphon: 0.35,
    },
    pairing_hint: "冷たい甘さに対して温かいコクでコントラストを作ります",
    keywords: ["アイス", "アイスクリーム", "ジェラート", "ice cream", "パフェ"],
  },
  {
    id: "pancake",
    label_ja: "パンケーキ",
    emoji: "🥞",
    category: "sweet",
    description: "メープルやバターに合うまろやかな甘み",
    ideal: {
      target_acidity: 40,
      target_body: 55,
      target_bitterness: 40,
      target_sweetness: 65,
      target_roast_index: 1.4,
    },
    equipment_bias: {
      drip: 0.85,
      french_press: 0.8,
      siphon: 0.6,
      espresso: 0.55,
    },
    pairing_hint: "メープルやバターの甘さを包み込むように寄り添います",
    keywords: ["パンケーキ", "ワッフル", "ホットケーキ", "pancake", "waffle"],
  },
  {
    id: "cheese_plate",
    label_ja: "チーズ・ナッツ",
    emoji: "🧀",
    category: "savory",
    description: "脂と塩味に耐えるボディと低酸",
    ideal: {
      target_acidity: 30,
      target_body: 75,
      target_bitterness: 52,
      target_sweetness: 42,
      target_roast_index: 2.3,
    },
    equipment_bias: {
      french_press: 0.95,
      espresso: 0.8,
      drip: 0.55,
      siphon: 0.3,
    },
    pairing_hint: "チーズの塩味と脂を受け止める厚みのあるコクです",
    keywords: ["チーズ", "ナッツ", "cheese", "アーモンド", "くるみ"],
  },
  {
    id: "savory_breakfast",
    label_ja: "ベーコンエッグ",
    emoji: "🍳",
    category: "savory",
    description: "塩気と脂に合う深煎り・低酸",
    ideal: {
      target_acidity: 28,
      target_body: 70,
      target_bitterness: 58,
      target_sweetness: 35,
      target_roast_index: 2.5,
    },
    equipment_bias: {
      french_press: 0.9,
      espresso: 0.88,
      drip: 0.5,
      siphon: 0.25,
    },
    pairing_hint: "朝食の塩気に負けない深いコクで一日を始められます",
    keywords: ["ベーコン", "エッグ", "朝食", "サンドイッチ", "breakfast", "bacon"],
  },
  {
    id: "salad",
    label_ja: "サラダ・軽食",
    emoji: "🥗",
    category: "light",
    description: "軽い食事に合うすっきりとした酸味",
    ideal: {
      target_acidity: 65,
      target_body: 35,
      target_bitterness: 30,
      target_sweetness: 48,
      target_roast_index: 0.9,
    },
    equipment_bias: {
      drip: 0.9,
      siphon: 0.88,
      french_press: 0.35,
      espresso: 0.25,
    },
    pairing_hint: "軽い食事の後口をすっきり整える明るい酸味です",
    keywords: ["サラダ", "軽食", "salad", "野菜", "スープ"],
  },
  {
    id: "curry",
    label_ja: "カレー・スパイス",
    emoji: "🍛",
    category: "savory",
    description: "スパイスの刺激を和らげる深いコク",
    ideal: {
      target_acidity: 25,
      target_body: 78,
      target_bitterness: 62,
      target_sweetness: 38,
      target_roast_index: 2.6,
    },
    equipment_bias: {
      french_press: 0.95,
      espresso: 0.85,
      drip: 0.45,
      siphon: 0.2,
    },
    pairing_hint: "スパイスの刺激の後に、まろやかなコクで口を整えます",
    keywords: ["カレー", "スパイス", "curry", "スパイシー", "エスニック"],
  },
  {
    id: "japanese",
    label_ja: "和食・寿司",
    emoji: "🍣",
    category: "light",
    description: "繊細なうま味に合うクリーンな一杯",
    ideal: {
      target_acidity: 55,
      target_body: 42,
      target_bitterness: 32,
      target_sweetness: 50,
      target_roast_index: 1.0,
    },
    equipment_bias: {
      siphon: 0.92,
      drip: 0.88,
      french_press: 0.4,
      espresso: 0.2,
    },
    pairing_hint: "素材の繊細なうま味を邪魔せず、口を清めます",
    keywords: ["和食", "寿司", "刺身", "おにぎり", "japanese", "sushi"],
  },
];

export function getFoodPreset(id: string): FoodPreset | undefined {
  return FOOD_PRESETS.find((p) => p.id === id);
}

/** Match free text to nearest preset via keyword overlap */
export function matchPresetFromText(text: string): {
  preset: FoodPreset;
  confidence: number;
} {
  const normalized = text.toLowerCase().trim();
  if (!normalized) {
    return { preset: FOOD_PRESETS[0], confidence: 0 };
  }

  let best = FOOD_PRESETS[0];
  let bestScore = 0;

  for (const preset of FOOD_PRESETS) {
    let score = 0;
    for (const kw of preset.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        score += kw.length >= 3 ? 2 : 1;
      }
    }
    if (preset.label_ja.includes(text.trim()) || text.trim().includes(preset.label_ja)) {
      score += 5;
    }
    if (score > bestScore) {
      bestScore = score;
      best = preset;
    }
  }

  const confidence = bestScore > 0 ? Math.min(1, bestScore / 6) : 0.25;
  return { preset: best, confidence };
}
