#!/bin/bash
set -euo pipefail

# Build UntitledUIIcons.xcframework for all available Apple platforms
#
# Usage:
#   ./Scripts/build-xcframework.sh [<output-dir>]
#
# Platforms without installed SDKs are skipped automatically.

OUTPUT_DIR="${1:-build}"
SCHEME="UntitledUIIcons"
FRAMEWORK_NAME="UntitledUIIcons"
XCFRAMEWORK="$FRAMEWORK_NAME.xcframework"
DERIVED_DATA="$OUTPUT_DIR/DerivedData"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

declare -a ARCHIVES=()

build_archive() {
  local platform="$1"
  local destination="$2"
  local archive="$OUTPUT_DIR/$platform.xcarchive"

  echo "Building for $platform..."
  if xcodebuild archive \
    -scheme "$SCHEME" \
    -destination "$destination" \
    -archivePath "$archive" \
    -derivedDataPath "$DERIVED_DATA" \
    -skipPackagePluginValidation \
    SKIP_INSTALL=NO \
    BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
    OTHER_SWIFT_FLAGS="-no-verify-emitted-module-interface" \
    2>&1 | tee /tmp/xc-$platform.log | tail -1; then
    ARCHIVES+=("-archive" "$archive" "-framework" "$FRAMEWORK_NAME.framework")
  else
    echo "  Skipped $platform (build failed — SDK may not be installed)"
    echo "  Last error: $(grep -E 'error:' /tmp/xc-$platform.log | tail -1)"
  fi
}

# Always available on macOS
build_archive "ios-device"       "generic/platform=iOS"
build_archive "ios-simulator"    "generic/platform=iOS Simulator"
build_archive "macos"            "generic/platform=macOS"
build_archive "mac-catalyst"     "generic/platform=macOS,variant=Mac Catalyst"

# May require additional SDK downloads
build_archive "watchos-device"    "generic/platform=watchOS"
build_archive "watchos-simulator" "generic/platform=watchOS Simulator"
build_archive "tvos-device"       "generic/platform=tvOS"
build_archive "tvos-simulator"    "generic/platform=tvOS Simulator"
build_archive "visionos-device"   "generic/platform=visionOS"
build_archive "visionos-simulator" "generic/platform=visionOS Simulator"

if [ ${#ARCHIVES[@]} -eq 0 ]; then
  echo "Error: No platforms built successfully."
  exit 1
fi

echo ""
echo "Creating XCFramework (${#ARCHIVES[@]} slices)..."
rm -rf "$OUTPUT_DIR/$XCFRAMEWORK"
xcodebuild -create-xcframework \
  "${ARCHIVES[@]}" \
  -output "$OUTPUT_DIR/$XCFRAMEWORK"

echo ""
echo "Zipping..."
ZIPFILE="$OUTPUT_DIR/$FRAMEWORK_NAME.xcframework.zip"
cd "$OUTPUT_DIR"
zip -rqy "$FRAMEWORK_NAME.xcframework.zip" "$XCFRAMEWORK"
cd - > /dev/null

CHECKSUM=$(swift package compute-checksum "$ZIPFILE")

echo ""
echo "Done!"
echo "  XCFramework: $OUTPUT_DIR/$XCFRAMEWORK"
echo "  Zip:         $ZIPFILE"
echo "  Checksum:    $CHECKSUM"
