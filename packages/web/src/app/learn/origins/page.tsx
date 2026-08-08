import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { OriginFlagImage } from "@/components/OriginFlagImage";
import { ORIGIN_GUIDES } from "@/lib/learn";
import { getOriginFlagUrl } from "@/lib/originFlags";
import {
  ORIGIN_MAP_POSITIONS,
  ORIGIN_REGION_COLORS,
  ORIGIN_REGIONS,
  type OriginMapMarker,
} from "@/lib/originMap";

const OriginWorldMap = dynamic(
  () => import("@/components/OriginWorldMap").then((m) => m.OriginWorldMap),
  {
    loading: () => (
      <section className="origin-map-section section-card origin-map-loading" aria-busy="true">
        <p className="section-title">世界のコーヒー産地マップ</p>
        <p className="origin-map-lead">地図を読み込んでいます…</p>
      </section>
    ),
  },
);

export const metadata: Metadata = {
  title: "産地ガイド — DripLab",
  description:
    "エチオピア、ブラジル、コロンビアなど25のコーヒー産地の特徴・風味・品種・精製傾向を解説します。",
};

const MAP_MARKERS: OriginMapMarker[] = ORIGIN_MAP_POSITIONS.flatMap((pos) => {
  const guide = ORIGIN_GUIDES.find((g) => g.slug === pos.slug);
  if (!guide) return [];
  return [
    {
      slug: pos.slug,
      name_ja: guide.name_ja,
      summary: guide.summary,
      lat: pos.lat,
      lon: pos.lon,
      region: pos.region,
    },
  ];
});

export default function OriginsPage() {
  return (
    <main className="app-main">
      <nav className="breadcrumb">
        <Link href="/learn">コーヒーを知る</Link>
        <span aria-hidden> / </span>
        <span>産地ガイド</span>
      </nav>

      <header className="page-header">
        <h1 className="page-title">産地ガイド</h1>
        <p className="page-lead">
          コーヒーの風味は産地（テロワール）によって大きく異なります。
          標高、気候、土壌、精製の伝統が、豆の個性を形作ります。
          地図上のマーカーから、世界の主要産地を探索できます。
        </p>
      </header>

      <OriginWorldMap markers={MAP_MARKERS} />

      {ORIGIN_REGIONS.map((region) => {
        const origins = ORIGIN_GUIDES.filter((o) => o.region === region);
        if (origins.length === 0) return null;
        return (
          <section key={region} className="learn-region-section">
            <div className="learn-region-heading">
              <span
                className="learn-region-dot"
                style={{ background: ORIGIN_REGION_COLORS[region] }}
                aria-hidden
              />
              <h2 className="learn-region-title">{region}</h2>
              <span className="learn-region-count">{origins.length}産地</span>
            </div>
            <div className="learn-item-grid">
              {origins.map((origin) => (
                <Link
                  key={origin.slug}
                  href={`/learn/origins/${origin.slug}`}
                  className="learn-item-card"
                >
                  <div className="learn-item-card-head">
                    <div className="learn-item-card-head-text">
                      <span
                        className="learn-region-badge"
                        style={{
                          color: ORIGIN_REGION_COLORS[region],
                          background: `${ORIGIN_REGION_COLORS[region]}18`,
                        }}
                      >
                        {region}
                      </span>
                      <h3 className="learn-item-title">{origin.name_ja}</h3>
                    </div>
                    {getOriginFlagUrl(origin.slug) ? (
                      <OriginFlagImage
                        slug={origin.slug}
                        nameJa={origin.name_ja}
                        className="learn-item-flag"
                        width={84}
                        height={56}
                      />
                    ) : null}
                  </div>
                  <p className="learn-item-summary">{origin.summary}</p>
                  <ul className="learn-flavor-tags">
                    {origin.flavor_notes.slice(0, 3).map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                  <span className="method-card-cta">詳しく見る →</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
