/**
 * Space Weather Panel — reads space_weather_now.json
 * Self-contained, no external dependencies.
 * Usage: window.runSpaceWeatherPanel(el, { jsonUrl: '/data/space_weather_now.json' })
 */
(function () {
  'use strict';

  var REFETCH_MS = 10 * 60 * 1000; // 10 minutes

  // ── Activity label color coding ─────────────────────────────────────────
  var ACTIVITY_COLOR = {
    quiet:    { bg: '#2a4a3a', text: '#5cce8c', label: 'Quiet' },
    minor:    { bg: '#4a4a2a', text: '#d4cc5c', label: 'Minor' },
    moderate: { bg: '#4a3a1a', text: '#e0a84a', label: 'Moderate' },
    strong:   { bg: '#4a2a2a', text: '#e05c5c', label: 'Strong' },
    severe:   { bg: '#3a1a1a', text: '#ff3333', label: 'Severe' },
  };

  function activityStyle(label) {
    var c = ACTIVITY_COLOR[label] || { bg: '#333', text: '#888', label: label || '—' };
    return { bg: c.bg, text: c.text, label: c.label };
  }

  // ── X-ray class color ───────────────────────────────────────────────────
  var XRAY_COLOR = { A: '#888', B: '#5cce8c', C: '#d4cc5c', M: '#e0a84a', X: '#e05c5c' };

  // ── Format UTC timestamps ───────────────────────────────────────────────
  function fmtHour(ts) {
    if (!ts) return '—';
    try {
      var d = new Date(ts);
      return d.toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false }) + ' UTC';
    } catch (e) { return ts; }
  }
  function fmtTimeShort(ts) {
    if (!ts) return '—';
    try {
      var d = new Date(ts);
      return d.toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false });
    } catch (e) { return ts; }
  }

  // ── Kp forecast mini bar chart ──────────────────────────────────────────
  function renderForecastBars(bins) {
    if (!bins || !bins.length) {
      return '<div style="color:#666;font-size:0.8em">No forecast data</div>';
    }
    var maxKp = 9;
    var barMaxPx = 60;
    var html = '<div class="swp-forecast">';
    for (var i = 0; i < bins.length; i++) {
      var b = bins[i];
      var kp = b.value != null ? b.value : 0;
      var h = Math.round((kp / maxKp) * barMaxPx);
      var label = activityStyle(kpToLabel(kp));
      var timeStr = fmtTimeShort(b.timestamp_utc);
      html += '<div class="swp-fc-col" title="Kp ' + kp.toFixed(1) + ' at ' + timeStr + '">'
        + '<div class="swp-fc-bar-wrap">'
        +   '<div class="swp-fc-bar" style="height:' + h + 'px;background:' + label.text + '"></div>'
        + '</div>'
        + '<div class="swp-fc-val">' + kp.toFixed(1) + '</div>'
        + '<div class="swp-fc-time">' + fmtTimeShort(b.timestamp_utc) + '</div>'
        + '</div>';
    }
    html += '</div>';
    return html;
  }

  function kpToLabel(kp) {
    if (kp < 4) return 'quiet';
    if (kp < 5) return 'minor';
    if (kp < 6) return 'moderate';
    if (kp < 7) return 'strong';
    return 'severe';
  }

  // ── Alerts list ─────────────────────────────────────────────────────────
  var ALERT_LEVEL_COLOR = { warning: '#e05c5c', watch: '#e0a84a', info: '#5588cc' };

  function renderAlerts(alerts) {
    if (!alerts || !alerts.length) return '';
    var html = '<details class="swp-alerts"><summary>SWPC Alerts (' + alerts.length + ')</summary><ul class="swp-alerts-list">';
    for (var i = 0; i < alerts.length; i++) {
      var a = alerts[i];
      var color = ALERT_LEVEL_COLOR[a.level] || '#888';
      html += '<li><span style="color:' + color + ';font-weight:600">[' + (a.level || 'info').toUpperCase() + ']</span> '
        + '<span>' + (a.title || '') + '</span>'
        + '<span class="swp-alert-time"> · ' + fmtTimeShort(a.timestamp_utc) + '</span>'
        + '</li>';
    }
    html += '</ul></details>';
    return html;
  }

  // ── Render panel ────────────────────────────────────────────────────────
  function renderPanel(el, data) {
    var kp = data.kp || {};
    var kpLatest = kp.latest;
    var kpForecast = kp.forecast_3h || [];
    var actLabel = kp.activity_label || 'unknown';
    var solarWind = data.solar_wind;
    var xray = data.xray;
    var alerts = data.alerts || [];
    var gen = data.generated_utc || '';

    var ac = activityStyle(actLabel);
    var kpVal = kpLatest ? kpLatest.value.toFixed(1) : '—';
    var kpTime = kpLatest ? fmtHour(kpLatest.timestamp_utc) : '';

    var swSpeed = solarWind && solarWind.speed_kms != null ? Math.round(solarWind.speed_kms) + ' km/s' : '—';
    var xrayClass = xray && xray.class ? xray.class : '—';
    var xrayColor = XRAY_COLOR[xrayClass] || '#888';
    var xrayFlux = xray && xray.flux_wm2 != null ? xray.flux_wm2.toExponential(1) + ' W/m²' : '';

    el.innerHTML = '<div class="swp-root">'
      + '<div class="swp-header">'
      +   '<h3 class="swp-title">Space Weather</h3>'
      +   '<div class="swp-meta">' + (gen ? 'Updated ' + fmtHour(gen) : '') + '</div>'
      + '</div>'

      // Kp prominent display
      + '<div class="swp-kp-section">'
      +   '<div class="swp-kp-block" style="background:' + ac.bg + ';border:1px solid ' + ac.text + '22">'
      +     '<div class="swp-kp-label">Planetary Kp</div>'
      +     '<div class="swp-kp-val" style="color:' + ac.text + '">' + kpVal + '</div>'
      +     '<div class="swp-activity-badge" style="background:' + ac.text + ';color:#000">' + ac.label + '</div>'
      +     (kpTime ? '<div class="swp-kp-time">' + kpTime + '</div>' : '')
      +   '</div>'

      // Solar wind + X-ray compact
      +   '<div class="swp-compact-row">'
      +     '<div class="swp-compact-item">'
      +       '<div class="swp-compact-label">Solar Wind</div>'
      +       '<div class="swp-compact-val">' + swSpeed + '</div>'
      +     '</div>'
      +     '<div class="swp-compact-item">'
      +       '<div class="swp-compact-label">X-ray</div>'
      +       '<div class="swp-compact-val" style="color:' + xrayColor + '">' + xrayClass
      +         (xrayFlux ? '<span class="swp-compact-sub"> ' + xrayFlux + '</span>' : '')
      +       '</div>'
      +     '</div>'
      +   '</div>'
      + '</div>'

      // Kp forecast
      + '<div class="swp-section">'
      +   '<div class="swp-section-title">Kp Forecast</div>'
      +   renderForecastBars(kpForecast)
      + '</div>'

      // Alerts
      + (alerts.length ? renderAlerts(alerts) : '')

      + '</div>';
  }

  // ── Error state ──────────────────────────────────────────────────────────
  function renderError(el, msg) {
    el.innerHTML = '<div class="swp-root swp-unavailable">'
      + '<h3 class="swp-title">Space Weather</h3>'
      + '<div class="swp-error">' + (msg || 'Data unavailable') + '</div>'
      + '</div>';
  }

  // ── Fetch + render lifecycle ─────────────────────────────────────────────
  function run(el, opts) {
    var jsonUrl = (opts && opts.jsonUrl) || '/data/space_weather_now.json';
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
          console.warn('[space_weather] fetch failed:', err);
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

  // Inject styles once
  function injectStyles() {
    if (document.getElementById('swp-styles')) return;
    var s = document.createElement('style');
    s.id = 'swp-styles';
    s.textContent = [
      '.swp-root { font-family: inherit; color: #e8eaf0; max-width: 800px; }',
      '.swp-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }',
      '.swp-title { margin: 0; font-size: 1rem; font-weight: 600; color: #c8d0e0; }',
      '.swp-meta { font-size: 0.75em; color: #666; }',
      '.swp-kp-section { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; margin-bottom: 20px; }',
      '.swp-kp-block { border-radius: 10px; padding: 14px 20px; min-width: 140px; text-align: center; }',
      '.swp-kp-label { font-size: 0.7em; color: #888; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }',
      '.swp-kp-val { font-size: 2.8rem; font-weight: 700; line-height: 1; }',
      '.swp-activity-badge { display: inline-block; margin: 6px auto 0; font-size: 0.72em; font-weight: 700; padding: 2px 10px; border-radius: 20px; text-transform: uppercase; }',
      '.swp-kp-time { font-size: 0.65em; color: #666; margin-top: 6px; }',
      '.swp-compact-row { display: flex; flex-direction: column; gap: 14px; justify-content: center; }',
      '.swp-compact-item { display: flex; flex-direction: column; gap: 2px; }',
      '.swp-compact-label { font-size: 0.68em; color: #888; text-transform: uppercase; letter-spacing: 0.04em; }',
      '.swp-compact-val { font-size: 1.1rem; font-weight: 600; }',
      '.swp-compact-sub { font-size: 0.65em; color: #888; }',
      '.swp-section { margin-bottom: 16px; }',
      '.swp-section-title { font-size: 0.72em; color: #888; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }',
      '.swp-forecast { display: flex; gap: 8px; align-items: flex-end; overflow-x: auto; padding-bottom: 4px; }',
      '.swp-fc-col { display: flex; flex-direction: column; align-items: center; min-width: 54px; }',
      '.swp-fc-bar-wrap { width: 28px; height: 60px; display: flex; align-items: flex-end; margin-bottom: 2px; }',
      '.swp-fc-bar { width: 100%; border-radius: 2px 2px 0 0; }',
      '.swp-fc-val { font-size: 0.7em; font-weight: 600; color: #ccc; }',
      '.swp-fc-time { font-size: 0.58em; color: #666; text-align: center; margin-top: 2px; }',
      '.swp-alerts { margin-top: 12px; }',
      '.swp-alerts summary { font-size: 0.78em; color: #888; cursor: pointer; user-select: none; padding: 4px 0; }',
      '.swp-alerts-list { margin: 6px 0 0; padding: 0 0 0 16px; list-style: disc; }',
      '.swp-alerts-list li { font-size: 0.78em; color: #bbb; margin-bottom: 4px; }',
      '.swp-alert-time { color: #666; }',
      '.swp-unavailable { opacity: 0.6; }',
      '.swp-error { color: #e05c5c; font-size: 0.85em; padding: 8px 0; }',
    ].join('\n');
    (document.head || document.body).appendChild(s);
  }

  window.runSpaceWeatherPanel = function (el, opts) {
    injectStyles();
    run(el, opts);
  };
}());
