"use client";

import { useId, useMemo, useState, useSyncExternalStore } from "react";
import type { QuizItem } from "@/lib/content";
import { againCount, emptyProgress, parseProgress, rightCount, serializeProgress, setMark, type Mark } from "@/lib/quiz-progress";
import type { UiStrings } from "@/lib/ui";
import { getServerSnapshot, getSnapshot, saveRaw, subscribe } from "./quiz-store";

/**
 * The pamphlet's six questions (p6–7), word for word. It prints answers and no wrong
 * options, so nothing is graded for you: show the answer, then say whether you had it.
 * Questions and answers come from chapter 7's frontmatter untouched; every other word
 * here is UI chrome from ui.json. Progress is kept on this device only.
 */
export function QuizIsland({ ui, items }: { ui: UiStrings; items: readonly QuizItem[] }) {
  const id = useId();
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const marks = useMemo(() => parseProgress(raw, items.length), [raw, items.length]);
  // Which answers are open is not saved: a reload starts with them closed.
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set());

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  const mark = (i: number, m: Mark) => saveRaw(serializeProgress(setMark(marks, i, marks[i] === m ? null : m)));
  const reset = () => {
    // Written over, not removed: if removing is refused but writing is not, an old copy cannot come back.
    saveRaw(serializeProgress(emptyProgress(items.length)));
    setOpen(new Set());
  };

  const right = rightCount(marks);
  const again = againCount(marks);

  return (
    <section className="quiz">
      <ol className="quiz-list">
        {items.map((item, i) => {
          const shown = open.has(i);
          const answerId = `${id}-a${i}`;
          return (
            <li key={item.q} className="quiz-item" data-question={i} data-mark={marks[i] ?? "none"}>
              <div className="quiz-body">
              <p className="quiz-q" id={`${id}-q${i}`}>
                {item.q}
                {/* Text, not a generated glyph: it is read aloud and shows the state with the answer closed. */}
                {marks[i] ? <span className="quiz-state"> · {marks[i] === "right" ? ui.quizRight : ui.quizAgain}</span> : null}
              </p>
              <button
                type="button"
                className="quiz-toggle"
                aria-expanded={shown}
                aria-controls={answerId}
                onClick={() => toggle(i)}
              >
                {shown ? ui.quizHide : ui.quizShow}
              </button>
              <div id={answerId} hidden={!shown} className="quiz-answer">
                <p>
                  <span className="muted">{ui.quizAnswer}: </span>
                  <strong className="quiz-a" lang={/^[A-Za-z0-9₂₄ -]+$/.test(item.a) ? "en" : undefined}>
                    {item.a}
                  </strong>
                </p>
                <div className="quiz-marks" role="group" aria-labelledby={`${id}-q${i}`}>
                  <button type="button" aria-pressed={marks[i] === "right"} onClick={() => mark(i, "right")}>
                    {ui.quizRight}
                  </button>
                  <button type="button" aria-pressed={marks[i] === "again"} onClick={() => mark(i, "again")}>
                    {ui.quizAgain}
                  </button>
                </div>
              </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="quiz-footer">
        <p role="status" aria-live="polite" aria-atomic="true" className="quiz-score" data-score={right}>
          {ui.quizScore} {right} {ui.quizOf} {items.length}
          {/* Every kind of mark changes this line, so every change is announced, not only a new right answer. */}
          {again > 0 ? ` · ${ui.quizAgain} ${again}` : ""}
        </p>
        <button type="button" onClick={reset}>
          {ui.quizReset}
        </button>
      </div>
    </section>
  );
}
