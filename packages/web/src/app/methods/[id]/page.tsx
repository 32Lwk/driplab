import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildRecipe } from "@driplab/recommender";
import type { EquipmentId, MoodProfile } from "@driplab/recommender";
import { getAvailableBeans } from "@/lib/catalog";
import { getMethodGuide, METHOD_GUIDES } from "@/lib/methods";
import { MethodIllustration } from "@/components/MethodIllustration";
import { RecipeDetails } from "@/components/RecipeDetails";

const DEFAULT_MOOD: MoodProfile = {
  alertness: 50,
  acidity_pref: 50,
  body_pref: 50,
  sweetness_pref: 50,
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return METHOD_GUIDES.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const guide = getMethodGuide(id);
  if (!guide) return { title: "淹れ方 — DripLab" };
  return {
    title: `${guide.name_ja} — DripLab`,
    description: guide.summary,
  };
}

export default async function MethodDetailPage({ params }: PageProps) {
  const { id } = await params;
  const guide = getMethodGuide(id);
  if (!guide) notFound();

  const sampleBean =
    getAvailableBeans().find((b) => b.roast_level === "medium") ??
    getAvailableBeans()[0];

  const recipe = sampleBean
    ? buildRecipe(sampleBean, id as EquipmentId, DEFAULT_MOOD)
    : null;

  return (
    <main className="app-main">
      <nav className="breadcrumb">
        <Link href="/methods">淹れ方ガイド</Link>
        <span aria-hidden> / </span>
        <span>{guide.name_ja}</span>
      </nav>

      <header className="method-detail-header">
        <div className="method-detail-header-text">
          <h1 className="page-title">{guide.name_ja}</h1>
          <p className="page-lead">{guide.summary}</p>
        </div>
        <MethodIllustration method={guide.id} variant="hero" />
      </header>

      <div className="method-detail">
        <section className="section-card">
          <p className="section-title">概要</p>
          <p className="method-description">{guide.description}</p>
        </section>

        <section className="section-card">
          <p className="section-title">手順</p>
          <ol className="method-steps-visual">
            {guide.steps.map((step, i) => (
              <li key={step.title} className="method-step-visual">
                <MethodIllustration
                  method={guide.id}
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

        <section className="section-card">
          <p className="section-title">特徴</p>
          <ul className="method-list">
            {guide.characteristics.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="section-card">
          <p className="section-title">コツ</p>
          <ul className="method-list">
            {guide.tips.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="section-card">
          <p className="section-title">こんなときに</p>
          <p className="method-suitable">{guide.suitable_for}</p>
        </section>

        {recipe && sampleBean && (
          <section className="section-card">
            <p className="section-title">参考レシピ</p>
            <p className="method-sample-note">
              中煎りの代表豆「{sampleBean.display_name}」を想定した例です。
              豆や気分に合わせて湯温・量は変わります。
            </p>
            <RecipeDetails recipe={recipe} title={`${guide.name_ja} の例`} />
          </section>
        )}

        <div className="method-nav-row">
          {METHOD_GUIDES.filter((m) => m.id !== guide.id).map((m) => (
            <Link key={m.id} href={`/methods/${m.id}`} className="method-nav-link">
              <MethodIllustration method={m.id} variant="card" className="method-nav-thumb" />
              <span>{m.name_ja} →</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
