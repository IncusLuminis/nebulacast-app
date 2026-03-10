# Widget API & Performance Analysis

## Summary of findings

| Widget | Data source | Timeout | Retry / fallback | Risk |
|--------|-------------|---------|------------------|------|
| **widget_space_weather.js** | `/data/space_weather_now.json` (same-origin) | ❌ None | Stale cache on error | Medium: fetch can hang indefinitely |
| **widget_observer_weather.js** | `/data/observer_weather_now.json` (same-origin) | ❌ None | Stale cache on error | Medium: fetch can hang indefinitely |
| **widget_runtime.js (News)** | RSS (same-origin or allorigins.win proxy) | ✅ 30s | Proxy fallback chain | High: external proxy can hang/rate-limit |
| **widget_runtime.js (Calendar)** | JSON (same-origin) | ✅ 15s | None | Low |

---

## 1. widget_space_weather.js

### Issues
- **No fetch timeout** — `fetch()` can hang indefinitely if server is slow or connection stalls
- **No AbortController** — cannot cancel in-flight requests
- **setInterval without visibility check** — refetches every 10 min even when tab is hidden (wastes bandwidth, can stack requests if user switches tabs)
- **No request deduplication** — if `fetchAndRender` is called again before previous completes, multiple concurrent fetches

### Code location
```javascript
// Line 170-186: fetch with no timeout
fetch(jsonUrl + '?_t=' + ...)
  .then(...)
  .catch(...);
setInterval(fetchAndRender, REFETCH_MS);  // No cleanup
```

---

## 2. widget_observer_weather.js

### Issues
- Same as widget_space_weather: **no timeout**, **no AbortController**, **setInterval without visibility check**

---

## 3. widget_runtime.js (News)

### Issues
- **External proxy (allorigins.win)** — when direct RSS fails (CORS), falls back to `https://api.allorigins.win/raw?url=...`. This external API can:
  - Be slow or rate-limited
  - Return 429 (too many requests)
  - Hang indefinitely
- **Proxy fallback chain** — on first failure, tries proxy; in catch, tries proxy again. Can cause 2–3 sequential long requests
- **FETCH_TIMEOUT** exists (30s) and AbortController is used — good
- **No refresh** — only loads once on page load, so no setInterval storm

### Code location
```javascript
// Line 9: External proxy
var PROXY_URL = 'https://api.allorigins.win/raw?url=';

// Lines 116-127: Fallback chain can trigger multiple proxy calls
fetchText(buildUrl(false))
  .then(...)
  .catch(function(err) {
    fetchText(buildUrl(true)).then(...).catch(showError);  // Proxy retry
  });
```

---

## 4. widget_runtime.js (Calendar)

### Status
- Uses AbortController + 15s timeout — **robust**
- Same-origin JSON — low risk

---

## Robust solution (recommended pattern)

### A. Add timeout + AbortController to all fetches

```javascript
function fetchWithTimeout(url, timeoutMs) {
  var controller = new AbortController();
  var tid = setTimeout(function() { controller.abort(); }, timeoutMs);
  return fetch(url, { signal: controller.signal })
    .then(function(r) {
      clearTimeout(tid);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .catch(function(err) {
      clearTimeout(tid);
      if (err.name === 'AbortError') throw new Error('Request timeout');
      throw err;
    });
}
```

### B. Pause refetch when tab is hidden

```javascript
function run(el, opts) {
  var intervalId;
  function scheduleNext() {
    intervalId = setTimeout(fetchAndRender, REFETCH_MS);
  }
  function fetchAndRender() {
    if (document.hidden) {
      scheduleNext();
      return;
    }
    fetchWithTimeout(jsonUrl, 10000)
      .then(function(data) { ... })
      .catch(...)
      .finally(scheduleNext);  // Use setTimeout instead of setInterval
  }
  fetchAndRender();
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) clearTimeout(intervalId);
    else fetchAndRender();
  });
}
```

### C. Prevent concurrent fetches (in-flight guard)

```javascript
var fetchInProgress = false;
function fetchAndRender() {
  if (fetchInProgress) return;
  fetchInProgress = true;
  fetchWithTimeout(...)
    .then(...)
    .catch(...)
    .finally(function() { fetchInProgress = false; });
}
```

### D. News widget: avoid external proxy when possible

- Serve RSS from same origin (already typical: `/news/rss.xml`)
- If CORS is an issue, add a server-side proxy endpoint (e.g. `/api/proxy-rss?url=...`) instead of allorigins.win
- Add explicit handling for 429 from proxy (show "Rate limited, try later")

---

## Implementation priority

1. **High**: Add timeout (10–15s) + AbortController to `widget_space_weather.js` and `widget_observer_weather.js`
2. **High**: Add in-flight guard to prevent concurrent fetches in both panels
3. **Medium**: Pause refetch when `document.hidden` (save bandwidth, avoid stacking)
4. **Medium**: Replace News proxy fallback with same-origin or self-hosted proxy
5. **Low**: Add retry with exponential backoff for transient failures
