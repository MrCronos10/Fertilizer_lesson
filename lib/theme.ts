/**
 * Light/dark choice (T-027). globals.css already answers to the system preference and to
 * `<html data-theme>`; this adds a remembered choice. Storage can be missing or throw (private
 * mode, blocked site data), and then the page simply follows the system.
 */
export type Theme = "light" | "dark";

export const THEME_KEY = "theme";

export const nextTheme = (theme: Theme): Theme => (theme === "dark" ? "light" : "dark");

/** Inlined in <head> so a remembered choice applies before the first paint (no flash). */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}})()`;
