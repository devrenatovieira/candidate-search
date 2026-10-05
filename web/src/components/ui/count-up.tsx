"use client";

import { useEffect, useRef, useState } from "react";
import { formatBRL, formatBRLCompact } from "@/lib/format";

export type CountFormat = "int" | "brl" | "brl-compact";

function format(n: number, kind: CountFormat): string {
  if (kind === "brl") return formatBRL(Math.round(n));
  if (kind === "brl-compact") return formatBRLCompact(n);
  return Math.round(n).toLocaleString("pt-BR");
}

/**
 * Counts from zero to `value` once, when it first scrolls into view. Server HTML already holds the
 * final figure (no layout shift, correct without JS); reduced-motion users never see the animation.
 * Money values are in centavos.
 */
export function CountUp({ value, format: kind = "int", duration = 900 }: {
  value: number;
  format?: CountFormat;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setShown(value * eased);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} title={kind === "int" ? undefined : formatBRL(value)}>
      {format(shown, kind)}
    </span>
  );
}
