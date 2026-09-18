(function() {
  var rootEl = document.createElement('div');
  rootEl.id = 'nrc-blogger';
  rootEl.innerHTML = "<div id=\"nrc-blogger\" class=\"nrc-root\">\n  <div class=\"nrc-header\">\n    <div class=\"nrc-title\">Sky Alerts</div>\n    <div class=\"nrc-meta\">\n      <a class=\"nrc-link\" href=\"https://alerts.nebulacast.app/calendar/daily_signal.json\" target=\"_blank\" rel=\"noopener\">JSON</a>\n      <a class=\"nrc-link\" href=\"https://alerts.nebulacast.app/alerts/rss.xml\" target=\"_blank\" rel=\"noopener\">RSS</a>\n    </div>\n  </div>\n  <div class=\"nrc-filters\" data-role=\"filters\"></div>\n  <div class=\"nrc-status\" data-role=\"status\">Loading...</div>\n  <div class=\"nrc-list\" data-role=\"list\"></div>\n</div>\n";
  (document.body || document.documentElement).appendChild(rootEl);
  var styleEl = document.createElement('style');
  styleEl.textContent = "#nrc-blogger {\n  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;\n  max-width: 100%;\n  margin: 0;\n  padding: 0;\n  background: #0f1115;\n  color: #e6e6e6;\n}\n#nrc-blogger .nrc-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 12px 0;\n  border-bottom: 1px solid #2a2f3a;\n  margin-bottom: 12px;\n}\n#nrc-blogger .nrc-title {\n  font-weight: 700;\n  font-size: 18px;\n  color: #e6f2ff;\n  margin: 0;\n}\n#nrc-blogger .nrc-meta {\n  font-size: 12px;\n  display: flex;\n  gap: 12px;\n}\n#nrc-blogger .nrc-link {\n  color: #8fb6ff;\n  text-decoration: none;\n}\n#nrc-blogger .nrc-link:hover {\n  text-decoration: underline;\n}\n#nrc-blogger .nrc-status {\n  padding: 8px 0;\n  font-size: 13px;\n  color: #9aa3b2;\n  text-align: center;\n}\n#nrc-blogger .nrc-error {\n  padding: 16px;\n  background: #1a1f2a;\n  border: 1px solid #3a4252;\n  border-radius: 8px;\n  color: #e6e6e6;\n  font-size: 13px;\n  line-height: 1.5;\n  margin: 12px 0;\n}\n#nrc-blogger .nrc-error-title {\n  font-weight: 700;\n  color: #ff6b6b;\n  margin-bottom: 8px;\n}\n#nrc-blogger .nrc-list {\n  margin: 0;\n  padding: 0;\n}\n#nrc-blogger .nrc-card {\n  display: flex;\n  gap: 12px;\n  padding: 12px 0;\n  border-bottom: 1px solid #2a2f3a;\n  align-items: flex-start;\n}\n#nrc-blogger .nrc-card:last-child {\n  border-bottom: none;\n}\n#nrc-blogger .nrc-card-icon {\n  width: 40px;\n  height: 40px;\n  flex-shrink: 0;\n  object-fit: contain;\n  /* \u0421\u0432\u0435\u0442\u043b\u044b\u0435 \u0438\u043a\u043e\u043d\u043a\u0438 \u2192 \u0430\u043a\u0446\u0435\u043d\u0442\u043d\u044b\u0439 \u0441\u0438\u043d\u0438\u0439 #8fb6ff (SVG \u0432 img \u043d\u0435 \u043d\u0430\u0441\u043b\u0435\u0434\u0443\u0435\u0442 color) */\n  filter: invert(1) sepia(1) saturate(4) hue-rotate(200deg) brightness(0.95);\n}\n#nrc-blogger .nrc-card-icon.nrc-card-icon-placeholder {\n  display: block;\n  filter: none;\n  background: #2a2f3a;\n  border-radius: 8px;\n}\n#nrc-blogger .nrc-content {\n  flex: 1;\n  min-width: 0;\n}\n#nrc-blogger .nrc-titlelink {\n  display: block;\n  font-weight: 700;\n  font-size: 14px;\n  line-height: 1.4;\n  color: #e6f2ff;\n  text-decoration: none;\n  margin-bottom: 6px;\n}\n#nrc-blogger .nrc-titlelink:hover {\n  color: #8fb6ff;\n  text-decoration: underline;\n}\n#nrc-blogger .nrc-metaRow {\n  font-size: 11px;\n  color: #9aa3b2;\n  margin-bottom: 6px;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n#nrc-blogger .nrc-date {\n  color: #9aa3b2;\n}\n#nrc-blogger .nrc-badge {\n  font-size: 10px;\n  padding: 2px 8px;\n  border-radius: 999px;\n  background: #2a2f3a;\n  color: #cfe2ff;\n  text-transform: uppercase;\n  font-weight: 600;\n  border: 1px solid #3a4252;\n}\n#nrc-blogger .nrc-snippet {\n  margin-top: 6px;\n  line-height: 1.35;\n  font-size: 12px;\n  color: #cfe2ff;\n  margin-bottom: 6px;\n}\n#nrc-blogger .nrc-more {\n  display: inline-block;\n  margin-top: 6px;\n  font-size: 11px;\n  color: #8fb6ff;\n  text-decoration: none;\n  white-space: nowrap;\n}\n#nrc-blogger .nrc-more:hover {\n  text-decoration: underline;\n}\n#nrc-blogger .nrc-filters {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  padding: 10px 0 12px 0;\n  border-bottom: 1px solid #2a2f3a;\n  margin-bottom: 12px;\n}\n#nrc-blogger .nrc-filter {\n  appearance: none;\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  border: 1px solid #2a2f3a;\n  background: #111623;\n  color: #cfe2ff;\n  font-size: 12px;\n  padding: 6px 10px;\n  border-radius: 999px;\n  cursor: pointer;\n  line-height: 1;\n  user-select: none;\n}\n#nrc-blogger .nrc-filter-icon {\n  width: 18px;\n  height: 18px;\n  flex-shrink: 0;\n  object-fit: contain;\n}\n#nrc-blogger .nrc-filter:hover {\n  border-color: #3a4252;\n  color: #e6f2ff;\n}\n#nrc-blogger .nrc-filter.is-active {\n  background: #2a2f3a;\n  border-color: #3a4252;\n  color: #e6f2ff;\n}\n";
  (document.head || document.documentElement).appendChild(styleEl);
})();
(function() {
  'use strict';
  var ROOT_ID = 'nrc-blogger';
  var jsonUrl = "https://alerts.nebulacast.app/calendar/daily_signal.json";
  var MAX_ITEMS = 20;
  var TIME_RANGE = "upcoming";
  var FILTERS = ["All", "METEORS", "ECLIPSES", "CONJUNCTIONS", "OCCULTATIONS", "COMETS"];
  var iconBase = "https://alerts.nebulacast.app/assets/icons/alerts";
  var FILTER_ICONS = { 'METEORS': 'meteors.svg', 'ECLIPSES': 'eclipses.svg', 'CONJUNCTIONS': 'conjunctions.svg', 'OCCULTATIONS': 'occultations.svg', 'COMETS': 'comets.svg' };
  var STORAGE_KEY = ROOT_ID + ':filter';
  var FETCH_TIMEOUT = 15000;
  var activeFilter = 'All';
  var cachedItems = [];

  function getRoot() { return document.getElementById(ROOT_ID); }
  function getStatusEl() { var r = getRoot(); return r ? r.querySelector('[data-role="status"]') : null; }
  function getListEl() { var r = getRoot(); return r ? r.querySelector('[data-role="list"]') : null; }
  function getFiltersEl() { var r = getRoot(); return r ? r.querySelector('[data-role="filters"]') : null; }
  function normCat(s) { return (s || '').trim().toLowerCase(); }
  function itemCategory(item) { return (item.category || item.stream || '').trim().toLowerCase(); }
  function loadSavedFilter() { try { var v = localStorage.getItem(STORAGE_KEY); if (v && FILTERS.map(normCat).indexOf(normCat(v)) >= 0) activeFilter = v; } catch (e) {} }
  function saveFilter(v) { try { localStorage.setItem(STORAGE_KEY, v); } catch (e) {} }

  function renderFilters() {
    var el = getFiltersEl(); if (!el) return;
    el.innerHTML = '';
    FILTERS.forEach(function(label) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nrc-filter' + (normCat(label) === normCat(activeFilter) ? ' is-active' : '');
      var iconFile = FILTER_ICONS[label];
      if (iconFile && iconBase) {
        var img = document.createElement('img');
        img.className = 'nrc-filter-icon';
        img.src = iconBase + '/' + iconFile;
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        btn.appendChild(img);
      }
      btn.appendChild(document.createTextNode(label));
      btn.addEventListener('click', function() { activeFilter = label; saveFilter(activeFilter); renderFilters(); applyFilterAndRender(); });
      el.appendChild(btn);
    });
  }

  function applyFilterAndRender() {
    if (!cachedItems || cachedItems.length === 0) return;
    var startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    var todayMs = startOfToday.getTime();
    var futureOnly = cachedItems.filter(function(it) {
      if (!it.published_at) return false;
      return normCat(TIME_RANGE) === 'all' || new Date(it.published_at).getTime() >= todayMs;
    });
    var f = normCat(activeFilter);
    var filtered = f === 'all' ? futureOnly : futureOnly.filter(function(it) { return itemCategory(it) === f; });
    filtered.sort(function(a, b) {
      var tA = (a.published_at) ? new Date(a.published_at).getTime() : Infinity;
      var tB = (b.published_at) ? new Date(b.published_at).getTime() : Infinity;
      return tA - tB;
    });
    renderItems(filtered.slice(0, MAX_ITEMS));
  }

  function escapeHtml(text) { if (!text) return ''; var d = document.createElement('div'); d.textContent = text; return d.innerHTML; }
  function formatDate(dateStr) {
    if (!dateStr) return '';
    try { var date = new Date(dateStr); if (isNaN(date.getTime())) return dateStr; return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return dateStr; }
  }
  function truncateText(text, maxLen) { if (!text) return ''; maxLen = maxLen || 220; var t = (text + '').trim(); return t.length <= maxLen ? t : t.substring(0, maxLen).trim() + '...'; }

  function renderCard(item) {
    var title = (item.title || '').trim();
    var url = (item.url || '').trim();
    var published_at = item.published_at || '';
    var category = (item.category || item.stream || '').trim();
    var summary = item.summary || '';
    if (!summary && item.summary_html) {
      var tmp = document.createElement('div'); tmp.innerHTML = item.summary_html;
      summary = (tmp.textContent || tmp.innerText || '').trim();
    }
    var snippet = truncateText(summary, 220);
    var card = document.createElement('div');
    card.className = 'nrc-card';
    var iconFile = FILTER_ICONS[category] || '';
    var iconHTML = (iconBase && iconFile) ? '<img class="nrc-card-icon" src="' + escapeHtml(iconBase + '/' + iconFile) + '" alt="" aria-hidden="true">' : '<span class="nrc-card-icon nrc-card-icon-placeholder"></span>';
    var badgeHTML = category ? '<span class="nrc-badge">' + escapeHtml(category) + '</span>' : '';
    var dateHTML = published_at ? '<span class="nrc-date">' + formatDate(published_at) + '</span>' : '';
    card.innerHTML = iconHTML +
      '<div class="nrc-content">' +
        (url ? '<a class="nrc-titlelink" href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(title || '(untitled)') + '</a>' : '<span class="nrc-titlelink">' + escapeHtml(title || '(untitled)') + '</span>') +
        '<div class="nrc-metaRow">' + dateHTML + badgeHTML + '</div>' +
        (snippet ? '<div class="nrc-snippet">' + escapeHtml(snippet) + '</div>' : '') +
        (url ? '<a class="nrc-more" href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">more »</a>' : '') +
      '</div>';
    return card;
  }

  function showStatus(text) { var el = getStatusEl(); if (el) { el.textContent = text; el.style.display = 'block'; } }
  function hideStatus() { var el = getStatusEl(); if (el) el.style.display = 'none'; }
  function showError(msg) {
    hideStatus();
    var listEl = getListEl(); if (!listEl) return;
    listEl.innerHTML = '<div class="nrc-error"><div class="nrc-error-title">Failed to load calendar</div><div>' + escapeHtml(msg) + '</div></div>';
  }
  function renderItems(items) {
    var listEl = getListEl(); if (!listEl) return;
    hideStatus();
    listEl.innerHTML = '';
    if (items.length === 0) { listEl.innerHTML = '<div class="nrc-error">No items for this filter.</div>'; return; }
    items.forEach(function(item) { listEl.appendChild(renderCard(item)); });
  }

  function fetchJson() {
    var controller = new AbortController();
    var tid = setTimeout(function() { controller.abort(); }, FETCH_TIMEOUT);
    return fetch(jsonUrl, { signal: controller.signal })
      .then(function(r) { clearTimeout(tid); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function(data) {
        var items = (data && data.items) ? data.items : [];
        if (items.length === 0) throw new Error('No items in calendar data.');
        cachedItems = items;
        applyFilterAndRender();
      })
      .catch(function(err) {
        clearTimeout(tid);
        if (err.name === 'AbortError') showError('Request timeout.');
        else showError(err.message || 'Unknown error.');
      });
  }

  function init() {
    var root = getRoot(); if (!root) return;
    loadSavedFilter();
    renderFilters();
    showStatus('Loading...');
    fetchJson();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
