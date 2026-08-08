import { OriginFlagImage } from "@/components/OriginFlagImage";
import { getOriginFlagUrl } from "@/lib/originFlags";

interface OriginCountryFlagProps {
  slug: string;
  nameJa: string;
}

export function OriginCountryFlag({ slug, nameJa }: OriginCountryFlagProps) {
  if (!getOriginFlagUrl(slug)) return null;

  return (
    <figure className="origin-country-flag" aria-label={`${nameJa}の国旗`}>
      <OriginFlagImage
        slug={slug}
        nameJa={nameJa}
        className="origin-country-flag-image"
      />
    </figure>
  );
}
