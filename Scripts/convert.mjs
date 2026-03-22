#!/usr/bin/env node

// Untitled UI Icons → SF Symbol converter
//
// Pipeline:
//   1. Extract SVGs from @untitledui/icons React components
//   2. Convert SVGs to SF Symbol format via swiftdraw
//   3. Generate .xcassets asset catalog
//   4. Generate UntitledUIIcon+All.swift with static properties
//
// Usage:
//   node Scripts/convert.mjs [--package-dir <path>] [--output <path>] [--symbols <path>]

import { execFileSync, execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync, copyFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { parseArgs } from "node:util";

const ROOT = resolve(import.meta.dirname, "..");

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const { values: opts } = parseArgs({
  options: {
    "package-dir": { type: "string", default: "" },
    output: { type: "string", default: join(ROOT, "Sources", "UntitledUIIcons") },
    symbols: { type: "string", default: join(ROOT, "Symbols") },
  },
  strict: false,
});

const outputDir = opts.output;
const symbolsDir = opts.symbols;

// ---------------------------------------------------------------------------
// Obtain the npm package
// ---------------------------------------------------------------------------

function getPackageDir() {
  if (opts["package-dir"]) return opts["package-dir"];

  // Download via npm pack
  const tmpDir = join(ROOT, ".tmp-untitledui");
  rmSync(tmpDir, { recursive: true, force: true });
  mkdirSync(tmpDir, { recursive: true });

  console.log("Downloading @untitledui/icons...");
  execSync("npm pack @untitledui/icons", { cwd: tmpDir, stdio: "pipe" });

  const tgz = readdirSync(tmpDir).find((f) => f.endsWith(".tgz"));
  if (!tgz) {
    console.error("Error: Failed to download @untitledui/icons");
    process.exit(1);
  }

  execSync(`tar xzf "${tgz}"`, { cwd: tmpDir, stdio: "pipe" });
  return join(tmpDir, "package");
}

// ---------------------------------------------------------------------------
// SVG extraction from React components
// ---------------------------------------------------------------------------

const JSX_TO_SVG_ATTRS = {
  strokeWidth: "stroke-width",
  strokeLinecap: "stroke-linecap",
  strokeLinejoin: "stroke-linejoin",
  strokeDasharray: "stroke-dasharray",
  strokeDashoffset: "stroke-dashoffset",
  strokeMiterlimit: "stroke-miterlimit",
  strokeOpacity: "stroke-opacity",
  fillRule: "fill-rule",
  fillOpacity: "fill-opacity",
  clipRule: "clip-rule",
  clipPath: "clip-path",
};

function extractSVG(mjsContent) {
  // Match all createElement calls for child elements (path, circle, etc.)
  // Pattern: createElement("tag", {attrs})
  const childPattern = /createElement\("(\w+)",\s*\{([^}]*)\}\)/g;
  const elements = [];
  let match;

  while ((match = childPattern.exec(mjsContent)) !== null) {
    const tag = match[1];
    if (tag === "svg") continue; // skip the root svg

    const attrsStr = match[2];
    const attrs = {};

    // Parse attribute key-value pairs from the minified object literal
    // Handles: key:"value", key:"value with spaces", and unquoted keys
    for (const am of attrsStr.matchAll(/(\w+):\s*"([^"]*)"/g)) {
      const key = am[1];
      const value = am[2];
      const svgKey = JSX_TO_SVG_ATTRS[key] || key;
      attrs[svgKey] = value;
    }

    elements.push({ tag, attrs });
  }

  if (elements.length === 0) return null;

  // Build SVG string
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n`;

  for (const el of elements) {
    const attrStr = Object.entries(el.attrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(" ");
    svg += `  <${el.tag} ${attrStr}/>\n`;
  }

  svg += `</svg>\n`;
  return svg;
}

// ---------------------------------------------------------------------------
// Naming conventions
// ---------------------------------------------------------------------------

function pascalToKebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

function toSwiftName(kebab) {
  return kebab.replace(/-/g, "_");
}

const SWIFT_KEYWORDS = new Set([
  "as", "break", "case", "catch", "class", "continue", "default", "defer",
  "deinit", "do", "else", "enum", "extension", "fallthrough", "false",
  "fileprivate", "for", "func", "guard", "if", "import", "in", "init",
  "inout", "internal", "is", "let", "nil", "open", "operator", "override",
  "private", "precedencegroup", "protocol", "public", "repeat", "rethrows",
  "return", "self", "Self", "static", "struct", "subscript", "super",
  "switch", "throw", "throws", "true", "try", "typealias", "var", "where",
  "while",
]);

function escapeIfKeyword(name) {
  return SWIFT_KEYWORDS.has(name) ? `\`${name}\`` : name;
}

// ---------------------------------------------------------------------------
// SVG conversion via swiftdraw
// ---------------------------------------------------------------------------

