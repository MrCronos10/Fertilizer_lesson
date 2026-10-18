# เรียนรู้เรื่องปุ๋ย · Fertilizer Lesson

เว็บไซต์สอนพื้นฐานเรื่องปุ๋ยสำหรับผู้เริ่มต้น เนื้อหาภาษาไทย ใช้ภาพและการโต้ตอบแทนการอ่านตำรา
ตัวเลขทุกตัวบนเว็บไซต์อ้างอิงกลับไปยังหน้าของแหล่งข้อมูลต้นฉบับได้

> อัตราปุ๋ยที่แสดงบนเว็บไซต์เป็น **จุดเริ่มต้น** เท่านั้น แนะนำให้ **ตรวจวิเคราะห์ดิน** ก่อนใช้ปุ๋ยจริง

An interactive Thai-language website teaching fertilizer basics to beginners — home gardeners and
small farmers. Built so that every agronomic number on screen traces back to a cited source page.

**Status:** planning complete, implementation starting. Not yet deployed.

---

## What this is

Seven short chapters covering what fertilizer is (N–P₂O₅–K₂O), recognising nutrient deficiency by
the old-leaf / young-leaf mobility rule, fertilizer types, reading the numbers on a bag and
calculating a dose, basal fertilizer (ปุ๋ยรองพื้น) versus top dressing (ปุ๋ยแต่งหน้า), matching
fertilizer to eight crops, and safe use and storage.

Interactive, rather than illustrated: a tappable NPK bag label, a dose calculator that shows its
arithmetic, a rotatable 3D plant for exploring deficiency symptoms, a crop matcher, and a short
quiz. Two scenes use WebGL; everything else is 2D so it stays legible, accessible and testable.

Built for **iPad Safari** and **macOS Safari** first — WebKit is the reference engine, not Chrome.

## Documentation

| Document | What's in it |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Goals, audience, non-goals, v1 scope, content-integrity rules |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Every planning decision (D1–D21) with its reasoning |
| [docs/TASKS.md](docs/TASKS.md) | The ordered task list and progress |
| [docs/BACKLOG.md](docs/BACKLOG.md) | What's out of v1, and why |
| [CONTEXT.md](CONTEXT.md) | Shared vocabulary — Thai agronomic terms and domain concepts |

## Content integrity

The rules that govern this project, in short:

1. **No invented agronomy.** No fact, rate or formula appears unless it traces to a cited source page.
2. **Source authority is visible.** The original pamphlet cites 38 domains with no bibliography,
   mixing government and research sources with blogs and product labels. We build the bibliography
   it lacks, tier every domain, and show the tier. Low-tier material never becomes an actionable
   number.
3. **Oxide units only.** Everything is N–P₂O₅–K₂O as printed on bags. No elemental conversion
   exists in the code — mixing the two is wrong by roughly 2.3× for phosphorus.
4. **Thai is cleaned, never reworded.** Extraction fixes whitespace and units; awkward phrasing is
   flagged for human review rather than silently rewritten.
5. **Rates are starting points.** Every rate shown carries the soil-test note.

Full detail in [docs/PRD.md §7](docs/PRD.md).

## Source material

The source PDFs and images are **deliberately not in this repository**. They are third-party
copyrighted works that we quote and cite but have no right to redistribute. The citation trail —
which file and which page each extraction came from — lives in `docs/content/SOURCES.md`.

## Licence

- **Code:** MIT — see [LICENSE](LICENSE)
- **Educational content:** CC BY 4.0 — see [LICENSE-CONTENT](LICENSE-CONTENT)
- **Third-party quoted works:** rights remain with their holders; see [LICENSE-CONTENT](LICENSE-CONTENT)

---

*Thai copy in this README is project chrome and is pending a native-speaker review pass
(see [docs/DECISIONS.md](docs/DECISIONS.md) D6).*
