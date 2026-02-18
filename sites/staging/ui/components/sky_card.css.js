// ui/components/sky_card_css.js
export const SKY_CARD_CSS = `
.sky-card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.sky-card-overlay.is-visible {
  opacity: 1;
}

.sky-card-panel {
  min-width: 320px;
  max-width: 420px;
  background: rgba(20, 24, 32, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  transform: scale(0.9);
  transition: transform 0.2s ease;
}

.sky-card-overlay.is-visible .sky-card-panel {
  transform: scale(1);
}

.sky-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sky-card-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
}

.sky-card-icon img {
  width: 40px;
  height: 40px;
  display: block;
}

.sky-card-icon span {
  font-size: 32px;
  line-height: 1;
  font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
}

.sky-card-title {
  flex: 1;
  font-size: 20px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.2;
}

.sky-card-close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: background 0.15s ease;
  color: rgba(255, 255, 255, 0.7);
  font-size: 20px;
  line-height: 1;
  user-select: none;
}

.sky-card-close:hover {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.95);
}

.sky-card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sky-card-note {
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.85);
  word-wrap: break-word;
}

.sky-card-coords,
.sky-card-meta {
  font-size: 11px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.65);
  font-variant-numeric: tabular-nums;
}

.sky-card-coords {
  font-weight: 500;
  letter-spacing: 0.3px;
}
`;