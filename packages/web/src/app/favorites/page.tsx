"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RecipeDetails } from "@/components/RecipeDetails";
import { loadFavorites, removeFavorite, type FavoriteEntry } from "@/lib/favorites";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  function handleRemove(id: string) {
    removeFavorite(id);
    setFavorites(loadFavorites());
  }

  return (
    <main className="app-main">
      <h1 className="page-title">お気に入り</h1>
      <p className="page-lead">
        保存した豆とレシピ（最大50件・この端末のみ）
      </p>

      {favorites.length === 0 ? (
        <div className="section-card empty-state">
          <p>まだお気に入りがありません。</p>
          <Link href="/" className="primary-btn" style={{ display: "inline-block", marginTop: "1rem" }}>
            今日の一杯を探す
          </Link>
        </div>
      ) : (
        <ul className="favorites-list">
          {favorites.map((fav) => (
            <li key={fav.id} className="section-card favorite-card">
              <div className="favorite-header">
                <div>
                  <span className="favorite-mode">
                    {fav.mode === "pairing" ? "食事に合わせる" : "気分で選ぶ"}
                  </span>
                  <h2>{fav.product_name}</h2>
                  <p className="favorite-meta">
                    {fav.chain_name_ja}
                    {fav.food_label && ` · ${fav.food_label}`}
                  </p>
                </div>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => handleRemove(fav.id)}
                >
                  削除
                </button>
              </div>
              {fav.pairing_reason && (
                <p className="favorite-pairing-note">{fav.pairing_reason}</p>
              )}
              <RecipeDetails recipe={fav.recipe} />
              <a
                href={fav.buy_url}
                target="_blank"
                rel="noopener noreferrer"
                className="buy-link"
              >
                購入ページへ
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
