import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { VARIETY_GUIDES } from "@/lib/learn";
import { CULTIVAR_GROUPS } from "@/lib/varietyGuidesData";

const VarietyLineageDiagram = dynamic(
  () => import("@/components/VarietyLineageDiagram").then((m) => m.VarietyLineageDiagram),
  {
    loading: () => (
      <section className="section-card variety-lineage variety-lineage-loading" aria-busy="true">
        <p className="section-title">系統図とコーヒーの歴史</p>
        <p className="variety-lineage-lead">系統図を読み込んでいます…</p>
      </section>
    ),
  },
);

export const metadata: Metadata = {
  title: "豆の種類 — DripLab",
  description:
    "アラビカ・ロブスタ、シングルオリジン・ブレンド、カトゥーラ・ゲイシャ・アララなど、コーヒー豆の種類を解説します。",
};

const CATEGORY_META: Record<
  (typeof VARIETY_GUIDES)[number]["category"],
  { label: string; lead: string; hint: string }
> = {
  species: {
    label: "① コーヒー種",
    lead: "植物としての大分類。味のベースとなる酸味・苦味・カフェイン量が大きく変わります。",
    hint: "まずここを見る — スペシャルティ豆の多くはアラビカ種です",
  },
  cultivar: {
    label: "② 品種",
    lead: "同じアラビカ種の中の系統。産地ガイドに登場する40以上の品種・在来種を、系統ごとに整理しています。",
    hint: "産地と合わせて味の個性を左右する — 詳細は各カードから",
  },
  type: {
    label: "③ 組み方（タイプ）",
    lead: "ロースターが豆をどう組み合わせたか。1産地だけか、複数を混ぜたかで、楽しみ方が変わります。",
    hint: "産地の個性を比べたいならシングルオリジン、毎日飲みやすい安定感ならブレンド",
  },
};

const CATEGORY_ORDER = ["species", "cultivar", "type"] as const;

const LABEL_EXAMPLE = {
  type: "シングルオリジン",
  cultivar: "ゲイシャ",
  species: "アラビカ種",
  origin: "パナマ・ボケテ",
} as const;

