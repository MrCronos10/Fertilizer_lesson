import type { Metadata } from "next";
import { ThemeToggle } from "./ThemeToggle";

export const metadata: Metadata = {
  title: "Design system specimen",
  robots: { index: false, follow: false },
};

/**
 * Internal reference page for the design system (T-004). Not part of the
 * lesson site: it is excluded from indexing and carries no agronomic content,
 * so the Thai here is sample text rather than localized copy.
 */

const TOKENS = [
  ["--bg", "page background"],
  ["--ink", "body text"],
  ["--muted", "secondary text"],
  ["--panel", "raised surface"],
  ["--line", "borders"],
  ["--soft", "subtle fill"],
  ["--brand", "brand green"],
  ["--brand-ink", "text on brand"],
  ["--accent", "accent / focus ring"],
  ["--accent-ink", "text on accent"],
  ["--warn", "caution text"],
  ["--warn-bg", "caution fill"],
] as const;

// Each of these stacks a vowel and/or tone mark above or below the consonant —
// the cases that break when a Thai subset is incomplete or line-height is tight.
const TONE_MARK_CASES = [
  "ปุ๋ย",
  "น้ำ",
  "ผู้",
  "เปื้อน",
  "ที่",
  "กุ้ง",
  "ปุ๋ยรองพื้น",
  "ปุ๋ยแต่งหน้า",
  "ธาตุอาหารหลัก",
] as const;

export default function Specimen() {
  return (
    <main className="page" style={{ display: "grid", gap: "2rem", maxWidth: "70ch" }}>
      <header style={{ display: "grid", gap: "1rem" }}>
        <h1>ตัวอย่างแบบอักษรและสี</h1>
        <p className="muted" lang="en">
          Design system specimen. Palette and type ported from
          factory-walkthrough-th.html.
        </p>
        <ThemeToggle />
      </header>

      <section style={{ display: "grid", gap: "0.75rem" }}>
        <h2>ลำดับขนาดตัวอักษร</h2>
        {/* Appearance-only classes: the page keeps exactly one real h1. */}
        <p className="as-h1">หัวเรื่องใหญ่ — ปุ๋ยคืออะไร</p>
        <p className="as-h2">หัวเรื่องรอง — ธาตุอาหารหลัก</p>
        <p className="as-h3">หัวเรื่องย่อย — ไนโตรเจน ฟอสฟอรัส โพแทสเซียม</p>
        <p>
          พืชต้องการธาตุอาหารเพื่อการเจริญเติบโต ปุ๋ยช่วยเพิ่มธาตุอาหารให้แก่ดิน
          ตัวเลขบนกระสอบปุ๋ยบอกปริมาณธาตุอาหารที่มีอยู่ภายใน
        </p>
        <p className="muted">
          ข้อความสีรองใช้สำหรับคำอธิบายเพิ่มเติมและที่มาของข้อมูล
        </p>
      </section>

      <section style={{ display: "grid", gap: "0.75rem" }}>
        <h2>สระและวรรณยุกต์ซ้อน</h2>
        <p lang="en" className="muted">
          Stacked vowels and tone marks must not collide or lose their carrier.
        </p>
        <div
          data-testid="tone-marks"
          style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1.25rem", fontSize: "1.75rem" }}
        >
          {TONE_MARK_CASES.map((word) => (
            <span key={word}>{word}</span>
          ))}
        </div>
        <p data-testid="dotted-circle" style={{ fontSize: "1.75rem", letterSpacing: "0.15em" }}>
          ◌ุ ◌ู ◌่ ◌้ ◌๊ ◌๋ ◌ั ◌ิ ◌ี ◌ึ ◌ื
        </p>
        <p className="muted" lang="en">
          Above: U+25CC dotted circle as a mark carrier — included in the Thai
          subset range on purpose.
        </p>
      </section>

      <section style={{ display: "grid", gap: "0.75rem" }}>
        <h2>ตัวเลขและหน่วย</h2>
        <p className="num" style={{ fontSize: "1.5rem" }}>
          46-0-0 · 16-20-0 · 15-15-15
        </p>
        <p className="num">
          N–P<sub>2</sub>O<sub>5</sub>–K<sub>2</sub>O · 20–25 กก./ไร่ · 1 ไร่ = 1,600 ตร.ม.
        </p>
        <p>เลขไทย ๐ ๑ ๒ ๓ ๔ ๕ ๖ ๗ ๘ ๙</p>
      </section>

      <section style={{ display: "grid", gap: "0.75rem" }}>
        <h2>สีในระบบ</h2>
        <ul style={{ display: "grid", gap: "0.5rem", listStyle: "none", padding: 0, margin: 0 }}>
          {TOKENS.map(([token, role]) => (
            <li key={token} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span
                aria-hidden="true"
                style={{
                  width: "var(--tap)",
                  height: "var(--tap)",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--line)",
                  background: `var(${token})`,
                  flex: "0 0 auto",
                }}
              />
              <code className="num">{token}</code>
              <span className="muted">{role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ display: "grid", gap: "0.75rem" }}>
        <h2>ปุ่มและพื้นที่กดสัมผัส</h2>
        <p lang="en" className="muted">
          Every control is at least 44×44pt. Tab to one to see the focus ring.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button type="button" className="primary" data-testid="btn-primary">
            คำนวณปุ๋ย
          </button>
          <button type="button" data-testid="btn-secondary">
            ดูที่มาของข้อมูล
          </button>
        </div>
      </section>

      <section style={{ display: "grid", gap: "0.75rem" }}>
        <h2>กล่องข้อความเตือน</h2>
        <p className="note" data-testid="note">
          อัตราปุ๋ยนี้เป็นจุดเริ่มต้นเท่านั้น แนะนำให้ตรวจวิเคราะห์ดินก่อนใช้
        </p>
      </section>

      <section className="panel" style={{ display: "grid", gap: "0.5rem" }}>
        <h3>พื้นผิวยกระดับ</h3>
        <p className="muted">
          ใช้สำหรับตารางข้อมูลและกล่องแสดงผลการคำนวณ
        </p>
      </section>
    </main>
  );
}
