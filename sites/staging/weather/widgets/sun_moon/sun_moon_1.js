/* === sun_moon.css =========================================================
   Sun / Moon widget styles
   - Canvas-based altitude curves
   - Twilight / night shading
   - Day selector pills + time scrubber
=========================================================================== */

#sun-moon-widget {
    position: relative;
    background: linear-gradient(
      180deg,
      rgba(12, 14, 18, 0.96),
      rgba(6, 8, 12, 0.98)
    );
    border-radius: 14px;
    padding: 14px 16px 16px;
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,0.05),
      0 8px 24px rgba(0,0,0,0.45);
    color: #e6e9ef;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  }
  
  /* -------------------------------------------------------------------------
     Header
  --------------------------------------------------------------------------- */
  
  #sun-moon-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  
  #sun-moon-title {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.2px;
  }
  
  #sun-moon-header-moon {
    font-size: 13px;
    opacity: 0.85;
  }
  
  /* -------------------------------------------------------------------------
     Day selector
  --------------------------------------------------------------------------- */
  
  #sun-moon-days {
    display: flex;
    gap: 6px;
    margin: 6px 0 10px;
    flex-wrap: wrap;
  }
  
  #sun-moon-days .day-pill {
    appearance: none;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    color: rgba(255,255,255,0.75);
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  #sun-moon-days .day-pill:hover {
    background: rgba(255,255,255,0.06);
    color: #fff;
  }
  
  #sun-moon-days .day-pill.active {
    background: rgba(255,210,80,0.18);
    border-color: rgba(255,210,80,0.35);
    color: #ffd36a;
  }
  
  /* -------------------------------------------------------------------------
     Canvas wrapper
  --------------------------------------------------------------------------- */
  
  #sun-moon-canvas-wrap {
    position: relative;
    width: 100%;
    height: 260px;
    border-radius: 10px;
    overflow: hidden;
    background:
      linear-gradient(
        180deg,
        rgba(20, 24, 32, 0.85),
        rgba(10, 12, 18, 0.95)
      );
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,0.04);
  }
  
  /* The canvas itself */
  #sun-moon-canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: crosshair;
  }
  
  /* -------------------------------------------------------------------------
     Time scrubber
  --------------------------------------------------------------------------- */
  
  #sun-moon-time-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
  }
  
  #sun-moon-time {
    flex: 1;
    appearance: none;
    height: 4px;
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.15),
      rgba(255,255,255,0.25)
    );
    border-radius: 2px;
    outline: none;
  }
  
  #sun-moon-time::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ffd36a;
    box-shadow:
      0 0 0 2px rgba(0,0,0,0.6),
      0 0 8px rgba(255,210,80,0.8);
    cursor: pointer;
  }
  
  #sun-moon-time::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ffd36a;
    border: none;
    box-shadow:
      0 0 0 2px rgba(0,0,0,0.6),
      0 0 8px rgba(255,210,80,0.8);
    cursor: pointer;
  }
  
  #sun-moon-time-label {
    min-width: 48px;
    text-align: right;
    font-size: 12px;
    opacity: 0.85;
  }
  
  /* -------------------------------------------------------------------------
     Footer info panel
  --------------------------------------------------------------------------- */
  
  #sun-moon-footer {
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 6px 14px;
    font-size: 12px;
    line-height: 1.35;
    color: rgba(255,255,255,0.7);
  }
  
  #sun-moon-footer strong {
    font-weight: 500;
    color: rgba(255,255,255,0.9);
  }
  
  /* -------------------------------------------------------------------------
     Twilight / night visual hints (used by canvas, but kept here for tuning)
  --------------------------------------------------------------------------- */
  
  /* Civil twilight */
  .sunmoon-twilight-civil {
    background: rgba(255,255,255,0.06);
  }
  
  /* Astronomical twilight */
  .sunmoon-twilight-astro {
    background: rgba(0,0,0,0.22);
  }
  
  /* Full night */
  .sunmoon-night {
    background: rgba(0,0,0,0.35);
  }
  
  /* -------------------------------------------------------------------------
     Small screens
  --------------------------------------------------------------------------- */
  
  @media (max-width: 520px) {
    #sun-moon-canvas-wrap {
      height: 220px;
    }
  
    #sun-moon-footer {
      grid-template-columns: 1fr;
    }
  }