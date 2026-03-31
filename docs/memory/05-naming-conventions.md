# Naming Conventions

## Icon Variants

State variants use **dot notation**: `{icon}.{state}`

```
lock03.svg              ← base icon
lock03.filled.svg       ← filled variant
lock-unlocked03.filled.svg
```

This mirrors Apple SF Symbols naming (e.g., `lock.fill`, `lock.open.fill`).

## Name Mappings

| Context | Format | Example |
|---------|--------|---------|
| File name | kebab + dot | `lock03.filled.svg` |
| Asset identifier | kebab + dot | `lock03.filled` |
| Swift property | underscores | `lock03_filled` |

## Implementation

- `toSwiftName()` converts both `-` and `.` to `_`
- The asset identifier preserves the original kebab+dot name for SF Symbol lookup
- `escapeIfKeyword()` wraps Swift keywords in backticks
