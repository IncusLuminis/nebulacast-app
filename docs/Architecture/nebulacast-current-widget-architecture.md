Nebulacast.app Widget Architecture — Existing System Audit

Objective

Perform a read-only architectural audit of the current Nebulacast.app codebase.

The purpose of this task is NOT to redesign the application and NOT to implement anything.

We are preparing a future architectural change in which Nebulacast.app should become both:

1. a standalone astronomical/weather/information console;
2. a reusable widget server/library whose widgets can be embedded into other websites and applications.

Before designing that architecture, document exactly how the current application works.

⸻

1. Target Concept — Context Only

The future direction is approximately:

BACKEND / DATA PIPELINES
        │
        ▼
 independent datasets / APIs
        │
        ▼
 WIDGET LIBRARY
 ├── Sky
 ├── Weather
 ├── News
 ├── Events
 ├── Alerts
 ├── Hero / Current Conditions
 ├── ...
        │
        ├──────────────► embedded widgets on external sites
        │
        └──────────────► Nebulacast Console
                          assembled from widgets

Widgets should eventually be independent from each other.

The Console should eventually become a composition of widgets rather than a monolithic UI whose panels know about each other.

This is context for the audit only.

DO NOT implement this architecture yet.

⸻

2. Audit the Repository Structure

Document the relevant repository structure.

Identify:

* frontend application entry points;
* Console implementation;
* widgets/components;
* backend/services;
* pipelines/generators;
* staging/generated datasets;
* static assets;
* shared JavaScript/TypeScript;
* shared CSS/styles;
* configuration;
* deployment-related files relevant to the frontend or widget delivery.

Provide a concise annotated tree.

Do not dump the entire repository tree.

Include only architecturally relevant paths.

⸻

3. Identify Existing Widgets

Find every UI component that currently behaves, or approximately behaves, like a widget.

Examples may include:

* Sky
* Weather
* News
* Events
* Alerts
* astronomical object panels
* current conditions
* forecasts
* hero panels
* clocks/status panels
* other dashboard/console panels

Do not assume this list is complete.

Determine what actually exists from the code.

For every candidate component provide:

Field	Description
Component	Human-readable name
Source path	File/directory
Used by	Page/Console/location
Data source	JSON/API/service
Rendering model	JS/TS/template/etc.
Styling	local/shared/global
Orientation	vertical/horizontal/fixed
Configuration	existing configuration options
Refresh model	static/polling/timer/page reload/etc.
External dependencies	libraries/services
Coupling	dependencies on Console or other widgets
Reusability	High / Medium / Low
Notes	important implementation details

⸻

4. Identify UI Panels That Are NOT Widgets

Some current Console areas may visually resemble widgets but actually be implemented directly inside a page/layout.

Find them.

Pay particular attention to:

* Console hero area;
* right-hand sidebar;
* Alerts area;
* navigation/status blocks;
* any large composite panels.

For every such panel explain:

1. where it is implemented;
2. why it is not currently an independent widget;
3. what application state or DOM structure it depends on;
4. what data it consumes;
5. whether it could theoretically become independent without backend changes.

Do NOT implement the conversion.

⸻

5. Console Composition

Explain how the current Console is assembled.

Trace:

application entry
    ↓
page/layout
    ↓
Console
    ↓
panels/components

Determine:

* whether layout is hard-coded;
* whether widgets/components are instantiated explicitly;
* whether there is any registry/config-driven composition;
* whether component order is hard-coded;
* whether dimensions are hard-coded;
* how responsive behavior works;
* how the right sidebar is constructed;
* how the hero area is constructed;
* whether components exchange state directly;
* whether components manipulate DOM outside their own root;
* whether components know about their parent layout.

A key question:

Could the current Console theoretically be described by configuration such as this?

[
  { widget: "hero", slot: "hero" },
  { widget: "sky", slot: "main" },
  { widget: "weather", slot: "main" },
  { widget: "events", slot: "main" },
  { widget: "alerts", slot: "sidebar" }
]

Do not build this configuration.

Explain what currently prevents it.

⸻

6. Data Flow

For each major UI component trace the complete data flow:

external source
    ↓
backend generator/service
    ↓
generated/staging data
    ↓
frontend fetch/import
    ↓
transformation
    ↓
render

Identify:

* shared datasets;
* widget-specific datasets;
* data transformations performed in frontend;
* backend transformations;
* duplicated transformations;
* direct access to third-party APIs from frontend, if any;
* hard-coded file paths or endpoints.

Create a data-flow table.

⸻

7. Refresh / Update Model

Document how data updates currently happen.

For each component determine:

* page-load only;
* interval polling;
* explicit refresh;
* backend regeneration;
* cache behavior;
* timestamps;
* stale-data handling;
* error handling;
* fallback handling.

Identify whether each widget already has enough information to refresh independently.

⸻

8. JavaScript Architecture

Document how frontend JavaScript is currently structured.

Identify:

