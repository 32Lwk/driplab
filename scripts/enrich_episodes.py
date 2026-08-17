#!/usr/bin/env python3
"""Generate official-style episode text for all catalog beans."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRAPED = ROOT / "data" / "scraped"
EPISODES = ROOT / "data" / "episodes"
CATALOG = ROOT / "data" / "catalog" / "beans.json"
SUPPLEMENTS = ROOT / "data" / "catalog" / "supplements"

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

CHAIN_SITES = {
    "starbucks": "https://www.starbucks.co.jp/hellocoffee/know/index.html",
    "maruyama": "https://official.maruyamacoffee.com/",
    "doutor": "https://www.doutor.co.jp/",
    "tullys": "https://www.tullys.co.jp/",
    "kaldi": "https://www.kaldi.co.jp/",
    "ucc": "https://store.ucc.co.jp/",
    "hoshino": "https://hoshinocoffee.com/",
    "ogawa": "https://oc-shop.co.jp/",
    "sarutahiko": "https://sarutahiko.jp/",
    "bluebottle": "https://store.bluebottlecoffee.jp/",
    "saza": "https://saza.coffee/",
}

CHAIN_VOICE = {
    "starbucks": (
        "スターバックスは「コーヒーの木から一杯のカップまで」の旅を大切にし、"
        "産地とのつながりと焙煎の技術で風味を引き出しています。"
    ),
    "maruyama": (
        "丸山コーヒーは「美味しさで癒しと幸せを創る」を掲げ、"
        "世界で見つけた良質な豆を独自の焙煎技術で最高の一杯に仕上げています。"
    ),
    "doutor": (
        "ドトールコーヒーは1960年代から続くチェーンコーヒーのパイオニアとして、"
        "香り高くバランスの取れたブレンドを国内自社工場で焙煎しています。"
    ),
    "tullys": (
        "タリーズコーヒーはシアトル発のスペシャルティコーヒー文化を日本に広げ、"
        "ハンドクラフトの抽出と厳選した豆を提供しています。"
    ),
    "kaldi": (
        "カルディコーヒーファームは世界各国から豆を直輸入し、"
        "店舗焙煎で香り立つ一杯を届ける輸入コーヒー専門店です。"
    ),
    "ucc": (
        "UCC上島珈琲は1933年の創業以来、"
        "コーヒーの研究と焙煎技術で日本のコーヒー文化を支えてきました。"
    ),
    "hoshino": (
        "星乃珈琲店は直火焙煎にこだわり、"
        "喫茶店文化を大切にした深みのある一杯を届けています。"
    ),
    "ogawa": (
        "小川珈琲は1920年京都で創業し、"
        "伝統と革新の焙煎で日本のスペシャルティコーヒーを牽引しています。"
    ),
    "sarutahiko": (
        "猿田彦珈琲は東京・恵比寿発のスペシャルティコーヒー専門店として、"
        "厳選した生豆を自家焙煎で丁寧に仕上げています。"
    ),
    "bluebottle": (
        "ブルーボトルコーヒーは鮮度と品質にこだわり、"
        "産地の個性を活かしたスペシャルティコーヒーを届けています。"
    ),
    "saza": (
        "サザコーヒーは1970年創業の老舗焙煎店として、"
        "産地直送の生豆を自社焙煎し、将軍珈琲をはじめ個性ある一杯を届けています。"
    ),
}


def load_episode_index() -> dict[tuple[str, str], dict]:
    """Detailed episodes from data/episodes/{chain}.json (official page fetch)."""
    index: dict[tuple[str, str], dict] = {}
    if not EPISODES.exists():
        return index
    for path in EPISODES.glob("*.json"):
        data = json.loads(path.read_text(encoding="utf-8"))
        chain_id = data.get("chain_id", path.stem)
        for b in data.get("beans", []):
            name = b.get("name", "")
            index[(chain_id, name)] = b
            pid = str(b.get("product_id", ""))
            if pid:
                index[(chain_id, pid)] = b
    return index


def load_supplement_index() -> dict[tuple[str, str], dict]:
    """Curated taste_notes and processing from data/catalog/supplements/."""
    index: dict[tuple[str, str], dict] = {}
    if not SUPPLEMENTS.exists():
        return index
    for path in SUPPLEMENTS.glob("*.json"):
        data = json.loads(path.read_text(encoding="utf-8"))
        chain_id = data.get("chain_id", path.stem)
        for b in data.get("beans", []):
            pid = str(b.get("product_id", ""))
            if pid:
                index[(chain_id, pid)] = b
    return index


def clean_supplement_text(text: str) -> str:
    if not text:
        return ""
    text = text.strip()
    if text == "不明":
        return text
    return clean_text(text).strip()


def apply_supplement(bean: dict, supplement: dict | None) -> None:
    if not supplement:
        return
    taste = supplement.get("taste_notes")
    if isinstance(taste, str) and taste.strip():
        cleaned = clean_supplement_text(taste)
        if cleaned:
            bean["taste_notes"] = cleaned
    processing = supplement.get("processing")
    if isinstance(processing, str) and processing.strip():
        bean["processing"] = processing.strip()


def load_scraped_index() -> dict[tuple[str, str], dict]:
    """Index raw beans by (chain_id, name) and product_id."""
    index: dict[tuple[str, str], dict] = {}
    for chain_id in CHAINS:
        path = SCRAPED / chain_id / "beans_raw.json"
        if not path.exists():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        beans = data if isinstance(data, list) else data.get("beans", [])
        for b in beans:
            name = b.get("name", "")
            index[(chain_id, name)] = b
            pid = str(b.get("product_id", ""))
            if pid:
                index[(chain_id, pid)] = b
    return index


def strip_embedded_css(text: str) -> str:
    if not text:
        return ""
    result = re.sub(r"/\*.*?\*/", " ", text, flags=re.DOTALL)
    result = re.sub(r"@charset[^;]+;", " ", result, flags=re.I)
    media_re = re.compile(
        r"@media[^{]*\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}", re.I
    )
    rule_re = re.compile(
        r"(?:[.#][\w-]+(?:[^{]*?)?)\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}"
    )
    at_re = re.compile(r"@[\w-]+[^{;]*(?:\{[^{}]*\}|;)", re.I)
    prev = None
    while prev != result:
        prev = result
        result = media_re.sub(" ", result)
        result = rule_re.sub(" ", result)
        result = at_re.sub(" ", result)
    result = re.sub(r"^\s*\}\s*", "", result.strip())
    return re.sub(r"\s+", " ", result).strip()


def contains_css_noise(text: str) -> bool:
    return bool(
        re.search(
            r"\.item_recommend|@media|\.recommend_|@charset|[.#][\w-]+\s*\{",
            text,
        )
    )


def clean_text(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = text.replace("`n", "\n").replace("\\n", "\n")
    text = strip_embedded_css(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def split_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[。！？])\s*", text)
    return [p.strip() for p in parts if p.strip()]


def pick_source(bean: dict, chain_id: str) -> str:
    for key in ("buy_url", "menu_url", "source"):
        val = bean.get(key)
        if val and str(val).startswith("http"):
            return str(val)
    return CHAIN_SITES.get(chain_id, "")


def strip_product_meta(text: str) -> str:
    """Remove common EC boilerplate prefixes and shop noise."""
    text = re.sub(r"^焙煎度\s*[^味]*味わい\s*\S+\s*", "", text)
    text = re.sub(r"^焙煎度\s*[:：]?\s*", "", text)
    text = re.sub(r"^味わい\s*[:：]?\s*", "", text)
    text = re.sub(r"＊まとめ買い対象[^＊]*＊", " ", text)
    text = re.sub(r"①[^。]*?還元", " ", text)
    text = re.sub(r"②[^。]*?還元", " ", text)
    text = re.sub(r"ポイント[０-９\d]+[％%]還元", " ", text)
    text = re.sub(r"(?:苦味|酸味|コク|香り)[：:\s]*[●○]+", " ", text)
    text = re.sub(r"▼[^\s。]*(?:ページ|こちら)[^\s。]*", " ", text)
    text = re.sub(r"・【大容量】[^。]+", " ", text)
    text = re.sub(r"【大容量】[^。]{0,80}", " ", text)
    text = re.sub(r"（まとめ買い対象）", " ", text)
    text = re.sub(r"人気No\.\d+\s*", " ", text)
    return text.strip()


def is_promo_sentence(sentence: str) -> bool:
    s = sentence.strip()
    if len(s) < 8:
        return True
    if re.match(r"^[①②]|^・【大容量】|^【大容量】|▼", s):
        return True
    if re.search(r"還元|まとめ買い|ポイントアップ|送料無料|お求めの方は", s):
        return True
    if re.match(r"^丸山コーヒーは「美味しさ", s):
        return True
    return False


def clean_story_text(text: str, chain_id: str = "") -> str:
    if not text:
        return ""
    text = clean_text(text)
    text = strip_product_meta(text)
    brand = CHAIN_VOICE.get(chain_id, "")
    if brand and brand in text:
        text = text.replace(brand, " ")
    sentences = split_sentences(text)
    kept = [s for s in sentences if not is_promo_sentence(s)]
    result = "".join(kept).strip()
    if len(result) > 320:
        result = result[:317] + "…"
    return result


def extract_body(bean: dict, raw: dict | None) -> str:
    for src in (bean, raw):
        if not src:
            continue
        for key in ("description", "og_description", "taste_comment", "flavor_notes"):
            val = src.get(key)
            if isinstance(val, str) and val.strip():
                cleaned = strip_product_meta(clean_text(val))
                if len(cleaned) >= 20:
                    return cleaned

    for src in (bean, raw):
        if not src:
            continue
        val = src.get("content")
        if isinstance(val, str) and val.strip():
            cleaned = strip_product_meta(clean_text(val))
            if len(cleaned) >= 20:
                return cleaned

    for src in (bean, raw):
        if not src:
            continue
        for key in ("taste_label_ja", "taste_balance", "body_label"):
            val = src.get(key)
            if isinstance(val, str) and val.strip():
                cleaned = clean_text(val)
                if len(cleaned) >= 8:
                    return cleaned

    name = bean.get("name", "このコーヒー")
    roast = bean.get("roast_label_ja") or bean.get("roast") or ""
    origin = bean.get("origin")
    if isinstance(origin, list):
        origin_s = "・".join(origin[:3])
    elif isinstance(origin, str):
        origin_s = origin
    else:
        origin_s = ""
    parts = [f"「{name}」"]
    if roast:
        parts.append(f"{roast}で")
    if origin_s:
        parts.append(f"{origin_s}の風味を楽しめる")
    parts.append("一杯です。")
    return "".join(parts)


def is_flavor_sentence(sentence: str) -> bool:
    s = sentence.strip()
    if len(s) > 90:
        return False
    if re.search(r"(?:のような)?風味[。.]?$", s):
        return True
    if re.search(r"^(?:軽やか|爽やか|すっきり|深い|豊か).*(?:味わい|風味)[。.]?$", s):
        return "特徴" not in s
    if re.search(r"^[^。]{4,40}な味わい[。.]?$", s) and not re.search(
        r"特徴|ブレンドです", s
    ):
        return True
    if len(s) < 40 and re.search(r"(?:深い|味わい深い)?コク[。.]?$", s):
        return True
    if re.search(r"^(?:[^、。]{2,30}、){1,4}[^、。]{2,30}[。.]?$", s):
        if re.search(r"風味|香り|コク|口当たり|ナッツ|チョコ|オレンジ|チェリー|フィグ", s):
            if not re.search(r"です|ます|ブレンド|農園|コーヒーで|一杯|進化|創|年代", s):
                return True
    if len(s) < 55 and "、" in s and re.search(
        r"風味|香り|ナッツ|チョコ|柑橘|ベリー|オレンジ|スパイス|キャラメル|フルーティ|コク|爽やか", s
    ):
        if not re.search(
            r"ブレンド|焙煎|創|イメージ|年代|進化|特徴|一杯|コーヒーで|スペシャルティ|です|ます|農園", s
        ):
            return True
    return False


def extract_farm_context(text: str) -> str:
    match = re.search(r"＜([^＞]+)＞", text)
    if not match:
        return ""
    label = match.group(1).strip()
    if len(label) < 4 or "容量" in label:
        return ""
    return label


# Curated narratives for products whose EC pages lack story text (official research).
NARRATIVE_OVERRIDES: dict[tuple[str, int], str] = {
    ("maruyama", 24): (
        "初めて丸山珈琲をご利用いただく方に、まずお試しいただきたい当社の定番ブレンドです。"
        "創業当時から時代に合わせて味わいを少しずつ進化させながら、香ばしい香りとすっきりとした後味は変えずにつくり続けています。"
    ),
    ("maruyama", 201): (
        "エスプレッソ向けに中深煎りで仕上げたブレンドコーヒー。"
        "ブラジルやホンジュラスなど旬の豆を時期に合わせて配合し、丸山珈琲の焙煎技術でまとまりのある一杯を目指しています。"
    ),
    ("maruyama", 1131): (
        "エルサルバドルやコスタリカなど中米産の豆を浅煎りでブレンド。"
        "時期に合わせて旬なコーヒーを配合し、透明感ある浅煎りならではの軽やかさを日常の一杯として届けています。"
    ),
    ("maruyama", 26): (
        "モカコーヒーがお好きな方におすすめの人気の定番ブレンド。"
        "丸山珈琲創業の地である軽井沢では、長く寒さの厳しい冬が終わり、最初に花をつけるのがすみれの花です。"
        "コーヒーはアカネ科の植物ということで、すみれの中でも「茜すみれ」と名付けました。"
    ),
    ("maruyama", 52): (
        "すっきりとした爽やかさに加え、チョコレートのような風味やコクのあるブレンド。"
        "暑い季節だけでなく、一年を通して人気の定番アイス用ブレンドです。"
    ),
    ("maruyama", 1935): (
        "スペイン語で「高い空」を意味するアルトシエロ。"
        "生産地の高く広い空のように、ゆったりとした時間の中でおいしいコーヒーを。"
        "エルサルバドルやニカラグアなど旬の豆を中深煎りで仕上げています。"
    ),
    ("maruyama", 1936): (
        "スペイン語で「高い空」を意味するアルトシエロ。"
        "生産地の高く広い空のように、ゆったりとした時間の中でおいしいコーヒーを。"
        "ブラジルやエルサルバドルなど旬の豆を中煎りでブレンドしています。"
    ),
    ("maruyama", 1937): (
        "スペイン語で「高い空」を意味するアルトシエロ。"
        "コーヒー生産地の高く広い空のように、ゆったりとした時間の流れの中でおいしいコーヒーを。"
        "深煎りはブラジルやホンジュラスなど旬の豆を配合しています。"
    ),
    ("maruyama", 3062): (
        "2001年、Cup of Excellence入賞豆の落札から始まった丸山珈琲とサマンバイア農園の関係。"
        "カンブライアさんは協同組合San Coffeeを設立し、持続可能なコーヒー生産と地域への貢献を続けています。"
    ),
    ("maruyama", 3089): (
        "ボリビアのアグリカフェ社が開設した2番目の自社農園。"
        "最古参スタッフのカルロス・マリアカさんに敬意を表し、その名前を冠しました。"
        "地域の小規模生産者支援にも力を入れています。"
    ),
}

TASTE_OVERRIDES: dict[tuple[str, int], str] = {
    ("maruyama", 201): (
        "チョコレートやナッツを彷彿とさせる風味。"
        "滑らかな質感と後味に甘さが続く。"
    ),
    ("maruyama", 3062): (
        "オレンジやチェリーを思わせる明るい酸味。"
        "ヌガーのようなやさしい甘さ。なめらかな口当たり。"
    ),
    ("maruyama", 3089): (
        "ダークチョコレートを思わせるコクのある苦味。"
        "ドライフルーツ（ドライフィグ）のような優しい甘さ。滑らかな口当たり。"
    ),
}

# Bulk SKUs inherit narrative from the standard pack.
BULK_NARRATIVE_SOURCE: dict[tuple[str, int], int] = {
    ("maruyama", 3030): 24,
    ("maruyama", 3031): 1131,
    ("maruyama", 3032): 26,
    ("maruyama", 3033): 52,
    ("maruyama", 3034): 1936,
    ("maruyama", 3035): 1935,
    ("maruyama", 3036): 1937,
}


def product_id_int(bean: dict) -> int | None:
    raw = bean.get("product_id")
    if isinstance(raw, int):
        return raw
    if isinstance(raw, str) and raw.isdigit():
        return int(raw)
    return None


def build_stories(bean: dict, raw: dict | None) -> tuple[str, str, str]:
    chain_id = bean.get("chain_id", "")
    pid = product_id_int(bean) or 0
    body = extract_body(bean, raw)
    sentences = split_sentences(strip_product_meta(clean_text(body)))

    narrative = [
        s for s in sentences if not is_flavor_sentence(s) and not is_promo_sentence(s)
    ]
    flavor = [s for s in sentences if is_flavor_sentence(s)]

    flavor_notes = clean_story_text(str(bean.get("flavor_notes") or ""), chain_id)
    if not flavor_notes and raw:
        flavor_notes = clean_story_text(str(raw.get("taste_comment") or ""), chain_id)
    if not flavor_notes and raw:
        flavor_notes = clean_story_text(str(raw.get("flavor_notes") or ""), chain_id)
    taste_notes = flavor_notes or clean_story_text("".join(flavor), chain_id)

    override_key = (chain_id, pid)
    if override_key in TASTE_OVERRIDES:
        taste_notes = TASTE_OVERRIDES[override_key]
    elif not taste_notes and flavor:
        taste_notes = clean_story_text("".join(flavor), chain_id)

    if chain_id == "ucc" and not taste_notes:
        body_text = extract_body(bean, raw)
        ucc_skip = (
            "UCC独自のブレンド",
            "ブレンド技術",
            "焙煎技術",
            "サステナブル",
            "味覚設計",
        )
        for chunk in reversed(re.split(r"◆", body_text)):
            chunk = chunk.strip()
            if (
                8 <= len(chunk) < 90
                and re.search(r"のような|風味|甘さ|コク|苦|香|余韻|ほろ苦", chunk)
                and not any(marker in chunk for marker in ucc_skip)
            ):
                taste_notes = clean_story_text(chunk.rstrip("。") + "。", chain_id)
                break

    if chain_id == "hoshino" and not taste_notes:
        label = bean.get("taste_label_ja") or (raw.get("taste_label_ja") if raw else "")
        tags = bean.get("flavor_tags") or (raw.get("flavor_tags") if raw else []) or []
        bits: list[str] = []
        if isinstance(label, str) and label.strip():
            bits.append(label.strip())
        if tags:
            bits.append("、".join(str(t) for t in tags[:4]))
        if bits:
            taste_notes = clean_story_text("。".join(bits) + "。", chain_id)

    product_story = clean_story_text("".join(narrative[:4]), chain_id)
    if not product_story:
        product_story = clean_story_text(body, chain_id)

    if not product_story:
        product_story = clean_story_text(extract_body(bean, raw), chain_id)

    if override_key in NARRATIVE_OVERRIDES:
        product_story = NARRATIVE_OVERRIDES[override_key]
    elif (chain_id, pid) in BULK_NARRATIVE_SOURCE:
        src_pid = BULK_NARRATIVE_SOURCE[(chain_id, pid)]
        if (chain_id, src_pid) in NARRATIVE_OVERRIDES:
            product_story = NARRATIVE_OVERRIDES[(chain_id, src_pid)]
    elif len(product_story) < 50:
        farm = extract_farm_context(body)
        if farm and farm not in product_story:
            roast = bean.get("roast_label_ja") or bean.get("roast") or ""
            roast_s = f"{roast}で" if roast else ""
            prefix = f"＜{farm}＞のシングルオリジン。{roast_s}"
            product_story = prefix + product_story
        if len(product_story) < 50 and narrative:
            extra = clean_story_text("".join(narrative), chain_id)
            if extra and len(extra) > len(product_story):
                product_story = extra

    source = pick_source(bean, chain_id)
    if raw:
        source = pick_source(raw, chain_id) or source

    return product_story, taste_notes, source


def build_episode(bean: dict, raw: dict | None) -> tuple[str, str]:
    episode, _, source = build_stories(bean, raw)
    return episode, source


def clean_bean_source_fields(bean: dict) -> None:
    for key in ("description", "og_description", "flavor_notes"):
        if isinstance(bean.get(key), str):
            bean[key] = clean_text(bean[key])


def enrich_catalog() -> None:
    scraped = load_scraped_index()
    detailed = load_episode_index()
    supplements = load_supplement_index()
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    beans = catalog.get("beans", [])

    for bean in beans:
        chain_id = bean.get("chain_id", "")
        name = bean.get("name", "")
        pid = str(bean.get("product_id", ""))
        pid_int = product_id_int(bean) or 0
        has_override = (chain_id, pid_int) in NARRATIVE_OVERRIDES or (
            chain_id,
            pid_int,
        ) in BULK_NARRATIVE_SOURCE
        clean_bean_source_fields(bean)

        raw = scraped.get((chain_id, name)) or (
            scraped.get((chain_id, pid)) if pid else None
        )
        episode, taste_notes, source = build_stories(bean, raw)

        ep = detailed.get((chain_id, name)) or (
            detailed.get((chain_id, pid)) if pid else None
        )
        if ep:
            if ep.get("extra_images"):
                bean["extra_images"] = ep["extra_images"]
            if ep.get("taste_notes") and not supplements.get((chain_id, pid)):
                cleaned_taste = clean_story_text(ep["taste_notes"], chain_id)
                if cleaned_taste:
                    taste_notes = cleaned_taste
            if ep.get("episode") and not has_override:
                cleaned = clean_story_text(ep["episode"], chain_id)
                if (
                    cleaned
                    and not is_flavor_sentence(cleaned)
                    and not contains_css_noise(cleaned)
                    and (
                        len(cleaned) > len(episode) * 1.15
                        or len(episode) < 80
                    )
                ):
                    episode = cleaned
                    source = ep.get("episode_source") or source

        bean["episode"] = episode
        bean["episode_source"] = source
        if taste_notes and taste_notes != episode:
            bean["taste_notes"] = taste_notes
        elif "taste_notes" in bean and not supplements.get((chain_id, pid)):
            del bean["taste_notes"]

        apply_supplement(bean, supplements.get((chain_id, pid)))

    catalog["beans"] = beans
    CATALOG.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Enriched {len(beans)} beans with episodes -> {CATALOG}")


def enrich_mvp() -> None:
    mvp_path = ROOT / "data" / "catalog" / "mvp_beans.json"
    if not mvp_path.exists():
        return
    scraped = load_scraped_index()
    detailed = load_episode_index()
    supplements = load_supplement_index()
    catalog = json.loads(mvp_path.read_text(encoding="utf-8"))
    beans = catalog.get("beans", [])
    for bean in beans:
        chain_id = bean.get("chain_id", "")
        name = bean.get("name", "")
        pid = str(bean.get("product_id", ""))
        clean_bean_source_fields(bean)
        raw = scraped.get((chain_id, name)) or (
            scraped.get((chain_id, pid)) if pid else None
        )
        episode, taste_notes, source = build_stories(bean, raw)
        ep = detailed.get((chain_id, name)) or (
            detailed.get((chain_id, pid)) if pid else None
        )
        if ep:
            if ep.get("extra_images"):
                bean["extra_images"] = ep["extra_images"]
            if ep.get("taste_notes") and not supplements.get((chain_id, pid)):
                cleaned_taste = clean_story_text(ep["taste_notes"], chain_id)
                if cleaned_taste:
                    taste_notes = cleaned_taste
            if ep.get("episode"):
                cleaned = clean_story_text(ep["episode"], chain_id)
                if (
                    cleaned
                    and not is_flavor_sentence(cleaned)
                    and not contains_css_noise(cleaned)
                    and (
                        len(cleaned) > len(episode) * 1.15
                        or len(episode) < 80
                    )
                ):
                    episode = cleaned
                    source = ep.get("episode_source") or source
        bean["episode"] = episode
        bean["episode_source"] = source
        if taste_notes and taste_notes != episode:
            bean["taste_notes"] = taste_notes
        apply_supplement(bean, supplements.get((chain_id, pid)))
    catalog["beans"] = beans
    mvp_path.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Enriched {len(beans)} MVP beans with episodes -> {mvp_path}")


if __name__ == "__main__":
    enrich_catalog()
    enrich_mvp()
