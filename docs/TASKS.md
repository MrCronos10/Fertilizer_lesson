# Tasks

**Approved and in progress** — T-001 to T-009 shipped; see each ticket's Status. The owner checks progress here.

Worked one at a time in dependency order. Branch per task: `task/T-XXX-short-name`.
Definition of done for every task is in `docs/DECISIONS.md` D17 — it is not repeated below.
`Reviewer: yes` means a fresh subagent that did not write the code reviews it (D17).

**Phases:** P0 foundation · P1 content pipeline · P2 Chapter 1 vertical slice (D2 Phase A) ·
P3 breadth and interactives (D2 Phase B) · P4 hardening.

---

## P0 — Foundation

### T-001: Repo baseline, licenses, README
- Status: **done**
- Depends on: —
- Goal: Commit the planning docs to a clean public repo with licenses in place and the source PDFs provably excluded.
- Acceptance criteria:
  - [x] `.gitignore` excludes all `*.pdf`, `*.jpg`, `*.jpeg` and `factory-walkthrough-th.html`; `git status` shows none of them as untracked
  - [x] `LICENSE` (MIT, code) and `LICENSE-CONTENT` (CC BY 4.0) present
  - [x] `README.md` states what the project is, in Thai and English, and links PRD/DECISIONS/TASKS
  - [x] Remote `origin` set to `https://github.com/MrCronos10/Fertilizer_lesson.git`, `main` pushed
  - [x] `git log` shows one clean initial commit; no PDF blob in history (`git rev-list --objects --all | grep -i pdf` is empty)
- Test plan: Manual — `git status`, the grep above, and confirm the pushed GitHub tree contains no binaries.
- Notes: Repo is currently public, empty, 0 bytes. Git is already initialized locally with `.gitignore` written. **Push needs owner confirmation** (public, visible to others).
- **Verified 2026-10-18:** commit `e0a3999`, 1,060 lines across 9 files, pushed to `main`. `git rev-list --objects --all` grep for pdf/jpg/jpeg returns nothing; the remote tree API confirms exactly 9 text blobs and no binaries. `LICENSE-CONTENT` also records the quoted third-party works and the no-warranty / soil-test caveat. Committed directly to `main` rather than a `task/` branch — there was no `main` to branch from yet; every later task uses a branch per D5.

### T-002: Next.js scaffold with strict TS, lint, Vitest, Playwright/WebKit
- Status: **done**
- Depends on: T-001
- Goal: An empty but fully wired Next.js App Router app whose whole check suite runs green.
- Acceptance criteria:
  - [x] Next.js App Router, TypeScript `strict: true`, no `any` in app code
  - [x] ESLint configured and passing; `npm run typecheck`, `lint`, `test`, `build` all defined and green
  - [x] Vitest runs with one trivial passing test
  - [x] Playwright installed with the **WebKit** engine only, and three named viewport projects: `ipad-portrait` (768×1024), `ipad-landscape` (1366×1024), `mac-desktop` (1440×900)
  - [x] One smoke e2e test loads `/` and asserts zero console errors in all three projects
- Test plan: Run the full suite locally; confirm Playwright actually launches WebKit (not Chromium) via `--list`.
- Notes: Chromium is deliberately not installed — WebKit is the reference engine (D13, PRD §6).
- **Verified 2026-10-18:** Next 16.4.2 / React 19.3.0 / TS 5 / ESLint 9 / Vitest 5.0.5 / Playwright 1.64.1. `typecheck`, `lint`, `test` (3 passing) and `build` all green; `test:e2e` 9 passing across all three WebKit viewports. Build output shows `○ (Static) prerendered as static content` for `/`.
  - **Added a guard, not just a test:** `runs on WebKit` asserts `browserName === "webkit"`, so a Chromium project added later fails rather than silently passing while telling us nothing about Safari.
  - **Followed create-next-app's tested pins** (ESLint 9, TS 5) rather than the latest published ESLint 10 / TS 7, which `eslint-config-next@16.4.2` is not tested against.
  - **`@types/node` bumped `^20` → `^26`:** Vitest 5 requires `>=22` and the runtime here is Node 26. Resolved the real peer conflict rather than using `--legacy-peer-deps`.
  - **`vitest.config.ts` → `.mts`:** silences Vite's native-config-loader warning without flipping the whole package to `"type": "module"`, which would change Next's module resolution.
  - **Accepted risk — 5 high npm audit findings, all dev-only.** Chain is `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces` (GHSA-vfj7-8cjw-p6xm, glob-pattern DoS). The advisory covers `braces *` — **no patched version exists**, so an override cannot clear it (tried `fast-glob@^3.3.3`, no effect, reverted). npm's only offered fix downgrades `eslint-config-next` to 14.2.35, breaking the Next 16 toolchain. Exposure is the linter parsing our own repo at dev time; nothing ships to users. Re-check when upstream drops `fast-glob`.
  - **D13 amended → D13a:** dropped `output: 'export'`; plain `next build` on Vercel already prerenders static HTML and keeps `next.config` redirects available for `/` → `/th` in T-010.

### T-003: Vercel project, preview deploys, analytics
- Status: **blocked** — two owner actions needed, see below
- Depends on: T-002
- Goal: Every pushed branch produces a preview URL openable on the iPad; analytics live.
- Acceptance criteria:
  - [x] Vercel project created and linked locally (`fertilizer-lesson`, org `kuypavthai-4289s-projects`)
  - [ ] **Blocked:** Vercel project connected to the GitHub repo; `main` auto-deploys to production
  - [ ] **Blocked:** pushing a branch produces a preview URL that loads without authentication
  - [x] `@vercel/analytics` mounted; a page view fires
  - [x] No environment variables or secrets required to build
- Test plan: Push a throwaway branch, open the preview URL on a real iPad over cellular (not LAN), confirm it loads.
- Notes: Deliberately early — every later 3D/touch task depends on this preview URL as its iPad gate (D4, D17). Public repo means previews need no auth (D14).
- **Progress 2026-10-18 — production is live and public:**
  - **https://fertilizer-lesson.vercel.app** → HTTP 200, `x-vercel-cache: HIT`, `<title>เรียนรู้เรื่องปุ๋ย</title>`, `lang="th"`, Thai text present in the static HTML (confirming the D13a no-JS fallback).
  - Analytics verified by driving the deployed site in WebKit: `window.va` is a function and `window.vaq` holds `[["pageview",{"route":"/","path":"/"}]]`. The script loads from an obfuscated path (`/<hash>/script.js`), not `/_vercel/insights/script.js` — grepping for "insights" gives a false negative.
  - Deployed via CLI, not git. Long-lived deployment URLs and the `*-kuypavthai-4289s-projects.vercel.app` alias both return 302 to Vercel SSO; only the short `fertilizer-lesson.vercel.app` alias is public.
  - `.env.local` (holds `VERCEL_OIDC_TOKEN`) and `.vercel/` are both git-ignored; verified before committing.
- **BLOCKED ON OWNER (two one-time dashboard actions):**
  1. **Connect GitHub to the Vercel account.** `vercel link` failed with *"You need to add a Login Connection to your GitHub account first. (400)"*. Until then `vercel git connect` cannot run, so pushes do not auto-deploy and every deploy is a manual CLI call. Fix: Vercel → Account Settings → Authentication → connect GitHub.
  2. **Turn off Deployment Protection for previews.** Default Standard Protection puts every preview behind Vercel SSO, which defeats the per-task iPad gate in D17. Fix: Project → Settings → Deployment Protection → disable Vercel Authentication for Preview (the repo and site are public anyway, per D14).
  Until both are done, each task's iPad check needs a manual `vercel deploy --prod`, which also means previews overwrite production — acceptable while the site is a scaffold, not acceptable once real content ships.

