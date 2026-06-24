import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(process.cwd(), 'src');
const INDEX = join(process.cwd(), 'index.html');

const FORBIDDEN = [
  { pattern: /visibilitychange/g, label: 'visibilitychange event' },
  { pattern: /document\.hidden/g, label: 'document.hidden' },
  { pattern: /document\.visibilityState/g, label: 'document.visibilityState' },
  { pattern: /webkitvisibilitychange/g, label: 'webkitvisibilitychange' },
];

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (/\.(ts|tsx|js|html|css)$/.test(name)) files.push(full);
  }
  return files;
}

let failed = false;

function scanFile(path: string): void {
  const text = readFileSync(path, 'utf-8');
  for (const rule of FORBIDDEN) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(text)) {
      failed = true;
      console.error(`✗ ${path}: uses ${rule.label}`);
    }
  }
}

for (const file of walk(SRC)) scanFile(file);
scanFile(INDEX);

const html = readFileSync(INDEX, 'utf-8');
const sdkBeforeGame =
  html.indexOf('game_api') !== -1 &&
  html.indexOf('game_api') < html.indexOf('main.ts');

if (!sdkBeforeGame) {
  failed = true;
  console.error('✗ index.html: Playables SDK must load before game code');
} else {
  console.log('✓ index.html: SDK loads before game code');
}

if (!failed) console.log('✓ No Page Visibility API usage in src/');
process.exit(failed ? 1 : 0);
