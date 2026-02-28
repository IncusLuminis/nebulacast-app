// ui/components/sky_card.js
import { SKY_CARD_CSS } from './sky_card.css.js';

// ── SIMBAD enrichment ─────────────────────────────────────────────────────────
// Module-level cache survives card close/reopen within the page session.
// Key format: "HIP:102098" or "HD:197345"
const _simbadCache = new Map();

// Human-readable labels for common SIMBAD object type codes (otype field).
const _SIMBAD_OTYPE = {
  '*':    'Star',        '**':   'Double/Multiple Star',  'V*':  'Variable Star',
  'PM*':  'High PM Star', 'HB*': 'Horizontal Branch',    'Be*': 'Be Star',
  'WR*':  'Wolf-Rayet',   'C*':  'Carbon Star',          'S*':  'S Star',
  'SG*':  'Supergiant',   'sg*': 'Supergiant',           'RG*': 'Red Giant',
  'WD*':  'White Dwarf',  'HS*': 'Hot Subdwarf',         'BD*': 'Brown Dwarf',
  'Ce*':  'Cepheid',      'RR*': 'RR Lyrae',             'Mira':'Mira',
  'LP*':  'Long Period Variable',  'EB*': 'Eclipsing Binary',
  'Al*':  'Algol Variable',        'bCep':'Beta Cep Variable',
  'dS*':  'Delta Sct Variable',    'BY*': 'BY Dra Variable',
};

async function _fetchSimbad(hip, hd) {
  const cacheKey = hip != null ? `HIP:${hip}` : (hd != null ? `HD:${hd}` : null);
  if (!cacheKey) return null;
  if (_simbadCache.has(cacheKey)) return _simbadCache.get(cacheKey);

  // Sentinel prevents duplicate in-flight requests for the same star.
  _simbadCache.set(cacheKey, null);

  const simbadId = hip != null ? `HIP ${hip}` : `HD ${hd}`;
  // Minimal TAP query: spectral type + object type.
  const adql = `SELECT sp_type,otype FROM basic JOIN ident ON basic.oid=ident.oidref WHERE ident.id='${simbadId}'`;
  const url  = `https://simbad.cds.unistra.fr/simbad/sim-tap/sync?REQUEST=doQuery&LANG=ADQL&FORMAT=json&QUERY=${encodeURIComponent(adql)}`;

  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return null;
    const json  = await resp.json();
    const cols  = (json?.metadata || []).map(c => c.name);
    const rows  = json?.data || [];
    if (!rows.length) return null;
    const row = rows[0];
    const get = (name) => { const i = cols.indexOf(name); return (i >= 0 && row[i] != null) ? String(row[i]).trim() : null; };
    const result = { sp_type: get('sp_type') || null, otype: get('otype') || null };
    _simbadCache.set(cacheKey, result);
    return result;
  } catch {
    return null;  // network/timeout — keep sentinel null in cache
  }
}
// ─────────────────────────────────────────────────────────────────────────────

// ── Aladin Lite v3 JS-API loader ──────────────────────────────────────────────
// Loads the Aladin script once per page session; subsequent calls reuse the
// same promise.  Using the JS API (vs iframe) lets us pass show* = false flags
// which are the only supported way to hide toolbar / catalogue controls.
let _aladinScriptPromise = null;
function _loadAladinScript() {
  if (window.A?.aladin) return Promise.resolve();
  if (_aladinScriptPromise)  return _aladinScriptPromise;
  _aladinScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.charset = 'utf-8';
    s.src = 'https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.js';
    s.onload  = resolve;
    s.onerror = () => { _aladinScriptPromise = null; reject(); };
    document.head.appendChild(s);
  });
  return _aladinScriptPromise;
}
// ─────────────────────────────────────────────────────────────────────────────

