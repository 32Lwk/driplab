import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OriginCountryFlag } from "@/components/OriginCountryFlag";
import { OriginSiteBeans } from "@/components/OriginSiteBeans";
import { OriginTasteProfile } from "@/components/OriginTasteProfile";
import { beansByOriginHref } from "@/lib/originBeans";
import { getOriginGuide, ORIGIN_GUIDES, resolveVarietySlug } from "@/lib/learn";
import { getOriginTasteProfile } from "@/lib/originTasteProfiles";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ORIGIN_GUIDES.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getOriginGuide(slug);
  if (!guide) return { title: "産地ガイド — DripLab" };
  return {
    title: `${guide.name_ja} — 産地ガイド — DripLab`,
    description: guide.summary,
  };
}

export default async function OriginDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getOriginGuide(slug);
  if (!guide) notFound();

  const tasteProfile = getOriginTasteProfile(slug);

  return (
    <main className="app-main">
      <nav className="breadcrumb">
        <Link href="/learn">コーヒーを知る</Link>
        <span aria-hidden> / </span>
        <Link href="/learn/origins">産地ガイド</Link>
        <span aria-hidden> / </span>
        <span>{guide.name_ja}</span>
      </nav>

      <header className="page-header origin-page-header">
        <div className="origin-page-header-text">
          <p className="learn-region-badge">{guide.region}</p>
          <h1 className="page-title">{guide.name_ja}</h1>
          <p className="page-lead">{guide.summary}</p>
        </div>
        <OriginCountryFlag slug={slug} nameJa={guide.name_ja} />
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
          <p className="section-title">風味のキーワード</p>
          <ul className="learn-flavor-tags learn-flavor-tags--inline">
            {guide.flavor_notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>

        {tasteProfile && (
          <section className="section-card">
            <p className="section-title">味わいの傾向</p>
            <p className="method-description origin-taste-lead">
              {guide.name_ja}産コーヒーの代表的な味わいバランスです（0–100）。
            </p>
            <OriginTasteProfile profile={tasteProfile} />
          </section>
        )}

        <section className="section-card">
          <p className="section-title">主な産地・地区</p>
          <ul className="method-list">
            {guide.famous_regions.map((region) => (
              <li key={region}>{region}</li>
            ))}
          </ul>
        </section>

        <section className="section-card">
          <p className="section-title">栽培されるコーヒー種</p>
          <p className="method-description">{guide.species}</p>
        </section>

        <section className="section-card">
          <p className="section-title">代表的な品種・系統</p>
          <ul className="origin-variety-list">
            {guide.varieties.map((variety) => {
              const varietySlug = resolveVarietySlug(variety.name);
              return (
                <li key={variety.name} className="origin-variety-item">
                  <p className="origin-variety-name">
                    {varietySlug ? (
                      <Link href={`/learn/varieties/${varietySlug}`} className="origin-variety-link">
                        {variety.name}
                      </Link>
                    ) : (
                      variety.name
                    )}
                  </p>
                  <p className="origin-variety-desc">{variety.description}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="section-card">
          <p className="section-title">生産・栽培環境</p>
          <p className="method-description">{guide.production}</p>
        </section>

        <section className="section-card">
          <p className="section-title">精製の傾向</p>
          <p className="method-description">{guide.processing_tendency}</p>
        </section>

        <section className="section-card">
          <p className="section-title">こんなときに</p>
          <p className="method-suitable">{guide.suitable_for}</p>
        </section>

        <OriginSiteBeans slug={slug} originName={guide.name_ja} />

        <div className="learn-nav-row">
          <Link href="/learn/processing" className="learn-nav-link">
            精製方法を知る →
          </Link>
          <Link href={beansByOriginHref(slug)} className="learn-nav-link">
            この産地の豆を探す →
          </Link>
        </div>
      </div>
    </main>
  );
}
