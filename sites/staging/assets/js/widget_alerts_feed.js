(function () {
  'use strict';

  var GROUPS = [
    { key: 'grb',       icon: '🚨', label: 'Gamma-Ray Bursts'   },
    { key: 'transient', icon: '💥', label: 'Transients'          },
    { key: 'neocp',     icon: '🪨', label: 'NEOCP Candidates'    },
    { key: 'neo',       icon: '🪨', label: 'Near-Earth Objects'  },
    { key: 'risk',      icon: '⚠️',  label: 'Impact Risk'         },
  ];
  var GROUP_BY_KEY = {};
  GROUPS.forEach(function (g) { GROUP_BY_KEY[g.key] = g; });

  var STORAGE_KEY = 'nc-alerts-state';
  var state = { mode: 'type', dateDir: 'desc', hazardDir: 'desc', scoreDir: 'desc', collapsed: {} };
  var _data = null;
  var _listEl = null;
  var _maxPerGroup = 5;

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode: state.mode,
        dateDir: state.dateDir,
        hazardDir: state.hazardDir,
        scoreDir: state.scoreDir,
        collapsed: state.collapsed
      }));
    } catch (_) {}
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      var modes = ['type', 'date', 'hazard', 'score'];
      var dirs  = ['asc', 'desc'];
      if (modes.indexOf(s.mode) !== -1)         state.mode      = s.mode;
      if (dirs.indexOf(s.dateDir) !== -1)        state.dateDir   = s.dateDir;
      if (dirs.indexOf(s.hazardDir) !== -1)      state.hazardDir = s.hazardDir;
      if (dirs.indexOf(s.scoreDir) !== -1)       state.scoreDir  = s.scoreDir;
      if (s.collapsed && typeof s.collapsed === 'object') state.collapsed = s.collapsed;
    } catch (_) {}
  }

  window.runAlertsWidget = function (config) {
    var root = document.getElementById(config.rootId);
    if (!root) return;

    _maxPerGroup = config.maxPerGroup || 5;
    _listEl      = root.querySelector('[data-role="list"]');
    var statusEl  = root.querySelector('[data-role="status"]');
    var sortBarEl = root.querySelector('[data-role="sort-bar"]');

    loadState();
    buildSortBar(sortBarEl);
    syncSortBar(sortBarEl);

    fetch(config.dataUrl || '/sky/data/alerts_now.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (data) {
        _data = data;
        statusEl.style.display = 'none';
        rerender();
      })
      .catch(function () { statusEl.textContent = 'Failed to load data.'; });
  };

  // ── Sort bar ──────────────────────────────────────────────────────────────

  function buildSortBar(el) {
    el.innerHTML =
      '<button class="naf-sort-btn active" data-mode="type">By Type</button>' +
      '<button class="naf-sort-btn" data-mode="date">By Date <span class="naf-sort-dir" data-dir="date">↓</span></button>' +
      '<button class="naf-sort-btn" data-mode="hazard">By Hazard Score <span class="naf-sort-dir" data-dir="hazard">↓</span></button>' +
      '<button class="naf-sort-btn" data-mode="score">By Score <span class="naf-sort-dir" data-dir="score">↓</span></button>' +
      '<button class="naf-help-btn" aria-label="Glossary">?</button>' +
      '<div class="naf-help-pop">' +
        '<dl>' +
          '<dt>IP</dt><dd>Impact Probability — likelihood of a future Earth impact (e.g. 3.77e-4 ≈ 0.04%)</dd>' +
          '<dt>PS</dt><dd>Palermo Scale — logarithmic hazard index; PS &lt; 0 = below background risk; PS &gt; 0 = above average threat</dd>' +
          '<dt>NEOCP</dt><dd>Near-Earth Object Confirmation Page — unconfirmed asteroid candidates reported to the Minor Planet Center</dd>' +
          '<dt>Mag</dt><dd>Apparent magnitude — object brightness as seen from Earth (lower = brighter)</dd>' +
          '<dt>Hazard %</dt><dd>External danger score: urgency, orbital hazard, observability, size estimate, and detection reliability</dd>' +
          '<dt>Score %</dt><dd>Overall pipeline score aggregating all factors across every alert category</dd>' +
        '</dl>' +
      '</div>';

    var helpBtn = el.querySelector('.naf-help-btn');
    var helpPop = el.querySelector('.naf-help-pop');
    helpBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      helpPop.classList.toggle('open');
    });
    document.addEventListener('click', function () {
      helpPop.classList.remove('open');
    });

    el.querySelectorAll('.naf-sort-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mode = btn.dataset.mode;
        if (mode === state.mode) {
          if (mode === 'date')   state.dateDir   = state.dateDir   === 'desc' ? 'asc' : 'desc';
          if (mode === 'hazard') state.hazardDir = state.hazardDir === 'desc' ? 'asc' : 'desc';
          if (mode === 'score')  state.scoreDir  = state.scoreDir  === 'desc' ? 'asc' : 'desc';
        } else {
          state.mode = mode;
        }
        syncSortBar(el);
        rerender();
        saveState();
      });
    });
  }

  function syncSortBar(el) {
    el.querySelectorAll('.naf-sort-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.mode === state.mode);
    });
    var dirs = { date: state.dateDir, hazard: state.hazardDir, score: state.scoreDir };
    el.querySelectorAll('.naf-sort-dir').forEach(function (span) {
      span.textContent = dirs[span.dataset.dir] === 'asc' ? '↑' : '↓';
    });
  }

  // ── Render dispatcher ─────────────────────────────────────────────────────

  function rerender() {
    if (!_data || !_data.groups) return;
    if (state.mode === 'type') {
      renderByType(_data.groups);
    } else if (state.mode === 'date') {
      var items = flattenAll(_data.groups);
      items.sort(function (a, b) {
        var ta = itemDate(a), tb = itemDate(b);
        return state.dateDir === 'desc' ? tb - ta : ta - tb;
      });
      renderFlat(items, 'date');
    } else if (state.mode === 'hazard') {
      var items = flattenAll(_data.groups).filter(function (it) {
        return it.group !== 'grb' && it.group !== 'transient';
      });
      items.sort(function (a, b) {
        var d = externalScore(b) - externalScore(a);
        return state.hazardDir === 'desc' ? d : -d;
      });
      renderFlat(items, 'hazard');
    } else {
      var items = flattenAll(_data.groups);
      items.sort(function (a, b) {
        var d = topScore(b) - topScore(a);
        return state.scoreDir === 'desc' ? d : -d;
      });
      renderFlat(items, 'score');
    }
  }

  // ── By Type (grouped with collapse toggle) ────────────────────────────────

  function renderByType(groups) {
    var html = '';
    for (var gi = 0; gi < GROUPS.length; gi++) {
      var gdef  = GROUPS[gi];
      var items = groups[gdef.key];
      if (!Array.isArray(items) || !items.length) continue;

      var isCollapsed = !!state.collapsed[gdef.key];
      var shown       = items.slice(0, _maxPerGroup);
      var extra       = items.length - shown.length;

      html += '<div class="naf-group">';
      html += '<div class="naf-group-header" data-group="' + gdef.key + '">';
      html += '<span class="naf-group-toggle">' + (isCollapsed ? '▶' : '▼') + '</span>';
      html += '<span class="naf-group-icon">'  + gdef.icon + '</span>';
      html += '<span class="naf-group-label">' + esc(gdef.label) + '</span>';
      html += '<span class="naf-group-count">' + items.length + ' item' + (items.length !== 1 ? 's' : '') + '</span>';
      html += '</div>';

      if (!isCollapsed) {
        html += '<div class="naf-group-body">';
        for (var ii = 0; ii < shown.length; ii++) {
          // By Type: detail = note · metric, end = date
          html += itemHtml(shown[ii], gdef.icon, null, itemDateStr(shown[ii]));
        }
        if (extra > 0) html += '<div class="naf-more">+' + extra + ' more</div>';
        html += '</div>';
      }
      html += '</div>';
    }

    if (!html) {
      _listEl.innerHTML = '<div class="naf-status">No alerts at this time.</div>';
      return;
    }
    _listEl.innerHTML = html;

    _listEl.querySelectorAll('.naf-group-header').forEach(function (hdr) {
      hdr.addEventListener('click', function () {
        var key = hdr.dataset.group;
        state.collapsed[key] = !state.collapsed[key];
        rerender();
        saveState();
      });
    });
  }

  // ── Flat (date / score) ───────────────────────────────────────────────────

  function renderFlat(items, hint) {
    if (!items.length) {
      _listEl.innerHTML = '<div class="naf-status">No alerts at this time.</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var it   = items[i];
      var gdef = GROUP_BY_KEY[it.group] || { icon: '⚠️', label: it.group || '' };
      var endVal;
      if (hint === 'date') {
        endVal = itemDateStr(it);
      } else if (hint === 'hazard') {
        var hs = externalScore(it);
        endVal = hs > 0 ? (hs * 100).toFixed(0) + '%' : null;
      } else {
        var ts = topScore(it);
        endVal = ts > 0 ? (ts * 100).toFixed(0) + '%' : null;
      }
      // Flat: risk items — metrics only, no group label or note
      var grpLabel = it.group === 'risk' ? '' : 'Group: ' + gdef.label;
      html += itemHtml(it, gdef.icon, grpLabel, endVal);
    }
    _listEl.innerHTML = html;
  }

  // ── Item HTML builder — single row ────────────────────────────────────────
  // Grouped (groupLabel=null): name  note · metric  [date]
  // Flat    (groupLabel=str) : name  Group: Label · metric  [date|hazard%]

  function itemHtml(it, icon, groupLabel, endVal) {
    var metric = keyMetric(it);
    var name   = it.id || it.title || '—';

    var detailParts = [];
    if (groupLabel) {
      detailParts.push(groupLabel);
    } else if (groupLabel === null && it.note && it.note !== metric) {
      // null = grouped mode: fall back to note; '' = flat risk: show metrics only
      detailParts.push(it.note.slice(0, 70));
    }
    if (metric) detailParts.push(metric);
    var detail = detailParts.join(' · ');

    var html = '<div class="naf-item">';
    html += '<span class="naf-item-icon">'   + icon + '</span>';
    html += '<span class="naf-item-name">'   + esc(name) + '</span>';
    if (detail) html += '<span class="naf-item-detail">' + esc(detail) + '</span>';
    if (endVal) html += '<span class="naf-item-end">'    + esc(endVal) + '</span>';
    html += '</div>';
    return html;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function flattenAll(groups) {
    var all = [];
    for (var gi = 0; gi < GROUPS.length; gi++) {
      var items = groups[GROUPS[gi].key];
      if (Array.isArray(items)) {
        for (var i = 0; i < items.length; i++) all.push(items[i]);
      }
    }
    return all;
  }

  function itemDate(item) {
    try {
      if (item.updated_utc) return new Date(item.updated_utc).getTime();
      if (item.discovery) {
        var d = item.discovery;
        return new Date(
          d.year + '-' + String(d.month).padStart(2, '0') + '-' +
          String(Math.floor(+d.day)).padStart(2, '0')
        ).getTime();
      }
    } catch (e) {}
    return 0;
  }

  function itemDateStr(item) {
    var t = itemDate(item);
    if (!t) return null;
    try {
      return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch (e) { return null; }
  }

  // External danger score: meta.scoring.external.score_norm (0-1)
  function externalScore(item) {
    try { return Number(item.meta.scoring.external.score_norm) || 0; }
    catch (e) { return 0; }
  }

  // Overall top-level score: score_norm (0-1) from aggregated pipeline
  function topScore(item) {
    if (item.score_norm != null) return Number(item.score_norm);
    if (item.score_raw  != null) return Number(item.score_raw) / 100;
    return 0;
  }

  function keyMetric(item) {
    var g    = String(item.group || '').toLowerCase();
    var meta = item.meta || {};
    if (g === 'grb') {
      return item.note ? item.note.slice(0, 60) : null;
    }
    if (g === 'neocp') {
      return item.mag != null ? 'Mag ' + item.mag.toFixed(1) : null;
    }
    if (g === 'transient') {
      var p = [];
      if (item.type)        p.push(item.type);
      if (item.mag != null) p.push('Mag ' + item.mag.toFixed(1));
      return p.join(' · ') || null;
    }
    if (g === 'neo') {
      var p = [];
      if (meta.dist_ld != null)         p.push(meta.dist_ld.toFixed(2) + ' LD');
      else if (meta.dist_au != null)    p.push(meta.dist_au.toFixed(3) + ' AU');
      if (meta.diameter_est_km != null) p.push('⌀ ' + meta.diameter_est_km + ' km');
      return p.join(' · ') || null;
    }
    if (g === 'risk') {
      var p = [];
      if (meta.ip != null) p.push('IP ' + meta.ip.toExponential(2));
      if (meta.ps != null) p.push('PS ' + meta.ps.toFixed(2));
      return p.join(' · ') || null;
    }
    return null;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
