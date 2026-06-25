import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { LevelData } from '../src/game/types';

const MAX_ANSWER = 50;

const PALETTE = new Set([
  '#E53935',
  '#FDD835',
  '#43A047',
  '#1E88E5',
  '#FB8C00',
  '#8b5cf6',
  '#8B5CF6',
]);

export interface ValidateOptions {
  root?: string;
  artDir?: string;
}

function parseEquation(eq: string): { a: number; b: number; op: 'add' | 'sub' } | null {
  const add = eq.match(/^(\d+)\s*\+\s*(\d+)$/);
  if (add) return { a: +add[1], b: +add[2], op: 'add' };

  const sub = eq.match(/^(\d+)\s*-\s*(\d+)$/);
  if (sub) return { a: +sub[1], b: +sub[2], op: 'sub' };

  return null;
}

function computeAnswer(a: number, b: number, op: 'add' | 'sub'): number {
  return op === 'add' ? a + b : a - b;
}

function resolveArtPath(imagePath: string, artDir: string): string | null {
  const fileName = imagePath.split('/').pop() ?? imagePath;
  const path = join(artDir, fileName);
  return existsSync(path) ? path : null;
}

export function validateLevel(level: LevelData, opts: ValidateOptions = {}): string[] {
  const errors: string[] = [];
  const labels = new Set(level.regions.map((r) => r.label));
  const usedAnswers = new Set<number>();
  const regionIds = new Set<string>();

  if (level.regions.length === 0) errors.push('No regions defined');
  if (level.tasks.length === 0) errors.push('No tasks defined');

  if (level.tasks.length > level.regions.length) {
    errors.push(`More tasks (${level.tasks.length}) than regions (${level.regions.length})`);
  }

  if (level.image.startsWith('/')) {
    errors.push('image path should be relative (assets/levels/...) not absolute (/assets/...)');
  }

  if (opts.artDir && !resolveArtPath(level.image, opts.artDir)) {
    errors.push(`Art file not found for image "${level.image}"`);
  }

  if (level.coloredImage?.startsWith('/')) {
    errors.push('coloredImage path should be relative (assets/levels/...) not absolute (/assets/...)');
  }

  if (level.coloredImage && opts.artDir && !resolveArtPath(level.coloredImage, opts.artDir)) {
    errors.push(`Art file not found for coloredImage "${level.coloredImage}"`);
  }

  for (const region of level.regions) {
    if (regionIds.has(region.id)) {
      errors.push(`Duplicate region id "${region.id}"`);
    }
    regionIds.add(region.id);

    if (region.points.length < 3) {
      errors.push(`Region ${region.id}: needs at least 3 points`);
    }
  }

  for (const [i, task] of level.tasks.entries()) {
    const parsed = parseEquation(task.equation);
    if (!parsed) {
      errors.push(`Task ${i + 1}: invalid equation "${task.equation}"`);
      continue;
    }

    if (parsed.op !== task.op) {
      errors.push(`Task ${i + 1}: op mismatch (${task.op} vs ${parsed.op})`);
    }

    const answer = computeAnswer(parsed.a, parsed.b, parsed.op);
    if (answer !== task.answer) {
      errors.push(`Task ${i + 1}: answer ${task.answer} != computed ${answer}`);
    }

    if (answer < 0) errors.push(`Task ${i + 1}: negative answer ${answer}`);
    if (answer > MAX_ANSWER) errors.push(`Task ${i + 1}: answer ${answer} > ${MAX_ANSWER}`);

    if (parsed.op === 'sub' && parsed.a < parsed.b) {
      errors.push(`Task ${i + 1}: subtraction ${task.equation} has negative result`);
    }

    if (!labels.has(task.answer)) {
      errors.push(`Task ${i + 1}: no region with label ${task.answer}`);
    }

    if (usedAnswers.has(task.answer)) {
      errors.push(`Task ${i + 1}: duplicate answer ${task.answer} in level`);
    }
    usedAnswers.add(task.answer);

    const colorKey = task.color.toLowerCase();
    if (!PALETTE.has(task.color) && !PALETTE.has(colorKey)) {
      errors.push(`Task ${i + 1}: color ${task.color} not in game palette`);
    }
  }

  return errors;
}
