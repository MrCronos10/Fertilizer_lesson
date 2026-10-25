/**
 * The performance budget (D16, T-024): one list of every route and what kind it is, shared by
 * the e2e that measures them and the unit test that stops a new route dodging the budget.
 *
 * "text" routes may load at most 180 KB of gzipped JavaScript. "3d" routes, the ones that fetch
 * three.js, may load at most 600 KB. Which kind a route is, is not a choice made here: e2e also
 * checks that three.js is present on exactly the "3d" routes.
 */
export type RouteKind = "text" | "3d";

export const TEXT_JS_BUDGET_BYTES = 180 * 1024;
export const THREE_D_JS_BUDGET_BYTES = 600 * 1024;
export const FONT_BUDGET_BYTES = 60 * 1024;

export const jsBudgetFor = (kind: RouteKind) => (kind === "3d" ? THREE_D_JS_BUDGET_BYTES : TEXT_JS_BUDGET_BYTES);

export const CHAPTER_SLUGS = ["ch01", "ch02", "ch03", "ch04", "ch05", "ch06", "ch07"] as const;

export const ROUTES: readonly { readonly path: string; readonly kind: RouteKind }[] = [
  // The home hero reuses the deficiency plant in its 3D soil block (T-027), loaded once the page is idle.
  { path: "/th", kind: "3d" },
  // Chapter 1 carries the deficiency explorer's 3D plant (T-018).
  ...CHAPTER_SLUGS.map((slug) => ({ path: `/th/${slug}`, kind: (slug === "ch01" ? "3d" : "text") as RouteKind })),
  // The deficiency explorer page (T-037) and its 3D plant (T-038).
  { path: "/th/ch01/deficiency", kind: "3d" },
  // The all-sources page (T-055).
  { path: "/th/sources", kind: "text" },
  // Internal pages, not part of the lesson but served, so held to the same budget.
  { path: "/specimen", kind: "text" },
  { path: "/specimen-3d", kind: "3d" },
  { path: "/specimen-3d-b", kind: "3d" },
];
