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
import { createRequire } from "node:module";

const ROOT = resolve(import.meta.dirname, "..");

// Install svg-path-bbox for accurate path bounding box computation
try {
  createRequire(import.meta.url)("svg-path-bbox");
} catch {
  console.log("Installing svg-path-bbox...");
  execSync("npm install --no-save svg-path-bbox", { cwd: ROOT, stdio: "pipe" });
}
const { svgPathBbox } = await import("svg-path-bbox");

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

// ---------------------------------------------------------------------------
// SVG extraction from React components
// ---------------------------------------------------------------------------

/** Compute combined bounding box of all path elements using svg-path-bbox. */
function computeBBox(elements) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const el of elements) {
    const d = el.attrs?.d;
    if (!d) continue;
    try {
      const [x1, y1, x2, y2] = svgPathBbox(d);
      minX = Math.min(minX, x1);
      minY = Math.min(minY, y1);
      maxX = Math.max(maxX, x2);
      maxY = Math.max(maxY, y2);
    } catch { /* skip unparseable paths */ }
  }
  return isFinite(minX) ? { minX, minY, maxX, maxY } : null;
}

/** Build processed (tight viewBox) and original (24×24) SVG pair from elements. */
function buildSVGPair(elements) {
  if (elements.length === 0) return null;

  const STROKE_WIDTH = 2;
  const bbox = computeBBox(elements);
  let vbW = 24, vbH = 24;
  let vb = "0 0 24 24";
  if (bbox) {
    const pad = STROKE_WIDTH / 2;
    const x = bbox.minX - pad;
    const y = bbox.minY - pad;
    vbW = bbox.maxX - bbox.minX + STROKE_WIDTH;
    vbH = bbox.maxY - bbox.minY + STROKE_WIDTH;
    vb = `${x} ${y} ${vbW} ${vbH}`;
  }

  let children = "";
  for (const el of elements) {
    const attrStr = Object.entries(el.attrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(" ");
    children += `  <${el.tag} ${attrStr}/>\n`;
  }

  const svgAttrs = `fill="none" stroke="black" stroke-width="${STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round"`;
  const processed = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${vbW}" height="${vbH}" ${svgAttrs}>\n${children}</svg>\n`;
  const original = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" ${svgAttrs}>\n${children}</svg>\n`;
  return { processed, original };
}

/** Extract SVG from a React component (.mjs) file. */
function extractSVG(mjsContent) {
  const childPattern = /createElement\("(\w+)",\s*\{([^}]*)\}\)/g;
  const elements = [];
  let match;

  while ((match = childPattern.exec(mjsContent)) !== null) {
    const tag = match[1];
    if (tag === "svg") continue;

    const attrsStr = match[2];
    const attrs = {};
    for (const am of attrsStr.matchAll(/(\w+):\s*"([^"]*)"/g)) {
      const key = am[1];
      const value = am[2];
      const svgKey = JSX_TO_SVG_ATTRS[key] || key;
      attrs[svgKey] = value;
    }
    elements.push({ tag, attrs });
  }

  return buildSVGPair(elements);
}

/** Parse a raw SVG file (e.g. from Overrides/) into the same pair format. */
function parseSVGFile(svgContent) {
  const elements = [];
  const tagPattern = /<(path|circle|ellipse|rect|line|polyline|polygon)\s([^>]*?)\/>/g;
  let match;
  while ((match = tagPattern.exec(svgContent)) !== null) {
    const tag = match[1];
    const attrs = {};
    for (const am of match[2].matchAll(/([\w-]+)="([^"]*)"/g)) {
      attrs[am[1]] = am[2];
    }
    elements.push({ tag, attrs });
  }
  return buildSVGPair(elements);
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
// HTML gallery page generation
// ---------------------------------------------------------------------------

