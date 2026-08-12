"use client";

const TERMS: Record<string, string> = {
  酸味:
    "コーヒーの明るさ・フルーティさ。浅煎りや高海拔産地で出やすい味わいです。",
  コク:
    "口の中での厚み・ボディ。深煎りやフレンチプレスで強調されやすいです。",
  焙煎度:
    "豆を煎る程度。浅煎りほど酸味・香り、深煎りほどコク・ビターが強くなります。",
  比率:
    "コーヒー粉とお湯（またはエスプレッソの液量）の重量比。数字が小さいほど濃い一杯になります。",
  蒸らし:
    "最初に少量のお湯を注ぎ、ガスを抜いて均一に抽出する工程です。",
  カップリング:
    "食事やスイーツとコーヒーの相性を考えて、豆と淹れ方を提案する機能です。",
  マッチ度:
    "入力した気分や食事に対する、提案豆の適合度（0〜100%）です。",
};

interface TermTooltipProps {
  term: string;
  children?: React.ReactNode;
}

export function TermTooltip({ term, children }: TermTooltipProps) {
  const definition = TERMS[term];
  if (!definition) {
    return <>{children ?? term}</>;
  }

  return (
    <span className="term-tooltip-wrap">
      <button
        type="button"
        className="term-tooltip-trigger"
        aria-describedby={`tip-${term}`}
        title={definition}
      >
        {children ?? term}
        <span className="term-tooltip-icon" aria-hidden>
          ?
        </span>
      </button>
      <span className="term-tooltip-popup" role="tooltip" id={`tip-${term}`}>
        {definition}
      </span>
    </span>
  );
}

export function TermLabel({ term }: { term: string }) {
  return <TermTooltip term={term}>{term}</TermTooltip>;
}
