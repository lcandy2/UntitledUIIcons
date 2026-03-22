import Foundation

/// A type-safe representation of an Untitled UI icon as a custom SF Symbol.
///
/// All hyphens (`-`) in icon identifiers are replaced with underscores (`_`) in Swift property names.
/// For example:
/// - `UntitledUIIcon.activity_heart` → identifier `"activity-heart"`
/// - `UntitledUIIcon.alarm_clock` → identifier `"alarm-clock"`
///
/// Usage:
///
/// ```swift
/// // SwiftUI
/// Image(untitledUI: .heart)
/// Label("Favorites", untitledUI: .heart)
///
/// // UIKit
/// let image = UIImage(untitledUI: .heart)
/// ```
public struct UntitledUIIcon: RawRepresentable, Hashable, Sendable {
    /// The raw identifier of the Untitled UI symbol, matching the asset catalog name.
    public var rawValue: String

    public init(rawValue: String) {
        self.rawValue = rawValue
    }

    internal init(identifier: String) {
        self.rawValue = identifier
    }
}
