"use client";

import * as React from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { cn, formatCount, formatMoney } from "@/lib/utils";

/**
 * Count-up for headline figures.
 *
 * Only animates once, when scrolled into view, and honours prefers-reduced-motion
 * by snapping straight to the value — a running total that never settles is
 * hostile to anyone who needs to read the number.
 */
export function Counter({
  value,
  format = "number",
  className,
  duration = 1.1,
  compact = true,
}: {
  value: number;
  format?: "number" | "money";
  className?: string;
  duration?: number;
  compact?: boolean;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();

  const render = React.useCallback(
    (n: number) =>
      format === "money" ? formatMoney(Math.round(n), { compact }) : formatCount(Math.round(n), compact),
    [format, compact]
  );

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (reduceMotion || !inView) {
      node.textContent = render(inView || reduceMotion ? value : 0);
      return;
    }

    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = render(latest);
      },
    });
    return () => controls.stop();
  }, [value, inView, reduceMotion, duration, render]);

  return (
    <span ref={ref} className={cn("tabular", className)}>
      {render(reduceMotion ? value : 0)}
    </span>
  );
}
