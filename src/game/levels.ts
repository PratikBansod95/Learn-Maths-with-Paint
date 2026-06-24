import type { LevelData } from './types';
import level01 from '../../levels/level_01.json';
import level02 from '../../levels/level_02.json';
import level03 from '../../levels/level_03.json';
import level04 from '../../levels/level_04.json';
import level05 from '../../levels/level_05.json';

export const LEVELS: LevelData[] = [
  level01 as LevelData,
  level02 as LevelData,
  level03 as LevelData,
  level04 as LevelData,
  level05 as LevelData,
];

export function getLevel(index: number): LevelData | undefined {
  return LEVELS[index];
}

export function getLevelCount(): number {
  return LEVELS.length;
}

export function getLevelIndexById(id: string): number {
  return LEVELS.findIndex((l) => l.id === id);
}
