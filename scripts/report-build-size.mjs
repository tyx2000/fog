import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";

const root = process.cwd();
const srcDir = join(root, "src");
const distDir = join(root, "dist");

function fileSize(filePath) {
  if (!existsSync(filePath)) {
    return 0;
  }

  return statSync(filePath).size;
}

function gzipSize(filePath) {
  if (!existsSync(filePath)) {
    return 0;
  }

  const content = readFileSync(filePath);
  return gzipSync(content).byteLength;
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(2)} KB`;
}

const hookFiles = readdirSync(srcDir)
  .filter((name) => /^use[A-Za-z0-9]+\.ts$/.test(name))
  .sort();

const rows = hookFiles.map((name) => {
  const hookName = name.replace(/\.ts$/, "");
  const before = fileSize(join(srcDir, name));
  const esmFile = join(distDir, `${hookName}.js`);
  const after = fileSize(esmFile);
  const afterGzip = gzipSize(esmFile);
  const delta = after - before;

  return {
    hookName,
    before,
    after,
    afterGzip,
    delta
  };
});

const totals = rows.reduce(
  (acc, row) => {
    acc.before += row.before;
    acc.after += row.after;
    acc.afterGzip += row.afterGzip;
    acc.delta += row.delta;
    return acc;
  },
  { before: 0, after: 0, afterGzip: 0, delta: 0 }
);

const tableRows = rows.map((row) => {
  const deltaPrefix = row.delta > 0 ? "+" : "";
  return {
    file: row.hookName,
    src: formatBytes(row.before),
    dist: formatBytes(row.after),
    gzip: formatBytes(row.afterGzip),
    delta: `${deltaPrefix}${formatBytes(row.delta)}`
  };
});

const totalDeltaPrefix = totals.delta > 0 ? "+" : "";
const totalRow = {
  file: "TOTAL",
  src: formatBytes(totals.before),
  dist: formatBytes(totals.after),
  gzip: formatBytes(totals.afterGzip),
  delta: `${totalDeltaPrefix}${formatBytes(totals.delta)}`
};

const nameWidth = Math.max(
  "File".length,
  totalRow.file.length,
  ...tableRows.map((row) => row.file.length)
);
const beforeWidth = Math.max(
  "Src".length,
  totalRow.src.length,
  ...tableRows.map((row) => row.src.length)
);
const afterWidth = Math.max(
  "Dist".length,
  totalRow.dist.length,
  ...tableRows.map((row) => row.dist.length)
);
const gzipWidth = Math.max(
  "Dist(gzip)".length,
  totalRow.gzip.length,
  ...tableRows.map((row) => row.gzip.length)
);
const deltaWidth = Math.max(
  "Delta".length,
  totalRow.delta.length,
  ...tableRows.map((row) => row.delta.length)
);

const header =
  `${"File".padEnd(nameWidth)}  ` +
  `${"Src".padStart(beforeWidth)}  ` +
  `${"Dist".padStart(afterWidth)}  ` +
  `${"Dist(gzip)".padStart(gzipWidth)}  ` +
  `${"Delta".padStart(deltaWidth)}`;

console.log("\nBuild size comparison (src vs dist esm):");
console.log(header);
console.log("-".repeat(header.length));

tableRows.forEach((row) => {
  console.log(
    `${row.file.padEnd(nameWidth)}  ` +
      `${row.src.padStart(beforeWidth)}  ` +
      `${row.dist.padStart(afterWidth)}  ` +
      `${row.gzip.padStart(gzipWidth)}  ` +
      `${row.delta.padStart(deltaWidth)}`
  );
});
console.log("-".repeat(header.length));
console.log(
  `${totalRow.file.padEnd(nameWidth)}  ` +
    `${totalRow.src.padStart(beforeWidth)}  ` +
    `${totalRow.dist.padStart(afterWidth)}  ` +
    `${totalRow.gzip.padStart(gzipWidth)}  ` +
    `${totalRow.delta.padStart(deltaWidth)}`
);
