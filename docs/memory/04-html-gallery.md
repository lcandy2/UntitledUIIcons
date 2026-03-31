# HTML Gallery Page

## What

`index.html` at project root — a searchable icon gallery deployable via GitHub Pages.

## Features

- Instant search/filter by icon name
- Responsive grid of all icons (preview uses `SVGs/processed/`)
- Click to copy icon name
- Three download options per icon:
  - **SVG** — original 24×24 version (`SVGs/original/`)
  - **Trimmed** — processed tight-viewBox version (`SVGs/processed/`)
  - **SF Symbol** — swiftdraw output (`Symbols/`)

## Generation

Generated automatically as **Step 6** of `convert.mjs`. The icon list is embedded as a JSON array in the HTML. No external dependencies.

## CI

The GitHub Actions workflow (`convert.yml`) commits `SVGs/` and `index.html` alongside `Symbols/` and `Sources/`.
