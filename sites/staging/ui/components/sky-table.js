// ui/components/sky-table.js
import { SKY_TABLE_CSS } from './sky-table.css.js';

/**
 * SkyTable — compact data table for astronomical object lists.
 *
 * USAGE:
 *   <sky-table></sky-table>
 *
 * API:
 *   table.setColumns(columns)  — define columns (see Column typedef below)
 *   table.setRows(rows)        — set row data array
 *   table.setSelectedId(id)    — highlight a row by its id field
 *   table.clearSelection()     — remove selection highlight
 *
 * EVENTS:
 *   sky-table:row-click  — fired on row click, detail = { row }
 *
 * COLUMN TYPEDEF:
 *   {
 *     key:      string   — property name in row data
 *     label:    string   — header text
 *     width:    string   — CSS width, e.g. '100px', '1fr', 'auto'
 *     type:     'text' | 'name' | 'type' | 'note' | 'mono' | 'icon' | 'badge'
 *     align:    'left' | 'center' | 'right'  (optional, default left)
 *     sortable: boolean  (optional, default true — set false to disable sort on this column)
 *   }
 *
 * ROW DATA:
 *   Plain object; key names must match column keys.
 *   For type='icon': value can be a URL string (renders <img>) or
 *                    an emoji string (renders as text).
 *   For type='badge': value is a plain string rendered in a badge chip.
 *   'id' field (if present) is used for setSelectedId().
 */
