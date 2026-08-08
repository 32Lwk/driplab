import type { BeanProduct } from "./types";

type BeanImageFields = Pick<
  BeanProduct,
  "image_cdn_url" | "image_url" | "image_local"
>;

function sourceImageToken(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined;
  const filename = imageUrl.split("/").pop()?.split("?")[0]?.split("#")[0];
  return filename || undefined;
}

/** Map repo-relative path to Next.js public URL (`/beans/...`). */
export function localBeanImageUrl(imageLocal?: string): string | undefined {
  const prefix = "data/images/";
  if (!imageLocal?.startsWith(prefix)) return undefined;
  return `/beans/${imageLocal.slice(prefix.length)}`;
}

/** e.g. `bluebottle/c229670-100g.jpg` → `bluebottle/c229670.jpg` */
function localBeanImageAliasUrls(imageLocal?: string): string[] {
  const local = localBeanImageUrl(imageLocal);
  if (!local) return [];
  const match = local.match(/^(\/beans\/[^/]+\/)(.+)-(?:100|200)g\.(jpe?g|png|webp)$/i);
  if (!match) return [];
  const alias = `${match[1]}${match[2]}.${match[3]}`;
  return alias === local ? [] : [alias];
}

function withCdnCacheBuster(cdn: string, source?: string): string {
  const token = sourceImageToken(source);
  if (!token) return cdn;
  const sep = cdn.includes("?") ? "&" : "?";
  return `${cdn}${sep}src=${encodeURIComponent(token)}`;
}

/** Ordered image candidates: local static → retailer → CDN. */
export function beanImageCandidates(bean: BeanImageFields): string[] {
  const local = localBeanImageUrl(bean.image_local);
  const source = bean.image_url?.trim();
  const cdn = bean.image_cdn_url?.trim();
  const cdnWithToken = cdn ? withCdnCacheBuster(cdn, source) : undefined;

  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of [local, ...localBeanImageAliasUrls(bean.image_local), source, cdnWithToken]) {
    if (url && !seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

/** Prefer CDN URL with cache-buster (legacy helper). */
export function resolveBeanImageUrl(bean: BeanImageFields): string | undefined {
  return beanImageCandidates(bean)[0];
}

export interface ResolvedBeanImage {
  src?: string;
  /** Additional URLs to try when primary fails. */
  fallbacks: string[];
  /** @deprecated Use fallbacks[0] when present. */
  fallback?: string;
}

/** Resolve display URL with retailer/local/CDN fallbacks for client recovery. */
export function resolveBeanImageUrls(bean: BeanImageFields): ResolvedBeanImage {
  const candidates = beanImageCandidates(bean);
  const [src, ...fallbacks] = candidates;
  return {
    src,
    fallbacks,
    fallback: fallbacks[0],
  };
}
