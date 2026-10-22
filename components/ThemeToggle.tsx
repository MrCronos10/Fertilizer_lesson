"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY, nextTheme, type Theme } from "@/lib/theme";

const DARK = "(prefers-color-scheme: dark)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DARK);
  media.addEventListener("change", onChange);
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => {
    media.removeEventListener("change", onChange);
    observer.disconnect();
  };
}

function current(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "dark" || chosen === "light") return chosen;
  return window.matchMedia(DARK).matches ? "dark" : "light";
}

/** The theme the page is showing: an explicit choice if there is one, else the system's. Null on the server. */
export function useTheme(): Theme | null {
  return useSyncExternalStore(subscribe, current, () => null);
}

/**
 * One button that flips the theme (Main.dc.html, Home-Night.dc.html). Its name says what a press
 * does, so it reads correctly in either state. The choice is remembered; THEME_SCRIPT in the root
 * layout re-applies it before the next page paints.
 */
export function ThemeToggle({ toDark, toLight }: { toDark: string; toLight: string }) {
  const theme = useTheme() ?? "light";

  function flip() {
    const next = nextTheme(theme);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage blocked: the choice lasts for this page only.
    }
  }

  return (
    <button type="button" className="theme-toggle" aria-label={theme === "dark" ? toLight : toDark} onClick={flip}>
      {/* The icon is a CSS mask, not the artboard's inline <svg>: with an <svg> inside this button,
          WebKit stopped firing `load` on 59 of 60 chapter walks (T-027, re-tested after the font
          fix); with the mask, 0 of 120. Same symptom as T-014's select. */}
      <span className={theme === "dark" ? "theme-icon theme-icon-sun" : "theme-icon theme-icon-moon"} aria-hidden="true" />
    </button>
  );
}
