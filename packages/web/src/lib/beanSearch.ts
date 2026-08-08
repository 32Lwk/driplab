import { CHAIN_LABELS } from "@driplab/recommender";
import type { BeanProduct } from "@driplab/recommender";

const ROAST_FALLBACK: Record<string, string> = {
  light: "浅煎り",
  medium: "中煎り",
  medium_dark: "中深煎り",
  dark: "深煎り",
};

function beanSearchText(bean: BeanProduct): string {
  const roast =
    bean.roast_label_ja ?? ROAST_FALLBACK[bean.roast_level] ?? bean.roast_level;

  return [
    bean.display_name,
    bean.name,
    bean.description,
    bean.episode,
    bean.taste_notes,
    bean.processing,
    bean.taste_label_ja,
    bean.coffee_type,
    roast,
    CHAIN_LABELS[bean.chain_id],
    ...(bean.origin ?? []),
    ...(bean.flavor_tags ?? []),
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeSearchQuery(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

export function beanMatchesSearchQuery(bean: BeanProduct, query: string): boolean {
  const tokens = normalizeSearchQuery(query);
  if (tokens.length === 0) return true;

  const text = beanSearchText(bean).toLowerCase();
  return tokens.every((token) => text.includes(token));
}

export function filterBeansBySearchQuery(
  beans: BeanProduct[],
  query: string,
): BeanProduct[] {
  const tokens = normalizeSearchQuery(query);
  if (tokens.length === 0) return beans;
  return beans.filter((bean) => beanMatchesSearchQuery(bean, query));
}
