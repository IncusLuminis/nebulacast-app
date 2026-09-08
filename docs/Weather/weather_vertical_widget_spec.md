# Weather Vertical Widget Specification

## 1. Purpose

This specification defines a **vertical weather widget** intended for narrow sidebar / column usage.

The widget is a simplified derivative of the existing `weather/widget.js` implementation. It reuses the same data and the same core rendering logic where practical, but presents the content as a **single vertical stack** optimized for embedding into external sites such as **nebulacast.com**.

This widget is intended as an MVP production-ready variant for third-party embedding and standalone testing.

---

## 2. Scope

### In scope

- A dedicated vertical layout for the weather widget.
- Reuse of existing widget data flow and card-generation logic from `widget.js`.
- Simplified current-hour card.
- Vertical stack of forecast cards.
- Observing / Weather view switch.
- Static observation legend.
- Footer line with update time and forecast horizon.
- Separate standalone HTML page for local testing.
- Widget packaging suitable for embedding into other sites.

### Out of scope

- Observation Matrix for this widget.
- Details toggle inside the current-hour card.
- Major schema or pipeline refactor.
- Any breaking changes to existing JSON contracts.

This follows the project’s additive-only contract discipline: no legacy schema changes, no frontend-breaking restructures, only additive implementation around the existing widget model. fileciteturn0file2

---

## 3. Product goal

The vertical weather widget must provide an at-a-glance answer to two questions:

1. **What is the weather now at the selected location?**
2. **How does the next ~72 hours look for observing and general weather conditions?**

The component should remain compact, visually consistent with the current weather widget, and usable in a narrow right or left column.

---

## 4. Architecture decision

### 4.1 Base principle

The widget must be implemented as a **layout variant** of the existing weather widget, not as an unrelated second product.

That means:

- data loading should stay aligned with existing weather sources;
- card data should be produced by the same or closely related preparation logic already used in `widget.js`;
- only layout, card density, and a few display rules are simplified.

### 4.2 Non-goals for architecture

Avoid:

- a parallel incompatible data model;
- a separate forecasting pipeline;
- duplicated business logic for card scoring / gate state / weather state unless absolutely required;
- CSS and JS that depend on the full horizontal widget structure.

### 4.3 Recommended implementation shape

Preferred structure:

- keep existing weather data adapter / card preparation logic;
- add a dedicated vertical renderer, for example:
  - `renderVerticalWidget(...)`
  - or `layout: "vertical"` mode;
- add a dedicated test page:
  - `weather-vertical.html`
- keep styling isolated in a dedicated CSS block or file for the vertical variant.

---

## 5. Layout overview

The widget is a **single-column vertical stack**.

Block order:

1. **Time / Location**
2. **Current hour card**
3. **Switch: Observing / Weather**
4. **Legend** — Observation Gate: Open / Marginal / Closed
5. **Cards roll** — forecast cards stacked vertically one after another
6. **Footer line** — `Updated 2:02 · ~72h forecast`

No matrix block is present in this widget.

---

## 6. Detailed block specification

## 6.1 Time / Location block

### Purpose

Provides context for the forecast and allows the user to choose the actual location via API.

### Content

The block must display:

- current local time for the selected location;
- selected location name;
- location selector / chooser entry point.

### Behavior

- Location must be selectable from API-backed location search / resolution.
- On location change, the widget reloads weather data for the new coordinates.
- The selected location becomes the active context for all cards below.

### Notes

- The site default currently points to Warsaw (`52.2297`, `21.0122`, `Europe/Warsaw`) in project configuration, so the vertical widget should support a compatible default behavior when no explicit location is passed. fileciteturn0file1
- The exact UI control may be a button, pill, dropdown, or modal launcher, depending on what already exists in the current widget ecosystem.

---

## 6.2 Current hour card

### Purpose

Shows the immediate weather / observing state for the current hour.

### Base rule

This card should be based on the same current-hour card already used in the main widget, but **without the details toggle**.

### Simplification rule

Instead of expandable details, the card shows a single compact metrics line:

```text
☁ 100% 🔭 Bad 🌬 3 m/s 💧 88% 🌡 9°C 🌙 -3°
```

### Required displayed fields

The line must contain, in this order:

1. cloud cover
2. observing condition label
3. wind speed
4. humidity
5. air temperature
6. moon-related value

### Notes on semantics

