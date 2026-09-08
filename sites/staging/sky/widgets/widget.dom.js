// sky/widget.dom.js

export function el(tag, attrs, ...children) {
    const n = document.createElement(tag);
  
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === "class") n.className = v;
        else if (k === "text") n.textContent = v;
        else n.setAttribute(k, String(v));
      }
    }
  
    for (const c of children) {
      if (c == null) continue;
      if (typeof c === "string") n.appendChild(document.createTextNode(c));
      else n.appendChild(c);
    }
  
    return n;
  }
  
  export function toHTML(node) {
    const wrap = document.createElement("div");
    wrap.appendChild(node);
    return wrap.innerHTML;
  }