function generateHTMLPage(iconNames, outPath) {
  const json = JSON.stringify(iconNames);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Untitled UI Icons</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fafafa;color:#111}
.header{position:sticky;top:0;background:#fff;border-bottom:1px solid #e5e5e5;padding:16px 24px;z-index:10}
.header h1{font-size:20px;font-weight:600;margin-bottom:12px}
.toolbar{display:flex;align-items:center;gap:12px}
.toolbar input{flex:1;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;outline:none}
.toolbar input:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.1)}
.count{font-size:13px;color:#6b7280;white-space:nowrap}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:8px;padding:24px}
.card{background:#fff;border:1px solid #e5e5e5;border-radius:10px;padding:14px 8px 10px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;transition:border-color .15s,box-shadow .15s}
.card:hover{border-color:#6366f1;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.card img{width:28px;height:28px}
.card .name{font-size:10px;color:#6b7280;text-align:center;word-break:break-all;line-height:1.3}
.actions{display:none;gap:4px;margin-top:2px}
.card:hover .actions{display:flex}
.actions a{font-size:10px;padding:2px 8px;border-radius:4px;text-decoration:none;color:#6366f1;background:#eef2ff;font-weight:500}
.actions a:hover{background:#6366f1;color:#fff}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:8px 16px;border-radius:8px;font-size:13px;opacity:0;transition:opacity .2s;pointer-events:none}
.toast.show{opacity:1}
</style>
</head>
<body>
<div class="header">
  <h1>Untitled UI Icons</h1>
  <div class="toolbar">
    <input type="text" id="q" placeholder="Search icons\u2026" autofocus>
    <span class="count" id="count"></span>
  </div>
</div>
<div class="grid" id="grid"></div>
<div class="toast" id="toast"></div>
<script>
const icons=${json};
const grid=document.getElementById("grid");
const q=document.getElementById("q");
const countEl=document.getElementById("count");
const toastEl=document.getElementById("toast");
let tid;
function render(f){
  const list=f?icons.filter(n=>n.includes(f)):icons;
  countEl.textContent=list.length+" / "+icons.length;
  grid.innerHTML=list.map(n=>'<div class="card" onclick="copy(\\''+n+'\\')">'+
    '<img src="SVGs/processed/'+n+'.svg" loading="lazy" alt="'+n+'">'+
    '<div class="name">'+n+'</div>'+
    '<div class="actions">'+
    '<a href="SVGs/original/'+n+'.svg" download="'+n+'.svg" onclick="event.stopPropagation()">SVG</a>'+
    '<a href="SVGs/processed/'+n+'.svg" download="'+n+'.trimmed.svg" onclick="event.stopPropagation()">Trimmed</a>'+
    '<a href="Symbols/'+n+'.svg" download="'+n+'.sfsymbol.svg" onclick="event.stopPropagation()">SF\u00a0Symbol</a>'+
    '</div></div>').join("");
}
function copy(n){
  navigator.clipboard.writeText(n);
  toastEl.textContent="Copied \\u201c"+n+"\\u201d";
  toastEl.classList.add("show");
  clearTimeout(tid);
  tid=setTimeout(()=>toastEl.classList.remove("show"),1500);
}
q.addEventListener("input",e=>render(e.target.value.toLowerCase()));
render("");
</script>
</body>
</html>
`;
  writeFileSync(outPath, html);
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
  const result = extractSVG(content);
  if (!result) {
    console.log(`  Skipped (no SVG): ${pascalName}`);
    continue;
  }

  const kebabName = pascalToKebab(pascalName);
  const svgPath = join(extractedDir, `${kebabName}.svg`);
  writeFileSync(svgPath, result.processed);
  icons.push({ pascalName, kebabName, svgPath, originalSvg: result.original });
}

console.log(`  Extracted ${icons.length} SVGs`);

// Step 1.5: Apply overrides from Overrides/ directory
const overridesDir = join(ROOT, "Overrides");
if (existsSync(overridesDir)) {
  const overrideFiles = readdirSync(overridesDir).filter((f) => f.endsWith(".svg"));
  let applied = 0;
  for (const file of overrideFiles) {
    const kebabName = basename(file, ".svg");
    const svgContent = readFileSync(join(overridesDir, file), "utf-8");
    const result = parseSVGFile(svgContent);
    if (!result) {
      console.log(`  Override skipped (no paths): ${kebabName}`);
      continue;
    }

    const svgPath = join(extractedDir, `${kebabName}.svg`);
    writeFileSync(svgPath, result.processed);

    const idx = icons.findIndex((i) => i.kebabName === kebabName);
    if (idx >= 0) {
      icons[idx].svgPath = svgPath;
      icons[idx].originalSvg = result.original;
    } else {
      icons.push({ pascalName: kebabName, kebabName, svgPath, originalSvg: result.original });
    }
    applied++;
  }
  if (applied > 0) console.log(`  Applied ${applied} override(s)`);
}

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

// Step 5: Save extracted SVGs for web preview / download
console.log("Saving extracted SVGs...");
const svgsDir = join(ROOT, "SVGs");
rmSync(svgsDir, { recursive: true, force: true });
const svgsOriginalDir = join(svgsDir, "original");
const svgsProcessedDir = join(svgsDir, "processed");
mkdirSync(svgsOriginalDir, { recursive: true });
mkdirSync(svgsProcessedDir, { recursive: true });

for (const icon of icons) {
  if (convertedNames.includes(icon.kebabName)) {
    copyFileSync(icon.svgPath, join(svgsProcessedDir, `${icon.kebabName}.svg`));
    writeFileSync(join(svgsOriginalDir, `${icon.kebabName}.svg`), icon.originalSvg);
  }
}

// Step 6: Generate HTML gallery page
console.log("Generating HTML gallery...");
const htmlPath = join(ROOT, "index.html");
generateHTMLPage(convertedNames, htmlPath);

// Cleanup
rmSync(extractedDir, { recursive: true, force: true });
rmSync(join(ROOT, ".tmp-untitledui"), { recursive: true, force: true });

console.log();
console.log(`Done! Converted ${total} symbols (${failed} failed)`);
console.log(`  Symbols: ${symbolsDir}/`);
console.log(`  SVGs:    ${svgsDir}/`);
console.log(`  Assets:  ${xcassetsDir}/`);
console.log(`  Swift:   ${swiftOutPath}`);
console.log(`  HTML:    ${htmlPath}`);