- `☁` = cloud cover percent
- `🔭` = observing condition summary (`Good`, `Fair`, `Bad`, etc.)
- `🌬` = wind speed in m/s
- `💧` = humidity percent
- `🌡` = air temperature in °C
- `🌙` = moon-related metric already used by the widget data model (for example moon altitude, moon penalty, or moon temperature-equivalent display if that is the existing internal meaning). This must stay consistent with the current weather widget’s semantics and must not invent a new meaning locally.

### Exclusions

- no details toggle;
- no matrix preview;
- no expansion panel.

---

## 6.3 Observing / Weather switch

### Purpose

Allows the user to switch the card stack interpretation between two modes:

- **Observing**
- **Weather**

### Behavior

The switch affects the presentation of the forecast cards below.

#### Observing mode

Cards emphasize observing usefulness:

- observation gate state;
- observing score / quality label if available from existing widget logic;
- most relevant weather parameters for sky use.

#### Weather mode

Cards emphasize general meteorological reading:

- cloud cover;
- temperature;
- wind;
- humidity;
- precipitation / other standard weather indicators if already available.

### Explicit exclusion

- **Matrix is not implemented** in this widget.
- The switch only changes the card roll presentation, not an additional matrix section.

---

## 6.4 Legend block

### Purpose

Provides a persistent explanation for observation gate status colors / labels used in the cards.

### Content

Static line:

```text
Observation Gate: Open Marginal Closed
```

### Recommended rendering

Display the three states with their corresponding visual semantics:

- **Open** — green
- **Marginal** — yellow / amber
- **Closed** — red

This aligns with the already established gate-state semantics used elsewhere in the project.

---

## 6.5 Cards roll

### Purpose

Displays forecast progression over the supported horizon in a vertical stack.

### Structure

- Cards follow one another vertically.
- No horizontal carousel is required.
- No matrix is embedded between them.

### Source

Cards are formed from the same `widget.js` preparation logic as the main widget, only rendered differently.

### Expected horizon

The target forecast horizon is approximately **72 hours**.

### Card density

The vertical widget should remain readable in a narrow column, so each card should be more compact than the full widget card.

### Recommended card content

Each card should include at minimum:

- hour / local timestamp;
- gate state;
- key weather indicators;
- observing summary in Observing mode or weather summary in Weather mode.

### Scrolling

If the full stack exceeds available height, the cards area may scroll internally, provided the top controls and footer remain stable.

---

## 6.6 Footer line

### Purpose

Shows freshness and forecast horizon.

### Exact format

```text
Updated 2:02 · ~72h forecast
```

### Rules

- `Updated` time should be shown in local time for the selected location.
- `~72h forecast` is a compact human-readable horizon indicator.
- If actual data horizon slightly differs, the UI may still display `~72h forecast` as the product label unless a later spec requires dynamic precision.

---

## 7. Functional requirements

## 7.1 Data compatibility

The widget must consume existing weather widget data structures wherever possible.

No breaking schema changes are allowed.

If extra fields are needed specifically for the vertical widget, they must be additive only and must not alter existing contracts. This follows the project-wide JSON safety rules and frontend stability guarantee. fileciteturn0file2

## 7.2 Location handling

The widget must support:

- default location;
- runtime location change by user;
- data refresh after location change.

## 7.3 Time handling

Display time to the user in local time for the selected location.

For any newly introduced internal timestamps or transport fields, UTC remains the canonical storage format under project rules. fileciteturn0file2

## 7.4 Reuse of existing logic

The following should be reused from the current weather widget where possible:

- data fetch layer;
- normalization;
- hourly card preparation;
- observing-state evaluation;
- gate-state evaluation;
- update timestamp derivation.

## 7.5 Embed readiness

The widget must be usable on external pages such as `nebulacast.com`.

That implies:

- no dependency on local test-page-only globals;
- mount by container id;
- configurable location / theme / base URL via init config;
- isolated CSS class namespace or equivalent containment.

---

## 8. Visual requirements

### General

- narrow-column friendly;
- visually aligned with existing widget style;
- compact but readable;
- no overloaded controls.

### Recommended sizing

- optimized for sidebar widths approximately `280–420px`;
- card padding reduced versus main widget;
- typography consistent with weather widget design system.

### State visibility

The following must be immediately legible:

- current location;
- current hour condition;
- active mode (`Observing` or `Weather`);
- gate legend;
- progression across upcoming hours;
- update freshness.

