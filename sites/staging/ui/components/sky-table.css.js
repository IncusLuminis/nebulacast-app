// ui/components/sky-table.css.js
export const SKY_TABLE_CSS = `
/* ─────────────────────────────────────────────
   HOST / CONTAINER
───────────────────────────────────────────── */
:host {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;            /* ← меняй высоту контейнера таблицы здесь */
  overflow: hidden;
  box-sizing: border-box;
  font-family: 'Inter', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;  /* ← шрифт всей таблицы */
}

/* ─────────────────────────────────────────────
   WRAPPER (header + scrollable body)
───────────────────────────────────────────── */
.sky-table-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 8px;       /* ← скругление внешних углов таблицы */
  background: rgba(12, 15, 22, 0.96);
}

/* ─────────────────────────────────────────────
   HEADER ROW
───────────────────────────────────────────── */
.sky-table-head {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: 28px;             /* ← высота заголовка */
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
  user-select: none;
}

.sky-table-th {
  display: flex;
  align-items: center;
  padding: 0 6px;           /* ← горизонтальный padding заголовочных ячеек */
  font-size: 10px;          /* ← размер шрифта заголовков колонок */
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);  /* ← цвет заголовков колонок */
  white-space: nowrap;
  overflow: hidden;
  box-sizing: border-box;
}

/* ─────────────────────────────────────────────
   SCROLLABLE BODY
───────────────────────────────────────────── */
.sky-table-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  /* custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
}

.sky-table-body::-webkit-scrollbar {
  width: 4px;
}
.sky-table-body::-webkit-scrollbar-track {
  background: transparent;
}
.sky-table-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 2px;
}

/* ─────────────────────────────────────────────
   DATA ROW
───────────────────────────────────────────── */
.sky-table-row {
  display: flex;
  align-items: center;
  height: 28px;             /* ← высота строки данных — главная переменная компактности */
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.12s ease;
  cursor: pointer;
  box-sizing: border-box;
}

.sky-table-row:last-child {
  border-bottom: none;
}

.sky-table-row:hover {
  background: rgba(255, 255, 255, 0.06);  /* ← цвет подсветки при наведении */
}

.sky-table-row.is-selected {
  background: rgba(100, 160, 255, 0.12);  /* ← цвет выбранной строки */
}

/* ─────────────────────────────────────────────
   DATA CELLS  (общие правила)
───────────────────────────────────────────── */
.sky-table-td {
  display: flex;
  align-items: center;
  padding: 0 6px;           /* ← горизонтальный padding ячеек данных */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-sizing: border-box;
  font-size: 12px;          /* ← базовый размер шрифта ячеек */
  color: rgba(255, 255, 255, 0.80);
  line-height: 1;
}

/* ─────────────────────────────────────────────
   ТИПЫ ЯЧЕЕК
───────────────────────────────────────────── */

/* icon — иконка/эмодзи объекта */
.sky-table-td.type-icon {
  padding: 0 4px 0 6px;    /* ← отступ иконки */
  justify-content: center;
}

.sky-table-td.type-icon .cell-icon-img {
  width: 18px;              /* ← ширина иконки */
  height: 18px;             /* ← высота иконки */
  display: block;
  object-fit: contain;
}

.sky-table-td.type-icon .cell-icon-emoji {
  font-size: 14px;          /* ← размер эмодзи */
  line-height: 1;
  font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
}

/* name — название объекта */
.sky-table-td.type-name {
  font-size: 12px;          /* ← размер шрифта названия объекта */
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);  /* ← цвет названия */
}

/* type — тип объекта (Galaxy, Nebula, …) */
.sky-table-td.type-type {
  font-size: 10px;          /* ← размер шрифта типа объекта */
  font-weight: 500;
  color: rgba(160, 200, 255, 0.65);  /* ← цвет метки типа */
  letter-spacing: 0.2px;
}

/* note — короткое описание */
.sky-table-td.type-note {
  font-size: 11px;          /* ← размер шрифта поля note */
  color: rgba(255, 255, 255, 0.55);  /* ← цвет note */
  font-style: italic;
}

/* mono — координаты, числовые данные (RA, Dec, Alt, Az, Mag, …) */
.sky-table-td.type-mono {
  font-size: 11px;          /* ← размер шрифта числовых/координатных ячеек */
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace; /* ← моноширинный шрифт для чисел */
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.60);  /* ← цвет числовых ячеек */
  letter-spacing: 0.2px;
}

/* badge — цветная метка (constellation, catalog tag, …) */
.sky-table-td.type-badge {
  font-size: 10px;          /* ← размер шрифта badge */
  font-weight: 500;
}

.sky-table-td.type-badge .cell-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.60);
  letter-spacing: 0.3px;
  text-transform: uppercase;
  font-size: 9px;           /* ← размер текста внутри badge */
}

/* ─────────────────────────────────────────────
   TARGET BUTTON  (jump-to-object column)
───────────────────────────────────────────── */

.sky-table-td.type-target {
  justify-content: center;
  padding: 0 4px;
}

.sky-table-target-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 4px;
  background: transparent;
  padding: 0;
  cursor: pointer;
  color: rgba(100, 160, 255, 0.55);   /* ← цвет активной иконки */
  transition: color 0.12s, background 0.12s;
  flex-shrink: 0;
}

.sky-table-target-btn:hover {
  color: rgba(100, 160, 255, 1.0);
  background: rgba(100, 160, 255, 0.12);
}

.sky-table-target-btn.is-disabled {
  color: rgba(255, 255, 255, 0.12);   /* ← цвет неактивной иконки */
  cursor: default;
  pointer-events: none;
}

/* ─────────────────────────────────────────────
   SORT INDICATORS
───────────────────────────────────────────── */

/* Sortable headers get a pointer and subtle hover */
.sky-table-th.is-sortable {
  cursor: pointer;
  transition: color 0.12s ease;
}

.sky-table-th.is-sortable:hover {
  color: rgba(255, 255, 255, 0.65);  /* ← цвет заголовка при наведении */
}

/* Arrow appended via ::after pseudo-element */
.sky-table-th.is-sortable::after {
  content: '';
  display: inline-block;
  margin-left: 4px;           /* ← отступ стрелки от текста */
  opacity: 0;                 /* hidden when unsorted */
  font-size: 9px;             /* ← размер стрелки сортировки */
  line-height: 1;
  transition: opacity 0.12s ease;
}

/* Show faint arrow on any sortable header on hover */
.sky-table-th.is-sortable:hover::after {
  content: '↕';
  opacity: 0.30;
}

.sky-table-th.sort-asc::after {
  content: '↑';
  opacity: 0.80;              /* ← яркость активной стрелки */
}

.sky-table-th.sort-desc::after {
  content: '↓';
  opacity: 0.80;
}

/* Active sort column label gets slightly brighter */
.sky-table-th.sort-asc,
.sky-table-th.sort-desc {
  color: rgba(255, 255, 255, 0.70);  /* ← цвет активного заголовка сортировки */
}

/* ─────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────── */
.sky-table-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.25);
  letter-spacing: 0.3px;
}
`;
