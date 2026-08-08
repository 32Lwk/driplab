"use client";

import { useEffect, useState } from "react";

interface BeanImageProps {
  src?: string;
  /** @deprecated Prefer fallbacks */
  fallback?: string;
  fallbacks?: string[];
  alt: string;
  loading?: "lazy" | "eager";
  className?: string;
}

function allCandidates(
  src?: string,
  fallback?: string,
  fallbacks?: string[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of [src, ...(fallbacks ?? []), fallback]) {
    if (url && !seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

/** Product image with automatic multi-URL fallback when assets are missing. */
export function BeanImage({
  src,
  fallback,
  fallbacks,
  alt,
  loading = "lazy",
  className,
}: BeanImageProps) {
  const candidates = allCandidates(src, fallback, fallbacks);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [src, fallback, fallbacks?.join("|")]);

  const currentSrc = candidates[index];

  if (!currentSrc || index >= candidates.length) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => {
        setIndex((i) => i + 1);
      }}
    />
  );
}
