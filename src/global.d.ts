/** YouTube Playables SDK — minimal typings for V1 */
interface YtGameEngagement {
  onPause(callback: () => void): void;
  onResume(callback: () => void): void;
}

interface YtGameAudio {
  isAudioEnabled(): Promise<boolean>;
  onAudioEnabledChange(callback: (enabled: boolean) => void): void;
}

interface YtGameGame {
  firstFrameReady(): void;
  gameReady(): void;
  loadData(): Promise<string | null>;
  saveData(data: string): Promise<void>;
}

interface YtGame {
  IN_PLAYABLES_ENV: boolean;
  SDK_VERSION: string;
  engagement: YtGameEngagement;
  audio: YtGameAudio;
  game: YtGameGame;
}

declare const ytgame: YtGame | undefined;
