import { ORIGIN_GUIDES } from "./originGuidesData";
import { ORIGIN_MAP_POSITIONS, type OriginMapMarker } from "./originMap";
import { getVarietyGuide, resolveVarietySlug } from "./learn";

/** 地域テキスト → 産地ガイド slug */
const REGION_TEXT_TO_SLUGS: [RegExp, string[]][] = [
  [/エチオピア/, ["ethiopia"]],
  [/也門|イエメン|モカ/, ["yemen"]],
  [/ケニア/, ["kenya"]],
  [/タンザニア|キリマンジャロ/, ["tanzania"]],
  [/ルワンダ/, ["rwanda"]],
  [/ブルンジ/, ["burundi"]],
  [/ウガンダ/, ["uganda"]],
  [/ザンビア/, ["zambia"]],
  [/ブラジル/, ["brazil"]],
  [/コロンビア/, ["colombia"]],
  [/グアテマラ|グァテマラ/, ["guatemala"]],
  [/コスタリカ/, ["costa-rica"]],
  [/パナマ/, ["panama"]],
  [/ホンジュラス/, ["honduras"]],
  [/ペルー/, ["peru"]],
  [/メキシコ/, ["mexico"]],
  [/エルサルバドル/, ["el-salvador"]],
  [/ジャマイカ|ブルーマウンテン/, ["jamaica"]],
  [/ニカラグア/, ["nicaragua"]],
  [/ボリビア/, ["bolivia"]],
  [/インドネシア|ジャワ|スマトラ|マンデリン/, ["indonesia"]],
  [/ベトナム/, ["vietnam"]],
  [/ハワイ|コナ|アメリカ/, ["usa"]],
  [/日本/, ["japan"]],
  [/エクアドル/, ["colombia", "peru"]],
  [/Central America|中南米/, ["guatemala", "costa-rica", "honduras", "nicaragua", "el-salvador"]],
  [/東アフリカ/, ["kenya", "ethiopia", "rwanda", "burundi", "tanzania", "uganda"]],
  [/アフリカ/, ["ethiopia", "kenya", "rwanda", "burundi"]],
  [/アジア/, ["indonesia", "vietnam", "yemen", "japan"]],
];

const SLUG_OVERRIDES: Record<string, string[]> = {
  arabica: ORIGIN_GUIDES.filter((o) => !o.species.includes("ロブスタ")).map((o) => o.slug),
  robusta: ["brazil", "vietnam", "indonesia"],
  "java-typica": ["indonesia"],
  s795: ["indonesia"],
  "yemen-heirloom": ["yemen"],
  "mexico-heirloom": ["mexico"],
  "bolivia-heirloom": ["bolivia"],
  conilon: ["brazil"],
  "tr4-tr9": ["vietnam"],
  "catimor-group": ["colombia", "honduras", "costa-rica", "vietnam"],
};

function slugsFromRegionText(text: string): string[] {
  const found: string[] = [];
  for (const [pattern, slugs] of REGION_TEXT_TO_SLUGS) {
    if (pattern.test(text)) found.push(...slugs);
  }
  return found;
}

/** 品種 slug に対応する産地ガイド slug 一覧 */
export function getOriginSlugsForVariety(varietySlug: string): string[] {
  if (SLUG_OVERRIDES[varietySlug]) {
    return [...new Set(SLUG_OVERRIDES[varietySlug])];
  }

  const fromGuides = ORIGIN_GUIDES.filter((origin) =>
    origin.varieties.some((v) => resolveVarietySlug(v.name) === varietySlug),
  ).map((o) => o.slug);

  const guide = getVarietyGuide(varietySlug);
  const fromRegions = (guide?.regions ?? []).flatMap((r) => slugsFromRegionText(r));

  return [...new Set([...fromGuides, ...fromRegions])].filter(Boolean);
}

export function getOriginMarkersForVariety(varietySlug: string): OriginMapMarker[] {
  const slugs = getOriginSlugsForVariety(varietySlug);
  return slugs.flatMap((slug) => {
    const pos = ORIGIN_MAP_POSITIONS.find((p) => p.slug === slug);
    const guide = ORIGIN_GUIDES.find((g) => g.slug === slug);
    if (!pos || !guide) return [];
    return [
      {
        slug,
        name_ja: guide.name_ja,
        summary: guide.summary,
        lat: pos.lat,
        lon: pos.lon,
        region: pos.region,
      },
    ];
  });
}

export function getOriginNamesForVariety(varietySlug: string): string[] {
  return getOriginSlugsForVariety(varietySlug)
    .map((slug) => ORIGIN_GUIDES.find((g) => g.slug === slug)?.name_ja)
    .filter((name): name is string => Boolean(name));
}
