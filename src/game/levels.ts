import type { LevelData } from './types';
import manifest from '../../levels/manifest.json';

const levelModules = import.meta.glob('../../levels/level_*.json', {
  eager: true,
}) as Record<string, { default: LevelData }>;

function loadLevels(): LevelData[] {
  const byId = new Map<string, LevelData>();

  for (const mod of Object.values(levelModules)) {
    const level = mod.default;
    byId.set(level.id, level);
  }

  return manifest.levels.map((id) => {
    const level = byId.get(id);
    if (!level) {
      throw new Error(`Level "${id}" listed in manifest.json but no levels/${id}.json found`);
    }
    return level;
  });
}

export const LEVELS: LevelData[] = loadLevels();

export function getLevel(index: number): LevelData | undefined {
  return LEVELS[index];
}

export function getLevelCount(): number {
  return LEVELS.length;
}

export function getLevelIndexById(id: string): number {
  return LEVELS.findIndex((l) => l.id === id);
}

export function getLevelIds(): string[] {
  return manifest.levels;
}