* modules;
* shared utilities;
* initialization functions;
* global variables;
* event listeners;
* DOM selectors;
* timers;
* fetch wrappers;
* state management;
* shared mutable state.

Especially identify code patterns that would prevent multiple instances of the same widget from existing on one page.

Examples:

document.getElementById("weather")
global weatherState
single hard-coded timer
querySelector(".widget")

Do not change them.

List them with source locations.

⸻

9. CSS / Layout Coupling

Analyze widget-related styling.

Determine:

* whether styles are scoped or global;
* whether components depend on Console-specific grid classes;
* whether width/height assumptions exist;
* whether vertical/horizontal layouts already exist;
* whether responsive breakpoints are component-specific or global;
* whether component styles can survive outside the Console page.

For every widget classify layout portability as:

* independent;
* mildly coupled;
* strongly coupled.

⸻

10. Current Embedding / Widget Page

Find the existing page where users can currently select or use widgets.

Document:

* URL/page source;
* available widgets;
* configuration UI;
* generated embed code, if any;
* script loader, if any;
* iframe usage, if any;
* CSS dependencies;
* limitations;
* how widget configuration is encoded;
* whether widgets are served from Nebulacast.app itself.

If embed functionality already exists, trace it completely.

⸻

11. Widget Runtime / Loader

Search specifically for any existing reusable widget runtime or loader.

Examples:

<script src="..."></script>
<div data-widget="sky"></div>

or APIs similar to:

Nebulacast.mount(...)
NebulacastWidget(...)
createWidget(...)
initWidget(...)

If such machinery exists:

* describe it;
* show its public interface;
* identify supported widgets;
* identify limitations.

If it does not exist, state this explicitly.

⸻

12. Backend Independence

Determine whether backend datasets are already sufficiently independent for widget use.

For each candidate widget answer:

* Does its dataset already exist independently?
* Is it consumed only by this widget?
* Does it require data assembled by the Console?
* Does frontend code combine multiple datasets?
* Would exposing it as a standalone widget require backend changes?

Do not propose backend refactoring yet.

⸻

13. Coupling Map

Produce a dependency/coupling map.

For example:

Console
 ├── Hero
 │    ├── weather data
 │    └── sky data
 │
 ├── Sky
 │    └── sky dataset
 │
 ├── Weather
 │    └── weather dataset
 │
 └── Sidebar
      └── Alerts
           └── alerts dataset

Use the actual relationships found in the repository.

Highlight unexpected cross-dependencies.

⸻

14. Widget Readiness Matrix

Classify every candidate component:

Component	Data independent	UI independent	Layout independent	Multi-instance safe	Embed-ready	Overall
Example	Yes	Partial	No	No	No	Medium

Use:

* Yes
* Partial
* No

Overall:

* Ready
* Minor extraction
* Significant extraction
* Requires redesign

Base classifications strictly on code inspection.

⸻

15. Risks / Technical Debt Relevant to Widgetization

List only technical issues relevant to the future widget architecture.

Examples:

* global DOM assumptions;
* shared mutable state;
* CSS leakage;
* duplicated fetch logic;
* hard-coded Console paths;
* hard-coded IDs;
* layout-specific markup;
* backend/frontend responsibilities mixed together;
* inability to instantiate multiple widgets;
* timers owned by page rather than component;
* shared error state.

Do not perform general code-quality review.

⸻

16. Preserve Existing Contracts

The audit must recognize existing backend/data contracts.

Do not recommend breaking existing JSON schemas as part of this task.

Assume existing datasets and frontend behavior must remain operational during future migration.

The future architecture should be expected to evolve incrementally.

⸻

17. No Changes

This task is strictly READ ONLY.

DO NOT:

* modify code;
* refactor code;
* rename files;
* move files;
* introduce frameworks;
* create widget abstractions;
* change JSON;
* change CSS;
* implement loaders;
* change deployment;
* create new APIs.

Do not make commits.

⸻

18. Required Deliverable

Create:

docs/architecture/nebulacast-current-widget-architecture.md

The document must contain:

1. Executive Summary
2. Relevant Repository Structure
3. Current Console Architecture
4. Existing Widget Inventory
5. Non-Widget Console Panels
6. Data Flow
7. Refresh / Update Model
8. JavaScript Architecture
9. CSS / Layout Architecture
10. Current Widget/Embed System
11. Backend/Data Dependencies
12. Coupling Map
13. Widget Readiness Matrix
14. Main Obstacles to Independent Widgets
15. Migration-Relevant Risks
16. Open Questions

Do not include a proposed target architecture except where necessary to explain why a current implementation is coupled.

The purpose of this document is to provide evidence for the next architecture/design phase.

⸻

19. Evidence Requirements

Every important architectural statement must reference concrete code.

Use file paths and, when useful, function/class/component names.

Prefer:

sites/console/foo.js → initWeather()

over vague statements such as:

"The weather component appears to be coupled."

If something cannot be determined from the repository, explicitly state:

Not determined from current code.

Do not guess.