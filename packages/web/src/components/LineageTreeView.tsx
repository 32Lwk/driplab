"use client";

import Link from "next/link";
import { Fragment, useMemo, type CSSProperties } from "react";
import { LineageZoomViewport } from "@/components/LineageZoomViewport";
import {
  buildBranchTree,
  branchIdForForkSlug,
  getLineageNode,
  getOverviewForkChildren,
  getRootForkSlugs,
  getRootSlugForSpecies,
  type LineageTreeNode,
} from "@/lib/varietyLineageTree";
import {
  LINEAGE_BRANCHES,
  LINEAGE_SPECIES,
  type LineageBranchId,
  type LineageSpeciesId,
} from "@/lib/varietyLineageData";

function LineageNodeCard({
  slug,
  branchColor,
  dimmed,
  external,
  onHover,
  variant = "tree",
  hideNote,
}: {
  slug: string;
  branchColor: string;
  dimmed: boolean;
  external?: boolean;
  onHover: (slug: string | null) => void;
  variant?: "tree" | "arch-primary" | "arch-sub";
  hideNote?: boolean;
}) {
  const node = getLineageNode(slug);
  if (!node) return null;

  const isRoot = slug.startsWith("_root");
  const className = [
    variant === "arch-primary" ? "lineage-v-node lineage-v-node--primary" : "",
    variant === "arch-sub" ? "lineage-v-node lineage-v-node--sub" : "",
    variant === "tree" ? "lineage-node" : "",
    dimmed ? "lineage-node--dim" : "lineage-node--highlight",
    isRoot ? "lineage-node--root" : "",
    external ? "lineage-node--external" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const style = { "--branch-color": branchColor } as CSSProperties;
  const inner = (
    <>
      {node.year && <span className="lineage-node-year">{node.year}</span>}
      <span className="lineage-node-label">{node.label}</span>
      {variant !== "arch-sub" && node.note && !hideNote && (
        <span className="lineage-node-note">{node.note}</span>
      )}
      {external && <span className="lineage-node-external">他系統</span>}
    </>
  );

  if (isRoot || node.href === false) {
    return (
      <div
        className={className}
        style={style}
        onMouseEnter={() => onHover(slug)}
        onMouseLeave={() => onHover(null)}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/learn/varieties/${slug}`}
      className={className}
      style={style}
      onMouseEnter={() => onHover(slug)}
      onMouseLeave={() => onHover(null)}
    >
      {inner}
    </Link>
  );
}

function crossbreedFormula(slug: string): string | null {
  const node = getLineageNode(slug);
  if (!node?.parents || node.parents.length <= 1) return null;
  if (node.note?.includes("×")) return node.note;
  return node.parents
    .map((parentSlug) => getLineageNode(parentSlug)?.label ?? parentSlug)
    .join(" × ");
}

function noteDuplicatesCrossFormula(slug: string): boolean {
  const node = getLineageNode(slug);
  const formula = crossbreedFormula(slug);
  if (!node?.note || !formula) return false;
  return node.note.includes("×");
}

/** 2親以上の交配品種：親の組み合わせと系譜上の位置を明示 */
function CrossbreedBadge({
  childSlug,
  treeParentSlug,
}: {
  childSlug: string;
  treeParentSlug: string;
}) {
  const formula = crossbreedFormula(childSlug);
  if (!formula) return null;

  const treeParentLabel = getLineageNode(treeParentSlug)?.label ?? treeParentSlug;

  return (
    <div className="lineage-cross-badge" aria-label={`交配品種: ${formula}。系譜上は ${treeParentLabel} から派生`}>
      <span className="lineage-cross-badge-label">交配品種</span>
      <span className="lineage-cross-badge-formula">{formula}</span>
      <span className="lineage-cross-badge-hint">系譜上は {treeParentLabel} から</span>
    </div>
  );
}

/** 親→子の垂直コネクター */
function VLink({ color }: { color?: string }) {
  return (
    <span
      className="lineage-v-link"
      style={color ? ({ "--branch-color": color } as CSSProperties) : undefined}
      aria-hidden
    />
  );
}

function VerticalTreeItem({
  tree,
  branchColor,
  branchId,
  highlightedSlugs,
  onHover,
  parentSlug,
}: {
  tree: LineageTreeNode;
  branchColor: string;
  branchId: LineageBranchId;
  highlightedSlugs: Set<string>;
  onHover: (slug: string | null) => void;
  parentSlug?: string;
}) {
  const node = getLineageNode(tree.slug)!;
  const isExternal =
    !tree.slug.startsWith("_root") &&
    node.branch !== branchId &&
    node.branch !== "root";
  const dimmed = highlightedSlugs.size > 0 && !highlightedSlugs.has(tree.slug);
  const childCount = tree.children.length;

  return (
    <li className="lineage-v-item">
      <div className="lineage-v-card">
        {tree.mergeParents && tree.mergeParents.length > 0 && parentSlug && (
          <CrossbreedBadge childSlug={tree.slug} treeParentSlug={parentSlug} />
        )}
        <LineageNodeCard
          slug={tree.slug}
          branchColor={isExternal ? "#9e9e9e" : branchColor}
          dimmed={dimmed}
          external={isExternal}
          onHover={onHover}
          hideNote={noteDuplicatesCrossFormula(tree.slug)}
        />
      </div>
      {childCount > 0 && (
        <>
          <VLink color={branchColor} />
          <ul
            className={`lineage-v-children${childCount > 1 ? " lineage-v-children--fork" : ""}`}
            style={{ "--branch-color": branchColor } as CSSProperties}
          >
            {tree.children.map((child) => (
              <VerticalTreeItem
                key={child.slug}
                tree={child}
                branchColor={branchColor}
                branchId={branchId}
                highlightedSlugs={highlightedSlugs}
                onHover={onHover}
                parentSlug={tree.slug}
              />
            ))}
          </ul>
        </>
      )}
    </li>
  );
}

interface LineageTreeViewProps {
  branchId: LineageBranchId;
  branchColor: string;
  highlightedSlugs: Set<string>;
  onHover: (slug: string | null) => void;
}

export function LineageTreeView({
  branchId,
  branchColor,
  highlightedSlugs,
  onHover,
}: LineageTreeViewProps) {
  const tree = useMemo(() => buildBranchTree(branchId), [branchId]);

  if (!tree) return null;

  return (
    <LineageZoomViewport resetKey={branchId} variant="tree">
      <ul className="lineage-v lineage-v--root">
        <VerticalTreeItem
          tree={tree}
          branchColor={branchColor}
          branchId={branchId}
          highlightedSlugs={highlightedSlugs}
          onHover={onHover}
        />
      </ul>
    </LineageZoomViewport>
  );
}

/** 1種の概要ブロック（上→下） */
function OverviewSpeciesBlock({
  species,
  onSelectBranch,
}: {
  species: LineageSpeciesId;
  onSelectBranch: (id: LineageBranchId, species: LineageSpeciesId) => void;
}) {
  const speciesMeta = LINEAGE_SPECIES.find((s) => s.id === species)!;
  const rootNode = getLineageNode(getRootSlugForSpecies(species))!;
  const forkSlugs = getRootForkSlugs(species);
  const trunkColor = species === "robusta" ? "#455a64" : undefined;

  return (
    <div className="lineage-v-species-block">
      <div
        className={`lineage-v-node lineage-v-node--root${species === "robusta" ? " lineage-v-node--root-robusta" : ""}`}
      >
        <span className="lineage-node-label">{rootNode.label}</span>
        <span className="lineage-node-note">{speciesMeta.rootNote}</span>
      </div>

      <VLink color={trunkColor} />

      <ul
        className="lineage-v-children lineage-v-children--fork lineage-v-children--overview-col"
        style={{ "--branch-color": trunkColor ?? "var(--accent-dark)" } as CSSProperties}
      >
        {forkSlugs.map((slug) => {
          const branchId = branchIdForForkSlug(slug, species);
          const meta = LINEAGE_BRANCHES.find((b) => b.id === branchId)!;
          const subChildren = species === "arabica" ? getOverviewForkChildren(slug) : [];

          return (
            <li
              key={slug}
              className="lineage-v-item lineage-v-item--overview"
              style={{ "--branch-color": meta.color } as CSSProperties}
            >
              <LineageNodeCard
                slug={slug}
                branchColor={meta.color}
                dimmed={false}
                onHover={() => {}}
                variant="arch-primary"
              />

              {subChildren.length > 0 && (
                <div className="lineage-v-sub-stack">
                  {subChildren.map((childSlug) => (
                    <Fragment key={childSlug}>
                      <VLink color={meta.color} />
                      <LineageNodeCard
                        slug={childSlug}
                        branchColor={meta.color}
                        dimmed={false}
                        onHover={() => {}}
                        variant="arch-sub"
                      />
                    </Fragment>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="lineage-fork-more"
                onClick={() => onSelectBranch(branchId, species)}
              >
                {meta.label} →
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** 概要：アラビカ＋ロブスタを1図に統合 */
export function LineageOverviewFork({
  onSelectBranch,
}: {
  onSelectBranch: (id: LineageBranchId, species: LineageSpeciesId) => void;
}) {
  return (
    <>
      <LineageZoomViewport variant="overview">
        <div className="lineage-v-overview" role="img" aria-label="コーヒー品種の系統分岐図">
          <div className="lineage-v-species-grid">
            {LINEAGE_SPECIES.map((sp) => (
              <section key={sp.id} className="lineage-v-species-panel">
                <h3
                  className={`lineage-v-species-heading${sp.id === "robusta" ? " lineage-v-species-heading--robusta" : ""}`}
                >
                  {sp.label}
                </h3>
                <OverviewSpeciesBlock species={sp.id} onSelectBranch={onSelectBranch} />
              </section>
            ))}
          </div>

          <div className="lineage-v-overview-cross">
            <VLink color="#2e7d32" />
            <div className="lineage-v-node lineage-v-node--timor">
              <p className="lineage-fork-timor-label">Timor 耐性系（アラビカ × ロブスタ）</p>
              <p className="lineage-fork-timor-note">
                Timor Hybrid は両種の自然雑種。Catimor / Sarchimor などアラビカ側の病害耐性品種の起点です。
              </p>
              <button
                type="button"
                className="lineage-fork-more"
                onClick={() => onSelectBranch("timor", "arabica")}
              >
                Timor 系譜（アラビカ側）→
              </button>
            </div>
          </div>
        </div>
      </LineageZoomViewport>
    </>
  );
}
