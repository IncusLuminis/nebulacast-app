
Widget Preferences & UI State Persistence

Implementation Specification (v1)

⸻

1. Objective

Introduce a unified, client-side persistence layer for:

Global Preferences
	•	location
	•	theme (day | night | twilight | ocean)

Per-Widget UI State
	•	active tabs
	•	sorting
	•	grouping
	•	toggles
	•	expanded sections
	•	view modes
	•	filters

Constraints
	•	No breaking changes to existing widgets
	•	No required refactoring of current rendering logic
	•	Additive-only changes
	•	Client-only (no backend dependency)
	•	Must be incrementally adoptable

⸻

2. Architectural Overview

2.1 Core Approach

Introduce a thin persistence layer between widgets and storage.
	•	Widgets keep their internal state logic
	•	Persistence is handled externally via a shared module
	•	Widgets opt-in by reading/writing state at specific integration points

⸻

2.2 Design Principles
	•	Additive-only integration
	•	Loose coupling
	•	Per-widget isolation
	•	Global preferences shared
	•	No framework dependency
	•	Storage-agnostic API (future backend-ready)

⸻

3. Storage Strategy

3.1 Primary Storage

Use:

localStorage

Key:

widget_prefs_v1


⸻

3.2 Storage Model

Single JSON envelope:

{
  "version": 1,
  "updatedAt": "2026-03-28T09:30:00Z",
  "global": {
    "theme": "night",
    "location": {
      "mode": "manual",
      "label": "Wroclaw, Poland",
      "lat": 51.1079,
      "lon": 17.0385,
      "timezone": "Europe/Warsaw"
    }
  },
  "widgets": {
    "<widgetId>": {
      "state": {}
    }
  }
}


⸻

3.3 Time Format

All timestamps MUST follow:

YYYY-MM-DDTHH:MM:SSZ

Rules:
	•	UTC only
	•	include seconds
	•	always Z
	•	no +00:00

(Aligned with existing UTC contract rules)

⸻

4. File Structure

Minimal Version

sites/staging/assets/js/user-prefs.js


⸻

Recommended Modular Structure

sites/staging/assets/js/state/
  user-prefs.js
  user-prefs.defaults.js
  user-prefs.storage.js
  user-prefs.migrate.js
  user-prefs.merge.js


⸻

5. Public API

getPrefs()

getGlobalPrefs()
setGlobalPrefs(patch)

getWidgetState(widgetId)
setWidgetState(widgetId, patch)

resetWidgetState(widgetId)
resetAllPrefs()

subscribe(listener) // optional


⸻

6. Default Model

const DEFAULT_PREFS = {
  version: 1,
  updatedAt: null,
  global: {
    theme: "night",
    location: {
      mode: "default",
      label: null,
      lat: null,
      lon: null,
      timezone: "Europe/Warsaw"
    }
  },
  widgets: {}
};


⸻

7. Merge Strategy

Rules

Type	Behavior
object	deep merge
primitive	overwrite
array	replace
null	allowed value


⸻

Required Implementation
	•	Must support nested updates without data loss
	•	Must preserve unrelated fields

⸻

8. Core Implementation

8.1 Storage Layer

const STORAGE_KEY = "widget_prefs_v1";

export function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}


⸻

8.2 Time Helper

export function nowUtcIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}


⸻

8.3 Deep Merge

function isObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

export function deepMerge(base, patch) {
  if (!isObject(base) || !isObject(patch)) return patch;

  const out = { ...base };

  for (const key of Object.keys(patch)) {
    const b = base[key];
    const p = patch[key];

    out[key] = isObject(b) && isObject(p)
      ? deepMerge(b, p)
      : p;
  }

  return out;
}


⸻

8.4 Main Module

import { readStorage, writeStorage } from "./user-prefs.storage.js";
import { deepMerge } from "./user-prefs.merge.js";
import { nowUtcIso } from "./user-prefs.time.js";
import { DEFAULT_PREFS } from "./user-prefs.defaults.js";

function loadPrefs() {
  const raw = readStorage();
  if (!raw) return DEFAULT_PREFS;
  return deepMerge(DEFAULT_PREFS, raw);
}

function savePrefs(prefs) {
  const next = {
    ...prefs,
    updatedAt: nowUtcIso()
  };
  writeStorage(next);
  return next;
}

