"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { OriginMapMarker } from "@/lib/originMap";

const OriginWorldMap = dynamic(
  () => import("@/components/OriginWorldMap").then((m) => m.OriginWorldMap),
  {
    loading: () => (
      <section className="origin-map-section section-card origin-map-loading" aria-busy="true">
        <p className="section-title">主な生産国マップ</p>
        <p className="origin-map-lead">地図を読み込んでいます…</p>
      </section>
    ),
  },
);

interface VarietyOriginMapProps {
  varietySlug: string;
  varietyName: string;
  markers: OriginMapMarker[];
}

export function VarietyOriginMap({ varietySlug, varietyName, markers }: VarietyOriginMapProps) {
  if (markers.length === 0) {
    return (
      <section className="section-card">
        <p className="section-title">主な生産国</p>
        <p className="method-description">
          この品種の代表的な生産国データは準備中です。
          <Link href="/learn/origins" className="learn-nav-link">
            産地ガイドを見る →
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="variety-origin-section">
      <OriginWorldMap markers={markers} />
      <section className="section-card variety-origin-list">
        <p className="section-title">{varietyName}の主な生産国</p>
        <p className="method-description variety-origin-list-lead">
          マーカーをクリックすると各産地の詳細ページへ移動します（{markers.length}カ国・地域）。
        </p>
        <ul className="variety-origin-links">
          {markers.map((marker) => (
            <li key={marker.slug}>
              <Link href={`/learn/origins/${marker.slug}`}>{marker.name_ja}</Link>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
