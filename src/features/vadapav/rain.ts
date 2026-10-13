/**
 * ~70 vada pavs falling for ~3.5 s on one full-screen canvas (pointer-events none,
 * aria-hidden), removed at the end. Each pav is drawn once to a sprite, then blitted.
 */
const COUNT = 70;
const DURATION = 3500;
const FADE = 500;
const GRAVITY = 260; // px/s²

const token = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/** A vada pav: bun top and bottom, an orange patty between, and optionally a green chilli. */
const sprite = (px: number, chilli: boolean): HTMLCanvasElement => {
  const c = document.createElement("canvas");
  c.width = c.height = px;
  const g = c.getContext("2d")!;
  const s = px / 64;
  g.scale(s, s);
  const bun = token("--vp-bun", "#e2a03f");
  const bunLight = token("--vp-bun-light", "#f6cf74");
  // bottom bun
  g.fillStyle = bun;
  g.beginPath();
  g.ellipse(32, 42, 24, 8, 0, 0, Math.PI * 2);
  g.fill();
  // patty, poking out at the sides
  g.fillStyle = token("--vp-patty", "#d9661f");
  g.beginPath();
  g.ellipse(32, 36, 27, 7, 0, 0, Math.PI * 2);
  g.fill();
  // top bun: a dome with a lighter crown
  const grad = g.createLinearGradient(0, 14, 0, 36);
  grad.addColorStop(0, bunLight);
  grad.addColorStop(1, bun);
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(8, 34);
  g.bezierCurveTo(8, 12, 56, 12, 56, 34);
  g.closePath();
  g.fill();
  if (chilli) {
    g.strokeStyle = token("--vp-chilli", "#2f9e44");
    g.lineWidth = 4;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(40, 22);
    g.quadraticCurveTo(54, 18, 58, 6);
    g.stroke();
  }
  return c;
};

export function rain(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const w = window.innerWidth;
  const h = window.innerHeight;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  const sprites = [sprite(Math.round(64 * dpr), false), sprite(Math.round(64 * dpr), true)];
  const pavs = Array.from({ length: COUNT }, () => ({
    x: Math.random() * w,
    y: -40 - Math.random() * h * 0.7,
    vx: (Math.random() - 0.5) * 70,
    vy: 40 + Math.random() * 140,
    a: Math.random() * Math.PI * 2,
    va: (Math.random() - 0.5) * 5,
    size: 26 + Math.random() * 18,
    img: sprites[Math.random() < 0.4 ? 1 : 0]
  }));

  const start = performance.now();
  let prev = start;
  const end = () => canvas.remove();
  const frame = (now: number) => {
    const t = now - start;
    if (document.hidden || t > DURATION) return end();
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = t > DURATION - FADE ? (DURATION - t) / FADE : 1;
    for (const p of pavs) {
      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.a += p.va * dt;
      if (p.y - p.size > h) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.drawImage(p.img, -p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
