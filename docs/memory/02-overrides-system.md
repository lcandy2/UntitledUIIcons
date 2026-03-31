# Overrides System

## Purpose

Custom SVG icons that replace or extend the upstream `@untitledui/icons` package. Overrides are not affected by upstream updates.

## Directory

```
Overrides/
├── lock03-filled.svg         ← replaces upstream lock03 (same name = replace)
├── my-custom-icon.svg        ← new name = added as new icon
└── .gitkeep
```

## Pipeline Integration

Runs as **Step 1.5** in `convert.mjs`, after extracting upstream SVGs and before conversion:

1. Read each `.svg` file from `Overrides/`
2. Parse with `parseSVGFile()` → produces `{ processed, original }`
3. If the kebab-name matches an existing icon → replace it
4. If no match → add as a new icon
5. All subsequent steps (swiftdraw, xcassets, Swift codegen, HTML) include overrides seamlessly

## SVG Format Requirements

Override SVGs must follow the same format as upstream icons:
- `viewBox="0 0 24 24"` with `width="24" height="24"`
- Use `stroke="black"` and `stroke-width="2"` for outlines
- Use standard SVG elements: `<path>`, `<circle>`, `<rect>`, etc.
- Per-element `fill` and `stroke` attributes override the root defaults
