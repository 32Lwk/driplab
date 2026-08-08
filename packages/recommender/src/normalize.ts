import { formatProductName, isBundleProduct, isBulkVariant } from "./displayName";
import { resolveStoryFields, stripEmbeddedCss } from "./storyText";
import type { BeanProduct, CaffeineLevel, ChainId, RoastLevel } from "./types";

type RawBean = Record<string, unknown>;

const ROAST_KEYWORDS: [RoastLevel, string[]][] = [
  ["light", ["light", "浅煎", "ブロンド", "ライト", "blond"]],
  ["medium", ["medium", "中煎", "ミディアム"]],
  ["medium_dark", ["medium_dark", "中深", "ハイロースト"]],
  ["dark", ["dark", "深煎", "ダーク", "フレンチ", "イタリアン"]],
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9fff]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function inferRoast(raw: RawBean): RoastLevel {
  const existing = raw.roast_level as RoastLevel | undefined;
  if (existing && ROAST_KEYWORDS.some(([level]) => level === existing)) {
    return existing;
  }

  const haystack = [
    raw.roast,
    raw.roast_label_ja,
    raw.roast_level,
    raw.og_description,
    raw.content,
    raw.description,
    raw.episode,
    raw.taste_label_ja,
    raw.taste_balance,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const [level, keywords] of ROAST_KEYWORDS) {
    if (keywords.some((k) => haystack.includes(k.toLowerCase()))) {
      return level;
    }
  }

  return "medium";
}

