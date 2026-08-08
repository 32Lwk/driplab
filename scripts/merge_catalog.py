#!/usr/bin/env python3
"""Merge per-chain scraped data and MVP seeds into unified catalogs."""
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRAPED = ROOT / "data" / "scraped"
SEEDS = ROOT / "data" / "seeds"
OUT = ROOT / "data" / "catalog"
CHAINS = ["doutor", "starbucks", "maruyama", "tullys", "kaldi"]


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

    mvp = load_mvp_seeds()

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
    print(f"catalog: {len(all_raw)} beans -> {OUT / 'beans.json'}")
    print(f"mvp:     {len(mvp)} beans -> {OUT / 'mvp_beans.json'}")
    print("by_chain:", by_chain)


if __name__ == "__main__":
    main()