export class SkyTable extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this._columns = [];
    this._rows = [];
    this._selectedId = null;

    // Sort state
    this._sortKey = null;   // currently sorted column key, or null
    this._sortDir = 'asc';  // 'asc' | 'desc'

    // Inject styles
    const style = document.createElement('style');
    style.textContent = SKY_TABLE_CSS;
    this.shadowRoot.appendChild(style);

    // Outer wrapper
    this._wrapper = document.createElement('div');
    this._wrapper.className = 'sky-table-wrapper';

    // Header row
    this._head = document.createElement('div');
    this._head.className = 'sky-table-head';
    this._head.setAttribute('role', 'row');

    // Scrollable body
    this._body = document.createElement('div');
    this._body.className = 'sky-table-body';
    this._body.setAttribute('role', 'rowgroup');

    this._wrapper.appendChild(this._head);
    this._wrapper.appendChild(this._body);
    this.shadowRoot.appendChild(this._wrapper);
  }

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────

  /** Set column definitions. Triggers a full re-render. */
  setColumns(columns) {
    this._columns = columns || [];
    this._sortKey = null; // reset sort when columns change
    this._sortDir = 'asc';
    this._renderHead();
    this._renderBody();
  }

  /** Set row data. Triggers body re-render (preserves current sort). */
  setRows(rows) {
    this._rows = rows || [];
    this._renderBody();
  }

  /** Highlight a row whose `id` matches the given value. */
  setSelectedId(id) {
    this._selectedId = id;
    this._applySelection();
  }

  /** Clear row selection highlight. */
  clearSelection() {
    this._selectedId = null;
    this._applySelection();
  }

  // ─────────────────────────────────────────────
  // SORTING
  // ─────────────────────────────────────────────

  _handleSort(key) {
    if (this._sortKey === key) {
      // Same column — toggle direction
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      // New column — default descending (highest value first for numbers)
      this._sortKey = key;
      this._sortDir = 'desc';
    }
    this._renderBody();
    this._updateSortIndicators();
  }

  /** Return a copy of _rows sorted by current sort state, or original order. */
  _sortedRows() {
    if (!this._sortKey) return this._rows;

    const col = this._columns.find(c => c.key === this._sortKey);
    const numeric = col && (col.type === 'mono' || col.type === 'text');
    const dir = this._sortDir === 'asc' ? 1 : -1;

    return [...this._rows].sort((a, b) => {
      let va = a[this._sortKey];
      let vb = b[this._sortKey];

      // Treat null/undefined/dash as lowest possible value
      const empty = v => v === null || v === undefined || v === '—' || v === '-' || v === '';
      if (empty(va) && empty(vb)) return 0;
      if (empty(va)) return 1;   // always push empties to bottom
      if (empty(vb)) return -1;

      if (numeric) {
        const na = parseFloat(String(va).replace(',', '.'));
        const nb = parseFloat(String(vb).replace(',', '.'));
        if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir;
      }

      // String comparison
      va = String(va).toLowerCase();
      vb = String(vb).toLowerCase();
      return va < vb ? -dir : va > vb ? dir : 0;
    });
  }

  /** Sync sort arrow classes on header cells. */
  _updateSortIndicators() {
    const ths = this._head.querySelectorAll('.sky-table-th');
    ths.forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.sortKey === this._sortKey) {
        th.classList.add(this._sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
      }
    });
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  _renderHead() {
    this._head.innerHTML = '';

    for (const col of this._columns) {
      const th = document.createElement('div');
      th.className = 'sky-table-th';
      th.setAttribute('role', 'columnheader');
      th.textContent = col.label || '';
      this._applyCellSize(th, col);

      // Make sortable (all columns sortable by default unless sortable === false)
      const isSortable = col.sortable !== false && col.type !== 'icon';
      if (isSortable) {
        th.dataset.sortKey = col.key;
        th.classList.add('is-sortable');
        th.addEventListener('click', () => this._handleSort(col.key));
      }

      this._head.appendChild(th);
    }

    this._updateSortIndicators();
  }

  _renderBody() {
    this._body.innerHTML = '';

    const rows = this._sortedRows();

    if (!rows.length) {
      const empty = document.createElement('div');
      empty.className = 'sky-table-empty';
      empty.textContent = 'No data';
      this._body.appendChild(empty);
      return;
    }

    for (const row of rows) {
      this._body.appendChild(this._buildRow(row));
    }
  }

  _buildRow(row) {
    const tr = document.createElement('div');
    tr.className = 'sky-table-row';
    tr.setAttribute('role', 'row');

    if (row.id !== undefined) {
      tr.dataset.rowId = String(row.id);
    }

    if (row.id !== undefined && String(row.id) === String(this._selectedId)) {
      tr.classList.add('is-selected');
    }

    for (const col of this._columns) {
      tr.appendChild(this._buildCell(row, col));
    }

    tr.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('sky-table:row-click', {
        bubbles: true,
        composed: true,
        detail: { row },
      }));
    });

    return tr;
  }

  _buildCell(row, col) {
    const td = document.createElement('div');
    td.className = `sky-table-td type-${col.type || 'text'}`;
    td.setAttribute('role', 'cell');

    if (col.align) {
      td.style.justifyContent = col.align === 'right' ? 'flex-end'
        : col.align === 'center' ? 'center'
        : 'flex-start';
    }

    this._applyCellSize(td, col);

    const value = row[col.key];

    switch (col.type) {
      case 'icon':
        this._renderIconCell(td, value);
        break;
      case 'badge':
        this._renderBadgeCell(td, value);
        break;
      default:
        td.textContent = value !== undefined && value !== null ? String(value) : '';
        break;
    }

    return td;
  }

  _renderIconCell(td, value) {
    if (!value) return;

    // Detect URL (starts with http/https/data: or ends with image extension)
    const isUrl = /^(https?:|data:|\/|\.\.?\/)/.test(value)
      || /\.(png|jpg|jpeg|svg|webp|gif)$/i.test(value);

    if (isUrl) {
      const img = document.createElement('img');
      img.className = 'cell-icon-img';
      img.src = value;
      img.alt = '';
      td.appendChild(img);
    } else {
      const span = document.createElement('span');
      span.className = 'cell-icon-emoji';
      span.textContent = value;
      td.appendChild(span);
    }
  }

  _renderBadgeCell(td, value) {
    if (!value) return;
    const badge = document.createElement('span');
    badge.className = 'cell-badge';
    badge.textContent = String(value);
    td.appendChild(badge);
  }

  /** Apply width to a cell or header element from column definition. */
  _applyCellSize(el, col) {
    if (!col.width) return;
    el.style.width = col.width;
    el.style.minWidth = col.width;
    el.style.maxWidth = col.width;
    el.style.flexShrink = '0';
    // Flex columns that should grow
    if (col.width === 'auto' || col.width === '1fr') {
      el.style.flex = '1';
      el.style.width = '';
      el.style.minWidth = '0';
      el.style.maxWidth = '';
    }
  }

  // ─────────────────────────────────────────────
  // SELECTION
  // ─────────────────────────────────────────────

  _applySelection() {
    const rows = this._body.querySelectorAll('.sky-table-row');
    for (const row of rows) {
      const match = this._selectedId !== null
        && row.dataset.rowId === String(this._selectedId);
      row.classList.toggle('is-selected', match);
    }
  }
}

if (!customElements.get('sky-table')) {
  customElements.define('sky-table', SkyTable);
}
