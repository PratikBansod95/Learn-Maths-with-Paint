import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { LevelData } from '../src/game/types';
import { validateLevel } from './validate-levels';

const levelsDir = join(process.cwd(), 'levels');
const files = readdirSync(levelsDir).filter((f) => f.endsWith('.json'));

let hasErrors = false;

for (const file of files) {
  const raw = readFileSync(join(levelsDir, file), 'utf-8');
  const level = JSON.parse(raw) as LevelData;
  const errors = validateLevel(level);

  if (errors.length === 0) {
    console.log(`✓ ${file}`);
  } else {
    hasErrors = true;
    console.error(`✗ ${file}`);
    for (const e of errors) console.error(`  - ${e}`);
  }
}

if (hasErrors) process.exit(1);
console.log(`\nValidated ${files.length} level(s).`);
