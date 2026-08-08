import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "data" / "scraped"
for cid in ["doutor", "starbucks", "maruyama", "tullys", "kaldi"]:
    p = ROOT / cid / "beans_raw.json"
    d = json.loads(p.read_text(encoding="utf-8"))
    beans = d if isinstance(d, list) else d["beans"]
    print(f"=== {cid} ({len(beans)}) ===")
    out_lines = []
    for b in beans:
        price = b.get("price_jpy")
        ps = f"JPY {price}" if price else "JPY -"
        out_lines.append(f"  - {b['name']} | {b.get('weight_g')}g | {ps}")
    print("\n".join(out_lines))
    print()
