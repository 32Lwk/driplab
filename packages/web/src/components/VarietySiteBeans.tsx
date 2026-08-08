import Link from "next/link";
import { CHAIN_LABELS, resolveBeanImageUrls } from "@driplab/recommender";
import type { BeanProduct } from "@driplab/recommender";
import { BeanImage } from "@/components/BeanImage";
import {
  beanCatalogHref,
  beansByVarietyHref,
  getBeansForVarietySlug,
} from "@/lib/varietyBeans";

const PREVIEW_LIMIT = 12;

interface VarietySiteBeansProps {
  slug: string;
  varietyName: string;
}

function formatOriginLabel(bean: BeanProduct): string | null {
  if (!bean.origin || bean.origin.length === 0) return null;
  return bean.origin.join(" · ");
}

export function VarietySiteBeans({ slug, varietyName }: VarietySiteBeansProps) {
  const beans = getBeansForVarietySlug(slug);
  const preview = beans.slice(0, PREVIEW_LIMIT);

  if (beans.length === 0) {
    return (
      <section className="section-card origin-site-beans">
        <p className="section-title">DripLab で取り扱う{varietyName}の豆</p>
        <p className="method-description">
          現在、品種表記に「{varietyName}」が含まれる豆は掲載されていません。{" "}
          <Link href="/beans" className="learn-nav-link">
            豆一覧を見る →
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="section-card origin-site-beans">
      <p className="section-title">DripLab で取り扱う{varietyName}の豆</p>
      <p className="origin-site-beans-lead">
        豆一覧 {beans.length}件中、商品情報に「{varietyName}」が含まれるものです。
      </p>

      <ul className="origin-bean-grid">
        {preview.map((bean) => {
          const { src, fallbacks } = resolveBeanImageUrls(bean);
          const originLabel = formatOriginLabel(bean);
          return (
            <li key={bean.id} className="origin-bean-card">
              <Link href={beanCatalogHref(bean)} className="origin-bean-card-link">
                <div className="origin-bean-card-image">
                  {src ? (
                    <BeanImage
                      src={src}
                      fallbacks={fallbacks}
                      alt={bean.display_name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="bean-card-placeholder" aria-hidden />
                  )}
                </div>
                <div className="origin-bean-card-body">
                  <p className="origin-bean-card-chain">{CHAIN_LABELS[bean.chain_id]}</p>
                  <p className="origin-bean-card-name">{bean.display_name}</p>
                  {originLabel && (
                    <p className="origin-bean-card-origin">
                      <span className="origin-bean-card-origin-label">産地</span>
                      {originLabel}
                    </p>
                  )}
                </div>
              </Link>
              <a
                href={bean.buy_url}
                target="_blank"
                rel="noopener noreferrer"
                className="origin-bean-buy-link"
              >
                購入ページ →
              </a>
            </li>
          );
        })}
      </ul>

      {beans.length > PREVIEW_LIMIT && (
        <p className="origin-site-beans-more">
          <Link href={beansByVarietyHref(slug)} className="learn-nav-link">
            豆一覧ですべて表示（{beans.length}件）→
          </Link>
        </p>
      )}
    </section>
  );
}
