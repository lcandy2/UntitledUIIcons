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

## Applying to Different Icon Types

The technique works universally. The two layers are always:
1. **Fill underlay**: the closed shape(s) to fill, with `fill="black" stroke="none"`
2. **Stroke overlay**: the **exact original path data**, unchanged

### Single closed path (heart, bookmark)

Simple case — the entire icon is one closed path. Both layers use the same `d` attribute.

```svg
<!-- heart.filled.svg -->
<path d="M11.993 5.136c...826Z" fill="black" stroke="none"/>
<path clip-rule="evenodd" d="M11.993 5.136c...826Z"/>
```

### Multi-subpath (lock03)

The original path has open + closed subpaths. Layer 1 uses only the closed body subpath; Layer 2 uses the full original path.

```svg
<!-- lock03.filled.svg -->
<path d="M8.8 21h6.4c...21Z" fill="black" stroke="none"/>   <!-- body only -->
<path d="M17 11V8...v3m1.8 10h6.4c...21Z"/>                 <!-- full original -->
```

## Existing Filled Variants

| Override file | Swift property | Notes |
|---|---|---|
| `lock03.filled.svg` | `.lock03_filled` | Body filled, shackle stroked |
| `lock-unlocked03.filled.svg` | `.lock_unlocked03_filled` | Body filled, open shackle stroked |
| `heart.filled.svg` | `.heart_filled` | Single path, fully filled |
| `bookmark.filled.svg` | `.bookmark_filled` | Single path, fully filled |
