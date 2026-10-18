# Decisions

Every decision from the planning session, with its reason. Numbered D1–D21 to match the
questions asked during grilling. Settled 2026-10-18.

---

## Content & sources

### D1 — The PDFs are extracted into `docs/content/` as a dedicated pre-planning task
**Decision:** Convert all source PDFs to Thai markdown + structured JSON, with a page citation on
every claim, before building features. Owner spot-checks the extraction.
**Why:** `docs/content/` did not exist; the "single source of truth" was a 1.25 MB PDF. Planning
features against unread content means planning fiction — and the extraction turned out to change
the feature slate materially (see D15).
**Rejected:** lazy per-chapter extraction (hides scope surprises until too late).

### D8 — The corpus may be widened, but only from official Thai sources, behind an approval gate
**Decision:** Additions come from doa.go.th, ldd.go.th, ricethailand.go.th only. Each proposed
addition is written to `docs/content/ADDITIONS.md` as a specific claim + specific URL + the feature
that needs it, and reaches the site only once the owner ticks it.
**Why:** The pamphlet is 15 pages / ~21k chars. Goals G4 (calculation) and G5 (basal vs top
dressing) have roughly four lines each behind them — too thin to carry a feature. But "widen the
corpus" is precisely where invented agronomy creeps in, so it needs a hard gate rather than
good intentions.
**Rejected:** free-form connective prose with no new numbers — writing about fertilizer *timing*
is agronomic advice whether or not it contains digits.

### D9 — Sources are tiered, and the tier is shown
**Decision:** Build the bibliography the source lacks. Tag each of the 38 cited domains as
government/research/international vs commercial/blog. Render a visible tier badge. Low-tier
material may appear as descriptive text but is excluded from the calculator and crop matcher.
**Why:** The source has 67 inline links, no bibliography, and mixes doa.go.th and irri.org with
rakbankerd, blogspot, wordpress, and product-label photos. It admits several Thai rates
(sugarcane, mango, tapped rubber) come from labels or secondary summaries. A site promising
ที่มาของข้อมูล that cites a blog for a sugarcane rate is worse than one that says
"ไม่มีข้อมูลอ้างอิงที่เชื่อถือได้" for that crop.

### D11 — Cambodian Table 5.1 is excluded from the UI, retained in the data
**Decision:** The 9 rows of Cambodian rice recommendations by soil group stay in the content layer
tagged `country: KH`, and do not render in v1.
**Why:** Converting kg/ha → kg/rai is trivial arithmetic, but recommendations keyed to *Cambodian
soil groups* do not transfer to a Thai gardener's soil. Presenting them as generally applicable is
exactly the failure the no-invented-agronomy rule exists to prevent.

### D19 — Thai extraction cleanup is mechanical only
**Decision:** Collapse spurious intra-word spaces (`พ . ร . บ .` → `พ.ร.บ.`), normalize digits and
units. Every rule applied is listed in `docs/content/SOURCES.md` for audit. No word, number, or
sentence is changed. Awkward phrasing goes to a flagged list for the owner.
**Why:** The Thai extracts usably but noisily. Fixing spacing in CSS (rejected) leaves the data
dirty for search and tests. Rewriting for fluency (rejected) would let agronomic meaning drift
under cover of style editing.

---

## Product scope

### D2 — One chapter to production quality first, then breadth
**Decision:** Phase A = Chapter 1 + bag reader + calculator, finished completely. Phase B = all
seven chapters as cited content + the remaining interactives.
**Why:** Seven bespoke 3D interactives is a multi-month build. One finished chapter on a real iPad
teaches more than seven half-built ones, and the calculator in particular is pure logic with unit
tests — it de-risks the one feature where a bug hands a farmer a wrong dose.

### D3 — Only two scenes use WebGL; everything else is 2D
**Decision:** three.js is reserved for the deficiency plant (reused in Chapter 1). The bag reader,
calculator, crop matcher, quiz, and timeline are 2D DOM/SVG.
**Why:** Of the seven original ideas only the plant genuinely needs a 3D camera. A 3D bag whose
numbers you tap is strictly worse than a large legible 2D label: on iPad, text inside a WebGL
canvas is blurrier, unselectable, invisible to VoiceOver, and untestable by Playwright. This also
eliminates the static-fallback problem for five of seven features.

### D15 — The feature slate is re-ranked to content strength
**Decision:** Promote the deficiency explorer to a hero 3D feature. Demote basal-vs-top-dressing to
a static annotated diagram. Cut the soil cross-section scene to `BACKLOG.md`.
**Why:** The original ranking predated reading the source. The deficiency explorer has a 10-row
symptom table plus the mobility rule behind it and was fourth on the list. The soil cross-section
was the most visually appealing idea and has no source text behind it at all — building it means
inventing the pedagogy. The timeline has ~4 lines, which honestly supports a labelled picture and
not a scrubbable animation.

