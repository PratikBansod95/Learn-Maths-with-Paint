import type { LevelData } from './types';
import { PALETTE_COLORS } from './types';

/** All paint colors for a level (base palette + any task-only colors). */
export function getPaletteColors(level: LevelData): string[] {
  const colors = new Set<string>(PALETTE_COLORS);
  for (const task of level.tasks) colors.add(task.color);
  return [...colors];
}
