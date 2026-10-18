import type { Page } from "@playwright/test";

/**
 * Records console errors and uncaught page errors for the life of the page.
 * Every route test asserts this comes back empty (T-002 onward).
 */
export function collectPageProblems(page: Page): string[] {
  const problems: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      problems.push(`console.error: ${message.text()}`);
    }
  });

  page.on("pageerror", (error) => {
    problems.push(`pageerror: ${error.message}`);
  });

  return problems;
}
