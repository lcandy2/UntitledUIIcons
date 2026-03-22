import SwiftUI

extension Image {
    /// Creates an image from an Untitled UI SF Symbol.
    ///
    /// ```swift
    /// Image(untitledUI: .heart)
    /// ```
    public init(untitledUI symbol: UntitledUIIcon) {
        self.init(symbol.rawValue, bundle: .module)
    }
}

@available(iOS 17.0, macOS 14.0, watchOS 10.0, tvOS 17.0, visionOS 1.0, *)
extension Label where Title == Text, Icon == Image {
    /// Creates a label with an Untitled UI SF Symbol.
    ///
    /// ```swift
    /// Label("Favorites", untitledUI: .heart)
    /// ```
    public init(_ title: some StringProtocol, untitledUI symbol: UntitledUIIcon) {
        self.init(title, image: .init(name: symbol.rawValue, bundle: .module))
    }
}

#if canImport(UIKit)
import UIKit

extension UIImage {
    /// Creates an image from an Untitled UI SF Symbol.
    ///
    /// ```swift
    /// let image = UIImage(untitledUI: .heart)
    /// ```
    public convenience init?(untitledUI symbol: UntitledUIIcon) {
        self.init(named: symbol.rawValue, in: .module, compatibleWith: nil)
    }
}
#endif

#if canImport(AppKit) && !targetEnvironment(macCatalyst)
import AppKit

extension NSImage {
    /// Creates an image from an Untitled UI SF Symbol.
    ///
    /// ```swift
    /// let image = NSImage(untitledUI: .heart)
    /// ```
    public convenience init?(untitledUI symbol: UntitledUIIcon) {
        let name = NSImage.Name(symbol.rawValue)
        guard Bundle.module.image(forResource: name) != nil else { return nil }
        self.init(named: name)
    }
}
#endif
