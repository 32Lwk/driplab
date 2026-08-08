"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CHAIN_LABELS,
  resolveBeanImageUrls,
  storyTextsEqual,
} from "@driplab/recommender";
import type { BeanProduct, CaffeineLevel, ChainId } from "@driplab/recommender";
import { BeanDetailModal } from "@/components/BeanDetailModal";
import { BeanImage } from "@/components/BeanImage";
import { BeanTasteProfile } from "@/components/BeanTasteProfile";
import { showEpisodeSourceLink } from "@/lib/beanLinks";
import { filterBeansBySearchQuery } from "@/lib/beanSearch";
import { beanMatchesOriginSlug } from "@/lib/originBeans";
import { beanMatchesVarietySlug } from "@/lib/varietyBeans";

const ROAST_FALLBACK: Record<string, string> = {
  light: "浅煎り",
  medium: "中煎り",
  medium_dark: "中深煎り",
  dark: "深煎り",
};

const CAFFEINE_LABELS: Record<CaffeineLevel, string> = {
  low: "低カフェイン",
  medium: "標準",
  high: "高め",
};

function formatPrice(yen?: number): string | null {
  if (yen == null) return null;
  return `¥${yen.toLocaleString("ja-JP")}`;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bean-detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function BeanCard({ bean }: { bean: BeanProduct }) {
  const [modalOpen, setModalOpen] = useState(false);
  const { src: imageUrl, fallbacks: imageFallbacks } = resolveBeanImageUrls(bean);
  const roast =
    bean.roast_label_ja ?? ROAST_FALLBACK[bean.roast_level] ?? bean.roast_level;
  const price = formatPrice(bean.price_jpy);
  const weight = bean.weight_g ? `${bean.weight_g}g` : null;
  const origin =
    bean.origin && bean.origin.length > 0
      ? bean.origin.join(" · ")
      : null;
  const story = bean.episode;
  const tasteNotes = bean.taste_notes;
  const showTasteNotes =
    tasteNotes &&
    story &&
    !storyTextsEqual(story, tasteNotes) &&
    tasteNotes !== "不明";

  const openModal = () => setModalOpen(true);

  const handleBodyClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("a, button, summary, details")) return;
    openModal();
  };

  return (
    <article className="bean-card" id={`bean-${bean.id}`}>
      <div
        className="bean-card-image bean-card-open"
        role="button"
        tabIndex={0}
        aria-label={`${bean.display_name}の詳細を表示`}
        onClick={openModal}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openModal();
          }
        }}
      >
        {imageUrl ? (
          <BeanImage
            src={imageUrl}
            fallbacks={imageFallbacks}
            alt={bean.display_name}
            loading="lazy"
          />
        ) : (
          <div className="bean-card-placeholder" aria-hidden />
        )}
      </div>
      <div
        className="bean-card-body bean-card-open"
        role="button"
        tabIndex={0}
        aria-label={`${bean.display_name}の詳細を表示`}
        onClick={handleBodyClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openModal();
          }
        }}
      >
        <p className="bean-card-chain">{CHAIN_LABELS[bean.chain_id]}</p>
        <h2 className="bean-card-name">{bean.display_name}</h2>
        <p className="bean-card-meta">
          {[roast, price, weight].filter(Boolean).join(" · ")}
        </p>

        {bean.taste_label_ja && (
          <p className="bean-card-taste-label">{bean.taste_label_ja}</p>
        )}

        <BeanTasteProfile bean={bean} />

        {bean.flavor_tags && bean.flavor_tags.length > 0 && (
          <ul className="bean-flavor-tags">
            {bean.flavor_tags.slice(0, 6).map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}

        <details className="bean-card-details">
          <summary className="bean-card-details-toggle">
            詳細・エピソード
            <span aria-hidden>▼</span>
          </summary>
          <div className="bean-card-details-body">
            <dl className="bean-detail-list">
              {origin && <MetaRow label="産地" value={origin} />}
              {bean.processing && bean.processing !== "不明" && (
                <MetaRow label="精製" value={bean.processing} />
              )}
              {bean.coffee_type && (
                <MetaRow label="種類" value={bean.coffee_type} />
              )}
              <MetaRow
                label="カフェイン"
                value={CAFFEINE_LABELS[bean.caffeine]}
              />
            </dl>

            {story && (
              <div className="bean-story">
                <h3 className="bean-story-title">この豆のストーリー</h3>
                <p>{story}</p>
              </div>
            )}

            {showTasteNotes && (
              <div className="bean-story">
                <h3 className="bean-story-title">味わいの特徴</h3>
                <p>{tasteNotes}</p>
              </div>
            )}

            {showEpisodeSourceLink(bean) && (
              <a
                href={bean.episode_source}
                target="_blank"
                rel="noopener noreferrer"
                className="bean-source-link"
              >
                公式サイトの詳細 →
              </a>
            )}
          </div>
        </details>

        <a
          href={bean.buy_url}
          target="_blank"
          rel="noopener noreferrer"
          className="bean-card-link"
          onClick={(event) => event.stopPropagation()}
        >
          購入ページ →
        </a>
      </div>
      <BeanDetailModal
        bean={bean}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </article>
  );
}

