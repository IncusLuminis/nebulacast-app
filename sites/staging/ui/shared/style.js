// ui/shared/style.js
export const UI_BASE_VARS = `
:host{
  --ui-bg: rgba(20,24,32,0.72);
  --ui-border: rgba(255,255,255,0.12);
  --ui-fg: rgba(255,255,255,0.92);
  --ui-fg-dim: rgba(255,255,255,0.72);
  --ui-hover: rgba(255,255,255,0.10);
  --ui-surface: rgba(255,255,255,0.06);
  --ui-accent: rgba(80,150,255,0.22);
  --ui-accent-border: rgba(80,150,255,0.35);
  --ui-radius: 14px;
  --ui-radius-sm: 12px;
  --ui-pad: 10px 12px;
  --ui-font: system-ui, -apple-system, Segoe UI, Roboto, Arial;
  --ui-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}
`;

export function mountShadowStyle(shadowRoot, cssText) {
  const style = document.createElement("style");
  style.textContent = cssText;
  shadowRoot.appendChild(style);
  return style;
}

export function baseHostCSS(extra = "") {
  return `
${UI_BASE_VARS}
:host{ display:block; color: var(--ui-fg); font-family: var(--ui-font); }
.surface{
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
${extra}
`.trim();
}