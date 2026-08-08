# ブルーボトルコーヒー — Research Notes

**Scraped:** 2026-08-08  
**Source:** https://store.bluebottlecoffee.jp/collections/coffee  
**Chain ID:** `bluebottle`

## 公式EC

- URL: https://store.bluebottlecoffee.jp/
- プラットフォーム: Shopify
- コーヒー一覧: `/collections/coffee`

## スクレイピング方針

1. `/collections/coffee/products.json?limit=250`
2. 採用: ブレンド・シングルオリジン（インスタント・セット一部除く）
3. 除外: クラフトインスタント、50本セット、ドリップ器具
4. 価格: 200g ブレンド ¥1,950〜2,550、SO ¥1,484〜（100g換算）
5. 焙煎: 商品名・説明から light / medium / dark を推定

## カタログ概要（17 品目）

| タイプ | 代表商品 | 特徴 |
|--------|---------|------|
| 定番ブレンド | ジャイアント・ステップス | バランス・エントリー |
| | ベラ・ドノヴァン | フルーティ・華やか |
| | スリー・アフリカズ | 非洲3国ブレンド |
| | 東京喫茶ブレンド | 日本限定 |
| エスプレッソ系 | ヘイズ・バレー・エスプレッソ | 深煎り |
| デカフェ | ナイトライト・ディカフェ | 低カフェイン |
| シングルオリジン | スマトラ・クリンチ等 | 季節ローテ |
| 限定 | お試しセレクション | 60g×3 |

## MVP seeds（3）

| 商品 | handle |
|------|--------|
| ジャイアント・ステップス | giant-steps |
| ベラ・ドノヴァン | bela-donovan |
| ナイトライト・ディカフェ | nightlight-decaf |

## 実行

```powershell
node scripts/build-bluebottle-beans.mjs
# ↑ beans_raw.json 生成 + 画像ダウンロード（ensure_bean_images）まで一括

py -3 -S scripts/merge_catalog.py
# ↑ 全チェーン統合 + 画像確保 + public/beans 同期
```

画像だけ再取得する場合:

```powershell
py -3 -S scripts/ensure_bean_images.py --chain bluebottle
node scripts/sync-bean-images.mjs
```

`image_local` は Shopify handle 単位（例: `c002.jpg`）。100g/200g バリアントは同一画像を共有。

## 備考

- シングルオリジンは入れ替わりが早い。定期スクレイプ推奨。
- 「から」表記価格は 100g 換算の場合あり（要商品ページ確認）。