// ── Scoring tooltip texts (source: sky/assets/Scoring_tooltip.json) ──────────
const SCORE_TOOLTIPS = {
  'global_score':            'Overall priority of the object. Weighted combination of external importance, hazard and urgency.',
  'hazard':                  'Physical risk potential based on orbital parameters and approach geometry.',
  'hazard.moid':             'Minimum Orbit Intersection Distance with Earth. Smaller MOID increases hazard contribution.',
  'hazard.encounter_dist':   'Predicted closest approach distance. Closer approach raises the score.',
  'hazard.size':             'Estimated object size. Larger bodies increase potential impact significance.',
  'hazard.vrel':             'Relative velocity at encounter. Higher velocity slightly increases kinetic risk factor.',
  'urgency':                 'Current relevance of the object. Combines time proximity and observability.',
  'urgency.time_proximity':  'Time until closest approach. Sooner events increase urgency.',
  'urgency.visibility':      'Current observability from the selected location. Higher altitude improves score.',
  'urgency.brightness':      'Current apparent brightness. Brighter objects are easier to observe.',
  'urgency.action':          'Operational relevance. Higher if follow-up observations are desirable.',
  'urgency.localization':    'Positional accuracy for tracking. Higher when coordinates are precise.',
  'external.urgency':        'Time sensitivity from external context. More recent updates slightly increase the score.',
  'external.observability':  'General observability potential. Higher if the object is well-positioned in the sky.',
  'external.brightness':     'Estimated apparent brightness impact. Brighter objects contribute more to priority.',
  'external.hazard':         'External hazard indication based on published classifications.',
  'external.reliability':    'Data confidence level. Higher when orbital and observational data are stable.',
  'external.novelty':        'How recently discovered. Newly discovered objects receive a small boost.',
  'external.localization':   'Sky position precision. Higher if coordinates are well constrained.',
  'torino_scale':            'Integer scale (0–10) estimating impact hazard based on probability and kinetic energy. 0 = no concern, 10 = certain global catastrophe.',
  'palermo_max':             'Logarithmic scale comparing impact probability to background impact risk. 0 = equal to background risk; negative values = below background risk.',
  'palermo_cum':             'Cumulative Palermo Scale across all impact scenarios. Logarithmic; 0 = equal to background risk; negative values = below background risk.',
};

// Main bar label → SCORE_TOOLTIPS key
const BAR_TOOLTIP_KEY = {
  'Global Score':   'global_score',
  'Hazard':         'hazard',
  'Urgency':        'urgency',
  'Torino Scale':   'torino_scale',
  'Palermo (max)':  'palermo_max',
  'Palermo (cum)':  'palermo_cum',
};

// Breakdown model name → feature-key prefix used in SCORE_TOOLTIPS
const MODEL_TOOLTIP_PREFIX = {
  'external_v1': 'external.',
  'hazard_v1':   'hazard.',
  'urgency_v1':  'urgency.',
};

