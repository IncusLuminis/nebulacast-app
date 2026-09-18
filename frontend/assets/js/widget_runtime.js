(function (global) {
  'use strict';

  // This file is the canonical News/Events implementation. Mount APIs accept
  // a root directly; only the legacy run* facades resolve rootId.
  var NEWS_FILTERS = ['All', 'News', 'Science', 'Videos', 'Images', 'Nebulacast'];
  var EVENT_FILTERS = ['All', 'METEORS', 'ECLIPSES', 'CONJUNCTIONS', 'OCCULTATIONS', 'COMETS'];
  var EVENT_ICONS = { METEORS: 'meteors.svg', ECLIPSES: 'eclipses.svg', CONJUNCTIONS: 'conjunctions.svg', OCCULTATIONS: 'occultations.svg', COMETS: 'comets.svg' };
  var PROXY_URL = 'https://api.allorigins.win/raw?url=';
  var rootKeys = typeof WeakMap === 'function' ? new WeakMap() : null;
  var nextRootKey = 0;

  function documentFor(root) { return root.ownerDocument || global.document; }
  function requireRoot(root) {
    if (!root || typeof root.querySelector !== 'function') throw new TypeError('Widget mount requires a supplied root');
    return root;
  }
  function norm(value) { return String(value || '').trim().toLowerCase(); }
  function filters(value, fallback) { return Array.isArray(value) && value.length ? value.slice() : fallback.slice(); }
  function escape(value, doc) {
    if (!value) return '';
    var node = doc.createElement('div'); node.textContent = String(value); return node.innerHTML;
  }
  function storageKey(root, prefix) {
    if (root.id) return root.id + ':filter';
    if (rootKeys) { if (!rootKeys.has(root)) rootKeys.set(root, ++nextRootKey); return prefix + ':' + rootKeys.get(root) + ':filter'; }
    return prefix + ':filter';
  }
  function readStorage(key) { try { return global.localStorage?.getItem(key) || null; } catch (_) { return null; } }
  function writeStorage(key, value) { try { global.localStorage?.setItem(key, value); } catch (_) {} }
  function dateText(value) {
    if (!value) return '';
    try { var date = new Date(value); return isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch (_) { return value; }
  }
  function truncate(value) {
    var text = String(value || '').trim(); return text.length <= 220 ? text : text.substring(0, 220).trim() + '...';
  }
  function decodeEntities(value, doc) {
    var decoded = String(value || '');
    for (var i = 0; i < 2; i++) { var textarea = doc.createElement('textarea'); textarea.innerHTML = decoded; decoded = textarea.value; }
    return decoded.replace(/&amp;#8230;/gi, '...').replace(/&#8230;/gi, '...').replace(/&hellip;/gi, '...').replace(/…/g, '...');
  }
  function youtubeThumbnail(url) {
    var match = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/);
    return match && match[1] ? 'https://img.youtube.com/vi/' + match[1] + '/hqdefault.jpg' : null;
  }
  function ensureMarkup(root, type, doc, config) {
    if (root.querySelector('[data-role="status"]') && root.querySelector('[data-role="list"]') && root.querySelector('[data-role="filters"]')) return;
    if (type === 'news') {
      root.innerHTML = '<div class="nrw-root"><div class="nrw-header"><div class="nrw-title">News Radar</div><div class="nrw-meta"><a class="nrw-rss" href="' + escape(config.rssUrl, doc) + '" target="_blank" rel="noopener">RSS</a></div></div><div class="nrw-filters" data-role="filters"></div><div class="nrw-status" data-role="status">Loading...</div><div class="nrw-list" data-role="list"></div></div>';
    } else {
      root.innerHTML = '<div class="nrc-root"><div class="nrc-header"><div class="nrc-title">Sky Alerts</div><div class="nrc-meta"><a class="nrc-link" href="' + escape(config.jsonUrl, doc) + '" target="_blank" rel="noopener">JSON</a><a class="nrc-link" href="' + escape(config.rssUrl, doc) + '" target="_blank" rel="noopener">RSS</a></div></div><div class="nrc-filters" data-role="filters"></div><div class="nrc-status" data-role="status">Loading...</div><div class="nrc-list" data-role="list"></div></div>';
    }
  }
  function parts(root) { return { status: root.querySelector('[data-role="status"]'), list: root.querySelector('[data-role="list"]'), filters: root.querySelector('[data-role="filters"]') }; }
  function status(partsRef, value) { if (partsRef.status) { partsRef.status.textContent = value; partsRef.status.style.display = 'block'; } }
  function hideStatus(partsRef) { if (partsRef.status) partsRef.status.style.display = 'none'; }
  function safeAbort() { return typeof global.AbortController === 'function' ? new global.AbortController() : null; }
  function fetchWithTimeout(url, timeout, fetchRef, json, suppliedController) {
    if (typeof fetchRef !== 'function') return Promise.reject(new Error('Fetch is unavailable'));
    var controller = suppliedController || safeAbort(); var timer = global.setTimeout(function () { controller?.abort(); }, timeout);
    var options = controller ? { signal: controller.signal } : undefined;
    return fetchRef(url, options).then(function (response) {
      global.clearTimeout(timer); if (!response.ok) throw new Error('HTTP ' + response.status); return json ? response.json() : response.text();
    }).then(function (value) { if (!json && (!value || !value.trim())) throw new Error('Empty response'); return value; }).catch(function (error) {
      global.clearTimeout(timer); if (error?.name === 'AbortError') throw new Error(json ? 'Request timeout.' : 'Request timeout'); throw error;
    });
  }
  function parseXml(text) {
    var xml = new global.DOMParser().parseFromString(text, 'application/xml');
    if (xml.querySelector('parsererror')) throw new Error('Invalid RSS XML'); return xml;
  }
  function rssDescription(value, doc) {
    if (!value) return { thumb: null, snippet: '' };
    var temp = doc.createElement('div'); temp.innerHTML = String(value).replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\n/g, '\n');
    var image = temp.querySelector('img'); var src = image?.getAttribute('src') || null;
    var thumb = src && src.indexOf('data:image/svg+xml') !== 0 ? (youtubeThumbnail(src) || src) : null;
    var snippet = temp.querySelector('.snippet');
    if (snippet) { var more = snippet.querySelector('a.more'); more?.remove?.(); }
    else snippet = temp;
    return { thumb: thumb, snippet: truncate(decodeEntities(snippet?.textContent || snippet?.innerText || '', doc)) };
  }

  function mountNewsWidget(rootRef, suppliedConfig) {
    var root = requireRoot(rootRef), doc = documentFor(root);
    var config = Object.assign({ rssUrl: '/news/rss.xml', maxItems: 12, parseMax: 300, filters: NEWS_FILTERS, useProxy: false, fetchTimeout: 30000 }, suppliedConfig || {});
    config.rssUrl = config.rssUrl || '/news/rss.xml'; config.maxItems = config.maxItems || 12; config.parseMax = config.parseMax == null ? 300 : config.parseMax; config.fetchTimeout = config.fetchTimeout || 30000; config.filters = filters(config.filters, NEWS_FILTERS);
    ensureMarkup(root, 'news', doc, config); var els = parts(root); var key = config.storageKey || storageKey(root, 'nrw');
    var active = 'All', cached = [], alive = true, sequence = 0, controller = null;
    function saved() { var value = readStorage(key); if (value && config.filters.map(norm).indexOf(norm(value)) >= 0) active = value; }
    function renderFilters() {
      if (!els.filters) return; els.filters.innerHTML = '';
      config.filters.forEach(function (label) { var button = doc.createElement('button'); button.type = 'button'; button.className = 'nrw-filter' + (norm(label) === norm(active) ? ' is-active' : ''); button.textContent = label; button.addEventListener('click', function () { if (!alive) return; active = label; writeStorage(key, active); renderFilters(); render(); }); els.filters.appendChild(button); });
    }
    function category(item) { return norm(item.querySelector('category')?.textContent); }
    function card(item) {
      var title = item.querySelector('title')?.textContent || '', link = item.querySelector('link')?.textContent || '', pubDate = item.querySelector('pubDate')?.textContent || '', cat = item.querySelector('category')?.textContent || '';
      var info = rssDescription(item.querySelector('description')?.textContent || '', doc), node = doc.createElement('div'); node.className = 'nrw-card';
      node.innerHTML = (info.thumb ? '<img class="nrw-thumb" src="' + escape(info.thumb, doc) + '" alt="" loading="lazy">' : '') + '<div class="nrw-content"><a class="nrw-titlelink" href="' + escape(link, doc) + '" target="_blank" rel="noopener noreferrer">' + escape(title, doc) + '</a><div class="nrw-metaRow">' + (pubDate ? '<span class="nrw-date">' + escape(dateText(pubDate), doc) + '</span>' : '') + (cat ? '<span class="nrw-badge">' + escape(cat, doc) + '</span>' : '') + '</div>' + (info.snippet ? '<div class="nrw-snippet">' + escape(info.snippet, doc) + '</div>' : '') + '<a class="nrw-more" href="' + escape(link, doc) + '" target="_blank" rel="noopener noreferrer">more »</a></div>';
      return node;
    }
    function render() {
      if (!els.list) return; var wanted = norm(active), list = wanted === 'all' ? cached.slice() : cached.filter(function (item) { return category(item) === wanted; });
      list.sort(function (a, b) { return new Date(b.querySelector('pubDate')?.textContent || '').getTime() - new Date(a.querySelector('pubDate')?.textContent || '').getTime(); });
      hideStatus(els); els.list.innerHTML = ''; if (!list.length) { els.list.innerHTML = '<div class="nrw-error">No items found in RSS feed.</div>'; return; } list.slice(0, config.maxItems).forEach(function (item) { els.list.appendChild(card(item)); });
    }
    function refresh() {
      if (!alive) return Promise.resolve(); var current = ++sequence; controller?.abort?.(); controller = null; var fetchRef = config.fetch || global.fetch; var source = String(config.rssUrl).indexOf('?') >= 0 ? String(config.rssUrl) : String(config.rssUrl) + '?ts=' + Date.now();
      status(els, 'Loading...'); saved(); renderFilters();
      function request(url) {
        var attemptController = safeAbort();
        controller = attemptController;
        return fetchWithTimeout(url, config.fetchTimeout, fetchRef, false, attemptController)
          .finally(function () { if (controller === attemptController) controller = null; });
      }
      var requestUrl = config.useProxy ? PROXY_URL + encodeURIComponent(source) : source;
      function parseAndRender(text) {
        if (!alive || current !== sequence) return;
        var all = Array.prototype.slice.call(parseXml(text).querySelectorAll('item'));
        cached = config.parseMax ? all.slice(0, config.parseMax) : all;
        render();
      }
      function requestProxy() { return request(PROXY_URL + encodeURIComponent(source)).then(parseAndRender); }
      var requestPromise;
      if (config.useProxy) {
        requestPromise = request(requestUrl).then(parseAndRender);
      } else {
        requestPromise = request(source).then(function (text) {
          try { parseAndRender(text); }
          catch (_) { return requestProxy(); }
        }, function () { return requestProxy(); });
      }
      return requestPromise.catch(function (error) { if (!alive || current !== sequence) return; hideStatus(els); if (els.list) els.list.innerHTML = '<div class="nrw-error"><div class="nrw-error-title">RSS fetch failed</div><div>' + escape(error?.message || 'Unknown error', doc) + '</div><div class="nrw-error-hint"><strong>Both direct fetch and proxy attempts failed.</strong></div></div>'; });
    }
    var handle = { update: function (patch) { if (!alive) return; patch = patch || {}; var sourceChanged = patch.rssUrl !== undefined || patch.parseMax !== undefined || patch.useProxy !== undefined || patch.fetchTimeout !== undefined || patch.fetch !== undefined; config = Object.assign({}, config, patch); if (patch.filters !== undefined) config.filters = filters(patch.filters, NEWS_FILTERS); if (!config.filters.map(norm).some(function (x) { return x === norm(active); })) active = 'All'; renderFilters(); if (sourceChanged) return refresh(); render(); }, resize: function () {}, refresh: refresh, destroy: function () { if (!alive) return; alive = false; ++sequence; controller?.abort?.(); controller = null; } };
    refresh(); return handle;
  }

  function iconBase(config, root) { var value = config.iconBase; var origin = root.ownerDocument?.defaultView?.location?.origin; return origin && String(value).charAt(0) === '/' ? origin + value : value; }
  function mountCalendarWidget(rootRef, suppliedConfig) {
    var root = requireRoot(rootRef), doc = documentFor(root);
    var config = Object.assign({ jsonUrl: '/calendar/daily_signal.json', rssUrl: '/alerts/rss.xml', maxItems: 20, timeRange: 'upcoming', filters: EVENT_FILTERS, iconBase: '/assets/icons/alerts', fetchTimeout: 15000 }, suppliedConfig || {});
    config.jsonUrl = config.jsonUrl || '/calendar/daily_signal.json'; config.rssUrl = config.rssUrl || '/alerts/rss.xml'; config.maxItems = config.maxItems || 20; config.timeRange = config.timeRange || 'upcoming'; config.filters = filters(config.filters, EVENT_FILTERS); config.fetchTimeout = config.fetchTimeout || 15000;
    ensureMarkup(root, 'events', doc, config); var els = parts(root), key = config.storageKey || storageKey(root, 'nrc'); var active = 'All', cached = [], alive = true, sequence = 0, controller = null;
    function saved() { var value = readStorage(key); if (value && config.filters.map(norm).indexOf(norm(value)) >= 0) active = value; }
    function cat(item) { return norm(item.category || item.stream); }
    function renderFilters() { if (!els.filters) return; els.filters.innerHTML = ''; config.filters.forEach(function (label) { var button = doc.createElement('button'); button.type = 'button'; button.className = 'nrc-filter' + (norm(label) === norm(active) ? ' is-active' : ''); var file = EVENT_ICONS[label]; if (file && config.iconBase) { var image = doc.createElement('img'); image.className = 'nrc-filter-icon'; image.src = iconBase(config, root) + '/' + file; image.alt = ''; image.setAttribute('aria-hidden', 'true'); button.appendChild(image); } button.appendChild(doc.createTextNode(label)); button.addEventListener('click', function () { if (!alive) return; active = label; writeStorage(key, active); renderFilters(); render(); }); els.filters.appendChild(button); }); }
    function card(item) { var title = String(item.title || '').trim(), url = String(item.url || '').trim(), category = String(item.category || item.stream || '').trim(), summary = item.summary || ''; if (!summary && item.summary_html) { var temp = doc.createElement('div'); temp.innerHTML = item.summary_html; summary = temp.textContent || temp.innerText || ''; } var node = doc.createElement('div'), base = iconBase(config, root), file = EVENT_ICONS[category] || ''; node.className = 'nrc-card'; node.innerHTML = (base && file ? '<img class="nrc-card-icon" src="' + escape(base + '/' + file, doc) + '" alt="" aria-hidden="true">' : '<span class="nrc-card-icon nrc-card-icon-placeholder"></span>') + '<div class="nrc-content">' + (url ? '<a class="nrc-titlelink" href="' + escape(url, doc) + '" target="_blank" rel="noopener noreferrer">' + escape(title || '(untitled)', doc) + '</a>' : '<span class="nrc-titlelink">' + escape(title || '(untitled)', doc) + '</span>') + '<div class="nrc-metaRow">' + (item.published_at ? '<span class="nrc-date">' + escape(dateText(item.published_at), doc) + '</span>' : '') + (category ? '<span class="nrc-badge">' + escape(category, doc) + '</span>' : '') + '</div>' + (summary ? '<div class="nrc-snippet">' + escape(truncate(summary), doc) + '</div>' : '') + (url ? '<a class="nrc-more" href="' + escape(url, doc) + '" target="_blank" rel="noopener noreferrer">more »</a>' : '') + '</div>'; return node; }
    function render() { var today = new Date(); today.setUTCHours(0, 0, 0, 0); var upcomingOnly = norm(config.timeRange) !== 'all'; var list = cached.filter(function (item) { if (!item.published_at) return false; return !upcomingOnly || new Date(item.published_at).getTime() >= today.getTime(); }); var wanted = norm(active); if (wanted !== 'all') list = list.filter(function (item) { return cat(item) === wanted; }); list.sort(function (a, b) { return new Date(a.published_at).getTime() - new Date(b.published_at).getTime(); }); hideStatus(els); els.list.innerHTML = ''; if (!list.length) { els.list.innerHTML = '<div class="nrc-error">No items for this filter.</div>'; return; } list.slice(0, config.maxItems).forEach(function (item) { els.list.appendChild(card(item)); }); }
    function refresh() { if (!alive) return Promise.resolve(); var current = ++sequence; controller?.abort?.(); var requestController = safeAbort(); controller = requestController; status(els, 'Loading...'); saved(); renderFilters(); return fetchWithTimeout(config.jsonUrl, config.fetchTimeout, config.fetch || global.fetch, true, requestController).then(function (data) { if (!alive || current !== sequence) return; var items = data && Array.isArray(data.items) ? data.items : []; if (!items.length) throw new Error('No items in calendar data.'); cached = items; render(); }).catch(function (error) { if (!alive || current !== sequence) return; hideStatus(els); els.list.innerHTML = '<div class="nrc-error"><div class="nrc-error-title">Failed to load calendar</div><div>' + escape(error?.message || 'Unknown error', doc) + '</div></div>'; }).finally(function () { if (controller === requestController) controller = null; }); }
    var handle = { update: function (patch) { if (!alive) return; patch = patch || {}; var sourceChanged = patch.jsonUrl !== undefined || patch.fetchTimeout !== undefined || patch.fetch !== undefined; config = Object.assign({}, config, patch); if (patch.filters !== undefined) config.filters = filters(patch.filters, EVENT_FILTERS); if (!config.filters.map(norm).some(function (x) { return x === norm(active); })) active = 'All'; renderFilters(); if (sourceChanged) return refresh(); render(); }, resize: function () {}, refresh: refresh, destroy: function () { if (!alive) return; alive = false; ++sequence; controller?.abort?.(); controller = null; } };
    refresh(); return handle;
  }

  function legacyRoot(rootId) { if (!global.document?.querySelector || !rootId) return null; var id = String(rootId).replace(/\\/g, '\\\\').replace(/"/g, '\\"'); return global.document.querySelector('[id="' + id + '"]'); }
  function runNewsWidget(config) { var root = config && legacyRoot(config.rootId); return root ? mountNewsWidget(root, config) : undefined; }
  function runCalendarWidget(config) { var root = config && legacyRoot(config.rootId); return root ? mountCalendarWidget(root, config) : undefined; }
  global.NebulacastWidgetRuntime = { mountNewsWidget: mountNewsWidget, mountCalendarWidget: mountCalendarWidget };
  global.mountNewsWidget = mountNewsWidget; global.mountCalendarWidget = mountCalendarWidget;
  global.runNewsWidget = runNewsWidget; global.runCalendarWidget = runCalendarWidget;
}(typeof globalThis !== 'undefined' ? globalThis : window));
