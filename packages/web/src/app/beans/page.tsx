import type { Metadata } from "next";
import Link from "next/link";
import { BeanCatalog } from "@/components/BeanCatalog";
import { getAvailableBeans } from "@/lib/catalog";
import { getOriginGuide, getVarietyGuide } from "@/lib/learn";

export const metadata: Metadata = {
  title: "豆一覧 — DripLab",
  description: "DripLab が対応するチェーンのコーヒー豆を一覧で確認できます。",
};

interface PageProps {
  searchParams: Promise<{ origin?: string; variety?: string }>;
}

export default async function BeansPage({ searchParams }: PageProps) {
  const { origin: originSlug, variety: varietySlug } = await searchParams;
  const originGuide = originSlug ? getOriginGuide(originSlug) : undefined;
  const varietyGuide = varietySlug ? getVarietyGuide(varietySlug) : undefined;

  const beans = getAvailableBeans().sort((a, b) => {
    const chain = a.chain_id.localeCompare(b.chain_id);
    if (chain !== 0) return chain;
    return a.display_name.localeCompare(b.display_name, "ja");
  });

  return (
    <main className="app-main">
      <header className="page-header">
        <h1 className="page-title">豆一覧</h1>
        <p className="page-lead">
          {varietyGuide ? (
            <>
              <Link href={`/learn/varieties/${varietySlug}`}>{varietyGuide.name_ja}</Link>
              の豆を表示しています。
              {originGuide ? (
                <>
                  {" "}
                  産地は
                  <Link href={`/learn/origins/${originSlug}`}>{originGuide.name_ja}</Link>
                  で絞り込み中です。
                </>
              ) : null}
            </>
          ) : originGuide ? (
            <>
              <Link href={`/learn/origins/${originSlug}`}>{originGuide.name_ja}</Link>
              産の豆を表示しています。産地・精製・味わいの特徴やエピソードを確認できます。産地の基礎知識は
              <Link href={`/learn/origins/${originSlug}`}>産地ガイド</Link>
              、気分に合う豆は
              <Link href="/">今日の一杯</Link>
              から探せます。
            </>
          ) : (
            <>
              スターバックス、丸山珈琲、ドトール、タリーズ、カルディなど
              {beans.length}品目を掲載しています。産地・精製・味わいの特徴や
              エピソードを確認できます。産地や精製の基礎知識は
              <Link href="/learn">コーヒーを知る</Link>
              、気分に合う豆は
              <Link href="/">今日の一杯</Link>
              から探せます。
            </>
          )}
        </p>
      </header>

      <BeanCatalog
        beans={beans}
        originSlug={originGuide ? originSlug : undefined}
        originName={originGuide?.name_ja}
        varietySlug={varietyGuide ? varietySlug : undefined}
        varietyName={varietyGuide?.name_ja}
      />
    </main>
  );
}
