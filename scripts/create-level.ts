import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const title = process.argv.slice(2).join(' ').trim();
if (!title) {
  console.error('Usage: npm run new-level -- "Butterfly Garden"');
  process.exit(1);
}

const root = process.cwd();
const levelsDir = join(root, 'levels');
const artDir = join(root, 'public', 'assets', 'levels');
const manifestPath = join(levelsDir, 'manifest.json');

interface Manifest {
  version: number;
  levels: string[];
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Manifest;
const nums = manifest.levels
  .map((id) => parseInt(id.replace('level_', ''), 10))
  .filter((n) => Number.isFinite(n));
const nextNum = (nums.length ? Math.max(...nums) : 0) + 1;
const id = `level_${String(nextNum).padStart(2, '0')}`;

if (manifest.levels.includes(id)) {
  console.error(`Level id ${id} already exists in manifest`);
  process.exit(1);
}

const templatePath = join(levelsDir, '_template.json');
const template = JSON.parse(readFileSync(templatePath, 'utf-8')) as Record<string, unknown>;
template.id = id;
template.title = title;
template.image = `assets/levels/${id}.svg`;

const jsonPath = join(levelsDir, `${id}.json`);
if (existsSync(jsonPath)) {
  console.error(`File already exists: ${jsonPath}`);
  process.exit(1);
}
writeFileSync(jsonPath, `${JSON.stringify(template, null, 2)}\n`);

const artTemplate = join(artDir, '_art_template.svg');
const artPath = join(artDir, `${id}.svg`);
copyFileSync(artTemplate, artPath);

manifest.levels.push(id);
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Created ${id}: "${title}"`);
console.log(`  JSON:  levels/${id}.json`);
console.log(`  Art:   public/assets/levels/${id}.svg  (replace with your PNG/SVG)`);
console.log(`  HD:    optional public/assets/levels/${id}_colored.png + coloredImage in JSON`);
console.log(`  Added to levels/manifest.json`);
console.log('\nNext: draw regions in JSON, run npm run validate-levels');
