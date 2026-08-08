export interface OriginVariety {
  name: string;
  description: string;
}

export interface OriginGuide {
  slug: string;
  name_ja: string;
  region: string;
  summary: string;
  description: string;
  characteristics: string[];
  flavor_notes: string[];
  famous_regions: string[];
  processing_tendency: string;
  suitable_for: string;
  /** 栽培されるコーヒー種（アラビカ種・ロブスタ種など）の概要 */
  species: string;
  /** 代表的な品種・系統 */
  varieties: OriginVariety[];
  /** 生産規模・標高・収穫期など栽培環境の補足 */
  production: string;
}

export interface VarietyGuide {
  slug: string;
  name_ja: string;
  category: "species" | "type" | "cultivar";
  summary: string;
  description: string;
  characteristics: string[];
  flavor_notes: string[];
  /** 品種一覧ページでのサブグループ（cultivar のみ） */
  group?: import("./varietyGuidesData").CultivarGroupId;
  /** 系統・交配の概要 */
  parent_lineage?: string;
  /** 主な栽培地域 */
  regions?: string[];
  /** 産地ガイド等の表記ゆれ → slug 解決用 */
  aliases?: string[];
}

export interface ProcessingGuide {
  slug: string;
  name_ja: string;
  summary: string;
  description: string;
  steps: { title: string; description: string }[];
  characteristics: string[];
  flavor_impact: string[];
  suitable_for: string;
}

export interface RoastGuide {
  slug: string;
  name_ja: string;
  summary: string;
  description: string;
  characteristics: string[];
  flavor_notes: string[];
  suitable_for: string;
}

import { ORIGIN_GUIDES } from "./originGuidesData";

export { ORIGIN_GUIDES };

import { VARIETY_GUIDES } from "./varietyGuidesData";

export { VARIETY_GUIDES };

