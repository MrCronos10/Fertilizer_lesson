"use client";

import { useState } from "react";

/**
 * Exercises the [data-theme] override path. Deliberately has no persistence —
 * remembering a theme choice belongs with the app shell (T-010), not here.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");

  function apply(next: "system" | "light" | "dark") {
    setTheme(next);
    const root = document.documentElement;
    if (next === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", next);
    }
  }

  return (
    <div role="group" aria-label="Theme" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      {(["system", "light", "dark"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => apply(option)}
          aria-pressed={theme === option}
          className={theme === option ? "primary" : undefined}
          data-testid={`theme-${option}`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
