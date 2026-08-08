import type { Metadata } from "next";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "DripLab — 気分で選ぶ、今日の一杯",
  description:
    "5チェーンのコーヒー豆と今日の気分から、買う豆と淹れ方を提案します。",
  openGraph: {
    title: "DripLab — 気分で選ぶ、今日の一杯",
    description: "気分スライダーから、あなたに合うコーヒー豆と抽出レシピを提案。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <div className="app-shell">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
