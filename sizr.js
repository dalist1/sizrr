#!/usr/bin/env bun

function getDirSize(dirPath) {
  let size = 0;
  const files = Bun.fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = `${dirPath}/${file}`;
    const stats = Bun.fs.statSync(filePath);

    if (stats.isFile()) {
      size += stats.size;
    } else if (stats.isDirectory()) {
      size += getDirSize(filePath);
    }
  }

  return size;
}

function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

const packageJson = Bun.file('package.json').json();
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

console.log("Package Sizes:");
console.log("======================================");

let totalSize = 0;

for (const [pkg, version] of Object.entries(dependencies)) {
  const pkgPath = `node_modules/${pkg}`;
  const size = getDirSize(pkgPath);
  totalSize += size;

  const humanSize = formatSize(size);
  let color = '';

  if (size < 1024 * 1024) {
    color = '\x1b[32m'; // Green for small packages
  } else if (size < 10 * 1024 * 1024) {
    color = '\x1b[33m'; // Yellow for medium packages
  } else {
    color = '\x1b[31m'; // Red for large packages
  }

  console.log(`${color}${pkg.padEnd(30)} ${humanSize.padStart(10)}\x1b[0m`);
}

console.log("======================================");
console.log(`\x1b[1mTotal size:\x1b[0m ${formatSize(totalSize)}`);