export function getPrefs() {
  return loadPrefs();
}

export function getGlobalPrefs() {
  return loadPrefs().global;
}

export function setGlobalPrefs(patch) {
  const prefs = loadPrefs();
  prefs.global = deepMerge(prefs.global, patch);
  return savePrefs(prefs);
}

export function getWidgetState(widgetId) {
  const prefs = loadPrefs();
  return prefs.widgets?.[widgetId]?.state || {};
}

export function setWidgetState(widgetId, patch) {
  const prefs = loadPrefs();

  const current = prefs.widgets?.[widgetId]?.state || {};

  prefs.widgets = prefs.widgets || {};
  prefs.widgets[widgetId] = {
    state: deepMerge(current, patch)
  };

  return savePrefs(prefs);
}

export function resetWidgetState(widgetId) {
  const prefs = loadPrefs();

  if (prefs.widgets?.[widgetId]) {
    delete prefs.widgets[widgetId];
  }

  return savePrefs(prefs);
}

export function resetAllPrefs() {
  return savePrefs(DEFAULT_PREFS);
}


⸻

9. Widget Integration

9.1 Initialization

const global = getGlobalPrefs();
const state = getWidgetState("weather");

// merge into widget defaults


⸻

9.2 On Interaction

Tab change

setWidgetState("weather", {
  activeTab: "forecast"
});

Toggle

setWidgetState("sky", {
  toggles: { showGrid: true }
});

Sorting

setWidgetState("weather", {
  sort: { by: "score", dir: "desc" }
});


⸻

10. Theme Handling

10.1 Storage

{
  "global": {
    "theme": "twilight"
  }
}


⸻

10.2 DOM Application

document.documentElement.dataset.theme = theme;


⸻

11. Location Handling

11.1 Schema

{
  "mode": "manual",
  "label": "Wroclaw, Poland",
  "lat": 51.1079,
  "lon": 17.0385,
  "timezone": "Europe/Warsaw"
}


⸻

11.2 Update

setGlobalPrefs({
  location: newLocation
});


⸻

12. Versioning & Migration

12.1 Required Field

"version": 1


⸻

12.2 Migration Entry

function migratePrefs(raw) {
  if (!raw) return DEFAULT_PREFS;

  switch (raw.version) {
    case 1:
      return raw;
    default:
      return DEFAULT_PREFS;
  }
}


⸻

13. Error Handling

Must handle:
	•	invalid JSON
	•	storage unavailable
	•	quota exceeded

Behavior:
	•	fallback to defaults
	•	do not throw
	•	do not block UI

⸻

14. Performance Rules

14.1 Write Policy
	•	write on user interaction only
	•	debounce continuous inputs (150–300 ms)

14.2 Avoid
	•	writing on every render
	•	storing large datasets

⸻

15. Security Constraints

Do NOT store:
	•	tokens
	•	API keys
	•	raw API responses
	•	large datasets

Store only:
	•	UI state
	•	preferences

⸻

16. Testing Requirements

Unit
	•	load defaults
	•	recover from corrupted storage
	•	deep merge correctness
	•	per-widget isolation
	•	version handling

Integration
	•	theme persists after reload
	•	location persists
	•	tabs restored
	•	toggles restored
	•	reset works

⸻

17. Rollout Plan

Phase 1

Implement core module

Phase 2

Enable:
	•	theme
	•	location

Phase 3

Enable:
	•	activeTab
	•	toggles
	•	sorting

Phase 4

Gradual widget-by-widget expansion

⸻

18. Known Limitations
	•	no cross-device sync
	•	localStorage size limits (~5MB)
	•	no real-time sync between tabs (unless subscribe implemented)
	•	no conflict resolution

⸻

19. Future Extensions (Not in Scope)
	•	server-side persistence
	•	user accounts
	•	multi-device sync
	•	IndexedDB for heavy state
	•	analytics integration

⸻

20. Acceptance Criteria

System is considered complete when:
	•	global theme persists across reload
	•	location persists and is reused by widgets
	•	at least one widget restores:
	•	active tab
	•	toggle state
	•	sorting
	•	no existing widget behavior is broken
	•	no required changes to rendering pipeline
