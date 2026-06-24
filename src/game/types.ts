export type MathOp = 'add' | 'sub';

export interface Point {
  x: number;
  y: number;
}

export interface Region {
  id: string;
  label: number;
  points: Point[];
}

export interface Task {
  equation: string;
  op: MathOp;
  answer: number;
  color: string;
}

export interface LevelData {
  id: string;
  title: string;
  image: string;
  imageSize?: { width: number; height: number };
  regions: Region[];
  tasks: Task[];
}

export interface SaveData {
  version: number;
  highestUnlockedLevel: number;
  levelStars: Record<string, number>;
  hintSeen: boolean;
}

export const DEFAULT_SAVE: SaveData = {
  version: 1,
  highestUnlockedLevel: 1,
  levelStars: {},
  hintSeen: false,
};

export type AppScreen = 'loading' | 'title' | 'playing' | 'complete' | 'failed';

export interface GameSession {
  levelId: string;
  taskIndex: number;
  lives: number;
  wrongTaps: number;
  selectedColor: string | null;
  filledRegionIds: Set<string>;
  wrongRegionId: string | null;
}

export const PALETTE_COLORS = [
  '#E53935',
  '#FDD835',
  '#43A047',
  '#1E88E5',
  '#FB8C00',
] as const;
