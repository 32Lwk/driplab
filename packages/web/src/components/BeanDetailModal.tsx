"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CHAIN_LABELS,
  resolveBeanImageUrls,
  storyTextsEqual,
} from "@driplab/recommender";
import type { BeanProduct, CaffeineLevel } from "@driplab/recommender";
import { BeanImage } from "@/components/BeanImage";
import { BeanTasteProfile } from "@/components/BeanTasteProfile";
import { showEpisodeSourceLink } from "@/lib/beanLinks";

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

interface BeanDetailModalProps {
  bean: BeanProduct | null;
  open: boolean;
  onClose: () => void;
}

export function BeanDetailModal({ bean, open, onClose }: BeanDetailModalProps) {
  const { src: imageUrl, fallbacks: imageFallbacks } = bean
    ? resolveBeanImageUrls(bean)
    : { src: undefined, fallbacks: [] as string[] };

  const galleryImages = useMemo(() => {
    if (!bean) return [];
    const urls = [imageUrl, ...(bean.extra_images ?? [])].filter(
      (url): url is string => Boolean(url),
    );
    return [...new Set(urls)];
  }, [bean, imageUrl]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [bean?.id, open]);

  const selectedImageUrl =
    galleryImages[selectedImageIndex] ?? galleryImages[0];
  const selectedFallbacks =
    selectedImageIndex === 0 ? imageFallbacks : [];

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !bean) return null;

  const roast =
    bean.roast_label_ja ?? ROAST_FALLBACK[bean.roast_level] ?? bean.roast_level;
  const price = formatPrice(bean.price_jpy);
  const weight = bean.weight_g ? `${bean.weight_g}g` : null;
  const origin =
    bean.origin && bean.origin.length > 0 ? bean.origin.join(" · ") : null;
  const story = bean.episode;
  const tasteNotes = bean.taste_notes;
  const showTasteNotes =
    tasteNotes &&
    story &&
    !storyTextsEqual(story, tasteNotes) &&
    tasteNotes !== "不明";

  return (
    <div
      className="bean-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="bean-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`bean-modal-title-${bean.id}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="bean-modal-close"
          onClick={onClose}
          aria-label="閉じる"
        >
          ×
        </button>

        <div className="bean-modal-layout">
          <div className="bean-modal-gallery">
            {galleryImages.length > 0 ? (
              <>
                <div className="bean-modal-main-image">
                  <BeanImage
                    src={selectedImageUrl}
                    fallbacks={selectedFallbacks}
                    alt={bean.display_name}
                    loading="eager"
                  />
                </div>
                {galleryImages.length > 1 && (
                  <div className="bean-modal-thumbs">
                    {galleryImages.map((url, index) => (
                      <button
                        key={url}
                        type="button"
                        className={`bean-modal-thumb${index === selectedImageIndex ? " is-active" : ""}`}
                        onClick={() => setSelectedImageIndex(index)}
                        aria-label={`画像 ${index + 1} を表示`}
                        aria-current={
                          index === selectedImageIndex ? "true" : undefined
                        }
                      >
                        <img src={url} alt="" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bean-card-placeholder" aria-hidden />
            )}
          </div>

          <div className="bean-modal-body">
            <p className="bean-card-chain">{CHAIN_LABELS[bean.chain_id]}</p>
            <h2
              id={`bean-modal-title-${bean.id}`}
              className="bean-modal-title"
            >
              {bean.display_name}
            </h2>
            <p className="bean-card-meta">
              {[roast, price, weight].filter(Boolean).join(" · ")}
            </p>

            {bean.taste_label_ja && (
              <p className="bean-card-taste-label">{bean.taste_label_ja}</p>
            )}

            <BeanTasteProfile bean={bean} />

            {bean.flavor_tags && bean.flavor_tags.length > 0 && (
              <ul className="bean-flavor-tags">
                {bean.flavor_tags.slice(0, 8).map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            )}

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

            <div className="bean-modal-actions">
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
              <a
                href={bean.buy_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bean-card-link"
              >
                購入ページ →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
