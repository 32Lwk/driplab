import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProcessingGuide, PROCESSING_GUIDES } from "@/lib/learn";
import { ProcessingIllustration, type ProcessingSlug } from "@/components/ProcessingIllustration";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return PROCESSING_GUIDES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getProcessingGuide(slug);
  if (!guide) return { title: "精製方法 — DripLab" };
  return {
    title: `${guide.name_ja} — 精製方法 — DripLab`,
    description: guide.summary,
  };
}

export default async function ProcessingDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getProcessingGuide(slug);
  if (!guide) notFound();

  const processingSlug = guide.slug as ProcessingSlug;

  return (
    <main className="app-main">
      <nav className="breadcrumb">
        <Link href="/learn">コーヒーを知る</Link>
        <span aria-hidden> / </span>
        <Link href="/learn/processing">精製方法</Link>
        <span aria-hidden> / </span>
        <span>{guide.name_ja}</span>
      </nav>

      <header className="method-detail-header">
        <div className="method-detail-header-text">
          <h1 className="page-title">{guide.name_ja}</h1>
          <p className="page-lead">{guide.summary}</p>
        </div>
        <ProcessingIllustration slug={processingSlug} variant="hero" />
      </header>

      <div className="method-detail">
        <section className="section-card">
          <p className="section-title">概要</p>
          <p className="method-description">{guide.description}</p>
        </section>

        <section className="section-card">
          <p className="section-title">工程</p>
          <ol className="method-steps-visual">
            {guide.steps.map((step, i) => (
              <li key={step.title} className="method-step-visual">
                <ProcessingIllustration
                  slug={processingSlug}
                  variant="step"
                  stepIndex={i}
                  alt={`${step.title}：${step.description}`}
                  className="method-step-visual-image"
                />
                <div className="method-step-visual-body">
                  <span className="method-step-badge">{i + 1}</span>
                  <div>
                    <p className="method-step-title">{step.title}</p>
                    <p className="method-step-desc">{step.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="processing-detail-grid">
          <section className="section-card">
            <p className="section-title">特徴</p>
            <ul className="method-list">
              {guide.characteristics.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="section-card">
            <p className="section-title">味わいへの影響</p>
            <ul className="method-list">
              {guide.flavor_impact.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="section-card">
          <p className="section-title">こんなときに</p>
          <p className="method-suitable">{guide.suitable_for}</p>
        </section>

        <div className="method-nav-row">
          {PROCESSING_GUIDES.filter((p) => p.slug !== guide.slug).map((p) => (
            <Link key={p.slug} href={`/learn/processing/${p.slug}`} className="method-nav-link">
              <ProcessingIllustration
                slug={p.slug as ProcessingSlug}
                variant="card"
                className="method-nav-thumb"
              />
              <span>{p.name_ja} →</span>
            </Link>
          ))}
          <Link href="/learn/origins" className="learn-nav-link">
            産地ガイドを見る →
          </Link>
        </div>
      </div>
    </main>
  );
}
