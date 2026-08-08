import { getOriginFlagUrl } from "@/lib/originFlags";

interface OriginFlagImageProps {
  slug: string;
  nameJa: string;
  className?: string;
  width?: number;
  height?: number;
}

export function OriginFlagImage({
  slug,
  nameJa,
  className,
  width = 160,
  height = 107,
}: OriginFlagImageProps) {
  const flagUrl = getOriginFlagUrl(slug);
  if (!flagUrl) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={flagUrl}
      alt={`${nameJa}の国旗`}
      className={className}
      loading="lazy"
      width={width}
      height={height}
    />
  );
}
