import type { ChainId } from "./types";

const CHAIN_PREFIXES: Partial<Record<ChainId, RegExp[]>> = {
  starbucks: [/^スターバックス\s*/, /^STARBUCKS\s*RESERVE®?\s*/i],
  tullys: [/^タリーズ\s*/],
  maruyama: [/^丸山珈琲の\s*/],
  ucc: [/^UCC\s*/, /^上島珈琲店\s*/],
  hoshino: [/^星乃珈琲[・\s]*/, /^星乃\s*/],
  ogawa: [/^小川珈琲\s*/, /^小川珈琲店\s*/],
  sarutahiko: [/^猿田彦珈琲\s*/, /^【[^】]*】\s*/],
  bluebottle: [/^ブルーボトルコーヒー\s*/, /^BLUE BOTTLE\s*/i],
};

const LEADING_TAGS =
  /^(?:【[^】]{1,40}】|＜[^＞]{1,40}＞|<[^>]{1,40}>|オンラインストア限定[\s　]*)+/;

const TRAILING_TAGS =
  /(?:【[^】]{1,40}】|（[^）]{1,40}）|\([^)]{1,40}\))+$/g;

const GIFT_OR_BUNDLE =
  /ギフトセット|×\d+個(?:セット)?|\d+個(?:セット)?|\d+袋(?:セット)?|2種.*セット|3種.*セット|コーヒーセレクション|詰め合わせ|アソート|お試しセット/i;

const BULK_VARIANT =
  /【大容量】|（まとめ買い対象）|80g【オンラインストア限定】|【まとめ買い】|選べる\s*まとめ買い/;

function collapseSpaces(text: string): string {
  return text.replace(/[\s　]+/g, " ").trim();
}

function stripLeadingTags(name: string): string {
  let result = name;
  for (let i = 0; i < 6; i += 1) {
    const next = result.replace(LEADING_TAGS, "").trim();
    if (next === result) break;
    result = next;
  }
  return result;
}

function stripTrailingTags(name: string): string {
  let result = name;
  for (let i = 0; i < 6; i += 1) {
    const next = result.replace(TRAILING_TAGS, "").trim();
    if (next === result) break;
    result = next;
  }
  return result;
}

function stripCapacity(name: string): string {
  const paren = (inner: string) => `[（(]${inner}[）)]`;

  return name
    .replace(/[\s　]*\d+g×\d+個セット/gi, "")
    .replace(new RegExp(`\\s*コーヒー[\\s　]*${paren("[^）)]+")}[\\s　]*\\d+g`, "gi"), "")
    .replace(new RegExp(`[\\s　]*${paren("豆[^）)]*")}[\\s　]*\\d+g`, "gi"), "")
    .replace(/[\s　]*\/[\s　]*\d+g/gi, "")
    .replace(new RegExp(`[\\s　]*\\d+g[\\s　]*${paren("豆[^）)]*")}`, "gi"), "")
    .replace(/[\s　]*\d+g[\s　]*(?:豆)?(?:\/[\s　]*\d+g)?/gi, "")
    .replace(/[\s　]*\d+g×\d+/gi, "")
    .replace(new RegExp(`[\\s　]*コーヒー[\\s　]*${paren("[^）)]*")}`, "gi"), "")
    .replace(new RegExp(`[\\s　]*${paren("豆[^）)]*")}`, "gi"), "")
    .replace(/[\s　]*[（(]冬季名称：[^）)]+[）)]/g, "")
    .replace(/[\s　]*\([^)]*冬季[^)]*\)/g, "");
}

function stripChainPrefix(name: string, chainId?: ChainId): string {
  if (!chainId) return name;
  let result = name;
  for (const pattern of CHAIN_PREFIXES[chainId] ?? []) {
    result = result.replace(pattern, "");
  }
  return result.trim();
}

function stripRankings(name: string): string {
  return name.replace(/(\d+)位/g, "").replace(/[・･]\s*[・･]+/g, "・");
}

export function isBundleProduct(name: string): boolean {
  return GIFT_OR_BUNDLE.test(name);
}

export function isBulkVariant(name: string): boolean {
  return BULK_VARIANT.test(name);
}

export function formatProductName(name: string, chainId?: ChainId): string {
  let result = name.normalize("NFKC").trim();
  result = stripLeadingTags(result);
  result = stripTrailingTags(result);
  result = stripCapacity(result);
  result = stripChainPrefix(result, chainId);
  result = result.replace(/[®™]/g, "");
  result = stripRankings(result);
  result = result.replace(/[\s　]*2種ギフトセット.*$/i, "");
  result = result.replace(/[\s　]*ギフトセット.*$/i, "");
  result = result.replace(/[\s　]*×\d+個セット.*$/i, "");
  result = result.replace(/[\s　]*\d+個セット.*$/i, "");
  result = collapseSpaces(result);

  if (!result) {
    return collapseSpaces(name.normalize("NFKC"));
  }

  return result;
}