interface TasteScores {
  acidity: number;
  body: number;
  bitterness: number;
  sweetness: number;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function textFields(raw: RawBean): string {
  return [
    raw.description,
    raw.og_description,
    raw.content,
    raw.episode,
    raw.taste_label_ja,
    raw.taste_balance,
  ]
    .filter(Boolean)
    .join(" ");
}

function extractTasteLabel(raw: RawBean): string | undefined {
  const direct = str(raw.taste_label_ja) ?? str(raw.taste_balance);
  if (direct) return direct;

  for (const field of [
    raw.og_description,
    raw.content,
    raw.episode,
    raw.description,
  ]) {
    if (typeof field !== "string") continue;
    const match = field.match(
      /味わい[\s　]+([^\s　。.\n\r]+(?:[\s　][^\s　。.\n\r]+)?)/,
    );
    if (match) return match[1].trim();
  }

  return undefined;
}

const KALDI_TASTE_PROFILES: Record<string, TasteScores> = {
  爽やかな酸味: { acidity: 72, body: 50, bitterness: 35, sweetness: 50 },
  やわらかな甘み: { acidity: 45, body: 50, bitterness: 40, sweetness: 65 },
  強い香りと苦み: { acidity: 35, body: 70, bitterness: 70, sweetness: 40 },
};

function scoreFromDotRatings(text: string, base: TasteScores): TasteScores {
  const dotCount = (label: string): number => {
    const match = text.match(new RegExp(`${label}[：:\\s]*([●○]+)`));
    if (!match) return 0;
    return match[1].match(/●/g)?.length ?? 0;
  };

  const bitternessDots = dotCount("苦味");
  const acidityDots = dotCount("酸味");
  const bodyDots = dotCount("コク");

  if (bitternessDots + acidityDots + bodyDots === 0) {
    return base;
  }

  return {
    acidity: clampScore(25 + acidityDots * 12),
    body: clampScore(25 + bodyDots * 12),
    bitterness: clampScore(25 + bitternessDots * 12),
    sweetness: /甘|ハチミツ|キャラメル|チョコ/.test(text)
      ? clampScore(base.sweetness + 10)
      : base.sweetness,
  };
}

function scoreFromTasteLabel(label: string, base: TasteScores): TasteScores {
  const scores = { ...base };
  const tokens = label.split(/[\s　・、,/]+/).filter(Boolean);

  for (const token of tokens) {
    if (/すっきり|キレ|爽やか|シトラス|柑橘|酸味|フルーティ|レモン|ベリー/.test(token)) {
      scores.acidity += 15;
      scores.body -= 8;
      scores.bitterness -= 5;
    }
    if (/まろやか|やわらか|甘|ナッツ|キャラメル|チョコ|黒糖/.test(token)) {
      scores.sweetness += 12;
      scores.bitterness -= 8;
    }
    if (/コク|深い|香ばし|ビター|苦|しっかり/.test(token)) {
      scores.body += 12;
      scores.bitterness += 10;
      scores.acidity -= 5;
    }
  }

  return {
    acidity: clampScore(scores.acidity),
    body: clampScore(scores.body),
    bitterness: clampScore(scores.bitterness),
    sweetness: clampScore(scores.sweetness),
  };
}

function scoreFromKeywords(text: string, base: TasteScores): TasteScores {
  const scores = { ...base };

  if (/爽やかな酸味|シトラス|柑橘|レモン|ベリー|フルーティ|花の香り|キレ/.test(text)) {
    scores.acidity += 10;
  }
  if (/甘み|甘さ|キャラメル|チョコ|ナッツ|ハチミツ|黒糖|まろやか|ホワイトチョコ/.test(text)) {
    scores.sweetness += 8;
  }
  if (/苦味|ビター|深いコク|香ばし|ダークチョコ|ヨーロッパタイプ/.test(text)) {
    scores.bitterness += 8;
  }
  if (/コク|しっかり|ボディ|野性味|深み|なめらか/.test(text)) {
    scores.body += 8;
  }
  if (/すっきり|軽やか|クリア|口あたり/.test(text)) {
    scores.body -= 6;
    scores.acidity += 5;
  }

  return {
    acidity: clampScore(scores.acidity),
    body: clampScore(scores.body),
    bitterness: clampScore(scores.bitterness),
    sweetness: clampScore(scores.sweetness),
  };
}

function hasExplicitTaste(raw: RawBean): boolean {
  return (
    typeof raw.acidity === "number" ||
    typeof raw.body === "number" ||
    typeof raw.bitterness === "number" ||
    typeof raw.sweetness === "number"
  );
}

function inferTasteProfile(raw: RawBean, roast: RoastLevel): TasteScores {
  const defaults = ROAST_DEFAULTS[roast];

  if (hasExplicitTaste(raw)) {
    return {
      acidity: num(raw.acidity, defaults.acidity),
      body: num(raw.body, defaults.body),
      bitterness: num(raw.bitterness, defaults.bitterness),
      sweetness: num(raw.sweetness, defaults.sweetness),
    };
  }

  const haystack = textFields(raw);

  if (/●/.test(haystack)) {
    return scoreFromDotRatings(haystack, defaults);
  }

  const tasteBalance = str(raw.taste_balance);
  if (tasteBalance && KALDI_TASTE_PROFILES[tasteBalance]) {
    return KALDI_TASTE_PROFILES[tasteBalance];
  }

  const tasteLabel = extractTasteLabel(raw);
  if (tasteLabel) {
    return scoreFromTasteLabel(tasteLabel, defaults);
  }

  if (haystack.trim()) {
    return scoreFromKeywords(haystack, defaults);
  }

  return defaults;
}

function inferCaffeine(
  raw: RawBean,
  name: string,
  defaults: CaffeineLevel,
): CaffeineLevel {
  const caffeineRaw = str(raw.caffeine);
  if (
    caffeineRaw === "low" ||
    caffeineRaw === "high" ||
    caffeineRaw === "medium"
  ) {
    return caffeineRaw;
  }

  const haystack = `${name} ${textFields(raw)}`;
  if (/デカフェ|カフェインレス|decaf|caffeine.?less/i.test(haystack)) {
    return "low";
  }

  return defaults;
}

const ROAST_DEFAULTS: Record<
  RoastLevel,
  { acidity: number; body: number; bitterness: number; sweetness: number; caffeine: CaffeineLevel }
> = {
  light: { acidity: 65, body: 35, bitterness: 25, sweetness: 60, caffeine: "medium" },
  medium: { acidity: 50, body: 50, bitterness: 45, sweetness: 55, caffeine: "medium" },
  medium_dark: { acidity: 40, body: 65, bitterness: 60, sweetness: 45, caffeine: "medium" },
  dark: { acidity: 30, body: 70, bitterness: 75, sweetness: 35, caffeine: "medium" },
};

function num(val: unknown, fallback: number): number {
  return typeof val === "number" && !Number.isNaN(val) ? val : fallback;
}

function str(val: unknown): string | undefined {
  return typeof val === "string" && val.trim() ? val.trim() : undefined;
}

function strArray(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.filter((v): v is string => typeof v === "string");
  }
  if (typeof val === "string" && val) {
    return [val];
  }
  return [];
}

function cleanDescription(raw: RawBean): string | undefined {
  for (const field of [raw.description, raw.og_description, raw.content]) {
    const text = str(field);
    if (!text) continue;
    const cleaned = stripEmbeddedCss(text.replace(/\s+/g, " ")).trim();
    if (cleaned.length >= 20) {
      return cleaned.slice(0, 320);
    }
  }
  return undefined;
}

