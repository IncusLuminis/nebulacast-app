/**
 * Utility functions for weather widgets
 */

/**
 * Parse coordinates from text input
 * Supports formats: "50.087, 14.421", "50.087 14.421", "50.087° N, 0.1278° W"
 */
export function parseCoords(text) {
  if (!text || typeof text !== "string") return null;
  text = text.trim();
  
  const patterns = [
    /(-?\d+\.?\d*)\s*[,\s]\s*(-?\d+\.?\d*)/,  // Basic: "50.087, 14.421" or "50.087 14.421"
    /(-?\d+\.?\d*)\s*°\s*[NS]?\s*[,\s]\s*(-?\d+\.?\d*)\s*°\s*[EW]?/i,  // With degrees
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { lat, lon };
      }
    }
  }
  
  return null;
}

/**
 * Clamp coordinates to valid ranges
 */
export function clampLatLon(lat, lon) {
  return {
    lat: Math.max(-90, Math.min(90, lat)),
    lon: Math.max(-180, Math.min(180, lon))
  };
}

/**
 * Format coordinates for display
 */
export function formatCoord(lat, lon) {
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

/**
 * Escape HTML
 */
export function escapeHtml(s) {
  if (!s) return "";
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

/**
 * Debounce function
 */
export function debounce(fn, ms) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Show toast notification
 */
let toastTimer = null;
export function showToast(message, duration = 2000) {
  // Remove existing toast
  const existing = document.getElementById("nc-toast");
  if (existing) {
    existing.remove();
  }
  
  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  
  const toast = document.createElement("div");
  toast.id = "nc-toast";
  toast.className = "nc-toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add("nc-toast-show");
  });
  
  // Remove after duration
  toastTimer = setTimeout(() => {
    toast.classList.remove("nc-toast-show");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
