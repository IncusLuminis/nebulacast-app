#!/usr/bin/env python3
"""
Frontend build: generate sites/staging/** from frontend/templates + config.
Output: sites/staging/index.html, sites/staging/news/**, sites/staging/calendar/**, sites/staging/assets/**
"""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    yaml = None

FRONTEND_ROOT = Path(__file__).resolve().parent
REPO_ROOT = FRONTEND_ROOT.parent
TEMPLATES = FRONTEND_ROOT / "templates"
PARTIALS = TEMPLATES / "partials"
PAGES = TEMPLATES / "pages"
ASSETS = FRONTEND_ROOT / "assets"
CONFIG_PATH = FRONTEND_ROOT / "config" / "widgets.yaml"


def load_config() -> dict:
    if yaml is None:
        print("WARNING: PyYAML not installed, using default config. Run: pip install PyYAML")
        return {
            "site": {"title": "Nebulacast", "subtitle": "Staging"},
            "paths": {"out_root": "sites/staging", "base_url": "https://news.nebulacast.app"},
            "widgets": {
                "news": {"enabled": True, "title": "News Radar", "rss": "/news/rss.xml", "rss_absolute": "https://news.nebulacast.app/rss.xml", "max_items": 12, "parse_max": 300, "filters": ["All", "News", "Science", "Videos", "Images", "Nebulacast"]},
                "calendar": {"enabled": True, "title": "Sky Alerts", "json": "/calendar/daily_signal.json", "rss": "/alerts/rss.xml", "max_items": 20, "filters": ["All", "METEORS", "ECLIPSES", "CONJUNCTIONS", "OCCULTATIONS", "COMETS"]},
            },
        }
    with open(CONFIG_PATH, encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def read_tmpl(name: str, subdir: str = "partials") -> str:
    path = PARTIALS if subdir == "partials" else PAGES
    with open(path / name, encoding="utf-8") as f:
        return f.read()


def ensure_dir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)