function extractOrigins(raw: RawBean): string[] {
  const originRaw = raw.origin ?? raw.origin_countries;
  if (Array.isArray(originRaw)) {
    return originRaw.filter((v): v is string => typeof v === "string");
  }
  const single = str(originRaw);
  return single ? [single] : [];
}

function inferProcessingFromName(name: string): string | undefined {
  if (/スイートウォッシュド|sweet\s*wash/i.test(name)) {
    return "スイートウォッシュド";
  }
  if (/ナチュラル|natural/i.test(name)) {
    return "ナチュラル（自然乾燥）";
  }
  if (/ウォッシュド|washed/i.test(name)) {
    return "ウォッシュド（水洗）";
  }
  if (/ハニー|honey/i.test(name)) {
    return "ハニー";
  }
  if (/半水洗/i.test(name)) {
    return "半水洗式";
  }
  return undefined;
}

function extractProcessing(raw: RawBean, name: string): string | undefined {
  const direct = str(raw.processing) ?? str(raw.bean_processing);
  if (direct) return direct;

  for (const field of [raw.content, raw.description, raw.og_description]) {
    if (typeof field !== "string") continue;
    const match = field.match(/加工方法[：:]\s*([^\n]+)/);
    if (match) return match[1].trim();
  }

  return inferProcessingFromName(name);
}

function extractCoffeeType(raw: RawBean): string | undefined {
  return str(raw.coffee_type) ?? str(raw.product_type);
}

export function normalizeBean(raw: RawBean): BeanProduct | null {
  const chain_id = str(raw.chain_id) as ChainId | undefined;
  const name = str(raw.name);
  const buy_url = str(raw.buy_url);

  if (!chain_id || !name || !buy_url) {
    return null;
  }

  const productId = raw.product_id ?? raw.product_code ?? slugify(name);
  const id = str(raw.id) ?? `${chain_id}-${String(productId)}`;
  const display_name = formatProductName(name, chain_id);

  const roast_level = inferRoast(raw);
  const defaults = ROAST_DEFAULTS[roast_level];
  const taste = inferTasteProfile(raw, roast_level);
  const tasteLabel =
    extractTasteLabel(raw) ??
    str(raw.taste_label_ja) ??
    str(raw.taste_balance as string);

  const description = cleanDescription(raw);

  const origin = extractOrigins(raw);

  const flavor_tags = strArray(raw.flavor_tags);
  if (flavor_tags.length === 0 && description) {
    const keywords = ["柑橘", "チョコ", "ナッツ", "ベリー", " floral", "甘み", "香ばし"];
    for (const k of keywords) {
      if (description.includes(k.trim())) flavor_tags.push(k.trim());
    }
  }

  const caffeine = inferCaffeine(raw, name, defaults.caffeine);
  const processing = extractProcessing(raw, name);
  const coffee_type = extractCoffeeType(raw);
  const { episode, taste_notes: resolvedTaste } = resolveStoryFields(chain_id, {
    episode: str(raw.episode),
    body: description,
    flavorNotes: str(raw.flavor_notes),
  });
  const taste_notes = str(raw.taste_notes) ?? resolvedTaste;

  return {
    id,
    chain_id,
    name,
    display_name,
    description: episode,
    roast_level,
    roast_label_ja: str(raw.roast_label_ja) ?? str(raw.roast as string),
    taste_label_ja: tasteLabel,
    origin: origin.length > 0 ? origin : undefined,
    flavor_tags: flavor_tags.length > 0 ? flavor_tags : undefined,
    acidity: taste.acidity,
    body: taste.body,
    bitterness: taste.bitterness,
    sweetness: taste.sweetness,
    caffeine,
    price_jpy: typeof raw.price_jpy === "number" ? raw.price_jpy : undefined,
    weight_g: typeof raw.weight_g === "number" ? raw.weight_g : undefined,
    buy_url,
    image_url: str(raw.image_url),
    image_local: str(raw.image_local),
    image_cdn_url: str(raw.image_cdn_url),
    available:
      raw.available !== false &&
      !isBundleProduct(name) &&
      !isBulkVariant(name) &&
      !/詰め合わせ|コーヒーセレクション/.test(
        str(raw.taste_label_ja) ?? "",
      ),
    episode,
    episode_source: str(raw.episode_source),
    taste_notes,
    processing,
    coffee_type,
    extra_images:
      strArray(raw.extra_images).length > 0
        ? strArray(raw.extra_images)
        : undefined,
  };
}

export function normalizeCatalog(rawBeans: RawBean[]): BeanProduct[] {
  return rawBeans
    .map(normalizeBean)
    .filter((b): b is BeanProduct => b !== null);
}