interface BeanCatalogProps {
  beans: BeanProduct[];
  originSlug?: string;
  originName?: string;
  varietySlug?: string;
  varietyName?: string;
}

export function BeanCatalog({
  beans,
  originSlug,
  originName,
  varietySlug,
  varietyName,
}: BeanCatalogProps) {
  const [chainFilter, setChainFilter] = useState<ChainId | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#bean-")) return;
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bean-card-highlight");
      const timer = window.setTimeout(() => el.classList.remove("bean-card-highlight"), 2000);
      return () => window.clearTimeout(timer);
    }
  }, [originSlug, varietySlug]);

  const baseFiltered = useMemo(() => {
    let result = beans;
    if (originSlug) {
      result = result.filter((b) => beanMatchesOriginSlug(b, originSlug));
    }
    if (varietySlug) {
      result = result.filter((b) => beanMatchesVarietySlug(b, varietySlug));
    }
    return result;
  }, [beans, originSlug, varietySlug]);

  const searchFiltered = useMemo(
    () => filterBeansBySearchQuery(baseFiltered, searchQuery),
    [baseFiltered, searchQuery],
  );

  const chains = useMemo(() => {
    const ids = new Set(searchFiltered.map((b) => b.chain_id));
    return (Object.keys(CHAIN_LABELS) as ChainId[]).filter((id) => ids.has(id));
  }, [searchFiltered]);

  const filtered = useMemo(() => {
    if (chainFilter === "all") return searchFiltered;
    return searchFiltered.filter((b) => b.chain_id === chainFilter);
  }, [searchFiltered, chainFilter]);

  const trimmedSearch = searchQuery.trim();

  return (
    <>
      {(originSlug && originName) || (varietySlug && varietyName) ? (
        <p className="catalog-origin-filter">
          {originSlug && originName && (
            <>
              産地：<strong>{originName}</strong>
            </>
          )}
          {varietySlug && varietyName && (
            <>
              {originSlug ? " · " : ""}
              品種：<strong>{varietyName}</strong>
            </>
          )}
          （{baseFiltered.length}件）
        </p>
      ) : null}

      <div className="catalog-search">
        <label className="catalog-search-label" htmlFor="bean-search">
          検索
        </label>
        <div className="catalog-search-field">
          <input
            id="bean-search"
            type="search"
            className="catalog-search-input"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="豆名・産地・味わい・チェーン名で検索"
            autoComplete="off"
            spellCheck={false}
          />
          {trimmedSearch ? (
            <button
              type="button"
              className="catalog-search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="検索をクリア"
            >
              クリア
            </button>
          ) : null}
        </div>
      </div>

      <div className="filter-row">
        <button
          type="button"
          className={`filter-chip${chainFilter === "all" ? " active" : ""}`}
          onClick={() => setChainFilter("all")}
        >
          すべて（{searchFiltered.length}）
        </button>
        {chains.map((id) => {
          const count = searchFiltered.filter((b) => b.chain_id === id).length;
          return (
            <button
              key={id}
              type="button"
              className={`filter-chip${chainFilter === id ? " active" : ""}`}
              onClick={() => setChainFilter(id)}
            >
              {CHAIN_LABELS[id]}（{count}）
            </button>
          );
        })}
      </div>

      <p className="catalog-count">
        {filtered.length}件を表示中
        {trimmedSearch && ` · 「${trimmedSearch}」`}
        {chainFilter !== "all" && ` · ${CHAIN_LABELS[chainFilter]}`}
        {originSlug && originName && ` · ${originName}産`}
        {varietySlug && varietyName && ` · ${varietyName}`}
      </p>

      {filtered.length === 0 ? (
        <p className="catalog-empty">
          {trimmedSearch
            ? `「${trimmedSearch}」に一致する豆は見つかりませんでした。`
            : "表示できる豆がありません。"}
        </p>
      ) : (
        <div className="bean-grid">
          {filtered.map((bean) => (
            <BeanCard key={bean.id} bean={bean} />
          ))}
        </div>
      )}
    </>
  );
}
