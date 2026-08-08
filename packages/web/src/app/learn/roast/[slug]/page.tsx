import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoastGuide, ROAST_GUIDES } from "@/lib/learn";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ROAST_GUIDES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getRoastGuide(slug);
  if (!guide) return { title: "焙煎度 — DripLab" };
  return {
    title: `${guide.name_ja} — 焙煎度 — DripLab`,
    description: guide.summary,
  };
}

export default async function RoastDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getRoastGuide(slug);
  if (!guide) notFound();

  return (
    <main className="app-main">
      <nav className="breadcrumb">
        <Link href="/learn">コーヒーを知る</Link>
        <span aria-hidden> / </span>
        <Link href="/learn/roast">焙煎度</Link>
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

        <section className="section-card">
          <p className="section-title">こんなときに</p>
          <p className="method-suitable">{guide.suitable_for}</p>
        </section>

        <div className="learn-nav-row">
          {ROAST_GUIDES.filter((r) => r.slug !== guide.slug).map((r) => (
            <Link key={r.slug} href={`/learn/roast/${r.slug}`} className="learn-nav-link">
              {r.name_ja.split("（")[0]} →
            </Link>
          ))}
          <Link href="/" className="learn-nav-link">
            今日の一杯で試す →
          </Link>
        </div>
      </div>
    </main>
  );
}
