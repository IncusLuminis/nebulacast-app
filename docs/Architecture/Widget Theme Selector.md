Widget Theme Selector for Embed Code

Feature Specification

⸻

1. Objective

Add a theme selector to the widget embed generator UI.

When a user configures widget dimensions in order to generate an embed code, the UI must also allow selecting a visual theme.

The selected theme must be included in the generated embed configuration so the embedded widget renders with the chosen appearance.

⸻

2. Supported Themes

Only three themes are supported in this version:

2.1 Dark (night)

Default theme.
This is the current existing visual style.

UI label:

Dark

Internal value:

night


⸻

2.2 Light (day)

A light theme intended as a near-inversion of the current dark theme:
	•	white or near-white background
	•	dark text
	•	dark controls/icons
	•	reduced glow intensity
	•	preserved hierarchy and layout
	•	same semantic colors where possible, adapted for light contrast

UI label:

Light

Internal value:

day


⸻

2.3 Ocean (ocean)

A blue-toned theme inspired by the current Windsurf-like palette.

Target characteristics:
	•	soft blue / cyan background base
	•	dark blue or navy text where needed
	•	cool accent colors
	•	cleaner, more modern feel than Night
	•	must remain readable and not become decorative-only

UI label:

Ocean

Internal value:

ocean


⸻

3. Scope

This feature applies to the embed code generator UI.

It affects:
	•	theme selection in the configuration panel
	•	embed code generation
	•	embedded widget rendering

It does not require:
	•	redesign of widget layout
	•	changes to widget data contract
	•	changes to widget business logic

⸻

4. UX Requirement

4.1 Placement

The theme selector must appear next to the size controls in the embed configuration area.

Typical order:
	1.	widget width
	2.	widget height
	3.	theme selector
	4.	generated embed code

The selector must be visible before the code is generated.

⸻

4.2 Control Type

Recommended control types:

Preferred
	•	segmented control with 3 options

Example:

[ Dark ] [ Light ] [ Ocean ]

Acceptable fallback
	•	dropdown/select

Segmented control is preferred because:
	•	only 3 options
	•	faster comparison
	•	more visual
	•	better suited for embed setup UX

⸻

4.3 Default Selection

Default selected option:

Dark

Internal default:

night

Reason:
	•	it matches the current existing widget appearance
	•	ensures backward compatibility
	•	avoids changing current behavior for users who do not interact with the new control

⸻

4.4 Preview Behavior

When the user changes theme in the embed generator UI:
	•	the preview, if present, should update immediately
	•	the generated code should update immediately
	•	no page reload should be required

If there is no live preview yet, at minimum the generated code must update immediately.

⸻

5. Functional Requirements

5.1 New Embed Option

Add theme as a first-class embed parameter.

Allowed values:

night
day
ocean

No other values are valid.

⸻

5.2 Generated Code

The selected theme must be included in the generated embed code.

Example: iframe URL parameter

<iframe
  src="https://example.com/widget?theme=ocean&width=400&height=600"
  width="400"
  height="600"
  frameborder="0"
></iframe>

If your embed format uses data-* attributes or JSON config instead of URL params, the same rule applies: the chosen theme must be explicitly passed.

⸻

5.3 Widget Initialization

Embedded widget must read the theme parameter during initialization.

Behavior:
	•	if theme is valid, apply it
	•	if theme is missing, use night
	•	if theme is invalid, fallback to night

⸻

6. Data Model

6.1 UI Model

{
  width: 400,
  height: 600,
  theme: "night"
}


⸻

6.2 Theme Enum

const THEMES = ["night", "day", "ocean"];


⸻

7. Rendering Rules

7.1 Theme Application Mechanism

Recommended implementation:

Apply a root attribute on widget mount:

<div class="widget-root" data-theme="night"></div>

or

<html data-theme="night">

Preferred for embedded widget:

<div class="widget-root" data-theme="night"></div>

Reason:
	•	isolated
	•	works better for embeds
	•	avoids interfering with host page styling

⸻

7.2 CSS Strategy

Use theme tokens, not duplicated widget CSS.

Recommended structure:

.widget-root {
  --bg: #0b0f14;
  --text: #e8eef7;
  --accent: #6fd3ff;
}

Then override by theme:

.widget-root[data-theme="night"] { ... }
.widget-root[data-theme="day"] { ... }
.widget-root[data-theme="ocean"] { ... }

This avoids:
	•	duplicated stylesheets
	•	brittle per-component overrides
	•	divergence between themes

