import type { ChainId } from "./types";

const CHAIN_BOILERPLATE: Partial<Record<ChainId, RegExp>> = {
  maruyama:
    /丸山コーヒーは「美味しさで癒しと幸せを創る」を掲げ[^。]*。/g,
  starbucks:
    /コーヒーが生産地から皆さんのもとへたどり着くまでの[^。]*。/g,
  tullys:
    /タリーズコーヒーはシアトル発のスペシャルティコーヒー文化[^。]*。/g,
  doutor:
    /ドトールコーヒーは1960年代から続くチェーンコーヒーのパイオニア[^。]*。/g,
  kaldi:
    /カルディコーヒーファームは世界各国から豆を直輸入し[^。]*。/g,
  ucc:
    /UCC上島珈琲は1933年の創業以来[^。]*。/g,
  hoshino:
    /星乃珈琲店は直火焙煎にこだわり[^。]*。/g,
  ogawa:
    /小川珈琲は1920年京都で創業[^。]*。/g,
  sarutahiko:
    /猿田彦珈琲は東京・恵比寿発のスペシャルティコーヒー[^。]*。/g,
  bluebottle:
    /ブルーボトルコーヒーは鮮度と品質にこだわり[^。]*。/g,
};

const CSS_BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g;
const CSS_MEDIA_BLOCK =
  /@media[^{]*\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/gi;
const CSS_RULE_BLOCK =
  /(?:[.#][\w-]+(?:[^{]*?)?)\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
const CSS_AT_RULE = /@[\w-]+[^{;]*(?:\{[^{}]*\}|;)/gi;
const CSS_CHARSET = /@charset[^;]+;/gi;

export function stripEmbeddedCss(text: string): string {
  let result = text;
  result = result.replace(CSS_BLOCK_COMMENT, " ");
  result = result.replace(CSS_CHARSET, " ");

  let prev = "";
  while (prev !== result) {
    prev = result;
    result = result.replace(CSS_MEDIA_BLOCK, " ");
    result = result.replace(CSS_RULE_BLOCK, " ");
    result = result.replace(CSS_AT_RULE, " ");
  }

  result = result.replace(/^\s*\}\s*/, "");
  return result.replace(/\s+/g, " ").trim();
}

export function containsCssNoise(text: string): boolean {
  return (
    text.includes(".item_recommend") ||
    text.includes("@media") ||
    text.includes(".recommend_") ||
    text.includes("@charset") ||
    /[.#][\w-]+\s*\{/.test(text)
  );
}

const INLINE_NOISE = [
  /＊まとめ買い対象[^＊]*＊/g,
  /①[^。]*?還元/g,
  /②[^。]*?還元/g,
  /ポイント[０-９\d]+[％%]還元/g,
  /(?:苦味|酸味|コク|香り)[：:\s]*[●○]+/g,
  /▼[^\s。]*(?:ページ|こちら)[^\s。]*/g,
  /・【大容量】[^。]+/g,
  /【大容量】[^。]{0,80}/g,
  /（まとめ買い対象）/g,
  /人気No\.\d+\s*/g,
  /※鮮度と風味を保つために[^。]*。/g,
  /＜容量＞[^。]*。/g,
  /国内自社工場で焙煎したて[^。]*。/g,
  /オンラインショップ限定の大容量[^。]*。/g,
];

function isPromoSentence(sentence: string): boolean {
  const s = sentence.trim();
  if (s.length < 8) return true;
  if (/^①|^②|^・【大容量】/.test(s)) return true;
  if (/^【大容量】/.test(s)) return true;
  if (/▼/.test(s)) return true;
  if (/還元|まとめ買い|ポイントアップ|送料無料|お求めの方は/.test(s)) {
    return true;
  }
  if (/^【[^】]{1,30}】\s*$/.test(s)) return true;
  if (/^丸山コーヒーは「美味しさ/.test(s)) return true;
  return false;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[。！？])\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isFlavorSentence(text: string): boolean {
  const s = text.trim();
  if (s.length > 90) return false;
  if (/(?:のような)?風味[。.]?$/.test(s)) return true;
  if (/^(?:軽やか|爽やか|すっきり|深い|豊か).*(?:味わい|風味)[。.]?$/.test(s)) {
    return !/特徴/.test(s);
  }
  if (/^[^。]{4,40}な味わい[。.]?$/.test(s) && !/特徴|ブレンドです/.test(s)) {
    return true;
  }
  if (s.length < 40 && /(?:深い|味わい深い)?コク[。.]?$/.test(s)) return true;
  if (
    /^(?:[^、。]{2,30}、){1,4}[^、。]{2,30}[。.]?$/.test(s) &&
    /風味|香り|コク|口当たり|ナッツ|チョコ|オレンジ|チェリー|フィグ/.test(s) &&
    !/です|ます|ブレンド|農園|コーヒーで|一杯|進化|創|年代/.test(s)
  ) {
    return true;
  }
  if (
    s.length < 55 &&
    /、/.test(s) &&
    /風味|香り|ナッツ|チョコ|柑橘|ベリー|オレンジ|スパイス|キャラメル|フルーティ|コク|爽やか/.test(
      s,
    )
  ) {
    if (!/ブレンド|焙煎|創|イメージ|年代|進化|特徴|一杯|コーヒーで|スペシャルティ|です|ます|農園/.test(s)) {
      return true;
    }
  }
  return false;
}

export function resolveStoryFields(
  chainId: ChainId | undefined,
  sources: {
    episode?: string;
    body?: string;
    flavorNotes?: string;
  },
): { episode?: string; taste_notes?: string } {
  const bodyClean = cleanStoryText(sources.body, chainId);
  const episodeClean = cleanStoryText(sources.episode, chainId);
  const flavorClean = cleanStoryText(sources.flavorNotes, chainId);

  const narrativeParts: string[] = [];
  const flavorParts: string[] = [];
  if (bodyClean) {
    for (const sentence of splitSentences(bodyClean)) {
      if (isFlavorSentence(sentence)) {
        flavorParts.push(sentence);
      } else {
        narrativeParts.push(sentence);
      }
    }
  }

  let episode = episodeClean;
  let taste_notes =
    flavorClean ?? (flavorParts.length > 0 ? flavorParts.join("") : undefined);

  const narrative = narrativeParts.join("");

  if (episode && isFlavorSentence(episode) && narrative) {
    if (!taste_notes) taste_notes = episode;
    episode = narrative;
  } else if (
    episode &&
    bodyClean &&
    bodyClean.length > episode.length * 1.3 &&
    narrative
  ) {
    if (isFlavorSentence(episode) && !taste_notes) taste_notes = episode;
    episode = narrative;
  } else if (!episode && narrative) {
    episode = narrative;
  } else if (!episode && bodyClean) {
    episode = bodyClean;
  }

  if (episode && episode.length < 45 && bodyClean && bodyClean.length > episode.length) {
    if (isFlavorSentence(episode) && !taste_notes) taste_notes = episode;
    episode = narrative || bodyClean;
  }

  if (taste_notes && episode && storyTextsEqual(taste_notes, episode)) {
    taste_notes = undefined;
  }

  return { episode, taste_notes };
}

export function cleanStoryText(
  text: string | undefined,
  chainId?: ChainId,
): string | undefined {
  if (!text) return undefined;

  let result = stripEmbeddedCss(text.normalize("NFKC"));
  result = result.replace(/\s+/g, " ").trim();

  for (const pattern of INLINE_NOISE) {
    result = result.replace(pattern, " ");
  }

  if (chainId && CHAIN_BOILERPLATE[chainId]) {
    result = result.replace(CHAIN_BOILERPLATE[chainId], " ");
  }

  const sentences = result
    .split(/(?<=[。！？])\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  const kept = sentences.filter((s) => !isPromoSentence(s));
  result = kept.join("").trim();

  if (result.length < 12) return undefined;
  if (result.length > 320) {
    return `${result.slice(0, 317)}…`;
  }
  return result;
}

export function storyTextsEqual(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return a.replace(/\s/g, "") === b.replace(/\s/g, "");
}
