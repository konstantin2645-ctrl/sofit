"use client";

/** Demo stand-in for the Leaflet map: map tiles cannot load inside the hosted demo,
    so this draws the area as a stylised radar with a link to Yandex Maps. */
import { useEffect, useRef } from "react";

export function VenueMap({ lat, lng, label, className = "" }: { lat: number; lng: number; label: string; zoom?: number; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    const draw = (t: number) => {
      const w = (c.width = c.clientWidth * devicePixelRatio);
      const h = (c.height = c.clientHeight * devicePixelRatio);
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, w, h);
      // street grid seeded from the coordinates so each place looks different
      let seed = Math.abs(Math.floor(lat * 1000) * 31 + Math.floor(lng * 1000));
      const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
      ctx.strokeStyle = "rgba(241,230,210,0.07)";
      ctx.lineWidth = devicePixelRatio;
      for (let i = 0; i < 26; i++) {
        ctx.beginPath();
        const a = rnd() * Math.PI;
        const x = rnd() * w, y = rnd() * h;
        ctx.moveTo(x - Math.cos(a) * w, y - Math.sin(a) * w);
        ctx.lineTo(x + Math.cos(a) * w, y + Math.sin(a) * w);
        ctx.lineWidth = devicePixelRatio * (rnd() < 0.2 ? 3 : 1);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(91,75,255,0.10)";
      ctx.beginPath();
      ctx.ellipse(w * (0.2 + rnd() * 0.3), h * 0.8, w * 0.5, h * 0.12, -0.2, 0, Math.PI * 2);
      ctx.fill();
      const cx = w / 2, cy = h / 2;
      for (let k = 0; k < 3; k++) {
        const p = ((t / 2200 + k / 3) % 1);
        ctx.strokeStyle = `rgba(255,197,110,${0.5 * (1 - p)})`;
        ctx.beginPath();
        ctx.arc(cx, cy, p * Math.min(w, h) * 0.45, 0, Math.PI * 2);
        ctx.stroke();
      }
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40 * devicePixelRatio);
      g.addColorStop(0, "rgba(255,197,110,0.6)");
      g.addColorStop(1, "rgba(255,197,110,0)");
      ctx.fillStyle = g;
      ctx.fillRect(cx - 60 * devicePixelRatio, cy - 60 * devicePixelRatio, 120 * devicePixelRatio, 120 * devicePixelRatio);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx, cy, 4 * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [lat, lng]);
  return (
    <div className={`relative overflow-hidden rounded-sm border border-[var(--line)] ${className}`}>
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" role="img" aria-label={`Схема: ${label}`} />
      <div className="absolute left-4 top-4 rounded-md bg-black/70 px-3 py-2 text-sm backdrop-blur">
        <p className="text-paper">{label}</p>
        <p className="text-xs tabular-nums text-dim">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </p>
      </div>
      <a
        href={`https://yandex.ru/maps/?pt=${lng},${lat}&z=16&l=map`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-light absolute bottom-4 left-4 z-10 !h-10 !px-4 text-sm"
      >
        Открыть на карте
      </a>
    </div>
  );
}
