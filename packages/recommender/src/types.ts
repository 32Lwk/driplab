export type ChainId =
  | "starbucks"
  | "maruyama"
  | "doutor"
  | "tullys"
  | "kaldi";

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
  description?: string;
  roast_level: RoastLevel;
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
  preferred_roast: RoastLevel[];
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
  notes?: string;
}

export interface RecommendRequest {
  mood: MoodProfile;
  equipment: EquipmentId[];
}

export interface RecommendItem {
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
  match_score: number;
  recipe: BrewRecipe;
  reason: string;
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
