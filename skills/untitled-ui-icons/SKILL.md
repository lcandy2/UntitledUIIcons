---
name: untitled-ui-icons
description: >
  Help users find and use Untitled UI icons as SF Symbols in Swift projects.
  Trigger when the user mentions Untitled UI icons, asks about available icons,
  wants to find an icon for a specific purpose (e.g., "I need a settings icon",
  "what heart icons are there"), or needs help using UntitledUIIcons in SwiftUI,
  UIKit, or AppKit code. Also trigger when the user asks about icon naming
  conventions or wants to browse/search icons in this package.
---

# Untitled UI Icons

This skill helps users discover and use icons from the **UntitledUIIcons** Swift Package — 1173 stroke-based [Untitled UI](https://www.npmjs.com/package/@untitledui/icons) icons converted to SF Symbols.

## Installation

The package is added via Swift Package Manager:

```
https://github.com/user/UntitledUIIcons.git
```

Requires iOS 14+ / macOS 11+ / watchOS 7+ / tvOS 14+ / visionOS 1+.

## Usage API

### SwiftUI

```swift
import UntitledUIIcons

// Image
Image(untitledUI: .heart)

// Label (iOS 17+ / macOS 14+)
Label("Favorites", untitledUI: .heart)
```

### UIKit

```swift
import UntitledUIIcons

let image = UIImage(untitledUI: .heart)
```

### AppKit

```swift
import UntitledUIIcons

let image = NSImage(untitledUI: .heart)
```

All icons are accessed as static properties on `UntitledUIIcon` — e.g., `.heart`, `.alarm_clock`, `.search_lg`.

## Icon Naming Convention

- Icon names use **snake_case** as Swift properties: `.alarm_clock_check`
- The underlying SF Symbol identifier uses **kebab-case**: `"alarm-clock-check"`
- Original Untitled UI PascalCase names map like this: `AlarmClockCheck` → `.alarm_clock_check`
- Numbered variants use a two-digit suffix: `.bar_chart01`, `.bar_chart02`

## Finding Icons

When a user asks for an icon, consult `references/icons.md` for the complete list of 1173 available icon names. Search by keyword — icons are named descriptively:

- **Arrows/navigation**: `arrow_*`, `chevron_*`, `corner_*`, `navigation_pointer*`
- **Communication**: `mail_*`, `message_*`, `phone_*`, `send_*`
- **Media**: `play*`, `pause_*`, `stop*`, `volume_*`, `music_note*`
- **Files/folders**: `file_*`, `folder_*`, `clipboard_*`
- **Users**: `user_*`, `users_*`, `face_*`
- **Charts**: `bar_chart*`, `line_chart*`, `pie_chart*`, `horizontal_bar_chart*`
- **Alerts/status**: `alert_*`, `info_*`, `help_*`, `check_*`, `x_*`
- **Weather**: `cloud_*`, `sun*`, `moon*`, `wind*`, `snowflake*`, `thermometer*`
- **Finance**: `bank*`, `coins_*`, `credit_card_*`, `currency_*`, `wallet*`
- **Shapes**: `circle`, `square`, `triangle`, `hexagon*`, `octagon`, `pentagon`, `star_*`
- **Editing**: `edit_*`, `pencil*`, `eraser`, `scissors*`, `crop*`, `brush*`
- **Settings/tools**: `settings_*`, `tool_*`, `sliders_*`, `filter_*`

When suggesting icons, always provide:
1. The Swift property name (e.g., `.heart`)
2. A brief usage example
3. Related alternatives if applicable (e.g., "also see `.heart_circle`, `.heart_hand`, `.heart_rounded`")
