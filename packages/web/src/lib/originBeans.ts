import type { BeanProduct } from "@driplab/recommender";
import { getAvailableBeans } from "./catalog";

/** 産地ガイド slug → 豆カタログ origin 文字列とのマッチ用キーワード（長い順で評価） */
export const ORIGIN_SLUG_KEYWORDS: Record<string, string[]> = {
  ethiopia: ["エチオピア"],
  kenya: ["ケニア"],
  tanzania: ["タンザニア", "キリマンジャロ"],
  rwanda: ["ルワンダ"],
  uganda: ["ウガンダ"],
  burundi: ["ブルンジ"],
  zambia: ["ザンビア"],
  brazil: ["ブラジル"],
  colombia: ["コロンビア"],
  guatemala: ["グアテマラ", "グァテマラ"],
  "costa-rica": ["コスタリカ"],
  panama: ["パナマ"],
  honduras: ["ホンジュラス"],
  peru: ["ペルー"],
  mexico: ["メキシコ"],
  "el-salvador": ["エルサルバドル"],
  jamaica: ["ジャマイカ", "ブルーマウンテン"],
  nicaragua: ["ニカラグア"],
  bolivia: ["ボリビア"],
  indonesia: ["インドネシア", "マンデリン", "スマトラ", "スラウェシ", "トラジャ"],
  vietnam: ["ベトナム"],
  yemen: ["イエメン"],
  usa: ["アメリカ", "ハワイ", "コナ"],
  japan: ["日本"],
  "papua-new-guinea": ["パプアニューギニア", "パプア"],
};

const NON_ORIGIN_TAGS = new Set([
  "ブレンド",
  "他",
  "シングルオリジン",
  "カフェインレス",
  "ラテンアメリカ",
  "アフリカ",
  "アジア・太平洋",
  "アジア・太平洋地域",
  "モカ",
]);

function normalizeOriginText(text: string): string {
  return text.replace(/グァテマラ/g, "グアテマラ").replace(/\s+/g, "");
}

function extractOriginStrings(bean: BeanProduct): string[] {
  if (!bean.origin || bean.origin.length === 0) return [];
  return bean.origin.filter((v) => typeof v === "string" && v.length > 0);
}

function matchesYemen(originText: string): boolean {
  if (originText.includes("イエメン")) return true;
  if (originText.includes("モカ") && !originText.includes("エチオピア") && !originText.includes("インドネシア")) {
    return true;
  }
  return false;
}

/** 豆が指定産地ガイド slug に該当するか */
export function beanMatchesOriginSlug(bean: BeanProduct, slug: string): boolean {
  const keywords = ORIGIN_SLUG_KEYWORDS[slug];
  if (!keywords) return false;

  const origins = extractOriginStrings(bean);
  if (origins.length === 0) return false;

  for (const raw of origins) {
    if (NON_ORIGIN_TAGS.has(raw)) continue;

    const text = normalizeOriginText(raw);

    if (slug === "yemen") {
      if (matchesYemen(text)) return true;
      continue;
    }

    for (const keyword of keywords) {
      if (text.includes(normalizeOriginText(keyword))) return true;
    }
  }

  return false;
}

export function getBeansForOriginSlug(slug: string): BeanProduct[] {
  return getAvailableBeans()
    .filter((bean) => beanMatchesOriginSlug(bean, slug))
    .sort((a, b) => {
      const chain = a.chain_id.localeCompare(b.chain_id);
      if (chain !== 0) return chain;
      return a.display_name.localeCompare(b.display_name, "ja");
    });
}

/** 豆カードへのアンカーリンク */
export function beanCatalogHref(bean: BeanProduct): string {
  return `/beans#bean-${encodeURIComponent(bean.id)}`;
}

/** 産地フィルター付き豆一覧リンク */
export function beansByOriginHref(slug: string): string {
  return `/beans?origin=${encodeURIComponent(slug)}`;
}
