import type { EquipmentId } from "@driplab/recommender";

interface MethodIllustrationProps {
  method: EquipmentId;
  variant?: "card" | "hero" | "step";
  stepIndex?: number;
  alt?: string;
  className?: string;
}

const METHOD_HERO_IMAGES: Record<EquipmentId, string> = {
  drip: "/methods/method-drip.png",
  french_press: "/methods/method-french-press.png",
  espresso: "/methods/method-espresso.png",
  siphon: "/methods/method-siphon.png",
};

const METHOD_STEP_IMAGES: Record<EquipmentId, string[]> = {
  drip: [
    "/methods/drip-step-1-setup.png",
    "/methods/drip-step-2-bloom.png",
    "/methods/drip-step-3-pour.png",
    "/methods/drip-step-4-done.png",
  ],
  french_press: [
    "/methods/french-press-step-1.png",
    "/methods/french-press-step-2.png",
    "/methods/french-press-step-3.png",
    "/methods/french-press-step-4.png",
  ],
  espresso: [
    "/methods/espresso-step-1.png",
    "/methods/espresso-step-2.png",
    "/methods/espresso-step-3.png",
    "/methods/espresso-step-4.png",
  ],
  siphon: [
    "/methods/siphon-step-1.png",
    "/methods/siphon-step-2.png",
    "/methods/siphon-step-3.png",
    "/methods/siphon-step-4.png",
  ],
};

const METHOD_ALT: Record<EquipmentId, string> = {
  drip: "ハンドドリップ（V60）でお湯を注いでコーヒーを抽出するイラスト",
  french_press: "フレンチプレスでコーヒーを浸出・プランジーするイラスト",
  espresso: "エスプレッソマシンで濃縮コーヒーを抽出するイラスト",
  siphon: "サイフォンで真空と熱を使ってコーヒーを抽出するイラスト",
};

export function getMethodHeroImage(method: EquipmentId): string {
  return METHOD_HERO_IMAGES[method];
}

export function getMethodStepImage(method: EquipmentId, stepIndex: number): string {
  return METHOD_STEP_IMAGES[method][stepIndex] ?? METHOD_HERO_IMAGES[method];
}

export function MethodIllustration({
  method,
  variant = "card",
  stepIndex,
  alt,
  className,
}: MethodIllustrationProps) {
  const src =
    variant === "step" && stepIndex != null
      ? getMethodStepImage(method, stepIndex)
      : METHOD_HERO_IMAGES[method];

  const defaultAlt =
    variant === "step" && stepIndex != null
      ? `${METHOD_ALT[method]} — ステップ${stepIndex + 1}`
      : METHOD_ALT[method];

  const baseClass = `method-illustration method-illustration--${variant}`;

  return (
    <div className={className ? `${baseClass} ${className}` : baseClass}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt ?? defaultAlt} loading={variant === "hero" ? "eager" : "lazy"} />
    </div>
  );
}
