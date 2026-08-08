import type { Metadata } from "next";
import Link from "next/link";
import { ROAST_GUIDES } from "@/lib/learn";

export const metadata: Metadata = {
  title: "焙煎度 — DripLab",
  description:
    "浅煎りから深煎りまで、焙煎度がコーヒーの味わいに与える影響を解説します。",
};

export default function RoastPage() {
  return (
    <main className="app-main">
      <nav className="breadcrumb">
        <Link href="/learn">コーヒーを知る</Link>
        <span aria-hidden> / </span>
        <span>焙煎度</span>
      </nav>

      <header className="page-header">
        <h1 className="page-title">焙煎度</h1>
        <p className="page-lead">
          生豆を加熱して焙煎する時間と温度によって、浅煎りから深煎りまで4段階に分けられます。
          焙煎度は味わいに大きな影響を与え、DripLab のレシピ提案でも重要な要素です。
        </p>
      </header>

      <div className="learn-roast-scale" aria-label="焙煎度のスケール">
        {ROAST_GUIDES.map((roast, i) => (
          <div key={roast.slug} className="learn-roast-step">
            <span className={`learn-roast-dot learn-roast-dot--${roast.slug}`} />
            {i < ROAST_GUIDES.length - 1 && <span className="learn-roast-line" aria-hidden />}
          </div>
        ))}
      </div>
      <div className="learn-roast-labels">
        {ROAST_GUIDES.map((roast) => (
          <span key={roast.slug} className="learn-roast-label">
            {roast.name_ja.split("（")[0]}
          </span>
        ))}
      </div>

      <div className="learn-item-grid">
        {ROAST_GUIDES.map((roast) => (
          <Link
            key={roast.slug}
            href={`/learn/roast/${roast.slug}`}
            className="learn-item-card"
          >
            <h2 className="learn-item-title">{roast.name_ja}</h2>
            <p className="learn-item-summary">{roast.summary}</p>
            <ul className="learn-flavor-tags">
              {roast.flavor_notes.slice(0, 3).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <span className="method-card-cta">詳しく見る →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
