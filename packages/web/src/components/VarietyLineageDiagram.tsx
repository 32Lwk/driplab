"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LineageOverviewFork, LineageTreeView } from "@/components/LineageTreeView";
import {
  COFFEE_HISTORY,
  HISTORY_ERAS,
  LINEAGE_BRANCHES,
  LINEAGE_NODES,
  LINEAGE_SPECIES,
  type HistoryEraId,
  type LineageBranchId,
  type LineageSpeciesId,
} from "@/lib/varietyLineageData";
import { getLineageNode } from "@/lib/varietyLineageTree";

const nodeBySlug = new Map(LINEAGE_NODES.map((n) => [n.slug, n]));

type DiagramTab = "overview" | "history" | "tree";

export function VarietyLineageDiagram() {
  const [tab, setTab] = useState<DiagramTab>("overview");
  const [activeSpecies, setActiveSpecies] = useState<LineageSpeciesId>("arabica");
  const [activeBranch, setActiveBranch] = useState<LineageBranchId>("bourbon");
  const [activeEra, setActiveEra] = useState<HistoryEraId | "all">("all");
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  const branchesForSpecies = useMemo(
    () => LINEAGE_BRANCHES.filter((b) => b.species === activeSpecies),
    [activeSpecies],
  );

  const branchMeta =
    branchesForSpecies.find((b) => b.id === activeBranch) ?? branchesForSpecies[0]!;

  const highlightedSlugs = useMemo(() => {
    const set = new Set<string>();
    if (!hoveredSlug) return set;
    set.add(hoveredSlug);
    const node = nodeBySlug.get(hoveredSlug);
    if (node?.parents) {
      for (const p of node.parents) set.add(p);
    }
    for (const n of LINEAGE_NODES) {
      if (n.parents?.includes(hoveredSlug)) set.add(n.slug);
    }
    return set;
  }, [hoveredSlug]);

  const historyEvents =
    activeEra === "all"
      ? COFFEE_HISTORY
      : COFFEE_HISTORY.filter((e) => e.era === activeEra);

  function selectSpecies(species: LineageSpeciesId) {
    setActiveSpecies(species);
    const first = LINEAGE_BRANCHES.find((b) => b.species === species)!;
    setActiveBranch(first.id);
  }

  function selectBranch(id: LineageBranchId, species: LineageSpeciesId) {
    setActiveSpecies(species);
    setActiveBranch(id);
    setTab("tree");
  }

  return (
    <section className="section-card variety-lineage" id="lineage" aria-label="コーヒー品種の系統図と歴史">
      <p className="section-title">系統図とコーヒーの歴史</p>
      <p className="variety-lineage-lead">
        上から下へ系統・派生の流れを表します。線でつながった品種が親子関係、
        <strong>× マーク</strong>は2品種の交配です。
      </p>

      <div className="lineage-main-tabs" role="tablist" aria-label="表示モード">
        {(
          [
            ["overview", "分岐の全体像"],
            ["history", "歴史年表"],
            ["tree", "系統の詳細"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`lineage-main-tab${tab === id ? " active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="lineage-overview" role="tabpanel">
          <LineageOverviewFork onSelectBranch={selectBranch} />
        </div>
      )}

      {tab === "history" && (
        <div className="lineage-history-panel" role="tabpanel">
          <div className="lineage-era-tabs" role="group" aria-label="時代で絞り込み">
            <button
              type="button"
              className={`lineage-era-tab${activeEra === "all" ? " active" : ""}`}
              onClick={() => setActiveEra("all")}
            >
              すべて
            </button>
            {HISTORY_ERAS.map((era) => (
              <button
                key={era.id}
                type="button"
                className={`lineage-era-tab${activeEra === era.id ? " active" : ""}`}
                onClick={() => setActiveEra(era.id)}
              >
                {era.label}
                <span className="lineage-era-range">{era.yearRange}</span>
              </button>
            ))}
          </div>

          <ol className="lineage-vtimeline">
            {historyEvents.map((event) => (
              <li key={`${event.year}-${event.title}`} className="lineage-vtimeline-item">
                <div className="lineage-vtimeline-marker">
                  <time dateTime={`${event.year}`}>{event.label}</time>
                </div>
                <article className="lineage-vtimeline-body">
                  <h3 className="lineage-vtimeline-title">{event.title}</h3>
                  {event.region && (
                    <span className="variety-history-region">{event.region}</span>
                  )}
                  <p className="lineage-vtimeline-desc">{event.description}</p>
                  {event.varietySlugs && event.varietySlugs.length > 0 && (
                    <ul className="variety-history-links">
                      {event.varietySlugs.map((slug) => (
                        <li key={slug}>
                          <Link href={`/learn/varieties/${slug}`}>
                            {getLineageNode(slug)?.label ?? slug}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </li>
            ))}
          </ol>
        </div>
      )}

      {tab === "tree" && (
        <div className="lineage-tree-panel" role="tabpanel">
          <div className="lineage-species-tabs" role="tablist" aria-label="コーヒーの種">
            {LINEAGE_SPECIES.map((sp) => (
              <button
                key={sp.id}
                type="button"
                role="tab"
                aria-selected={activeSpecies === sp.id}
                className={`lineage-species-tab${activeSpecies === sp.id ? " active" : ""}${sp.id === "robusta" ? " lineage-species-tab--robusta" : ""}`}
                onClick={() => selectSpecies(sp.id)}
              >
                {sp.label}
              </button>
            ))}
          </div>

          <div className="lineage-branch-tabs" role="tablist" aria-label="系統の枝">
            {branchesForSpecies.map((branch) => (
              <button
                key={branch.id}
                type="button"
                role="tab"
                aria-selected={activeBranch === branch.id}
                className={`lineage-branch-tab${activeBranch === branch.id ? " active" : ""}`}
                style={
                  {
                    "--branch-color": branch.color,
                    "--branch-bg": branch.bg,
                  } as React.CSSProperties
                }
                onClick={() => setActiveBranch(branch.id)}
              >
                <span className="lineage-branch-tab-dot" aria-hidden />
                {branch.label}
              </button>
            ))}
          </div>

          <div
            className="lineage-tree-panel-inner"
            style={
              {
                "--branch-color": branchMeta.color,
                "--branch-bg": branchMeta.bg,
              } as React.CSSProperties
            }
          >
            <p className="lineage-column-lead">{branchMeta.lead}</p>
            <LineageTreeView
              branchId={branchMeta.id}
              branchColor={branchMeta.color}
              highlightedSlugs={highlightedSlugs}
              onHover={setHoveredSlug}
            />
          </div>

          <ul className="lineage-tree-legend">
            <li>
              <span className="lineage-legend-line" aria-hidden /> 突然変異・選抜による派生
            </li>
            <li>
              <span className="lineage-legend-merge" aria-hidden>交配</span>{" "}
              2品種の交配（親の組み合わせを表示）
            </li>
            <li>
              <span className="lineage-legend-external" aria-hidden /> 他系統からの親
            </li>
          </ul>
          <p className="lineage-tree-hint">
            ドラッグで移動、左下の操作またはホイールで拡大縮小できます。品種にマウスを乗せると親子関係がハイライトされます。
          </p>
        </div>
      )}

      <p className="variety-lineage-footnote">
        ※ 図は理解しやすさのため簡略化しています。詳細は
        <Link href="/learn/varieties#cultivar">品種一覧</Link>
        をご覧ください。
      </p>
    </section>
  );
}
