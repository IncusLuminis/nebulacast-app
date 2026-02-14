// sky/widget.highlight.js

import { normLower } from "./widget.utils.js";

export function applyUIHighlight(patch) {
  const hid = patch?.ui?.highlightId;
  if (!hid) return;

  window.__skyHighlight = {
    id: String(hid),
    until: Date.now() + (patch.ui.highlightMs ?? 3000),
  };
}

export function setHighlightById(hid, ms = 3200) {
  const id = String(hid || "").trim();
  if (!id) return;

  window.__skyHighlight = {
    id,
    until: Date.now() + ms,
  };
}

export function installHighlightMatcher() {
  window.__skyIsHighlighted = function (obj) {
    const h = window.__skyHighlight;
    if (!h) return false;
    if (Date.now() > h.until) return false;
    if (!obj) return false;

    const hid = normLower(h.id);
    if (!hid) return false;

    const group = normLower(obj.group);
    const id = normLower(obj.id);
    const name = normLower(obj.name);

    const candidates = [
      id,
      name,
      group && id ? `${group}:${id}` : null,
      group && name ? `${group}:${name}` : null,
      obj.meta?.planet_key ? normLower(obj.meta.planet_key) : null,
    ].filter(Boolean);

    return candidates.includes(hid);
  };
}