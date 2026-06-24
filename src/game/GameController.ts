import type { LevelData, Region, Task } from './types';

export type TapRejectReason = 'no_color' | 'already_filled' | 'miss';

export type TapEvaluation =
  | { kind: 'reject'; reason: TapRejectReason }
  | { kind: 'wrong'; regionId: string }
  | { kind: 'correct'; regionId: string; color: string };

export type LevelOutcome = 'playing' | 'complete' | 'failed';

export interface GameControllerState {
  levelId: string;
  taskIndex: number;
  lives: number;
  wrongTaps: number;
  selectedColor: string | null;
  filledCount: number;
  totalTasks: number;
  outcome: LevelOutcome;
  stars: number;
}

const MAX_LIVES = 3;

export class GameController {
  private readonly level: LevelData;
  private taskIndex = 0;
  private lives = MAX_LIVES;
  private wrongTaps = 0;
  private selectedColor: string | null = null;
  private readonly filledRegionIds = new Set<string>();
  private outcome: LevelOutcome = 'playing';

  constructor(level: LevelData) {
    this.level = level;
    this.syncTaskColor();
  }

  getLevel(): LevelData {
    return this.level;
  }

  getState(): GameControllerState {
    return {
      levelId: this.level.id,
      taskIndex: this.taskIndex,
      lives: this.lives,
      wrongTaps: this.wrongTaps,
      selectedColor: this.selectedColor,
      filledCount: this.filledRegionIds.size,
      totalTasks: this.level.tasks.length,
      outcome: this.outcome,
      stars: this.calcStars(),
    };
  }

  currentTask(): Task | null {
    if (this.outcome !== 'playing') return null;
    return this.level.tasks[this.taskIndex] ?? null;
  }

  isRegionFilled(regionId: string): boolean {
    return this.filledRegionIds.has(regionId);
  }

  selectColor(color: string): void {
    if (this.outcome !== 'playing') return;
    this.selectedColor = color;
  }

  syncTaskColor(): void {
    const task = this.currentTask();
    if (task) this.selectedColor = task.color;
  }

  evaluateTap(region: Region | null): TapEvaluation {
    if (this.outcome !== 'playing') {
      return { kind: 'reject', reason: 'miss' };
    }

    const task = this.currentTask();
    if (!task) return { kind: 'reject', reason: 'miss' };

    if (!region) return { kind: 'reject', reason: 'miss' };

    if (!this.selectedColor) {
      return { kind: 'reject', reason: 'no_color' };
    }

    if (this.filledRegionIds.has(region.id)) {
      return { kind: 'reject', reason: 'already_filled' };
    }

    const correct = region.label === task.answer && this.selectedColor === task.color;
    if (correct) {
      return { kind: 'correct', regionId: region.id, color: task.color };
    }

    return { kind: 'wrong', regionId: region.id };
  }

  /** Call after fill animation completes. */
  applyCorrect(regionId: string): LevelOutcome {
    this.filledRegionIds.add(regionId);
    this.taskIndex += 1;

    if (this.taskIndex >= this.level.tasks.length) {
      this.outcome = 'complete';
      return 'complete';
    }

    this.syncTaskColor();
    return 'playing';
  }

  applyWrong(): LevelOutcome {
    this.wrongTaps += 1;
    this.lives -= 1;

    if (this.lives <= 0) {
      this.outcome = 'failed';
      return 'failed';
    }

    return 'playing';
  }

  calcStars(): number {
    if (this.wrongTaps === 0) return 3;
    if (this.wrongTaps <= 2) return 2;
    return 1;
  }

  reset(): void {
    this.taskIndex = 0;
    this.lives = MAX_LIVES;
    this.wrongTaps = 0;
    this.filledRegionIds.clear();
    this.outcome = 'playing';
    this.syncTaskColor();
  }
}

export function calcStars(wrongTaps: number): number {
  if (wrongTaps === 0) return 3;
  if (wrongTaps <= 2) return 2;
  return 1;
}