function VarietyCard({
  slug,
  nameJa,
  summary,
  tags,
}: {
  slug: string;
  nameJa: string;
  summary: string;
  tags: string[];
}) {
  return (
    <Link href={`/learn/varieties/${slug}`} className="learn-item-card">
      <h3 className="learn-item-title">{nameJa}</h3>
      <p className="learn-item-summary">{summary}</p>
      <ul className="learn-flavor-tags">
        {tags.slice(0, 3).map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <span className="method-card-cta">詳しく見る →</span>
    </Link>
  );
}

export default function VarietiesPage() {
  const cultivars = VARIETY_GUIDES.filter((v) => v.category === "cultivar");

  return (
    <main className="app-main">
      <nav className="breadcrumb">
        <Link href="/learn">コーヒーを知る</Link>
        <span aria-hidden> / </span>
        <span>豆の種類</span>
      </nav>

      <header className="page-header">
        <h1 className="page-title">豆の種類</h1>
        <p className="page-lead">
          パッケージに書かれた「アラビカ」「ゲイシャ」「シングルオリジン」は、
          それぞれ<strong>種・品種・組み方</strong>という別の軸の情報です。
          <Link href="/learn/origins">産地ガイド</Link>
          に登場する品種（カトゥーラ、SL28、アララなど）もここで詳しく解説しています。
        </p>
      </header>

      <section className="section-card variety-axis" aria-label="豆ラベルの読み方">
        <p className="section-title">豆ラベルの読み方</p>
        <p className="variety-axis-lead">
          たとえば次のような表記は、下から順に積み重なっています。
          <Link href="/learn/origins">産地</Link>
          は別のガイドで解説しています。
        </p>

        <div className="variety-axis-stack" role="img" aria-label="豆ラベルの分類例">
          <div className="variety-axis-row variety-axis-row--origin">
            <span className="variety-axis-badge">産地</span>
            <span className="variety-axis-value">{LABEL_EXAMPLE.origin}</span>
          </div>
          <div className="variety-axis-row variety-axis-row--type">
            <span className="variety-axis-badge">③ 組み方</span>
            <span className="variety-axis-value">{LABEL_EXAMPLE.type}</span>
          </div>
          <div className="variety-axis-row variety-axis-row--cultivar">
            <span className="variety-axis-badge">② 品種</span>
            <span className="variety-axis-value">{LABEL_EXAMPLE.cultivar}</span>
          </div>
          <div className="variety-axis-row variety-axis-row--species">
            <span className="variety-axis-badge">① 種</span>
            <span className="variety-axis-value">{LABEL_EXAMPLE.species}</span>
          </div>
        </div>

        <p className="variety-axis-caption">
          「{LABEL_EXAMPLE.origin} {LABEL_EXAMPLE.cultivar} {LABEL_EXAMPLE.species}{" "}
          {LABEL_EXAMPLE.type}」— 1産地・1品種の個性を、そのまま味わえる例
        </p>

        <ul className="variety-axis-legend">
          <li>
            <strong>種</strong>
            酸味・苦味・カフェインの土台（アラビカ / ロブスタ）
          </li>
          <li>
            <strong>品種</strong>
            同じ種の中での個性の違い（ゲイシャ、ブルボン、アララなど）
          </li>
          <li>
            <strong>組み方</strong>
            1産地だけか複数混ぜか（シングルオリジン / ブレンド）
          </li>
        </ul>
      </section>

      <VarietyLineageDiagram />

      {CATEGORY_ORDER.map((category) => {
        const meta = CATEGORY_META[category];
        const items = VARIETY_GUIDES.filter((v) => v.category === category);
        const showFlavorTags = category !== "type";

        if (category === "cultivar") {
          return (
            <section key={category} className="learn-region-section" id={category}>
              <div className="learn-region-heading">
                <h2 className="learn-region-title learn-region-title--large">{meta.label}</h2>
                <span className="learn-region-count">{items.length}項目</span>
              </div>
              <p className="variety-section-lead">{meta.lead}</p>
              <p className="variety-section-hint">{meta.hint}</p>

              <nav className="variety-group-nav" aria-label="品種グループ">
                {CULTIVAR_GROUPS.map((group) => {
                  const count = cultivars.filter((v) => v.group === group.id).length;
                  if (count === 0) return null;
                  return (
                    <a key={group.id} href={`#cultivar-${group.id}`} className="variety-group-nav-link">
                      {group.label}
                      <span className="variety-group-nav-count">{count}</span>
                    </a>
                  );
                })}
              </nav>

              {CULTIVAR_GROUPS.map((group) => {
                const groupItems = cultivars.filter((v) => v.group === group.id);
                if (groupItems.length === 0) return null;
                return (
                  <div key={group.id} className="variety-group" id={`cultivar-${group.id}`}>
                    <h3 className="variety-group-title">{group.label}</h3>
                    <p className="variety-group-lead">{group.lead}</p>
                    <div className="learn-item-grid">
                      {groupItems.map((variety) => (
                        <VarietyCard
                          key={variety.slug}
                          slug={variety.slug}
                          nameJa={variety.name_ja}
                          summary={variety.summary}
                          tags={
                            showFlavorTags
                              ? variety.flavor_notes
                              : variety.characteristics
                          }
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          );
        }

        return (
          <section key={category} className="learn-region-section" id={category}>
            <div className="learn-region-heading">
              <h2 className="learn-region-title learn-region-title--large">{meta.label}</h2>
              <span className="learn-region-count">{items.length}項目</span>
            </div>
            <p className="variety-section-lead">{meta.lead}</p>
            <p className="variety-section-hint">{meta.hint}</p>

            <div className="learn-item-grid">
              {items.map((variety) => (
                <VarietyCard
                  key={variety.slug}
                  slug={variety.slug}
                  nameJa={variety.name_ja}
                  summary={variety.summary}
                  tags={
                    showFlavorTags ? variety.flavor_notes : variety.characteristics
                  }
                />
              ))}
            </div>
          </section>
        );
      })}

      <section className="section-card variety-compare" aria-label="アラビカ種とロブスタ種の比較">
        <p className="section-title">種の違いをざっくり比較</p>
        <div className="variety-compare-grid">
          <div className="variety-compare-col">
            <p className="variety-compare-name">アラビカ種</p>
            <ul className="method-list">
              <li>スペシャルティコーヒーの主流</li>
              <li>酸味が明るく、風味が繊細</li>
              <li>高地で栽培、カフェインは低め</li>
            </ul>
            <Link href="/learn/varieties/arabica" className="learn-nav-link">
              アラビカ種を詳しく →
            </Link>
          </div>
          <div className="variety-compare-col">
            <p className="variety-compare-name">ロブスタ種</p>
            <ul className="method-list">
              <li>エスプレッソやインスタントに多い</li>
              <li>コク・苦味が強く、カフェイン多め</li>
              <li>低地でも育ち、病害に強い</li>
            </ul>
            <Link href="/learn/varieties/robusta" className="learn-nav-link">
              ロブスタ種を詳しく →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