---

## 9. Interaction model

## 9.1 User actions

Supported actions:

- choose location;
- switch between Observing and Weather;
- scroll forecast stack if needed.

## 9.2 Unsupported actions in MVP

- opening details panel inside the current card;
- opening observation matrix;
- switching to alternative complex layouts.

---

## 10. Test HTML requirement

A separate standalone HTML page is required for development and local validation.

### Required deliverable

A dedicated file, for example:

```text
weather-vertical.html
```

### Purpose of the test page

- mount the vertical widget independently of the main app;
- validate responsive behavior in a narrow column;
- test location selection;
- test Observing / Weather switch;
- verify embeddability for external sites.

### Recommended contents

The test HTML should:

- include one mount container for the vertical widget;
- provide a realistic column width wrapper;
- load the widget JS and CSS exactly as external consumers would;
- allow passing configuration via script or inline config object.

---

## 11. Public integration requirement

The widget must be ready to be embedded into other sites, specifically including `nebulacast.com`.

### Required integration shape

Preferred API pattern:

```js
WeatherWidget.mount({
  mountId: "weatherVerticalMount",
  layout: "vertical",
  lat: 52.2297,
  lon: 21.0122,
  timezone: "Europe/Warsaw"
});
```

This is illustrative interface intent, not a mandatory exact function name.

### Integration constraints

- no hardcoded test-page assumptions;
- no dependence on dev-only DOM structure;
- graceful behavior when embedded multiple times on one page, if supported by the main widget architecture.

---

## 12. Recommended implementation plan

### Phase 1 — Vertical layout shell

- Create dedicated vertical HTML test page.
- Add vertical widget mount path.
- Implement vertical block order.

### Phase 2 — Current card simplification

- Reuse current-hour card source data.
- Remove details toggle.
- Add compact metrics line.

### Phase 3 — Mode switch

- Implement Observing / Weather toggle.
- Bind it to vertical card rendering.

### Phase 4 — Card stack renderer

- Render forecast cards in vertical sequence.
- Tune spacing, density, overflow behavior.

### Phase 5 — Embed hardening

- Verify operation on standalone test page.
- Verify external-site initialization flow.
- Verify styling isolation.

---

## 13. Risks and boundaries

### Risks

1. **Over-duplication of logic**  
   If vertical mode is implemented as a separate widget instead of a layout variant, maintenance cost will rise.

2. **Ambiguity of the `🌙` value**  
   The moon metric shown in the compact line must reuse existing semantics. It should not be redefined ad hoc.

3. **Location API coupling**  
   If the existing widget does not already expose a reusable location picker / resolver, integration may require a thin adapter layer.

4. **Card density tradeoff**  
   Too much information will make the column unreadable; too little will weaken observing usefulness.

### Boundaries

- no matrix in MVP;
- no backend contract rewrite;
- no legacy JSON restructuring;
- no unrelated UI refactor bundled into this task.

---

## 14. Acceptance criteria

The vertical weather widget is accepted when all of the following are true:

1. A standalone HTML test page exists and renders the widget.
2. The widget displays blocks in this order:
   - Time / Location
   - Current hour card
   - Observing / Weather switch
   - Legend
   - Vertical forecast card stack
   - Updated line
3. The current-hour card has no details toggle.
4. The compact metrics line is displayed in the current-hour card.
5. The Observing / Weather switch changes the vertical cards presentation.
6. The Observation Gate legend is present.
7. Cards are stacked vertically.
8. Footer shows update time and approximate 72h horizon.
9. The widget can be mounted independently for external-site usage.
10. No breaking changes are introduced into existing weather widget data contracts.

---

## 15. Deliverables

Required deliverables for this task:

1. **Markdown spec** for the widget.
2. **Separate test HTML** for the vertical widget.
3. **Vertical layout implementation** in JS/CSS.
4. **Embed-ready widget entry point** for use in external sites.

---

## 16. Final summary

This widget is a **vertical, compact, embed-ready weather sidebar** derived from the existing weather widget.

It preserves the current data model and card-generation approach, removes nonessential complexity for narrow-column use, and focuses on a clear stack:

- location and time,
- current conditions,
- observing vs weather mode,
- legend,
- forecast cards,
- update freshness.

It is intended as a practical MVP component that can be tested standalone and then reused on `nebulacast.com` and similar sites.
