// swift-tools-version: 5.9
import PackageDescription

// Set to a valid release URL + checksum to enable the binary target.
// Updated automatically by CI on each release.
let binaryTarget: Target? = nil
// Example after CI populates it:
// let binaryTarget: Target? = .binaryTarget(
//     name: "UntitledUIIconsBinary",
//     url: "https://github.com/lcandy2/UntitledUIIcons/releases/download/1.21.0/UntitledUIIcons.xcframework.zip",
//     checksum: "sha256..."
// )

var products: [Product] = [
    .library(
        name: "UntitledUIIcons",
        targets: ["UntitledUIIcons"]
    )
]

var targets: [Target] = [
    .target(
        name: "UntitledUIIcons",
        resources: [
            .process("Resources")
        ]
    ),
    .testTarget(
        name: "UntitledUIIconsTests",
        dependencies: ["UntitledUIIcons"]
    )
]

if let binaryTarget {
    products.append(
        .library(
            name: "UntitledUIIconsBinary",
            targets: [binaryTarget.name]
        )
    )
    targets.append(binaryTarget)
}

let package = Package(
    name: "UntitledUIIcons",
    platforms: [
        .iOS(.v14),
        .macOS(.v11),
        .watchOS(.v7),
        .tvOS(.v14),
        .visionOS(.v1)
    ],
    products: products,
    targets: targets
)
