// ui/components/modal.js
import { el, dispatch } from "../shared/dom.js";
import { mountShadowStyle } from "../shared/style.js";
import { MODAL_CSS } from "./modal.css.js";

export class UIModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    mountShadowStyle(this.shadowRoot, MODAL_CSS);

    this._overlay = el("div", { class: "overlay" });
    this._dlg = el("div", { class: "surface dlg", role: "dialog", "aria-modal": "true" });
    this._head = el("div", { class: "head" });
    this._title = el("div", { class: "title" }, [""]);
    this._btnClose = el("button", { class: "close", type: "button", "aria-label": "Close" }, ["✕"]);
    this._body = el("div", { class: "body" });

    this.shadowRoot.append(this._overlay, this._dlg);
    this._dlg.append(this._head, this._body);
    this._head.append(this._title, this._btnClose);

    // Sorting state
    this._sortColumn = null;
    this._sortDirection = 'asc'; // 'asc' or 'desc'
    this._rows = []; // Store original rows data for sorting

    this._onKeyDown = (e) => {
      if (e.key === "Escape") this.close("escape");
    };

    this._overlay.addEventListener("click", () => this.close("overlay"));
    this._btnClose.addEventListener("click", () => this.close("button"));

    // Delegate click events for sortable headers
    this._body.addEventListener("click", (e) => {
      const header = e.target.closest("[data-sort]");
      if (header) {
        const column = header.getAttribute("data-sort");
        this._handleSort(column);
      }
    });
  }

  set title(v) { this._title.textContent = String(v || ""); }
  get title() { return this._title.textContent; }

  set content(v) {
    this._body.innerHTML = "";
    this._rows = []; // Clear stored rows
    
    if (v == null) return;
    if (typeof v === "string") {
      this._body.innerHTML = v;
      this._extractRowsFromHTML();
    } else if (v instanceof Node) {
      this._body.appendChild(v);
      this._extractRowsFromHTML();
    } else {
      this._body.textContent = String(v);
    }
  }

  /**
   * Extract row data from rendered HTML for sorting
   */
  _extractRowsFromHTML() {
    const container = this._body.querySelector(".sky-modal-ranking");
    if (!container) return;

    const rowElements = container.querySelectorAll(".sky-modal-row");
    this._rows = Array.from(rowElements).map(row => {
      return {
        element: row,
        html: row.outerHTML,
        // Extract text content for sorting
        time: row.querySelector(".sky-modal-time")?.textContent?.trim() || "",
        name: row.querySelector(".sky-modal-name")?.textContent?.trim() || "",
        score: parseFloat(row.querySelector(".sky-modal-score-value")?.textContent?.trim() || "0"),
        // Store original index for stable sort
        originalIndex: this._rows.length
      };
    });
  }

  /**
   * Handle column sort
   */
  _handleSort(column) {
    if (!this._rows.length) return;

    // Toggle direction if same column, otherwise default to desc
    if (this._sortColumn === column) {
      this._sortDirection = this._sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortColumn = column;
      this._sortDirection = 'desc'; // Default to descending (highest first)
    }

    // Sort rows
    const sorted = [...this._rows].sort((a, b) => {
      let valA, valB;

      switch (column) {
        case 'time':
          valA = a.time;
          valB = b.time;
          break;
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'score':
          valA = a.score;
          valB = b.score;
          break;
        default:
          return 0;
      }

      let comparison = 0;
      if (valA < valB) comparison = -1;
      if (valA > valB) comparison = 1;

      // Apply direction
      return this._sortDirection === 'asc' ? comparison : -comparison;
    });

    // Update display
    this._renderSortedRows(sorted);
    this._updateSortIndicators(column);
  }

  /**
   * Re-render rows in sorted order
   */
  _renderSortedRows(sortedRows) {
    const container = this._body.querySelector(".sky-modal-ranking");
    if (!container) return;

    // Clear existing rows (but keep header)
    const header = container.querySelector(".sky-modal-table-header");
    container.innerHTML = "";
    if (header) {
      container.appendChild(header);
    }

    // Append sorted rows
    sortedRows.forEach(rowData => {
      const temp = document.createElement("div");
      temp.innerHTML = rowData.html;
      const row = temp.firstElementChild;
      if (row) {
        container.appendChild(row);
      }
    });
  }

  /**
   * Update sort direction indicators in headers
   */
  _updateSortIndicators(activeColumn) {
    const headers = this._body.querySelectorAll("[data-sort]");
    headers.forEach(header => {
      const column = header.getAttribute("data-sort");
      const isActive = column === activeColumn;
      
      // Remove existing indicators
      header.classList.remove("sorted-asc", "sorted-desc");
      
      if (isActive) {
        header.classList.add(this._sortDirection === 'asc' ? "sorted-asc" : "sorted-desc");
      }
    });
  }

  open(opts = {}) {
    if (opts.title != null) this.title = opts.title;
    if (opts.content != null) this.content = opts.content;

    this.style.display = "block";
    document.addEventListener("keydown", this._onKeyDown);
    dispatch(this, "modal:open", {});
  }

  close(reason = "close") {
    this.style.display = "none";
    document.removeEventListener("keydown", this._onKeyDown);
    dispatch(this, "modal:close", { reason });
    
    // Reset sort state on close
    this._sortColumn = null;
    this._sortDirection = 'asc';
    this._rows = [];
  }
}

if (!customElements.get("ui-modal")) {
  customElements.define("ui-modal", UIModal);
}