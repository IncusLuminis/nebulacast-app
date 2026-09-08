// map.js
(function(){
    "use strict";
  
    function makeRoot(container){
      const root = document.createElement("div");
      root.className = "map-root";
      root.innerHTML = `<iframe class="map-iframe" src="./map-poc.html" loading="lazy"></iframe>`;
      container.appendChild(root);
      return { root, iframe: root.querySelector("iframe") };
    }
  
    function resolveMount(cfg){
      if (cfg && cfg.mountId){
        const el = document.getElementById(cfg.mountId);
        if (el) return el;
      }
      const div = document.createElement("div");
      div.style.width = "960px";
      div.style.height = "720px";
      document.body.appendChild(div);
      return div;
    }
  
    function init(userCfg){
      const cfg = userCfg || {};
      const mount = resolveMount(cfg);
      const { iframe } = makeRoot(mount);
  
      // Optional: sync state with iframe map if needed
      window.addEventListener("message", (event) => {
        const msg = event.data;
        if (!msg || !msg.type) return;
        // handle messages if you have them
      });
  
      // Example: notify iframe we are ready
      iframe.addEventListener("load", () => {
        try { iframe.contentWindow.postMessage({ type: "map-host-ready" }, "*"); } catch(_) {}
      });
    }
  
    const userCfg = (typeof window !== "undefined" && window.MAP_CONFIG) ? window.MAP_CONFIG : null;
    init(userCfg || {});
  })();