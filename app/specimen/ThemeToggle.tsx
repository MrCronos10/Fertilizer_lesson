"use client";

import { useState } from "react";

const OPTIONS = ["system", "light", "dark"] as const;
type Choice = (typeof OPTIONS)[number];

/**
 * Exercises the [data-theme] override path. Deliberately has no persistence —
 * remembering a theme choice belongs with the app shell (T-010), not here.
 *
 * Native radios rather than a group of toggle buttons: these are mutually
 * exclusive, and radios bring correct roles and arrow-key navigation without
 * us reimplementing either.
 */
export function ThemeToggle() {
  const [choice, setChoice] = useState<Choice>("system");

  function apply(next: Choice) {
    setChoice(next);
    const root = document.documentElement;
    if (next === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", next);
    }
  }

  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
      {/* lang="en" throughout: without it VoiceOver reads these English words
          with a Thai voice, since the document is lang="th". */}
      <legend className="muted" lang="en" style={{ padding: 0, marginBottom: "0.5rem" }}>
        Theme
      </legend>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {OPTIONS.map((option) => {
          const selected = choice === option;
          return (
            <label
              key={option}
              lang="en"
              data-testid={`theme-${option}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: "var(--tap)",
                padding: "0 1rem",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius)",
                background: selected ? "var(--brand)" : "var(--panel)",
                color: selected ? "var(--brand-ink)" : "inherit",
                fontWeight: selected ? 600 : 400,
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="theme"
                value={option}
                checked={selected}
                onChange={() => apply(option)}
                style={{ marginInlineEnd: "0.5rem" }}
              />
              {option}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
