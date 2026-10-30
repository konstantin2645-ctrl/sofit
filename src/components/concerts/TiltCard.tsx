"use client";

import { useRef } from "react";

/** Subtle 3D tilt that follows the pointer; the gel glow tracks the same point. */
export function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current!;
    const b = el.getBoundingClientRect();
    const x = (e.clientX - b.left) / b.width;
    const y = (e.clientY - b.top) / b.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(900px) rotateY(${(x - 0.5) * 7}deg) rotateX(${(0.5 - y) * 7}deg) translateZ(0)`;
      el.style.setProperty("--px", `${x * 100}%`);
      el.style.setProperty("--py", `${y * 100}%`);
    });
  };
  const reset = () => {
    cancelAnimationFrame(frame.current);
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className="transition-transform duration-500 ease-[var(--ease-stage)] will-change-transform motion-reduce:!transform-none"
    >
      {children}
    </div>
  );
}
