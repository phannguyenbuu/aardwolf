# Page styles

`../page.css` is the single entry point, still imported between Bootstrap and
`../responsive.css` in `App.jsx`. Vite resolves its imports into the stylesheet;
these files do not introduce separate runtime stylesheet requests in production.

The numeric prefixes preserve the original cascade order. A later file can
override an earlier file, subject to specificity, `!important`, and media queries.
Do not alphabetize imports or move all media queries to the end.

| Files | Scope |
| --- | --- |
| 01 | Global layout, header, initial User Setting styles |
| 02–05 | Viewport, floating material inspector, bottom deck |
| 06–09 | Studio, environment, material library, view controls |
| 10 | Original mobile layout adjustments |
| 11–14 | Navigation, material editor, render dialogs, shared tab controls |
| 15–16 | Transform panel, viewport gizmo, space picker |
| 17 | User Setting theme and step controls |
| 18 | Current viewport layout and compact navigation |
| 19 | Library filters and path trace dialog |
| 20 | Shared navigation and Environment sliders |
| 21 | Crane image cards, including selection and keyboard focus |

## Editing

- Find the feature selector across this directory before adding a new rule.
  Update its existing definition instead of appending another override.
- State selectors (`:hover`, `:checked`, `[aria-pressed]`, etc.) and responsive
  rules remain separate when they express different behavior.
- Some base rules intentionally remain earlier than the current theme. Their
  unoverridden properties still apply. Do not delete a whole rule just because
  its selector appears again.
- `responsive.css` loads last and also participates in the cascade.
- Avoid introducing `!important` unless the existing Bootstrap or component
  rule requires it. This refactor retains existing priority rather than changing
  every control's styling at once.
- Verify desktop and mobile, User/Admin mode, tabs, expanded accordions,
  dialogs, and selected crane cards when changing shared selectors.

The initial extraction preserves rule order. Cleanup removes identical repeated
declarations and selected literal properties superseded by later rules for the
same selector. Crane card and path trace theme rules are consolidated into one
definition per state.
Unused selectors have not been removed based on text search alone.

## Refactor validation (2026-10-30)

- Production build passes. Vite still reports the existing large JavaScript
  chunk warning; CSS remains in one generated production asset.
- Browser computed-style comparison against the original stylesheet: no
  differences across eight app states (desktop, mobile, tablet, expanded User
  Setting, and all four Admin tabs). Comparisons include `::before`/`::after`.
- The final crane-card and path-trace consolidation also passes 15 focused
  comparisons: five widths (390, 575, 768, 1024, 1440) with normal, button hover,
  and radio keyboard focus states.
- Browser checks block backend calls and large 3D model downloads. They verify
  CSS/layout, not successful model rendering or backend workflows.
- Local comparison scripts, baseline CSS, JSON reports, and screenshots are in
  `tmp/css-refactor-audit/` and `tmp/check-*-css.cjs` /
  `tmp/check-css-fixtures.cjs`. They are audit artifacts, not application imports.
