# DripLab scrapers

チェーン別スクレイパー。オフライン実行。

```bash
# セットアップ（後日 requirements.txt 追加）
python -m venv .venv
.venv\Scripts\activate
pip install httpx beautifulsoup4 lxml

# 実行例
python starbucks/scrape.py
python merge_catalog.py
```

詳細: [../docs/SCRAPING.md](../docs/SCRAPING.md)
