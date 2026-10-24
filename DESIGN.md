---
name: The Wall
description: A warm community wall with a playful contribution studio.
colors:
  accent: "#66023c"
  accent-hover: "#4d022d"
  accent-soft: "#f0e3eb"
  focus: "#8b3670"
  ink: "#42313e"
  muted: "#73636e"
  paper: "#fffdf8"
  paper-soft: "#f6f0f2"
  studio: "#eee0eb"
  field: "#f4eff1"
  line: "#d8cbd3"
  charcoal-ink: "#303a36"
  rose-ink: "#bd4867"
  ocean-ink: "#386fa5"
  leaf-ink: "#427c61"
  ochre-ink: "#b77a22"
  error: "#9c2949"
typography:
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
  message:
    fontFamily: "Inter, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  wall-hand:
    fontFamily: "Caveat"
    fontSize: "28px"
    lineHeight: 1.2
rounded:
  control: "16px"
  panel: "28px"
  pill: "999px"
  inset: "12px"
  preview: "20px"
spacing:
  compact: "8px"
  field: "14px"
  control: "16px"
  mobile: "20px"
  section: "24px"
  wide: "28px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "14px 23px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  studio-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
---

# Design System: The Wall

## Overview

**Creative North Star: "Open Studio"**

Open Studio pairs the original mural and warm plaster with a welcoming, expressive place to make a small contribution. Paper controls sit above the artwork; Tyrian purple gives actions a clear voice, while the plum-tinted studio header makes creation feel like a shared workbench.

The interface stays legible in Inter and leaves expressive lettering to the wall and its honest preview. Rounded forms and brief, responsive motion make controls approachable without animating the artwork or disturbing reading and drawing.

**Key Characteristics:**

- Warm plaster and preserved mural
- Tyrian actions on paper surfaces
- Inter interface with expressive wall lettering
- Rounded controls and functional ink swatches
- Direct manipulation with forgiving drafts

## Colors

Tyrian purple anchors a palette of warm paper and muted plum neutrals; visitor ink is a separate expressive palette.

### Primary

- **Tyrian Purple:** primary publishing and Add actions, selected controls, headings, camera placement marker, and notices. The deeper accent is the primary hover state; soft accent supports hover and count badges.

### Secondary

- **Visitor Ink:** charcoal, rose, ocean, leaf, and ochre supplement Tyrian purple in the contribution palette. These are mark colors, not competing interface action colors.

### Neutral

- **Warm Paper:** floating controls and dialog surfaces.
- **Soft Paper / Studio Plum / Field:** footer and style sections, studio headers, and form fields respectively.
- **Plum Ink / Muted Plum / Line:** main text, supporting copy, and subtle dividers. Error text uses its dedicated rose tone.
- **Focus Plum:** visible keyboard outline, separate from selected-state styling.

**The Wall First Rule.** Keep the original mural and plaster visible around interface surfaces; decorative artwork belongs on the wall.

## Typography

**Interface Font:** Inter, sans-serif (400, 500, 600). **Wall Fonts:** Caveat (handwritten), DM Sans (simple print), Georgia (bookish).

The interface uses compact, readable labels and softly tightened headings. The wall retains the handmade voice.

### Hierarchy

- **Title:** studio heading uses the title token; other dialog headings use 26–27px. At narrow widths the studio title becomes 25px, then 23px at 360px or below.
- **Brand:** Inter 25px, weight 600, line-height 1.1 and tracking -0.035em; narrows to 23px.
- **Body:** informational panel paragraphs use the body token; editor support copy is 12–13px with 1.5–1.55 line height.
- **Label:** the label token covers fields and section names. Small counters are 11px with tabular numerals; ordinary buttons are 13px/500, primary actions 14px/600.
- **Message:** text entry uses the message token. Wall text is adjustable from 24–60px with line-height 1.1; handwritten attribution uses 20px Caveat. Empty previews use the wall-hand token.

**The Two Voices Rule.** Use Inter for interface text; use Caveat, DM Sans, or Georgia only for wall lettering and its preview.

## Layout

The wall is a fixed, full-viewport spatial canvas. The header and location status sit above it. Zoom and Home remain pinned at bottom center; Add a mark remains pinned at bottom right. Desktop outer margins are 32px; phones use 16px and safe-area-aware bottom offsets. At 600px or below, camera controls rise above the bottom action row while staying centered.

On desktop the editor is a low tray, at most 1260px wide with 32px side clearance, positioned 104px above the viewport bottom. Compose, preview, and ink/style form three columns. Its grid has an auto header, a scrollable minmax(0, 1fr) body, and an auto footer: publishing stays reachable independently of body scrolling. Body content aligns to the start so tablet grid rows do not stretch into gaps.

At 1100px, spacing tightens. At 900px or below, the studio becomes a viewport-aware sheet with 12px clearance: compose and ink stack left, preview spans the right. At 600px or below, the body becomes one column in compose–preview–ink order; Publish fills the footer width. At 360px or below, ink swatches form three columns. Short viewports (height at most 520px, width above 600px) use a three-column sheet. Visual viewport measurements keep dialogs within the keyboard-adjusted space.

## Elevation & Depth

