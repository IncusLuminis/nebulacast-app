# Alerts Popover Integration Guide

## Overview
New card-based design for Alerts popover according to specification in `Alerts_window_specification.pdf`.

## Files Changed

### 1. popover.css.js
**Location:** `ui/components/popover.css.js`

**Changes:**
- Added new CSS classes for card-based alerts design
- Classes: `.sky-alerts-*` for container, header, items, metadata
- Preserved existing `.sky-pop-ranking` classes for objects/ranking popover

**New classes:**
```css
.sky-alerts-container    /* Main container */
.sky-alerts-header       /* Sticky header with title + "Show All" button */
.sky-alert-item          /* Individual alert card */
.sky-alert-header        /* Icon + title row */
.sky-alert-meta          /* Metadata chips */
.sky-alert-score         /* Score indicator with colored dot */
```

### 2. widget.alerts.js
**Location:** `widgets/widget.alerts.js` (NEW FILE)

**Exports:**
- `buildAlertsPopoverHTML(alertsToday)` - Main function to generate alerts HTML

**Helper functions:**
- `formatCoords(item)` - Format RA/DEC to HMS/DMS
- `formatLocalTime(isoString)` - Convert UTC to local time
- `getAlertIcon(item)` - Get emoji based on group/type
- `getKeyMetrics(item)` - Extract group-specific metadata
- `getScoreLevel(item)` - Determine score color (high/medium/low)

## Integration into widget.js

### Step 1: Import the helper

```javascript
// At top of widget.js
import { buildAlertsPopoverHTML } from "./widgets/widget.alerts.js";
```

### Step 2: Update buildAlertsListContent function

Replace the existing `buildAlertsListContent` function with:

```javascript
function buildAlertsListContent() {
  return buildAlertsPopoverHTML(alertsToday);
}
```

### Step 3: Wire up click handlers

The click handler in `wirePopoverClicks` already handles:
- `.sky-pop-showall-btn` → opens modal with all alerts
- `[data-hid]` → highlights and centers alert on map

Update to handle new button class:

```javascript
function wirePopoverClicks(pop, { onShowAll } = {}) {
  if (!pop) return;
  const sr = pop.shadowRoot;
  if (!sr) return;

  const container = sr.querySelector(".content") || sr.querySelector(".panel") || sr;

  if (pop._skyClickHandler) {
    container.removeEventListener("click", pop._skyClickHandler);
  }

  pop._skyClickHandler = (e) => {
    // Handle "Show All" button - updated class name
    const btn = e.target?.closest?.(".sky-pop-showall-btn") || 
                e.target?.closest?.(".sky-alerts-showall-btn");
    if (btn) {
      try { if (typeof pop.close === "function") pop.close(); } catch (_) {}
      if (typeof onShowAll === "function") onShowAll();
      return;
    }

    // Handle alert item click - works with new .sky-alert-item
    const row = e.target?.closest?.("[data-hid]");
    if (!row) return;

    const hid = row.getAttribute("data-hid");
    if (!hid) return;

    try { if (typeof pop.close === "function") pop.close(); } catch (_) {}
    
    // Get coordinates from data attributes
    const ra = row.getAttribute("data-ra");
    const dec = row.getAttribute("data-dec");
    
    if (ra && dec && ra !== '' && dec !== '') {
      // Has coordinates - center map and highlight
      setHighlightById(hid, 3600);
    } else {
      // No coordinates - just highlight marker if it exists
      setHighlightById(hid, 3600);
    }
  };

  container.addEventListener("click", pop._skyClickHandler);
}
```

## Data Requirements

The new design expects these fields in `alerts_today.json`:

### Required fields:
- `id` - Unique identifier
- `title` - Alert title/name
- `group` - Category (grb, neocp, transient, neo, risk, gcn)
- `type` - Subcategory
- `score_norm` - Normalized score (0..1)
- `updated_utc` - ISO timestamp

### Optional fields:
- `ra_deg`, `dec_deg` - Coordinates (nullable)
- `mag` - Magnitude (nullable)
- `note` - Description (nullable)
- `meta` - Group-specific metadata object

### Group-specific meta fields:

**GRB:**
- `meta.trigger_name`

**NEOCP:**
- Uses `score_norm` and `mag` from root

**Transient:**
- Uses `type` and `mag` from root

**NEO:**
- `meta.dist_ld` or `meta.dist_au`
- `meta.diameter_est_km`
- `meta.moid_au`

**Risk:**
- `meta.ip` - Impact probability
- `meta.ps` - Palermo scale
- `meta.last_obs` - Last observation date

**GCN:**
- `meta.topic`
- `meta.kafka_ts_ms`

## Behavior

### Click on alert card:
1. Close popover
2. If has coordinates → center sky-map on coords and highlight
3. If no coordinates → just highlight marker (if exists)

### Click on "Show All":
1. Close popover
2. Open modal with full list of alerts (existing behavior)

## Visual Design

- **Card-based layout** (not list)
- **Large icon** (32x32px emoji) on left
- **Title** (bold, 16px) + **Type badge** (small, uppercase)
- **Metadata chips** below with key metrics
- **Score indicator** with colored dot:
  - 🟢 Green (score ≥ 0.7)
  - 🟡 Yellow (score ≥ 0.4)
  - ⚪ Gray (score < 0.4)
- **Hover effect** - subtle lift and background change
- **Limit**: 5 alerts in popover

## Testing

Test with different alert groups:
1. **GRB** - Should show trigger_name or note
2. **NEOCP** - Should show score + mag
3. **Transient** - Should show type + mag
4. **NEO** - Should show distance + diameter
5. **Risk** - Should show IP + PS + last obs
6. **GCN** - Should show topic + timestamp

Test edge cases:
- No alerts → shows empty state
- Missing coordinates → card still clickable but no map centering
- Missing metadata → shows fallback (RA/DEC if available)