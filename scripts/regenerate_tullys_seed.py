#!/usr/bin/env python3
"""Regenerate tullys.beans.seed.json from merged beans_raw.json."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "scraped" / "tullys" / "beans_raw.json"
SEED = ROOT / "data" / "seeds" / "tullys.beans.seed.json"

PREFERRED = [
    "ハウスブレンド",
    "アニバーサリーブレンド",
    "キリマンジャロ",
    "コスタリカ",
    "エスプレッソクラシコ",
    "モカジャバ",
]


def slugify(name: str) -> str:
    s = re.sub(r"[^\w\-]+", "-", name.lower(), flags=re.UNICODE)
    return re.sub(r"-+", "-", s).strip("-")[:60] or "item"


def score_from_flavor(tags: list[str]) -> dict:
    acidity = body = bitterness = sweetness = 50
    for tag in tags:
        if tag in ("柑橘", "明るい", "すっきり"):
            acidity += 15
        if tag in ("チョコ", "コク", "複雑"):
            body += 10
            bitterness += 8
        if tag in ("甘み", "カラメル", "まろやか"):
            sweetness += 10
    clamp = lambda v: max(20, min(80, v))
    return {
        "acidity": clamp(acidity),
        "body": clamp(body),
        "bitterness": clamp(bitterness),
        "sweetness": clamp(sweetness),
    }


def main() -> None:
    raw = json.loads(RAW.read_text(encoding="utf-8"))
    beans = raw["beans"]
    picked: list[dict] = []
    used_ids: set[str] = set()

    for key in PREFERRED:
        for b in beans:
            pid = b["product_id"]
            if key in b["name"] and pid not in used_ids:
                picked.append(b)
                used_ids.add(pid)
                break
        if len(picked) >= 3:
            break

    seed_beans = []
    for b in picked[:3]:
        tags = b.get("flavor_tags") or []
        scores = score_from_flavor(tags)
        seed_beans.append({
            "id": f"tullys-{slugify(b['name'])}",
            "chain_id": "tullys",
            "name": b["name"],
            "description": (b.get("description") or b["name"])[:200],
            "roast_level": "medium",
            "roast_label_ja": "",
            "taste_label_ja": "・".join(tags[:2]),
            "origin": b.get("origin_countries") or ["ブレンド"],
            "flavor_tags": tags,
            **scores,
            "caffeine": "decaf" if "デカフェ" in b["name"] else "medium",
            "price_jpy": b.get("price_jpy"),
            "weight_g": b.get("weight_g"),
            "buy_url": b.get("buy_url"),
            "image_url": b.get("image_url"),
            "image_local": b.get("image_local"),
            "product_id": b["product_id"],
            "availability": b.get("availability", ["store"]),
            "source": "scraped",
            "available": True,
        })

    payload = {
        "version": "0.1.0",
        "chain_id": "tullys",
        "scraped_at": raw.get("scraped_at"),
        "source": raw.get("sources", [raw.get("source")]),
        "beans": seed_beans,
    }
    SEED.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(seed_beans)} MVP seeds:", [b["name"] for b in seed_beans])


if __name__ == "__main__":
    main()
