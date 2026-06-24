import type { AppScreen, SaveData } from '../game/types';
import { PALETTE_COLORS } from '../game/types';
import { GameController, calcStars } from '../game/GameController';
import { getLevel, getLevelCount } from '../game/levels';
import { PictureCanvas } from '../canvas/PictureCanvas';
import { audio } from '../effects/audio';
import { burstAt, burstCelebration, setConfettiPaused } from '../effects/confetti';
import {
  loadSaveData,
  notifyFirstFrameReady,
  notifyGameReady,
  onPause,
  onResume,
  persistSaveData,
} from '../sdk/playables';
import { bindHowItWorks, howItWorksHtml } from './HowItWorksOverlay';

export class App {
  private readonly root: HTMLElement;
  private save: SaveData = {
    version: 1,
    highestUnlockedLevel: 1,
    levelStars: {},
    hintSeen: false,
  };
  private screen: AppScreen = 'loading';
  private game: GameController | null = null;
  private levelIndex = 0;
  private picture: PictureCanvas | null = null;
  private paused = false;
  private toastTimer = 0;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  async start(): Promise<void> {
    this.renderLoading();
    await notifyFirstFrameReady();
    await audio.init();

    const saved = await loadSaveData();
    this.save = saved;

    onPause(() => {
      this.paused = true;
      this.root.classList.add('is-paused');
      this.picture?.setPaused(true);
      setConfettiPaused(true);
      audio.suspend();
      window.clearTimeout(this.toastTimer);
      this.persist();
    });
    onResume(() => {
      this.paused = false;
      this.root.classList.remove('is-paused');
      this.picture?.setPaused(false);
      setConfettiPaused(false);
      audio.resume();
    });

    this.screen = 'title';
    this.render();
    await notifyGameReady();
  }

  private persist(): void {
    void persistSaveData(this.save);
  }

  private disposeCanvas(): void {
    this.picture?.destroy();
    this.picture = null;
  }

  private startLevel(index: number): void {
    const level = getLevel(index);
    if (!level) return;

    this.disposeCanvas();
    this.levelIndex = index;
    this.game = new GameController(level);
    this.screen = 'playing';
    this.render();
    void this.initCanvas().then(() => this.maybeShowHowItWorks());
  }

  private maybeShowHowItWorks(): void {
    if (this.save.hintSeen || this.screen !== 'playing') return;
    const play = this.root.querySelector('.screen--play');
    if (!play || this.root.querySelector('#how-overlay')) return;

    play.insertAdjacentHTML('beforeend', howItWorksHtml());
    bindHowItWorks(this.root, () => {
      this.save.hintSeen = true;
      this.persist();
    });
  }

  private startPlayFlow(): void {
    const count = getLevelCount();
    if (this.save.highestUnlockedLevel > count) {
      this.startLevel(0);
      return;
    }
    const idx = Math.min(this.save.highestUnlockedLevel - 1, count - 1);
    this.startLevel(Math.max(0, idx));
  }

  private async initCanvas(): Promise<void> {
    const canvas = this.root.querySelector<HTMLCanvasElement>('#picture-canvas');
    const level = this.game?.getLevel();
    if (!canvas || !level) return;
    this.picture = new PictureCanvas(canvas);
    await this.picture.loadLevel(level);
  }

  private onPalettePick(color: string): void {
    if (!this.game || this.paused) return;
    this.game.selectColor(color);
    this.renderPlayingShell();
  }

