"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders `children` only once this spot is within `margin` of the viewport. The 3D plant is far
 * down chapter 1, so fetching and parsing three.js (390 KB gzipped) on arrival made Lighthouse
 * score the chapter 83 on a slow machine and cost every reader the bytes whether or not they
 * scrolled that far (T-024). Before it is near, the same-sized placeholder holds the space.
 */
export function NearViewport({
  children,
  placeholder,
  margin = "200px",
}: {
  children: ReactNode;
  placeholder: ReactNode;
  margin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // No way to tell, so load it: the lesson is complete either way.
      const t = setTimeout(() => setNear(true), 0);
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);

  return <div ref={ref}>{near ? children : placeholder}</div>;
}
