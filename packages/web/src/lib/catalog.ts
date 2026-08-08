import {
  normalizeCatalog,
  isBundleProduct,
  isBulkVariant,
} from "@driplab/recommender";
import type { BeanProduct } from "@driplab/recommender";
import catalogData from "@/data/beans.json";

let cached: BeanProduct[] | null = null;

function canonicalKey(bean: BeanProduct): string {
  return `${bean.chain_id}:${bean.display_name.replace(/\s/g, "").toLowerCase()}`;
}

function beanPreferenceScore(bean: BeanProduct): number {
  let score = 0;
  if (/【大容量】|80g【|【まとめ買い】|まとめ買い/.test(bean.name)) score -= 100;
  if (bean.weight_g != null && bean.weight_g <= 200) score += 10;
  if (bean.episode && bean.episode.length > 30) score += 5;
  return score;
}

function dedupeBeans(beans: BeanProduct[]): BeanProduct[] {
  const byKey = new Map<string, BeanProduct>();

  for (const bean of beans) {
    const key = canonicalKey(bean);
    const existing = byKey.get(key);
    if (
      !existing ||
      beanPreferenceScore(bean) > beanPreferenceScore(existing)
    ) {
      byKey.set(key, bean);
    }
  }

  return [...byKey.values()];
}

export function getBeans(): BeanProduct[] {
  if (!cached) {
    cached = normalizeCatalog(
      (catalogData as { beans: Record<string, unknown>[] }).beans,
    );
  }
  return cached;
}

export function getAvailableBeans(): BeanProduct[] {
  return dedupeBeans(
    getBeans().filter(
      (b) =>
        b.available !== false &&
        !isBundleProduct(b.name) &&
        !isBulkVariant(b.name),
    ),
  );
}
