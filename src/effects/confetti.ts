interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rot: number;
  vr: number;
  life: number;
  maxLife: number;
}

const COLORS = ['#E53935', '#FDD835', '#43A047', '#1E88E5', '#FB8C00', '#8b5cf6'];

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let rafId = 0;
let paused = false;

function ensureCanvas(): CanvasRenderingContext2D {
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.cssText =
      'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1000;';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
  }
  if (!ctx) throw new Error('No confetti context');
  return ctx;
}

function resizeCanvas(): void {
  if (!canvas || !ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function spawn(
  x: number,
  y: number,
  count: number,
  spread: number,
  speed: number,
): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const vel = speed * (0.5 + Math.random() * 0.5);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * vel * spread,
      vy: Math.sin(angle) * vel * spread - speed * 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 4 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 0,
      maxLife: 50 + Math.random() * 30,
    });
  }
}

function tick(): void {
  if (paused) return;
  rafId = 0;
  const c = ensureCanvas();
  const w = window.innerWidth;
  const h = window.innerHeight;
  c.clearRect(0, 0, w, h);

  particles = particles.filter((p) => {
    p.life += 1;
    p.vy += 0.18;
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.99;

    const alpha = 1 - p.life / p.maxLife;
    if (alpha <= 0) return false;

    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.rot + p.life * p.vr);
    c.globalAlpha = alpha;
    c.fillStyle = p.color;
    c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    c.restore();
    return true;
  });

  if (particles.length > 0) {
    rafId = requestAnimationFrame(tick);
  } else if (canvas) {
    c.clearRect(0, 0, w, h);
  }
}

function startLoop(): void {
  if (!rafId && !paused) rafId = requestAnimationFrame(tick);
}

export function burstAt(clientX: number, clientY: number): void {
  spawn(clientX, clientY, 28, 1, 6);
  startLoop();
}

export function burstCelebration(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  spawn(w * 0.5, h * 0.35, 80, 1.2, 8);
  spawn(w * 0.3, h * 0.2, 40, 1, 7);
  spawn(w * 0.7, h * 0.2, 40, 1, 7);
  startLoop();
}

export function setConfettiPaused(p: boolean): void {
  paused = p;
  if (p && rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  } else if (!p && particles.length > 0) {
    startLoop();
  }
}
