import type { Metadata } from "next";
import Link from "next/link";
import { METHOD_GUIDES } from "@/lib/methods";
import { MethodIllustration } from "@/components/MethodIllustration";

export const metadata: Metadata = {
  title: "淹れ方 — DripLab",
  description:
    "ハンドドリップ、フレンチプレス、エスプレッソ、サイフォンの4つの抽出方法を解説します。",
};

export default function MethodsPage() {
  return (
    <main className="app-main">
      <header className="page-header">
        <h1 className="page-title">淹れ方ガイド</h1>
        <p className="page-lead">
          DripLab が対応する4つの抽出方法です。それぞれの特徴と手順を確認し、
          <Link href="/">今日の一杯</Link>
          で豆に合わせたレシピを提案してもらえます。
        </p>
      </header>

      <div className="method-grid">
        {METHOD_GUIDES.map((method) => (
          <Link
            key={method.id}
            href={`/methods/${method.id}`}
            className="method-card"
          >
            <MethodIllustration method={method.id} variant="card" />
            <h2 className="method-card-title">{method.name_ja}</h2>
            <p className="method-card-summary">{method.summary}</p>
            <ul className="method-card-tags">
              {method.characteristics.slice(0, 2).map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <ol className="method-card-steps" aria-label={`${method.name_ja}の手順概要`}>
              {method.steps.map((step, i) => (
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
