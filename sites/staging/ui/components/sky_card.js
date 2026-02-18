// ui/components/sky_card.js
import { SKY_CARD_CSS } from './sky_card.css.js';

export class SkyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Inject styles
    const style = document.createElement('style');
    style.textContent = SKY_CARD_CSS;
    this.shadowRoot.appendChild(style);
    
    // Create DOM structure
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
    
    // Assemble
    this._header.appendChild(this._icon);
    this._header.appendChild(this._title);
    this._header.appendChild(this._closeBtn);
    this._panel.appendChild(this._header);
    this._panel.appendChild(this._body);
    this._overlay.appendChild(this._panel);
    this.shadowRoot.appendChild(this._overlay);
    
    // Event handlers
    this._closeBtn.addEventListener('click', () => this.close());
    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.close();
    });
    
    // ESC key support
    this._handleKeydown = (e) => {
      if (e.key === 'Escape' && this._isOpen) this.close();
    };
    
    this._isOpen = false;
  }
  
  connectedCallback() {
    document.addEventListener('keydown', this._handleKeydown);
  }
  
  disconnectedCallback() {
    document.removeEventListener('keydown', this._handleKeydown);
  }
  
  /**
   * Open the card with content
   * @param {Object} data - { iconHTML, title, note, raDecText, metaText }
   */
  open(data) {
    if (!data) return;
    
    // Set icon (image or emoji)
    this._icon.innerHTML = data.iconHTML || '';
    
    // Set title
    this._title.textContent = data.title || '';
    
    // Build body content
    const bodyParts = [];
    
    if (data.note) {
      bodyParts.push(`<div class="sky-card-note">${this._escapeHTML(data.note)}</div>`);
    }
    
    if (data.raDecText) {
      bodyParts.push(`<div class="sky-card-coords">${data.raDecText}</div>`);
    }
    
    if (data.metaText) {
      bodyParts.push(`<div class="sky-card-meta">${data.metaText}</div>`);
    }
    
    this._body.innerHTML = bodyParts.join('');
    
    // Show with animation
    this._isOpen = true;
    this._overlay.classList.add('is-visible');
    this.style.display = 'block';
  }
  
  close() {
    this._isOpen = false;
    this._overlay.classList.remove('is-visible');
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      if (!this._isOpen) {
        this.style.display = 'none';
      }
    }, 200);
    
    // Dispatch close event
    this.dispatchEvent(new CustomEvent('sky-card:close'));
  }
  
  _escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Register custom element
if (!customElements.get('sky-card')) {
  customElements.define('sky-card', SkyCard);
}