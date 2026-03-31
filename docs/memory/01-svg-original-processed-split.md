# SVG Original / Processed Split

## Structure

```
SVGs/
├── original/    ← viewBox="0 0 24 24", width=24, height=24
└── processed/   ← tight viewBox, width/height match content aspect ratio
```

## Why

- **original**: preserves the upstream 24×24 canvas, useful for direct use in web/design tools
- **processed**: padding removed, true content proportions, used for SF Symbol conversion via swiftdraw

## Implementation

`extractSVG()` was refactored into:
- `buildSVGPair(elements)` — shared logic that returns `{ processed, original }`
- `extractSVG(mjsContent)` — parses React component `.mjs` files → calls `buildSVGPair`
- `parseSVGFile(svgContent)` — parses raw SVG files (for Overrides) → calls `buildSVGPair`

Both versions share the same path elements; only the `<svg>` root attributes differ.