⸻

8. Theme Definitions

8.1 Night Theme

This is the current baseline.

Target characteristics:
	•	dark background
	•	light text
	•	current contrast model
	•	current accents preserved

No visual redesign required beyond extracting current colors into tokens.

⸻

8.2 Day Theme

The Day theme should be a functional light conversion, not a decorative redesign.

Required characteristics:
	•	white / off-white background
	•	dark text
	•	muted borders
	•	darker icons
	•	reduced neon/glow effects
	•	preserve semantic emphasis colors if they remain accessible

Design intent:
	•	“same widget, light mode”
	•	not a completely different aesthetic

⸻

8.3 Ocean Theme

The Ocean theme should feel modern, cool, and readable.

Required characteristics:
	•	blue/cyan background family
	•	cool-toned accents
	•	text contrast preserved
	•	controls remain crisp
	•	avoid excessive gradients or glossy noise

Design intent:
	•	closer to a modern dashboard aesthetic
	•	not fantasy/futuristic overload
	•	should feel professional enough for embedding into external sites

⸻

9. Backward Compatibility

This feature must be backward compatible.

Existing embeds without theme

Must continue to work unchanged.

Behavior:

missing theme => use night

Existing widget pages without selector

Must continue to render the current Night theme by default.

⸻

10. Validation Rules

Accepted values:
	•	night
	•	day
	•	ocean

Invalid values:
	•	ignored
	•	fallback to night

Validation must happen:
	•	in embed generator
	•	in widget initialization

⸻

11. UI Specification for Embed Generator

11.1 Layout

Recommended row:

Width [____]
Height [____]
Theme [ Dark | Light | Ocean ]

Or compact inline layout:

Width [____]  Height [____]  Theme [ Dark | Light | Ocean ]

If space is limited, theme may go on the next line, but should remain visually tied to size selection.

⸻

11.2 Labels

User-facing labels:
	•	Dark
	•	Light
	•	Ocean

Internal values:
	•	night
	•	day
	•	ocean

The UI may optionally show the existing style mapping in helper text, but not in the control labels themselves.

⸻

11.3 Helper Text

Optional helper text under the theme selector:

Choose how the embedded widget will look on your site.

Keep it short.

⸻

12. Preview Requirements

If the embed generator includes a preview pane:
	•	changing theme must update preview immediately
	•	changing dimensions must preserve selected theme
	•	theme changes must not reset size controls

Preview state and generated code must stay synchronized.

⸻

13. Acceptance Criteria

The feature is complete when:
	1.	The embed configuration UI includes a theme selector near the size controls.
	2.	The selector exposes exactly 3 options:
	•	Dark
	•	Light
	•	Ocean
	3.	Dark is selected by default.
	4.	The generated embed code includes the selected theme.
	5.	The embedded widget reads and applies the theme correctly.
	6.	Missing or invalid theme falls back to night.
	7.	Existing embeds without theme continue to render as they do now.
	8.	Theme switching does not affect widget data logic or layout structure.
	9.	If preview exists, it updates immediately when theme changes.

⸻

14. Non-Goals

Not included in this feature:
	•	user-custom theme editor
	•	automatic host-site theme detection
	•	per-section theme overrides
	•	additional themes such as Twilight
	•	persistence of theme across all widgets globally
	•	redesign of widget control structure

⸻

15. Implementation Notes

15.1 Minimal-Change Path

Least painful implementation path:
	1.	Add a theme selector to the embed generator UI
	2.	Add theme into the generated config / URL
	3.	Read theme at widget bootstrap
	4.	Apply data-theme="<value>" to the widget root
	5.	Extract existing colors into CSS custom properties
	6.	Add day and ocean token sets

This keeps changes localized and avoids touching widget logic.

⸻

15.2 Recommended Internal Naming

Use these canonical internal names everywhere:

night
day
ocean

Do not mix:
	•	dark
	•	light
	•	blue

Those are UI labels only.

⸻

16. Suggested Example

UI

Size:
Width  [400]
Height [600]

Theme:
[ Dark ] [ Light ] [ Ocean ]

Generated embed

<iframe
  src="https://example.com/widget?theme=day&width=400&height=600"
  width="400"
  height="600"
  loading="lazy"
  frameborder="0">
</iframe>


⸻

17. Final Recommendation

Implement this as a presentation-layer feature only:
	•	one new selector in the embed generator
	•	one new theme parameter in embed config
	•	one root-level theme switch in widget rendering
	•	CSS token overrides for the 3 themes
