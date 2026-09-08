// widgets/widget.alerts.js
// Helper functions for building Alerts popover content according to specification

/**
 * Format coordinates (RA/DEC) for display
 */
function formatCoords(item) {
    const ra = item?.ra_deg;
    const dec = item?.dec_deg;
    
    if (ra == null || dec == null) return null;
    
    // RA: degrees to HMS
    const raHours = ra / 15;
    const raH = Math.floor(raHours);
    const raM = Math.floor((raHours - raH) * 60);
    const raS = Math.floor(((raHours - raH) * 60 - raM) * 60);
    
    // DEC: degrees to DMS  
    const decSign = dec >= 0 ? '+' : '−';
    const decAbs = Math.abs(dec);
    const decD = Math.floor(decAbs);
    const decM = Math.floor((decAbs - decD) * 60);
    const decS = Math.floor(((decAbs - decD) * 60 - decM) * 60);
    
    const pad = (n) => String(n).padStart(2, '0');
    
    return {
      ra: `${pad(raH)}h${pad(raM)}m${pad(raS)}s`,
      dec: `${decSign}${decD}°${pad(decM)}'${pad(decS)}"`
    };
  }
  
  /**
   * Format date to local time
   */
  function formatLocalTime(isoString) {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      // Format as YYYY-MM-DD HH:MM
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch {
      return '—';
    }
  }
  
  /**
   * Get icon emoji based on alert group
   */
  function getAlertIcon(item) {
    const group = String(item?.group || '').toLowerCase();
    const type = String(item?.type || '').toLowerCase();
    
    // Group-based icons (primary)
    if (group.includes('grb')) return '🚨';
    if (group.includes('neocp') || group.includes('neo')) return '🪨';
    if (group.includes('transient')) return '💥';
    if (group.includes('risk')) return '⚠️';
    if (group.includes('gcn')) return '📡';
    
    // Type-based fallback
    if (type.includes('supernova') || type.includes('sn')) return '💫';
    if (type.includes('nova')) return '✨';
    if (type.includes('comet')) return '☄️';
    if (type.includes('asteroid')) return '🪨';
    
    return '⚠️'; // Default
  }
  
  /**
   * Get key metrics based on group (per specification)
   */
  function getKeyMetrics(item) {
    const group = String(item?.group || '').toLowerCase();
    const meta = item?.meta || {};
    const metrics = [];
    
    if (group.includes('grb')) {
      // GRB: trigger_name or note
      if (meta.trigger_name) {
        metrics.push({ label: 'Trigger', value: meta.trigger_name });
      } else if (item.note) {
        metrics.push({ label: 'Note', value: item.note });
      }
    } else if (group.includes('neocp')) {
      // NEOCP: score + mag
      if (item.score_norm != null) {
        metrics.push({ label: 'Score', value: (item.score_norm * 100).toFixed(0) });
      }
      if (item.mag != null) {
        metrics.push({ label: 'Mag', value: item.mag.toFixed(1) });
      }
    } else if (group.includes('transient')) {
      // Transient: type + mag (if present)
      if (item.type) {
        metrics.push({ label: 'Type', value: item.type });
      }
      if (item.mag != null) {
        metrics.push({ label: 'Mag', value: item.mag.toFixed(1) });
      }
    } else if (group.includes('neo')) {
      // NEO: distance (LD or AU), diameter, MOID
      if (meta.dist_ld != null) {
        metrics.push({ label: 'Dist', value: `${meta.dist_ld.toFixed(2)} LD` });
      } else if (meta.dist_au != null) {
        metrics.push({ label: 'Dist', value: `${meta.dist_au.toFixed(3)} AU` });
      }
      if (meta.diameter_est_km) {
        metrics.push({ label: 'Diam', value: `${meta.diameter_est_km} km` });
      }
      if (meta.moid_au != null) {
        metrics.push({ label: 'MOID', value: `${meta.moid_au.toFixed(4)} AU` });
      }
    } else if (group.includes('risk')) {
      // Risk: IP, PS, last obs
      if (meta.ip != null) {
        metrics.push({ label: 'IP', value: meta.ip.toExponential(2) });
      }
      if (meta.ps != null) {
        metrics.push({ label: 'PS', value: meta.ps.toFixed(2) });
      }
      if (meta.last_obs) {
        metrics.push({ label: 'Last obs', value: meta.last_obs });
      }
    } else if (group.includes('gcn')) {
      // GCN: topic + kafka timestamp
      if (meta.topic) {
        metrics.push({ label: 'Topic', value: meta.topic });
      }
      if (meta.kafka_ts_ms) {
        const date = new Date(meta.kafka_ts_ms);
        metrics.push({ label: 'Timestamp', value: formatLocalTime(date.toISOString()) });
      }
    }
    
    // Fallback: show coords if available
    if (metrics.length === 0) {
      const coords = formatCoords(item);
      if (coords) {
        metrics.push({ label: 'RA', value: coords.ra });
        metrics.push({ label: 'DEC', value: coords.dec });
      }
    }
    
    return metrics;
  }
  
  /**
   * Get score level for color coding
   */
  function getScoreLevel(item) {
    const score = item?.score_norm;
    if (score == null) return 'low';
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }
  
  /**
   * Build HTML for alerts popover (limit 5 items)
   */
  export function buildAlertsPopoverHTML(alertsToday) {
    const src = Array.isArray(alertsToday)
      ? alertsToday
      : (alertsToday?.items || alertsToday?.alerts || []);
    const arr = Array.isArray(src) ? src.slice() : [];
    
    if (!arr.length) {
      return `
        <div class="sky-alerts-container">
          <div class="sky-alerts-header">
            <div class="sky-alerts-title">Alerts</div>
          </div>
          <div class="sky-alerts-empty">No alerts available</div>
        </div>
      `;
    }
    
    // Sort by score descending
    arr.sort((a, b) => {
      const sa = Number(a?.score_norm ?? a?.score_raw ?? 0);
      const sb = Number(b?.score_norm ?? b?.score_raw ?? 0);
      return sb - sa;
    });
    
    // Limit to 5 items for popover
    const items = arr.slice(0, 5);
    
    let html = `
      <div class="sky-alerts-container">
        <div class="sky-alerts-header">
          <div class="sky-alerts-title">Alerts</div>
          <button class="sky-alerts-showall-btn" type="button">Show All</button>
        </div>
    `;
    
    for (const item of items) {
      const icon = getAlertIcon(item);
      const title = item?.title || item?.id || 'Alert';
      const type = item?.group || item?.type || 'Unknown';
      const scoreLevel = getScoreLevel(item);
      const score = item?.score_norm != null 
        ? (item.score_norm * 100).toFixed(0) 
        : (item?.score_raw != null ? item.score_raw.toFixed(0) : '—');
      
      const metrics = getKeyMetrics(item);
      
      // Build data attributes for click handling
      const hid = item?.id || '';
      const raDeg = item?.ra_deg;
      const decDeg = item?.dec_deg;
      const hasCoords = raDeg != null && decDeg != null;
      
      html += `
        <div class="sky-alert-item" data-hid="${hid}" data-ra="${raDeg || ''}" data-dec="${decDeg || ''}">
          <div class="sky-alert-header">
            <div class="sky-alert-icon">${icon}</div>
            <div class="sky-alert-main">
              <div class="sky-alert-title">${title.replace(/</g, '&lt;')}</div>
              <div class="sky-alert-type">${type.replace(/</g, '&lt;')}</div>
            </div>
          </div>
      `;
      
      // Metadata
      if (metrics.length > 0) {
        html += '<div class="sky-alert-meta">';
        
        for (const m of metrics) {
          html += `
            <div class="sky-alert-meta-item">
              <span class="sky-alert-meta-label">${m.label}:</span>
              <span class="sky-alert-meta-value">${String(m.value).replace(/</g, '&lt;')}</span>
            </div>
          `;
        }
        
        // Add score indicator
        html += `
          <div class="sky-alert-score">
            <span class="sky-alert-score-dot sky-alert-score-dot--${scoreLevel}"></span>
            <span>${score}</span>
          </div>
        `;
        
        html += '</div>';
      }
      
      html += '</div>'; // .sky-alert-item
    }
    
    html += '</div>'; // .sky-alerts-container
    
    return html;
  }