  private async onCanvasTap(e: PointerEvent): Promise<void> {
    if (!this.game || !this.picture || this.paused) return;
    if (this.picture.isInteracting()) return;

    const region = this.picture.getRegionAt(e.clientX, e.clientY);
    const result = this.game.evaluateTap(region);

    if (result.kind === 'reject') {
      if (result.reason === 'no_color') this.showToast('Pick a color first!');
      return;
    }

    if (result.kind === 'wrong') {
      this.picture.showWrong(result.regionId);
      const livesBefore = this.game.getState().lives;
      const outcome = this.game.applyWrong();
      audio.playWrong();

      if (outcome === 'failed') {
        audio.playLose();
        this.disposeCanvas();
        this.screen = 'failed';
        this.render();
        return;
      }

      this.showToast("Oops! That's not correct.");
      this.renderPlayingShell();
      this.animateLifeLost(livesBefore);
      return;
    }

    await this.picture.fillRegion(result.regionId, result.color);
    const outcome = this.game.applyCorrect(result.regionId);
    audio.playCorrect();
    burstAt(e.clientX, e.clientY);

    if (outcome === 'complete') {
      const state = this.game.getState();
      this.save.levelStars[state.levelId] = Math.max(
        this.save.levelStars[state.levelId] ?? 0,
        state.stars,
      );
      const nextUnlock = this.levelIndex + 2;
      this.save.highestUnlockedLevel = Math.max(this.save.highestUnlockedLevel, nextUnlock);
      this.persist();
      this.disposeCanvas();
      this.screen = 'complete';
      this.render();
      audio.playWin();
      burstCelebration();
      return;
    }

    this.renderPlayingShell();
    this.animateTaskAdvance();
  }

  private animateLifeLost(livesBefore: number): void {
    const hearts = this.root.querySelectorAll('.heart');
    const lostIndex = livesBefore - 1;
    const heart = hearts[lostIndex];
    if (!heart) return;
    heart.classList.add('heart--lost');
    window.setTimeout(() => heart.classList.remove('heart--lost'), 500);
  }

  private animateTaskAdvance(): void {
    const panel = this.root.querySelector('.equation-panel');
    const badge = this.root.querySelector('.progress-badge');
    panel?.classList.remove('equation-panel--pop');
    badge?.classList.remove('progress-badge--pop');
    void (panel as HTMLElement | null)?.offsetWidth;
    panel?.classList.add('equation-panel--pop');
    badge?.classList.add('progress-badge--pop');
  }

