"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CoffeeIcon } from "./CoffeeIcon";

const NAV_ITEMS = [
  { href: "/", label: "今日の一杯" },
  { href: "/favorites", label: "お気に入り" },
  { href: "/beans", label: "豆一覧" },
  { href: "/learn", label: "コーヒーを知る" },
  { href: "/methods", label: "淹れ方" },
] as const;

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    document.body.classList.toggle("nav-open", menuOpen);
    return () => document.body.classList.remove("nav-open");
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-brand" onClick={closeMenu}>
          <CoffeeIcon size={36} />
          <div>
            <span className="site-title">DripLab</span>
            <span className="site-tagline">気分・食事で選ぶ、今日の一杯</span>
          </div>
        </Link>

        <button
          type="button"
          className="site-nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="site-nav"
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="site-nav-toggle-bar" aria-hidden />
          <span className="site-nav-toggle-bar" aria-hidden />
          <span className="site-nav-toggle-bar" aria-hidden />
        </button>

        <nav
          id="site-nav"
          className={`site-nav${menuOpen ? " site-nav--open" : ""}`}
          aria-label="メインメニュー"
        >
          {NAV_ITEMS.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link${active ? " nav-link-active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={closeMenu}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="site-nav-backdrop"
          aria-label="メニューを閉じる"
          tabIndex={-1}
          onClick={closeMenu}
        />
      )}
    </header>
  );
}