### D10 — The calculator is oxide-only and deliberately small
**Decision:** One job: target nutrient (kg/rai) + fertilizer grade → kg of product per rai, showing
the arithmetic in the source's own form (`10 × 100 ÷ 46 ≈ 22`). Rai ↔ hectare conversion included
(the source gives 1 ไร่ = 1,600 m², 1 ha = 6.25 ไร่). No elemental↔oxide conversion, ever.
**Why:** Bags are labelled in oxide form (P₂O₅, K₂O) and the source works entirely in oxide. Mixing
the two is wrong by ~2.3× for phosphorus — a silent, dangerous error. Blend mixing and
cost-per-nutrient comparison are the features most likely to produce a confidently wrong number
with nothing in the source to validate them against, so they go to the backlog.
**Validation:** a unit-test case per crop row in the source table, so the calculator is checked
against published rates rather than invented ones.

### D20 — Quiz uses the 6 source questions verbatim; progress in `localStorage`
**Decision:** No new questions in v1. No accounts, no server.
**Why:** Six verbatim questions are the honest ceiling of the source and need no agronomic review.
`localStorage` keeps the site fully static with no auth and no personal data, hence no privacy
policy obligation. Writing more questions sits behind the D8 gate.

### D12b — The factory-process tour stays out of v1
**Decision:** The 9-zone compost factory tour is listed as a candidate Chapter 8 in `BACKLOG.md`.
**Why:** It is fertilizer *manufacturing*, a different curriculum from "what is NPK", and it would
unbalance a beginner site. All three secondary PDFs and both images share this bias — they cover
compost production, not the stated curriculum.

---

## Design & engineering

### D12a — Adopt the `factory-walkthrough-th.html` design system; do not port its code
**Decision:** Reuse the prior art's palette (cream `#F3F1E8`, ink `#1B2A22`, green `#1F5E45`,
accent `#F2B632`), the Noto Sans Thai / Sarabun pairing, light/dark tokens, safe-area handling,
tap-target sizing, and reduced-motion work. Also adopt its per-section `nums`
("ตัวเลขที่ใช้ในโซนนี้ (จากบทความ)") and `skip` ("what breaks if you omit this") teaching pattern.
Rewrite the interactions in React Three Fiber rather than wrapping the original.
**Why:** The prior art already solves most of the iPad/WebKit problems in the brief, proven on the
owner's own devices, and reusing it makes the new site look like a sibling rather than a stranger.
But it is 1,108 lines of vanilla three.js r128 from a CDN with everything inline; seven chapters,
i18n, and a tested calculator need real modules.
**Carried-over fixes:** the prior art has no WebGL-absent fallback, no `localStorage` progress, and
uses `svh` where this project wants `dvh`.

### D13 — Next.js App Router, statically exported, with R3F client islands
**Decision:** Next.js over a Vite SPA.
**Why:** This is fundamentally a content site. Real HTML per chapter means someone searching
"ปุ๋ยยูเรีย 46-0-0 ใช้เท่าไหร่" can find it, and the text renders before any JavaScript — which
makes the WebGL-unavailable fallback free, since lesson content is in the HTML whether three.js
loads or not. A Vite SPA ships a blank `<div>` to crawlers and to anyone on a slow iPad. Next's
route-based code splitting also keeps three.js off the five routes that don't need it, the single
biggest win available for the 60 fps target.
**Cost accepted:** more config than Vite; `output: 'export'` constrains Next features unused here.

### D18 — `/th` URL prefix from day one; no i18n library
**Decision:** Locale as a Next App Router dynamic segment, `/` redirects to `/th`. Content in plain
typed modules — prose as per-locale MDX with frontmatter citations, numbers as locale-neutral JSON
with translatable label fields. No next-intl.
**Why:** Retrofitting a locale segment later means rewriting every route and breaking every shared
URL. next-intl adds runtime weight and indirection for two locales of static content. Separating
numbers from language matters more than the library choice: it makes it impossible for a rate to
drift between Thai and Khmer, which would be the worst bug available here.

