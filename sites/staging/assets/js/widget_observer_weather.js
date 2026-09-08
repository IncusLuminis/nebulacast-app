/**
 * Observer Weather Panel — reads observer_weather_now.json
 * Self-contained, no external dependencies.
 * Usage: window.runObserverWeatherPanel(el, { jsonUrl: '/data/observer_weather_now.json' })
 */
(function () {
  'use strict';

  var REFETCH_MS = 10 * 60 * 1000; // 10 minutes

  // ── Wind direction label ─────────────────────────────────────────────────
  var WIND_DIRS = ['N','NE','E','SE','S','SW','W','NW'];
  function windDirLabel(deg) {
    if (deg == null) return '—';
    return WIND_DIRS[Math.round(deg / 45) % 8];
  }

  // ── Risk badge colour ────────────────────────────────────────────────────
  var RISK_COLOR = { high: '#e05c5c', medium: '#e0a84a', low: '#5cce8c', unknown: '#888' };
  function riskBadge(label, level) {
    var col = RISK_COLOR[level] || RISK_COLOR.unknown;
    return '<span class="owp-badge owp-badge--' + (level || 'unknown') + '" style="background:' + col + '">' + label + '</span>';
  }

  // ── Score badge colour ───────────────────────────────────────────────────
  function scoreColor(score) {
    if (score == null) return '#888';
    if (score >= 75) return '#5cce8c';
    if (score >= 50) return '#e0a84a';
    return '#e05c5c';
  }

  // ── Pressure trend icon ──────────────────────────────────────────────────
  function pressureIcon(label) {
    if (label === 'rising')  return '↑';
    if (label === 'falling') return '↓';
    return '→';
  }

  // ── Format UTC timestamp ─────────────────────────────────────────────────
  function fmtHour(ts) {
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

  // ── Cloud bar colour ─────────────────────────────────────────────────────
  function cloudColor(pct) {
    if (pct == null) return '#444';
    if (pct < 25) return '#5cce8c';
    if (pct < 50) return '#a8cc6a';
    if (pct < 75) return '#e0a84a';
    return '#e05c5c';
  }

  // ── Summary stats (next 12h) ─────────────────────────────────────────────
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
    var avgCloud = clouds.length ? Math.round(clouds.reduce(function(a,b){return a+b;},0)/clouds.length) : null;
    var maxGust  = gusts.length  ? Math.max.apply(null,gusts).toFixed(1) : null;
    return { avgCloud: avgCloud, maxGust: maxGust };
  }

  // ── Render decision card ─────────────────────────────────────────────────
  function renderDecisionCard(decision, moon, bortle) {
    decision = decision || {};
    var risks   = decision.risks || {};
    var pressure = decision.pressure || {};
    var modes   = decision.mode_scores || {};

    // ── Risks row
    var risksHtml = '<div class="owp-decision-section">'
      + '<div class="owp-section-label">Conditions (next 12h)</div>'
      + '<div class="owp-risks-row">'
      + '<div class="owp-risk-item"><span class="owp-risk-label">Dew</span>' + riskBadge(risks.dew || '—', risks.dew) + '</div>'
      + '<div class="owp-risk-item"><span class="owp-risk-label">Fog</span>' + riskBadge(risks.fog || '—', risks.fog) + '</div>'
      + '<div class="owp-risk-item"><span class="owp-risk-label">Wind</span>' + riskBadge(risks.wind || '—', risks.wind) + '</div>'
      + '</div>'
      + '</div>';

    // ── Pressure trend
    var pd    = pressure.trend_3h_hpa;
    var pdStr = pd != null ? (pd > 0 ? '+' : '') + pd.toFixed(1) + ' hPa/3h' : '—';
    var icon  = pressureIcon(pressure.trend_label);
    var pressureHtml = '<div class="owp-decision-section owp-pressure-row">'
      + '<span class="owp-section-label">Pressure</span>'
      + '<span class="owp-pressure-icon">' + icon + '</span>'
      + '<span class="owp-pressure-delta">' + pdStr + '</span>'
      + '<span class="owp-pressure-label">' + (pressure.trend_label || '—') + '</span>'
      + '</div>';

    // ── Mode scores
    var modeOrder = ['balanced','visual','broadband','planetary'];
    var modeLabels = { balanced:'Balanced', visual:'Visual', broadband:'Broadband', planetary:'Planetary' };
    var modeHtml = '<div class="owp-decision-section">'
      + '<div class="owp-section-label">Mode scores (best 3h / next 24h)</div>'
      + '<div class="owp-modes-row">';
    for (var i = 0; i < modeOrder.length; i++) {
      var mk = modeOrder[i];
      var ms = modes[mk];
      var col = scoreColor(ms);
      modeHtml += '<div class="owp-mode-item">'
        + '<span class="owp-mode-label">' + modeLabels[mk] + '</span>'
        + '<span class="owp-mode-score" style="color:' + col + '">' + (ms != null ? ms : '—') + '</span>'
        + '</div>';
    }
    modeHtml += '</div></div>';

    // ── Best windows
    var bw2 = decision.best_window_2h;
    var bw3 = decision.best_window_3h;
    var bn  = decision.best_tonight;
    function windowStr(w, label) {
      if (!w || !w.start) return '<span class="owp-win-none">—</span>';
      return fmtTimeShort(w.start) + '–' + fmtTimeShort(w.end) + ' UTC'
        + ' <span class="owp-cloud-hint">☁ ' + (w.cloud_avg != null ? Math.round(w.cloud_avg) + '%' : '?') + '</span>';
    }
    var windowsHtml = '<div class="owp-decision-section">'
      + '<div class="owp-section-label">Best windows</div>'
      + '<div class="owp-windows-grid">'
      + '<div class="owp-win-row"><span class="owp-win-label">2h clear</span><span class="owp-win-val">' + windowStr(bw2) + '</span></div>'
      + '<div class="owp-win-row"><span class="owp-win-label">3h clear</span><span class="owp-win-val">' + windowStr(bw3) + '</span></div>'
      + '<div class="owp-win-row"><span class="owp-win-label">Tonight</span><span class="owp-win-val owp-win-tonight">' + (bn ? windowStr(bn) : '<span class="owp-win-none">No clear window</span>') + '</span></div>'
      + '</div>'
      + '</div>';

    // ── Moon + Bortle row
    var moonHtml = '';
    if (moon) {
      var moonIcon = moon.moon_up_now ? '🌙' : '○';
      moonHtml = '<div class="owp-decision-section owp-moon-row">'
        + '<span class="owp-moon-icon">' + moonIcon + '</span>'
        + '<span class="owp-moon-illum">' + (moon.illumination_percent != null ? moon.illumination_percent.toFixed(0) + '%' : '—') + '</span>'
        + '<span class="owp-moon-phase">' + (moon.phase_name || '—') + '</span>'
        + '<span class="owp-moon-status">' + (moon.moon_up_now ? '↑ up' : '↓ set') + '</span>'
        + (bortle ? '<span class="owp-bortle">Bortle ' + bortle.class + ' — ' + bortle.sky_brightness_hint + '</span>' : '')
        + '</div>';
    }

    return '<div class="owp-decision-card">'
      + moonHtml
      + risksHtml
      + pressureHtml
      + modeHtml
      + windowsHtml
      + '</div>';
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
      var ts    = h.timestamp_utc;
      var cloud = h.cloud || {};
      var wind  = h.wind  || {};
      var pct   = cloud.total_percent;
      var spd   = wind.speed_mps != null ? wind.speed_mps.toFixed(1) : '—';
      var gust  = wind.gust_mps  != null ? '+' + wind.gust_mps.toFixed(1) : '';
      var dir   = windDirLabel(wind.direction_deg);
      var timeLabel = fmtTimeShort(ts);
      var dayLabel  = fmtDayShort(ts);
      var dayBorder = '';
      if (dayLabel !== prevDay) {
        dayBorder = 'border-left:2px solid rgba(255,255,255,0.15);';
        prevDay = dayLabel;
      }
      var nightMark = h.night ? 'owp-col--night' : '';

      html += '<div class="owp-col ' + nightMark + '" role="listitem" title="' + fmtHour(ts) + '" style="' + dayBorder + '">'
        + '<div class="owp-day">'  + (dayBorder ? dayLabel : '') + '</div>'
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
    var hourly   = data.hourly   || [];
    var decision = data.decision || {};
    var moon     = data.moon     || null;
    var bortle   = data.bortle   || null;
    var obs      = data.observer || {};
    var gen      = data.generated_utc || '';
    var summary  = computeSummary(hourly);

    var locationStr = obs.lat_deg != null ? obs.lat_deg.toFixed(2) + ', ' + obs.lon_deg.toFixed(2) : '';
    var updatedStr  = gen ? 'Updated ' + fmtHour(gen) : '';

    el.innerHTML = '<div class="owp-root">'
      + '<div class="owp-header">'
      +   '<h3 class="owp-title">Observer Weather</h3>'
      +   '<div class="owp-meta">' + locationStr + (locationStr && updatedStr ? ' · ' : '') + updatedStr + '</div>'
      + '</div>'
      + '<div class="owp-summary">'
      +   '<div class="owp-kpi"><span class="owp-kpi-label">Avg Cloud 12h</span><span class="owp-kpi-val">' + (summary.avgCloud != null ? summary.avgCloud + '%' : '—') + '</span></div>'
      +   '<div class="owp-kpi"><span class="owp-kpi-label">Max Gust 12h</span><span class="owp-kpi-val">' + (summary.maxGust != null ? summary.maxGust + ' m/s' : '—') + '</span></div>'
      + '</div>'
      + renderDecisionCard(decision, moon, bortle)
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
    var jsonUrl  = (opts && opts.jsonUrl) || '/data/observer_weather_now.json';
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
            renderPanel(el, lastData);
          } else {
            renderError(el, 'Data unavailable — will retry');
          }
        });
    }

    fetchAndRender();
    setInterval(fetchAndRender, REFETCH_MS);
  }

  // ── Inject styles ────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('owp-styles')) return;
    var s = document.createElement('style');
    s.id = 'owp-styles';
    s.textContent = [
      // Base
      '.owp-root { font-family: inherit; color: #e8eaf0; }',
      '.owp-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }',
      '.owp-title { margin: 0; font-size: 1rem; font-weight: 600; color: #c8d0e0; }',
      '.owp-meta { font-size: 0.75em; color: #666; }',
      '.owp-summary { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }',
      '.owp-kpi { display: flex; flex-direction: column; gap: 2px; min-width: 80px; }',
      '.owp-kpi-label { font-size: 0.68em; color: #888; text-transform: uppercase; letter-spacing: 0.04em; }',
      '.owp-kpi-val { font-size: 0.9em; font-weight: 600; }',
      // Decision card
      '.owp-decision-card { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px; margin-bottom: 14px; display: flex; flex-direction: column; gap: 10px; }',
      '.owp-decision-section { display: flex; flex-direction: column; gap: 4px; }',
      '.owp-section-label { font-size: 0.65em; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }',
      // Risks
      '.owp-risks-row { display: flex; gap: 10px; flex-wrap: wrap; }',
      '.owp-risk-item { display: flex; align-items: center; gap: 5px; }',
      '.owp-risk-label { font-size: 0.72em; color: #aaa; }',
      '.owp-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.72em; font-weight: 700; color: #000; text-transform: uppercase; }',
      // Pressure
      '.owp-pressure-row { flex-direction: row !important; align-items: center; gap: 6px; }',
      '.owp-pressure-icon { font-size: 1.1em; color: #aab; }',
      '.owp-pressure-delta { font-size: 0.8em; font-weight: 600; }',
      '.owp-pressure-label { font-size: 0.72em; color: #888; }',
      // Mode scores
      '.owp-modes-row { display: flex; gap: 8px; flex-wrap: wrap; }',
      '.owp-mode-item { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 56px; background: rgba(255,255,255,0.04); border-radius: 6px; padding: 5px 8px; }',
      '.owp-mode-label { font-size: 0.6em; color: #888; text-transform: uppercase; letter-spacing: 0.04em; }',
      '.owp-mode-score { font-size: 1.05em; font-weight: 700; }',
      // Best windows
      '.owp-windows-grid { display: flex; flex-direction: column; gap: 3px; }',
      '.owp-win-row { display: flex; align-items: center; gap: 8px; font-size: 0.78em; }',
      '.owp-win-label { color: #888; min-width: 52px; }',
      '.owp-win-val { color: #dde; font-weight: 500; }',
      '.owp-win-tonight { color: #c8d0e0; font-weight: 600; }',
      '.owp-win-none { color: #555; font-style: italic; }',
      '.owp-cloud-hint { color: #e0a84a; font-size: 0.9em; }',
      // Moon + Bortle
      '.owp-moon-row { flex-direction: row !important; align-items: center; gap: 8px; flex-wrap: wrap; }',
      '.owp-moon-icon { font-size: 1em; }',
      '.owp-moon-illum { font-size: 0.85em; font-weight: 600; color: #cde; }',
      '.owp-moon-phase { font-size: 0.75em; color: #aab; }',
      '.owp-moon-status { font-size: 0.72em; color: #888; }',
      '.owp-bortle { font-size: 0.68em; color: #666; margin-left: auto; }',
      // Hourly strip
      '.owp-strip-wrap { overflow-x: auto; padding-bottom: 8px; }',
      '.owp-strip { display: flex; gap: 0; min-width: max-content; }',
      '.owp-col { display: flex; flex-direction: column; align-items: center; width: 44px; padding: 4px 2px; border-right: 1px solid rgba(255,255,255,0.06); cursor: default; }',
      '.owp-col:hover { background: rgba(255,255,255,0.04); }',
      '.owp-col--night { background: rgba(100,120,200,0.04); }',
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
