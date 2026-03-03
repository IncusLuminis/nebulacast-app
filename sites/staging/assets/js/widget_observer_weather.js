/**
 * Observer Weather Panel — reads observer_weather_now.json
 * Self-contained, no external dependencies.
 * Usage: window.runObserverWeatherPanel(el, { jsonUrl: '/data/observer_weather_now.json' })
 */
(function () {
  'use strict';

  var REFETCH_MS = 10 * 60 * 1000; // 10 minutes

  // ── Wind direction arrow ─────────────────────────────────────────────────
  var WIND_DIRS = ['N','NE','E','SE','S','SW','W','NW'];
  function windDirLabel(deg) {
    if (deg == null) return '—';
    return WIND_DIRS[Math.round(deg / 45) % 8];
  }

  // ── Risk badge colour ────────────────────────────────────────────────────
  var RISK_COLOR = { high: '#e05c5c', medium: '#e0a84a', low: '#5cce8c', unknown: '#888' };
  function riskStyle(level) {
    return 'background:' + (RISK_COLOR[level] || RISK_COLOR.unknown) + ';color:#000;padding:1px 6px;border-radius:4px;font-size:0.75em;font-weight:600';
  }

  // ── Format UTC timestamp ─────────────────────────────────────────────────
  function fmtHour(ts) {
    // ts = "2026-03-02T11:00:00Z"
    try {
      var d = new Date(ts);
      return d.toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false }) + ' UTC';
    } catch (e) { return ts; }
  }
  function fmtTimeShort(ts) {
    try {
      var d = new Date(ts);
      return d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false });
    } catch (e) { return ''; }
  }
  function fmtDayShort(ts) {
    try {
      var d = new Date(ts);
      return d.toLocaleString('en-GB', { weekday: 'short', timeZone: 'UTC' });
    } catch (e) { return ''; }
  }

  // ── Cloud bar ────────────────────────────────────────────────────────────
  function cloudColor(pct) {
    if (pct == null) return '#444';
    if (pct < 25) return '#5cce8c';
    if (pct < 50) return '#a8cc6a';
    if (pct < 75) return '#e0a84a';
    return '#e05c5c';
  }

  // ── Summary stats ────────────────────────────────────────────────────────
  function computeSummary(hourly) {
    var now = new Date();
    var cutoff12h = new Date(now.getTime() + 12 * 3600 * 1000);
    var clouds = [], gusts = [];
    for (var i = 0; i < hourly.length; i++) {
      var h = hourly[i];
      var t = new Date(h.timestamp_utc);
      if (t >= now && t <= cutoff12h) {
        var c = h.cloud && h.cloud.total_percent;
        var g = h.wind && h.wind.gust_mps;
        if (c != null) clouds.push(c);
        if (g != null) gusts.push(g);
      }
    }
    var avgCloud = clouds.length ? Math.round(clouds.reduce(function(a,b){return a+b;}, 0) / clouds.length) : null;
    var maxGust = gusts.length ? Math.max.apply(null, gusts).toFixed(1) : null;
    return { avgCloud: avgCloud, maxGust: maxGust };
  }

  // ── Render hourly strip ──────────────────────────────────────────────────
  function renderStrip(hourly) {
    if (!hourly || !hourly.length) {
      return '<div style="color:#888;padding:16px">No hourly data available.</div>';
    }
    var html = '<div class="owp-strip" role="list">';
    var prevDay = null;
    for (var i = 0; i < hourly.length; i++) {
      var h = hourly[i];
      var ts = h.timestamp_utc;
      var cloud = h.cloud || {};
      var wind = h.wind || {};
      var pct = cloud.total_percent;
      var spd = wind.speed_mps != null ? wind.speed_mps.toFixed(1) : '—';
      var gust = wind.gust_mps != null ? '+' + wind.gust_mps.toFixed(1) : '';
      var dir = windDirLabel(wind.direction_deg);
      var timeLabel = fmtTimeShort(ts);
      var dayLabel = fmtDayShort(ts);
      var dayBorder = '';
      if (dayLabel !== prevDay) {
        dayBorder = 'border-left:2px solid rgba(255,255,255,0.15);';
        prevDay = dayLabel;
      }

      html += '<div class="owp-col" role="listitem" title="' + fmtHour(ts) + '" style="' + dayBorder + '">'
        + '<div class="owp-day">' + (dayBorder ? dayLabel : '') + '</div>'
        + '<div class="owp-time">' + timeLabel + '</div>'
        + '<div class="owp-cloud-bar-wrap">'
        +   '<div class="owp-cloud-bar" style="height:' + (pct != null ? Math.round(pct * 0.5) : 0) + 'px;background:' + cloudColor(pct) + '" aria-label="Cloud ' + (pct != null ? pct + '%' : '?') + '"></div>'
        + '</div>'
        + '<div class="owp-cloud-pct">' + (pct != null ? Math.round(pct) + '%' : '—') + '</div>'
        + '<div class="owp-wind-dir">' + dir + '</div>'
        + '<div class="owp-wind-spd">' + spd + '<span class="owp-unit"> m/s</span></div>'
        + (gust ? '<div class="owp-wind-gust">' + gust + '</div>' : '<div class="owp-wind-gust"></div>')
        + '</div>';
    }
    html += '</div>';
    return html;
  }

  // ── Render full panel ────────────────────────────────────────────────────
  function renderPanel(el, data) {
    var hourly = data.hourly || [];
    var derived = data.derived || {};
    var obs = data.observer || {};
    var gen = data.generated_utc || '';
    var summary = computeSummary(hourly);

    var dewRisk = (derived.dew_risk || {}).next_12h_max || 'unknown';
    var windRisk = (derived.wind_risk || {}).next_12h_max || 'unknown';
    var cw = derived.cloud_window || {};
    var bestStart = cw.best_window_start_utc;
    var bestEnd = cw.best_window_end_utc;
    var bestWindowStr = (bestStart && bestEnd)
      ? fmtTimeShort(bestStart) + '–' + fmtTimeShort(bestEnd) + ' UTC'
      : 'No clear window';

    var summaryHtml = '<div class="owp-summary">'
      + '<div class="owp-kpi"><span class="owp-kpi-label">Avg Cloud 12h</span><span class="owp-kpi-val">' + (summary.avgCloud != null ? summary.avgCloud + '%' : '—') + '</span></div>'
      + '<div class="owp-kpi"><span class="owp-kpi-label">Max Gust 12h</span><span class="owp-kpi-val">' + (summary.maxGust != null ? summary.maxGust + ' m/s' : '—') + '</span></div>'
      + '<div class="owp-kpi"><span class="owp-kpi-label">Dew Risk</span><span style="' + riskStyle(dewRisk) + '">' + dewRisk + '</span></div>'
      + '<div class="owp-kpi"><span class="owp-kpi-label">Wind Risk</span><span style="' + riskStyle(windRisk) + '">' + windRisk + '</span></div>'
      + '<div class="owp-kpi owp-kpi--wide"><span class="owp-kpi-label">Best 2h Window</span><span class="owp-kpi-val">' + bestWindowStr + '</span></div>'
      + '</div>';

    var locationStr = obs.lat_deg != null ? obs.lat_deg.toFixed(2) + ', ' + obs.lon_deg.toFixed(2) : '';
    var updatedStr = gen ? 'Updated ' + fmtHour(gen) : '';

    el.innerHTML = '<div class="owp-root">'
      + '<div class="owp-header">'
      +   '<h3 class="owp-title">Observer Weather</h3>'
      +   '<div class="owp-meta">' + locationStr + (locationStr && updatedStr ? ' · ' : '') + updatedStr + '</div>'
      + '</div>'
      + summaryHtml
      + '<div class="owp-strip-wrap">' + renderStrip(hourly) + '</div>'
      + '</div>';
  }

  // ── Error / unavailable state ────────────────────────────────────────────
  function renderError(el, msg) {
    el.innerHTML = '<div class="owp-root owp-unavailable">'
      + '<h3 class="owp-title">Observer Weather</h3>'
      + '<div class="owp-error">' + (msg || 'Data unavailable') + '</div>'
      + '</div>';
  }

  // ── Fetch + render lifecycle ─────────────────────────────────────────────
  function run(el, opts) {
    var jsonUrl = (opts && opts.jsonUrl) || '/data/observer_weather_now.json';
    var lastData = null;

    function fetchAndRender() {
      fetch(jsonUrl + '?_t=' + Math.floor(Date.now() / (10 * 60 * 1000)))
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (data) {
          lastData = data;
          renderPanel(el, data);
        })
        .catch(function (err) {
          console.warn('[observer_weather] fetch failed:', err);
          if (lastData) {
            renderPanel(el, lastData); // keep last data
          } else {
            renderError(el, 'Data unavailable — will retry');
          }
        });
    }

    fetchAndRender();
    setInterval(fetchAndRender, REFETCH_MS);
  }

  // Inject styles once
  function injectStyles() {
    if (document.getElementById('owp-styles')) return;
    var s = document.createElement('style');
    s.id = 'owp-styles';
    s.textContent = [
      '.owp-root { font-family: inherit; color: #e8eaf0; }',
      '.owp-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }',
      '.owp-title { margin: 0; font-size: 1rem; font-weight: 600; color: #c8d0e0; }',
      '.owp-meta { font-size: 0.75em; color: #666; }',
      '.owp-summary { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; }',
      '.owp-kpi { display: flex; flex-direction: column; gap: 2px; min-width: 80px; }',
      '.owp-kpi--wide { min-width: 160px; }',
      '.owp-kpi-label { font-size: 0.68em; color: #888; text-transform: uppercase; letter-spacing: 0.04em; }',
      '.owp-kpi-val { font-size: 0.9em; font-weight: 600; }',
      '.owp-strip-wrap { overflow-x: auto; padding-bottom: 8px; }',
      '.owp-strip { display: flex; gap: 0; min-width: max-content; }',
      '.owp-col { display: flex; flex-direction: column; align-items: center; width: 44px; padding: 4px 2px; border-right: 1px solid rgba(255,255,255,0.06); cursor: default; }',
      '.owp-col:hover { background: rgba(255,255,255,0.04); }',
      '.owp-day { font-size: 0.6em; color: #5588cc; font-weight: 600; height: 12px; }',
      '.owp-time { font-size: 0.62em; color: #888; margin-bottom: 4px; }',
      '.owp-cloud-bar-wrap { width: 28px; height: 50px; display: flex; align-items: flex-end; margin-bottom: 2px; }',
      '.owp-cloud-bar { width: 100%; border-radius: 2px 2px 0 0; transition: height 0.2s; }',
      '.owp-cloud-pct { font-size: 0.62em; color: #ccc; margin-bottom: 4px; }',
      '.owp-wind-dir { font-size: 0.65em; color: #aab; font-weight: 600; }',
      '.owp-wind-spd { font-size: 0.68em; color: #dde; }',
      '.owp-unit { font-size: 0.8em; color: #888; }',
      '.owp-wind-gust { font-size: 0.6em; color: #e0a84a; min-height: 10px; }',
      '.owp-unavailable { opacity: 0.6; }',
      '.owp-error { color: #e05c5c; font-size: 0.85em; padding: 8px 0; }',
    ].join('\n');
    (document.head || document.body).appendChild(s);
  }

  window.runObserverWeatherPanel = function (el, opts) {
    injectStyles();
    run(el, opts);
  };
}());
