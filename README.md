# UntitledUIIcons

[Untitled UI Icons](https://www.npmjs.com/package/@untitledui/icons) as SF Symbols for Swift — 1173 stroke-based icons converted via [SwiftDraw](https://github.com/swhitty/SwiftDraw).

All icons are available as type-safe Swift properties with full support for SwiftUI, UIKit, and AppKit.

## Requirements

| Platform | Minimum Version |
|----------|----------------|
| iOS      | 14.0           |
| macOS    | 11.0           |
| watchOS  | 7.0            |
| tvOS     | 14.0           |
| visionOS | 1.0            |

## Installation

### Swift Package Manager

Add the package to your project in Xcode:

1. Go to **File → Add Package Dependencies...**
2. Enter the repository URL:

```
https://github.com/lcandy2/UntitledUIIcons.git
```

Or add it to your `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/lcandy2/UntitledUIIcons.git", from: "1.0.0")
]
```

Then add `"UntitledUIIcons"` to the `dependencies` of your target.

### Claude Code Skill

If you use [Claude Code](https://claude.ai/claude-code), you can install the icon discovery skill:

```bash
npx skills add lcandy2/UntitledUIIcons
```

This helps Claude find and suggest the right icons when you describe what you need.

## Usage

### SwiftUI

```swift
import UntitledUIIcons

// Image
Image(untitledUI: .heart)
Image(untitledUI: .alarm_clock)

// Label (iOS 17+ / macOS 14+)
Label("Search", untitledUI: .search_lg)
Label("Favorites", untitledUI: .heart)
```

### UIKit

```swift
import UntitledUIIcons

let heartImage = UIImage(untitledUI: .heart)
let searchImage = UIImage(untitledUI: .search_lg)
```

### AppKit

```swift
import UntitledUIIcons

let heartImage = NSImage(untitledUI: .heart)
let searchImage = NSImage(untitledUI: .search_lg)
```

## Naming Convention

Icons use **snake_case** Swift property names mapped from the original PascalCase Untitled UI names:

| Untitled UI Name | Swift Property | SF Symbol Identifier |
|-----------------|----------------|---------------------|
| `Heart`         | `.heart`       | `heart`             |
| `AlarmClock`    | `.alarm_clock` | `alarm-clock`       |
| `SearchLg`      | `.search_lg`   | `search-lg`         |
| `BarChart01`    | `.bar_chart01` | `bar-chart01`       |

## Icon Categories

The library includes 1173 icons across a wide range of categories:

| Category | Examples | Count |
|----------|----------|-------|
| Arrows & Navigation | `arrow_up`, `chevron_down`, `corner_up_right` | 100+ |
| Communication | `mail01`, `message_chat_circle`, `phone_call01` | 60+ |
| Media | `play`, `pause_circle`, `volume_max`, `music_note01` | 40+ |
| Files & Folders | `file01`, `folder`, `clipboard_check` | 70+ |
| Users | `user01`, `users_plus`, `face_smile` | 50+ |
| Charts & Data | `bar_chart01`, `line_chart_up01`, `pie_chart01` | 50+ |
| Alerts & Status | `alert_circle`, `check_circle`, `info_square` | 30+ |
| Weather | `cloud01`, `sun`, `moon01`, `snowflake01` | 30+ |
| Finance | `bank`, `coins01`, `credit_card01`, `currency_dollar` | 50+ |
| Shapes | `circle`, `square`, `triangle`, `hexagon01`, `star01` | 30+ |
| Editor | `bold01`, `italic01`, `underline01`, `strikethrough01` | 40+ |
| Development | `code01`, `terminal`, `git_branch01`, `brackets` | 20+ |
| General | `heart`, `home01`, `settings01`, `search_lg`, `bell01` | 500+ |

For the complete list of all 1173 icons, see [`UntitledUIIcon+All.swift`](Sources/UntitledUIIcons/UntitledUIIcon%2BAll.swift).

## How It Works

The conversion pipeline extracts SVG paths from the [@untitledui/icons](https://www.npmjs.com/package/@untitledui/icons) React components and converts them to SF Symbol format:

1. **Extract** — Parse SVG markup from the npm package's compiled React components
2. **Convert** — Transform each SVG to SF Symbol format via [SwiftDraw](https://github.com/swhitty/SwiftDraw) (`--format sfsymbol`)
3. **Catalog** — Generate an `.xcassets` asset catalog with `.symbolset` entries
4. **Codegen** — Generate `UntitledUIIcon+All.swift` with type-safe static properties

## Regenerating Symbols

To re-run the conversion (e.g., after an upstream update):

```bash
# Install dependencies
brew install swiftdraw

# Run conversion
./update_symbols.sh
```

Or with options:

```bash
# Point to a local copy of the npm package
node Scripts/convert.mjs --package-dir /path/to/untitledui-icons

# Custom output paths
node Scripts/convert.mjs --output Sources/UntitledUIIcons --symbols Symbols
```

## CI/CD

A GitHub Actions workflow (`.github/workflows/convert.yml`) automates updates:

- Runs weekly (Monday) and on manual dispatch
- Downloads the latest `@untitledui/icons` from npm
- Converts all icons and runs `swift build` + `swift test`
- Creates a tagged release if changes are detected

## Credits

- [Untitled UI](https://untitledui.com) — Original icon design
- [SwiftDraw](https://github.com/swhitty/SwiftDraw) — SVG to SF Symbol conversion
- [PhosphorSymbols](https://github.com/nicklama/PhosphorSymbols) — Inspiration for the conversion pipeline

## License

The conversion tooling is MIT licensed. Untitled UI Icons are subject to their own [license](https://www.npmjs.com/package/@untitledui/icons).
