import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { LevelData } from '../src/game/types';
import { validateLevel } from './validate-levels';

const root = process.cwd();
const levelsDir = join(root, 'levels');
const artDir = join(root, 'public', 'assets', 'levels');
const manifestPath = join(levelsDir, 'manifest.json');

interface Manifest {
  version: number;
  levels: string[];
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Manifest;
const manifestSet = new Set(manifest.levels);

let hasErrors = false;
let validated = 0;

for (const id of manifest.levels) {
  const file = `${id}.json`;
  const jsonPath = join(levelsDir, file);
  if (!existsSync(jsonPath)) {
    hasErrors = true;
    console.error(`✗ ${file} — listed in manifest but file missing`);
    continue;
  }

  const level = JSON.parse(readFileSync(jsonPath, 'utf-8')) as LevelData;
  const errors = validateLevel(level, { artDir, root });

  if (level.id !== id) {
    errors.push(`id "${level.id}" does not match filename ${id}`);
  }

  if (errors.length === 0) {
    console.log(`✓ ${file} — ${level.title}`);
    validated += 1;
  } else {
    hasErrors = true;
    console.error(`✗ ${file} — ${level.title}`);
    for (const e of errors) console.error(`  - ${e}`);
  }
}

for (const orphan of listOrphanLevelFiles(levelsDir, manifestSet)) {
  console.warn(`⚠ orphan file levels/${orphan} (not in manifest.json)`);
}

if (hasErrors) process.exit(1);
console.log(`\nValidated ${validated} level(s) from manifest.`);

function listOrphanLevelFiles(dir: string, manifestSet: Set<string>): string[] {
  return readdirSync(dir)
    .filter((f) => /^level_\d+\.json$/.test(f))
    .filter((f) => !manifestSet.has(f.replace('.json', '')));
}
