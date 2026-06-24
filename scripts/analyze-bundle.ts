import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const LIMIT_MB = 30;

interface FileEntry {
  path: string;
  bytes: number;
}

function walk(dir: string): FileEntry[] {
  const entries: FileEntry[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      entries.push(...walk(full));
    } else {
      entries.push({ path: relative(DIST, full), bytes: stat.size });
    }
  }
  return entries;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const files = walk(DIST).sort((a, b) => b.bytes - a.bytes);
const total = files.reduce((sum, f) => sum + f.bytes, 0);

console.log('Bundle analysis (dist/)\n');
console.log(`Files: ${files.length}`);
console.log(`Total: ${formatSize(total)} (${total.toLocaleString()} bytes)`);
console.log(`Limit: ${LIMIT_MB} MB\n`);

for (const file of files) {
  console.log(`  ${formatSize(file.bytes).padStart(10)}  ${file.path}`);
}

const overLimit = total > LIMIT_MB * 1024 * 1024;
console.log(overLimit ? `\n✗ Exceeds ${LIMIT_MB} MB limit` : `\n✓ Under ${LIMIT_MB} MB limit`);
process.exit(overLimit ? 1 : 0);
