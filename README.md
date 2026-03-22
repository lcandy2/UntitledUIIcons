# UntitledUIIcons

[Untitled UI Icons](https://www.npmjs.com/package/@untitledui/icons) as SF Symbols for Swift — 1173 stroke-based icons converted via [SwiftDraw](https://github.com/swhitty/SwiftDraw).

## Installation

Add via Swift Package Manager:

```
https://github.com/user/UntitledUIIcons.git
```

## Usage

### SwiftUI

```swift
import UntitledUIIcons

Image(untitledUI: .heart)
Image(untitledUI: .alarm_clock)
Label("Search", untitledUI: .search_lg)
```

### UIKit

```swift
let image = UIImage(untitledUI: .heart)
```

### AppKit

```swift
let image = NSImage(untitledUI: .heart)
```

## Regenerating Symbols

Requires [Node.js](https://nodejs.org) and [SwiftDraw](https://github.com/swhitty/SwiftDraw):

```bash
brew install swiftdraw
./update_symbols.sh
```

Or point to a local copy of the package:

```bash
node Scripts/convert.mjs --package-dir /path/to/untitledui-icons
```

## License

The conversion tooling is MIT licensed. Untitled UI Icons are subject to their own [license](https://www.npmjs.com/package/@untitledui/icons).
