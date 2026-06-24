import type { LevelData, Point, Region } from '../game/types';
import {
  easeOutBack,
  easeOutCubic,
  boundsOf,
  centroid,
  labelFontSize,
  pointInPolygon,
  tracePolygon,
} from './geometry';

const FILL_DURATION_MS = 420;
const WRONG_DURATION_MS = 720;

interface FillAnim {
  color: string;
  start: number;
  duration: number;
  resolve: () => void;
}

interface WrongAnim {
  start: number;
  duration: number;
}

interface Viewport {
  scale: number;
  offsetX: number;
  offsetY: number;
  imgW: number;
  imgH: number;
}

export class PictureCanvas {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private level: LevelData | null = null;
  private readonly completedFills = new Map<string, string>();
  private readonly fillAnims = new Map<string, FillAnim>();
  private wrongAnim: WrongAnim | null = null;
  private wrongRegionId: string | null = null;
  private hoverRegionId: string | null = null;
  private image: HTMLImageElement | null = null;
  private viewport: Viewport = { scale: 1, offsetX: 0, offsetY: 0, imgW: 512, imgH: 512 };
  private rafId = 0;
  private paused = false;
  private pauseOffset = 0;
  private pausedAt = 0;
  private interacting = false;
  private destroyed = false;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D not supported');
    this.canvas = canvas;
    this.ctx = ctx;
    this.bindResize();
    this.bindPointer();
  }

  async loadLevel(level: LevelData): Promise<void> {
    this.stopLoop();
    this.level = level;
    this.completedFills.clear();
    this.fillAnims.clear();
    this.wrongAnim = null;
    this.wrongRegionId = null;
    this.hoverRegionId = null;

    const imgW = level.imageSize?.width ?? 512;
    const imgH = level.imageSize?.height ?? 512;
    this.viewport.imgW = imgW;
    this.viewport.imgH = imgH;

    this.image = await this.loadImage(level.image).catch(() => null);
    if (this.image?.naturalWidth) {
      this.viewport.imgW = this.image.naturalWidth;
      this.viewport.imgH = this.image.naturalHeight;
    }

    this.resize();
    this.draw();
  }

  setPaused(paused: boolean): void {
    if (paused === this.paused) return;
    if (paused) {
      this.paused = true;
      this.pausedAt = performance.now();
      this.stopLoop();
    } else {
      const delta = performance.now() - this.pausedAt;
      this.pauseOffset += delta;
      for (const anim of this.fillAnims.values()) anim.start += delta;
      if (this.wrongAnim) this.wrongAnim.start += delta;
      this.paused = false;
      this.startLoop();
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.stopLoop();
    this.level = null;
    this.image = null;
  }

  isInteracting(): boolean {
    return this.interacting;
  }

  fillRegion(regionId: string, color: string): Promise<void> {
    if (this.completedFills.has(regionId)) return Promise.resolve();

    return new Promise((resolve) => {
      this.fillAnims.set(regionId, {
        color,
        start: this.now(),
        duration: FILL_DURATION_MS,
        resolve,
      });
      this.wrongRegionId = null;
      this.wrongAnim = null;
      this.interacting = true;
      this.startLoop();
    });
  }

  showWrong(regionId: string): void {
    this.wrongRegionId = regionId;
    this.wrongAnim = { start: this.now(), duration: WRONG_DURATION_MS };
    this.interacting = true;
    this.startLoop();
  }

  getRegionAt(clientX: number, clientY: number): Region | null {
    if (!this.level || this.paused) return null;
    const p = this.toImageSpace(clientX, clientY);
    for (let i = this.level.regions.length - 1; i >= 0; i--) {
      const region = this.level.regions[i];
      if (this.isRegionLocked(region.id)) continue;
      if (pointInPolygon(p, region.points)) return region;
    }
    return null;
  }

  private isRegionLocked(regionId: string): boolean {
    return this.completedFills.has(regionId) || this.fillAnims.has(regionId);
  }

  private now(): number {
    return performance.now() - this.pauseOffset;
  }

  private bindResize(): void {
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(this.canvas.parentElement ?? this.canvas);
  }

  private bindPointer(): void {
    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.level || this.interacting || this.paused) return;
      const region = this.getRegionAt(e.clientX, e.clientY);
      const next = region?.id ?? null;
      if (next !== this.hoverRegionId) {
        this.hoverRegionId = next;
        this.draw();
      }
    });

    this.canvas.addEventListener('pointerleave', () => {
      if (this.hoverRegionId) {
        this.hoverRegionId = null;
        this.draw();
      }
    });
  }

  private resize(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { imgW, imgH } = this.viewport;
    const padding = 12;
    const availW = w - padding * 2;
    const availH = h - padding * 2;
    const scale = Math.min(availW / imgW, availH / imgH);
    this.viewport.scale = scale;
    this.viewport.offsetX = (w - imgW * scale) / 2;
    this.viewport.offsetY = (h - imgH * scale) / 2;
    this.draw();
  }

  private startLoop(): void {
    if (this.paused || this.destroyed || this.rafId) return;
    const tick = () => {
      this.rafId = 0;
      if (this.paused || this.destroyed) return;

      const needsFrame = this.updateAnims();
      this.draw();
      if (needsFrame) this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private updateAnims(): boolean {
    const t = this.now();
    let needsFrame = false;

    for (const [regionId, anim] of this.fillAnims) {
      const raw = (t - anim.start) / anim.duration;
      if (raw >= 1) {
        this.completedFills.set(regionId, anim.color);
        this.fillAnims.delete(regionId);
        anim.resolve();
      } else {
        needsFrame = true;
      }
    }

    if (this.wrongAnim) {
      const raw = (t - this.wrongAnim.start) / this.wrongAnim.duration;
      if (raw >= 1) {
        this.wrongAnim = null;
        this.wrongRegionId = null;
      } else {
        needsFrame = true;
      }
    }

    if (!needsFrame) this.interacting = false;
    return needsFrame;
  }

  private fillProgress(regionId: string): number {
    const anim = this.fillAnims.get(regionId);
    if (!anim) return this.completedFills.has(regionId) ? 1 : 0;
    const raw = Math.min(1, (this.now() - anim.start) / anim.duration);
    return easeOutCubic(raw);
  }

  private fillColor(regionId: string): string | null {
    return this.fillAnims.get(regionId)?.color ?? this.completedFills.get(regionId) ?? null;
  }

  private wrongProgress(): number {
    if (!this.wrongAnim) return 0;
    return Math.min(1, (this.now() - this.wrongAnim.start) / this.wrongAnim.duration);
  }

  private draw(): void {
    const { ctx, canvas } = this;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    if (!this.level) return;

    const { scale, offsetX, offsetY, imgW, imgH } = this.viewport;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, imgW, imgH);

    for (const region of this.level.regions) {
      const color = this.fillColor(region.id);
      const progress = this.fillProgress(region.id);
      if (color && progress > 0) {
        this.drawFill(region.points, color, progress);
      }
    }

    if (this.image) {
      ctx.drawImage(this.image, 0, 0, imgW, imgH);
    } else {
      for (const region of this.level.regions) {
        if (this.isRegionLocked(region.id)) continue;
        tracePolygon(ctx, region.points);
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }

    for (const region of this.level.regions) {
      if (this.isRegionLocked(region.id)) continue;
      const isHover = region.id === this.hoverRegionId;
      const isWrong = region.id === this.wrongRegionId && this.wrongAnim;
      if (isHover || isWrong) {
        this.drawRegionOutline(region.points, isHover, !!isWrong);
      }
    }

    for (const region of this.level.regions) {
      this.drawLabel(region);
    }

    ctx.restore();
  }

  private shadeColor(hex: string, factor: number): string {
    const n = hex.replace('#', '');
    const r = Math.min(255, Math.round(parseInt(n.slice(0, 2), 16) * factor));
    const g = Math.min(255, Math.round(parseInt(n.slice(2, 4), 16) * factor));
    const b = Math.min(255, Math.round(parseInt(n.slice(4, 6), 16) * factor));
    return `rgb(${r},${g},${b})`;
  }

  private drawFill(points: Point[], color: string, progress: number): void {
    const { ctx } = this;
    const c = centroid(points);
    const b = boundsOf(points);
    const eased = easeOutBack(Math.min(1, progress));
    const radius = Math.max(b.width, b.height) * 0.58 * eased;

    ctx.save();
    tracePolygon(ctx, points);
    ctx.clip();

    const grad = ctx.createRadialGradient(c.x, c.y, radius * 0.08, c.x, c.y, radius);
    grad.addColorStop(0, color);
    grad.addColorStop(0.72, color);
    grad.addColorStop(1, this.shadeColor(color, 0.82));

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawRegionOutline(points: Point[], _hover: boolean, wrong: boolean): void {
    const { ctx } = this;
    tracePolygon(ctx, points);

    if (wrong) {
      const shake = Math.sin(this.wrongProgress() * Math.PI * 8) * (1 - this.wrongProgress()) * 6;
      ctx.save();
      ctx.translate(shake, 0);
      ctx.strokeStyle = '#E53935';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawLabel(region: Region): void {
    const { ctx } = this;
    const c = centroid(region.points);
    const filled = this.isRegionLocked(region.id);
    const fontSize = labelFontSize(region);
    const label = String(region.label);

    ctx.font = `800 ${fontSize}px Nunito, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (region.id === this.wrongRegionId && this.wrongAnim) {
      const p = this.wrongProgress();
      const xSize = fontSize * 0.55 * easeOutBack(Math.min(1, p * 2));
      ctx.strokeStyle = '#E53935';
      ctx.lineWidth = Math.max(4, fontSize * 0.14);
      ctx.beginPath();
      ctx.moveTo(c.x - xSize, c.y - xSize);
      ctx.lineTo(c.x + xSize, c.y + xSize);
      ctx.moveTo(c.x + xSize, c.y - xSize);
      ctx.lineTo(c.x - xSize, c.y + xSize);
      ctx.stroke();
    }

    ctx.lineWidth = Math.max(3, fontSize * 0.16);
    ctx.strokeStyle = filled ? 'rgba(0,0,0,0.35)' : '#ffffff';
    ctx.fillStyle = filled ? '#ffffff' : '#1f2937';
    ctx.strokeText(label, c.x, c.y);
    ctx.fillText(label, c.x, c.y);
  }

  private toImageSpace(clientX: number, clientY: number): Point {
    const rect = this.canvas.getBoundingClientRect();
    const { scale, offsetX, offsetY } = this.viewport;
    return {
      x: (clientX - rect.left - offsetX) / scale,
      y: (clientY - rect.top - offsetY) / scale,
    };
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load ${src}`));
      img.src = src;
    });
  }
}
