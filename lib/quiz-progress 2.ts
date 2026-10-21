/**
 * Quiz progress (T-021). The source gives six questions and their answers, with no
 * wrong options, so the quiz is a self-check: reveal the answer, then say whether you
 * had it. That mark is all that is stored, per question, on this device only.
 *
 * Everything here is pure: the browser storage lives in `components/quiz-store.ts`, so
 * what a corrupt or foreign saved value can do is testable without a browser.
 */
export type Mark = "right" | "again" | null;

export const STORAGE_KEY = "fertilizer-quiz-v1";

export function emptyProgress(total: number): Mark[] {
  return Array.from({ length: total }, () => null);
}

/** Anything unreadable (not JSON, wrong shape, wrong length, wrong version) is an empty start, never an error. */
export function parseProgress(raw: string | null | undefined, total: number): Mark[] {
  if (!raw) return emptyProgress(total);
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return emptyProgress(total);
    const { v, marks } = parsed as { v?: unknown; marks?: unknown };
    if (v !== 1 || !Array.isArray(marks) || marks.length !== total) return emptyProgress(total);
    return marks.map((m): Mark => (m === "right" || m === "again" ? m : null));
  } catch {
    return emptyProgress(total);
  }
}

export function serializeProgress(marks: readonly Mark[]): string {
  return JSON.stringify({ v: 1, marks });
}

export function setMark(marks: readonly Mark[], index: number, mark: Mark): Mark[] {
  if (!Number.isInteger(index) || index < 0 || index >= marks.length) return [...marks];
  return marks.map((m, i) => (i === index ? mark : m));
}

export function rightCount(marks: readonly Mark[]): number {
  return marks.filter((m) => m === "right").length;
}

export function againCount(marks: readonly Mark[]): number {
  return marks.filter((m) => m === "again").length;
}
