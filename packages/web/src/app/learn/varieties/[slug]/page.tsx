import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VarietyOriginMap } from "@/components/VarietyOriginMap";
import { VarietySiteBeans } from "@/components/VarietySiteBeans";
import { getVarietyGuide, VARIETY_GUIDES } from "@/lib/learn";
import { getOriginMarkersForVariety } from "@/lib/varietyOrigins";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return VARIETY_GUIDES.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getVarietyGuide(slug);
  if (!guide) return { title: "豆の種類 — DripLab" };
  return {
    title: `${guide.name_ja} — 豆の種類 — DripLab`,
    description: guide.summary,
  };
}

export default async function VarietyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getVarietyGuide(slug);
  if (!guide) notFound();

  const originMarkers = getOriginMarkersForVariety(slug);

  return (
    <main className="app-main">
      <nav className="breadcrumb">
        <Link href="/learn">コーヒーを知る</Link>
        <span aria-hidden> / </span>
        <Link href="/learn/varieties">豆の種類</Link>
        <span aria-hidden> / </span>
        <span>{guide.name_ja}</span>
      </nav>

      <header className="page-header">
        <h1 className="page-title">{guide.name_ja}</h1>
        <p className="page-lead">{guide.summary}</p>
      </header>

      <div className="method-detail">
        <section className="section-card">
          <p className="section-title">概要</p>
          <p className="method-description">{guide.description}</p>
        </section>

        {guide.parent_lineage && (
          <section className="section-card">
            <p className="section-title">系統・交配</p>
            <p className="method-description">{guide.parent_lineage}</p>
            <p className="variety-detail-lineage-link">
              <Link href="/learn/varieties#lineage" className="learn-nav-link">
                系統図で全体像を見る →
              </Link>
            </p>
          </section>
        )}

        <VarietyOriginMap
          varietySlug={slug}
          varietyName={guide.name_ja}
          markers={originMarkers}
        />

        <section className="section-card">
          <p className="section-title">特徴</p>
          <ul className="method-list">
            {guide.characteristics.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="section-card">
          <p className="section-title">風味の傾向</p>
          <ul className="learn-flavor-tags learn-flavor-tags--inline">
            {guide.flavor_notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>

        <VarietySiteBeans slug={slug} varietyName={guide.name_ja} />

        <div className="learn-nav-row">
          <Link href="/learn/varieties#lineage" className="learn-nav-link">
            系統図を見る →
          </Link>
          <Link href="/learn/origins" className="learn-nav-link">
            産地ガイドを見る →
          </Link>
          <Link href="/learn/varieties" className="learn-nav-link">
            品種一覧に戻る →
          </Link>
        </div>
      </div>
    </main>
  );
}
