/**
 * 産地ガイド slug → ISO 3166-1 alpha-2。
 * 国旗は `/public/learn/flags/{slug}.png` に配置（外務省 cn_ GIF は国名バナーで国旗ではない）。
 */
export const ORIGIN_FLAG_ISO: Record<string, string> = {
  ethiopia: "et",
  kenya: "ke",
  tanzania: "tz",
  rwanda: "rw",
  uganda: "ug",
  burundi: "bi",
  zambia: "zm",
  brazil: "br",
  colombia: "co",
  guatemala: "gt",
  "costa-rica": "cr",
  panama: "pa",
  honduras: "hn",
  peru: "pe",
  mexico: "mx",
  "el-salvador": "sv",
  jamaica: "jm",
  nicaragua: "ni",
  bolivia: "bo",
  indonesia: "id",
  vietnam: "vn",
  yemen: "ye",
  usa: "us",
  japan: "jp",
  "papua-new-guinea": "pg",
};

export function getOriginFlagUrl(slug: string): string | undefined {
  if (!(slug in ORIGIN_FLAG_ISO)) return undefined;
  return `/learn/flags/${slug}.png`;
}

/** @deprecated use getOriginFlagUrl */
export function getMofaFlagUrl(slug: string): string | undefined {
  return getOriginFlagUrl(slug);
}