Warm tonal grouping does most of the work. Floating dialogs and notices share the diffuse elevation token (`0 16px 64px #41213326`); the placement marker uses a smaller lift (`0 4px 16px #41213318`). The dialog backdrop is translucent plum (`#3c27301c`). Wall marks multiply into the plaster; the framed preview repeats that material at a smaller texture scale.

**The Soft Lift Rule.** Reserve diffuse shadows for floating dialogs, notices, and the placement marker; ordinary controls rest on paper without added elevation.

## Shapes

Controls use the control radius, dialogs the panel radius, primary actions and camera clusters the pill radius. Sheet dialogs use 26px corners; previews and notices use 20px, selected tab surfaces 12px. Icon buttons and ink swatches are circular. Borders are subtle and functional: field focus, selected ink, dividers, and drawing-pad inset framing.

## Components

### Buttons

Paper secondary buttons and Tyrian pill actions feel tactile and direct. Standard buttons and icon controls have 44px minimum height; primary actions use 50px, and mobile Publish uses 48px. Hover color feedback is limited to fine pointers. Press feedback scales to 0.97 over 120ms using the shared ease-out curve. Disabled controls use 0.46 opacity. Global focus uses a 3px outline with 4px offset; fields use 2px with 2px offset. The connection retry also preserves a 44px minimum target.

### Contribution mode and ink

The two mode buttons form a labeled pressed-button group. The paper selection plate slides over 180ms; content enters over 160ms with a 5px rise. Keyboard mode changes suppress content entry motion. Ink controls use 44px circular targets around smaller colored centers; selection combines a Tyrian outline with a check, rather than color alone. The style disclosure has a 48px summary, a rotating caret, and 140ms opacity transition.

### Inputs and drawing

Fields use a quiet filled background and rounded corners. Message entry is multiline and resizable outside compact overrides. Drawing is direct pointer input with round stroke ends, with Undo, Redo, and Clear. Keep the text mode accessible as the alternative. Inputs remain labeled, with counters and limits alongside the label. Empty or saving submissions disable publishing.

### Preview and publishing

Preview renders the actual draft through the same mark renderer as the wall. It measures the rotated mark and scales it down to fit, with 36px horizontal and 30px vertical clearance; it does not enlarge small marks. The persistent footer holds Publish and reassurance or an inline alert. Draft changes are saved locally when storage is available, and failures retain the draft and chosen coordinates. Do not present local-storage availability as a guarantee.

### Dialogs, focus, and feedback

Native modal dialogs supply modal behavior. The editor initially focuses message entry when present; otherwise the selected mode receives focus. Escape and keyboard close dismiss immediately. Closing restores focus to the connected opener, falling back to Add a mark. Pointer entry takes 220ms from 16px below at scale 0.985; pointer exit takes 160ms back to that pose. Keyboard-opened dialogs skip entry animation. Notifications enter/exit in 180/140ms with an 8px vertical movement and expose status text.

Home uses an interruptible critically damped camera return (angular frequency 24); interaction cancels the flight. Keyboard Home and keyboard-activated Home are immediate. Dragging, pinching, zooming, and drawing remain direct. Reduced motion removes tab/caret movement and press scaling, substitutes short opacity fades for content/dialog/notices (100–120ms), and makes Home immediate. These are implementation behaviors, not a claim of external accessibility certification.

### Navigation and icons

The bottom camera cluster groups Zoom out, zoom percentage, Zoom in, and Home on paper. About stays available as a labeled circular icon at narrower widths. Contributions provide a list alternative to spatial exploration. Use Phosphor SVG icons with accessible names on icon-only controls; decorative SVGs remain hidden from assistive technology.

## Do's and Don'ts

### Do:

- **Do** preserve the original mural and plaster texture.
- **Do** keep Zoom and Home pinned at bottom center and Add a mark pinned at bottom right, with safe-area spacing.
- **Do** retain the persistent publish footer while the editor body scrolls.
- **Do** provide labeled Phosphor controls, visible focus, selected-state checks, and a text alternative to drawing.
- **Do** preserve placement and draft content through errors and dismissal; clear the stored draft only after successful publishing.

### Don't:

- **Don't** move interface lettering into decorative wall fonts.
- **Don't** replace the honest preview with unrelated art or fabricated visitor content.
- **Don't** add looping decorative motion, sound, or confetti.
- **Don't** animate keyboard exploration or drawing, or hide focus to make a transition smoother.

### Street-print refinement

The interface now borrows the wall’s paint and paper materials: Tyrian primary actions use an authored irregular ink-swipe SVG mask, the editor header layers the existing plaster texture into purple paint, and the brand has a slightly rotated pasted-label treatment with an ink underline. A translucent tape detail anchors the preview. Inter, Phosphor controls, rounded surfaces, the mural, and the bottom palette layout remain intact. These details are static; painting and navigation stay direct. Higher-contrast mode removes paint texture from primary actions and the editor header.

The curated wall artwork shares this treatment: plaster-masked paint shapes and lettering, fixed spray flecks, rough ink swipes and purple paint drips. These decorations live in world coordinates and move with pan/zoom. The original central mural and visitor contributions retain their content and rendering.