  private showToast(message: string): void {
    const el = this.root.querySelector('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('visible');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => el.classList.remove('visible'), 2000);
  }

  private render(): void {
    if (this.screen !== 'playing') {
      this.disposeCanvas();
    }

    switch (this.screen) {
      case 'loading':
        this.renderLoading();
        break;
      case 'title':
        this.renderTitle();
        break;
      case 'playing':
        this.renderPlayingShell();
        break;
      case 'complete':
        this.renderComplete();
        break;
      case 'failed':
        this.renderFailed();
        break;
    }
  }

  private renderLoading(): void {
    this.root.innerHTML = `
      <div class="screen screen--loading screen-enter">
        <div class="loader-card">
          <div class="loader-spinner"></div>
          <h1>Learn Maths with Paint</h1>
          <p>Loading…</p>
        </div>
      </div>`;
  }

  private renderTitle(): void {
    const unlocked = Math.min(this.save.highestUnlockedLevel, getLevelCount());
    this.root.innerHTML = `
      <div class="screen screen--title screen-enter">
        <div class="title-card">
          <h1>Learn Maths with Paint</h1>
          <p class="subtitle">Solve &amp; color the matching numbers!</p>
          <button class="btn btn--primary" id="btn-play">Play</button>
          <p class="level-unlock">Levels unlocked: ${unlocked}/${getLevelCount()}</p>
          <p class="publisher">By Learn Maths with Paint</p>
        </div>
      </div>`;

    this.root.querySelector('#btn-play')?.addEventListener('click', () => this.startPlayFlow());
  }

  private renderPlayingShell(): void {
    const game = this.game;
    if (!game) return;

    const state = game.getState();
    const task = game.currentTask();
    const level = game.getLevel();

    const hearts = [0, 1, 2]
      .map((i) => `<span class="heart ${i < state.lives ? 'heart--full' : 'heart--empty'}">♥</span>`)
      .join('');

    const palette = PALETTE_COLORS.map(
      (c) => `
        <button
          class="palette-swatch ${state.selectedColor === c ? 'palette-swatch--selected' : ''}"
          style="--swatch:${c}"
          data-color="${c}"
          aria-label="Color ${c}"
        ></button>`,
    ).join('');

    const wasPlaying = this.root.querySelector('#picture-canvas');

    if (!wasPlaying) {
      this.root.innerHTML = `
        <div class="screen screen--play screen-enter">
          <header class="play-header">
            <button class="btn-icon btn-home" id="btn-home" aria-label="Home">⌂</button>
            <div class="lives">${hearts}</div>
            <div class="progress-badge">${state.filledCount}/${state.totalTasks}</div>
          </header>

          <section class="equation-panel">
            <div class="equation-row">
              <span class="equation">${task?.equation ?? ''} = ?</span>
              <span class="equation-swatch" style="background:${task?.color ?? '#ccc'}"></span>
            </div>
            <p class="hint">Solve and color the area with the answer!</p>
          </section>

          <p class="level-title">${level.title}</p>

          <div class="canvas-wrap">
            <canvas id="picture-canvas"></canvas>
          </div>

          <div class="palette">${palette}</div>
          <div id="toast" class="toast" role="status"></div>
        </div>`;

      this.root.querySelector('#btn-home')?.addEventListener('click', () => {
        this.screen = 'title';
        this.game = null;
        this.render();
      });

      this.root.querySelectorAll('.palette-swatch').forEach((btn) => {
        btn.addEventListener('click', () => {
          const color = (btn as HTMLElement).dataset.color;
          if (color) this.onPalettePick(color);
        });
      });

      const canvas = this.root.querySelector<HTMLCanvasElement>('#picture-canvas');
      canvas?.addEventListener('pointerdown', (e) => {
        void this.onCanvasTap(e);
      });

      void this.initCanvas();
    } else {
      const livesEl = this.root.querySelector('.lives');
      const progressEl = this.root.querySelector('.progress-badge');
      const equationEl = this.root.querySelector('.equation');
      const swatchEl = this.root.querySelector<HTMLElement>('.equation-swatch');

      if (livesEl) livesEl.innerHTML = hearts;
      if (progressEl) progressEl.textContent = `${state.filledCount}/${state.totalTasks}`;
      if (equationEl && task) equationEl.textContent = `${task.equation} = ?`;
      if (swatchEl && task) swatchEl.style.background = task.color;

      this.root.querySelectorAll('.palette-swatch').forEach((btn) => {
        const color = (btn as HTMLElement).dataset.color ?? '';
        btn.classList.toggle('palette-swatch--selected', color === state.selectedColor);
      });
    }
  }

  private renderComplete(): void {
    const state = this.game?.getState();
    const stars = state?.stars ?? calcStars(0);
    const hasNext = this.levelIndex + 1 < getLevelCount();

    this.root.innerHTML = `
      <div class="screen screen--overlay screen-enter">
        <div class="overlay-card overlay-card--win screen-enter">
          <div class="win-banner">LEVEL COMPLETE!</div>
          <div class="stars stars--animated">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
          <p class="mascot mascot--bounce">🐱</p>
          <p class="win-summary">${state?.filledCount ?? 0}/${state?.totalTasks ?? 0} colored</p>
          <div class="overlay-actions">
            <button class="btn btn--ghost" id="btn-home">Home</button>
            ${
              hasNext
                ? '<button class="btn btn--primary" id="btn-next">Next level →</button>'
                : '<button class="btn btn--primary" id="btn-replay">Play again</button>'
            }
          </div>
        </div>
      </div>`;

    this.root.querySelector('#btn-home')?.addEventListener('click', () => {
      this.game = null;
      this.screen = 'title';
      this.render();
    });

    this.root.querySelector('#btn-next')?.addEventListener('click', () => {
      this.startLevel(this.levelIndex + 1);
    });

    this.root.querySelector('#btn-replay')?.addEventListener('click', () => {
      this.startLevel(this.levelIndex);
    });
  }

  private renderFailed(): void {
    this.root.innerHTML = `
      <div class="screen screen--overlay screen--overlay-fail screen-enter">
        <div class="overlay-card overlay-card--fail screen-enter">
          <h2>Oh no!</h2>
          <p class="fail-message">You ran out of lives.</p>
          <div class="lives lives--empty">${'♡'.repeat(3)}</div>
          <p class="mascot mascot--sad">🐶</p>
          <div class="overlay-actions">
            <button class="btn btn--ghost" id="btn-home">Home</button>
            <button class="btn btn--warn" id="btn-retry">↻ Try again</button>
          </div>
        </div>
      </div>`;

    this.root.querySelector('#btn-home')?.addEventListener('click', () => {
      this.game = null;
      this.screen = 'title';
      this.render();
    });

    this.root.querySelector('#btn-retry')?.addEventListener('click', () => {
      this.startLevel(this.levelIndex);
    });
  }
}