### D16 — Hard performance budget, enforced in CI
**Decision:** Text routes ≤ 180 KB gzipped JS, LCP < 2.0 s on throttled 4G. 3D routes ≤ 600 KB
gzipped total including three.js. Thai fonts subset to Thai + Latin, ≤ 60 KB woff2 each. DPR capped
at 2. Sustained 60 fps on iPad 9th-gen or newer. **Exactly one WebGL context alive at a time,
explicitly disposed on route change.** Lighthouse performance ≥ 90, accessibility = 100. CI fails
the build when the JS budget is exceeded.
**Why:** "Feels fast on the iPad" is not something a test can fail on. The WebGL disposal rule
matters most: iPad Safari silently reloads pages under memory pressure, and the prior art caps
pixel ratio but never disposes contexts. Font subsetting is non-optional — full Noto Sans Thai is
far too heavy to ship whole.

### D4 — Hosted on Vercel, deployed from GitHub
**Decision:** Vercel, with a preview URL per branch.
**Why:** Not for serverless functions — none are needed. The per-branch preview URL is the fastest
way to open a task on a real iPad, which the execution loop requires. Local-network URLs over
Wi-Fi are flakier than a preview link. The site is fully static, so cost is zero and any static
host remains an option later.

### D21 — Vercel Web Analytics
**Why:** Cookieless, so no consent banner and no privacy policy required. One component import,
free on hobby, and it answers the only question worth asking at this scale — whether people reach
the calculator or bounce at Chapter 1. A third-party script would cost bundle weight against D16
for no added insight.

---

## Process

### D5 — Task branches merged locally with `--no-ff`; no pull requests
**Decision:** `git init`, public GitHub repo at `MrCronos10/Fertilizer_lesson`, branches named
`task/T-XXX-short-name`, pushed to generate a Vercel preview, then merged locally with `--no-ff`.
**Why:** The owner is the sole reviewer and reviews via `docs/TASKS.md` and the live preview, not
GitHub's diff view — so PRs add a click-through tax for no gain. Task branches still give clean
per-task history and an easy revert. Branches must be *pushed* for Vercel to build a preview, so
the order is: push branch → open preview on iPad → merge.

### D6 — Agronomic Thai is quoted from the source; new Thai is UI-only and flagged
**Decision:** Prefer verbatim source Thai for anything agronomic. Write new Thai only for UI chrome
(buttons, nav, labels), collected in a list for owner review.
**Why:** Grammatically correct Thai is achievable, but "natural, simple, beginner-friendly" for a
Thai farmer is a register judgment that cannot be made reliably without a native speaker, and
register mistakes would undermine the site's credibility more than any visual flaw.

### D7 — Procedural 3D geometry only
**Decision:** All 3D built from code primitives. No glTF, no Draco, no texture compression, no
asset pipeline.
**Why:** For teaching, a clean stylized diagram beats a photoreal plant — the nitrogen particles
should be unmistakably nitrogen particles, not botanically accurate foliage. Zero asset licensing
risk, page weight in kilobytes, and nothing to violate the "no large unoptimized assets" rule.
Revisit only if the procedural plant looks too crude on screen.

### D14 — Source PDFs are git-ignored; the repo is public; CC BY 4.0 + MIT
**Decision:** PDFs and images stay on local disk, git-ignored. Only extracted, cited Thai text and
structured data are committed. `docs/content/SOURCES.md` records which file and page each extraction
came from. Repo stays public. Content licensed CC BY 4.0, code MIT.
**Why:** Quoting and citing a journal article is ordinary scholarly use; rehosting the PDF is not —
`วารสารดินและปุ๋ย` and the NSTDA infographic are not ours to redistribute. Public is right for a
free educational resource and means Vercel previews need no auth on the iPad.
**Also:** the working directory keeps its space in the name (`Fertilizer Course`) — Node, Next, and
git all tolerate it, and moving it would break the existing Claude Code working-directory setup.
The empty `fertilizer lesson/` folder was deleted.

### D17 — Fresh-reviewer subagent on risky tasks only
**Decision:** A separate reviewer that did not write the code runs on content-accuracy, calculator,
and accessibility tasks. Styling and config tasks get self-review.
**Why:** The reviewer earns its roughly doubled cost per task where a mistake is invisible to
tests — a mis-transcribed rate, a citation pointing at the wrong page, a calculator edge case, a
missing VoiceOver label. It earns nothing re-reading a CSS token change visible on screen.

**Definition of done, every task:** acceptance criteria ticked; typecheck, lint, unit tests and
production build green; feature e2e passing in **WebKit** at iPad portrait, iPad landscape and Mac
desktop viewports; zero console errors; Thai tone marks visually verified in screenshots; every
on-screen number traced to a page citation; `TASKS.md` updated with what changed and how it was
verified. For 3D and touch tasks, owner confirmation on a real iPad via the Vercel preview is a
**gate** — the task stays `in-progress` until confirmed.
