(function () {
  'use strict';

  window.runObjectsWidget = function (config) {
    var rootId   = config.rootId;
    var dataUrl  = config.dataUrl  || '/sky/data/objects_today.json';
    var maxItems = config.maxItems || 25;

    var root = document.getElementById(rootId);
    if (!root) return;

    var statusEl = root.querySelector('[data-role="status"]');
    var listEl   = root.querySelector('[data-role="list"]');

    fetch(dataUrl, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (data) { render(data, statusEl, listEl, maxItems); })
      .catch(function ()   { statusEl.textContent = 'Failed to load data.'; });
  };

  function iconForItem(item) {
    if (item.type === 'planet' && item.meta && item.meta.planet_key) {
      var name = item.meta.planet_key.charAt(0).toUpperCase() + item.meta.planet_key.slice(1);
      return '<img src="/sky/assets/images/' + name + '.png" alt="' + name + '">';
    }
    if (item.type === 'calendar' || item.group === 'calendar') return '📅';
    if (item.group === 'dso' || item.type === 'dso')           return '✨';
    return '⭐';
  }

  function fmtTime(isoStr) {
    if (!isoStr) return null;
    try {
      return new Date(isoStr).toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit', hour12: false
      });
    } catch (e) { return null; }
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function render(data, statusEl, listEl, maxItems) {
    if (!data || !Array.isArray(data.items) || !data.items.length) {
      statusEl.textContent = 'No objects available.';
      return;
    }
    statusEl.style.display = 'none';

    var items = data.items.slice(0, maxItems);
    var html  = '';

    for (var i = 0; i < items.length; i++) {
      var it      = items[i];
      var icon    = iconForItem(it);
      var vis     = it.vis || {};
      var bestT   = fmtTime(vis.best_time_local_quality || vis.best_time_local);
      var alt     = vis.max_alt_deg != null ? Math.round(vis.max_alt_deg) + '°' : null;
      var mag     = it.mag != null ? 'Mag ' + it.mag.toFixed(1) : null;

      var isEmoji = icon.charAt(0) !== '<';
      var iconHtml = isEmoji
        ? '<span>' + icon + '</span>'
        : icon;

      html += '<div class="nob-item">';
      html += '<div class="nob-icon">' + iconHtml + '</div>';
      html += '<div class="nob-body">';
      html += '<div class="nob-name">' + esc(it.name || it.id) + '</div>';
      if (it.note) {
        html += '<div class="nob-note">' + esc(it.note) + '</div>';
      }
      html += '<div class="nob-meta">';
      if (bestT) html += '<span>Best ' + bestT + '</span>';
      if (alt)   html += '<span>Alt ' + alt + '</span>';
      if (mag)   html += '<span>' + mag + '</span>';
      html += '</div>';
      html += '</div></div>';
    }

    listEl.innerHTML = html;
  }
})();
