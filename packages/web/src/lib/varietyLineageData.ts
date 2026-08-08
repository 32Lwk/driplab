/** タイムラインの時代区分 */
export const HISTORY_ERAS = [
  { id: "origin", label: "原産〜也門", yearRange: "9〜15世紀" },
  { id: "spread", label: "世界への広がり", yearRange: "17〜19世紀" },
  { id: "breeding", label: "改良・交配の時代", yearRange: "1910〜1980年代" },
  { id: "specialty", label: "スペシャルティ〜現在", yearRange: "2000年代〜" },
] as const;

export type HistoryEraId = (typeof HISTORY_ERAS)[number]["id"];

export interface CoffeeHistoryEvent {
  year: number;
  label: string;
  title: string;
  description: string;
  region?: string;
  varietySlugs?: string[];
  era: HistoryEraId;
}

export const COFFEE_HISTORY: CoffeeHistoryEvent[] = [
  {
    year: 800,
    label: "古来〜",
    title: "ロブスタ（Canephora）の原産地",
    description:
      "コンゴ盆地・ウガンダ周辺が Canephora（ロブスタ）の原産地とされます。低地・高温に強く、現在は世界コーヒー生産の約40%を占めます。",
    region: "中央アフリカ",
    varietySlugs: ["robusta"],
    era: "origin",
  },
  {
    year: 850,
    label: "9世紀頃",
    title: "エチオピアで発見",
    description:
      "アラビカの原産地エチオピアで、コーヒーが飲用されるようになったと伝えられます。在来種（Heirloom）の遺伝的多様性は現在も最大です。",
    region: "エチオピア",
    varietySlugs: ["ethiopian-heirloom"],
    era: "origin",
  },
  {
    year: 1450,
    label: "15世紀",
    title: "也門で栽培が定着",
    description:
      "也門・モカ港からアラビカが交易され、「モカ」として知られる流通の起点に。Typica / Bourbon 系統の祖先がここから広がります。",
    region: "也門",
    varietySlugs: ["yemen-heirloom"],
    era: "origin",
  },
  {
    year: 1696,
    label: "1696年",
    title: "ジャワへ持ち込み",
    description:
      "インド・マラバール経由でジャワ島に Typica が渡り、世界の Typica 流通の起点の一つとなります。",
    region: "インドネシア",
    varietySlugs: ["java-typica", "typica"],
    era: "spread",
  },
  {
    year: 1715,
    label: "1715年頃",
    title: "レユニオン島で Bourbon",
    description:
      "フランス領ブルボン島（現レユニオン）で Bourbon 系統が確立。甘みとコクの代表系統として中南米へ広がります。",
    region: "レユニオン",
    varietySlugs: ["red-bourbon"],
    era: "spread",
  },
  {
    year: 1728,
    label: "1728年",
    title: "ジャマイカ・ブルーマウンテン",
    description:
      "Typica がジャマイカに持ち込まれ、標高と規格管理による高品質ブランドが確立されます。",
    region: "ジャマイカ",
    varietySlugs: ["blue-mountain"],
    era: "spread",
  },
  {
    year: 1870,
    label: "1870年頃",
    title: "Maragogipe 発見",
    description:
      "ブラジルで Typica から巨大型の突然変異「エレファントビーン」が発見。Pacamara などの親に。",
    region: "ブラジル",
    varietySlugs: ["maragogipe"],
    era: "spread",
  },
  {
    year: 1910,
    label: "1910年代",
    title: "Caturra 矮性突然変異",
    description:
      "ブラジルで Bourbon から Caturra が発見。高密度栽培の時代が始まり、中南米の主力品種に。",
    region: "ブラジル",
    varietySlugs: ["caturra"],
    era: "breeding",
  },
  {
    year: 1943,
    label: "1943年",
    title: "Mundo Novo 自然雑種",
    description:
      "Typica × Bourbon の自然雑交から Mundo Novo が発見。ブラジル商業栽培の基盤に。",
    region: "ブラジル",
    varietySlugs: ["mundo-novo"],
    era: "breeding",
  },
  {
    year: 1958,
    label: "1958年",
    title: "Pacamara 開発",
    description:
      "エルサルバドルで Pacas × Maragogipe の人工交配。大粒豆と個性的なカップで Central America を代表。",
    region: "エルサルバドル",
    varietySlugs: ["pacamara"],
    era: "breeding",
  },
  {
    year: 1960,
    label: "1960年代",
    title: "Timor Hybrid と Catimor",
    description:
      "アラビカ×ロブスタ自然雑種 Timor Hybrid から、Caturra 等と交配した Catimor 系が開発。さび病対策の転換点。",
    region: "ティモール",
    varietySlugs: ["catimor-group", "castillo"],
    era: "breeding",
  },
  {
    year: 1935,
    label: "1930年代",
    title: "ケニア SL28 / SL34",
    description:
      "Scott Labs が選抜。ブラックカラントのような複雑な酸味で、ケニアコーヒーの代名詞に。",
    region: "ケニア",
    varietySlugs: ["sl28", "sl34"],
    era: "breeding",
  },
  {
    year: 2004,
    label: "2004年",
    title: "パナマ・ゲイシャブーム",
    description:
      "パナマ・ボケテの Geisha が競売で記録的高値。エチオピア在来種の潜在能力が世界に再認識されます。",
    region: "パナマ",
    varietySlugs: ["geisha"],
    era: "specialty",
  },
  {
    year: 2012,
    label: "2012年",
    title: "アララ（Arara）登録",
    description:
      "ブラジル Procafé が Obatã×Catuai 由来の Arara をリリース。耐性と杯質の両立品種として注目。",
    region: "ブラジル",
    varietySlugs: ["arara"],
    era: "specialty",
  },
  {
    year: 2023,
    label: "2023年",
    title: "Pink Bourbon の遺伝解明",
    description:
      "「Bourbon 交配」と信じられていた Pink Bourbon が、遺伝解析で Ethiopian landrace と判明。品種名と系統の再評価が進む。",
    region: "コロンビア",
    varietySlugs: ["pink-bourbon", "sidra", "chiroso"],
    era: "specialty",
  },
];

