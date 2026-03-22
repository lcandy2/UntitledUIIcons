import Testing
@testable import UntitledUIIcons

@Test func symbolCreation() {
    let symbol = UntitledUIIcon(rawValue: "heart")
    #expect(symbol.rawValue == "heart")
}

@Test func symbolIdentifier() {
    let symbol = UntitledUIIcon(identifier: "alarm-clock")
    #expect(symbol.rawValue == "alarm-clock")
}

@Test func symbolEquality() {
    let a = UntitledUIIcon(rawValue: "heart")
    let b = UntitledUIIcon(rawValue: "heart")
    #expect(a == b)
}

#if canImport(SwiftUI)
import SwiftUI

@Test func imageInitializer() {
    let image = Image(untitledUI: .init(rawValue: "heart"))
    #expect(type(of: image) == Image.self)
}
#endif
