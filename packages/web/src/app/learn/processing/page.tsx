import type { Metadata } from "next";
import Link from "next/link";
import { PROCESSING_GUIDES } from "@/lib/learn";
import { ProcessingIllustration, type ProcessingSlug } from "@/components/ProcessingIllustration";

export const metadata: Metadata = {
  title: "精製方法 — DripLab",
  description:
    "ウォッシュド（水洗）、ナチュラル（自然乾燥）、ハニー（蜜処理）など、コーヒー生豆の精製方法を解説します。",
};

const FLAVOR_SPECTRUM = [
  { label: "クリーン", position: 0, methods: ["washed"] },
  { label: "バランス", position: 50, methods: ["honey", "semi-washed"] },
  { label: "果実感・発酵", position: 100, methods: ["natural", "anaerobic"] },
] as const;

export default function ProcessingPage() {
  return (
    <main className="app-main">
      <nav className="breadcrumb">
        <Link href="/learn">コーヒーを知る</Link>
        <span aria-hidden> / </span>
        <span>精製方法</span>
      </nav>

      <header className="page-header">
        <h1 className="page-title">精製方法</h1>
        <p className="page-lead">
          収穫したコーヒーチェリー（果実）から生豆を取り出し、乾燥させる工程を「精製（Processing）」と呼びます。
          同じ産地の豆でも、精製方法によって味わいは大きく変わります。
        </p>
      </header>

      <section className="section-card processing-spectrum" aria-label="精製方法と味わいの関係">
        <p className="section-title">味わいのスペクトラム</p>
        <p className="processing-spectrum-lead">
          左ほどクリーンで産地の個性がはっきり、右ほど果実の甘みや発酵感が強調されます。
        </p>
        <div className="processing-spectrum-bar" role="img" aria-label="精製方法の味わいスペクトラム">
          <span className="processing-spectrum-end">クリーン</span>
          <div className="processing-spectrum-track">
            {PROCESSING_GUIDES.map((proc) => {
              const pos =
                proc.slug === "washed"
                  ? 8
                  : proc.slug === "honey"
                    ? 38
                    : proc.slug === "semi-washed"
                      ? 55
                      : proc.slug === "natural"
                        ? 78
                        : 92;
              return (
                <Link
                  key={proc.slug}
                  href={`/learn/processing/${proc.slug}`}
                  className="processing-spectrum-dot"
                  style={{ left: `${pos}%` }}
                  title={proc.name_ja}
                >
                  <span className="processing-spectrum-dot-label">{proc.name_ja.split("（")[0]}</span>
                </Link>
              );
            })}
          </div>
          <span className="processing-spectrum-end">果実感</span>
        </div>
        <ul className="processing-spectrum-legend">
          {FLAVOR_SPECTRUM.map((item) => (
            <li key={item.label}>
              <strong>{item.label}</strong>
              {item.methods
                .map((slug) => PROCESSING_GUIDES.find((p) => p.slug === slug)?.name_ja.split("（")[0])
                .filter(Boolean)
                .join(" · ")}
            </li>
          ))}
        </ul>
      </section>

      <div className="method-grid">
        {PROCESSING_GUIDES.map((proc) => (
          <Link
            key={proc.slug}
            href={`/learn/processing/${proc.slug}`}
            className="method-card"
          >
            <ProcessingIllustration slug={proc.slug as ProcessingSlug} variant="card" />
            <h2 className="method-card-title">{proc.name_ja}</h2>
            <p className="method-card-summary">{proc.summary}</p>
            <ul className="method-card-tags">
              {proc.characteristics.slice(0, 2).map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <ol className="method-card-steps" aria-label={`${proc.name_ja}の工程概要`}>
              {proc.steps.map((step, i) => (
                <li key={step.title}>
                  <span className="method-step-num">{i + 1}</span>
                  {step.title}
                </li>
              ))}
            </ol>
            <span className="method-card-cta">詳しく見る →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
