#!/usr/bin/env python3
"""Fetch detailed episodes and images from official product pages (all chains)."""
from __future__ import annotations

import html as html_module
import json
import re
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import urljoin, urlparse

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
SCRAPED = ROOT / "data" / "scraped"
OUT_DIR = ROOT / "data" / "episodes"
IMAGES = ROOT / "data" / "images"
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
    "saza",
]
KALDI_SITE = "https://www.kaldi.co.jp/"

JST = timezone(timedelta(hours=9))

try:
    import httpx
    from bs4 import BeautifulSoup
except ImportError:
    print("Install: pip install httpx beautifulsoup4 lxml", file=sys.stderr)
    sys.exit(1)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ja,en;q=0.9",
}

STARBUCKS_KNOW_URL = "https://www.starbucks.co.jp/hellocoffee/know/index.html"
STARBUCKS_BRAND_VOICE = (
    "スターバックスは「コーヒーの木から一杯のカップまで」の旅を大切にし、"
    "産地とのつながりと焙煎の技術で風味を引き出しています。"
)

CHAIN_VOICE = {
    "starbucks": STARBUCKS_BRAND_VOICE,
    "maruyama": (
        "丸山コーヒーは「美味しさで癒しと幸せを創る」を掲げ、"
        "世界で見つけた良質な豆を独自の焙煎技術で最高の一杯に仕上げています。"
    ),
    "tullys": (
        "タリーズコーヒーはシアトル発のスペシャルティコーヒー文化を日本に広げ、"
        "ハンドクラフトの抽出と厳選した豆を提供しています。"
    ),
    "ucc": (
        "UCC上島珈琲は1925年の創業以来、ブレンド技術と焙煎技術で"
        "一杯のコーヒーの価値を高め続けています。"
    ),
    "hoshino": (
        "星乃珈琲店は1963年創業の老舗喫茶店ブランド。"
        "シティローストを基調に、香りとコクのバランスを大切にした一杯を提供しています。"
    ),
    "ogawa": (
        "小川珈琲は1920年創業。産地との直接取引と焙煎技術で、"
        "コーヒーの持つ個性を丁寧に引き出しています。"
    ),
    "sarutahiko": (
        "猿田彦珈琲は恵比寿発のスペシャルティコーヒー。"
        "産地の個性と焙煎の妙を活かした、丁寧な一杯を届けています。"
    ),
    "saza": (
        "サザコーヒーは茨城・水戸を拠点に、産地直送の生豆を自社焙煎。"
        "将軍珈琲をはじめ、スペシャルティとブレンドの幅広い豆を届けています。"
    ),
}


def load_chain_beans(chain_id: str) -> list[dict]:
    path = SCRAPED / chain_id / "beans_raw.json"
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    beans = data if isinstance(data, list) else data.get("beans", [])
    for b in beans:
        b.setdefault("chain_id", chain_id)
    return beans


