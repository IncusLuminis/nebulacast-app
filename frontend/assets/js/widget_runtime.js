/* News widget runtime: runNewsWidget(config) — config = { rootId, rssUrl, maxItems, parseMax, filters } */
window.runNewsWidget = function(config) {
  if (!config || !config.rootId) return;
  var ROOT_ID = config.rootId;
  var rssUrl = (config.rssUrl || '').indexOf('?') >= 0 ? config.rssUrl : config.rssUrl + '?ts=' + Date.now();
  var MAX_ITEMS = config.maxItems || 12;
  var PARSE_MAX = config.parseMax != null ? config.parseMax : 300;
  var USE_PROXY = config.useProxy || false;
  var PROXY_URL = 'https://api.allorigins.win/raw?url=';
  var FILTERS = config.filters || ['All', 'News', 'Science', 'Videos', 'Images', 'Nebulacast'];
  var STORAGE_KEY = ROOT_ID + ':filter';
  var FETCH_TIMEOUT = config.fetchTimeout || 30000;
  var activeFilter = 'All';
  var cachedItems = [];

  function getRoot() { return document.getElementById(ROOT_ID); }
  function getStatusEl() { var root = getRoot(); return root ? root.querySelector('[data-role="status"]') : null; }
  function getListEl() { var root = getRoot(); return root ? root.querySelector('[data-role="list"]') : null; }
  function getFiltersEl() { var root = getRoot(); return root ? root.querySelector('[data-role="filters"]') : null; }
  function normCat(s) { return (s || '').trim().toLowerCase(); }
  function readCategory(item) { var c = item.querySelector('category'); return c ? (c.textContent || '').trim().toLowerCase() : ''; }
  function youtubeThumbnailUrl(url) {
    if (!url) return null;
    var patterns = [ /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/ ];
    for (var i = 0; i < patterns.length; i++) { var match = url.match(patterns[i]); if (match && match[1]) return 'https://img.youtube.com/vi/' + match[1] + '/hqdefault.jpg'; }
    return null;
  }
  function loadSavedFilter() { try { var v = localStorage.getItem(STORAGE_KEY); if (v && FILTERS.map(normCat).indexOf(normCat(v)) >= 0) activeFilter = v; } catch (e) {} }
  function saveFilter(v) { try { localStorage.setItem(STORAGE_KEY, v); } catch (e) {} }
  function renderFilters() {
    var el = getFiltersEl(); if (!el) return;
    el.innerHTML = '';
    FILTERS.forEach(function(label) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nrw-filter' + (normCat(label) === normCat(activeFilter) ? ' is-active' : '');
      btn.textContent = label;
      btn.addEventListener('click', function() { activeFilter = label; saveFilter(activeFilter); renderFilters(); applyFilterAndRender(); });
      el.appendChild(btn);
    });
  }
  function applyFilterAndRender() {
    if (!cachedItems || cachedItems.length === 0) return;
    var f = normCat(activeFilter);
    var filtered = f === 'all' ? cachedItems : cachedItems.filter(function(it) { return readCategory(it) === f; });
    var items = Array.prototype.slice.call(filtered, 0, MAX_ITEMS);
    renderItems(items);
  }
  function escapeHtml(text) { if (!text) return ''; var div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
  function decodeHtmlEntities(str) {
    if (!str) return '';
    var decoded = str;
    for (var i = 0; i < 2; i++) { var txt = document.createElement('textarea'); txt.innerHTML = decoded; decoded = txt.value; }
    decoded = decoded.replace(/&amp;#8230;/gi, '...').replace(/&#8230;/gi, '...').replace(/&hellip;/gi, '...').replace(/…/g, '...');
    return decoded;
  }
  function formatDate(dateStr) {
    if (!dateStr) return '';
    try { var date = new Date(dateStr); if (isNaN(date.getTime())) return dateStr; return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return dateStr; }
  }
  function truncateText(text, maxLen) { if (!text) return ''; maxLen = maxLen || 220; var t = text.trim(); return t.length <= maxLen ? t : t.substring(0, maxLen).trim() + '...'; }
  function normalizeDescriptionHTML(s) { if (!s) return ''; return s.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\n/g, '\n'); }
  function extractThumbnailAndSnippet(descriptionHTML) {
    if (!descriptionHTML) return { thumb: null, snippet: '' };
    var tmp = document.createElement('div'); tmp.innerHTML = normalizeDescriptionHTML(descriptionHTML);
    var img = tmp.querySelector('img');
    var thumb = null;
    if (img) { var src = img.getAttribute('src'); if (src && src.indexOf('data:image/svg+xml') !== 0) { var yt = youtubeThumbnailUrl(src); thumb = yt || src; } }
    var snippetEl = tmp.querySelector('.snippet');
    var snippetText = '';
    if (snippetEl) { var more = snippetEl.querySelector('a.more'); if (more) more.remove(); snippetText = decodeHtmlEntities(snippetEl.textContent || snippetEl.innerText || ''); }
    else { var clone = tmp.cloneNode(true); clone.querySelectorAll('a').forEach(function(a) { a.remove(); }); snippetText = decodeHtmlEntities(clone.textContent || clone.innerText || ''); }
    return { thumb: thumb, snippet: truncateText(snippetText, 220) };
  }
  function renderCard(item) {
    var title = (item.querySelector('title') && item.querySelector('title').textContent) || '';
    var link = (item.querySelector('link') && item.querySelector('link').textContent) || '';
    var pubDate = (item.querySelector('pubDate') && item.querySelector('pubDate').textContent) || '';
    var category = (item.querySelector('category') && item.querySelector('category').textContent) || '';
    var descriptionHTML = (item.querySelector('description') && item.querySelector('description').textContent) || '';
    var ext = extractThumbnailAndSnippet(descriptionHTML);
    var card = document.createElement('div'); card.className = 'nrw-card';
    var thumbHTML = ext.thumb ? '<img class="nrw-thumb" src="' + escapeHtml(ext.thumb) + '" alt="" loading="lazy">' : '';
    var badgeHTML = category ? '<span class="nrw-badge">' + escapeHtml(category) + '</span>' : '';
    var dateHTML = pubDate ? '<span class="nrw-date">' + formatDate(pubDate) + '</span>' : '';
    card.innerHTML = thumbHTML + '<div class="nrw-content"><a class="nrw-titlelink" href="' + escapeHtml(link) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(title) + '</a><div class="nrw-metaRow">' + dateHTML + badgeHTML + '</div><a class="nrw-more" href="' + escapeHtml(link) + '" target="_blank" rel="noopener noreferrer">more »</a></div>';
    if (ext.snippet) { var content = card.querySelector('.nrw-content'); var moreLink = content.querySelector('.nrw-more'); var snippetDiv = document.createElement('div'); snippetDiv.className = 'nrw-snippet'; snippetDiv.textContent = ext.snippet; content.insertBefore(snippetDiv, moreLink); }
    return card;
  }
  function showStatus(text) { var el = getStatusEl(); if (el) { el.textContent = text; el.style.display = 'block'; } }
  function hideStatus() { var el = getStatusEl(); if (el) el.style.display = 'none'; }
  function showError(error) {
    var root = getRoot(); if (!root) return;
    hideStatus();
    var msg = error && error.message ? error.message : 'Unknown error';
    var listEl = getListEl(); if (listEl) listEl.innerHTML = '<div class="nrw-error"><div class="nrw-error-title">RSS fetch failed</div><div>' + escapeHtml(msg) + '</div></div>';
  }
  function renderItems(items) {
    var listEl = getListEl(); if (!listEl) return;
    hideStatus(); listEl.innerHTML = '';
    if (items.length === 0) { listEl.innerHTML = '<div class="nrw-error">No items found in RSS feed.</div>'; return; }
    items.forEach(function(item) { listEl.appendChild(renderCard(item)); });
  }
  function buildUrl(useProxy) { return useProxy ? PROXY_URL + encodeURIComponent(rssUrl) : rssUrl; }
  function fetchText(url) {
    var controller = new AbortController();
    var timeoutId = setTimeout(function() { controller.abort(); }, FETCH_TIMEOUT);
    return fetch(url, { signal: controller.signal })
      .then(function(r) { clearTimeout(timeoutId); if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function(text) { if (!text || !text.trim()) throw new Error('Empty response'); return text; })
      .catch(function(err) { clearTimeout(timeoutId); if (err.name === 'AbortError') throw new Error('Request timeout'); throw err; });
  }
  function parseXML(text) { var xml = new DOMParser().parseFromString(text, 'application/xml'); if (xml.querySelector('parsererror')) throw new Error('Invalid RSS XML'); return xml; }
  function loadRSS() {
    var root = getRoot(); if (!root) return;
    try { showStatus('Loading...'); loadSavedFilter(); renderFilters(); } catch (e) {}
    if (USE_PROXY) {
      fetchText(buildUrl(true)).then(function(text) { var xml = parseXML(text); var all = xml.querySelectorAll('item'); cachedItems = PARSE_MAX ? Array.prototype.slice.call(all, 0, PARSE_MAX) : Array.prototype.slice.call(all); applyFilterAndRender(); }).catch(showError);
      return;
    }
    fetchText(buildUrl(false))
      .then(function(text) {
        try { var xml = parseXML(text); var all = xml.querySelectorAll('item'); cachedItems = PARSE_MAX ? Array.prototype.slice.call(all, 0, PARSE_MAX) : Array.prototype.slice.call(all); applyFilterAndRender(); }
        catch (e) { fetchText(buildUrl(true)).then(function(t) { var xml = parseXML(t); var all = xml.querySelectorAll('item'); cachedItems = PARSE_MAX ? Array.prototype.slice.call(all, 0, PARSE_MAX) : Array.prototype.slice.call(all); applyFilterAndRender(); }).catch(showError); }
      })
      .catch(function(err) {
        fetchText(buildUrl(true)).then(function(t) { try { var xml = parseXML(t); var all = xml.querySelectorAll('item'); cachedItems = PARSE_MAX ? Array.prototype.slice.call(all, 0, PARSE_MAX) : Array.prototype.slice.call(all); applyFilterAndRender(); } catch (e) { showError(e); } }).catch(showError);
      });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadRSS);
  else loadRSS();
};

/* Calendar widget runtime: runCalendarWidget(config) — config = { rootId, jsonUrl, maxItems, filters }; data source is JSON */
window.runCalendarWidget = function(config) {
  if (!config || !config.rootId) return;
  var ROOT_ID = config.rootId;
  var jsonUrl = config.jsonUrl || '/calendar/daily_signal.json';
  var MAX_ITEMS = config.maxItems || 20;
  var FILTERS = config.filters || ['All', 'METEORS', 'ECLIPSES', 'CONJUNCTIONS', 'OCCULTATIONS', 'COMETS'];
  var iconBase = (config.iconBase != null) ? config.iconBase : '/assets/icons/alerts';
  if (typeof location !== 'undefined' && location.origin && String(iconBase).charAt(0) === '/') {
    iconBase = location.origin + iconBase;
  }
  var FILTER_ICONS = { 'METEORS': 'meteors.svg', 'ECLIPSES': 'eclipses.svg', 'CONJUNCTIONS': 'conjunctions.svg', 'OCCULTATIONS': 'occultations.svg', 'COMETS': 'comets.svg' };
  var STORAGE_KEY = ROOT_ID + ':filter';
  var FETCH_TIMEOUT = config.fetchTimeout || 15000;
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
      return new Date(it.published_at).getTime() >= todayMs;
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
  function formatDate(dateStr) { if (!dateStr) return ''; try { var d = new Date(dateStr); if (isNaN(d.getTime())) return dateStr; return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return dateStr; } }
  function truncateText(text, maxLen) { if (!text) return ''; maxLen = maxLen || 220; var t = (text + '').trim(); return t.length <= maxLen ? t : t.substring(0, maxLen).trim() + '...'; }
  function renderCard(item) {
    var title = (item.title || '').trim();
    var url = (item.url || '').trim();
    var category = (item.category || item.stream || '').trim();
    var summary = item.summary || '';
    if (!summary && item.summary_html) { var tmp = document.createElement('div'); tmp.innerHTML = item.summary_html; summary = (tmp.textContent || tmp.innerText || '').trim(); }
    var snippet = truncateText(summary, 220);
    var card = document.createElement('div'); card.className = 'nrc-card';
    var iconFile = FILTER_ICONS[category] || '';
    var iconHTML = (iconBase && iconFile) ? '<img class="nrc-card-icon" src="' + escapeHtml(iconBase + '/' + iconFile) + '" alt="" aria-hidden="true">' : '<span class="nrc-card-icon nrc-card-icon-placeholder"></span>';
    var badgeHTML = category ? '<span class="nrc-badge">' + escapeHtml(category) + '</span>' : '';
    var dateHTML = item.published_at ? '<span class="nrc-date">' + formatDate(item.published_at) + '</span>' : '';
    card.innerHTML = iconHTML + '<div class="nrc-content">' + (url ? '<a class="nrc-titlelink" href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(title || '(untitled)') + '</a>' : '<span class="nrc-titlelink">' + escapeHtml(title || '(untitled)') + '</span>') + '<div class="nrc-metaRow">' + dateHTML + badgeHTML + '</div>' + (snippet ? '<div class="nrc-snippet">' + escapeHtml(snippet) + '</div>' : '') + (url ? '<a class="nrc-more" href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">more »</a>' : '') + '</div>';
    return card;
  }
  function showStatus(text) { var el = getStatusEl(); if (el) { el.textContent = text; el.style.display = 'block'; } }
  function hideStatus() { var el = getStatusEl(); if (el) el.style.display = 'none'; }
  function showError(msg) { hideStatus(); var listEl = getListEl(); if (listEl) listEl.innerHTML = '<div class="nrc-error"><div class="nrc-error-title">Failed to load calendar</div><div>' + escapeHtml(msg || 'Unknown error') + '</div></div>'; }
  function renderItems(items) {
    var listEl = getListEl(); if (!listEl) return;
    hideStatus(); listEl.innerHTML = '';
    if (items.length === 0) { listEl.innerHTML = '<div class="nrc-error">No items for this filter.</div>'; return; }
    items.forEach(function(item) { listEl.appendChild(renderCard(item)); });
  }
  function load() {
    var root = getRoot(); if (!root) return;
    loadSavedFilter(); renderFilters(); showStatus('Loading...');
    var ctrl = new AbortController();
    var tid = setTimeout(function() { ctrl.abort(); }, FETCH_TIMEOUT);
    fetch(jsonUrl, { signal: ctrl.signal })
      .then(function(r) { clearTimeout(tid); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function(data) { var items = (data && data.items) ? data.items : []; if (items.length === 0) throw new Error('No items in calendar data.'); cachedItems = items; applyFilterAndRender(); })
      .catch(function(err) { clearTimeout(tid); showError(err.name === 'AbortError' ? 'Request timeout.' : (err.message || 'Unknown error')); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
};
