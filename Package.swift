// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "UntitledUIIcons",
    platforms: [
        .iOS(.v14),
        .macOS(.v11),
        .watchOS(.v7),
        .tvOS(.v14),
        .visionOS(.v1)
    ],
    products: [
        .library(
            name: "UntitledUIIcons",
            targets: ["UntitledUIIcons"]
        )
    ],
    targets: [
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
)