def clean_text(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", " ", text)
    text = re.sub(r"@media[^{]+\{[^}]+\}", " ", text)
    text = re.sub(r"@charset[^;]+;", " ", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"▼[^。]*?。", "", text)
    text = re.sub(r"▼.*", "", text)
    text = re.sub(r"・【[^】]+】[^。]*", "", text)
    text = re.sub(r"＊まとめ買い対象[^＊]*＊", "", text)
    text = re.sub(r"＊まとめ買い対象 ポイントアップ＊.*?(?=透明|すっき|モカ|人気|創業|都会|リゾ|丸山|アルト|ジャス|＜|苦味|$)", "", text)
    text = re.sub(r"苦味：●+.*?(?=創業|モカ|人気|すっきり|$)", "", text)
    for marker in ("-->", "/* おすすめテンプレ */", "/* 焙煎珈琲レコメンド */"):
        idx = text.find(marker)
        if idx >= 0:
            text = text[idx + len(marker) :].strip()
    return text.strip()


def meta_content(soup: BeautifulSoup, *keys: str) -> str:
    for key in keys:
        tag = soup.find("meta", attrs={"property": key}) or soup.find(
            "meta", attrs={"name": key}
        )
        if tag and tag.get("content"):
            return clean_text(tag["content"])
    return ""


def find_product_images(soup: BeautifulSoup, base_url: str, chain_id: str = "") -> list[str]:
    urls: list[str] = []
    og = meta_content(soup, "og:image")
    if og and "logo" not in og.lower():
        urls.append(og if og.startswith("http") else urljoin(base_url, og))

    if chain_id == "maruyama":
        gallery = soup.select_one(".productDetailInfoGallery, .js-productDetailInfoGallery")
        if gallery:
            for item in gallery.select("[style*='background-image']"):
                style = item.get("style") or ""
                m = re.search(r"url\(['\"]?([^'\"]+)['\"]?\)", style)
                if not m:
                    continue
                full = m.group(1) if m.group(1).startswith("http") else urljoin(base_url, m.group(1))
                if full not in urls:
                    urls.append(full)
        if urls:
            return urls[:12]

    img_scope = soup
    if chain_id == "doutor":
        gallery = soup.select_one(".DoutorProductDetail__Image")
        if gallery:
            img_scope = gallery
    elif chain_id == "tullys":
        gallery = soup.select_one(".thumbnail__pic_image")
        if gallery:
            img_scope = gallery

    selectors = "img[src*='save_image'], img[src*='sku_images'], img[src*='/ec/img/']"
    if chain_id == "tullys":
        selectors += ", .thumbnail__pic_image img, img[src*='/menu/uploads/']"

    for img in img_scope.select(selectors):
        src = img.get("src") or img.get("data-src") or ""
        if not src or "logo" in src.lower():
            continue
        full = src if src.startswith("http") else urljoin(base_url, src)
        if full not in urls:
            urls.append(full)

    return urls[:12 if chain_id == "maruyama" else 5]


def strip_itoen_boilerplate(text: str) -> str:
    text = re.sub(r"＜大量注文をご希望のお客様へ＞.*?(?=新しい|心地|シトラス|チョコ|マウンテン|フルーティ|タリーズ|豊か|すっきり|軽やか|華やか|デカフェ|アイス|$)", "", text)
    text = re.sub(r"おひとり様\s*\d+\s*回\s*\d+\s*個までご購入.*?(?=新しい|軽やか|華やか|$)", "", text)
    text = re.sub(r"^[^。]*?\d{1,3}(?:,\d{3})*\s*円\s*\(税込\)\s*", "", text)
    text = re.sub(r"生豆生産国名\s*.*?(?=ティスティングワード|すっきり感|数量|$)", "", text)
    text = re.sub(r"ティスティングワード\s*[^。]+", "", text)
    text = re.sub(r"すっきり感\s*ボディ\s*数量\s*カートに入れる.*", "", text)
    text = re.sub(r"お気に入り.*", "", text)
    text = re.sub(r"＜NEW CROPとは＞.*", "", text)
    return text.strip()


def strip_doutor_boilerplate(text: str) -> str:
    text = re.sub(r"^焙煎度\s*[^味]*", "", text)
    text = re.sub(r"^味わい\s*[\S\s]*?(?=ドトール|モカ|黒糖|香ば|国内|オンライン|※|＜|時間|カフェイン|深煎|野性|レモン|ストロ|ブルー|チョコ|イチジク|深煎り|カフェイン)", "", text)
    text = re.sub(r"アイスコーヒーにもおすすめ\s*", "", text)
    text = re.sub(r"※鮮度と風味を保つ.*", "", text)
    text = re.sub(r"＜容量＞.*", "", text)
    text = re.sub(r"時間を気にせず楽しめるコーヒー\s*", "", text)
    return text.strip()


def extract_doutor_meta(soup: BeautifulSoup) -> list[str]:
    content = soup.select_one(".DoutorProductDetail__Content")
    if not content:
        return []
    lines = [ln.strip() for ln in content.get_text("\n", strip=True).split("\n") if ln.strip()]
    sentences: list[str] = []
    roast_val = taste_val = ""
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("焙煎度") or line == "焙煎度":
            roast_val = line.replace("焙煎度", "").strip() or (
                lines[i + 1].strip() if i + 1 < len(lines) else ""
            )
            if not line.replace("焙煎度", "").strip() and roast_val:
                i += 1
        elif line.startswith("味わい") or line == "味わい":
            taste_val = line.replace("味わい", "").strip() or (
                lines[i + 1].strip() if i + 1 < len(lines) else ""
            )
            if not line.replace("味わい", "").strip() and taste_val:
                i += 1
        i += 1

    taste_val = re.sub(r"アイスコーヒーにもおすすめ\s*", "", taste_val).strip()
    if roast_val and taste_val:
        sentences.append(f"{roast_val}で、{taste_val}の味わい。")
    elif roast_val:
        sentences.append(f"焙煎度は{roast_val}。")

    if any("アイスコーヒーにもおすすめ" in ln for ln in lines):
        sentences.append("アイスコーヒーにもおすすめです。")
    return sentences


def fetch_starbucks_brand_context(client: httpx.Client) -> str:
    try:
        resp = client.get(STARBUCKS_KNOW_URL)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")
        desc = meta_content(soup, "og:description", "description")
        if desc and len(desc) >= 20:
            return desc
    except Exception as e:
        print(f"  hellocoffee/know fetch fail: {e}")
    return STARBUCKS_BRAND_VOICE


def extract_starbucks_page(html: str, raw: dict) -> tuple[str, list[str], list[str]]:
    """Return (description, product images, supplemental sentences)."""
    description = ""
    extra_sentences: list[str] = []
    images: list[str] = []
    pid = str(raw.get("product_id", ""))

    soup = BeautifulSoup(html, "lxml")
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
            if data.get("@type") != "Product":
                continue
            if data.get("description"):
                description = clean_text(str(data["description"]))
            imgs = data.get("image") or []
            if isinstance(imgs, str):
                imgs = [imgs]
            images.extend(imgs)
        except (json.JSONDecodeError, TypeError):
            continue

    match = re.search(r'data-page="([^"]+)"', html)
    if match:
        try:
            page_data = json.loads(html_module.unescape(match.group(1)))
            src = page_data["props"]["data"]["_source"]
            if not description:
                description = clean_text(src.get("description", ""))
            memo = clean_text(src.get("memo", ""))
            if memo and memo not in description:
                extra_sentences.append(memo if memo.endswith("。") else f"{memo}。")
        except (json.JSONDecodeError, KeyError, TypeError):
            pass

    taste = clean_text(str(raw.get("taste_label_ja", "")))
    if taste and taste not in description and len(taste) >= 12:
        if not taste.endswith("。"):
            taste = f"{taste}。"
        if taste not in extra_sentences:
            extra_sentences.append(taste)

    og_img = meta_content(soup, "og:image")
    if og_img:
        full = og_img if og_img.startswith("http") else urljoin(raw.get("buy_url", ""), og_img)
        if full not in images:
            images.insert(0, full)

    if pid:
        images = [u for u in images if pid in u]

    raw_img = raw.get("image_url")
    if raw_img and pid and pid in str(raw_img):
        if raw_img not in images:
            images.insert(0, raw_img)

    if not description:
        description = clean_text(str(raw.get("og_description", "")))

    return description, images, extra_sentences


def extract_maruyama_flavor_from_og(og: str) -> str:
    if not og:
        return ""
    m = re.search(r"香り[：:●○\s]+(.+?)(?:\s*▼|※|$)", og)
    if m:
        return clean_text(m.group(1))
    return ""


def extract_maruyama_comment(soup: BeautifulSoup) -> str:
    for sel in (".item_comment", "[class*='itemComment']", "[class*='Comment']"):
        el = soup.select_one(sel)
        if not el:
            continue
        text = clean_text(el.get_text(" ", strip=True))
        if len(text) >= 20 and not text.startswith("＊まとめ買い"):
            return text
    return ""


def parse_maruyama_og(og: str) -> str:
    if not og:
        return ""
    text = clean_text(og)
    text = re.sub(r"苦味[：:●○\s].*?(?=香り[：:]|$)", "", text)
    flavor = extract_maruyama_flavor_from_og(og)
    if flavor:
        text = re.sub(r"香り[：:●○\s]+.+", "", text).strip()
        if flavor not in text:
            if not text.endswith("。"):
                text = f"{text} {flavor}。" if text else f"{flavor}。"
            elif flavor not in text:
                text = f"{text} {flavor}。"
    return text.strip()


def extract_maruyama_page(html: str, raw: dict) -> tuple[str, list[str]]:
    soup = BeautifulSoup(html, "lxml")
    comment = extract_maruyama_comment(soup)
    og = meta_content(soup, "og:description", "description")
    flavor = extract_maruyama_flavor_from_og(og) or clean_text(str(raw.get("flavor_notes", "")))
    flavor = re.sub(r"▼大容量.*", "", flavor).strip()

    parts: list[str] = []
    if comment:
        parts.append(comment)
    if flavor and flavor not in comment:
        if not flavor.endswith("。"):
            flavor = f"{flavor}。"
        parts.append(flavor)

    page_text = " ".join(parts).strip()
    if not page_text:
        page_text = parse_maruyama_og(og)
    if not page_text:
        page_text = extract_body_from_soup(soup, "maruyama", raw.get("buy_url", ""))
    if not page_text:
        page_text = clean_text(str(raw.get("description", "")))

    images = find_product_images(soup, raw.get("buy_url", ""), "maruyama")
    return page_text, images


def extract_body_from_soup(soup: BeautifulSoup, chain_id: str = "", page_url: str = "") -> str:
    selectors = (
        ".DoutorProductDetail__Content",
        ".common__description",
        ".product_detail",
        "#detail_description",
        ".item-description",
        ".product-description",
        "[class*='description']",
        "main",
    )
    for sel in selectors:
        el = soup.select_one(sel)
        if el:
            text = clean_text(el.get_text(" ", strip=True))
            if chain_id == "doutor":
                text = strip_doutor_boilerplate(text)
            elif chain_id == "tullys" and "shop.itoen" in page_url:
                text = strip_itoen_boilerplate(text)
            if len(text) >= 20:
                return text
    desc = meta_content(soup, "og:description", "description")
    if chain_id == "doutor":
        desc = strip_doutor_boilerplate(desc)
    elif chain_id == "tullys" and "shop.itoen" in page_url:
        desc = strip_itoen_boilerplate(desc)
    return desc


def fetch_page(
    client: httpx.Client,
    url: str,
    chain_id: str,
    raw: dict,
    *,
    starbucks_extra: list[str] | None = None,
) -> tuple[str, list[str]]:
    resp = client.get(url)
    resp.raise_for_status()
    if chain_id == "ucc":
        return extract_ucc_page(resp.text, raw)
    if chain_id == "hoshino":
        return extract_hoshino_page(resp.text, raw)
    if chain_id == "kaldi":
        return extract_kaldi_page(resp.text, raw)
    if chain_id == "maruyama":
        return extract_maruyama_page(resp.text, raw)
    if chain_id == "starbucks":
        description, images, extra = extract_starbucks_page(resp.text, raw)
        if starbucks_extra is not None:
            starbucks_extra.extend(extra)
        page_text = description
        if extra:
            page_text = f"{description} {' '.join(extra)}".strip()
        return page_text, images
    soup = BeautifulSoup(resp.text, "lxml")
    page_text = extract_body_from_soup(soup, chain_id, url)
    if chain_id == "doutor":
        meta = extract_doutor_meta(soup)
        if meta:
            page_text = "".join(meta) + page_text
    return page_text, find_product_images(soup, url, chain_id)


def extract_kaldi_page(html: str, raw: dict) -> tuple[str, list[str]]:
    from scrape_kaldi_beans import (  # noqa: WPS433
        parse_all_product_images,
        parse_description,
        table_field,
    )

    pid = str(raw.get("product_id", ""))
    taste = table_field(html, "テイストバランス")
    body = table_field(html, "ボディ")
    origin = table_field(html, "生豆生産国")
    page_text = parse_description(
        html,
        taste=taste,
        body=body,
        origin=origin,
        name=raw.get("name", ""),
    )
    page_text = clean_text(page_text)

    if len(page_text) < 80:
        meta_bits: list[str] = []
        roast = table_field(html, "ロースト")
        coffee_type = table_field(html, "コーヒーの種類")
        if roast:
            meta_bits.append(f"{roast}で焙煎された")
        if coffee_type:
            meta_bits.append(coffee_type)
        if origin:
            meta_bits.append(f"{origin}産")
        headline = page_text.rstrip("。")
        if meta_bits:
            meta_bits.append("のコーヒーです")
            page_text = f"{headline}。{' '.join(meta_bits)}。"
        if taste:
            page_text += f"テイストバランスは{taste}。"
        if body:
            page_text += f"ボディ感は{body}。"
        if origin and "産" not in page_text:
            page_text += f"生豆の生産国は{origin}。"

    images = parse_all_product_images(html, pid)

    return page_text, images


HOSHINO_DRIP_PAGES = {
    "hoshino-blend-store-100g": "https://anshindo-d.com/c/shop_category/shop_drink/shop_drink_coffee/345/34500800",
    "orihime-store-100g": "https://anshindo-d.com/c/shop_category/shop_drink/shop_drink_coffee/345/34500900",
    "hikoboshi-store": "https://anshindo-d.com/c/shop_category/shop_drink/shop_drink_coffee/345/34501000",
}

UCC_GENERIC_MARKERS = (
    "UCC独自のブレンド",
    "ブレンド技術：",
    "焙煎技術：",
    "サステナブルに調達",
    "コク・苦味・酸味だけでは語りきれない特別な味わいを実現",
    "豆の個性を最大限引き出す",
    "味覚設計",
)


def shopify_handle(raw: dict, buy_url: str) -> str:
    handle = raw.get("handle") or raw.get("product_id")
    if isinstance(handle, str) and handle and not str(handle).isdigit():
        return handle
    m = re.search(r"/products/([^/?#]+)", buy_url or "")
    return m.group(1) if m else str(raw.get("product_id", ""))


def html_to_lines(body_html: str) -> list[str]:
    text = re.sub(r"<br\s*/?>", "\n", body_html or "", flags=re.I)
    text = re.sub(r"</p>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = html_module.unescape(text)
    return [ln.strip() for ln in text.split("\n") if ln.strip()]


def parse_shopify_sections(body_html: str) -> tuple[str, str]:
    """Return (narrative_text, flavor_text) from Shopify body_html."""
    lines = html_to_lines(body_html)
    headers = {
        "味わい",
        "ストーリー",
        "美味しい召上がり方",
        "猿田彦珈琲のコラム",
        "焙煎や配合のこだわり",
        "ブレンドコンセプト",
        "詳細情報",
        "注意事項",
    }
    sections: dict[str, list[str]] = {}
    current = "_lead"
    sections[current] = []

    for line in lines:
        if line in headers:
            current = line
            sections.setdefault(current, [])
            continue
        if line.startswith("【詳しく") or line.startswith("・【"):
            break
        sections.setdefault(current, []).append(line)

    narrative_parts: list[str] = []
    for key in ("_lead", "ストーリー", "ブレンドコンセプト", "焙煎や配合のこだわり", "猿田彦珈琲のコラム"):
        if key in sections:
            narrative_parts.extend(sections[key])

    flavor_parts: list[str] = []
    if "味わい" in sections:
        flavor_parts.extend(sections["味わい"])
    else:
        for line in narrative_parts:
            if re.search(r"風味|味わい|香り|コク|甘さ|酸味|後味|口当たり", line):
                flavor_parts.append(line)

    narrative = clean_text(" ".join(narrative_parts))
    flavor = clean_text(" ".join(flavor_parts))
    return narrative, flavor


def strip_ucc_boilerplate(text: str) -> str:
    text = clean_text(text)
    bullets: list[str] = []
    for chunk in re.split(r"◆", text):
        chunk = chunk.strip()
        if not chunk or len(chunk) < 6:
            continue
        if any(marker in chunk for marker in UCC_GENERIC_MARKERS):
            continue
        if chunk.startswith("UCC ") and "プレミアムブランド" in chunk:
            continue
        bullets.append(chunk.rstrip("。") + "。")
    if bullets:
        return "".join(dict.fromkeys(bullets))
    return text


def extract_ucc_page(html: str, raw: dict) -> tuple[str, list[str]]:
    pid = str(raw.get("product_id", ""))
    page_text = ""
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            data = json.loads(m.group(1))
        except json.JSONDecodeError:
            continue
        if data.get("@type") != "Product":
            continue
        desc = data.get("description") or ""
        if desc:
            page_text = strip_ucc_boilerplate(desc)
            break

    if not page_text:
        soup = BeautifulSoup(html, "lxml")
        page_text = strip_ucc_boilerplate(
            extract_body_from_soup(soup, "ucc", raw.get("buy_url", ""))
        )

    images: list[str] = []
    primary = raw.get("image_url")
    if primary:
        images.append(
            primary
            if str(primary).startswith("http")
            else urljoin(raw.get("buy_url", ""), str(primary))
        )
    for match in re.finditer(
        rf'(https?://[^"\']*itemimage/{re.escape(pid)}/[^"\']+\.(?:jpg|jpeg|png|webp))',
        html,
        re.I,
    ):
        url = match.group(1)
        if url not in images:
            images.append(url)
    for match in re.finditer(
        rf'(/client_info/UCC/itemimage/{re.escape(pid)}/[^"\']+\.(?:jpg|jpeg|png|webp))',
        html,
        re.I,
    ):
        url = urljoin("https://store.ucc.co.jp", match.group(1))
        if url not in images:
            images.append(url)
    return page_text, images


def extract_hoshino_page(html: str, raw: dict) -> tuple[str, list[str]]:
    lead = ""
    m = re.search(r'<div class="product_summary">(.*?)</div>', html, re.DOTALL | re.I)
    if m:
        lead = clean_text(re.sub(r"<[^>]+>", " ", m.group(1)))

    detail = ""
    soup = BeautifulSoup(html, "lxml")
    for sel in (".shohindettext", ".product_detail", ".item-description", "#detail"):
        el = soup.select_one(sel)
        if el:
            detail = clean_text(el.get_text(" ", strip=True))
            if len(detail) >= 30:
                break

    parts = [p for p in (lead.split("。※")[0].strip(), detail) if p and len(p) >= 15]
    page_text = clean_text(" ".join(dict.fromkeys(parts)))

    images: list[str] = []
    primary = raw.get("image_url")
    if primary:
        images.append(str(primary))
    for img in soup.select("img[src*='anshindo.itembox.cloud']"):
        src = img.get("src") or img.get("data-src") or ""
        if src and src not in images:
            images.append(src if src.startswith("http") else urljoin(raw.get("buy_url", ""), src))
    return page_text, images[:6]


def fetch_shopify_product(
    client: httpx.Client, raw: dict, chain_id: str
) -> tuple[str, list[str]]:
    buy_url = raw.get("buy_url") or ""
    handle = shopify_handle(raw, buy_url)
    base = (
        urlparse(buy_url).scheme + "://" + urlparse(buy_url).netloc
        if buy_url
        else ("https://oc-shop.co.jp" if chain_id == "ogawa" else "https://sarutahiko.jp")
    )
    json_url = f"{base.rstrip('/')}/products/{handle}.json"
    resp = client.get(json_url)
    resp.raise_for_status()
    product = resp.json().get("product") or {}
    body_html = product.get("body_html") or ""
    narrative, flavor = parse_shopify_sections(body_html)
    page_text = narrative
    if flavor:
        raw["flavor_notes"] = flavor
    if not page_text:
        page_text = clean_text(raw.get("description") or raw.get("taste_comment") or "")

    images = [img.get("src") for img in product.get("images") or [] if img.get("src")]
    if not images and raw.get("image_url"):
        images = [raw["image_url"]]
    return page_text, images


def extract_hoshino_store(raw: dict, client: httpx.Client) -> tuple[str, list[str]]:
    page_text = clean_text(str(raw.get("description") or ""))
    images: list[str] = []
    if raw.get("image_url"):
        images.append(str(raw["image_url"]))
    drip_url = HOSHINO_DRIP_PAGES.get(str(raw.get("product_id", "")))
    if drip_url:
        try:
            resp = client.get(drip_url)
            resp.raise_for_status()
            _, drip_images = extract_hoshino_page(resp.text, raw)
            for url in drip_images:
                if url not in images:
                    images.append(url)
        except Exception as e:
            print(f"  drip page fail: {e}")
    return page_text, images


def build_episode(raw: dict, page_text: str, chain_id: str = "", meta_sentences: list[str] | None = None) -> str:
    parts: list[str] = []
    flavor = raw.get("flavor_notes") or raw.get("taste_comment") or ""
    if isinstance(flavor, str) and len(clean_text(flavor)) >= 15:
        fn = clean_text(flavor)
        if "。" in fn:
            fn = fn.split("。")[0] + "。"
        elif "・" in fn:
            fn = fn.split("・")[0]
        if len(fn) >= 15:
            parts.append(fn)

    for src in (
        page_text,
        raw.get("description"),
        raw.get("og_description"),
        raw.get("content"),
        raw.get("taste_comment"),
    ):
        if not src:
            continue
        cleaned = clean_text(str(src))
        if len(cleaned) >= 20 and cleaned not in parts:
            parts.append(cleaned)

    if not parts:
        name = raw.get("name", "このコーヒー")
        return f"「{name}」は{raw.get('chain_id', '')}の公式ラインナップです。"

    body = parts[0]
    sentences = re.split(r"(?<=[。！？])\s*", body)
    selected = []
    total = 0
    for s in sentences:
        s = s.strip()
        if not s or len(s) < 8:
            continue
        if any(
            skip in s
            for skip in (
                "大容量",
                "ページをご覧",
                "鮮度と風味",
                "＜容量＞",
                "スタンディングジッパー",
                "国内自社工場",
                "大量注文",
                "カートに入れる",
                "お気に入り",
                "生豆生産国名",
                "ティスティングワード",
                "円 (税込)",
                "おいしいコーヒーのいれ方",
                "についてご紹介します",
                "まとめ買い対象",
                "ポイントアップ",
                "400G単品商品",
                "400G2袋以上",
                "複数商品をお求め",
                "2袋",
                "3袋",
            )
        ) or s.startswith("・"):
            continue
        if total + len(s) > 500 and selected:
            break
        selected.append(s)
        total += len(s)
        if len(selected) >= 5:
            break

    if len(selected) < 3:
        for s in sentences:
            s = s.strip()
            if not s or s in selected or len(s) < 8:
                continue
            selected.append(s)
            if len(selected) >= 3:
                break

    episode = "".join(selected) if selected else body[:380]
    if meta_sentences and len(selected) < 3:
        for ms in meta_sentences:
            if ms not in episode:
                episode = ms + episode
            if len([x for x in episode.split("。") if x.strip()]) >= 3:
                break
    brand = CHAIN_VOICE.get(chain_id or raw.get("chain_id", ""), "")
    sentence_count = len([x for x in re.split(r"(?<=[。！？])", episode) if x.strip()])
    if brand and brand not in episode and (sentence_count < 3 or len(episode) < 160):
        episode = f"{episode} {brand}"
    return episode


def product_id(raw: dict) -> str | int:
    pid = raw.get("product_id") or raw.get("id")
    if pid is not None:
        return pid
    return raw.get("name", "unknown")


def download_image(client: httpx.Client, url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 1000:
        return True
    try:
        r = client.get(url, timeout=30, follow_redirects=True)
        r.raise_for_status()
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(r.content)
        return True
    except Exception as e:
        print(f"  image fail {dest.name}: {e}")
        return False


def fetch_chain(chain_id: str, delay: float = 1.0) -> dict:
    beans_raw = load_chain_beans(chain_id)
    results: list[dict] = []
    ok = fail = 0

    with httpx.Client(headers=HEADERS, follow_redirects=True, timeout=30) as client:
        starbucks_brand = ""
        if chain_id == "starbucks":
            time.sleep(delay)
            starbucks_brand = fetch_starbucks_brand_context(client)
            if starbucks_brand and starbucks_brand != STARBUCKS_BRAND_VOICE:
                CHAIN_VOICE["starbucks"] = starbucks_brand

        for i, raw in enumerate(beans_raw, 1):
            url = raw.get("buy_url") or raw.get("menu_url") or ""
            pid = product_id(raw)
            print(f"[{chain_id}] {i}/{len(beans_raw)} {raw.get('name', pid)[:40]}")

            page_text = ""
            images: list[str] = []
            image_url = raw.get("image_url") or raw.get("image_cdn_url") or ""

            episode_source = url
            if chain_id == "tullys":
                menu_url = raw.get("menu_url") or ""
                buy_url = raw.get("buy_url") or ""
                episode_url = menu_url if menu_url.startswith("http") else url
                image_fetch_url = buy_url if buy_url.startswith("http") else episode_url

                if episode_url.startswith("http"):
                    try:
                        time.sleep(delay)
                        page_text, episode_images = fetch_page(
                            client, episode_url, chain_id, raw
                        )
                        episode_source = episode_url
                        images = episode_images
                        if images:
                            image_url = images[0]
                        ok += 1
                    except Exception as e:
                        print(f"  episode fetch fail: {e}")
                        fail += 1

                if (
                    image_fetch_url.startswith("http")
                    and image_fetch_url != episode_url
                ):
                    try:
                        time.sleep(delay)
                        ec_text, images = fetch_page(
                            client, image_fetch_url, chain_id, raw
                        )
                        if images:
                            image_url = images[0]
                        if ec_text and len(page_text) < 120:
                            page_text = f"{page_text} {ec_text}".strip()
                    except Exception as e:
                        print(f"  image fetch fail: {e}")
            elif chain_id in ("ogawa", "sarutahiko"):
                try:
                    time.sleep(delay)
                    page_text, images = fetch_shopify_product(client, raw, chain_id)
                    if images:
                        image_url = images[0]
                    ok += 1
                except Exception as e:
                    print(f"  shopify fetch fail: {e}")
                    fail += 1
            elif chain_id == "hoshino" and raw.get("purchase_channel") == "store":
                try:
                    time.sleep(delay)
                    page_text, images = extract_hoshino_store(raw, client)
                    if images:
                        image_url = images[0]
                    ok += 1
                except Exception as e:
                    print(f"  store bean fail: {e}")
                    fail += 1
            elif url.startswith("http"):
                try:
                    time.sleep(delay)
                    starbucks_extra: list[str] = []
                    page_text, images = fetch_page(
                        client,
                        url,
                        chain_id,
                        raw,
                        starbucks_extra=starbucks_extra if chain_id == "starbucks" else None,
                    )
                    if chain_id == "starbucks":
                        raw_img = raw.get("image_url")
                        if raw_img:
                            image_url = raw_img
                        elif images:
                            image_url = images[0]
                    elif images:
                        image_url = images[0]
                    ok += 1
                except Exception as e:
                    print(f"  fetch fail: {e}")
                    fail += 1
            else:
                fail += 1

            episode = build_episode(raw, page_text, chain_id)
            ext = ".png" if ".png" in (image_url or "").lower() else ".jpg"
            local_name = f"{pid}{ext}"
            local_rel = f"data/images/{chain_id}/{local_name}"

            if image_url:
                dest = IMAGES / chain_id / local_name
                download_image(client, image_url, dest)

            extra = [u for u in images[1:] if u != image_url]

            entry = {
                "product_id": pid,
                "name": raw.get("name"),
                "buy_url": url,
                "episode": episode,
                "episode_source": episode_source or url or raw.get("buy_url"),
                "image_url": image_url or None,
                "image_local": local_rel if (IMAGES / chain_id / local_name).exists() else raw.get("image_local"),
                "extra_images": extra,
            }
            if raw.get("flavor_notes"):
                entry["taste_notes"] = raw["flavor_notes"]
            results.append(entry)

    payload = {
        "chain_id": chain_id,
        "generated_at": datetime.now(JST).isoformat(),
        "count": len(results),
        "ok": ok,
        "failed": fail,
        "beans": results,
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / f"{chain_id}.json"
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {out_path} ({len(results)} beans, ok={ok}, fail={fail})")
    return payload


def main() -> None:
    chains = sys.argv[1:] if len(sys.argv) > 1 else CHAINS
    for chain_id in chains:
        fetch_chain(chain_id)


if __name__ == "__main__":
    main()
