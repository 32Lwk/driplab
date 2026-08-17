#!/usr/bin/env python3
"""Merge per-chain scraped data and MVP seeds into unified catalogs."""
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRAPED = ROOT / "data" / "scraped"
SEEDS = ROOT / "data" / "seeds"
OUT = ROOT / "data" / "catalog"
DOCS = ROOT / "docs"
CHAINS = [
    "doutor",
    "starbucks",
    "maruyama",
    "tullys",
    "kaldi",
    "ucc",
    "hoshino",
    "ogawa",
    "sarutahiko",
    "bluebottle",
    "saza",
]

# Allow import when run as script
import sys

if str(ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(ROOT / "scripts"))

from backfill_bean_images import link_local_bean_images  # noqa: E402
from ensure_bean_images import ensure_bean_images, validate_bean_images  # noqa: E402
from r2_utils import image_cdn_url, load_r2_config  # noqa: E402

CHAIN_LABELS = {
    "doutor": "ドトール",
    "starbucks": "スターバックス",
    "maruyama": "丸山コーヒー",
    "tullys": "タリーズ",
    "kaldi": "カルディ",
    "ucc": "UCC",
    "hoshino": "星乃珈琲",
    "ogawa": "小川珈琲",
    "sarutahiko": "猿田彦珈琲",
    "bluebottle": "ブルーボトル",
    "saza": "サザコーヒー",
}


def roast_label(bean: dict) -> str:
    for key in ("roast_label_ja", "roast", "roast_level"):
        val = bean.get(key)
        if val:
            return str(val)
    return "-"


def write_catalog_md(beans: list[dict], by_chain: dict[str, int], generated_at: str) -> None:
    total = len(beans)
    lines = [
        "# DripLab 全チェーン コーヒー豆カタログ",
        "",
        f"生成日: {generated_at[:10]}",
        f"**合計: {total} 品目**",
        "",
    ]
    for chain_id in CHAINS:
        chain_beans = [b for b in beans if b.get("chain_id") == chain_id]
        label = CHAIN_LABELS[chain_id]
        lines.append(f"## {label}（{by_chain[chain_id]} 品目）")
        lines.append("")
        lines.append("| # | 商品名 | 容量 | 価格 | 焙煎 | 購入URL |")
        lines.append("|---|--------|------|------|------|---------|")
        for i, b in enumerate(chain_beans, 1):
            weight = b.get("weight_g")
            weight_s = f"{weight}g" if weight else "-g"
            price = b.get("price_jpy")
            price_s = f"¥{price:,}" if price else "-"
            url = b.get("buy_url", "")
            link = f"[link]({url})" if url else "-"
            name = b.get("name", "").replace("|", "\\|")
            lines.append(
                f"| {i} | {name} | {weight_s} | {price_s} | {roast_label(b)} | {link} |"
            )
        lines.append("")
    (DOCS / "CATALOG.md").write_text("\n".join(lines), encoding="utf-8")


def enrich_cdn_urls(beans: list[dict]) -> None:
    cfg = load_r2_config()
    public_base = cfg.get("public_base_url", "")
    key_prefix = cfg.get("key_prefix", "beans")
    if not public_base:
        return
    for bean in beans:
        local = bean.get("image_local")
        if local:
            url = image_cdn_url(local, public_base, key_prefix)
            if url:
                bean["image_cdn_url"] = url


def load_raw(chain_id: str) -> list[dict]:
    path = SCRAPED / chain_id / "beans_raw.json"
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, list) else data.get("beans", [])


def load_mvp_seeds() -> list[dict]:
    beans: list[dict] = []
    for chain_id in CHAINS:
        path = SEEDS / f"{chain_id}.beans.seed.json"
        if not path.exists():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        beans.extend(data.get("beans", []))
    return beans


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    jst = timezone(timedelta(hours=9))
    now = datetime.now(jst).isoformat()

    all_raw: list[dict] = []
    by_chain: dict[str, int] = {}
    for chain_id in CHAINS:
        items = load_raw(chain_id)
        by_chain[chain_id] = len(items)
        for item in items:
            item.setdefault("chain_id", chain_id)
        all_raw.extend(items)

    img_stats = ensure_bean_images(all_raw, delay_s=0.2)
    print(
        "ensure images:",
        f"ok={img_stats.ok}",
        f"linked={img_stats.linked}",
        f"downloaded={img_stats.downloaded}",
        f"normalized={img_stats.normalized}",
        f"failed={len(img_stats.failed)}",
    )
    if img_stats.failed:
        print("  missing downloads:", ", ".join(img_stats.failed[:10]))

    linked = link_local_bean_images(all_raw)
    if linked:
        print(f"linked {linked} on-disk bean images")

    image_issues = validate_bean_images(all_raw)
    if image_issues:
        print(f"ERROR: {len(image_issues)} bean image(s) missing on disk after ensure step")
        for issue in image_issues[:10]:
            print(f"  - {issue}")
        if len(image_issues) > 10:
            print(f"  ... and {len(image_issues) - 10} more")
        raise SystemExit(1)

    enrich_cdn_urls(all_raw)
    mvp = load_mvp_seeds()
    enrich_cdn_urls(mvp)

    full_payload = {
        "version": "0.1.0",
        "generated_at": now,
        "count": len(all_raw),
        "by_chain": by_chain,
        "beans": all_raw,
    }
    mvp_payload = {
        "version": "0.1.0",
        "generated_at": now,
        "count": len(mvp),
        "beans": mvp,
    }

    (OUT / "beans.json").write_text(
        json.dumps(full_payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (OUT / "mvp_beans.json").write_text(
        json.dumps(mvp_payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    write_catalog_md(all_raw, by_chain, now)
    print(f"catalog: {len(all_raw)} beans -> {OUT / 'beans.json'}")
    print(f"mvp:     {len(mvp)} beans -> {OUT / 'mvp_beans.json'}")
    print(f"docs:    {DOCS / 'CATALOG.md'}")
    print("by_chain:", by_chain)

    from enrich_episodes import enrich_catalog, enrich_mvp  # noqa: E402

    enrich_catalog()
    enrich_mvp()

    # Sync bean images to Next.js public folder for /beans/* URLs
    import subprocess

    sync_script = ROOT / "scripts" / "sync-bean-images.mjs"
    if sync_script.exists():
        subprocess.run(["node", str(sync_script)], cwd=ROOT, check=True)
        subprocess.run(["node", str(ROOT / "scripts" / "sync-web-beans.mjs")], cwd=ROOT, check=True)


if __name__ == "__main__":
    main()
