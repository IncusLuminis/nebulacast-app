// ui/components/sky_card.js
import { SKY_CARD_CSS } from './sky_card.css.js';

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
};

// Main bar label → SCORE_TOOLTIPS key
const BAR_TOOLTIP_KEY = {
  'Global Score': 'global_score',
  'Hazard':       'hazard',
  'Urgency':      'urgency',
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

    // Clean up alert header extension from previous open
    const prevMeta = this._header.querySelector('.sky-card-header-meta');
    if (prevMeta) this._header.removeChild(prevMeta);
    this._icon.style.display = '';   // restore if it was hidden
    this._title.style.display = '';
    this._panel.classList.remove('has-tabs');
    this._body.classList.remove('has-tabs');

    if (data.kind === 'alert' && data.alertTabs) {
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
  // SIMPLE CARD  (star / object)
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

      // Tooltip on bar row hover
      const _tipKey  = BAR_TOOLTIP_KEY[item.label];
      const _tipText = _tipKey ? SCORE_TOOLTIPS[_tipKey] : null;
      if (_tipText) {
        row.addEventListener('mouseenter', (e) => this._showTooltip(_tipText, e.clientX, e.clientY));
        row.addEventListener('mousemove',  (e) => this._moveTooltip(e.clientX, e.clientY));
        row.addEventListener('mouseleave', ()  => this._hideTooltip());
        row.style.cursor = 'help';
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

      // Tooltip for feature rows
      const _ftip = SCORE_TOOLTIPS[prefix + key];
      if (_ftip) {
        row.addEventListener('mouseenter', (e) => this._showTooltip(_ftip, e.clientX, e.clientY));
        row.addEventListener('mousemove',  (e) => this._moveTooltip(e.clientX, e.clientY));
        row.addEventListener('mouseleave', ()  => this._hideTooltip());
        row.style.cursor = 'help';
      }

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
