import { useRef, useEffect } from "react";

/* ── helpers ──────────────────────────────────────────────────────────────── */
function drawBar(ctx, data, W, H) {
  if (!data.length) return;
  const max    = Math.max(...data.map((d) => d.value), 1);
  const pad    = { top: 20, bottom: 40, left: 40, right: 16 };
  const bW     = (W - pad.left - pad.right) / data.length;
  const gap    = bW * 0.25;

  ctx.clearRect(0, 0, W, H);

  data.forEach((item, i) => {
    const barH  = ((item.value / max) * (H - pad.top - pad.bottom)) || 2;
    const x     = pad.left + i * bW + gap / 2;
    const y     = H - pad.bottom - barH;
    const bWNet = bW - gap;

    // Bar gradient
    const grad = ctx.createLinearGradient(x, y, x, H - pad.bottom);
    grad.addColorStop(0,   "rgba(79,142,247,0.9)");
    grad.addColorStop(1,   "rgba(79,142,247,0.2)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, bWNet, barH, [4, 4, 0, 0]);
    ctx.fill();

    // Value label
    ctx.fillStyle = "rgba(230,237,243,0.6)";
    ctx.font      = `500 11px Inter, sans-serif`;
    ctx.textAlign = "center";
    if (item.value > 0) ctx.fillText(item.value, x + bWNet / 2, y - 6);

    // X-axis label
    ctx.fillStyle = "rgba(139,148,158,0.8)";
    ctx.font      = `500 10px Inter, sans-serif`;
    ctx.fillText(item.label, x + bWNet / 2, H - pad.bottom + 16);
  });

  // Y-axis line
  ctx.strokeStyle = "rgba(30,39,54,1)";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(pad.left - 4, pad.top);
  ctx.lineTo(pad.left - 4, H - pad.bottom);
  ctx.stroke();
}

function drawDonut(ctx, data, W, H) {
  if (!data.length) return;
  const total  = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx     = W / 2;
  const cy     = H / 2;
  const r      = Math.min(cx, cy) - 32;
  const inner  = r * 0.58;
  const COLORS = ["#4F8EF7","#F59E0B","#22C55E","#EF4444","#A855F7","#EC4899","#06B6D4"];

  ctx.clearRect(0, 0, W, H);

  let angle = -Math.PI / 2;
  data.forEach((item, i) => {
    const slice = (item.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();
    angle += slice;
  });

  // Donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fillStyle = "var(--bg-card, #0D1117)";
  ctx.fill();

  // Center text
  ctx.fillStyle  = "rgba(230,237,243,0.9)";
  ctx.font       = `700 18px Inter, sans-serif`;
  ctx.textAlign  = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(total, cx, cy - 8);
  ctx.fillStyle  = "rgba(139,148,158,0.7)";
  ctx.font       = `500 10px Inter, sans-serif`;
  ctx.fillText("Total", cx, cy + 10);

  // Legend
  const legendX = cx - r;
  let legendY   = H - 24;
  ctx.textBaseline = "alphabetic";
  data.slice(0, 4).forEach((item, i) => {
    const lx = legendX + i * (r * 0.6);
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fillRect(lx, legendY - 8, 10, 10);
    ctx.fillStyle = "rgba(139,148,158,0.8)";
    ctx.font      = `500 9px Inter, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(`${item.label}`, lx + 14, legendY);
  });
}

/* ── Component ────────────────────────────────────────────────────────────── */
export default function Chart({ data = [], type = "bar" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W   = canvas.offsetWidth  || 600;
    const H   = canvas.offsetHeight || 260;
    canvas.width  = W * window.devicePixelRatio;
    canvas.height = H * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    if (type === "bar")    drawBar(ctx, data, W, H);
    if (type === "donut")  drawDonut(ctx, data, W, H);
  }, [data, type]);

  return <canvas ref={canvasRef} className="chart-canvas" />;
}