def main() -> int:
    cfg = load_config()
    paths = cfg.get("paths", {}) or {}
    out_root = Path(paths.get("out_root", "sites/staging"))
    out_path = REPO_ROOT / out_root
    base_url = (paths.get("base_url") or "").strip()
    site = cfg.get("site", {}) or {}
    site_title = site.get("title", "Nebulacast")
    site_subtitle = site.get("subtitle", "Staging")
    widgets = cfg.get("widgets", {}) or {}
    news_cfg = widgets.get("news") or {}
    calendar_cfg = widgets.get("calendar") or {}
    base_path = ""  # relative to site root when served from sites/staging

    generated = []

    # --- Copy assets ---
    assets_src = ASSETS
    assets_dst = out_path / "assets"
    for sub in ("css", "js"):
        src_sub = assets_src / sub
        if src_sub.exists():
            ensure_dir(assets_dst / sub)
            for f in src_sub.iterdir():
                if f.is_file():
                    shutil.copy2(f, assets_dst / sub / f.name)
                    generated.append(str(out_path / "assets" / sub / f.name))
    # Keep existing assets/icons if present
    if (out_path / "assets" / "icons").exists():
        pass  # don't overwrite

    # --- Copy calendar JSON to sites/staging/calendar/ (so /calendar/daily_signal.json is available) ---
    calendar_outputs = REPO_ROOT / "services" / "calendar" / "outputs"
    calendar_site_dir = out_path / "calendar"
    if calendar_outputs.exists():
        ensure_dir(calendar_site_dir)
        for j in calendar_outputs.glob("daily_*.json"):
            if j.suffix == ".json" and not j.name.endswith(".jsonl"):
                dest = calendar_site_dir / j.name
                shutil.copy2(j, dest)
                generated.append(str(dest))

    # --- News widget config ---
    news_enabled = news_cfg.get("enabled", True)
    news_title = news_cfg.get("title", "News Radar")
    news_rss = news_cfg.get("rss", "/news/rss.xml")
    news_rss_absolute = news_cfg.get("rss_absolute") or (base_url.rstrip("/") + news_rss)
    news_max_items = int(news_cfg.get("max_items", 12))
    news_parse_max = int(news_cfg.get("parse_max", 300))
    news_filters = news_cfg.get("filters") or ["All", "News", "Science", "Videos", "Images", "Nebulacast"]

    root_id_page = "nrw-root-page"
    root_id_blogger = "nrw-blogger"

    # --- Partials ---
    html_partial = read_tmpl("widget_news.html")
    css_partial = read_tmpl("widget_news.css")
    logic_tmpl = read_tmpl("widget_news_logic.js.tmpl")

    def fill_logic(rss_url_js: str, root_id: str) -> str:
        return (
            logic_tmpl.replace("{{ROOT_ID}}", root_id)
            .replace("{{RSS_URL}}", rss_url_js)
            .replace("{{MAX_ITEMS}}", str(news_max_items))
            .replace("{{PARSE_MAX}}", str(news_parse_max))
            .replace("{{USE_PROXY}}", "false")
            .replace("{{FILTERS_JSON}}", json.dumps(news_filters))
            .replace("{{FETCH_TIMEOUT}}", "30000")
        )

    # --- 1. sites/staging/news/widget.js (Blogger: create container + inject CSS + run logic) ---
    ensure_dir(out_path / "news")
    widget_html = (
        html_partial.replace("{{ROOT_ID}}", root_id_blogger)
        .replace("{{TITLE}}", news_title)
        .replace("{{RSS_HREF}}", news_rss_absolute)
    )
    widget_css = css_partial.replace("{{ROOT_ID}}", root_id_blogger)
    rss_url_blogger_js = json.dumps(news_rss_absolute.rstrip("/") + "?ts=" + "+Date.now()")
    # Actually we need the URL to be evaluated at runtime: "..." + Date.now() so in JS it's a string + Date.now()
    rss_url_blogger_js = json.dumps(news_rss_absolute.rstrip("/")) + ' + "?ts=" + Date.now()'
    logic_blogger = fill_logic(rss_url_blogger_js, root_id_blogger)

    blogger_js = """(function() {
  var rootEl = document.createElement('div');
  rootEl.id = '""" + root_id_blogger + """';
  rootEl.innerHTML = """ + json.dumps(widget_html) + """;
  (document.body || document.documentElement).appendChild(rootEl);
  var styleEl = document.createElement('style');
  styleEl.textContent = """ + json.dumps(widget_css) + """;
  (document.head || document.documentElement).appendChild(styleEl);
})();
"""
    blogger_js += logic_blogger

    widget_js_path = out_path / "news" / "widget.js"
    widget_js_path.write_text(blogger_js, encoding="utf-8")
    generated.append(str(widget_js_path))

    # --- 2. sites/staging/news/index.html ---
    news_html_section = (
        html_partial.replace("{{ROOT_ID}}", root_id_page)
        .replace("{{TITLE}}", news_title)
        .replace("{{RSS_HREF}}", (base_path or "") + "/news/rss.xml")
    )
    widget_config = {
        "rootId": root_id_page,
        "rssUrl": (base_path or "") + "/news/rss.xml",
        "maxItems": news_max_items,
        "parseMax": news_parse_max,
        "filters": news_filters,
    }
    news_page_tmpl = read_tmpl("news.html", "pages")
    news_page = (
        news_page_tmpl.replace("{{SITE_TITLE}}", site_title)
        .replace("{{SITE_SUBTITLE}}", site_subtitle)
        .replace("{{BASE_PATH}}", base_path)
        .replace("{{WIDGET_NEWS_HTML}}", news_html_section)
        .replace("{{WIDGET_NEWS_CONFIG_JSON}}", json.dumps(widget_config))
    )
    news_index_path = out_path / "news" / "index.html"
    news_index_path.write_text(news_page, encoding="utf-8")
    generated.append(str(news_index_path))

    # --- 3. sites/staging/index.html (main: news section + placeholders) ---
    news_section_html = (
        '<section class="widget-section" id="widget-news">'
        + html_partial.replace("{{ROOT_ID}}", "nrw-main")
        .replace("{{TITLE}}", news_title)
        .replace("{{RSS_HREF}}", (base_path or "") + "/news/rss.xml")
        + "</section>"
    )
    news_init = ""
    if news_enabled:
        news_init = "window.runNewsWidget({ rootId: 'nrw-main', rssUrl: base + '/news/rss.xml', maxItems: " + str(news_max_items) + ", parseMax: " + str(news_parse_max) + ", filters: " + json.dumps(news_filters) + " });"

    # --- Calendar (Sky Alerts): data from JSON, same layout as news ---
    calendar_enabled = calendar_cfg.get("enabled", True)
    calendar_title = calendar_cfg.get("title", "Sky Alerts")
    calendar_json = calendar_cfg.get("json", "/calendar/daily_signal.json")
    calendar_rss = calendar_cfg.get("rss", "/alerts/rss.xml")
    calendar_max_items = int(calendar_cfg.get("max_items", 20))
    calendar_filters = calendar_cfg.get("filters") or ["All", "METEORS", "ECLIPSES", "CONJUNCTIONS", "OCCULTATIONS", "COMETS"]

    cal_html_partial = read_tmpl("widget_calendar.html")
    cal_css_partial = read_tmpl("widget_calendar.css")
    cal_logic_tmpl = read_tmpl("widget_calendar_logic.js.tmpl")
    root_id_cal_page = "nrc-root-page"
    root_id_cal_blogger = "nrc-blogger"
    cal_json_url_page = (base_path or "") + calendar_json
    cal_logic_filled = (
        cal_logic_tmpl.replace("{{ROOT_ID}}", root_id_cal_blogger)
        .replace("{{JSON_URL}}", json.dumps("https://alerts.nebulacast.app".rstrip("/") + calendar_json))
        .replace("{{MAX_ITEMS}}", str(calendar_max_items))
        .replace("{{FILTERS_JSON}}", json.dumps(calendar_filters))
        .replace("{{ICON_BASE_JS}}", json.dumps("https://alerts.nebulacast.app/assets/icons/alerts"))
        .replace("{{FETCH_TIMEOUT}}", "15000")
    )
    ensure_dir(out_path / "calendar")
    cal_widget_html_blogger = (
        cal_html_partial.replace("{{ROOT_ID}}", root_id_cal_blogger)
        .replace("{{TITLE}}", calendar_title)
        .replace("{{JSON_HREF}}", "https://alerts.nebulacast.app" + calendar_json)
        .replace("{{RSS_HREF}}", "https://alerts.nebulacast.app" + calendar_rss)
    )
    cal_widget_css_blogger = cal_css_partial.replace("{{ROOT_ID}}", root_id_cal_blogger)
    calendar_widget_js = """(function() {
  var rootEl = document.createElement('div');
  rootEl.id = '""" + root_id_cal_blogger + """';
  rootEl.innerHTML = """ + json.dumps(cal_widget_html_blogger) + """;
  (document.body || document.documentElement).appendChild(rootEl);
  var styleEl = document.createElement('style');
  styleEl.textContent = """ + json.dumps(cal_widget_css_blogger) + """;
  (document.head || document.documentElement).appendChild(styleEl);
})();
""" + cal_logic_filled
    (out_path / "calendar" / "widget.js").write_text(calendar_widget_js, encoding="utf-8")
    generated.append(str(out_path / "calendar" / "widget.js"))

    cal_section_html = (
        cal_html_partial.replace("{{ROOT_ID}}", "nrc-main")
        .replace("{{TITLE}}", calendar_title)
        .replace("{{JSON_HREF}}", (base_path or "") + calendar_json)
        .replace("{{RSS_HREF}}", (base_path or "") + calendar_rss)
    )
    calendar_section_wrapped = '<section class="widget-section" id="widget-calendar">' + cal_section_html + "</section>"
    calendar_init = ""
    if calendar_enabled:
        calendar_init = "window.runCalendarWidget({ rootId: 'nrc-main', jsonUrl: base + '" + calendar_json + "', maxItems: " + str(calendar_max_items) + ", filters: " + json.dumps(calendar_filters) + ", iconBase: base + '/assets/icons/alerts' });"

    # --- sites/staging/calendar/index.html ---
    cal_page_tmpl = read_tmpl("calendar.html", "pages")
    cal_page_html = (
        cal_html_partial.replace("{{ROOT_ID}}", root_id_cal_page)
        .replace("{{TITLE}}", calendar_title)
        .replace("{{JSON_HREF}}", (base_path or "") + calendar_json)
        .replace("{{RSS_HREF}}", (base_path or "") + calendar_rss)
    )
    cal_config = {
        "rootId": root_id_cal_page,
        "jsonUrl": (base_path or "") + calendar_json,
        "maxItems": calendar_max_items,
        "filters": calendar_filters,
        "iconBase": (base_path or "") + "/assets/icons/alerts",
    }
    cal_index_content = (
        cal_page_tmpl.replace("{{SITE_TITLE}}", site_title)
        .replace("{{SITE_SUBTITLE}}", site_subtitle)
        .replace("{{BASE_PATH}}", base_path)
        .replace("{{WIDGET_CALENDAR_HTML}}", cal_page_html)
        .replace("{{WIDGET_CALENDAR_CONFIG_JSON}}", json.dumps(cal_config))
    )
    (out_path / "calendar" / "index.html").write_text(cal_index_content, encoding="utf-8")
    generated.append(str(out_path / "calendar" / "index.html"))

    # --- Weather: JSON from /weather/daily_weather.json ---
    weather_cfg = widgets.get("weather") or {}
    weather_enabled = weather_cfg.get("enabled", True)
    weather_json = weather_cfg.get("json", "/weather/daily_weather.json")
    weather_title = weather_cfg.get("title", "Weather")
    ensure_dir(out_path / "weather")
    weather_outputs = REPO_ROOT / "services" / "weather" / "outputs"
    if weather_outputs.exists():
        wj = weather_outputs / "daily_weather.json"
        if wj.exists():
            shutil.copy2(wj, out_path / "weather" / "daily_weather.json")
            generated.append(str(out_path / "weather" / "daily_weather.json"))

    # --- Weather POC page: weather/index.html (full widget like poc.html) ---
    weather_poc_partial = read_tmpl("widget_weather_poc.html")
    weather_poc_config = {
        "jsonUrl": (base_path or "") + weather_json,
        "iconBase": (base_path or "") + "/assets/icons/weather",
    }
    weather_page_tmpl = read_tmpl("weather.html", "pages")
    weather_index_content = (
        weather_page_tmpl.replace("{{SITE_TITLE}}", site_title)
        .replace("{{SITE_SUBTITLE}}", site_subtitle)
        .replace("{{BASE_PATH}}", base_path)
        .replace("{{WIDGET_WEATHER_POC_HTML}}", weather_poc_partial)
        .replace("{{WIDGET_WEATHER_POC_CONFIG_JSON}}", json.dumps(weather_poc_config))
    )
    (out_path / "weather" / "index.html").write_text(weather_index_content, encoding="utf-8")
    generated.append(str(out_path / "weather" / "index.html"))

    # Full POC-style weather widget for index (same as weather/index.html content)
    weather_section_html = (
        '<section class="widget-section weather-widget" id="widget-weather">'
        + weather_poc_partial
        + "</section>"
    )
    weather_poc_overlays_html = """
  <!-- Bottom sheet modal (legacy parameter details) -->
  <div class="modal-overlay" id="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="modal-sheet">
      <div class="modal-header">
        <h3 id="modal-title">Parameter Details</h3>
        <button class="modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="modal-content" id="modal-content"></div>
    </div>
  </div>
  <!-- Factor tooltip (breakdown (i) icons) -->
  <div class="factor-tooltip" id="factorTooltip" role="tooltip" aria-hidden="true">
    <div class="factor-tooltip-title" id="factorTooltipTitle"></div>
    <div class="factor-tooltip-body" id="factorTooltipBody"></div>
  </div>
  <!-- Chip popover (L1 details) -->
  <div class="chip-overlay" id="chipOverlay" role="dialog" aria-modal="true" aria-labelledby="chipSheetTitle">
    <div class="chip-sheet" id="chipSheet">
      <div class="sheet-hdr">
        <h3 id="chipSheetTitle"></h3>
      </div>
      <div class="chip-sheet-body" id="chipSheetBody"></div>
    </div>
  </div>"""
    weather_poc_init = "window.__WEATHER_POC_CONFIG = " + json.dumps(weather_poc_config) + ";"

    index_tmpl = read_tmpl("index.html", "pages")
    index_html = (
        index_tmpl.replace("{{SITE_TITLE}}", site_title)
        .replace("{{SITE_SUBTITLE}}", site_subtitle)
        .replace("{{BASE_PATH}}", base_path)
        .replace("{{WIDGET_NEWS_SECTION}}", news_section_html if news_enabled else "")
        .replace("{{WIDGET_ALERTS_SECTION}}", calendar_section_wrapped if calendar_enabled else "")
        .replace("{{WIDGET_WEATHER_POC_SECTION}}", weather_section_html if weather_enabled else "<section class=\"widget-section\" id=\"widget-weather\"><h2>Weather</h2><div class=\"widget-placeholder\">Disabled</div></section>")
        .replace("{{WEATHER_POC_OVERLAYS}}", weather_poc_overlays_html if weather_enabled else "")
        .replace("{{WIDGET_NEWS_INIT}}", news_init)
        .replace("{{WIDGET_ALERTS_INIT}}", calendar_init)
        .replace("{{WIDGET_WEATHER_POC_INIT}}", weather_poc_init if weather_enabled else "")
    )
    # Ensure base.css is present
    base_css_dst = out_path / "assets" / "css" / "base.css"
    if not base_css_dst.exists() and (ASSETS / "css" / "base.css").exists():
        shutil.copy2(ASSETS / "css" / "base.css", base_css_dst)
        generated.append(str(base_css_dst))
    index_path = out_path / "index.html"
    index_path.write_text(index_html, encoding="utf-8")
    generated.append(str(index_path))

    # --- widget_news.css and widget_calendar.css for pages ---
    ensure_dir(out_path / "assets" / "css")
    widget_css_global = css_partial.replace("#{{ROOT_ID}}", ".nrw-root")
    widget_css_path = out_path / "assets" / "css" / "widget_news.css"
    widget_css_path.write_text(widget_css_global, encoding="utf-8")
    generated.append(str(widget_css_path))
    cal_css_global = cal_css_partial.replace("#{{ROOT_ID}}", ".nrc-root")
    (out_path / "assets" / "css" / "widget_calendar.css").write_text(cal_css_global, encoding="utf-8")
    generated.append(str(out_path / "assets" / "css" / "widget_calendar.css"))

    print("Generated:")
    for g in sorted(generated):
        print(" ", g)
    return 0


if __name__ == "__main__":
    sys.exit(main())
