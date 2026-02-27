// ui/icons.js
const S = (d) =>
    `<svg viewBox="0 0 24 24" fill="none"><path d="${d}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  
  export const UI_ICONS = {
    // bottom overlay
    grid_az: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M4 18c4-3 12-3 16 0M4 14c4-3 12-3 16 0M4 10c4-3 12-3 16 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    grid_eq: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M6 18c2-6 10-10 12-12M6 6c4 0 8 4 12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    meridian: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M12 4c-3 4-3 12 0 16c3-4 3-12 0-16Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    </svg>`,
    equator: S("M4 12h16"),
    ecliptic: S("M4 16c4-6 12-6 16-8"),
    milkyway: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M4 14c3-3 5-5 8-5s5 2 8 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M6 12c2-2 4-3 6-3s4 1 6 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    constellations: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M5 17l6-10 4 6 4-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="5" cy="17" r="1.5" fill="currentColor"/>
      <circle cx="11" cy="7" r="1.5" fill="currentColor"/>
      <circle cx="15" cy="13" r="1.5" fill="currentColor"/>
      <circle cx="19" cy="10" r="1.5" fill="currentColor"/>
    </svg>`,
    cardinals: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M12 3l3 9-3 9-3-9 3-9Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    </svg>`,
  
    // side layers (новые)
    objects: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    messier: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M7 17l5-10 5 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8.5 14h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    ngc: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M8 7c4-3 10 1 8 6-2 5-9 6-12 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="16.5" cy="9" r="1.2" fill="currentColor"/>
    </svg>`,
    alerts: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M12 3l9 16H3l9-16Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <path d="M12 9v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 17h.01" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
    ranking: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M7 20V10M12 20V6M17 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    planets: `<svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="2"/>
      <path d="M4 12c3-4 13-4 16 0c-3 4-13 4-16 0Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    </svg>`,
    sun_moon: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
    </svg>`,

    // Atmosphere — sun above horizon with haze lines
    atmosphere: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <circle cx="12" cy="9" r="3"/>
      <line x1="12" y1="2"   x2="12" y2="4"/>
      <line x1="12" y1="14"  x2="12" y2="16"/>
      <line x1="4"  y1="9"   x2="2"  y2="9"/>
      <line x1="20" y1="9"   x2="22" y2="9"/>
      <line x1="6.5" y1="5.5" x2="5.1" y2="4.1"/>
      <line x1="17.5" y1="5.5" x2="18.9" y2="4.1"/>
      <line x1="3" y1="19"  x2="21" y2="19"/>
      <line x1="5" y1="22"  x2="19" y2="22"/>
    </svg>`,

    // Statistics dialog — bar chart icon
    stats: `<svg viewBox="0 0 24 24" fill="none">
      <path d="M3 20h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M6 20V13"  stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M10 20V7"  stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M14 20V11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M18 20V4"  stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
  };