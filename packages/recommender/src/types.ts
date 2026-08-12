export type ChainId =
  | "starbucks"
  | "maruyama"
  | "doutor"
  | "tullys"
  | "kaldi"
  | "ucc"
  | "hoshino"
  | "ogawa"
  | "sarutahiko"
  | "bluebottle";

export type RoastLevel = "light" | "medium" | "medium_dark" | "dark";

export type CaffeineLevel = "low" | "medium" | "high";

export type EquipmentId =
  | "drip"
  | "french_press"
  | "espresso"
  | "siphon";

export type GrindSize =
  | "extra_fine"
  | "fine"
  | "medium_fine"
  | "medium"
  | "coarse";

export interface BeanProduct {
  id: string;
  chain_id: ChainId;
  name: string;
  /** UI向けに整形した商品名 */
  display_name: string;
  description?: string;
  roast_level: RoastLevel;
  /**
   * Absolute roast index after cross-chain calibration (0=true light … 3=very dark).
   * Used for scoring; roast_level is the snapped category for recipes/UI.
   */
  roast_index?: number;
  roast_label_ja?: string;
  taste_label_ja?: string;
  origin?: string[];
  flavor_tags?: string[];
  acidity: number;
  body: number;
  bitterness: number;
  sweetness: number;
  caffeine: CaffeineLevel;
  price_jpy?: number;
  weight_g?: number;
  buy_url: string;
  image_url?: string;
  image_local?: string;
  image_cdn_url?: string;
  available?: boolean;
  episode?: string;
  episode_source?: string;
  /** 味わい・風味の短い説明 */
  taste_notes?: string;
  /** 精製方法（水洗式、ナチュラル等） */
  processing?: string;
  /** ストレート / ブレンド 等 */
  coffee_type?: string;
  /** 公式ページの追加商品画像 */
  extra_images?: string[];
}

export interface MoodProfile {
  alertness: number;
  acidity_pref: number;
  body_pref: number;
  sweetness_pref: number;
}

export interface IdealCoffeeProfile {
  target_acidity: number;
  target_body: number;
  target_bitterness: number;
  target_sweetness: number;
  target_caffeine: CaffeineLevel;
  /** 0–100 の連続カフェイン目標（覚醒度由来） */
  target_caffeine_num: number;
  preferred_roast: RoastLevel[];
  /** 0=light … 3=dark の連続焙煎目標 */
  target_roast_index: number;
}

export interface BrewRecipe {
  method: EquipmentId;
  method_ja: string;
  grind: GrindSize;
  grind_ja: string;
  coffee_g: number;
  water_ml?: number;
  yield_ml?: number;
  water_temp_c: number;
  time_sec: number;
  bloom_ml?: number;
  bloom_sec?: number;
  steps?: string[];
  notes?: string;
  reference_url?: string;
  /** Short explanation of what this method changes in the cup */
  suitability_note?: string;
}

export interface RecommendReasonParts {
  /** User mood / preference summary */
  mood_summary: string;
  /** Why this bean */
  bean_fit: string;
  /** Why this brew method + parameters */
  brew_fit: string;
}

export interface PairingReasonParts {
  /** Food / pairing context summary */
  food_summary: string;
  /** Why this bean fits the food */
  bean_fit: string;
  /** Why this brew method + parameters for the food */
  brew_fit: string;
}

export type RecommendMode = "mood" | "pairing";

export type ReadjustDirection =
  | "more_acidity"
  | "less_bitterness"
  | "stronger"
  | "lighter";

export interface PairingRequest {
  food_preset_id?: string;
  food_text?: string;
  equipment?: EquipmentId[];
  chains?: ChainId[];
  servings?: number;
}

export interface PairingItem extends Omit<RecommendItem, "reason_parts"> {
  pairing_reason: string;
  food_label: string;
  food_preset_id: string;
  reason_parts?: PairingReasonParts;
}

export interface PairingResponse {
  primary: PairingItem;
  alternatives: PairingItem[];
  other_recipes?: BrewRecipe[];
  food_preset_id: string;
  food_label: string;
  food_source: "preset" | "free_text";
  match_confidence: number;
}

export interface ReadjustRequest {
  mode: RecommendMode;
  direction: ReadjustDirection;
  /** Bean id to keep fixed (recipe-only readjust) */
  fixed_bean_id?: string;
  /** Current mood (mood mode) */
  mood?: MoodProfile;
  /** Current food context (pairing mode) */
  food_preset_id?: string;
  food_text?: string;
  equipment?: EquipmentId[];
  chains?: ChainId[];
  servings?: number;
}

export interface RecommendRequest {
  mood: MoodProfile;
  /** Owned / available equipment. When set, recommendations stay inside this set. */
  equipment?: EquipmentId[];
  /** チェーンを限定する場合のみ指定。未指定なら全チェーン */
  chains?: ChainId[];
  /** Drip servings (1 or 2). Default 2. */
  servings?: number;
}

export interface RecommendItem {
  bean_id: string;
  chain_id: ChainId;
  chain_name_ja: string;
  product_name: string;
  description?: string;
  roast_level: RoastLevel;
  roast_label_ja?: string;
  flavor_tags?: string[];
  price_jpy?: number;
  weight_g?: number;
  buy_url: string;
  image_url?: string;
  /** Retailer image URL when image_url points at CDN. */
  image_fallback_url?: string;
  /** Additional image URLs to try after primary / first fallback. */
  image_fallback_urls?: string[];
  match_score: number;
  bean_score?: number;
  equipment_score?: number;
  recommended_equipment: EquipmentId;
  episode?: string;
  episode_source?: string;
  taste_notes?: string;
  processing?: string;
  recipe: BrewRecipe;
  reason: string;
  reason_parts?: RecommendReasonParts;
}

export interface RecommendResponse {
  primary: RecommendItem;
  alternatives: RecommendItem[];
  other_recipes?: BrewRecipe[];
}

export interface BeansCatalog {
  version?: string;
  count?: number;
  beans: BeanProduct[];
}
