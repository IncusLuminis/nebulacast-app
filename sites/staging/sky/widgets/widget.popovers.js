// sky/widget.popovers.js

import { el, toHTML } from "./widget.dom.js";
import { fmtMaybeNumber, pickTitle, normLower } from "./widget.utils.js";

export function emojiForItem(o) {
  const t = normLower(o?.type || o?.group || o?.kind || "");
  if (t.includes("calendar")) return "📅";
  if (t.includes("sun")) return "☀️";
  if (t.includes("moon")) return "🌙";
  if (t.includes("planet")) return "🪐";
  if (t.includes("dso") || t.includes("messier") || t.includes("ngc")) return "✨";
  return "⭐";
}

function emojiForAlert(a) {
  const g = String(a?.group || a?.type || "").toLowerCase();
  const s = String(a?.source || "").toLowerCase();

  // ---- group/type first (most "semantic") ----
  if (g.includes("transient")) return "💥";
  if (g.includes("supernova") || g.includes("sn")) return "💫";
  if (g.includes("nova")) return "✨";
  if (g.includes("variable") || g.includes("var")) return "📈";
  if (g.includes("comet")) return "☄️";
  if (g.includes("asteroid") || g.includes("minor")) return "🪨";
  if (g.includes("occult")) return "🌘";
  if (g.includes("meteor")) return "🌠";
  if (g.includes("satellite") || g.includes("iss")) return "🛰️";
  if (g.includes("conjunction")) return "🪐";
  if (g.includes("eclipse")) return "🌑";
  if (g.includes("storm") || g.includes("geomag") || g.includes("aurora")) return "🧲";

  // ---- source second (data provenance) ----
  if (s.includes("tocp")) return "💥";      // TOCP often = transient candidates
  if (s.includes("aavso")) return "📈";     // variable star network
  if (s.includes("mpc")) return "🪨";       // Minor Planet Center
  if (s.includes("gcn") || s.includes("fermi") || s.includes("swift")) return "🚨";
  if (s.includes("gaia")) return "🛰️";
  if (s.includes("tess") || s.includes("kepler")) return "🪐";

  // ---- fallback ----
  return "⚠️";
}

export function makeHighlightIdFromRaw(o) {
  if (!o) return null;

  const group = normLower(o.group || o.kind || o.type);
  const id = normLower(o.id);
  const name = normLower(o.name || o.title);

  if (group && id) return `${group}:${id}`;
  if (id) return id;
  if (group && name) return `${group}:${name}`;
  if (name) return name;
  if (o?.meta?.planet_key) return normLower(o.meta.planet_key);

  return null;
}

export function buildAlertsListContent(alertsToday) {
  const src = Array.isArray(alertsToday)
    ? alertsToday
    : (alertsToday?.items || alertsToday?.alerts || []);

  const arr = Array.isArray(src) ? src.slice() : [];

  arr.sort((a, b) => Number(b?.severity ?? 0) - Number(a?.severity ?? 0));

  const root = el("div", { class: "sky-pop-list" });

  for (const a of arr) {
    const hid = makeHighlightIdFromRaw(a);

    root.appendChild(
      el(
        "div",
        { class: "sky-pop-item", "data-hid": hid || "" },
        el("span", { text: "⚠️" }),
        el("span", { text: pickTitle(a) })
      )
    );
  }

  return toHTML(root);
}