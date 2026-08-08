function normalizeUrl(url: string): string {
  return url.trim().replace(/\/$/, "");
}

/** episode_source が buy_url と同一先のとき、出典リンクは省略する */
export function showEpisodeSourceLink(bean: {
  episode_source?: string;
  buy_url: string;
}): boolean {
  const source = bean.episode_source?.trim();
  if (!source) return false;
  return normalizeUrl(source) !== normalizeUrl(bean.buy_url);
}
