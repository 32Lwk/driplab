#!/usr/bin/env python3
"""Merge data/episodes/{chain}.json into catalog beans.json."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EPISODES = ROOT / "data" / "episodes"
CATALOG = ROOT / "data" / "catalog" / "beans.json"
MVP = ROOT / "data" / "catalog" / "mvp_beans.json"

if str(ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(ROOT / "scripts"))

from r2_utils import image_cdn_url, load_r2_config  # noqa: E402


def load_episode_index() -> dict[tuple[str, str], dict]:
    index: dict[tuple[str, str], dict] = {}
    for path in EPISODES.glob("*.json"):
        data = json.loads(path.read_text(encoding="utf-8"))
        chain_id = data.get("chain_id", path.stem)
        for b in data.get("beans", []):
            name = b.get("name", "")
            pid = str(b.get("product_id", ""))
            index[(chain_id, name)] = b
            if pid:
                index[(chain_id, pid)] = b
    return index


def apply_to_catalog(path: Path, index: dict[tuple[str, str], dict]) -> int:
    if not path.exists():
        return 0
    catalog = json.loads(path.read_text(encoding="utf-8"))
    beans = catalog.get("beans", [])
    cfg = load_r2_config()
    public_base = cfg.get("public_base_url", "")
    key_prefix = cfg.get("key_prefix", "beans")
    updated = 0

    for bean in beans:
        chain_id = bean.get("chain_id", "")
        name = bean.get("name", "")
        pid = str(bean.get("product_id", ""))
        ep = index.get((chain_id, name)) or (
            index.get((chain_id, pid)) if pid else None
        )
        if not ep:
            continue

        if ep.get("episode"):
            bean["episode"] = ep["episode"]
            updated += 1
        if ep.get("episode_source"):
            bean["episode_source"] = ep["episode_source"]
        if ep.get("image_url"):
            bean["image_url"] = ep["image_url"]
        if ep.get("image_local"):
            bean["image_local"] = ep["image_local"]
            if public_base:
                cdn = image_cdn_url(ep["image_local"], public_base, key_prefix)
                if cdn:
                    bean["image_cdn_url"] = cdn
        if ep.get("extra_images"):
            bean["extra_images"] = ep["extra_images"]

    catalog["beans"] = beans
    path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    return updated


def main() -> None:
    index = load_episode_index()
    if not index:
        print("No episode files in data/episodes/")
        return
    n1 = apply_to_catalog(CATALOG, index)
    n2 = apply_to_catalog(MVP, index)
    print(f"Merged episodes: beans.json={n1}, mvp_beans.json={n2}")


if __name__ == "__main__":
    main()