/** 系統図の種（アラビカ / ロブスタ） */
export const LINEAGE_SPECIES = [
  {
    id: "arabica",
    label: "アラビカ種",
    rootSlug: "_root",
    rootNote: "エチオピア原産。スペシャルティの中心",
  },
  {
    id: "robusta",
    label: "ロブスタ種",
    rootSlug: "_root_robusta",
    rootNote: "コンゴ盆地原産（Canephora）。低地・病害に強い",
  },
] as const;

export type LineageSpeciesId = (typeof LINEAGE_SPECIES)[number]["id"];

/** 系統図の枝（色分け） */
export const LINEAGE_BRANCHES = [
  {
    id: "typica",
    species: "arabica" as const,
    label: "Typica 系譜",
    color: "#5c6bc0",
    bg: "#e8eaf6",
    lead: "也門 → インド → ジャワ → 世界各地。繊細で低収量な「古典」系統。",
  },
  {
    id: "bourbon",
    species: "arabica" as const,
    label: "Bourbon 系譜",
    color: "#8d6e63",
    bg: "#efebe9",
    lead: "レユニオン島発祥。甘みとコク。矮性突然変異（Caturra 等）の源流。",
  },
  {
    id: "ethiopian",
    species: "arabica" as const,
    label: "エチオピア在来種",
    color: "#7b1fa2",
    bg: "#f3e5f5",
    lead: "Typica/Bourbon とは別系統。Geisha・Sidra・Pink Bourbon などスペシャルティの源泉。",
  },
  {
    id: "timor",
    species: "arabica" as const,
    label: "Timor 耐性系",
    color: "#2e7d32",
    bg: "#e8f5e9",
    lead: "アラビカ×ロブスタ自然雑種から。Catimor / Sarchimor 系の病害耐性品種群。",
  },
  {
    id: "robusta",
    species: "robusta" as const,
    label: "ロブスタ系譜",
    color: "#455a64",
    bg: "#eceff1",
    lead: "Canephora の主要栽培型。コンイロン（ブラジル）・Nganda（アフリカ）・TR系（ベトナム）など。",
  },
] as const;

