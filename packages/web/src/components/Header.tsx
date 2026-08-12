"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-brand">
          <CoffeeIcon size={36} />
          <div>
            <span className="site-title">DripLab</span>
            <span className="site-tagline">気分・食事で選ぶ、今日の一杯</span>
          </div>
        </Link>

        <nav className="site-nav" aria-label="メインメニュー">
          {NAV_ITEMS.map(({ href, label }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link${active ? " nav-link-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
