import type { BeanProduct } from "@driplab/recommender";
import { VARIETY_GUIDES } from "./varietyGuidesData";
import { getAvailableBeans } from "./catalog";

/** 品種 slug → 豆テキスト検索キーワード（長い順で評価） */
const MANUAL_VARIETY_KEYWORDS: Record<string, string[]> = {
  "typica-bourbon": ["ティピカ", "Typica", "ブルボン", "Bourbon", "ボルボン"],
  typica: ["ティピカ", "Typica"],
  "red-bourbon": ["レッドブルボン", "Red Bourbon", "ブルボン", "Bourbon", "ボルボン"],
  caturra: ["カトゥーラ", "Caturra", "カツーラ"],
  catuai: ["カトゥアイ", "Catuaí", "Catuai"],
  "mundo-novo": ["ムンドノーヴォ", "ムンドノーボ", "Mundo Novo"],
  arara: ["アララ", "Arara"],
  sl28: ["SL28", "SL-28", "スライ28", "スライ２８"],
  sl34: ["SL34", "SL-34", "スライ34", "スライ３４"],
  "ruiru-11": ["Ruiru 11", "Ruiru11", "ルイリ11", "ルイ11"],
  batian: ["Batian", "バティアン"],
  pacamara: ["パカマラ", "Pacamara"],
  pacas: ["パカス", "Pacas"],
  maragogipe: ["マラゴジペ", "マラゴジッペ", "Maragogipe", "Maragogype"],
  maracaturra: ["マラカトゥーラ", "Maracaturra"],
  castillo: ["カスティージョ", "Castillo"],
  tabi: ["タビ", "Tabi"],
  geisha: ["ゲイシャ", "ゲシャ", "Geisha", "Gesha"],
  sidra: ["シドラ", "Sidra", "Sydra"],
  "pink-bourbon": ["ピンクブルボン", "Pink Bourbon", "Rosado"],
  chiroso: ["チロソ", "Chiroso"],
  "ethiopian-heirloom": ["ヘイローム", "Heirloom", "在来種", "エチオピア在来"],
  "blue-mountain": ["ブルーマウンテン", "Blue Mountain", "ブルー・マウンテン"],
  s795: ["S795", "Selection 795"],
  "java-typica": ["ジャワ種", "Java Typica"],
  pache: ["パチェ", "Pache"],
  "villa-sarchi": ["ヴィラ・サルチ", "Villa Sarchi"],
  lempira: ["レンピラ", "Lempira", "レモン"],
  "ihcafe-90": ["IHCAFE 90", "IHCAFE90"],
  parainema: ["パライネマ", "Parainema"],
  conilon: ["コンイロン", "Conilon"],
  arabica: ["アラビカ", "Arabica"],
  robusta: ["ロブスタ", "Robusta", "コンイロン"],
};

function extractKeywordsFromName(nameJa: string): string[] {
  const results: string[] = [nameJa];
  const paren = nameJa.match(/[（(]([^）)]+)[）)]/);
  if (paren) results.push(paren[1].trim());
  const beforeParen = nameJa.split(/[（(]/)[0]?.trim();
  if (beforeParen && beforeParen !== nameJa) results.push(beforeParen);
  return results.filter(Boolean);
}

function buildKeywordMap(): Record<string, string[]> {
  const map: Record<string, string[]> = { ...MANUAL_VARIETY_KEYWORDS };
  for (const guide of VARIETY_GUIDES) {
    if (map[guide.slug]) continue;
    const set = new Set<string>();
    for (const kw of extractKeywordsFromName(guide.name_ja)) set.add(kw);
    for (const alias of guide.aliases ?? []) set.add(alias);
    if (set.size > 0) map[guide.slug] = [...set].sort((a, b) => b.length - a.length);
  }
  return map;
}

const VARIETY_KEYWORDS = buildKeywordMap();

function beanSearchText(bean: BeanProduct): string {
  return [
    bean.display_name,
    bean.name,
    bean.description,
    bean.episode,
    bean.taste_notes,
    bean.processing,
  ]
    .filter(Boolean)
    .join("\n");
}

/** 短いキーワードの誤マッチ防止（Typica → 含まない等） */
const KEYWORD_BLOCKLIST: Record<string, RegExp[]> = {
  typica: [/スペシャルティ/i],
};

export function beanMatchesVarietySlug(bean: BeanProduct, slug: string): boolean {
  const keywords = VARIETY_KEYWORDS[slug];
  if (!keywords || keywords.length === 0) return false;

  const text = beanSearchText(bean);
  const blocklist = KEYWORD_BLOCKLIST[slug] ?? [];

  for (const keyword of keywords) {
    if (keyword.length < 2) continue;
    if (!text.includes(keyword)) continue;
    if (blocklist.some((re) => re.test(text) && !text.includes(keyword))) continue;
    return true;
  }
  return false;
}

export function getBeansForVarietySlug(slug: string): BeanProduct[] {
  return getAvailableBeans()
    .filter((bean) => beanMatchesVarietySlug(bean, slug))
    .sort((a, b) => {
      const chain = a.chain_id.localeCompare(b.chain_id);
      if (chain !== 0) return chain;
      return a.display_name.localeCompare(b.display_name, "ja");
    });
}

export function beansByVarietyHref(slug: string): string {
  return `/beans?variety=${encodeURIComponent(slug)}`;
}

export { beanCatalogHref } from "./originBeans";
