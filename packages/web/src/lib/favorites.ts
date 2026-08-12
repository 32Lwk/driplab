import type {
  BrewRecipe,
  MoodProfile,
  RecommendMode,
} from "@driplab/recommender";

export interface FavoriteEntry {
  id: string;
  savedAt: string;
  mode: RecommendMode;
  mood?: MoodProfile;
  food_label?: string;
  food_preset_id?: string;
  bean_id: string;
  chain_name_ja: string;
  product_name: string;
  buy_url: string;
  image_url?: string;
  recipe: BrewRecipe;
  pairing_reason?: string;
}

const STORAGE_KEY = "driplab_favorites_v1";
const MAX_FAVORITES = 50;

export function loadFavorites(): FavoriteEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoriteEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFavorites(entries: FavoriteEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_FAVORITES)));
}

export function addFavorite(entry: Omit<FavoriteEntry, "id" | "savedAt">): FavoriteEntry {
  const favorites = loadFavorites();
  const newEntry: FavoriteEntry = {
    ...entry,
    id: `${entry.bean_id}-${Date.now()}`,
    savedAt: new Date().toISOString(),
  };

  const filtered = favorites.filter(
    (f) => !(f.bean_id === entry.bean_id && f.recipe.method === entry.recipe.method),
  );
  saveFavorites([newEntry, ...filtered]);
  return newEntry;
}

export function removeFavorite(id: string): void {
  saveFavorites(loadFavorites().filter((f) => f.id !== id));
}

export function isFavorite(beanId: string, method: string): boolean {
  return loadFavorites().some(
    (f) => f.bean_id === beanId && f.recipe.method === method,
  );
}
