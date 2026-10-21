# PRD — เรียนรู้เรื่องปุ๋ย (Thai Fertilizer Learning Site)

**Status:** awaiting approval · **Last updated:** 2026-10-18

## 1. Purpose

Turn an existing 15-page bilingual beginner fertilizer pamphlet into an interactive Thai-language
website that makes fertilizer concepts visual and hands-on rather than textual. Every agronomic
claim on the site traces back to a cited source page.

## 2. Audience

Complete beginners in Thailand: home gardeners and small farmers. No assumed agronomy knowledge,
no assumed English. Reading level: plain, concrete Thai — the register of the existing
`factory-walkthrough-th.html` prior art, not academic Thai.

## 3. Goals

| # | Goal | Source backing |
|---|---|---|
| G1 | Explain what fertilizer is and why plants need nutrients (N, P, K → secondary → micro) | Strong (p2, 3-row table) |
| G2 | Teach deficiency recognition via the old-leaf / young-leaf mobility rule | **Strongest** (p3, 10-row table) |
| G3 | Explain fertilizer types: organic, straight, compound, slow-release, foliar, soil conditioners | **Strongest** (p3–p5, 4 tables) |
| G4 | Teach reading the NPK numbers on a bag and calculating how much to use | Thin (p6, ~4 lines, 1 worked example) |
| G5 | Distinguish basal (ปุ๋ยรองพื้น) from top dressing (ปุ๋ยแต่งหน้า) | Thin (p5 §2.7, ~4 lines) |
| G6 | Match fertilizer to crop across 8 crops | Strong (p12–13, 10-row table) |
| G7 | Safe use, storage, common mistakes, environmental cautions | Adequate (p6, 4R + 6 mistakes) |

## 4. Non-goals (v1)

- **Khmer language.** The structure is i18n-ready and URLs carry a `/th` prefix from day one, but
  no Khmer content ships. The source's Khmer half does not extract reliably from the PDF, so a
  Khmer version will need fresh translation, not extraction.
- **Phone-first design.** Phones must not break, but they are not a design target.
- **Cambodian rice recommendations** (source Table 5.1, 9 rows). Retained in the content layer
  tagged `country: KH`, excluded from the UI — see D11.
- **Soil cross-section 3D scene.** Cut: the source contains no soil-layer pedagogy to back it.
- **A compost / factory-process chapter.** The prior art and all three secondary PDFs cover
  organic fertilizer *manufacturing*, which is a different curriculum.
- Accounts, logins, servers, databases, payments. The site is fully static.
- Blend mixing, cost-per-nutrient comparison, soil-test interpretation.

## 5. Scope of v1

**Phase A — one chapter to production quality.** Chapter 1 (G1) plus the NPK bag reader and the
calculator (G4). This proves the entire stack end to end: content pipeline, Thai typography,
WebKit touch handling, citation UI, test harness, iPad deployment.

**Phase B — breadth.** All seven chapters readable as cited content, plus the four remaining
interactives ranked by how well the source backs them:

1. **NPK bag reader** (2D) — tap each of the three numbers on a bag label.
2. **Calculator** (2D) — target nutrient kg/rai + fertilizer grade → kg of product per rai,
   showing the arithmetic in the source's own form.
3. **Deficiency explorer** (3D) — rotatable plant; tapping an old vs young leaf reveals the
   symptom and the nutrient mobility rule. The best-backed interactive in the set.
4. **Crop matcher** (2D) — pick one of 8 crops, see type/rate/timing with its citation and
   source tier.
5. **Quiz** (2D) — the 6 verbatim Thai questions from p6–7, progress in `localStorage`.
6. **Basal vs top dressing** — a static annotated diagram, not a scrubbable timeline. Four lines
   of source honestly support a labelled picture and nothing more.

Only two scenes use WebGL: the deficiency plant, and the same plant reused in Chapter 1.
Everything else is 2D DOM/SVG — more legible, accessible, testable, and faster on iPad.

## 6. Platforms

- **iPad Safari** (iPadOS), portrait ~768–1024px and landscape ~1024–1366px. Touch: one-finger
  rotate, pinch zoom, two-finger pan, tap to select. Tap targets ≥ 44×44pt. No hover-only
  interactions.
- **macOS Safari** (reference) and **Chrome** (secondary). Mouse/trackpad drag, scroll/pinch zoom,
  click. Full keyboard navigation.
- WebKit is the reference engine for all e2e and screenshot testing.
- `100dvh` not `100vh`; `env(safe-area-inset-*)` respected throughout.

## 7. Content integrity rules

These override visual polish, schedule, and feature completeness.

1. **No invented agronomy.** No fact, formula, rate, or number appears on the site unless it
   traces to a source page recorded in `docs/content/SOURCES.md`.
2. **Source tiering is visible.** The source's 67 inline links name 37 domains (plus 5 hidden sources) with no bibliography, mixing
   doa.go.th / ldd.go.th / ricethailand.go.th / irri.org with blogspot, wordpress, and fertilizer
   bag photos. We build the bibliography it lacks, tag every domain by tier, and show the tier.
   Low-tier material may appear as descriptive text but never as a number a farmer would act on.
3. **Corpus additions are gated.** Widening beyond the pamphlet is allowed, from official Thai
   sources only (doa.go.th, ldd.go.th, ricethailand.go.th), and only via an entry in
   `docs/content/ADDITIONS.md` that the owner ticks before it reaches the site.
4. **Thai is cleaned, never reworded.** Extraction cleanup is mechanical only (collapsing spurious
   intra-word spaces such as `พ . ร . บ .`, normalizing digits and units). Awkward phrasing is
   flagged for the owner, not silently rewritten.
5. **Oxide units only.** Everything is N–P₂O₅–K₂O as printed on bags. No elemental conversion is
   offered anywhere, because mixing the two is wrong by ~2.3× for phosphorus.
6. **Rates are starting points.** Every rate displays a visible note recommending a soil test.
7. **Numbers are stored once.** Rates and grades live in locale-neutral JSON with translatable
   label fields, so a value cannot drift between languages.

## 8. Success criteria

- A beginner can read any chapter and reach the sources section for it in one tap.
- The calculator reproduces the source's worked example exactly, and every published crop rate in
  the source has a passing unit test.
- 60 fps sustained on an iPad 9th-gen or newer; text routes ≤ 180 KB gzipped JS; 3D routes
  ≤ 600 KB gzipped; Lighthouse accessibility 100.
- The site is fully usable with WebGL unavailable — all lesson content is in the server-rendered
  HTML regardless of whether three.js loads.