### T-004: Design system port from the prior art
- Status: **done**
- Depends on: T-002
- Goal: Port the `factory-walkthrough-th.html` visual language into tokens and base styles, with subset Thai fonts.
- Acceptance criteria:
  - [x] CSS custom properties for the palette: cream `#F3F1E8`, ink `#1B2A22`, brand green `#1F5E45`, accent `#F2B632`
  - [x] Light/dark via `prefers-color-scheme` plus a `data-theme` override, as in the prior art
  - [x] Noto Sans Thai (headings) and Sarabun (body) self-hosted, **subset to Thai + Latin, each ≤ 60 KB woff2**
  - [x] `100dvh` used throughout (not `100vh`, and not the prior art's `svh`)
  - [x] `env(safe-area-inset-*)` respected on all four edges
  - [x] Base tap target ≥ 44×44pt; `:focus-visible` styling present; `prefers-reduced-motion` honoured
- Test plan: Screenshot a type-specimen page in all three WebKit viewports, light and dark. Verify Thai tone marks and vowel stacking render correctly at every heading and body size. Check the font files' byte size in the build output.
- Notes: Reviewer: yes (accessibility). Prior art fixes to carry: `svh`→`dvh`, and it had no WebGL fallback or progress storage (D12a).
- **Verified 2026-10-19:** 34 unit tests + 45 WebKit e2e tests green across all three viewports; clean `npm run check` with every route prerendered static. Specimen page at `/specimen` (noindex). All 12 tokens transcribed verbatim from the prior art and independently re-verified by the reviewer. Fonts: 6 subsets, 72 KB total, largest 11.4 KB vs the 60 KB/file budget. Thai rendering confirmed by reading the screenshots, not only by assertions — ปุ๋ย, น้ำ, ผู้, เปื้อน stack correctly in both themes, as do Thai numerals and P₂O₅/K₂O subscripts.
- **Defects found and fixed during the task (not test-only):**
  - Specimen page had two `<h1>`s. Added `.as-h1/.as-h2/.as-h3` appearance-only classes so the type scale can be shown with one real `h1`.
  - A local production build 404'd on `/_vercel/insights/script.js`. Analytics is now gated on `process.env.VERCEL`, plus a real `favicon.ico` — Safari requests it regardless of `<link rel="icon">`.
- **Reviewer findings fixed (fresh subagent, accessibility focus):**
  1. **Focus ring failed WCAG 1.4.11 at 1.61:1** — `--accent` gold on cream. Introduced a `--ring` token: green `#1F5E45` (6.76:1) on light, gold retained on dark (9.86:1). The prior art had this bug; it ported faithfully and was caught here.
  2. **`--line` at 0.18 alpha was 1.42:1** — `--panel` sits within ~1.1:1 of `--bg`, so the border was the only thing separating a panel or secondary button from the page, and it was invisible. Raised to 0.55 light / 0.45 dark (3.44:1 / 4.02:1). The prior art could afford a faint line because its panels floated over a 3-D canvas.
  3. **ZWNJ/ZWJ were resolving from the Latin face.** The Latin range `U+2000-206F` contains `U+200C-200D`, and the last matching `@font-face` wins — so declaring Thai first silently defeated the point. Reordered Latin-first/Thai-last, with a test asserting the order.
  4. **The "real glyphs" test was vacuous.** Measuring a bounding box passes with a Thonburi fallback or a row of tofu. Replaced with `document.fonts.check()` per face plus an independent width-versus-fallback cross-check.
  5. **The focus-ring test was also vacuous** — `outlineWidth` reports `3px` even on elements with `outline-style: none` (verified on `<body>`). Now asserts `outlineStyle` and `outlineColor`.
  6. **Heading `line-height` 1.3 → 1.4** — Thai upper vowel + tone stacks overshoot a 1.3 line box and collide on wrapped headings.
  7. **Added the two missing criteria tests** — safe-area padding on all four edges, and `prefers-reduced-motion`. Strengthened the `dvh` check to scan all rules rather than only `min-height`, and added `lib/contrast.test.ts`, which computes WCAG ratios from the tokens so a palette change fails before it reaches a screenshot.
  8. Also fixed: `color-scheme: light dark` (prevented a white flash on dark devices), preloading `sarabun-600-thai` (carries the soil-test note and primary CTA, where fallback metrics cause visible reflow), theme toggle rebuilt on native radios with `lang="en"` (VoiceOver was reading English labels with a Thai voice), `letter-spacing` removed from the combining-mark row (WebKit inserts space between base and mark, detaching tone marks), `h3`→`h2` heading order, and centred specimen content.
- **Deferred, recorded in `docs/BACKLOG.md`:** `overflow-x: hidden` on `body`, no `--danger` token yet, and macOS Safari's Tab-navigation default.

---

## P1 — Content pipeline

### T-005: Extract Thai prose to MDX with page citations
- Status: done
- Depends on: T-001
- Goal: Source pages 2–6 become per-chapter MDX with a page citation on every claim and documented cleanup.
- Acceptance criteria:
  - [x] `content/th/ch01..ch07.mdx` with frontmatter: title, goal ID, source pages, citation list
  - [x] Spurious intra-word spaces collapsed (`พ . ร . บ .` → `พ.ร.บ.`); digits and units normalized
  - [x] `docs/content/SOURCES.md` lists every cleanup rule applied, and maps each extraction to its source file and page
  - [x] Zero rewording: a diff against the raw extraction shows only whitespace, digit, and unit changes
  - [x] Awkward phrasing collected in `docs/content/THAI-REVIEW.md` for the owner — not silently fixed
  - [x] The 6 Thai quiz questions (p6–7) captured verbatim
- Test plan: Unit test asserting every MDX file has non-empty `sourcePages` frontmatter. Manual: owner spot-checks THAI-REVIEW.md and three random paragraphs against the PDF.
- Notes: Reviewer: yes (content accuracy). D19 governs cleanup limits. Khmer (p7–10) is skipped — it does not extract reliably and v1 is Thai-only.
- **Verified:** 78 unit tests (44 of them new, in `lib/content.test.ts`), 45 WebKit e2e, clean `npm run check`.
  - Raw extraction committed to `docs/content/raw/p*.txt` as the audit baseline; `manifest.json` records
    which lines of which page each chapter was built from.
  - The zero-rewording criterion is enforced as an **equality diff**, not a search: the test rebuilds each
    chapter's expected text from the manifest lines and asserts it equals the shipped MDX with whitespace
    removed. Six deliberately corrupted variants (changed number, number moved to its own line, truncated
    clause, deleted paragraph, reordered bullets, invented sentence) are asserted to fail it, so the guard
    cannot go slack. An earlier containment-based version of this test passed all six and was replaced.
  - Formatting the text layer loses — bold runs and inline citation-pill anchors — was read off the pages
    rendered at 2× through CoreGraphics, so `<Cite>` sits exactly where the source prints its pill.
  - Three pieces of source prose are deliberately not shipped; each is justified in `manifest.json` →
    `excludedProse`, and a test fails if one loses its reason.
  - Added `yaml@2.8.1` (zero transitive deps) to parse and validate chapter frontmatter.
- **Open for the owner:** `docs/content/THAI-REVIEW.md` lists 7 phrasing flags and 4 content divergences.
  Nothing was silently reworded; each needs a ✅ or ✍️ before T-010 renders this content.

### T-006: Extract the 9 table schemas to locale-neutral JSON
- Status: done
- Depends on: T-005
- Goal: Every number in the source lives in typed JSON, stored once, with its citation and country tag.
- Acceptance criteria:
  - [x] JSON + TS types for all nine schemas: nutrient groups (p2, 3 rows), deficiency symptoms (p3, 10), organic fertilizer NPK (p3, 5), straight fertilizers (p4, 7), compound grades→use (p5, 6), soil conditioners with lime equivalence (p5, 4), Cambodian rice by soil group (p11, 9), other crops (p12–13, 10), glossary (p14, 20)
  - [x] Numbers are locale-neutral; only labels are per-locale (D18)
  - [x] Every row carries `sourcePage` and `country` (`TH` | `KH`)
  - [x] The p11 table is tagged `KH` and a test asserts no `KH` row is reachable from any v1 UI query
  - [x] Ranges stored as `{min, max}`, never as strings like `"25–50"`
  - [x] All nutrient values explicitly oxide-form (`n`, `p2o5`, `k2o`) — no bare `p` or `k` keys anywhere
- Test plan: Unit tests on row counts per table (3/10/5/7/6/4/9/10/20), on `sourcePage` presence, on the KH exclusion, and a type-level check that no elemental key exists.
- Notes: Reviewer: yes (content accuracy). Row counts come from the source inventory and are the cheapest possible guard against a dropped row.
- **Verified:** 262 unit tests, 45 WebKit e2e, clean `npm run check`. A fresh reviewer checked all ~190 numbers
  cell by cell against the rendered pages and found **no digit wrong, transposed, dropped or on the wrong row**.
  - It also proved the first version of the tests was largely vacuous: seven corrupting mutations passed all 72
    of them, including two deficiency symptoms swapped between rows and a rate changed from 20–25 kg/rai to
    200–250 kg/ha. Whole-page containment cannot catch a permutation. The checks are now **anchored** — a row's
    fields must appear together, in order, within the raw lines it was printed on. Nine mutations (the original
    seven plus an invented guidance entry and a string-typed supply figure) are now each verified to fail.
  - `NpkKgPerHa` was a type alias, i.e. documentation, not enforcement. It now has distinct field names
    (`nKg`/`p2o5Kg`/`k2oKg`), so a kg/ha supply figure cannot reach `formatGrade` — a compile error, not a
    convention. A runtime check also rejects any percentage triple summing above 100%.
  - `cropsFor` returned the unfiltered row beside the filtered arrays, putting `crop.row.topDressing` one
    property access from `crop.topDressing`. The row type now omits both arrays.
  - Added `lib/data/validate.ts`: the `as Table<…>` casts accept a deleted field or a string where an object
    belongs with no `tsc` complaint, so the shapes are enforced at runtime in the test suite instead.
  - Every row now carries `country`, with `NEUTRAL` for rows that are not country-specific, so the criterion is
    met literally rather than waived for the six country-neutral tables.
- **Open for the owner:** the vegetable row ships **no rate a Thai grower can act on**. The source's only
  number for it is Cambodian survey data (CDRI Working Paper 91), and its advice is tagged `UNSTATED` rather
  than `TH` because the source gives it no country. Filling that gap from an official Thai source is T-008.

### T-007: Bibliography and source tiering
- Status: done
- Depends on: T-006
- Goal: Build the bibliography the source lacks and tier every cited domain (37 nameable, plus 5 hidden behind overflow pills).
- Acceptance criteria:
  - [x] `content/sources.json`: each of the 37 nameable domains with its tier (`official` | `research` | `commercial`) and resolved URL where possible
  - [x] The source's 67 inline links mapped to entries; unresolvable markers recorded as such, not guessed
  - [x] Every Rate in T-006 resolves to at least one source entry
  - [x] Rates backed only by `commercial` are flagged `actionable: false`
  - [x] A test asserts no `actionable: false` Rate is returned by the calculator or crop-matcher data queries
- Test plan: Unit tests for the actionable-exclusion rule and for total-coverage (no Rate without a source).
- Notes: Reviewer: yes (content accuracy). The source admits sugarcane, mango, and tapped-rubber rates come from product labels or secondary summaries — expect those to land `commercial` (D9).
- **Verified:** 368 unit tests, 45 WebKit e2e, clean `npm run check`. A fresh reviewer then found real problems; all are fixed.
  - URLs are not guessed: the PDF carries each citation pill as a link annotation. 67 pills = 67 annotations,
    41 documents, 37 domains; every pill↔link pairing agrees on domain, and the reviewer re-checked p5 and p12
    by rendering each annotation's rectangle over its pill, including the same-domain pairs.
  - **The "38" in this task was wrong and is corrected** (also in DECISIONS D9, PRD, CONTEXT, README): 37 can be
    named. 5 more sources hide behind two overflow pills (`uga +2`, `cgiar +3`) and are recorded as unresolved.
  - **Review finding, fixed — actionability was resolved per row and let a commercial-only claim ride on another
    cell's source.** The cassava cell mixes a Thai rate, a Cambodian note and CIAT guidance, with one pill beside
    the CIAT line; both Thai lines inherited it. Resolution is now per piece of guidance. Cassava's Thai dolomite
    rate (backed on p5 by a blogspot page) and Thai 15-15-15 rate (two unlinked names) are no longer actionable.
  - **Review finding, fixed — `tci-thaijo` was tiered `research` on a `domain` basis, which was an inference.** It
    is a hosting platform and the article is in a humanities journal. It is now `commercial` / `inferred-from-url`,
    which makes tapped rubber non-actionable until someone reads the article.
  - **Review finding, fixed — four corruptions passed every test** (a news aggregator promoted to official, a
    manufacturer to research, two DOA URLs swapped, a Cambodian survey to official). All 37 tiers are now pinned,
    every document is fingerprinted, and each pill is recorded with its position on its page and checked against
    the raw page's pill order — needed because two DOA documents cited on the same page are otherwise
    indistinguishable once swapped. Ten corruptions, including the reviewer's four, are each verified to fail.
  - **Review finding, fixed — `sources.json` had been hand-patched after generation, with its generator outside
    the repo.** The generator is now `tools/build-sources.py` and the judgements live in `tools/source-meta.json`;
    regenerating reproduces the committed file byte for byte.
  - **`fao` was read in full** rather than guessed: it is TAS 4401-2008, a Thai government standard, so `official`
    is right. It does **not** contain the grade `16-8-8`, which the pamphlet lists for sandy-soil rice; flagged in
    THAI-REVIEW.
  - Crops the matcher may now use: rice (both soils), maize, durian, and cassava's CIAT regional line. Sugarcane,
    mango, both rubber rows, the Thai cassava lines and vegetables are descriptive-only. The source's own caveat
    names sugarcane, mango and tapped rubber as resting on labels or secondary summaries.
  - Nothing was fetched to decide a tier. 15 tiers rest on the URL alone; all 15 are `commercial`, and a test
    forbids ever promoting one on inference.
- **Scope note:** the criterion that no non-actionable Rate reaches "the calculator or crop-matcher data
  queries" is asserted for `cropsFor`, the only such query that exists today. The calculator half is carried
  into T-013's criteria so it cannot be forgotten.
- **Open for the owner:** `docs/content/TIER-REVIEW.md`. The decision with consequences is `tci-thaijo.org`:
  reading that one article would restore tapped rubber to the matcher.

### T-008: Propose corpus additions for the G4 and G5 gaps
- Status: done (awaiting owner ticks — see T-008b)
- Depends on: T-007
- Goal: A reviewable list of official-source additions to fill the calculation and basal/top-dressing gaps.
- Acceptance criteria:
  - [x] `docs/content/ADDITIONS.md`: each entry has the exact claim, the official URL (doa.go.th / ldd.go.th / ricethailand.go.th only), the feature needing it, and an unticked checkbox
  - [x] Replacement candidates proposed for every `commercial`-only Rate from T-007
  - [x] Nothing written into `content/` — this task produces only the proposal list
- Test plan: Manual — owner reads the list. A test asserts no `content/` file references an unticked Addition.
- Notes: **Stop-and-ask gate (D8).** Task ends awaiting owner ticks; the ticked items become their own follow-up task.
- **Verified:** 426 unit tests, clean `npm run check`. A fresh reviewer then checked every quote against the originals and found the quoted Thai and table numbers faithful, but found errors in my commentary and a gate that was easy to bypass. All fixed.
  - Ten entries (A-01…A-10), each with an exact Thai quote, an exact official URL on doa/ldd/ricethailand, the page, how it was read, and every place it **disagrees with the pamphlet**. Every document was downloaded and read directly; search-engine summaries were used only to find documents, and were wrong more than once (one attributed durian's rate to mango).
  - **Review corrections to my own commentary:** I had miscounted Table 13 (45 rows, not 54); quoted only half of the cassava timing rule (the case that actually covers the sandy row was omitted, and the note is printed under a different table than the one I applied it to); called the pamphlet's cassava lime figure a blogspot-only claim when DOA states the same 100 kg/rai (new A-10); and overstated a "conflict" on rice that TAS 4401-2008 reconciles. One reviewer claim was checked and found **wrong**: A-01's "ตารางที่ 8" is the sugarcane chapter's own Table 8, not the maize one.
  - **The gate** (`lib/additions.ts`) was bypassable: a markdown-link source parsed as "no source" and passed; `A–03`, `a-03`, `A 03`, `A03`, full-width digits and `id=A-03` all slipped past; an earlier `- [x] note` could flip an entry to approved; a fenced block could create a ticked entry. Each is now a failing test and is closed; a tripwire also blocks distinctive wording from unticked entries being pasted into `content/` without naming its id. Twelve cases (ten bad, two controls that must pass) are verified.
  - Hardening produced one false positive worth recording: hex escapes in percent-encoded URLs (`%B8%A7`) contain `A7`, which read as A-07 throughout `sources.json`.
- **Open for the owner — this task ends at a gate (D8):** tick or reject each entry in `docs/content/ADDITIONS.md`. Four need a decision, not just a tick: A-05 (how G5 should teach the rice "first application", given TAS 4401-2008's definitions), A-07 (durian disagrees with the pamphlet), A-09/A-10 (two official lime figures disagree with each other by 2–40×), and A-02 (accept only the timing, or also ingest the soil-test tables, which is new scope).
- **Not found:** mango, rubber (both stages) and vegetables have no usable official source in the three allowed domains. Rubber's real authority (RRIT) is outside D8; widening D8 is the owner's call.

### T-008b: Apply the ticked additions
- Status: blocked
- Depends on: T-008 (owner ticks)
- Goal: Turn each ticked entry in `docs/content/ADDITIONS.md` into cited content and data, and nothing else.
- Acceptance criteria:
  - [ ] Only entries with `- [x]` are applied; each applied entry is referenced by id from the content or data row it changes
  - [ ] Any `Guidance` row an addition backs gets its `citations` and `actionable` flag recomputed through `isActionable`, and `sources.json` gains the new documents via `tools/build-sources.py`-style provenance (URL, page)
  - [ ] Every disagreement the entry lists is resolved the way the owner decided, recorded in `docs/DECISIONS.md`, never silently picked
  - [ ] Unticked entries remain unreferenced (the existing gate test)
- Test plan: the T-006/T-007/T-008 suites stay green; new rows are anchored to their quoted wording the way the crop table is.
- Notes: Reviewer: yes (content accuracy). Cannot start until the owner has ticked at least one entry.

### T-009: Import the p14 glossary into CONTEXT.md
- Status: done
- Depends on: T-006
- Goal: Replace the provisional ⏳ glossary terms with the source's own authoritative wording.
- Acceptance criteria:
  - [x] All 20 p14 rows reconciled into `CONTEXT.md`; every ⏳ marker resolved to ✅ or corrected
  - [x] Any conflict between a provisional term and the source's wording is called out explicitly, source wins
  - [x] `CONTEXT.md` still contains no implementation details
- Test plan: Manual read-through against the source page.
- Notes: Reviewer: yes (content accuracy). Thai/Khmer/English/Chinese columns exist; keep Thai + English, park the rest in the glossary JSON.
- **Verified:** 45 glossary tests (all 20 p14 rows checked against the rendered page, Thai and English), clean `npm run check`. A fresh reviewer found no wrong row but found errors in my commentary, all fixed.
  - **Four things the earlier `CONTEXT.md` attributed to the source that the source does not say:** `สูตรปุ๋ย` as the term for a grade (it occurs nowhere in the pamphlet; the source's table header is `สูตร` and chapter 3 says "ตัวเลข 3 ตัวบนกระสอบ"); "primary" nutrients (the source says Macronutrients); basal fertilizer as "worked into the soil" and top dressing as going "to the soil surface" (neither phrase is in the source). All replaced with the source's own wording; the first is kept only as a ⚠ note for the owner.
  - **Review corrections to my own commentary:** a false statement that Khmer and Chinese were "kept in the glossary data" (Chinese is; Khmer is not carried anywhere); 4R placed under the "safety chapter" when it sits under chapter 4; invented English glosses for the three chemical types that the source does not give; and three missing conflicts (four p14-only terms, English labels that differ between p14 and the chapter headings, ground limestone as the §2.8 baseline).
  - **The test suite guarded quoted phrases only,** so any unquoted claim about the source could be changed and still pass. Each is now pinned to the committed source text (the 1,600 m² rai, the 6.25 hectare factor, the 16-20-0 bag example, the p2 group lists, the 4R chapter, §2.7 as the location of the basal/top-dressing wording, the glossary data's columns). Seven unquoted corruptions were each verified to fail.
- **Open for the owner:** whether the UI may use `สูตรปุ๋ย` (natural Thai, absent from the source), and the basal/top-dressing disagreement already raised as A-05.

---

## P2 — Chapter 1 vertical slice
### T-010: App shell, `/th` routing, chapter layout
- Status: done
- Depends on: T-004, T-005
- Goal: Navigable shell with a locale segment and a reusable chapter layout.
- Acceptance criteria:
  - [x] Route structure `/[locale]/...`; `/` redirects to `/th`
  - [x] Chapter list and chapter route render from MDX frontmatter — no hard-coded Thai strings in components
  - [x] Navigation works by keyboard on Mac and by touch on iPad; no hover-only affordance anywhere
  - [x] Layout correct at iPad portrait, iPad landscape, and Mac desktop, with safe areas respected
  - [x] Text routes ship ≤ 180 KB gzipped JS
- Test plan: e2e in all three WebKit viewports: navigate every chapter link, assert no console errors, assert `/`→`/th` redirect. Screenshots at all three sizes. Check bundle size in build output.
- Notes: No i18n library (D18). Phones must not break even though they are not a target.
- **Verified:** typecheck, lint, 483 unit tests and the production build green; 78 WebKit e2e across the three viewports (all run against a fresh `next start` on its own port).
  - Routes: `/` → `/th` (non-permanent redirect in `next.config.ts`), `/th` (contents), `/th/ch01`…`/th/ch07`. Chapters compile from `content/th/*.mdx` at build time with `@mdx-js/mdx`; the Thai in the shell comes from chapter frontmatter and the new `content/th/ui.json`. A test fails if Thai appears in any route or component file.
  - **JS budget, corrected in T-014:** I first reported 175 KB gzipped on `/th` (97% of 180 KB) by summing every `<script src>` in the HTML. That wrongly counted two `noModule` polyfill chunks (about 41 KB) that Safari never downloads. Measured in a real WebKit page the figure is **about 139 KB** on text routes, which leaves about 40 KB of headroom. The budget test now measures what the browser actually loads.
  - **Tables, citations and the quiz are slots, not UI yet.** `<SourceTable>` and `<Quiz>` render hidden and empty; `<Cite>` shows the raw key (e.g. `[doa]`). Chapters therefore show prose only until T-011/T-012/T-019/T-021. The Cambodian table cannot reach the page (D11): a unit test and an e2e tripwire cover it.
  - **Guards mutation-tested** (each corruption made, confirmed to fail, then restored): a chapter tag with no component (this crashed the first build on `<Quiz>`), Thai hard-coded in a component, a missing UI key, a table rendered from the KH slot, a lowered bundle limit, a removed noindex tag.
  - **Found and fixed in my own test setup:** a `next dev` server already on :3000 was silently reused by Playwright, so a first "30 passed" ran against dev, not production (and showed 829 KB of JS). `E2E_PORT` now makes the config start its own server.
  - Not run: the fresh-reviewer subagent. T-010 is not a content, calculator or accessibility ticket (D17). Keyboard (skip link, link tab order) and 44 px targets are asserted; a VoiceOver pass belongs to T-025.
  - Screenshots read at all three sizes in light and dark; Thai tone marks (ปุ๋ย, ที่, น้ำ, เรื่อง) are correct.
- **Open for the owner:**
  - **Unknown URLs return HTTP 200, not 404.** With `cacheComponents` the status is fixed before `notFound()` runs (Next docs, loading.md "Status codes"); the page shows not-found and carries `noindex`. A real 404 needs a `proxy.ts` that checks the slug — a small architecture addition I did not make without asking. Say if you want it.
  - **New UI Thai (U1–U5)** in `docs/content/THAI-REVIEW.md` needs your ✅/✍️.
  - `npm audit` shows one moderate `yaml` advisory (stack overflow on deeply nested YAML). It was present before this ticket and only parses our own files at build time.
  - No iPad link yet: previews still need the two Vercel dashboard actions (T-003).

### T-011: Citation UI, ที่มาของข้อมูล section, soil-test note
- Status: done
- Depends on: T-007, T-010
- Goal: The reusable components that make every number traceable on screen.
- Acceptance criteria:
  - [x] An inline citation component linking a claim to its source entry and showing its tier badge
  - [x] A `ที่มาของข้อมูล` section rendered at the end of every chapter, reachable in one tap from anywhere in the chapter
  - [x] Every displayed Rate carries the visible soil-test / starting-point note
  - [x] `commercial`-tier citations are visually distinct from `official` / `research`
  - [x] Tier badges are not colour-only (they carry text or shape), and are announced by VoiceOver
- Test plan: e2e asserting every chapter route contains a `ที่มาของข้อมูล` heading and at least one citation. Contrast check on badges in light and dark. VoiceOver spot-check on iPad.
- Notes: Reviewer: yes (accessibility + content accuracy). This component is the PRD's §7 integrity rules made visible.
- **Verified:** typecheck, lint, 508 unit tests and the production build green; WebKit e2e green at iPad portrait, iPad landscape and Mac (run three times over against a fresh `next start` to rule out flakes). A fresh accessibility + content reviewer then found real problems; the ones that held up are fixed.
  - **Zero client JS added.** Everything is a server component, so the 180 KB budget is untouched (the budget test still passes).
  - Inline `<Cite>` shows the source name and a tier badge and links to its entry in the chapter's `ที่มาของข้อมูล` section. The tier is read from `sources.json`; an unknown marker fails the build. Overflow pills print a count (`+2`, `+3`) and never invent names.
  - **Tier is text + shape + border, not colour:** official ◆, research ●, commercial ▲ (dashed, warm). VoiceOver hears "ระดับแหล่งที่มา: …" before the tier; the shape is `aria-hidden`.
  - **`RateBlock` is the only way to show a Rate** and always carries the soil-test note. No rate renders yet (tables arrive in T-012/T-019/T-020), so this is guaranteed by construction and a test, but not yet seen on a real page.
  - The note's sentence is the pamphlet's own p3 wording, pinned character-for-character to the raw page.
  - **Review findings fixed:** the sticky "jump to sources" bar covered anchor targets and focused links (now `scroll-padding-top`, with an e2e that a clicked citation lands below it); inline citations read as a bare "doa" (now prefixed with `ที่มาของข้อมูล`, underlined so they aren't colour-only); the soil-note test would have passed a truncated sentence; nothing checked that inline citations are listed in the section or that the list has no duplicates; the `+2`/`+3` rendering, the shape mapping and the hidden-label position were unguarded; page ranges would have hidden a gap. Nine unit corruptions plus the earlier eight are each verified to fail.
  - **Deviation from the test plan:** ch06 (glossary) and ch07 (summary and quiz) have **no citations in the source**, so they show the heading and the source page only. The test plan's "at least one citation on every chapter" cannot be met without inventing one. Chapters 1–5 are asserted to cite.
- **Open for the owner:**
  - **ch05 lists sources for a table the site hides.** `cambridge` is cited only on p11 and `irri` mostly on p9–11, which looks like the Cambodian rice table (D11). They still appear in ch05's sources list. I did not filter them because I cannot tell from the data which cite backs which table. Say whether to drop them, or whether T-020 should decide.
  - **The soil-test sentence (U15 in `THAI-REVIEW.md`):** the wording is the source's, but its original context is "yellow leaves can have other causes, so test the soil". Keep it on every rate, or give me other wording.
  - New UI Thai U6–U14 (tier names and labels) in `docs/content/THAI-REVIEW.md` need ✅/✍️. `เชิงพาณิชย์` is the one I'm least sure of, since it also covers blogs and news.
  - Not done here, by design: a VoiceOver pass on a real iPad (T-025), and tables (T-012).

### T-012: Chapter 1 — what fertilizer is, N/P/K, nutrient groups (G1)
- Status: done
- Depends on: T-011
- Goal: The first chapter complete, cited, and readable with JavaScript disabled.
- Acceptance criteria:
  - [x] Chapter 1 prose renders from `ch01.mdx`; the p2 nutrient-group table (3 rows) renders from JSON
  - [x] Full lesson text present in the server-rendered HTML (verifiable with JS disabled)
  - [x] `nums` block listing the chapter's figures with citations, per the inherited pattern
  - [x] Thai tone marks correct at every size in both themes
- Test plan: e2e in all three viewports; screenshot comparison; load with JS disabled and assert the lesson text is present. Owner reads the chapter on an iPad.
- Notes: Reviewer: yes (content accuracy).
- **Verified:** typecheck, lint, 529 unit tests and the production build green; 129 WebKit e2e at iPad portrait, iPad landscape and Mac against a fresh production server. A fresh content-accuracy reviewer rendered PDF p2 and compared the table **cell by cell**: all 3 rows (group, elements, role), the column headings, the order, the punctuation and every `nums` figure are exactly the source's. It found no content error.
  - The p2 table renders from `content/data/nutrient-groups.json` through `components/SourceTables.tsx` as a real table: hidden caption, column headers, row headers, the page it came from beneath it. Only this table renders; a test fails if any other id (the symptom table, the Cambodian table, crops, glossary) starts rendering before its own ticket.
  - **`nums` block:** three figures, each a verbatim stretch of p2 with its own citation — the Fertilizer Act year (2518, `doa`) and the two mobility lists (`uga +2`). Pinned exactly in `lib/nums.ts` and `lib/chapter1.test.ts`. `ch01.mdx` gained one line, `<Nums chapter={1} />`; the rest is untouched and the zero-rewording test still passes.
  - **No-JS:** a WebKit context with JavaScript off shows the prose, the table, the figures and the sources, because everything is a server component. **Zero client JS added.**
  - **Thai:** screenshots read at all three sizes plus a 390 px phone, light and dark; tone marks and stacked vowels are correct. Tests assert table cell line-height ≥ 1.7× (the guard fails if the rule is removed, mutation-verified), no clipped cells, the Thai faces actually loaded, no horizontal scroll at the project viewport or 390 px, and ≥ 4.5:1 text and header contrast in both themes.
  - **Review findings:** the reviewer said JSON cell corruptions would pass; I ran them and they do not (the T-006 data tests anchor every row to the raw page, so rewording a role, `;`→`,`, swapping two roles and renaming a group all fail). It was right that four `nums` corruptions did pass (a figure cut to one word, swapped citations, a dropped `+2`); each is now a failing test. The e2e also now asserts the role cells and which source sits on which figure.
  - Found while testing: `overflow-wrap: anywhere` split English words in a 390 px column (`Macronu/trients`); now `break-word`.
- **Not in this ticket, by its criteria:** the p3 deficiency table (10 rows) still renders nothing in Chapter 1; it belongs to T-019. The "owner reads Chapter 1 on an iPad" step in the test plan is still yours: no iPad link exists until T-003's Vercel actions are done.
- **Open for the owner:** `docs/content/THAI-REVIEW.md` U16 and U17. `ตัวเลขที่ใช้ในบทนี้` says "numbers", but chapter 1's three items are a statute year and two rules, so a wider heading may fit better.

### T-013: Calculator logic (pure, no UI)
- Status: done
- Depends on: T-006
- Goal: A tested pure function: target nutrient + grade → kg of product, with the worked arithmetic.
- Acceptance criteria:
  - [x] `kg product = target nutrient × 100 ÷ %nutrient`, oxide-only, matching the source's form
  - [x] Reproduces the source's worked example exactly: N 10 kg/rai from urea 46-0-0 → ≈ 22 kg
  - [x] Reproduces the source's bag example: 50 kg of 16-20-0 contains 8 kg N and 10 kg P₂O₅
  - [x] Rai ↔ hectare conversion using the source's constants (1 ไร่ = 1,600 m², 1 ha = 6.25 ไร่)
  - [x] Returns the intermediate steps for display, not just the answer
  - [x] Rejects a 0% nutrient grade rather than dividing by zero; rejects negative targets
  - [x] **No elemental↔oxide conversion exists in the code at all**
  - [x] One unit test per crop row in the source table, asserting the function agrees with the published rate
  - [x] **(carried from T-007)** A test asserts no `actionable: false` Rate is reachable from the calculator's data queries. T-007 asserted this for `cropsFor` only, because the calculator did not yet exist. The per-crop suite above covers actionable crops only, so sugarcane, mango and pre-tapping rubber are expected to be absent from it by design.
- Test plan: Vitest, including the two source examples as exact-value tests, the division-by-zero and negative cases, and the per-crop suite.
- Notes: Reviewer: yes (calculator). This is the highest-consequence code in the project — a bug here hands a farmer a wrong dose (D10).
- **Verified:** typecheck, lint, 604 unit tests and the production build green; the 129 WebKit e2e still pass (no UI changed). Written test-first, then a fresh calculator reviewer attacked it.
  - **`lib/calculator.ts`** (pure, no Thai, no throws): `productFor` is `target × 100 ÷ %nutrient` and returns the steps as data (`multiply`, `divide`, `round`) so T-014 can render them in the source's own form. `nutrientsInBag`, rai↔hectare and kg/rai↔kg/ha use the pamphlet's 1,600 m² and 6.25. Failures are codes (`nutrient-unknown`, `target-invalid`, `grade-invalid`, `nutrient-zero`, `result-invalid`, `bag-invalid`) in a fixed, tested order. Both source examples are exact-value tests (≈22 kg; 8 kg N and 10 kg P₂O₅), and the reviewer re-read PDF p6 to confirm the formula, both examples and both constants.
  - **No elemental↔oxide conversion exists:** the nutrient type is only `n | p2o5 | k2o`; a scan with number boundaries rejects every common conversion factor in the calculator's files, and a whole-grid test asserts the result equals `target × 100 ÷ percent` *exactly*, so a factor hidden anywhere in the path changes a number and fails.
  - **`lib/calculator-data.ts`** is the only door from the crop table: it reads `cropsFor` (so non-actionable and Cambodian guidance are already gone), then keeps only per-area product rates. That yields 9 entries (rice clay and sandy basal grades at 20–25 kg/rai, urea 5–10 kg/rai on both, and cassava's CIAT line converted 500–600 kg/ha → 80–96 kg/rai). All 10 table rows are accounted for: rice ×2, cassava have per-grade tests with hand-computed nutrient supply (the reviewer recomputed every number); maize (grades, no rate), durian (per tree), sugarcane, mango, both rubber rows and vegetables are asserted absent.
  - **Review findings fixed:** `-0` passed validation and came out as `-0` (a UI would print "-0 kg"); a `null` grade threw instead of `grade-invalid`; `nutrientsInBag` returned `Infinity` with `ok: true` on overflow; the unknown-nutrient guard was untested because `ok === false` also held by accident; the factor scan missed `0.83;`, `2.3`, `1.2` and friends; the "traces to actionable guidance" check matched on wording alone.
  - **Mutation-tested:** 24 corruptions before the review and 13 after, plus the realistic `in`-instead-of-`includes` prototype-key bug; all fail except two equivalent mutants that were removed rather than kept (a redundant `p ≤ 100` check and a redundant `-0` clean). A type-level corruption (adding `"p"` to the nutrient type) is caught by `tsc`, not vitest.
  - **Rounding rule, mine, not the source's:** whole kg like the source's "≈ 22", except under 1 kg, which keeps one significant digit so a real dose is never shown as 0. A zero target is allowed and answers 0 kg (the criterion rejects only negative targets).
  - **Not capped:** an absurdly small percentage (0.0001%) gives a huge but finite product. The source gives no plausible range, so I invented none; T-014's input validation is the place to decide.
- **Open for the owner — please decide:** **cassava's CIAT regional rate is in the calculator's data.** It is 15-15-15 at 80–96 kg/rai, about 2–3× the Thai figure on the same row (25–50 kg/rai), which the site correctly refuses because only commercial sources back it. It reaches the calculator because T-007 kept the CIAT line actionable (REGIONAL scope, one `cgiar` citation). The reviewer and I both think a Thai grower's calculator should not offer it. Options: (a) leave it, (b) drop `REGIONAL` from `calculatorRates` (one line plus one test), or (c) keep it but have T-014 label it as regional guidance. I have not changed it, since T-007's decision was yours.

### T-014: Calculator UI
- Status: done
- Depends on: T-013, T-011
- Goal: A touch-friendly calculator that shows its working and its sources.
- Acceptance criteria:
  - [x] Inputs for target nutrient (kg/rai) and grade; grade selectable from the source's published list as well as free entry
  - [x] The worked arithmetic is displayed, not just the result
  - [x] All controls ≥ 44×44pt; numeric keypad triggered on iPad; fully keyboard-operable on Mac
  - [x] Invalid input produces a clear Thai message, never a crash or `NaN`
  - [x] Result carries the soil-test note and its citation
  - [x] Announced correctly by VoiceOver, including the result updating
- Test plan: e2e in all three viewports covering a valid calculation, a zero-nutrient grade, and a negative target. VoiceOver check on iPad. Screenshots both themes.
- Notes: Reviewer: yes (accessibility).
- **Verified:** typecheck, lint, 677 unit tests and the production build green; WebKit e2e green at iPad portrait, iPad landscape and Mac (the calculator spec run three times over). Test-first for the pure form logic; a fresh accessibility reviewer then found real problems.
  - **Where it lives:** the `<Calculator />` slot at the end of chapter 3 (the chapter about reading the three numbers on a bag). The form is a client island loaded as its own 2.4 KB chunk, so only chapter 3 pays for it; the form is in the server-rendered HTML, so there is no flash of a missing form. Real browser-loaded JS on ch03 is about 141 KB against the 180 KB budget.
  - **Inputs:** N / P₂O₅ / K₂O radios; the amount in kg/rai; the grade from a picker of the 20 bag grades printed on the pamphlet's p4 and p5 (in table order, straight fertilizers named by the pamphlet's Thai, rock phosphate and the organic "about" figures left out) or typed into three fields. Text fields with `inputmode="decimal"` raise the iPad's decimal keypad; Thai digits are accepted; Enter submits.
  - **The answer** is `ให้ใช้ ≈ 22 กก. ต่อไร่`, the source-form line `10 × 100 ÷ 46 ≈ 22 กก.`, and the working step by step. It appears only when asked for and disappears the moment any control changes, so an old dose is never left next to new inputs. It carries the soil-test note and `หน้าในเอกสารต้นฉบับ: 3, 6` (pinned to the raw pages).
  - **Errors** are Thai, specific, and never `NaN`: empty amount, not a number (with a hint about the decimal point), negative amount, blank or invalid grade, a 0% nutrient (e.g. P₂O₅ from urea), too large. The offending field gets `aria-invalid`, a heavier border (not colour alone), `aria-describedby` pointing at the message, and the cursor.
  - **Announcing:** a polite, atomic `role=status` region that is always in the page, plus a separate `role=alert`. Both replace their content on every submit, so pressing the button twice with identical input is still announced.
  - **Review findings fixed:**
    - The printed working could contradict itself: it rounded inputs and intermediates to two decimals while computing in full, so `22.499 kg` showed `2,249.9 ÷ 100 = 22.5` then `22.5 ≈ 22`, and `10.005` showed `10.01 × 100 = 1,000.5`. Inputs are now printed exactly as typed, an exact quotient is printed in full, and an inexact one gets two decimals or more only as needed for its last step to agree.
    - Testing that found a real bug in the calculator itself: `2.3 × 100` is `229.99999999999997` in floating point, so 2.3 kg N from a 20% product rounded **down** to 11 kg when the arithmetic is exactly 11.5 and the source's rounding gives 12. The rounding now cleans float noise first (and rounds sub-1 kg amounts half-up by decimal scaling, since `toPrecision` rounded 0.35 to 0.3). Regression tests cover it.
    - "Not a number" had the wrong message ("must not be negative"); it is now its own error.
    - Five corruptions passed the whole e2e suite, the worst being that switching the nutrient radio did not clear the answer. Each is now a failing test, alongside focus-on-error, re-announcing, and all three grade fields being flagged for a grade that sums over 100.
  - **My own tests caught two more:** the native `<select>` renders 26 px tall in WebKit (it ignores `min-height`; an explicit `height` fixes it), and the flagged-field style never applied because a more specific input rule overrode it.
  - **A WebKit bug found by a flaky test, and fixed.** A citations test that walks all seven chapters began timing out about a third of the time at `/th/ch03`: `readyState` stuck at `interactive`, `load` never fired, nothing outstanding. Bisected, not guessed: rendering nothing in the slot fixed it; running the component with empty markup fixed it; removing the native `<select>` fixed it; ASCII-only option labels fixed it; but fewer options, a static instead of lazy import, and removing the height rule did **not**. The cause is a native `<select>` that inherits the page's web font while holding Thai text. Giving the select the system font fixes it (0 failures in 80 navigations, against about 30% before). Two guards stay in the calculator spec: the select must not use the web font, and chapter 3 must reach `load` eight times in a row. I could not test real Safari, so a spinning tab there is unconfirmed, but the fix costs nothing visible.
  - **Mutation-tested:** about 45 corruptions across parsing, formatting, field mapping, picker contents, rounding, the working lines, state clearing, ARIA wiring, focus and height; all fail.
- **Not verified, needs a person:** VoiceOver on a real iPad (announcement of the result, the radio group, the picker) and a real finger on the keys. Mac Safari skips radios and buttons on Tab unless Option-Tab or the preference is on; the controls are all keyboard-operable otherwise. No iPad link exists until T-003's Vercel actions are done.
- **Open for the owner:**
  - **UI Thai U18 to U32** in `docs/content/THAI-REVIEW.md` (labels and error messages).
  - There is **no plausibility cap**: 0.0046% N gives `217,391 กก.` with no warning, because the source gives no plausible range and I invented none. Say if you want a warning above some amount.
  - A person who types before the form hydrates may lose that input on a very slow connection (a controlled field resets at hydration). It affects a tiny chunk on one chapter; I did not engineer around it.
  - The cassava CIAT question from T-013 does not touch this UI (the picker offers the printed bag grades, not the crop rates).

### T-015: NPK bag reader (2D)
- Status: done
- Depends on: T-014
- Goal: A legible 2D bag label whose three numbers are individually tappable.
- Acceptance criteria:
  - [x] Each of the three numbers is a ≥ 44×44pt tap target explaining N, P₂O₅, or K₂O
  - [x] Explanations come from the source, with citations
  - [x] Works by tap on iPad and click/keyboard on Mac; no hover-only reveal
  - [x] Label text is real DOM/SVG text — selectable, zoomable, and VoiceOver-readable
  - [x] Legible at iPad portrait width without horizontal scrolling
- Test plan: e2e tapping each number in all three viewports; keyboard tab-through on Mac; screenshots both themes.
- Notes: Deliberately 2D, not 3D — WebGL text on iPad is blurry, unselectable, invisible to VoiceOver, and untestable (D3).
- **Verified:** typecheck, lint, 685 unit tests and the production build green; WebKit e2e green at iPad portrait, iPad landscape and Mac. A fresh accessibility + content reviewer then rendered PDF p2 and p6 and compared every word and number: **no content error**; its findings were test gaps and a VoiceOver concern, now fixed.
  - **What it is:** in chapter 3, right under the paragraph that introduces the three numbers, a 2D bag label of the pamphlet's own example: **16-20-0, 50 kg** (p6). The numbers 16, 20 and 0 are big tiles; the N tile is already chosen so an explanation is on screen on arrival. Tapping or clicking a tile (or arrow keys) shows that nutrient's explanation, how much of it the bag holds, and `หน้าในเอกสารต้นฉบับ: 2, 6`.
  - **Everything shown is the pamphlet's:** the explanations are the p2 table's own phrases (`N = ใบเขียว โตเร็ว`, `P = ราก ดอก เมล็ด`, `K = ผลโต หวาน ต้นแข็ง ทนโรค`); the amounts are what the calculator works out for that bag (8 kg N, 10 kg P₂O₅, and none for K₂O), matching the pamphlet's "N 8 กก. P₂O₅ 10 กก. และไม่มี K"; the five strings it adds to `ui.json` are the pamphlet's own words, each pinned to the raw page. **No new UI Thai.**
  - **Built as native radios** styled as tiles, so touch, click and arrow keys all work with no hover and no script-only affordance; the label is real, selectable DOM text, not a canvas or image. Each tile is far over 44×44; text is large (number 40 px, symbol 17 px). A polite, atomic live region announces each choice. Zoom is allowed. A guard fails if any `:hover` rule appears on the reader.
  - **VoiceOver:** each radio has an explicit name, `N 16 เปอร์เซ็นต์`, and the visible symbol and number are hidden from assistive tech so a tile is not read twice; `เปอร์เซ็นต์` is added because the page shows no `%` sign and a VoiceOver user who lands on the group would otherwise hear only bare numbers.
  - **Reviewer's findings fixed:** two corruptions passed the whole e2e suite (the bag's printed weight read as 100 kg; `lang="en"` removed from the symbols) and the keyboard test only ever started from a script `focus()`. Each is now a failing test, with a markup-level check that the radios are reachable, in one group, with one tab stop.
  - **Mutation-tested:** about 28 corruptions (bag weight and grade, wrong wording, tile order, elemental symbol, default selection, live region, node replacement, page citation, tile and number size, a hover rule, non-selectable text, focus ring, zoom, selected-state fill, accessible name, group membership); all fail except two equivalent mutants (min-height is redundant because the content is already over 70 px; the browser itself allows one checked radio per group).
  - **A platform fact, not fixable here:** macOS Safari skips radios and buttons on Tab unless Option-Tab or Full Keyboard Access is on. Tab therefore cannot be driven in this WebKit, so the keyboard test uses focus plus arrow keys.
  - **Focus ring on `:focus`, not `:focus-visible`:** after arrow-key navigation between radios, this WebKit reports `:focus-visible` as false, which would leave a keyboard user with no ring. The cost is a ring after a mouse click on the already-highlighted tile.
- **Not verified, needs a person:** VoiceOver on a real iPad (the radio name, the live-region announcement, double-tap on a tile) and a real finger. That is what T-016 is for. No iPad link exists until T-003's Vercel actions are done.
- **Open for the owner:** two questions in `docs/content/THAI-REVIEW.md` — **Q1** the K₂O tile says `ไม่มี K` (the pamphlet's wording, with the element letter) rather than `ไม่มี K₂O`; **Q2** nothing tells a beginner the numbers are tappable, and fixing that needs new Thai (`แตะตัวเลขเพื่อดูความหมาย`).

### T-016: Phase A gate — owner review on a real iPad
- Status: todo
- Depends on: T-012, T-015
- Goal: Confirm the vertical slice is genuinely good on real hardware before building breadth.
- Acceptance criteria:
  - [ ] Owner has opened the preview on a real iPad in both orientations and confirmed Chapter 1, the calculator, and the bag reader
  - [ ] Thai register confirmed acceptable by the owner (D6)
  - [ ] Any issues found are logged as new tasks before P3 starts
- Test plan: Manual, owner-driven.
- Notes: **Stop-and-ask gate.** No P3 work starts until this passes.

---

## P3 — Breadth and interactives

### T-017: 3D foundation — R3F island, one-context discipline, WebGL fallback
- Status: done
- Depends on: T-016
- Goal: The 3D substrate: a client island that never leaks a WebGL context and degrades gracefully.
- Acceptance criteria:
  - [x] React Three Fiber island loaded only on routes that need it; three.js absent from all other route bundles
  - [x] DPR capped at 2
  - [x] **Exactly one WebGL context alive at a time**, explicitly disposed on unmount/route change — verified, not assumed
  - [x] When WebGL is unavailable, a static fallback renders and the lesson text remains fully readable
  - [x] `prefers-reduced-motion` disables idle animation
  - [x] 3D route ≤ 600 KB gzipped total
- Test plan: e2e navigating in and out of the 3D route repeatedly, asserting context count stays at 1 and memory does not climb. A test with WebGL disabled asserting the fallback and the text. Bundle-size assertion on both 3D and non-3D routes.
- Notes: Reviewer: yes. iPad Safari silently reloads pages under memory pressure — the disposal rule is the single most important line in the performance budget (D16). The prior art never disposed.
- **Verified:** typecheck, lint, 696 unit tests and the production build green; WebKit e2e green at iPad portrait, iPad landscape and Mac (309 tests), four full-suite runs in a row after the last fix. Built on the owner's explicit instruction to **skip the T-016 gate** ("skip the gate and start T-017"); any problem the iPad review finds will be fixed in code that now sits on top of the earlier work. A fresh reviewer read the foundation; its findings are fixed or carried to T-018 below.
  - **What it is:** `components/Scene3D.tsx` (lazy `next/dynamic`, `ssr:false`) → `components/Scene3DIsland.tsx` (the only place a WebGL context is created) with `lib/webgl.ts` (`MAX_DPR = 2`, a probe that releases its own context). Procedural placeholder `components/DemoScene.tsx` (an icosahedron, no assets) is shown only on two internal fixture routes, `/specimen-3d` and `/specimen-3d-b` (noindex, English sample text, like `/specimen`). No lesson page uses 3D yet; T-018 mounts the real scene and the fixtures can go.
  - **Found by testing, not assumed:** with `cacheComponents` Next keeps a visited route **mounted but hidden** (React `<Activity>`), so the canvas and its WebGL context survived navigating away — the exact leak D16 forbids. Fix: the island's route-active subscription is torn down when the route is hidden, which drops the `<Canvas>` and releases the context.
  - **Found by repeated full-suite runs:** React re-renders a hidden tree at low priority, so under load the old canvas lingered while the next route mounted (two live contexts, about 3 failures in 5 runs). Fix: the same cleanup now calls `forceContextLoss()` on the renderer synchronously. Four full runs in a row then passed. **This synchronous release has no deterministic test** — the race only appears under CPU load — so removing that one line would not fail a quiet run.
  - **Proven by e2e (all three viewports):** exactly one live context on the route and the probe's released; 6 leave/return laps never leave one alive off the route or two on it; 4 round trips between two 3D routes never have two contexts alive at once (measured at the moment each context is created); no WebGL → static fallback plus readable text; the browser taking the context back → fallback replaces the dead canvas; the probe passing but the real canvas failing → fallback, page survives (error boundary); idle animation runs by default and stops under `prefers-reduced-motion` (toggled at runtime), with a still first frame; a 3x display gets at most a 2x drawing buffer; the 3D route is ≤ 600 KB gzipped JS and does contain three.js (control); `WebGLRenderer` is absent from `/th`, ch01–ch03 and `/specimen`; the existing text-route ≤ 180 KB test still passes.
  - **Mutation-tested:** no release on hide, uncapped DPR, ignoring reduced motion, probe context not released, no fallback, no error boundary, no context-lost listener, no `isConnected`-style guard on the loss event — each fails a named test.
  - **Reviewer's findings:** fixed — dead `cappedDpr` removed, error boundary, context-lost fallback, `touch-action: pan-y` (was `none`, a one-finger scroll trap), same-size loading placeholder, 3D→3D overlap proven. `70vh` replaced by `70dvh` (the design-system guard caught it).
  - **Memory is only a proxy:** "memory does not climb" is checked as live contexts and rendered canvases staying flat across laps; WebKit under Playwright exposes no heap reading. A real-iPad check of Safari reloads under memory pressure still needs a person.
- **Carried to T-018 (reviewer):** (1) the text alternative — the p3 table — must be **server-rendered as a sibling** of the island, not passed as `fallback`: the island is client-only, so with JS off, while the chunk loads, or if the chunk fails to fetch, only the placeholder shows. (2) `role="img"` makes children presentational: selectable leaf regions must be DOM buttons **outside** the island, and the current selection should be announced by a live region outside it. (3) Gestures: `touch-action: pan-y` is set; a vertical drag gesture needs its own plan. (4) Keyboard users cannot rotate the plant; acceptable only if the table is the real alternative. (5) `Scene3D`'s `children(animate)` render prop is thin: T-018 will need `invalidate` for damped controls (reachable through `useThree`) and selection callbacks.

### T-018: Deficiency explorer (3D)
- Status: done (gesture and fps items need a real iPad, see below)
- Depends on: T-017
- Goal: A rotatable procedural plant where tapping old vs young leaves teaches the mobility rule.
- Acceptance criteria:
  - [x] Procedural geometry only — no glTF, no textures, no external assets
  - [~] One-finger rotate, pinch zoom, two-finger pan on iPad; drag, scroll/pinch zoom, click on Mac — **built, not proven on a finger; Mac scroll-zoom is Ctrl+scroll only (see below)**
  - [x] Old-leaf and young-leaf regions separately selectable, each ≥ 44×44pt in screen space
  - [x] Each selection shows the symptom and nutrient from the p3 10-row table, with citation
  - [x] The mobility rule (mobile → old leaves, immobile → young leaves) is stated explicitly
  - [x] All 10 symptom rows reachable
  - [x] A non-3D equivalent (the table plus text) is available and VoiceOver-navigable
  - [ ] Sustains 60 fps on iPad 9th-gen or newer — **not measured; needs a real iPad**
- Test plan: e2e selecting both leaf classes and asserting the correct symptom text, in all three viewports. Manual touch-gesture check on a real iPad plus an fps reading. Screenshots both themes.
- Notes: Reviewer: yes (accessibility + content accuracy). Best-backed interactive in the project (D15). The 3D is for the camera; the text alternative is not optional.
- **Verified:** typecheck, lint, 718 unit tests and the production build green; WebKit e2e green at iPad portrait, iPad landscape and Mac (350 tests), three full-suite runs in a row. A fresh reviewer (content, accessibility, gestures) found **no content error**; its one change request is done (below). Built after the owner's instruction to skip the T-016 gate.
  - **What it is:** in chapter 1, between the pamphlet's mobility sentence and the symptom table, a deficiency explorer. A 3-way choice (`ใบแก่` / `ใบอ่อน/ยอด` / `เอกสารไม่ระบุตำแหน่งใบ`) shows the pamphlet's own p3 lines for that group plus the mobility rule it came from (p2, quoted verbatim), with `หน้าในเอกสารต้นฉบับ: 2, 3`. Old leaves = N, P, K, Mg; young = S, Ca, Fe / Mn, B; the two rows the source does not place on a leaf class, **Zn and Cu / Mo, get their own third choice rather than a guess**. All 10 rows reachable. The p3 table now renders in full below it (the text equivalent, server-rendered, 10 rows, element then symptom, verbatim).
  - **The 3D plant** is procedural (a stem, three old leaves low, three young leaves at the tip; no assets). Tapping/clicking a leaf cluster picks that choice; the radios do the same without the plant, so it works with no WebGL, no touch, no pointer. The selected cluster is also scaled and lit (not colour alone). Each cluster has an oversized invisible hit area; its on-screen size is published and e2e checks ≥ 44 × 44 CSS px, at the default distance and fully zoomed out.
  - **Gestures:** drag rotates; pinch zooms; two-finger drag pans; a drag that starts on a leaf never counts as a tap (tap slop 6 px). Pure maths is in `lib/gestures.ts` with unit tests.
  - **Chapter 1 is now a 3D route.** three.js loads lazily after the text (its own chunk) and the page's measured JS is within the 600 KB 3D budget; the ≤ 180 KB text-route test now covers every other route, and three.js is asserted absent from them. The 180 KB figure no longer applies to ch01.
  - **Proven by e2e (all three viewports):** each choice shows exactly its own rows, verbatim, with the source's rule; all 10 rows reachable across the three choices; the table has 10 rows and is in the server HTML before any script; the p2 table is untouched; tapping the old / young leaves changes the choice (mouse everywhere, a real touch tap on iPad projects); region sizes; drag rotates and is not a tap; Ctrl + scroll zooms while plain scroll is left to the page; `touch-action: pan-y`; idle spin stops under reduced motion **and a redraw does not smuggle a spin step in**; no WebGL → note shown, choices, panel and table still work; one context while on ch01, none after leaving, one on return. Screenshots of light and dark at all three viewports were looked at.
  - **Mutation-tested:** tiny hit area, drag counted as a tap, plain scroll swallowed, spin ignoring reduced motion (first survived; the redraw-step assertion killed it), unplaced showing the wrong rule, a dropped table row, `touch-action: none`, wrong default choice, swapped old / young mapping (unit) — each fails a named test.
  - **Reviewer's change, done:** `defSceneLabel` originally said old leaves are at the bottom and young at the top — a botany claim the pamphlet never makes. It now reads `ภาพวาดต้นพืชสามมิติ ลากเพื่อหมุน` ("3D drawing of a plant, drag to rotate"). The leaf positions in the picture are a drawing, not a pamphlet claim.
  - **Deliberate deviation, for the owner:** the ticket says "scroll/pinch zoom" on Mac. Plain scroll **does not** zoom, because a mouse or trackpad scroll over a 4:3 box would hijack the page; zoom is Ctrl + scroll (how browsers report a trackpad pinch) and Safari's own pinch gesture. Say if you want plain scroll to zoom.
  - **Known limits, only a real iPad can settle:** (1) with `touch-action: pan-y` a one-finger **vertical** drag scrolls the page instead of rotating (chosen so the plant can never trap a scroll; rotation starts on a horizontal drag); (2) a two-finger **vertical** pan is probably taken by the page too, so pan may only work sideways; (3) pinch and two-finger pan are implemented with pointer events and untested on a finger — WebKit under Playwright cannot do multi-touch; (4) **60 fps on an iPad 9th-gen has not been measured**; (5) VoiceOver on the radios, the live panel and the table has not been run.
  - **Open for the owner:** five new Thai strings U33–U37 in `docs/content/THAI-REVIEW.md` (`เลือกตำแหน่งใบ`, `เอกสารไม่ระบุตำแหน่งใบ`, `เอกสารไม่ได้ระบุว่าธาตุกลุ่มนี้แสดงอาการที่ใบแก่หรือใบอ่อนก่อน`, `ภาพวาดต้นพืชสามมิติ ลากเพื่อหมุน`, `เครื่องนี้แสดงภาพสามมิติไม่ได้ ใช้ตัวเลือกด้านบนและตารางด้านล่างแทน`); and the `ใบอ่อน/ยอด` choice sits over rows about fruit and flowers (Ca, B) — the grouping is the source's own, by element, but the label may read oddly. The amber "selected" glow turns green leaves yellow, which a beginner could read as "this is what deficiency looks like".

### T-019: Chapters 2–3 — deficiency and fertilizer types (G2, G3)
- Status: done
- Depends on: T-012, T-018
- Goal: The two strongest chapters, with their four source tables rendered and cited.
- Acceptance criteria:
  - [x] Deficiency chapter renders the p3 symptom table (10 rows) and links to the explorer
  - [x] Types chapter renders organic NPK (5), straight fertilizers (7), compound grades (6), and soil conditioners with lime equivalence (4)
  - [x] All requested types present: urea, AS, DAP, TSP, rock phosphate, KCl, K₂SO₄, compound, slow-release, foliar, lime, marl, dolomite, gypsum
  - [x] Tables readable at iPad portrait width without horizontal scroll
  - [x] Every row cited; tier badges shown
- Test plan: e2e asserting row counts per table and the presence of each named fertilizer type. Screenshots at all three sizes.
- Notes: Reviewer: yes (content accuracy).
- **Verified:** typecheck, lint, 765 unit tests and the production build green; WebKit e2e green at iPad portrait, iPad landscape and Mac (377 tests), two full runs. A fresh content reviewer compared all 22 rows with the raw pages p3–p5: **no content defect**.
  - **Mapping, decided:** the ticket says "deficiency chapter" and "types chapter", but in this repo deficiency (G2) is Chapter 1 and fertilizer types are Chapter 2. The p3 symptom table (10 rows) and the explorer were delivered in **T-018** (the table sits directly under the explorer in ch01), so T-019 adds the four fertilizer tables to **ch02**. Nothing was needed in ch03 (bag reader and calculator).
  - **What renders in ch02:** organic NPK (5 rows, p3), straight fertilizers (7, p4), compound grades (6, p5), soil conditioners with lime equivalence (4, p5), each from the JSON, in the source's row order, with the pamphlet's own column headings, a screen-reader caption (its section title), a row header, and the page named under it. Prose already named every type the ticket lists (urea, AS, DAP, TSP, rock phosphate, KCl, K₂SO₄, compound, slow-release, foliar, lime, marl, dolomite, gypsum); a test pins each name.
  - **A real defect found by the tests:** a JSON number cannot keep a trailing zero, so compost (printed `1.5-0.4-1.0`) would have shown as `1.5-0.4-1`; the old row test could not see it because `1.5-0.4-1` is a substring of the printed token. The organic file now carries the printed form (`npkText`), validated against the numbers and pinned token-for-token to the raw page.
  - **Citations:** each row shows exactly the markers the data attaches to it, as the same linked chips with tier badges the prose uses; every one resolves to ch02's sources list. **"Every row cited" is honest only as "every row names its pamphlet page":** ammonium sulphate, DAP, TSP, rock phosphate, gypsum and most compound rows carry no printed marker, so they show none. The row-to-marker mapping (urea→phys, KCl and SOP→nutrien-ekonomics, marl/dolomite→ku, slaked lime→ku + bansuanporpeang, pre-flowering→sotus + tratruamkaset) follows the pamphlet's marker order and was never confirmed against a rendered PDF (no PDF in the repo). The organic rows' `doa` rests on the printed line "ที่มาของตัวเลข: กรมวิชาการเกษตร", a table-level source.
  - **Layout:** no table and no page scrolls sideways at iPad portrait, iPad landscape or Mac; Thai has room for stacked vowels; a grade never breaks across lines (it did: `18-46-` over `0`, fixed with a nowrap grade column and a line-count test). The compound table's first cell is a list such as `15-15-15 / 16-16-16`, as the pamphlet prints it.
  - **Mutation-tested:** dropped citation chips, compost shown from the number, a dropped row, a corrupted DAP grade, a corrupted marl factor, a mismatched `npkText`, a wrong heading, and the nowrap rule (the first attempt hit the wrong CSS rule; redone) — each fails a named test.
  - **New Thai: none.** All headings are the pamphlet's header words; the four captions are its section titles. The only new key text is not Thai (`N-P-K (%)` is inlined, as the pamphlet prints it).
  - **Open for the owner:** (1) DAP's use cell reads `ปุ๋ยรองพื้น (นิยมในกัมพูชา)` — the pamphlet's own words, but a Cambodia mention inside a Thai-audience table (D11); keep or cut? (2) three of the cited rows show a **commercial** tier badge (urea, KCl, SOP, pre-flowering), which is honest but may surprise; (3) whether a beginner will read the compound table's `สูตร` cells as one formula; (4) confirm the row-to-marker mapping against the PDF.

### T-020: Crop matcher (G6)
- Status: done
- Depends on: T-019
- Goal: Pick one of 8 crops, see type, rate, and timing with citation and tier.
- Acceptance criteria:
  - [x] All 8 crops selectable: rice, corn, cassava, sugarcane, rubber, mango, durian, vegetables
  - [x] Data from the p12–13 table (10 rows); rates shown as ranges with the soil-test note
  - [x] `commercial`-tier-only rates shown as descriptive text, not as actionable numbers
  - [x] No `KH`-tagged row is reachable
  - [x] Keyboard and touch operable; no hover-only reveal
  - [x] **(carried from T-007)** A crop for which `cropsFor()` returns no actionable guidance (sugarcane, mango, both rubber rows) shows an explicit "no reliable source" state with its descriptive text from `cropsForReading()`, instead of rendering a crop with no advice.
- Test plan: e2e cycling all 8 crops, asserting the rate matches the JSON and that the KH table is unreachable. Unit test on the tier-filtering query.
- Notes: Reviewer: yes (content accuracy). Mango's rate is per-tree (1–2 kg/tree), not per-rai — the UI must not assume every rate shares a unit.
- **Verified:** typecheck, lint, 790 unit tests and the production build green; WebKit e2e green at iPad portrait, iPad landscape and Mac (436 tests), two full runs. A fresh content + accessibility reviewer checked every crop against the raw p12–13 table: **no number, grade, unit, stage or source attached to the wrong place**. Its findings were about how two things read, now partly fixed (below).
  - **What it is:** in chapter 5 (the matcher's chapter, G6) a choice of the eight crops (`ข้าว`, `ข้าวโพด`, `มันสำปะหลัง`, `อ้อย`, `ยางพารา`, `มะม่วง`, `ทุเรียน`, `ผัก`) as real radios, rice already shown. The 10 rows of the p12–13 table are covered exactly once (rice = clay + sandy rows, rubber = before + after tapping). Each shows `ปุ๋ยรองพื้น` / `ปุ๋ยแต่งหน้า`, the source's wording, tier-badged sources and the soil-test note.
  - **Language, decided:** the table is printed in **English** and D6 forbids new agronomic Thai, so each item shows the source's wording as printed (marked as English), plus a structured line built from the data: `สูตร` and `อัตราอ้างอิง <range> <source's own unit>`. Nothing is translated. A per-tree rate says `kg/tree`; a rate with no number (maize, "by soil test") shows none.
  - **The tier filter (D9), derived not listed:** numbers appear only for guidance the data layer marks actionable (via `cropsForReading`, which already drops Cambodian guidance); the rest is the source's text under `ข้อความอ้างอิง (ไม่ใช่ตัวเลขที่แนะนำ)` with no structured figure. A crop whose rows have no actionable guidance says so in words (`ยังไม่มีแหล่งที่เชื่อถือได้พอ…`). The derived list is **sugarcane, rubber (both rows), mango and vegetables**; the ticket named the first three groups but not vegetables, which has the same property (unattributed + Cambodian-survey backing only).
  - **Sources:** each chip shows a name and tier. A marker links to chapter 5's sources list only if the list has it; cassava's dolomite marker (`blogspot`) is printed on p5, not p12–13, so it shows name and tier **without a link** rather than a dead one. Named-only sources (TAS 4401-2008, Rice Department, …) show name and tier, unlinked. **`irri` and `cambridge` were removed from chapter 5's list** (they only backed the hidden Cambodian rice table, so the list named sources nothing visible cited — the open item from T-019); a test fails if the list names a source no figure links to.
  - **Two reviewer points fixed:** a figure the source calls regional now carries a visible `regional` tag, so cassava's number is not read as the Thai rate; and only the crop's name (plus the no-source warning) is announced on a change, not the whole panel (the long panel is no longer a live region).
  - **Proven by e2e (all three viewports):** all 8 crops cycled with each item's wording, actionable flag, range and unit read back and checked against the JSON directly (not through the app's own filter); the no-source state on exactly the right crops with zero numbers; the soil-test note once per panel; no Cambodian wording under any crop and no table on the page; per-tree and no-number cases; chips resolve to the list; the list names no orphan; arrow-key and touch operation; tap targets ≥ 44 px; no `:hover` rule on the matcher; the radios and the rice panel are in the server HTML; no sideways scroll; no console errors.
  - **Mutation-tested:** figures on descriptive items, a missing soil-test block, a hard-coded unit, every chip linked, the actionable filter inverted, Cambodian guidance relabelled Thai, a crop dropped, `irri` put back — each fails a named test.
  - **Open for the owner — please decide:** (1) **Cassava** shows one number: a CIAT *regional* 500–600 kg/ha (about 80–96 kg/rai, roughly 3× the descriptive Thai 25–50 kg/rai). It is actionable by D9 and labelled regional, but a beginner could still read it as the rate; options: leave, drop the REGIONAL row (one line + one test), or add a sentence (new agronomic Thai, yours to write). (2) **Vegetables**: the only named source is a Cambodian working paper; it is not tagged Cambodian so it passes D11, and is shown as reference text only with that source named. Keep, or hide the crop? (3) **English items**: translate them yourself, or keep them as printed? (4) New Thai **U38–U40** in `docs/content/THAI-REVIEW.md`. (5) `ยางพารา` is the p5 word for the group, not a p12 row label.
  - **Not verified:** VoiceOver on a real iPad; the matcher's contrast of the muted reference text was not measured (T-025).

### T-021: Quiz with `localStorage` progress (G7 review)
- Status: done (VoiceOver on a real iPad is T-025)
- Depends on: T-019
- Goal: The 6 verbatim source questions, with progress surviving a reload.
- Acceptance criteria:
  - [x] All 6 Thai questions from p6–7 verbatim; no invented questions
  - [x] Progress persists across reload via `localStorage`; no accounts, no network calls
  - [x] Every `localStorage` read and write wrapped so private browsing or blocked storage cannot throw
  - [x] Works fully with storage unavailable, just without persistence
  - [x] Keyboard and touch operable; results announced by VoiceOver
- Test plan: e2e answering, reloading, and asserting persistence; a second run with storage blocked asserting no crash. All three viewports.
- Notes: Reviewer: yes (accessibility). No new questions without going through the D8 gate.
- **Verified:** typecheck, lint, 814 unit tests and the production build green; WebKit e2e green at iPad portrait, iPad landscape and Mac (45 quiz tests, full suite below). A fresh accessibility + correctness reviewer found **no content problem** and five accessibility problems, all fixed (below).
  - **What it is:** in chapter 7, under `แบบทดสอบ:`, the pamphlet's six questions word for word, as a numbered list. The source prints answers and **no wrong options**, so nothing could honestly be graded: each question has `ดูคำตอบ`, the answer, and two marks (`ตอบถูก` / `ยังไม่ถูก`) you set yourself. The score line says `ทำเครื่องหมายว่าตอบถูก 2 จาก 6` (plus `· ยังไม่ถูก 1`): your own marks, not a grade. Questions and answers come from ch07's frontmatter untouched. No new questions (D8).
  - **Progress:** the marks (and nothing else: no answers, no name, no time) are saved on this device in `localStorage` under `fertilizer-quiz-v1` as `{"v":1,"marks":[…]}`, and restored after a reload with every answer closed. No cookies, no request to any server (an e2e test watches the requests while marking).
  - **Storage can be unavailable:** every read, write and remove is wrapped. e2e runs the quiz with storage that throws on every access, with writes that throw (full / private), and with `localStorage` missing: no console or page error, marking and reset work for the visit, and a reload starts clean. A corrupt saved value (not JSON, another version, wrong length) is ignored and the quiz starts fresh.
  - **Reviewer's accessibility findings, fixed:** the ✓ / ↻ marks were CSS glyphs that VoiceOver would read aloud — now real text (`· ตอบถูก`) beside the question, which also shows the state with the answer closed; the list numbers 1–6 were not drawn because a grid `<li>` loses its marker — fixed and tested; the mark group was named just `คำตอบ` — now named by its own question; a `ยังไม่ถูก` mark changed nothing in the status line so nothing was announced — every mark kind now changes it; Latin-only answers (`N`, `Fe`, `K₂SO₄`) are marked English. Reset now writes empty progress over the saved copy rather than removing it, so a refused remove cannot bring old marks back.
  - **Proven by e2e:** the six questions word for word and in the server HTML; each answer is the pamphlet's, closed until asked; marks, take-back and score; reload persistence; reset; no network and no cookie; the three blocked-storage modes; three corrupt-value cases; keyboard (Enter, Space); every button ≥ 44 px; no sideways scroll.
  - **Mutation-tested:** unwrapped read, unwrapped write, never persisting, no length check, answers always open, `aria-pressed` removed, score not live, a reworded answer, the list back to grid, the "not yet" count dropped from the score line, the group not named by its question — each fails a named test.
  - **Not verified:** what VoiceOver actually says, and a real finger on an iPad (T-025 / T-016). The e2e checks the roles, names and live-region attributes, not the speech.
  - **Open for the owner:** the eight new strings U41–U48 in `docs/content/THAI-REVIEW.md`; whether `ทำเครื่องหมายว่าตอบถูก X จาก 6` reads naturally.

### T-022: Basal vs top dressing — static annotated diagram (G5)
- Status: done (VoiceOver read-through needs a real iPad)
- Depends on: T-019
- Goal: An honest labelled diagram of ปุ๋ยรองพื้น vs ปุ๋ยแต่งหน้า.
- Acceptance criteria:
  - [x] Static SVG diagram, no time slider, no animation
  - [x] Both terms defined from the source (§2.7, p5) with citation
  - [x] Thai rates shown where the source gives them (basal 20–25 kg/rai; urea top-dress 5–10 kg/rai) with soil-test note
  - [x] Diagram text is real SVG text, VoiceOver-readable, with a text alternative
- Test plan: Screenshots all three viewports and both themes; VoiceOver read-through.
- Notes: Deliberately demoted from the original scrubbable timeline — four lines of source support a picture, not an animation (D15). Cambodian rice timing detail stays excluded (D11).
- **Verified:** typecheck, lint, unit tests and the production build green; WebKit e2e green at iPad portrait, iPad landscape and Mac. A fresh content + accessibility reviewer found the pamphlet's words exact and the rates correct; its five findings were real and are fixed (below). Screenshots of light and dark at iPad portrait were looked at.
  - **What it is:** in chapter 2, under the §2.7 bullets, a static picture: two stacked panels, `ปุ๋ยรองพื้น` over `ปุ๋ยแต่งหน้า`, each with the pamphlet's own three or four phrases (`ใส่ก่อนหรือพร้อมปลูก`, `เน้น P และ K`, `เช่น 16-20-0 หรือปุ๋ยคอก`; `ใส่ระหว่างที่พืชเติบโต`, `เน้น N และแบ่งใส่หลายครั้ง`, `เช่น ยูเรียตอนข้าวแตกกอหรือตั้งท้อง`) split only at its own spaces, a test rejoining them to the bullets and to p5. Under each go the Thai rice rates from the data: basal `20–25 kg/rai` with the clay and sandy grade lists, urea `46-0-0` `5–10 kg/rai` for both soils, then the soil-test note. No slider, no animation, no time scale, no durations the source does not give. Cambodian rice timing is excluded (D11): only Thai-scope, per-area guidance can appear, and a test fails on `kg/ha` or `kg/tree`.
  - **Real SVG text and a text alternative:** every word is an SVG `<text>` (selectable, scales, follows the theme; text contrast ≥ 4.5 in light and dark is asserted). The figure is one named image (`role="img"`, title + description) whose description carries every word, one sentence per panel, so VoiceOver reads it without stopping between `เช่น` and its example. Honestly: `role="img"` means VoiceOver reads the description, not the individual `<text>` nodes.
  - **Reviewer's findings, fixed:** the description split `เช่น` from its example with a full stop (and the example sat orphaned on its own line) — now one line and one sentence; the source chips under the figure were a union that implied Rice Department for the sandy row — each rice row now lists its own sources and page (Rice Department and TAS 4401-2008 on the clay row, FAO on the sandy row), and the definitions' page 5 is stated separately; the rate text rendered at about 13 px — now 16 units, asserted ≥ 15 px on screen; fixed element ids — now unique per diagram; the arrow's head touched the panel and implied a sequence the source does not state — **removed** (two panels, read top to bottom, nothing drawn between them).
  - **Mutation-tested:** an animation element, no soil-test note, `role="img"` removed, a reworded definition, a tiny font, a changed rate in the data, an arrow added back, sources merged across rows, the description split again — each fails a named test.
  - **Citation, honestly:** §2.7 prints no marker, so the definitions carry the page (`ปุ๋ยรองพื้น / ปุ๋ยแต่งหน้า: หน้าในเอกสารต้นฉบับ: 5`); the chips belong to the rates (p12), not to the definitions.
  - **Not verified:** a VoiceOver read-through on a real iPad (the ticket's test plan; T-025).
  - **New Thai: none.** All words are the pamphlet's, or existing keys (`สูตร`, `อัตราอ้างอิง`, `หน้าในเอกสารต้นฉบับ`). **Open for the owner:** the diagram shows rice rates only, because they are the only per-area Thai rates for basal and urea; whether to say so in a caption is your call.

### T-023: Chapters 4 and 7 — safe use, storage, mistakes, environment (G7)
- Status: done (one claim-level gap left for you, see below)
- Depends on: T-019
- Goal: The safety chapter complete, including the 4R framing and the 6 common mistakes.
- Acceptance criteria:
  - [x] 4R (right source, rate, time, place) presented from the source
  - [x] All 6 common mistakes present; storage and safety guidance present; eutrophication caution present
  - [x] Every claim cited
- Test plan: e2e asserting 6 mistake entries and the 4R section; screenshots.
- Notes: Reviewer: yes (content accuracy).
- **Verified:** typecheck, lint, unit tests and the production build green; WebKit e2e green at iPad portrait, iPad landscape and Mac. A fresh content reviewer compared chapter 4 and chapter 7's summary with p06/p07: **no word, number or unit changed**; the six mistakes are the source's six, in order; page 6 is right for every block.
  - **What changed:** chapter 4's text was already the pamphlet's, so this ticket gives it structure without touching a word. It is now five named blocks in the source's order: `หลัก 4 ถูก (4R)`, practice (rice field, field crops, fruit trees, moisture), safety and storage, the six common mistakes, and the environment caution; chapter 7's six-point summary is one block. Each block states `หน้าในเอกสารต้นฉบับ: 6`, and a test confirms each block's words really are on that page and that **no prose sits outside a block**. Safety, mistakes and environment are drawn as warnings (text ≥ 4.5:1 in light and dark, asserted).
  - **4R:** the pamphlet's own line, `หลัก 4 ถูก (4R): ถูกชนิด ถูกอัตรา ถูกเวลา และถูกที่`, in its own block. **Six mistakes:** one list item each (`ใส่มากจนปุ๋ยไหม้`, `โรยยูเรียทิ้งบนผิวดิน` with the MSU Extension figure 30–44% / under 5%, `ใส่ N ครั้งเดียว`, `ไม่แก้ดินกรด`, `เผาฟาง`, `ซื้อ "ปุ๋ยวิเศษ"`). **Storage and safety:** gloves and mask, dry place on a platform, away from food, children, animals and fuel, urea bag sealed. **Eutrophication:** `N และ P ที่ไหลลงน้ำทำให้สาหร่ายบลูมและปลาตาย …` with the water-body warning.
  - **"Every claim cited", honestly:** the pamphlet prints outside markers for only two claims (rice field → FAO, field crops → OAE; both official), and both show as linked tier-badged citations. Every other claim has only the pamphlet page. Rather than let a page number read as a checked source, the four blocks with no marker (4R, safety, mistakes, environment) and the chapter 7 summary now say so in words (`เอกสารต้นฉบับไม่ได้ระบุแหล่งอ้างอิงภายนอกสำหรับข้อความนี้`), and a test fails if that line is missing from a block with no marker or present on one with a marker.
  - **Mutation-tested:** a bullet moved outside a block, a wrong page, a mistake dropped, the warning tone removed, a citation removed, a summary point reworded (`3 ปี` → `2 ปี`) — each fails a named test.
  - **Open for the owner:** (1) **The N-loss figure** (30–44% / <5%) is attributed in the pamphlet's text to `MSU Extension EB0209` but that document has **no entry in the sources list and no tier**; adding one means choosing its tier (a university extension document reads as `research`), so it is yours (`docs/content/TIER-REVIEW.md`). (2) `กลบยูเรียทุกครั้ง` (summary point 4) is stronger than the mistakes list, which says watering in also works; both are the pamphlet's words. (3) THAI-REVIEW rows 1 (`สาหร่ายบลูม`), 5 (`แคร่`) and 7 (the document ID) are unchanged. (4) New Thai: U49.
  - **Not verified:** a real-iPad look at the warning blocks; the chapter-4 text is not independently fact-checked beyond the pamphlet (that would need sources the owner approves, D6/D8).

---

## P4 — Hardening

### T-024: Enforce the performance budget in CI
- Status: done (one decision for you below: which "throttled 4G")
- Depends on: T-023
- Goal: The budget becomes a build failure rather than an aspiration.
- Acceptance criteria:
  - [x] CI fails when a text route exceeds 180 KB gzipped JS or a 3D route exceeds 600 KB
  - [x] Font files asserted ≤ 60 KB woff2 each
  - [x] Lighthouse run in CI: performance ≥ 90, accessibility = 100
  - [x] LCP < 2.0 s on a throttled 4G profile for text routes
  - [x] Measured page weight for every route recorded in the task notes
- Test plan: Deliberately exceed a budget on a scratch branch and confirm CI fails.
- Notes: D16. Report the final page weights to the owner.
- **Verified locally:** typecheck, lint, 852 unit tests and the production build green; WebKit e2e green (556 tests, three viewports); the Lighthouse script run against the production build.
  - **What was added:** `.github/workflows/ci.yml` (typecheck, lint, unit, WebKit e2e, Lighthouse; fails on any); `lib/budget.ts` (one list of every route and its kind, text or 3D, plus the three budget numbers); `e2e/budget.spec.ts` (loads every route in WebKit, measures each response, fails over budget, checks three.js is on exactly the 3D routes, writes `test-results/page-weights-<project>.json`); `scripts/lighthouse.mjs` + `npm run perf:lighthouse` (`lighthouse` 13.5.0 and `chrome-launcher` as dev dependencies); unit tests `lib/budget.test.ts` (a new page under `app/` or a new chapter with no budget entry fails) and `lib/ci.test.ts` (a dropped CI step, a loosened number or a `|| true` fails). The font cap (60 KB each) was already a unit test and stays one.
  - **Failure demonstrated:** a scratch copy with three.js imported into the shared layout fails `e2e/budget.spec.ts` with `/th (text) ships 330.0 KB gzipped JS, over its 180 KB budget` and `/th is "text"` (three.js on a text route). Dropping the e2e step, loosening the accessibility budget to 90, and adding `|| true` to a CI step each fail `lib/ci.test.ts`. Running Lighthouse with `LH_STRICT_SLOW=1` exits non-zero with `BUDGET FAILED`.
  - **Page weights (gzipped JS as a WebKit browser loads it, including lazy chunks):** `/th` 150.6 KB · ch01 **391.1 KB** (3D route, budget 600) · ch02 150.6 · ch03 154.0 · ch04 150.6 · ch05 150.6 · ch06 150.6 · ch07 152.0 · `/specimen` 134.3 · `/specimen-3d` 380.5 (3D) · `/specimen-3d-b` 377.3 (3D). Text routes use 84–86% of their 180 KB (about 26–29 KB left). CSS is 3.0 KB gzipped on every route; HTML 2.7–15.5 KB (ch02 is the largest). Fonts: six woff2 files, each ≤ 12 KB.
  - **Lighthouse (production build, mobile profile, median of 3, Chrome):** performance 97–99 and accessibility **100** on all eight lesson routes (home + ch01–ch07). LCP on the DevTools **Fast 4G** preset (9 Mbit/s, 150 ms RTT, 4× CPU): 1.4–1.5 s on every text route — under 2.0 s.
  - **Two real defects Lighthouse found and the ticket fixed:** (1) chapter 5 scored accessibility 98 — `heading-order`: the crop matcher's headings jumped from h1 to h3; they now run h2 (crop), h3 (row, only for two-row crops), then the stage, never skipping a level (an e2e test checks every crop); (2) the three Latin font files were not preloaded, so they arrived after the stylesheet and re-rendered the text — a layout shift of 0.23 and performance 86 on chapter 4; all six faces are now preloaded (a test pins it).
  - **Decision for you — which "throttled 4G"?** The ticket says LCP < 2.0 s on "a throttled 4G profile" without naming one. On Lighthouse's own **slow-4G** preset (1.6 Mbit/s, 150 ms RTT, 4× CPU) the text routes' simulated LCP is **2.1–2.6 s**, i.e. the budget is **not met** there; the cost is moving about 220 KB (scripts 150 KB + fonts 62 KB) over a 200 KB/s link, not any one slow resource (the in-browser breakdown is a few milliseconds). I enforce **Fast 4G** (a named DevTools preset; 1.4–1.5 s) and record the slow-4G figure in every report; `LH_STRICT_SLOW=1` makes slow 4G fail the build. Meeting 2.0 s on slow 4G would need roughly 40–50 KB less JavaScript before the first paint, a larger change (and it would not be the 180 KB budget that moves). Say which you meant.
  - **CI ran, and found a third real defect:** the first GitHub Actions run (Ubuntu runner) passed typecheck, lint, unit tests and the full WebKit e2e, then **failed Lighthouse: chapter 1 scored 83** (budget 90; locally 98). Cause: the 390 KB three.js chunk was fetched and parsed on arrival although the plant is about 1,100 px down on a phone; a slower machine feels that. Fix: `NearViewport` loads the plant only when it is within 200 px of the screen, so a phone reader who has not scrolled that far downloads none of it, while on iPad and desktop (where the plant is already in the first screen) it loads at once. The second run, on GitHub's runner, **passed everything**: performance 96–99, accessibility 100 on all eight routes, LCP (Fast 4G) 1.36–1.67 s. Tests: three.js is absent on arrival in a short window and fetched once the plant is scrolled to; the radios and table work before the plant has loaded; the budget spec reads each route to the end (worst case) before measuring.
  - **Caveats:** Lighthouse is Chromium and the site's target is WebKit, so scores describe the network and the bytes, not Safari's rendering; the lab server is `next start` over HTTP/1.1 on localhost, which makes six parallel connections the limit, unlike Vercel's HTTP/2, so real LCP on the live site is probably better, not worse (not measured: there is no preview URL). CI uses Node 26 (local is 26.0.0) and the runner prints deprecation notices for the v4 actions (Node 20) and for the coming Ubuntu 26 label; neither fails anything. Page weights for non-lesson responses (HTML etc.) were measured as served, not on a CDN.

### T-025: Accessibility audit
- Status: done for everything a machine can check; the manual iPad VoiceOver pass and a real keyboard Tab pass are yours (checklist below)
- Depends on: T-023
- Goal: Full keyboard and VoiceOver usability across every route and interactive.
- Acceptance criteria:
  - [x] Every interactive reachable and operable by keyboard alone on Mac
  - [x] VoiceOver labels on all controls and both 3D scenes, each with a text alternative
  - [x] Contrast passes in light and dark for all text and all tier badges
  - [x] No information conveyed by colour alone
  - [x] `prefers-reduced-motion` honoured everywhere
  - [x] Axe reports zero violations on every route
- Test plan: Automated axe sweep over all routes, plus manual VoiceOver pass on a real iPad and keyboard-only pass on Mac.
- Notes: Reviewer: yes (accessibility).
- **Verified:** typecheck, lint, 850 unit tests and the production build green; WebKit e2e green at iPad portrait, iPad landscape and Mac (883 tests). A fresh accessibility reviewer read the audit; every finding it raised that could be tested was, and the tests found **four real defects** (below). Not verified, and cannot be here: VoiceOver on a real iPad, and real Tab-key navigation (Playwright's WebKit cannot Tab onto radios and buttons: macOS Safari skips them unless Option-Tab or Full Keyboard Access is on).
  - **Axe, zero violations (`e2e/a11y.spec.ts`):** axe's default rules with best-practice included, nothing disabled and nothing excluded, over every route in `lib/budget.ts` and every state a reader can reach: the plant drawn, each deficiency choice, the calculator with a result and with every error showing, each bag tile, all eight crops, the quiz with an answer open and marked, and the 3D page with WebGL unavailable; in light and dark; at three viewports.
  - **What axe cannot see, tested separately (`e2e/a11y-behaviour.spec.ts`):** on every route, every control is natively focusable, none has a positive tabindex, and each one *looks different when focused* (compared with itself unfocused; a permanent shadow would not pass); the ring is at least 2 px; nothing looks clickable but is not a control; with `prefers-reduced-motion` nothing animates or eases; no script in the code scrolls smoothly or runs a timer; every route has its own page title; the page is `lang="th"`, pinch zoom is allowed, source names carry `lang="en"`; controls outside running text are at least 24 × 24 px (the design uses 44); control borders reach 3:1 against the page in both themes (WCAG 1.4.11); a tier is told by a shape, a word and a screen-reader label, never colour alone (and the weakest tier is dashed too); a selected choice has a checked state and a different fill; an error is in words and `aria-invalid`, not red alone; both 3D scenes have a name and a text alternative; no `:hover` rule reveals anything; at 320 px wide, with the WCAG text-spacing override, and at 200% text size, no route scrolls sideways or clips text; a focused control is not hidden behind the sticky bar at 320 and 768 px with double text size.
  - **Mutation-tested:** a removed label on the 3D scene, a pale muted-text colour, a pale border colour, no focus ring, a missing reduced-motion rule with an animation and a transition added, a heading skipped, an `<img>` without alt, a removed tier shape, a pointer cursor on a non-control — each fails a named test. Two of my first guards were too weak (a stylesheet error made one pass; one animation sat on an element the page does not have) and were redone.
  - **Four real defects the audit found and this ticket fixed:** (1) **chapter 5's headings skipped a level** (h1 → h3), found by Lighthouse in T-024, now pinned for every crop; (2) **at 320 px wide chapter 2 scrolled sideways**: a wide table stretched the whole grid column, and the visually hidden table caption (position: absolute) escaped its scrolling box; the grid column is now `minmax(0, 1fr)`, each table scrolls inside its own focusable box (so a keyboard can scroll it) with the caption contained; (3) **a long Latin word in a Thai heading** (`Slow/Controlled-release`) pushed the page past a 320 px screen at large text — headings, paragraphs, list items and cells now break long words; (4) **at 320 px with large text the sticky "jump to sources" bar wraps to several lines and covered what a keyboard focused**: below 30 em it now scrolls with the page, and above it the scroll offset follows the text size. A fifth, unrelated find: nineteen **iCloud conflict copies (`name 2.ext`)** had been committed by earlier bulk commits of mine (14 identical to the real file, 5 older drafts, none imported anywhere); they are removed and `lib/hygiene.test.ts` fails if a tracked file is named like one again.
  - **WebKit and `scroll-padding`:** a focused control already on screen is not scrolled by the browser at all, so a control that sits under a sticky bar is not moved; the test measures only the case where the browser must scroll, from the bottom of the page. In that case WebKit placed every control clear of the bar even with `scroll-padding-top: 0`, so that test cannot tell whether the padding is doing the work (`scroll-padding` is still set for anchors such as the sources link). Stated plainly because a mutation did not fail it.
  - **Not covered by any test, and why:** forced-colors mode (Safari does not support it); Switch Control and Voice Control; right-to-left and non-Thai locales; reading-order sense and Thai pronunciation under VoiceOver (judgement).
  - **Manual pass for you (keyboard, Mac):** in Safari turn on Settings → Advanced → "Press Tab to highlight each item" (or use Option-Tab; Full Keyboard Access changes it again). Tab through each chapter from the top: order follows the page, a visible ring on every stop (including each table, which is a stop so it can be scrolled), Arrow keys inside each radio group, Enter/Space on buttons; the skip link appears on the first Tab; nothing traps you in the 3D plant; at ⌘+ zoom 200% a focused control is never under the sticky bar.
  - **Manual pass for you (VoiceOver, iPad):** swipe through every chapter in reading order and check name, role and state of each control and each tier badge; the plant reads as `ภาพวาดต้นพืชสามมิติ ลากเพื่อหมุน` and the choice and table that follow are the alternative; submit the calculator empty (errors announced) and with a valid result (announced once); quiz score, bag panel, deficiency panel and crop announcer each announce once; Thai text is read in Thai and English snippets in English; turn on Reduce Motion and Increase Contrast.
  - **Judgement call for you:** the plant cannot be rotated or zoomed from the keyboard. It is a presentation aid, and everything it shows is in the three radios and the ten-row table directly beside it, so I read WCAG 2.1.1 as met; say if you want keyboard rotation as well.
  - **New Thai: none** (the tables' accessible names reuse their existing captions).

### T-026: Phone layouts must not break
- Status: done (real-phone look is yours)
- Depends on: T-023
- Goal: Confirm phones degrade acceptably even though they are not a v1 target.
- Acceptance criteria:
  - [x] No horizontal page scroll at 390 px wide on any route
  - [x] All tables remain readable (scroll container or reflow, owner's choice per table)
  - [x] 3D scenes either work or show the static fallback — never a broken canvas
- Test plan: WebKit at 390×844; screenshot every route.
- Notes: PRD §4 non-goal, but "must not break" is still a criterion.
- **Verified:** typecheck, lint, unit tests and the production build green; WebKit e2e green at iPad portrait, iPad landscape and Mac. `e2e/phone.spec.ts` runs once in a 390 × 844 window with touch at 3× pixel density; a full-page picture of every route is saved to `test-results/phone/` (and attached to the report, which CI uploads). Most of the groundwork was T-025's 320 px reflow work; this ticket measures the phone case itself and fixes what it found.
  - **No sideways scroll at 390 px on any route** (home, chapters 1–7 and the three specimen pages), and nothing visible past the right edge except inside a table's own scroll box; no console error on any of them.
  - **Tables (my choice, per your "scroll or reflow"): scroll.** The pictures showed chapter 2's four-column tables crushed: text columns about 70 px wide, six or seven lines for one sentence, the last column cut off. Below 30 em a three-column table now keeps a 30 rem width and a four-column table 40 rem, so its columns stay readable, and it scrolls sideways inside its own focusable box with the first cell (the row's name) pinned, so a row is never read without its name. iPad and desktop are untouched (the tables still fit there, which T-019 requires). I chose scrolling over turning rows into cards because a CSS card layout makes Safari drop the table's structure for VoiceOver; say if you would rather have cards and I will do it with explicit roles.
  - **3D scenes:** on a phone the plant draws (buffer at most 2× even on this 3× screen, never wider than the screen), and a finger tap on the old leaves selects them. With WebGL unavailable the fallback text shows and the choices and table still work. A scene that cannot start shows the fallback through the error boundary as well, so even removing the up-front WebGL check does not leave a broken canvas (that mutation did not fail the test, correctly: the boundary catches it).
  - **Also checked at 390 px:** the calculator (valid result), the bag reader, the crop matcher and the quiz all work with taps and fit; the timing diagram scales to the screen with text at least 14 px.
  - **Mutation-tested:** the four-column minimum width removed (a text column fell to 82 px: caught), the pinned first column removed (caught).
  - **Not verified:** a real phone (the only one I can give you is WebKit in a phone-sized window); iOS's on-screen keyboard covering a form field (the calculator's focus handling is the same as on iPad); the pictures in `test-results/phone/` were looked at for chapters 1 and 2 only.
  - **New Thai: none.**

### T-027: Home page redesign (`/th`)
- Status: done (real-iPad look and the Thai review are yours)
- Depends on: T-026
- Goal: Rebuild `/th` from the Design canvas as one responsive route (iPad landscape, iPad portrait, phone, night), with a React Three Fiber hero reusing the deficiency plant and a real static fallback.
- Acceptance criteria:
  - [x] One route, three layouts (landscape ≥ 75em, portrait 40–75em, phone < 40em) and day/night, from the artboards' values
  - [x] No text in the canvas; N/P/K labels, title, chapter path and markers are HTML; markers are real links
  - [x] Hero is procedural R3F geometry (D7), one WebGL context, disposed on route change (D16)
  - [x] Static hero fallback is the first paint, the no-WebGL view and the reduced-motion view
  - [x] Budget, Lighthouse and axe still pass; 44 px targets, safe areas and dvh kept
- Test plan: unit (strings, budget), WebKit e2e at 1366, 834 and 390 in both themes, WebGL-off run, context count across navigation.
- Notes: Decisions taken with the owner: `/th` becomes a "3d" route in `lib/budget.ts` with the canvas loaded after first paint (D3/D16 note); the hero soil block is decoration, an exception to D15; mockup's short ch1/ch2 titles are NOT used, the site's full titles are; no all-sources page exists, so the two sources links are TODO.
- **Verified:** typecheck, lint, 877 unit tests and the production build green; WebKit e2e green at iPad portrait, iPad landscape and Mac (942 passed, 0 failed). Lighthouse (median of 3, Chrome): performance 96–99 and accessibility 100 on all eight lesson routes; LCP on Fast 4G 1.36–1.57 s.
  - **What was built:** `app/[locale]/page.tsx` + `home.css` (one route, every layout; all scene colours as `--h-*` with night overrides, scoped under `.home`); `components/HomeArt.tsx` (the field per layout, the flat 2.5D plate, the chapter trail: SVG, decoration); `components/HeroScene3D.tsx` (the soil block from Main's own coordinates: extruded block, three-stop soil gradient, strata, roots as tubes, N/P/K particles riding the roots, the shared `PlantModel` from `PlantScene.tsx`); `components/HeroScene.tsx` (chooses live or flat, loads three.js on idle); `components/SiteHeader.tsx` + `ThemeToggle.tsx` (shared header, remembered theme); `lib/home.ts`, `lib/hero-scene.ts`, `lib/theme.ts` (pure, unit-tested).
  - **How the hero is chosen:** an inline script runs before the hero is parsed and sets `<html data-hero>`: "3d" only with WebGL and without reduced motion. Without JavaScript the attribute is never set and the flat hero shows. The flat plate stays until the canvas has drawn (`data-scene="ready"`), so the stage is never empty while three.js downloads; a failed download falls back to the flat hero (tested by blocking the chunk).
  - **A real defect found on the way, and fixed:** after the new header, the chapter load canaries (citations walk, chapter 3 in the calculator and bag specs) stalled about 15% of the time: WebKit left `readyState` at "interactive" and never fired `load`, with nothing outstanding. `main` passed 90 of 90. Bisected over about 30 builds: the trigger is the six font preloads combined with a face first used after its preload finished, and the header only shifted which faces a chapter needs late. Removing the preloads cures it (0 of 60) but costs chapter 4 its score (performance 86: the font swap, as T-024 found). Kept the preloads and added `.font-warm`: a visually hidden span in the root layout that uses each face in the first layout. Same build, same machine: 11 of 60 walks stalled without it, 0 of 120 with it. `e2e/fonts-load.spec.ts` walks the chapters twice as an extra canary. Same family as T-014's select bug.
  - **Code review (fresh reviewer):** ten findings, all fixed. Besides the two above: leader lines measured the page every frame (now on resize only); the canvas kept rendering off-screen (now paused); a second WebGL probe per load (now reuses the script's verdict); two fingers made the block jump (now one finger drives); theme changes leaked a GPU colour buffer (now rewritten in place); `home.css` class names could reach chapters after a client navigation (now scoped, with a unit test that fails on an unscoped rule).
  - **Mutation-tested:** removed the chunk boundary (the download test fails on all three viewports); unscoped one rule (the scope test fails); removed `.font-warm` (11 of 60 stalls).
  - **Deliberate departures from the mockup:** the theme button's border is `--line`, not the mockup's 0.22 alpha (1.54:1, under WCAG 1.4.11's 3:1); its icon is a CSS mask, not an inline SVG (an `<svg>` inside the button is a second, independent trigger of the same WebKit `load` stall: 59 of 60 walks stalled with it even after the font fix, 0 of 60 with the mask); "คุณอยู่ที่นี่" stays on screen but is not part of chapter 1's link name (on the home page it is not true); the night colours of the portrait, phone and flat fields are not drawn in any artboard, so they follow the landscape night roles.
  - **Preview (iPad):** https://fertilizer-lesson-if8sa5yez-kuypavthai-4289s-projects.vercel.app/th
  - **Not verified:** a real iPad (the preview link is the way); VoiceOver reading the new header and labels; two-finger handling was fixed by reading the code, not by a touch test (Playwright cannot drive two pointers on WebKit reliably).
  - **New Thai: U50–U66** in `docs/content/THAI-REVIEW.md`, all copied verbatim from the design. **U64–U66 (ไนโตรเจน, ฟอสฟอรัส, โพแทสเซียม) are in neither the pamphlet nor the current site**, so they need your check under D6.
  - **TODO left in code:** the header's sources link and the strip's all-sources link, until an all-sources page exists.

---

## Open follow-ups (created on demand, not yet scheduled)

- Approved entries from `docs/content/ADDITIONS.md` become one task each (gated by T-008).
- Issues found at the T-016 iPad gate become tasks before P3 begins.
- Items in `docs/BACKLOG.md` are out of v1 by decision, not by omission.
