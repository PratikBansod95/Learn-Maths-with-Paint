import type { SaveData } from '../game/types';
import { normalizeSaveData } from './save';

const LOAD_DATA_TIMEOUT_MS = 1500;

let loadCompleted = false;

function isPlayablesEnv(): boolean {
  return typeof ytgame !== 'undefined' && ytgame.IN_PLAYABLES_ENV;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('loadData timeout')), ms);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        window.clearTimeout(timer);
        reject(err);
      });
  });
}

export function isSaveReady(): boolean {
  return loadCompleted;
}

export async function notifyFirstFrameReady(): Promise<void> {
  if (isPlayablesEnv()) {
    ytgame!.game.firstFrameReady();
  }
}

export async function notifyGameReady(): Promise<void> {
  if (isPlayablesEnv()) {
    ytgame!.game.gameReady();
  }
}

export async function loadSaveData(): Promise<SaveData> {
  let raw: string | null = null;

  if (!isPlayablesEnv()) {
    raw = localStorage.getItem('lmwp_save');
  } else {
    try {
      raw = await withTimeout(ytgame!.game.loadData(), LOAD_DATA_TIMEOUT_MS);
    } catch {
      raw = null;
    }
  }

  loadCompleted = true;

  if (!raw) return normalizeSaveData(null);

  try {
    return normalizeSaveData(JSON.parse(raw) as unknown);
  } catch {
    return normalizeSaveData(null);
  }
}

export async function persistSaveData(data: SaveData): Promise<void> {
  if (!loadCompleted) return;

  const serialized = JSON.stringify(data);
  if (!isPlayablesEnv()) {
    localStorage.setItem('lmwp_save', serialized);
    return;
  }
  await ytgame!.game.saveData(serialized);
}

export function onPause(callback: () => void): void {
  if (isPlayablesEnv()) {
    ytgame!.engagement.onPause(callback);
  }
}

export function onResume(callback: () => void): void {
  if (isPlayablesEnv()) {
    ytgame!.engagement.onResume(callback);
  }
}

export async function isAudioEnabled(): Promise<boolean> {
  if (!isPlayablesEnv()) return true;
  return ytgame!.audio.isAudioEnabled();
}

export function onAudioEnabledChange(callback: (enabled: boolean) => void): void {
  if (isPlayablesEnv()) {
    ytgame!.audio.onAudioEnabledChange(callback);
  }
}

export function isInPlayablesEnv(): boolean {
  return isPlayablesEnv();
}
