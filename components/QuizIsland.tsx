"use client";

import { useId, useMemo, useState, useSyncExternalStore } from "react";
import type { QuizItem } from "@/lib/content";
import {
  againCount,
  emptyProgress,
  parseProgress,
  rightCount,
  serializeProgress,
  setMark,
  stepQuestion,
  type Mark,
} from "@/lib/quiz-progress";
import type { UiStrings } from "@/lib/ui";
import { getServerSnapshot, getSnapshot, saveRaw, subscribe } from "./quiz-store";

/** The pamphlet pages the six questions are printed on. */
const QUIZ_PAGES = "6–7";

/**
 * The pamphlet's six questions (p6–7), word for word. It prints answers and no wrong
 * options, so nothing is graded for you: show the answer, then say whether you had it.
 * Questions and answers come from chapter 7's frontmatter untouched; every other word
 * here is UI chrome from ui.json. Progress is kept on this device only.
 *
 * Laid out as the Quiz artboards draw it (T-053): one question at a time, the previous and next buttons, and either a
 * panel listing all six (landscape) or a row of dots (portrait and phone). Every question is in the HTML; the ones not
 * being shown are `hidden`, so the server render still carries all six.
 */
export function QuizIsland({ ui, items }: { ui: UiStrings; items: readonly QuizItem[] }) {
  const id = useId();
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const marks = useMemo(() => parseProgress(raw, items.length), [raw, items.length]);
  // Which question is shown, and which answers are open, are not saved: a reload starts at the first, answers closed.
  const [current, setCurrent] = useState(0);
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
  const markWord = (m: Mark) => (m === "right" ? ui.quizRight : m === "again" ? ui.quizAgain : ui.quizUnchecked);

  return (
    <section className="quiz">
      <div className="quiz-head">
        <h3 className="quiz-total">
          {ui.quizTotal} {items.length} {ui.quizItem}
        </h3>
        {/* Says which question is showing; a polite live region, so moving between questions is announced. */}
        <p className="quiz-progress" role="status" aria-live="polite" aria-atomic="true">
          {ui.quizItem} {current + 1} {ui.quizOf} {items.length}
        </p>
        <p role="status" aria-live="polite" aria-atomic="true" className="quiz-score" data-score={right}>
          {ui.quizScore} {right} {ui.quizOf} {items.length}
          {/* Every kind of mark changes this line, so every change is announced, not only a new right answer. */}
          {again > 0 ? ` · ${ui.quizAgain} ${again}` : ""}
        </p>
        <button type="button" className="quiz-reset" onClick={reset}>
          {ui.quizReset}
        </button>
      </div>

      <div className="quiz-dots" aria-hidden="true">
        {marks.map((m, i) => (
          <span key={i} data-mark={m ?? "none"} data-current={i === current ? "" : undefined} />
        ))}
      </div>

      <div className="quiz-cards">
        {items.map((item, i) => {
          const shown = open.has(i);
          const answerId = `${id}-a${i}`;
          return (
            <div key={item.q} className="quiz-item" data-question={i} data-mark={marks[i] ?? "none"} hidden={i !== current}>
              <p className="quiz-card-head">
                <span className="quiz-num" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="muted">
                  {ui.pamphletPages}: {QUIZ_PAGES}
                </span>
              </p>
              <p className="quiz-q" id={`${id}-q${i}`}>
                {item.q}
                {/* Text, not a generated glyph: it is read aloud and shows the state with the answer closed. */}
                {marks[i] ? <span className="quiz-state"> · {markWord(marks[i])}</span> : null}
              </p>
              <div id={answerId} hidden={!shown} className="quiz-answer">
                <p className="quiz-answer-box">
                  <span className="quiz-answer-label">{ui.quizAnswer}</span>
                  <strong className="quiz-a" lang={/^[A-Za-z0-9₂₄ -]+$/.test(item.a) ? "en" : undefined}>
                    {item.a}
                  </strong>
                </p>
                <div className="quiz-marks" role="group" aria-labelledby={`${id}-c${i} ${id}-q${i}`}>
                  <span className="quiz-check" id={`${id}-c${i}`}>
                    {ui.quizCheckSelf}
                  </span>
                  <button type="button" className="quiz-mark-right" aria-pressed={marks[i] === "right"} onClick={() => mark(i, "right")}>
                    {ui.quizRight}
                  </button>
                  <button type="button" className="quiz-mark-again" aria-pressed={marks[i] === "again"} onClick={() => mark(i, "again")}>
                    {ui.quizAgain}
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="quiz-toggle"
                aria-expanded={shown}
                aria-controls={answerId}
                onClick={() => toggle(i)}
              >
                {shown ? ui.quizHide : ui.quizShow}
              </button>
            </div>
          );
        })}
      </div>

      <div className="quiz-nav">
        <button type="button" className="quiz-prev" onClick={() => setCurrent((c) => stepQuestion(c, -1, items.length))}>
          {ui.quizPrev}
        </button>
        <button type="button" className="quiz-next" onClick={() => setCurrent((c) => stepQuestion(c, 1, items.length))}>
          {ui.quizNext}
        </button>
      </div>

      <ol className="quiz-rows">
        {items.map((item, i) => (
          <li key={item.q}>
            <button
              type="button"
              className="quiz-row"
              aria-current={i === current ? "step" : undefined}
              data-mark={marks[i] ?? "none"}
              onClick={() => setCurrent(i)}
            >
              <span className="quiz-row-num" aria-hidden="true">
                {i + 1}
              </span>
              <span className="quiz-row-q">{item.q}</span>
              <span className="quiz-row-status">{markWord(marks[i] ?? null)}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="quiz-notes">
        <p className="quiz-device">{ui.quizDeviceNote}</p>
        <p className="quiz-source">{ui.quizSourceNote}</p>
      </div>
    </section>
  );
}
