// ui/shared/dom.js
export function el(tag, attrs = {}, children = []) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") n.className = v;
      else if (k === "style") n.setAttribute("style", v);
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
      else if (v === true) n.setAttribute(k, "");
      else if (v !== false && v != null) n.setAttribute(k, String(v));
    }
    for (const c of Array.isArray(children) ? children : [children]) {
      if (c == null) continue;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return n;
  }
  
  export function dispatch(host, type, detail) {
    host.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }
  
  export function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  
  export function fmtTimeMMSS(sec) {
    sec = Math.max(0, Math.floor(Number(sec) || 0));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  
  export function svgToNode(svgString, className = "") {
    const wrap = document.createElement("span");
    wrap.innerHTML = String(svgString || "").trim();
    const svg = wrap.querySelector("svg");
    if (svg && className) svg.classList.add(className);
    return wrap;
  }