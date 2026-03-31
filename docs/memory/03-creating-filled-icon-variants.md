# Creating Filled Icon Variants

## Goal

Create a "filled" version of a stroked icon (e.g., `lock03` → `lock03.filled`) that:
1. Has a solid filled body
2. Keeps the outline details (e.g., shackle on a lock)
3. Sits on the **exact same SF Symbol grid** as the outline version

## The Wrong Approaches

### ❌ `fill="black"` on a single path with multiple subpaths

```svg
<path d="M17 11V8A5 5 0 0 0 7 8v3m1.8 10h6.4c...21Z" fill="black"/>
```

SVG fill applies to ALL subpaths. Open subpaths (like the shackle) get implicitly closed, creating a solid blob instead of an arch outline.

### ❌ Separate `<path>` elements with `fill="black"` on the body

```svg
<path d="M17 11V8A5 5 0 0 0 7 8v3"/>           <!-- shackle, stroke only -->
<path d="M8.8 21h6.4c...21Z" fill="black"/>     <!-- body, filled -->
```

swiftdraw generates different path outlines for filled vs stroked paths. A filled body is ~10% smaller than a stroked body because swiftdraw doesn't expand fill bounds by stroke width. Results in mismatched SF Symbol grids.

## The Correct Approach: Fill Underlay + Stroke Overlay

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"
     fill="none" stroke="black" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round">
  <!-- Layer 1: body fill (no stroke) -->
  <path d="M8.8 21h6.4c...21Z" fill="black" stroke="none"/>
  <!-- Layer 2: full original outline (identical to outline version) -->
  <path d="M17 11V8A5 5 0 0 0 7 8v3m1.8 10h6.4c...21Z"/>
</svg>
```

### Why This Works

1. **Layer 1** (fill underlay): `fill="black" stroke="none"` — fills the body interior without affecting bounds
2. **Layer 2** (stroke overlay): inherits `fill="none" stroke="black"` — produces the **exact same** stroke outlines as the original icon

swiftdraw processes Layer 2 identically to the original outline icon, so margin guides, caplines, and baselines are pixel-perfect aligned. Layer 1 just adds the solid fill underneath.

### Result

- SF Symbol guides: identical to outline version
- Visual: solid body + stroked outline
- Swift API: `Image(untitledUI: .lock03_filled)` (identifier: `lock03.filled`)

## Two Strategies by Icon Type

### Strategy A: Simple icons (no internal details to preserve)

Icons like heart, bookmark, grid01 — one or more closed paths, no cutouts or details that need separate strokes.

**Use a single path with `fill="black"`** (inherits `stroke="black"` from root). No separate stroke overlay.

```svg
<!-- heart.filled.svg -->
<path d="M11.993 5.136c...826Z" fill="black"/>
```

**Why no stroke overlay?** swiftdraw converts strokes into inner+outer contour paths. If a fill underlay sits beneath, the inner contour becomes a visible "inner stroke" artifact in the SF Symbol. Using one path with fill+stroke avoids this — swiftdraw renders it as a single solid shape.

**Trade-off:** Guides may differ slightly from the outline version (swiftdraw treats fill+stroke vs stroke-only differently). Acceptable for filled variants.

### Strategy B: Complex icons (with internal details)

Icons like lock03 (shackle + body), home02 (house + door), user-circle (circle + person) — need cutouts or selective stroking.

**Use `fill-rule="evenodd"` for cutouts + selective stroke overlay.**

```svg
<!-- home02.filled.svg -->
<!-- Layer 1: house filled, door cut out via evenodd -->
<path fill-rule="evenodd" d="M11.018 2.764...462Z M9 21v-7.4c...V21Z" fill="black" stroke="none"/>
<!-- Layer 2: house outline only (no door stroke) -->
<path d="M11.018 2.764...462Z"/>
```

```svg
<!-- user-circle.filled.svg -->
<!-- Layer 1: circle filled, person cut out via evenodd -->
<path fill-rule="evenodd" d="M22 12c0...10Z M16 9.5a4...0Z M5.316...19.438Z" fill="black" stroke="none"/>
<!-- Layer 2: full original stroke -->
<path d="M5.316 19.438A4.001...2.438M16 9.5a4...0Zm6 2.5c0...10Z"/>
```

Key rules for Strategy B:
- Layer 1: all shapes in one path with `fill-rule="evenodd"` — outer shape is filled, inner shapes are cutouts
- Layer 2: full original stroke overlay for guide alignment

### Strategy C: Fill underlay + full original stroke overlay

The **default strategy** for most icons. Two layers:
1. Fill underlay (`fill="black" stroke="none"`) — the shape(s) to fill
2. Full original path with stroke — ensures SF Symbol guides match the outline version

```svg
<!-- heart.filled.svg -->
<path d="M11.993 5.136c...826Z" fill="black" stroke="none"/>
<path clip-rule="evenodd" d="M11.993 5.136c...826Z"/>
```

```svg
<!-- lock03.filled.svg -->
<path d="M8.8 21h6.4c...21Z" fill="black" stroke="none"/>   <!-- body fill -->
<path d="M17 11V8...v3m1.8 10h6.4c...21Z"/>                 <!-- full original stroke -->
```

For simple icons (heart, bookmark), both layers use the same `d`. For compound icons (lock), Layer 1 uses only the closed body subpath.

### ❌ Strategy A: Single path with `fill="black"` (deprecated)

Using one path with `fill="black"` and inherited stroke avoids the inner stroke artifact but causes **guide misalignment** — swiftdraw treats fill+stroke paths differently from stroke-only, producing different margin positions.

## Existing Filled Variants

| Override file | Swift property | Strategy | Notes |
|---|---|---|---|
| `heart.filled.svg` | `.heart_filled` | C | Fill underlay + full stroke |
| `heart-rounded.filled.svg` | `.heart_rounded_filled` | C | Fill underlay + full stroke |
| `bookmark.filled.svg` | `.bookmark_filled` | C | Fill underlay + full stroke |
| `grid01.filled.svg` | `.grid01_filled` | A | 4 closed subpaths, fill+stroke |
| `lock03.filled.svg` | `.lock03_filled` | C | Body filled, shackle stroked |
| `lock-unlocked03.filled.svg` | `.lock_unlocked03_filled` | C | Body filled, open shackle stroked |
| `home02.filled.svg` | `.home02_filled` | B | House filled, door cutout (evenodd) |
| `user-circle.filled.svg` | `.user_circle_filled` | B+C | Circle filled (evenodd cutout) + full stroke |