export const PROCESSING_GUIDES: ProcessingGuide[] = [
  {
    slug: "washed",
    name_ja: "ウォッシュド（水洗式）",
    summary: "果実を除去して発酵・水洗。クリーンで明るい酸味が特徴",
    description:
      "ウォッシュド（Washed / Wet Process）は、収穫したチェリーを脱果肉機で果肉を取り除き、粘膜を発酵または機械で除去してから水洗・乾燥する方法です。世界で最も広く使われる精製方法で、豆本来の個性がクリーンに表現されます。",
    steps: [
      { title: "収穫", description: "完熟したチェリー（果実）を手摘みまたは機械で収穫" },
      { title: "脱果肉", description: "脱果肉機で果肉と皮を取り除き、種（生豆）を取り出す" },
      { title: "発酵・水洗", description: "残った粘膜を発酵槽で分解させ、水洗で除去する" },
      { title: "乾燥", description: "天日または機械乾燥で水分を12%程度まで落とす" },
    ],
    characteristics: [
      "クリーンで透明感のある味わい",
      "明るく鮮やかな酸味",
      "産地・品種の個性がはっきり表れる",
      "世界で最も一般的な精製方法",
    ],
    flavor_impact: [
      "酸味が明るく、フルーティーな印象",
      "余計な発酵味が少なく、クリーン",
      "浅煎り〜中煎りで個性を楽しみやすい",
    ],
    suitable_for: "産地の個性や酸味を楽しみたいとき、浅煎り〜中煎りのドリップに",
  },
  {
    slug: "natural",
    name_ja: "ナチュラル（自然乾燥式）",
    summary: "果実ごと天日乾燥。果実の甘みとベリー系の風味が強調される",
    description:
      "ナチュラル（Natural / Dry Process）は、収穫したチェリーを果実のまま天日で乾燥させる最も古い精製方法です。乾燥中に果実の糖分が豆に移行し、果実感のある甘みとベリー系の風味が強調されます。",
    steps: [
      { title: "収穫", description: "完熟したチェリーを収穫し、選別する" },
      { title: "天日乾燥", description: "果実のままパティオ（乾燥床）で2〜4週間天日乾燥" },
      { title: "翻転", description: "乾燥中に定期的に豆を翻して均一に乾燥させる" },
      { title: "脱壳", description: "乾燥後、脱壳機で果皮と果肉を取り除く" },
    ],
    characteristics: [
      "果実の甘みとベリー系の風味",
      "ワインのような複雑さや発酵感",
      "ボディが厚く、コクがある",
      "エチオピアやブラジルで盛ん",
    ],
    flavor_impact: [
      "ベリー、ドライフルーツ、ワインのような風味",
      "甘みが強調され、酸味は丸みを帯びる",
      "浅煎りでもコクを感じやすい",
    ],
    suitable_for: "果実感や甘みを楽しみたいとき、浅煎り〜中煎りのドリップに",
  },
  {
    slug: "honey",
    name_ja: "ハニー（蜜処理）",
    summary: "果肉を除去し、粘膜ごと乾燥。甘みとボディのバランスが良い",
    description:
      "ハニー（Honey Process）は、脱果肉後に粘膜（パルプ）を残したまま乾燥させる方法です。粘膜の糖分が豆に移行し、ナチュラルとウォッシュドの中間的な味わいになります。コスタリカ発祥で、現在は世界各地で行われています。",
    steps: [
      { title: "収穫", description: "完熟したチェリーを手摘みで収穫する" },
      { title: "脱果肉", description: "脱果肉機で果肉と皮を取り除き、粘膜（パルプ）を残す" },
      { title: "粘膜乾燥", description: "粘膜を残したまま、パティオや乾燥床で天日乾燥する" },
      { title: "翻転・管理", description: "乾燥中に定期的に翻転し、粘膜量を管理する（白・黄・赤・黒ハニー）" },
      { title: "脱壳", description: "十分に乾燥した後、脱壳して生豆を取り出す" },
    ],
    characteristics: [
      "甘みとボディのバランスが良い",
      "ナチュラルよりクリーン、ウォッシュドより甘みがある",
      "白・黄・赤・黒ハニーで粘膜量が異なる",
      "コスタリカ発祥、現在は世界各地で普及",
    ],
    flavor_impact: [
      "ハチミツ、キャラメル、トロピカルフルーツの甘み",
      "ボディがやや厚く、酸味は穏やか",
      "中煎りでバランスよく楽しめる",
    ],
    suitable_for: "甘みとコクのバランスを楽しみたいとき、中煎りのドリップに",
  },
  {
    slug: "semi-washed",
    name_ja: "セミウォッシュド（半水洗）",
    summary: "水洗と自然乾燥の中間。インドネシアのスマトラ式など",
    description:
      "セミウォッシュド（Semi-Washed / Wet-Hulled）は、脱果肉後に短時間発酵させてから乾燥する、またはインドネシアのスマトラ式（ガイリングバシャ）のように湿った状態で脱壳する方法です。深いコクとスパイシーな風味が生まれます。",
    steps: [
      { title: "収穫", description: "完熟したチェリーを手摘みで収穫する" },
      { title: "脱果肉", description: "脱果肉機で果肉と皮を取り除く" },
      { title: "短時間発酵", description: "短時間発酵させるか、湿った状態で脱壳する（スマトラ式）" },
      { title: "乾燥", description: "天日または機械乾燥で水分を落とす" },
      { title: "選別", description: "生豆を選別し、品質を確認する" },
    ],
    characteristics: [
      "深いコクと重厚なボディ",
      "スパイシー、ハーブ、土のような風味",
      "インドネシア（スマトラ）で代表的",
      "低めの酸味、ビター寄り",
    ],
    flavor_impact: [
      "スパイス、ハーブ、ダークチョコの風味",
      "酸味は控えめで、コクが強調される",
      "中深煎り〜深煎りで個性が活きる",
    ],
    suitable_for: "深いコクを求めるとき、中深煎り〜深煎り、フレンチプレスに",
  },
  {
    slug: "anaerobic",
    name_ja: "アナエロビック（嫌気性発酵）",
    summary: "密閉環境での発酵。ワインのような複雑で個性的な風味",
    description:
      "アナエロビック（Anaerobic）発酵は、酸素を遮断した密閉タンク内で意図的に発酵させる近年注目の精製方法です。ワインやクラフトビールのような複雑で個性的な風味が生まれ、スペシャルティコーヒーの実験的手法として人気があります。",
    steps: [
      { title: "収穫", description: "完熟チェリーを手摘みで収穫する" },
      { title: "脱果肉", description: "必要に応じて脱果肉機で果肉を取り除く" },
      { title: "密閉発酵", description: "酸素を遮断したタンク内で24〜120時間発酵させる" },
      { title: "温度・時間管理", description: "発酵温度と時間を細かく管理し、風味をコントロールする" },
      { title: "乾燥", description: "発酵後、天日または機械乾燥で仕上げる" },
    ],
    characteristics: [
      "ワインのような複雑で個性的な風味",
      "発酵感、トロピカルフルーツ、スパイス",
      "近年のスペシャルティコーヒーで注目",
      "ロットごとに個性が大きく異なる",
    ],
    flavor_impact: [
      "トロピカルフルーツ、ワイン、スパイスの複雑さ",
      "通常の精製法にはない個性的な風味",
      "浅煎りで個性を最大限に楽しめる",
    ],
    suitable_for: "個性的で実験的な風味を求めるとき、浅煎りのドリップやサイフォンに",
  },
];

