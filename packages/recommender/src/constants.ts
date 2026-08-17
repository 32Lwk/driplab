import type { ChainId, EquipmentId } from "./types";

export const CHAIN_LABELS: Record<ChainId, string> = {
  starbucks: "スターバックス",
  maruyama: "丸山珈琲",
  doutor: "ドトール",
  tullys: "タリーズ",
  kaldi: "カルディ",
  ucc: "UCC",
  hoshino: "星乃珈琲",
  ogawa: "小川珈琲",
  sarutahiko: "猿田彦珈琲",
  bluebottle: "ブルーボトル",
  saza: "サザコーヒー",
};

export const EQUIPMENT_OPTIONS: { id: EquipmentId; name_ja: string }[] = [
  { id: "drip", name_ja: "ハンドドリップ（V60）" },
  { id: "french_press", name_ja: "フレンチプレス" },
  { id: "espresso", name_ja: "エスプレッソ" },
  { id: "siphon", name_ja: "サイフォン" },
];

export const GRIND_LABELS: Record<string, string> = {
  extra_fine: "極細挽き",
  fine: "細挽き",
  medium_fine: "中細挽き",
  medium: "中挽き",
  coarse: "粗挽き",
};

export const MOOD_PRESETS = [
  {
    id: "focus",
    label: "午後の集中",
    mood: { alertness: 85, acidity_pref: 40, body_pref: 70, sweetness_pref: 35 },
  },
  {
    id: "relax",
    label: "リラックス",
    mood: { alertness: 25, acidity_pref: 45, body_pref: 40, sweetness_pref: 75 },
  },
  {
    id: "acidity",
    label: "酸味を楽しむ",
    mood: { alertness: 50, acidity_pref: 90, body_pref: 35, sweetness_pref: 55 },
  },
] as const;

export const EQUIPMENT_PRIORITY: EquipmentId[] = [
  "drip",
  "french_press",
  "espresso",
  "siphon",
];
