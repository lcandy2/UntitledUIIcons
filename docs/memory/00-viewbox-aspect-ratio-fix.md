# ViewBox Aspect Ratio Fix

## Problem

The conversion pipeline (`Scripts/convert.mjs`) computes a tight viewBox per icon to remove source SVG padding. The original implementation produced non-square viewBoxes (e.g., `16×2` for a minus sign), and `width`/`height` were hardcoded to `24×24`. This mismatch caused swiftdraw to stretch icon content to fill the SF Symbol grid, distorting the original aspect ratio.

## Solution

Set `width` and `height` to match the viewBox dimensions instead of forcing `24×24`. This way swiftdraw sees a consistent aspect ratio and renders without distortion.

```javascript
// Before (broken): viewBox="4 11 16 2" width="24" height="24"
// After (correct):  viewBox="4 11 16 2" width="16" height="2"
```

## Key Insight

swiftdraw maps the SVG viewBox directly into the SF Symbol grid. If the viewBox and width/height have different aspect ratios, the content gets stretched. The fix is trivial: make them agree.