export const ROAST_GUIDES: RoastGuide[] = [
  {
    slug: "light",
    name_ja: "浅煎り（ライトロースト）",
    summary: "豆の個性と酸味を最大限に。産地・精製の風味が前面に",
    description:
      "浅煎りは豆の内部温度が約205°C前後で止めた焙煎度です。豆の産地や精製方法の個性が最もはっきり表れ、明るい酸味とフルーティーな香りが特徴です。スペシャルティコーヒーでは最も個性を楽しめる焙煎度とされています。",
    characteristics: [
      "産地・精製の個性が最もはっきり表れる",
      "明るい酸味とフルーティーな香り",
      "豆の表面は薄い茶色、油分は出ない",
      "抽出はやや難しく、挽き目・湯温の調整が重要",
    ],
    flavor_notes: ["フルーティー", "フローラル", "柑橘", "紅茶", "ベリー"],
    suitable_for: "産地の個性を楽しみたいとき、ハンドドリップやサイフォンに",
  },
  {
    slug: "medium",
    name_ja: "中煎り（ミディアムロースト）",
    summary: "酸味とコクのバランス。最も飲みやすい定番の焙煎度",
    description:
      "中煎りは豆の内部温度が約210〜220°Cで止めた焙煎度です。酸味とコクのバランスが良く、最も飲みやすいとされる定番の焙煎度です。DripLab では中煎りを基準にレシピを調整しています。",
    characteristics: [
      "酸味とコクのバランスが良い",
      "最も飲みやすく、幅広い好みに合う",
      "豆の表面は中程度の茶色",
      "抽出方法の選択肢が広い",
    ],
    flavor_notes: ["カラメル", "ナッツ", "チョコレート", "オレンジ", "バランス"],
    suitable_for: "日常の一杯、どの抽出法にも合う万能な焙煎度",
  },
  {
    slug: "medium-dark",
    name_ja: "中深煎り（ミディアムダーク）",
    summary: "コクとビターが増し、ミルクとの相性も良い",
    description:
      "中深煎りは豆の内部温度が約225°C前後で止めた焙煎度です。コクとビターが増し、酸味は控えめになります。カフェラテやカプチーノのベースとしても人気があり、ミルクとの相性が良い焙煎度です。",
    characteristics: [
      "コクとビターが増し、酸味は控えめ",
      "豆の表面は深い茶色、やや油がにじむ",
      "ミルクドリンクとの相性が良い",
      "フレンチプレスやエスプレッソに向く",
    ],
    flavor_notes: ["ダークチョコ", "キャラメル", "スモーク", "ナッツ", "ビター"],
    suitable_for: "しっかりしたコクが欲しいとき、ラテやフレンチプレスに",
  },
  {
    slug: "dark",
    name_ja: "深煎り（ダークロースト）",
    summary: "強いビターとスモーキー。エスプレッソやアイスコーヒーに",
    description:
      "深煎りは豆の内部温度が約230°C以上で止めた焙煎度です。強いビターとスモーキーな風味が特徴で、豆の産地個性よりも焙煎の香ばしさが前面に出ます。エスプレッソやアイスコーヒー、ブレンドのベースとして使われることが多いです。",
    characteristics: [
      "強いビターとスモーキーな香ばしさ",
      "豆の表面は黒に近く、油がにじむ",
      "産地個性より焙煎香が前面",
      "エスプレッソやアイスコーヒーに向く",
    ],
    flavor_notes: ["ビター", "スモーク", "炭", "ダークチョコ", "スパイス"],
    suitable_for: "強いコクやビターが欲しいとき、エスプレッソやアイスコーヒーに",
  },
];

export function getOriginGuide(slug: string): OriginGuide | undefined {
  return ORIGIN_GUIDES.find((o) => o.slug === slug);
}

export function getProcessingGuide(slug: string): ProcessingGuide | undefined {
  return PROCESSING_GUIDES.find((p) => p.slug === slug);
}

export function getVarietyGuide(slug: string): VarietyGuide | undefined {
  return VARIETY_GUIDES.find((v) => v.slug === slug);
}

const varietySlugByName = (() => {
  const map = new Map<string, string>();
  for (const guide of VARIETY_GUIDES) {
    map.set(guide.name_ja, guide.slug);
    for (const alias of guide.aliases ?? []) {
      map.set(alias, guide.slug);
    }
  }
  return map;
})();

/** 産地ガイド等の品種名から詳細ページ slug を解決（見つからなければ undefined） */
export function resolveVarietySlug(name: string): string | undefined {
  const direct = varietySlugByName.get(name);
  if (direct) return direct;

  const normalized = name.replace(/\s+/g, "").toLowerCase();
  for (const [key, slug] of varietySlugByName) {
    if (key.replace(/\s+/g, "").toLowerCase() === normalized) return slug;
  }
  return undefined;
}

export function getRoastGuide(slug: string): RoastGuide | undefined {
  return ROAST_GUIDES.find((r) => r.slug === slug);
}

export const LEARN_CATEGORIES = [
  {
    id: "origins",
    name_ja: "産地ガイド",
    href: "/learn/origins",
    summary: "エチオピア、ブラジル、コロンビアなど25の主要産地の特徴・風味・品種",
    count: ORIGIN_GUIDES.length,
  },
  {
    id: "varieties",
    name_ja: "豆の種類",
    href: "/learn/varieties",
    summary: "アラビカ・ロブスタ、シングルオリジン・ブレンド、主要品種40種以上",
    count: VARIETY_GUIDES.length,
  },
  {
    id: "processing",
    name_ja: "精製方法",
    href: "/learn/processing",
    summary: "ウォッシュド、ナチュラル、ハニーなど生豆の処理方法",
    count: PROCESSING_GUIDES.length,
  },
  {
    id: "roast",
    name_ja: "焙煎度",
    href: "/learn/roast",
    summary: "浅煎りから深煎りまで、焙煎が味わいに与える影響",
    count: ROAST_GUIDES.length,
  },
] as const;
