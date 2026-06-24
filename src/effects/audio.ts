import { isAudioEnabled, onAudioEnabledChange } from '../sdk/playables';

class AudioManager {
  private enabled = true;
  private ctx: AudioContext | null = null;

  async init(): Promise<void> {
    this.enabled = await isAudioEnabled();
    onAudioEnabledChange((on) => {
      this.enabled = on;
      if (!on) void this.ctx?.suspend();
      else void this.ctx?.resume();
    });
  }

  private getCtx(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: OscillatorType, gain = 0.12): void {
    const ctx = this.getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  }

  playCorrect(): void {
    this.tone(523, 0.08, 'sine', 0.1);
    window.setTimeout(() => this.tone(659, 0.12, 'sine', 0.1), 70);
  }

  playWrong(): void {
    this.tone(180, 0.2, 'square', 0.06);
  }

  playWin(): void {
    [523, 659, 784, 1047].forEach((f, i) => {
      window.setTimeout(() => this.tone(f, 0.15, 'triangle', 0.1), i * 100);
    });
  }

  playLose(): void {
    this.tone(392, 0.15, 'sine', 0.08);
    window.setTimeout(() => this.tone(294, 0.25, 'sine', 0.08), 120);
  }

  suspend(): void {
    void this.ctx?.suspend();
  }

  resume(): void {
    if (this.enabled) void this.ctx?.resume();
  }
}

export const audio = new AudioManager();
