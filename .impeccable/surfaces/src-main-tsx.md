---
version: 1
slug: "src-main-tsx"
primary_target: "src/main.tsx"
related_targets: ["src/Editor.tsx","src/style.css"]
---

# Wall interface and contribution studio

Mode: Operate for editing; Experience for wall exploration. Preserve the user-confirmed mural, plaster, Tyrian purple, Inter UI, Phosphor icons, rounded corners, bottom-center view controls and bottom-right Add a mark.

## Direction contract

THESIS: The wall is a community mural; creation opens a bottom palette, not a tall generic settings form.

OWN-WORLD: Warm paper surfaces and a plum-tinted studio header, confident Tyrian actions, generous Inter labels, round functional swatches and Phosphor controls. Decorative artwork stays on the wall.

STORY: Explore, choose a spot, compose with ink, see an honest preview, optionally adjust styling, then publish. The chosen spot and draft survive errors.

FIRST VIEWPORT: On desktop the mural remains visible above a broad, low bottom tray. Compose is on the left, a persistent mark preview is central, and ink/style controls plus publishing sit right. A fixed action region preserves publishing on short screens. Phones use the same order in a scrollable sheet with a persistent footer. About remains accessible at every width.

FORM: Bottom palette, grounded candidate 4, chosen by the user from three visual sketches. Reference seed:5fd8615807aa0b30. Signature interaction: the visitor's writing or strokes immediately become their framed mark preview; a soft selected-tab slide and symmetric tray lifecycle clarify the transition into creation.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Motion: pointer press feedback 120ms; tray enter 220ms and exit 160ms; tab indicator 180ms; notices 180/140ms. Use cubic-bezier(.23,1,.32,1). Reduced motion uses 100–120ms opacity and immediate camera. Keyboard navigation, drag, pinch, and drawing remain direct. Home pointer transition is interruptible and preserves the current presentation value. No looping decorative artwork, sound, or confetti.

Questions skipped: further product interviewing is unnecessary because the original implementation brief and the user's confirmed preservation/playfulness choices settle this surface's purpose and constraints. Chosen code-first sketches govern composition; no generated comp is promised.