export type LineageBranchId = (typeof LINEAGE_BRANCHES)[number]["id"];

export interface LineageDiagramNode {
  slug: string;
  label: string;
  year?: string;
  branch: LineageBranchId | "root";
  species: LineageSpeciesId;
  /** 親 slug（複数可＝交配） */
  parents?: string[];
  note?: string;
  /** 品種詳細ページへのリンク（false のときテキストのみ） */
  href?: boolean;
}

/** 系統図ノード（親子関係は parents で表現） */
export const LINEAGE_NODES: LineageDiagramNode[] = [
  {
    slug: "_root",
    label: "アラビカ（エチオピア原産）",
    year: "原産地",
    branch: "root",
    species: "arabica",
    note: "すべてのアラビカ品種の起源",
  },
  {
    slug: "typica",
    label: "Typica",
    year: "1700年代〜",
    branch: "typica",
    species: "arabica",
    parents: ["_root"],
    note: "也門 → インド → ジャワ経由",
  },
  {
    slug: "red-bourbon",
    label: "Red Bourbon",
    year: "1715年頃〜",
    branch: "bourbon",
    species: "arabica",
    parents: ["_root"],
    note: "レユニオン島（旧ブルボン島）",
  },
  {
    slug: "ethiopian-heirloom",
    label: "エチオピア在来種",
    year: "古来〜",
    branch: "ethiopian",
    species: "arabica",
    parents: ["_root"],
    note: "130以上の土地系統。固定品種ではない",
  },
  {
    slug: "java-typica",
    label: "ジャワ種",
    year: "1696年〜",
    branch: "typica",
    species: "arabica",
    parents: ["typica"],
  },
  {
    slug: "blue-mountain",
    label: "ブルーマウンテン",
    year: "1728年〜",
    branch: "typica",
    species: "arabica",
    parents: ["typica"],
  },
  {
    slug: "maragogipe",
    label: "Maragogipe",
    year: "1870年頃",
    branch: "typica",
    species: "arabica",
    parents: ["typica"],
    note: "巨大型突然変異",
  },
  {
    slug: "pache",
    label: "Pache",
    year: "1950年代",
    branch: "typica",
    species: "arabica",
    parents: ["typica"],
    note: "Typica 矮性",
  },
  {
    slug: "mundo-novo",
    label: "Mundo Novo",
    year: "1943年",
    branch: "bourbon",
    species: "arabica",
    parents: ["typica", "red-bourbon"],
    note: "Typica × Bourbon 自然雑種",
  },
  {
    slug: "caturra",
    label: "Caturra",
    year: "1910年代",
    branch: "bourbon",
    species: "arabica",
    parents: ["red-bourbon"],
    note: "Bourbon 矮性突然変異",
  },
  {
    slug: "pacas",
    label: "Pacas",
    year: "1949年",
    branch: "bourbon",
    species: "arabica",
    parents: ["red-bourbon"],
    note: "Bourbon 矮性（エルサルバドル）",
  },
  {
    slug: "villa-sarchi",
    label: "Villa Sarchi",
    year: "1950年代",
    branch: "bourbon",
    species: "arabica",
    parents: ["red-bourbon"],
    note: "Sarchimor の親",
  },
  {
    slug: "catuai",
    label: "Catuaí",
    year: "1972年",
    branch: "bourbon",
    species: "arabica",
    parents: ["caturra", "mundo-novo"],
    note: "Caturra × Mundo Novo",
  },
  {
    slug: "pacamara",
    label: "Pacamara",
    year: "1958年",
    branch: "bourbon",
    species: "arabica",
    parents: ["pacas", "maragogipe"],
    note: "Pacas × Maragogipe",
  },
  {
    slug: "maracaturra",
    label: "Maracaturra",
    year: "1976年〜",
    branch: "bourbon",
    species: "arabica",
    parents: ["caturra", "maragogipe"],
    note: "Caturra × Maragogipe",
  },
  {
    slug: "catimor-group",
    label: "Catimor 系",
    year: "1960年代〜",
    branch: "timor",
    species: "arabica",
    parents: ["caturra"],
    note: "Timor Hybrid × Caturra 系",
  },
  {
    slug: "castillo",
    label: "Castillo",
    year: "2005年",
    branch: "timor",
    species: "arabica",
    parents: ["catimor-group"],
  },
  {
    slug: "lempira",
    label: "Lempira",
    year: "1998年",
    branch: "timor",
    species: "arabica",
    parents: ["catimor-group"],
  },
  {
    slug: "parainema",
    label: "Parainema",
    year: "2004年",
    branch: "timor",
    species: "arabica",
    parents: ["villa-sarchi"],
    note: "Villa Sarchi × Timor（Sarchimor）",
  },
  {
    slug: "arara",
    label: "Arara",
    year: "2012年",
    branch: "timor",
    species: "arabica",
    parents: ["catuai"],
    note: "Obatã × Catuai 自然雑交",
  },
  {
    slug: "sl28",
    label: "SL28",
    year: "1930年代",
    branch: "bourbon",
    species: "arabica",
    parents: ["red-bourbon"],
    note: "ケニア Scott Labs 選抜",
  },
  {
    slug: "sl34",
    label: "SL34",
    year: "1930年代",
    branch: "bourbon",
    species: "arabica",
    parents: ["red-bourbon"],
    note: "French Mission 選抜",
  },
  {
    slug: "geisha",
    label: "Geisha",
    year: "古来〜",
    branch: "ethiopian",
    species: "arabica",
    parents: ["ethiopian-heirloom"],
    note: "2004年パナマで世界的評価",
  },
  {
    slug: "sidra",
    label: "Sidra",
    year: "1990年代〜",
    branch: "ethiopian",
    species: "arabica",
    parents: ["ethiopian-heirloom"],
  },
  {
    slug: "pink-bourbon",
    label: "Pink Bourbon",
    year: "近年",
    branch: "ethiopian",
    species: "arabica",
    parents: ["ethiopian-heirloom"],
    note: "名称は Bourbon だが遺伝的には在来種",
  },
  {
    slug: "chiroso",
    label: "Chiroso",
    year: "近年",
    branch: "ethiopian",
    species: "arabica",
    parents: ["ethiopian-heirloom"],
  },
  {
    slug: "wush-wush",
    label: "Wush Wush",
    year: "古来〜",
    branch: "ethiopian",
    species: "arabica",
    parents: ["ethiopian-heirloom"],
  },
  {
    slug: "_root_robusta",
    label: "ロブスタ（Canephora）",
    year: "原産地",
    branch: "root",
    species: "robusta",
    note: "コンゴ盆地原産。低地・高温に強い",
    href: false,
  },
  {
    slug: "conilon",
    label: "コンイロン（Conilon）",
    year: "1900年代〜",
    branch: "robusta",
    species: "robusta",
    parents: ["_root_robusta"],
    note: "ブラジル型ロブスタ",
  },
  {
    slug: "nganda",
    label: "Nganda",
    year: "古来〜",
    branch: "robusta",
    species: "robusta",
    parents: ["_root_robusta"],
    note: "ウガンダ型。アフリカロブスタの代表",
    href: false,
  },
  {
    slug: "tr4-tr9",
    label: "TR4・TR9 など",
    year: "1990年代〜",
    branch: "robusta",
    species: "robusta",
    parents: ["_root_robusta"],
    note: "ベトナム開発の主力品種群",
  },
];

/** 枝ごとに表示順（上→下＝古→新） */
export const LINEAGE_BRANCH_ORDER: Record<LineageBranchId, string[]> = {
  typica: ["typica", "java-typica", "blue-mountain", "maragogipe", "pache"],
  bourbon: [
    "red-bourbon",
    "caturra",
    "pacas",
    "villa-sarchi",
    "mundo-novo",
    "catuai",
    "sl28",
    "sl34",
    "pacamara",
    "maracaturra",
  ],
  ethiopian: [
    "ethiopian-heirloom",
    "geisha",
    "sidra",
    "pink-bourbon",
    "chiroso",
    "wush-wush",
  ],
  timor: ["catimor-group", "castillo", "lempira", "parainema", "arara"],
  robusta: ["conilon", "nganda", "tr4-tr9"],
};
