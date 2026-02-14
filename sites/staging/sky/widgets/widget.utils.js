// sky/widget.utils.js

export function deepMerge(dst, src) {
    if (!src) return dst;
    for (const k of Object.keys(src)) {
      const v = src[k];
      if (v && typeof v === "object" && !Array.isArray(v)) {
        dst[k] = deepMerge(dst[k] || {}, v);
      } else {
        dst[k] = v;
      }
    }
    return dst;
  }
  
  export function normLower(x) {
    return String(x ?? "").trim().toLowerCase();
  }
  
  export function fmtMaybeNumber(x, digits = 2) {
    const n = Number(x);
    return Number.isFinite(n) ? n.toFixed(digits) : null;
  }
  
  export function pickTitle(o) {
    return o?.title || o?.name || (o?.id != null ? String(o.id) : null) || "—";
  }

  export async function loadRankingJson(baseUrl) {
    const urls = [
      `${baseUrl}/data/ranking.json`,
      `${baseUrl}/ranking.json`,
      `${baseUrl}/data/Ranking.json`,
      `${baseUrl}/Ranking.json`,
    ];
  
    for (const url of urls) {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) continue;
        return await r.json();
      } catch (_) {}
    }
  
    return null;
  }


export function makeHighlightIdFromRaw(o) {
  if (!o) return null;

  const group = normLower(o.group || o.kind || o.type || "");
  const id = normLower(o.id || "");
  const name = normLower(o.name || o.title || "");

  if (group && id) return `${group}:${id}`;
  if (id) return id;
  if (group && name) return `${group}:${name}`;
  if (name) return name;

  if (o?.meta?.planet_key) return normLower(o.meta.planet_key);

  return null;
}

export function emojiForItem(o) {
  const t = normLower(o?.type || o?.group || o?.kind || "");
  if (t.includes("calendar")) return "📅";
  if (t.includes("sun")) return "☀️";
  if (t.includes("moon")) return "🌙";
  if (t.includes("planet")) return "🪐";
  if (t.includes("dso") || t.includes("messier") || t.includes("ngc")) return "✨";
  return "⭐";
}