import type { Metadata } from "next";
import Link from "next/link";
import { LEARN_CATEGORIES } from "@/lib/learn";

export const metadata: Metadata = {
  title: "コーヒーを知る — DripLab",
  description:
    "産地ごとの特徴、豆の種類、精製方法、焙煎度など、コーヒーの基礎知識を解説します。",
};

export default function LearnPage() {
  return (
    <main className="app-main">
      <header className="page-header">
        <h1 className="page-title">コーヒーを知る</h1>
        <p className="page-lead">
          産地・豆の種類・精製方法・焙煎度の違いを理解すると、
          <Link href="/beans">豆一覧</Link>
          や
          <Link href="/">今日の一杯</Link>
          での選び方がより楽しくなります。
        </p>
      </header>

      <div className="learn-grid">
        {LEARN_CATEGORIES.map((cat) => (
          <Link key={cat.id} href={cat.href} className="learn-card">
            <h2 className="learn-card-title">{cat.name_ja}</h2>
            <p className="learn-card-summary">{cat.summary}</p>
            <span className="learn-card-count">{cat.count}項目</span>
            <span className="method-card-cta">詳しく見る →</span>
          </Link>
        ))}
      </div>

      <section className="section-card learn-intro">
        <p className="section-title">読み方のヒント</p>
        <ul className="method-list">
          <li>
            <strong>産地</strong>
            — 同じ精製方法でも、エチオピアとブラジルでは全く異なる味わいになります
          </li>
          <li>
            <strong>精製方法</strong>
            — ウォッシュドはクリーンな酸味、ナチュラルは果実の甘みが強調されます
          </li>
          <li>
            <strong>焙煎度</strong>
            — 浅煎りほど産地の個性が、深煎りほど焙煎の香ばしさが前面に出ます
          </li>
          <li>
            <strong>豆の種類</strong>
            — シングルオリジンは産地の個性、ブレンドはバランスの取れた味わい
          </li>
        </ul>
      </section>
    </main>
  );
}
