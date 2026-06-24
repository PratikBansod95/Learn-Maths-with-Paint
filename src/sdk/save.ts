import { DEFAULT_SAVE, type SaveData } from '../game/types';
import { getLevelCount } from '../game/levels';

export function normalizeSaveData(raw: unknown): SaveData {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SAVE };

  const data = raw as Partial<SaveData>;
  const maxLevel = getLevelCount();

  let highest = Number(data.highestUnlockedLevel);
  if (!Number.isFinite(highest) || highest < 1) highest = 1;
  if (highest > maxLevel + 1) highest = maxLevel + 1;

  const levelStars: Record<string, number> = {};
  if (data.levelStars && typeof data.levelStars === 'object') {
    for (const [id, value] of Object.entries(data.levelStars)) {
      const stars = Number(value);
      if (stars >= 1 && stars <= 3) levelStars[id] = Math.floor(stars);
    }
  }

  return {
    version: 1,
    highestUnlockedLevel: highest,
    levelStars,
    hintSeen: Boolean(data.hintSeen),
  };
}
