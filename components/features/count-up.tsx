"use client";

import { useEffect, useState } from "react";

export function CountUp({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 700;
    const start = performance.now();
    const from = display;
    const delta = value - from;
    let frame = 0;

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(from + delta * (1 - (1 - progress) ** 3)));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [display, value]);

  return (
    <span>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
