"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** A sentence that lights up word by word as a beam passes over it while scrolling. */
export function Manifesto({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.querySelectorAll<HTMLElement>("[data-w]").forEach((w) => (w.style.opacity = "1"));
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-w]",
        { opacity: 0.14 },
        {
          opacity: 1,
          stagger: 0.08,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.6 },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <p ref={ref} className="font-display text-[clamp(1.6rem,3.6vw,3.4rem)] font-light leading-[1.18] tracking-[-0.025em]">
      {text.split(" ").map((w, i) => (
        <span key={i} data-w className="inline-block whitespace-pre opacity-[0.14]">
          {w}{" "}
        </span>
      ))}
    </p>
  );
}
