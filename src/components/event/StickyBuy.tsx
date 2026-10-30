"use client";

import { useEffect, useState } from "react";

/** Phone-only purchase bar on the event page; hides while the tickets block or footer is on screen. */
export function StickyBuy({ label, price }: { label: string; price: string }) {
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    const targets = [document.getElementById("tickets"), document.querySelector("footer")].filter(Boolean) as Element[];
    const visible = new Set<Element>();
    const onScroll = () => setHidden(window.scrollY < window.innerHeight * 0.6 || visible.size > 0);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      onScroll();
    });
    targets.forEach((t) => io.observe(t));
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-[var(--line)] bg-black/85 px-[var(--gutter)] pt-3 backdrop-blur-xl transition-transform duration-500 md:hidden ${
        hidden ? "translate-y-full" : "translate-y-0"
      }`}
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))" }}
      aria-hidden={hidden}
    >
      <p className="min-w-0">
        <span className="block truncate text-sm text-dim">{label}</span>
        <span className="font-display text-lg">от {price}</span>
      </p>
      <a href="#tickets" className="btn btn-light !h-11 shrink-0" tabIndex={hidden ? -1 : 0}>
        Купить билет
      </a>
    </div>
  );
}
