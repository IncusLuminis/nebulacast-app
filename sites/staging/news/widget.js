(function() {
  var rootEl = document.createElement('div');
  rootEl.id = 'nrw-blogger';
  rootEl.innerHTML = "<div id=\"nrw-blogger\" class=\"nrw-root\">\n  <div class=\"nrw-header\">\n    <div class=\"nrw-title\">News Radar</div>\n    <div class=\"nrw-meta\"><a class=\"nrw-rss\" href=\"https://news.nebulacast.app/rss.xml\" target=\"_blank\" rel=\"noopener\">RSS</a></div>\n  </div>\n  <div class=\"nrw-filters\" data-role=\"filters\"></div>\n  <div class=\"nrw-status\" data-role=\"status\">Loading...</div>\n  <div class=\"nrw-list\" data-role=\"list\"></div>\n</div>\n";
  (document.body || document.documentElement).appendChild(rootEl);
  var styleEl = document.createElement('style');
  styleEl.textContent = "#nrw-blogger {\n  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;\n  max-width: 100%;\n  margin: 0;\n  padding: 0;\n  background: #0f1115;\n  color: #e6e6e6;\n}\n#nrw-blogger .nrw-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 12px 0;\n  border-bottom: 1px solid #2a2f3a;\n  margin-bottom: 12px;\n}\n#nrw-blogger .nrw-title {\n  font-weight: 700;\n  font-size: 18px;\n  color: #e6f2ff;\n  margin: 0;\n}\n#nrw-blogger .nrw-meta {\n  font-size: 12px;\n}\n#nrw-blogger .nrw-rss {\n  color: #8fb6ff;\n  text-decoration: none;\n}\n#nrw-blogger .nrw-rss:hover {\n  text-decoration: underline;\n}\n#nrw-blogger .nrw-status {\n  padding: 8px 0;\n  font-size: 13px;\n  color: #9aa3b2;\n  text-align: center;\n}\n#nrw-blogger .nrw-error {\n  padding: 16px;\n  background: #1a1f2a;\n  border: 1px solid #3a4252;\n  border-radius: 8px;\n  color: #e6e6e6;\n  font-size: 13px;\n  line-height: 1.5;\n  margin: 12px 0;\n}\n#nrw-blogger .nrw-error-title {\n  font-weight: 700;\n  color: #ff6b6b;\n  margin-bottom: 8px;\n}\n#nrw-blogger .nrw-error-hint {\n  margin-top: 12px;\n  padding-top: 12px;\n  border-top: 1px solid #2a2f3a;\n  font-size: 12px;\n  color: #9aa3b2;\n}\n#nrw-blogger .nrw-error-code {\n  font-family: monospace;\n  background: #0f1115;\n  padding: 2px 6px;\n  border-radius: 4px;\n  color: #8fb6ff;\n}\n#nrw-blogger .nrw-list {\n  margin: 0;\n  padding: 0;\n}\n#nrw-blogger .nrw-card {\n  display: flex;\n  gap: 12px;\n  padding: 12px 0;\n  border-bottom: 1px solid #2a2f3a;\n  align-items: flex-start;\n}\n#nrw-blogger .nrw-card:last-child {\n  border-bottom: none;\n}\n#nrw-blogger .nrw-thumb {\n  width: 120px;\n  height: 72px;\n  border-radius: 10px;\n  object-fit: cover;\n  flex-shrink: 0;\n  border: 1px solid #2a2f3a;\n  background: #111623;\n}\n#nrw-blogger .nrw-content {\n  flex: 1;\n  min-width: 0;\n}\n#nrw-blogger .nrw-titlelink {\n  display: block;\n  font-weight: 700;\n  font-size: 14px;\n  line-height: 1.4;\n  color: #e6f2ff;\n  text-decoration: none;\n  margin-bottom: 6px;\n}\n#nrw-blogger .nrw-titlelink:hover {\n  color: #8fb6ff;\n  text-decoration: underline;\n}\n#nrw-blogger .nrw-metaRow {\n  font-size: 11px;\n  color: #9aa3b2;\n  margin-bottom: 6px;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n#nrw-blogger .nrw-date {\n  color: #9aa3b2;\n}\n#nrw-blogger .nrw-badge {\n  font-size: 10px;\n  padding: 2px 8px;\n  border-radius: 999px;\n  background: #2a2f3a;\n  color: #cfe2ff;\n  text-transform: uppercase;\n  font-weight: 600;\n  border: 1px solid #3a4252;\n}\n#nrw-blogger .nrw-snippet {\n  margin-top: 6px;\n  line-height: 1.35;\n  font-size: 12px;\n  color: #cfe2ff;\n  margin-bottom: 6px;\n}\n#nrw-blogger .nrw-more {\n  display: inline-block;\n  margin-top: 6px;\n  font-size: 11px;\n  color: #8fb6ff;\n  text-decoration: none;\n  white-space: nowrap;\n}\n#nrw-blogger .nrw-more:hover {\n  text-decoration: underline;\n}\n#nrw-blogger .nrw-filters{\n  display:flex;\n  flex-wrap:wrap;\n  gap:8px;\n  padding:10px 0 12px 0;\n  border-bottom:1px solid #2a2f3a;\n  margin-bottom:12px;\n}\n#nrw-blogger .nrw-filter{\n  appearance:none;\n  border:1px solid #2a2f3a;\n  background:#111623;\n  color:#cfe2ff;\n  font-size:12px;\n  padding:6px 10px;\n  border-radius:999px;\n  cursor:pointer;\n  line-height:1;\n  user-select:none;\n}\n#nrw-blogger .nrw-filter:hover{\n  border-color:#3a4252;\n  color:#e6f2ff;\n}\n#nrw-blogger .nrw-filter.is-active{\n  background:#2a2f3a;\n  border-color:#3a4252;\n  color:#e6f2ff;\n}\n";
  (document.head || document.documentElement).appendChild(styleEl);
})();
(function() {
  'use strict';
  const ROOT_ID = 'nrw-blogger';
  const rssUrl = "https://news.nebulacast.app/rss.xml" + "?ts=" + Date.now();
  const MAX_ITEMS = 12;
  const PARSE_MAX = 300;
  const USE_PROXY = false;
  const PROXY_URL = "https://api.allorigins.win/raw?url=";
  const FILTERS = ["All", "News", "Science", "Videos", "Images", "Nebulacast"];
  const STORAGE_KEY = ROOT_ID + ":filter";
  const FETCH_TIMEOUT = 30000;
  let activeFilter = "All";
  let cachedItems = [];

  function getRoot() { return document.getElementById(ROOT_ID); }
  function getStatusEl() { const root = getRoot(); return root ? root.querySelector('[data-role="status"]') : null; }
  function getListEl() { const root = getRoot(); return root ? root.querySelector('[data-role="list"]') : null; }
  function getFiltersEl() { const root = getRoot(); return root ? root.querySelector('[data-role="filters"]') : null; }
  function normCat(s) { return (s || "").trim().toLowerCase(); }
  function readCategory(item) { const c = item.querySelector('category'); return c ? (c.textContent || "").trim().toLowerCase() : ""; }

  function youtubeThumbnailUrl(url) {
    if (!url) return null;
    var patterns = [ /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/ ];
    for (var i = 0; i < patterns.length; i++) {
      var match = url.match(patterns[i]);
      if (match && match[1]) return 'https://img.youtube.com/vi/' + match[1] + '/hqdefault.jpg';
    }
    return null;
  }
  function loadSavedFilter() { try { const v = localStorage.getItem(STORAGE_KEY); if (v && FILTERS.map(normCat).includes(normCat(v))) activeFilter = v; } catch {} }
  function saveFilter(v) { try { localStorage.setItem(STORAGE_KEY, v); } catch {} }

  function renderFilters() {
    const el = getFiltersEl();
    if (!el) return;
    el.innerHTML = "";
    FILTERS.forEach(function(label) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nrw-filter" + (normCat(label) === normCat(activeFilter) ? " is-active" : "");
      btn.textContent = label;
      btn.addEventListener("click", function() { activeFilter = label; saveFilter(activeFilter); renderFilters(); applyFilterAndRender(); });
      el.appendChild(btn);
    });
  }
  function getItemDate(item) {
    const pubDateEl = item.querySelector('pubDate');
    if (!pubDateEl) return 0;
    const dateStr = pubDateEl.textContent || '';
    if (!dateStr) return 0;
    try {
      return new Date(dateStr).getTime();
    } catch {
      return 0;
    }
  }
  function applyFilterAndRender() {
    if (!cachedItems || cachedItems.length === 0) return;
    const f = normCat(activeFilter);
    let filtered = cachedItems;
    if (f !== "all") filtered = cachedItems.filter(function(it) { return readCategory(it) === f; });
    // Sort by published date descending (newest first)
    filtered = Array.prototype.slice.call(filtered);
    filtered.sort(function(a, b) {
      const dateA = getItemDate(a);
      const dateB = getItemDate(b);
      return dateB - dateA; // descending order (newest first)
    });
    const items = filtered.slice(0, MAX_ITEMS);
    renderItems(items);
  }
  function escapeHtml(text) { if (!text) return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
  function decodeHtmlEntities(str) {
    if (!str) return '';
    let decoded = str;
    for (let i = 0; i < 2; i++) { const txt = document.createElement('textarea'); txt.innerHTML = decoded; decoded = txt.value; }
    decoded = decoded.replace(/&amp;#8230;/gi, '...').replace(/&amp;#8230/gi, '...').replace(/&#8230;/gi, '...').replace(/&#8230/gi, '...');
    decoded = decoded.replace(/&amp;hellip;/gi, '...').replace(/&amp;hellip/gi, '...').replace(/&hellip;/gi, '...').replace(/&hellip/gi, '...').replace(/…/g, '...');
    return decoded;
  }
  function formatDate(dateStr) {
    if (!dateStr) return '';
    try { const date = new Date(dateStr); if (isNaN(date.getTime())) return dateStr; return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return dateStr; }
  }
  function truncateText(text, maxLen) { if (!text) return ''; maxLen = maxLen || 220; const trimmed = text.trim(); if (trimmed.length <= maxLen) return trimmed; return trimmed.substring(0, maxLen).trim() + '...'; }
  function normalizeDescriptionHTML(s) { if (!s) return ''; return s.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\n/g, "\n"); }
  function extractThumbnailAndSnippet(descriptionHTML) {
    if (!descriptionHTML) return { thumb: null, snippet: '' };
    const tmp = document.createElement('div');
    tmp.innerHTML = normalizeDescriptionHTML(descriptionHTML);
    const img = tmp.querySelector('img');
    let thumb = null;
    if (img) { const src = img.getAttribute('src'); if (src && !src.startsWith('data:image/svg+xml')) { const ytThumb = youtubeThumbnailUrl(src); thumb = ytThumb || src; } }
    const snippetEl = tmp.querySelector('.snippet');
    let snippetText = '';
    if (snippetEl) { const moreLink = snippetEl.querySelector('a.more'); if (moreLink) moreLink.remove(); snippetText = snippetEl.textContent || snippetEl.innerText || ''; snippetText = decodeHtmlEntities(snippetText); }
    else { const clone = tmp.cloneNode(true); clone.querySelectorAll('a').forEach(function(a) { a.remove(); }); snippetText = clone.textContent || clone.innerText || ''; snippetText = decodeHtmlEntities(snippetText); }
    return { thumb: thumb, snippet: truncateText(snippetText, 220) };
  }
  function renderCard(item) {
    const title = (item.querySelector('title') && item.querySelector('title').textContent) || '';
    const link = (item.querySelector('link') && item.querySelector('link').textContent) || '';
    const pubDate = (item.querySelector('pubDate') && item.querySelector('pubDate').textContent) || '';
    const category = (item.querySelector('category') && item.querySelector('category').textContent) || '';
    const descriptionHTML = (item.querySelector('description') && item.querySelector('description').textContent) || '';
    const { thumb, snippet } = extractThumbnailAndSnippet(descriptionHTML);
    const card = document.createElement('div');
    card.className = 'nrw-card';
    let thumbHTML = thumb ? '<img class="nrw-thumb" src="' + escapeHtml(thumb) + '" alt="" loading="lazy">' : '';
    const badgeHTML = category ? '<span class="nrw-badge">' + escapeHtml(category) + '</span>' : '';
    const dateHTML = pubDate ? '<span class="nrw-date">' + formatDate(pubDate) + '</span>' : '';
    card.innerHTML = thumbHTML + '<div class="nrw-content"><a class="nrw-titlelink" href="' + escapeHtml(link) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(title) + '</a><div class="nrw-metaRow">' + dateHTML + badgeHTML + '</div><a class="nrw-more" href="' + escapeHtml(link) + '" target="_blank" rel="noopener noreferrer">more »</a></div>';
    if (snippet) { const content = card.querySelector('.nrw-content'); const moreLink = content.querySelector('.nrw-more'); const snippetDiv = document.createElement('div'); snippetDiv.className = 'nrw-snippet'; snippetDiv.textContent = snippet; content.insertBefore(snippetDiv, moreLink); }
    return card;
  }
  function showStatus(text) { const statusEl = getStatusEl(); if (statusEl) { statusEl.textContent = text; statusEl.style.display = 'block'; } }
  function hideStatus() { const statusEl = getStatusEl(); if (statusEl) statusEl.style.display = 'none'; }
  function showError(error) {
    const root = getRoot(); if (!root) return;
    hideStatus();
    const errorMsg = error.message || 'Unknown error';
    const errorHTML = '<div class="nrw-error"><div class="nrw-error-title">RSS fetch failed</div><div>' + escapeHtml(errorMsg) + '</div><div class="nrw-error-hint"><strong>Both direct fetch and proxy attempts failed.</strong></div></div>';
    const listEl = getListEl(); if (listEl) listEl.innerHTML = errorHTML;
  }
  function renderItems(items) {
    const listEl = getListEl(); if (!listEl) return;
    hideStatus(); listEl.innerHTML = '';
    if (items.length === 0) { listEl.innerHTML = '<div class="nrw-error">No items found in RSS feed.</div>'; return; }
    items.forEach(function(item) { listEl.appendChild(renderCard(item)); });
  }
  function buildUrl(useProxy) { return useProxy ? PROXY_URL + encodeURIComponent(rssUrl) : rssUrl; }
  function fetchText(url, useProxy) {
    const controller = new AbortController();
    const timeoutId = setTimeout(function() { controller.abort(); }, FETCH_TIMEOUT);
    return fetch(url, { signal: controller.signal })
      .then(function(response) { clearTimeout(timeoutId); if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + response.statusText); return response.text(); })
      .then(function(text) { if (!text || text.trim().length === 0) throw new Error('Empty response'); return text; })
      .catch(function(error) { clearTimeout(timeoutId); if (error.name === 'AbortError') throw new Error('Request timeout'); throw error; });
  }
  function parseXML(text) { const xml = new DOMParser().parseFromString(text, 'application/xml'); const parseError = xml.querySelector('parsererror'); if (parseError) throw new Error('Failed to parse RSS XML'); return xml; }
  function loadRSS() {
    const root = getRoot(); if (!root) return;
    try { showStatus('Loading...'); loadSavedFilter(); renderFilters(); } catch (e) {}
    if (USE_PROXY) {
      fetchText(buildUrl(true), true).then(function(text) { const xml = parseXML(text); const allItems = Array.prototype.slice.call(xml.querySelectorAll('item')); cachedItems = PARSE_MAX ? allItems.slice(0, PARSE_MAX) : allItems; applyFilterAndRender(); }).catch(showError);
      return;
    }
    fetchText(buildUrl(false), false)
      .then(function(text) {
        try { const xml = parseXML(text); const allItems = Array.prototype.slice.call(xml.querySelectorAll('item')); cachedItems = PARSE_MAX ? allItems.slice(0, PARSE_MAX) : allItems; applyFilterAndRender(); }
        catch (parseError) { return fetchText(buildUrl(true), true).then(function(proxyText) { const xml = parseXML(proxyText); const allItems = Array.prototype.slice.call(xml.querySelectorAll('item')); cachedItems = PARSE_MAX ? allItems.slice(0, PARSE_MAX) : allItems; applyFilterAndRender(); }).catch(showError); }
      })
      .catch(function(error) {
        fetchText(buildUrl(true), true).then(function(proxyText) { try { const xml = parseXML(proxyText); const allItems = Array.prototype.slice.call(xml.querySelectorAll('item')); cachedItems = PARSE_MAX ? allItems.slice(0, PARSE_MAX) : allItems; applyFilterAndRender(); } catch (e) { showError(e); } }).catch(showError);
      });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadRSS);
  else loadRSS();
})();
