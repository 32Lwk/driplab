import {
  LINEAGE_BRANCH_ORDER,
  LINEAGE_NODES,
  LINEAGE_SPECIES,
  type LineageBranchId,
  type LineageSpeciesId,
} from "./varietyLineageData";

export interface LineageTreeNode {
  slug: string;
  children: LineageTreeNode[];
  /** 2親以上の交配ノード */
  mergeParents?: string[];
}

const nodeBySlug = new Map(LINEAGE_NODES.map((n) => [n.slug, n]));

/** 親 slug → 子 slug[]（表示順を維持） */
const childrenByParent = (() => {
  const map = new Map<string, string[]>();
  const orderIndex = new Map<string, number>();
  LINEAGE_NODES.forEach((n, i) => orderIndex.set(n.slug, i));

  for (const node of LINEAGE_NODES) {
    for (const parent of node.parents ?? []) {
      const list = map.get(parent) ?? [];
      list.push(node.slug);
      map.set(parent, list);
    }
  }

  for (const [parent, children] of map) {
    map.set(
      parent,
      [...children].sort((a, b) => (orderIndex.get(a) ?? 0) - (orderIndex.get(b) ?? 0)),
    );
  }
  return map;
})();

export function getLineageNode(slug: string) {
  return nodeBySlug.get(slug);
}

export function getChildrenSlugs(slug: string): string[] {
  return childrenByParent.get(slug) ?? [];
}

export function getRootSlugForSpecies(species: LineageSpeciesId): string {
  return LINEAGE_SPECIES.find((s) => s.id === species)!.rootSlug;
}

/** 枝のツリーに載せる slug（他系統の親は merge 表示のみで枝にしない） */
export function getSlugsForBranch(branchId: LineageBranchId): Set<string> {
  const rootSlug =
    branchId === "robusta" ? "_root_robusta" : "_root";
  return new Set<string>([rootSlug, ...LINEAGE_BRANCH_ORDER[branchId]]);
}

function primaryParentSlug(nodeSlug: string, branchId: LineageBranchId): string | undefined {
  const node = nodeBySlug.get(nodeSlug);
  if (!node?.parents?.length) return undefined;

  const rootSlug = branchId === "robusta" ? "_root_robusta" : "_root";

  const inBranch = node.parents.find((p) => {
    if (p === rootSlug) return true;
    const parent = nodeBySlug.get(p);
    return parent?.branch === branchId || p === rootSlug;
  });
  return inBranch ?? node.parents[0];
}

/** 枝内ツリー（交配は primary 親の下に、他親は merge 表示） */
export function buildBranchTree(branchId: LineageBranchId): LineageTreeNode | null {
  const included = getSlugsForBranch(branchId);
  const rootSlug = branchId === "robusta" ? "_root_robusta" : "_root";
  const attached = new Set<string>();

  function build(slug: string): LineageTreeNode | null {
    if (!included.has(slug)) return null;
    const node = nodeBySlug.get(slug);
    if (!node) return null;

    const childSlugs = (childrenByParent.get(slug) ?? []).filter((childSlug) => {
      if (!included.has(childSlug)) return false;
      if (attached.has(childSlug)) return false;
      const primary = primaryParentSlug(childSlug, branchId);
      return primary === slug;
    });

    const children: LineageTreeNode[] = [];
    for (const childSlug of childSlugs) {
      attached.add(childSlug);
      const child = build(childSlug);
      if (!child) continue;
      const childNode = nodeBySlug.get(childSlug)!;
      if (childNode.parents && childNode.parents.length > 1) {
        child.mergeParents = childNode.parents.filter((p) => p !== slug);
      }
      children.push(child);
    }

    return { slug, children };
  }

  return build(rootSlug);
}

/** 概要図：原産地からの第一分岐（アラビカ） */
export const ROOT_FORK_SLUGS_ARABICA = [
  "typica",
  "red-bourbon",
  "ethiopian-heirloom",
] as const;

/** 概要図：原産地からの第一分岐（ロブスタ） */
export const ROOT_FORK_SLUGS_ROBUSTA = ["conilon", "nganda", "tr4-tr9"] as const;

export function getRootForkSlugs(species: LineageSpeciesId): readonly string[] {
  return species === "robusta" ? ROOT_FORK_SLUGS_ROBUSTA : ROOT_FORK_SLUGS_ARABICA;
}

/** 各第一分岐の直下の子（概要用） */
export function getOverviewForkChildren(rootChildSlug: string): string[] {
  return (childrenByParent.get(rootChildSlug) ?? []).slice(0, 4);
}

/** 概要図の第一分岐 slug → 詳細タブの枝 ID */
export function branchIdForForkSlug(
  slug: string,
  species: LineageSpeciesId,
): LineageBranchId {
  if (species === "robusta") return "robusta";
  if (slug === "typica") return "typica";
  if (slug === "red-bourbon") return "bourbon";
  return "ethiopian";
}
