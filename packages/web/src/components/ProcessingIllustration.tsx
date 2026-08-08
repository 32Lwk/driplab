export type ProcessingSlug =
  | "washed"
  | "natural"
  | "honey"
  | "semi-washed"
  | "anaerobic";

interface ProcessingIllustrationProps {
  slug: ProcessingSlug;
  variant?: "card" | "hero" | "step";
  stepIndex?: number;
  alt?: string;
  className?: string;
}

const PROCESSING_HERO_IMAGES: Record<ProcessingSlug, string> = {
  washed: "/processing/washed-hero.png",
  natural: "/processing/natural-hero.png",
  honey: "/processing/honey-hero.png",
  "semi-washed": "/processing/semi-washed-hero.png",
  anaerobic: "/processing/anaerobic-hero.png",
};

const PROCESSING_STEP_IMAGES: Record<ProcessingSlug, string[]> = {
  washed: [
    "/processing/washed-step-1.png",
    "/processing/washed-step-2.png",
    "/processing/washed-step-3.png",
    "/processing/washed-step-4.png",
  ],
  natural: [
    "/processing/natural-step-1.png",
    "/processing/natural-step-2.png",
    "/processing/natural-step-3.png",
    "/processing/natural-step-4.png",
  ],
  honey: [
    "/processing/honey-step-1.png",
    "/processing/honey-step-2.png",
    "/processing/honey-step-3.png",
    "/processing/honey-step-4.png",
    "/processing/honey-step-5.png",
  ],
  "semi-washed": [
    "/processing/semi-washed-step-1.png",
    "/processing/semi-washed-step-2.png",
    "/processing/semi-washed-step-3.png",
    "/processing/semi-washed-step-4.png",
    "/processing/semi-washed-step-5.png",
  ],
  anaerobic: [
    "/processing/anaerobic-step-1.png",
    "/processing/anaerobic-step-2.png",
    "/processing/anaerobic-step-3.png",
    "/processing/anaerobic-step-4.png",
    "/processing/anaerobic-step-5.png",
  ],
};

const PROCESSING_ALT: Record<ProcessingSlug, string> = {
  washed: "ウォッシュド（水洗式）精製の工程イラスト",
  natural: "ナチュラル（自然乾燥式）精製の工程イラスト",
  honey: "ハニー（蜜処理）精製の工程イラスト",
  "semi-washed": "セミウォッシュド（半水洗）精製の工程イラスト",
  anaerobic: "アナエロビック（嫌気性発酵）精製の工程イラスト",
};

export function getProcessingHeroImage(slug: ProcessingSlug): string {
  return PROCESSING_HERO_IMAGES[slug];
}

export function getProcessingStepImage(slug: ProcessingSlug, stepIndex: number): string {
  return PROCESSING_STEP_IMAGES[slug][stepIndex] ?? PROCESSING_HERO_IMAGES[slug];
}

export function ProcessingIllustration({
  slug,
  variant = "card",
  stepIndex,
  alt,
  className,
}: ProcessingIllustrationProps) {
  const src =
    variant === "step" && stepIndex != null
      ? getProcessingStepImage(slug, stepIndex)
      : PROCESSING_HERO_IMAGES[slug];

  const defaultAlt =
    variant === "step" && stepIndex != null
      ? `${PROCESSING_ALT[slug]} — ステップ${stepIndex + 1}`
      : PROCESSING_ALT[slug];

  const baseClass = `method-illustration method-illustration--${variant}`;

  return (
    <div className={className ? `${baseClass} ${className}` : baseClass}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt ?? defaultAlt} loading={variant === "hero" ? "eager" : "lazy"} />
    </div>
  );
}