let swiftdrawBin = "swiftdraw";

function convertSVG(inputSvg, outputSvg) {
  const args = [inputSvg, "--format", "sfsymbol", "--insets", "0,0,0,0", "--size", "medium", "--output", outputSvg];
  try {
    execFileSync(swiftdrawBin, args, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Asset catalog generation
// ---------------------------------------------------------------------------

function createSymbolset(xcassetsDir, symbolName, svgSource) {
  const setDir = join(xcassetsDir, `${symbolName}.symbolset`);
  mkdirSync(setDir, { recursive: true });
  copyFileSync(svgSource, join(setDir, `${symbolName}.svg`));
  writeFileSync(
    join(setDir, "Contents.json"),
    JSON.stringify(
      {
        info: { author: "xcode", version: 1 },
        symbols: [{ filename: `${symbolName}.svg`, idiom: "universal" }],
      },
      null,
      2
    )
  );
}

// ---------------------------------------------------------------------------
// Swift codegen
// ---------------------------------------------------------------------------

function generateSwiftProperty(identifier, swiftName) {
  return [
    `\t/// \`${identifier}\``,
    `\tstatic public let ${escapeIfKeyword(swiftName)} = UntitledUIIcon(identifier: "${identifier}")`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const packageDir = getPackageDir();
const distDir = join(packageDir, "dist");

if (!existsSync(distDir)) {
  console.error(`Error: dist directory not found at ${distDir}`);
  process.exit(1);
}

// Resolve swiftdraw full path
try {
  swiftdrawBin = execSync("which swiftdraw", { encoding: "utf-8" }).trim();
} catch {
  console.error("Error: swiftdraw not found. Install with: brew install swiftdraw");
  process.exit(1);
}

// Step 1: Extract SVGs from React components
console.log("Extracting SVGs from React components...");
const extractedDir = join(ROOT, ".tmp-extracted-svgs");
rmSync(extractedDir, { recursive: true, force: true });
mkdirSync(extractedDir, { recursive: true });

const mjsFiles = readdirSync(distDir).filter(
  (f) => f.endsWith(".mjs") && f !== "index.mjs"
);

const icons = [];
for (const file of mjsFiles) {
  const pascalName = basename(file, ".mjs");
  const content = readFileSync(join(distDir, file), "utf-8");
  const svg = extractSVG(content);
  if (!svg) {
    console.log(`  Skipped (no SVG): ${pascalName}`);
    continue;
  }

  const kebabName = pascalToKebab(pascalName);
  const svgPath = join(extractedDir, `${kebabName}.svg`);
  writeFileSync(svgPath, svg);
  icons.push({ pascalName, kebabName, svgPath });
}

console.log(`  Extracted ${icons.length} SVGs`);

// Step 2: Prepare output directories
const xcassetsDir = join(outputDir, "Resources", "UntitledUIIcons.xcassets");
const swiftOutPath = join(outputDir, "UntitledUIIcon+All.swift");

rmSync(symbolsDir, { recursive: true, force: true });
rmSync(xcassetsDir, { recursive: true, force: true });
mkdirSync(symbolsDir, { recursive: true });
mkdirSync(xcassetsDir, { recursive: true });

writeFileSync(
  join(xcassetsDir, "Contents.json"),
  JSON.stringify({ info: { author: "xcode", version: 1 } }, null, 2)
);

// Step 3: Convert SVGs via SwiftDraw
console.log("Converting SVGs to SF Symbols...");
let total = 0;
let failed = 0;
const convertedNames = [];

for (const icon of icons) {
  const outFile = join(symbolsDir, `${icon.kebabName}.svg`);

  if (convertSVG(icon.svgPath, outFile)) {
    createSymbolset(xcassetsDir, icon.kebabName, outFile);
    convertedNames.push(icon.kebabName);
    total++;
  } else {
    console.log(`  Failed: ${icon.kebabName}`);
    failed++;
  }
}

// Step 4: Generate Swift source
console.log("Generating Swift source...");

const properties = convertedNames.map((name) =>
  generateSwiftProperty(name, toSwiftName(name))
);

const swift = `//
//  UntitledUIIcon+All.swift
//
//  Automatically generated by UntitledUIIcons.
//  Do not edit directly!
//  swift-format-ignore-file

import Foundation

extension UntitledUIIcon {
${properties.join("\n\n")}
}
`;

writeFileSync(swiftOutPath, swift);

// Cleanup
rmSync(extractedDir, { recursive: true, force: true });
rmSync(join(ROOT, ".tmp-untitledui"), { recursive: true, force: true });

console.log();
console.log(`Done! Converted ${total} symbols (${failed} failed)`);
console.log(`  Symbols: ${symbolsDir}/`);
console.log(`  Assets:  ${xcassetsDir}/`);
console.log(`  Swift:   ${swiftOutPath}`);