export class SkyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = SKY_CARD_CSS;
    this.shadowRoot.appendChild(style);

    this._overlay = document.createElement('div');
    this._overlay.className = 'sky-card-overlay';

    this._panel = document.createElement('div');
    this._panel.className = 'sky-card-panel';

    this._header = document.createElement('div');
    this._header.className = 'sky-card-header';

    this._icon = document.createElement('div');
    this._icon.className = 'sky-card-icon';

    this._title = document.createElement('div');
    this._title.className = 'sky-card-title';

    this._closeBtn = document.createElement('div');
    this._closeBtn.className = 'sky-card-close';
    this._closeBtn.textContent = '×';
    this._closeBtn.title = 'Close';

    this._body = document.createElement('div');
    this._body.className = 'sky-card-body';

    this._header.appendChild(this._icon);
    this._header.appendChild(this._title);
    this._header.appendChild(this._closeBtn);
    this._panel.appendChild(this._header);
    this._panel.appendChild(this._body);
    this._overlay.appendChild(this._panel);
    this.shadowRoot.appendChild(this._overlay);

    this._closeBtn.addEventListener('click', () => this.close());
    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.close();
    });

    this._handleKeydown = (e) => {
      if (e.key === 'Escape' && this._isOpen) this.close();
    };

    // Floating tooltip for scoring bars — lives in shadow root so it can
    // escape the panel's overflow:hidden without z-index fights.
    this._tooltipEl = document.createElement('div');
    this._tooltipEl.className = 'sky-score-tooltip';
    this.shadowRoot.appendChild(this._tooltipEl);

    this._isOpen = false;
  }

  connectedCallback() {
    document.addEventListener('keydown', this._handleKeydown);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._handleKeydown);
  }

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────

  /**
   * Open the card.
   * data: { iconHTML, title, note, raDecText, metaText,
   *         kind, group, score, alertTabs }
   */
  open(data) {
    if (!data) return;

    // Clean up from any previous render mode
    const prevMeta = this._header.querySelector('.sky-card-header-meta');
    if (prevMeta) this._header.removeChild(prevMeta);
    this._icon.style.display = '';
    this._title.style.display = '';
    this._title.textContent = '';    // clear multi-line star title if present
    this._panel.classList.remove('has-tabs');
    this._panel.classList.remove('is-star');
    this._body.classList.remove('has-tabs');

    if (data.kind === 'star') {
      this._renderStarCard(data);
    } else if (data.kind === 'alert' && data.alertTabs) {
      this._renderAlertCard(data);
    } else {
      this._renderSimpleCard(data);
    }

    this._isOpen = true;
    this._overlay.classList.add('is-visible');
    this.style.display = 'block';
  }

  close() {
    this._isOpen = false;
    this._overlay.classList.remove('is-visible');
    this._hideTooltip();
    setTimeout(() => {
      if (!this._isOpen) this.style.display = 'none';
    }, 200);
    this.dispatchEvent(new CustomEvent('sky-card:close'));
  }

  // ─────────────────────────────────────────────
  // SIMPLE CARD  (generic object fallback)
  // ─────────────────────────────────────────────

  _renderSimpleCard(data) {
    this._icon.innerHTML = data.iconHTML || '';
    this._title.textContent = data.title || '';

    const parts = [];
    if (data.note)      parts.push(`<div class="sky-card-note">${this._esc(data.note)}</div>`);
    if (data.raDecText) parts.push(`<div class="sky-card-coords">${data.raDecText}</div>`);
    if (data.metaText)  parts.push(`<div class="sky-card-meta">${data.metaText}</div>`);
    this._body.innerHTML = parts.join('');
  }

  // ─────────────────────────────────────────────
  // STAR CARD  (enriched: header + fields + Aladin + SIMBAD)
  // ─────────────────────────────────────────────

  _renderStarCard(data) {
    this._panel.classList.add('is-star');
    this._icon.innerHTML = data.iconHTML || '';

    // ── Multi-line title: Proper name → Bayer designation → Catalog IDs ──────
    const properEl = document.createElement('span');
    properEl.className = 'sky-card-star-proper';
    properEl.textContent = data.title || 'Star';
    this._title.appendChild(properEl);

    if (data.subtitle) {
      const bayerEl = document.createElement('div');
      bayerEl.className = 'sky-card-star-bayer';
      bayerEl.textContent = data.subtitle;
      this._title.appendChild(bayerEl);
    }

    if (data.catalogIdsLine) {
      const catEl = document.createElement('div');
      catEl.className = 'sky-card-star-catalog-ids';
      catEl.textContent = data.catalogIdsLine;
      this._title.appendChild(catEl);
    }

    // ── Body ─────────────────────────────────────────────────────────────────
    this._body.innerHTML = '';

    // Coordinates section
    if (data.raDecText) {
      const coordsDiv = document.createElement('div');
      coordsDiv.className = 'sky-card-star-coords';
      coordsDiv.textContent = data.raDecText;
      this._body.appendChild(coordsDiv);
    }

    // Field rows: Alt/Az, Magnitude, Spectrum, Distance
    const fieldRows = [];
    if (data.altDeg != null) {
      const altStr = `${Number(data.altDeg).toFixed(0)}°`;
      const azStr  = data.azDeg != null ? `${Number(data.azDeg).toFixed(0)}°` : null;
      fieldRows.push(['Alt / Az', azStr ? `${altStr}  ·  ${azStr}` : altStr]);
    }
    if (data.mag != null) {
      fieldRows.push(['Magnitude', `${Number(data.mag).toFixed(2)}  V`]);
    }
    if (data.spect) {
      fieldRows.push(['Spectrum', data.spect]);
    }
    if (data.dist_pc != null) {
      const d = Number(data.dist_pc);
      const distStr = d >= 1000 ? `${(d / 1000).toFixed(2)} kpc`
                    : d >= 100  ? `${Math.round(d)} pc`
                    :             `${d.toFixed(1)} pc`;
      fieldRows.push(['Distance', distStr]);
    }

    if (fieldRows.length) {
      const fieldsDiv = document.createElement('div');
      fieldsDiv.className = 'sky-card-star-fields';
      this._fillPane(fieldsDiv, { rows: fieldRows });
      this._body.appendChild(fieldsDiv);
    }

    // ── Aladin Lite preview (200×200, JS-API embed) ───────────────────────────
    // We use the JS API instead of an iframe so we can pass show* = false flags
    // to hide the toolbar and catalogue panel (URL params are not supported for
    // those options in Aladin Lite v3).
    if (data.ra_deg != null && data.dec_deg != null) {
      const aladinWrap = document.createElement('div');
      aladinWrap.className = 'sky-card-aladin-wrap';

      const aladinDiv = document.createElement('div');
      aladinDiv.style.cssText = 'width:100%;height:200px;position:relative;';
      aladinWrap.appendChild(aladinDiv);
      this._body.appendChild(aladinWrap);

      const target = `${Number(data.ra_deg).toFixed(5)} ${Number(data.dec_deg).toFixed(5)}`;
      _loadAladinScript().then(() => {
        window.A.aladin(aladinDiv, {
          target,
          fov:                    0.25, // 15 arcminutes

          survey:                 'P/DSS2/color',
          showReticle:            false,
          showZoomControl:        false,
          showFullscreenControl:  false,
          showLayersControl:      false,
          showGotoControl:        false,
          showProjectionControl:  false,
          showFrame:              false,
          showStatusBar:          false,
          showCooGrid:            false,
        });
      }).catch(() => { aladinWrap.style.display = 'none'; });
    }

    // ── SIMBAD Classification (async, non-blocking) ───────────────────────────
    const simbadSection = document.createElement('div');
    simbadSection.className = 'sky-card-simbad-section';
    simbadSection.style.display = 'none';
    this._body.appendChild(simbadSection);

    const hipId = data.hip != null ? Number(data.hip) : null;
    const hdId  = data.hd  != null ? Number(data.hd)  : null;
    if (hipId != null || hdId != null) {
      _fetchSimbad(hipId, hdId).then(info => {
        if (!info || (!info.sp_type && !info.otype)) return;

        const simbadRows = [];
        if (info.sp_type) simbadRows.push(['Spectral class', info.sp_type]);
        if (info.otype)   simbadRows.push(['Object type', _SIMBAD_OTYPE[info.otype] || info.otype]);
        if (!simbadRows.length) return;

        this._fillPane(simbadSection, { rows: simbadRows });
        simbadSection.style.display = '';
      }).catch(() => { /* SIMBAD failed — section stays hidden */ });
    }
  }

  // ─────────────────────────────────────────────
  // ALERT CARD  (tabbed layout)
  // ─────────────────────────────────────────────

  _renderAlertCard(data) {
    this._panel.classList.add('has-tabs');

    // Hide built-in icon + title — we render them inside headerMeta
    this._icon.style.display = 'none';
    this._title.style.display = 'none';

    const headerMeta = document.createElement('div');
    headerMeta.className = 'sky-card-header-meta';

    // ── Left column: icon box + group badge below ──
    const iconWrap = document.createElement('div');
    iconWrap.className = 'sky-card-icon-wrap';

    const iconBox = document.createElement('div');
    iconBox.className = 'sky-card-icon';
    iconBox.innerHTML = data.iconHTML || '';
    iconWrap.appendChild(iconBox);

    if (data.group) {
      const badge = document.createElement('span');
      badge.className = 'sky-card-group-badge';
      badge.textContent = data.group.toUpperCase();
      iconWrap.appendChild(badge);
    }
    headerMeta.appendChild(iconWrap);

    // ── Right column: title row + note ──
    const textWrap = document.createElement('div');
    textWrap.className = 'sky-card-header-text';

    const titleRow = document.createElement('div');
    titleRow.className = 'sky-card-header-row';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'sky-card-header-title';
    titleSpan.textContent = data.title || '';
    titleRow.appendChild(titleSpan);

    if (data.score != null) {
      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'sky-card-header-score';
      scoreSpan.textContent = `Score: ${data.score}`;
      titleRow.appendChild(scoreSpan);
    }
    textWrap.appendChild(titleRow);

    if (data.note) {
      const noteEl = document.createElement('div');
      noteEl.className = 'sky-card-header-note';
      noteEl.textContent = data.note;
      textWrap.appendChild(noteEl);
    }
    headerMeta.appendChild(textWrap);

    this._header.insertBefore(headerMeta, this._closeBtn);

    // ── Body: tab bar + panes ──
    this._body.classList.add('has-tabs');
    this._body.innerHTML = '';

    const tabBar = document.createElement('div');
    tabBar.className = 'sky-card-tabs';

    const panesWrap = document.createElement('div');
    panesWrap.className = 'sky-card-panes';

    (data.alertTabs || []).forEach((tab, idx) => {
      const isFirst = idx === 0;

      const tabBtn = document.createElement('div');
      tabBtn.className = 'sky-card-tab' + (isFirst ? ' active' : '');
      tabBtn.textContent = tab.label;
      tabBar.appendChild(tabBtn);

      const pane = document.createElement('div');
      pane.className = 'sky-card-pane' + (isFirst ? ' active' : '');
      this._fillPane(pane, tab);
      panesWrap.appendChild(pane);

      tabBtn.addEventListener('click', () => {
        tabBar.querySelectorAll('.sky-card-tab').forEach(t => t.classList.remove('active'));
        panesWrap.querySelectorAll('.sky-card-pane').forEach(p => p.classList.remove('active'));
        tabBtn.classList.add('active');
        pane.classList.add('active');
      });
    });

    this._body.appendChild(tabBar);
    this._body.appendChild(panesWrap);
  }

  /** Fill a pane div with field rows or raw JSON. */
  _fillPane(pane, tab) {
    if (tab.id === 'raw') {
      const pre = document.createElement('pre');
      pre.className = 'sky-card-json';
      pre.textContent = tab.json || '';
      pane.appendChild(pre);
      return;
    }

    // Score bar chart (scoring tab); breakdown panels are embedded per-bar
    if (tab.scoreChart && tab.scoreChart.length > 0) {
      pane.appendChild(this._buildScoreChart(tab.scoreChart));
    }

    for (const item of (tab.rows || [])) {
      if (!item) continue;

      // Section header string
      if (typeof item === 'string') {
        const h = document.createElement('div');
        h.className = 'sky-card-section-head';
        h.textContent = item;
        pane.appendChild(h);
        continue;
      }

      const [label, value, opts = {}] = item;
      if (value == null || value === '' || value === '—') continue;

      const row = document.createElement('div');
      row.className = 'sky-card-field';

      const lEl = document.createElement('div');
      lEl.className = 'sky-card-field-label';
      lEl.textContent = label;

      const vEl = document.createElement('div');
      vEl.className = 'sky-card-field-value' + (opts.mono ? ' mono' : '') + (opts.wrap ? ' wrap' : '');

      if (opts.link && value) {
        const a = document.createElement('a');
        a.href = String(value);
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = opts.linkText || String(value);
        vEl.appendChild(a);
      } else if (opts.html) {
        // Trusted internal HTML snippets only (not user/external content)
        vEl.innerHTML = String(value);
      } else {
        vEl.textContent = String(value);
      }

      row.appendChild(lEl);
      row.appendChild(vEl);
      pane.appendChild(row);
    }
  }

  // ─────────────────────────────────────────────
  // TOOLTIP
  // ─────────────────────────────────────────────

  _showTooltip(text, x, y) {
    this._tooltipEl.textContent = text;
    this._tooltipEl.classList.add('is-visible');
    this._moveTooltip(x, y);
  }

  _moveTooltip(x, y) {
    const el = this._tooltipEl;
    // Start right-and-slightly-above the cursor
    el.style.left = `${x + 14}px`;
    el.style.top  = `${y - 8}px`;
    // Clamp to viewport after layout
    requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      if (r.right  > window.innerWidth  - 8) el.style.left = `${x - r.width  - 14}px`;
      if (r.bottom > window.innerHeight - 8) el.style.top  = `${y - r.height -  8}px`;
    });
  }

  _hideTooltip() {
    this._tooltipEl.classList.remove('is-visible');
  }

  // ─────────────────────────────────────────────
  // SCORE CHART
  // ─────────────────────────────────────────────

  /**
   * Build a horizontal bar chart for scoring breakdown.
   * items: Array<{ label: string, norm: number (0-1), display: string }>
   * norm=0 → blue (safe), norm=1 → orange-red (dangerous)
   */
  /**
   * Render the main scoring bars.
   * If an item has a .breakdown object, its label cell gets a ▶ toggle
   * that reveals a feature-breakdown panel directly below that bar.
   *
   * Grid: [16px arrow] [88px label] [1fr track] [54px value]
   */
  _buildScoreChart(items) {
    const wrap = document.createElement('div');
    wrap.className = 'sky-score-chart';

    for (const item of items) {
      // Group wraps the bar row + optional breakdown panel together
      const group = document.createElement('div');
      group.className = 'sky-score-bar-group';

      const row = document.createElement('div');
      row.className = 'sky-score-bar-row';

      // Arrow cell — shows ▶ only when breakdown is present
      const arrowCell = document.createElement('div');
      arrowCell.className = 'sky-score-bar-arrow-cell';
      if (item.breakdown) {
        const arrow = document.createElement('span');
        arrow.className = 'sky-score-bar-arrow';
        arrow.textContent = '▶';
        arrowCell.appendChild(arrow);
      }

      const lbl = document.createElement('div');
      lbl.className = 'sky-score-bar-label';
      lbl.textContent = item.label;

      const track = document.createElement('div');
      track.className = 'sky-score-bar-track';

      const fill = document.createElement('div');
      fill.className = 'sky-score-bar-fill';
      fill.style.setProperty('--t', item.norm.toFixed(4));
      fill.style.width = `${Math.max(2, Math.round(item.norm * 100))}%`;

      const val = document.createElement('div');
      val.className = 'sky-score-bar-value';
      val.textContent = item.display;

      track.appendChild(fill);
      row.append(arrowCell, lbl, track, val);
      group.appendChild(row);

      // Tooltip on numeric value hover only
      const _tipKey  = BAR_TOOLTIP_KEY[item.label];
      const _tipText = _tipKey ? SCORE_TOOLTIPS[_tipKey] : null;
      if (_tipText) {
        val.addEventListener('mouseenter', (e) => this._showTooltip(_tipText, e.clientX, e.clientY));
        val.addEventListener('mousemove',  (e) => this._moveTooltip(e.clientX, e.clientY));
        val.addEventListener('mouseleave', ()  => this._hideTooltip());
        val.style.cursor = 'help';
      }

      // Inline breakdown panel, toggled by clicking the arrow or label
      if (item.breakdown) {
        const panel = this._buildBreakdownPanel(item.breakdown);
        group.appendChild(panel);

        const toggleFn = () => {
          const isOpen = panel.classList.toggle('is-open');
          const arrowEl = arrowCell.querySelector('.sky-score-bar-arrow');
          if (arrowEl) arrowEl.textContent = isOpen ? '▼' : '▶';
        };
        arrowCell.addEventListener('click', toggleFn);
        lbl.addEventListener('click', toggleFn);
        arrowCell.style.cursor = 'pointer';
        lbl.style.cursor = 'pointer';
      }

      wrap.appendChild(group);
    }

    return wrap;
  }

  // ─────────────────────────────────────────────
  // SCORE BREAKDOWN (panel content only)
  // ─────────────────────────────────────────────

  /**
   * Build the collapsible feature-breakdown panel (no toggle header —
   * the toggle lives inline in the parent bar row).
   * ext: { model, features: {key: 0-1}, weights: {key: 0-1} }
   */
  _buildBreakdownPanel(ext) {
    const features = ext.features || {};
    const weights  = ext.weights  || {};
    const prefix   = MODEL_TOOLTIP_PREFIX[ext.model] || '';

    const panel = document.createElement('div');
    panel.className = 'sky-breakdown-panel';

    if (ext.model) {
      const modelTag = document.createElement('div');
      modelTag.className = 'sky-breakdown-model-tag';
      modelTag.textContent = ext.model;
      panel.appendChild(modelTag);
    }

    for (const key of Object.keys(features)) {
      const fVal = Number(features[key]);
      const wVal = Number(weights[key] ?? 0);
      if (!Number.isFinite(fVal)) continue;

      const row = document.createElement('div');
      row.className = 'sky-breakdown-row';

      // Tooltip wired below on the numeric value cell, after val is created

      const name = document.createElement('div');
      name.className = 'sky-breakdown-label';
      name.textContent = key;

      const track = document.createElement('div');
      track.className = 'sky-score-bar-track';

      const fill = document.createElement('div');
      fill.className = 'sky-score-bar-fill';
      fill.style.setProperty('--t', fVal.toFixed(4));
      fill.style.width = fVal > 0
        ? `${Math.max(2, Math.round(fVal * 100))}%`
        : '0%';
      fill.style.transition = 'none';  // skip animation — panel already open

      const val = document.createElement('div');
      val.className = 'sky-breakdown-value';
      val.textContent = fVal.toFixed(3);

      const wgt = document.createElement('span');
      wgt.className = 'sky-breakdown-weight';
      wgt.textContent = `×${wVal.toFixed(2)}`;
      val.appendChild(wgt);

      // Tooltip on numeric value hover only
      const _ftip = SCORE_TOOLTIPS[prefix + key];
      if (_ftip) {
        val.addEventListener('mouseenter', (e) => this._showTooltip(_ftip, e.clientX, e.clientY));
        val.addEventListener('mousemove',  (e) => this._moveTooltip(e.clientX, e.clientY));
        val.addEventListener('mouseleave', ()  => this._hideTooltip());
        val.style.cursor = 'help';
      }

      track.appendChild(fill);
      row.append(name, track, val);
      panel.appendChild(row);
    }

    return panel;
  }

  // ─────────────────────────────────────────────
  // UTILS
  // ─────────────────────────────────────────────

  _esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

if (!customElements.get('sky-card')) {
  customElements.define('sky-card', SkyCard);
}
