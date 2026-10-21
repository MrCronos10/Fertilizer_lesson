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
  - **Measured JS: 175 KB gzipped on `/th`** against the 180 KB budget (~97% used by an empty shell). The framework baseline is already most of the budget; T-011 and T-012 must add almost no client JS or the budget breaks. The test measures every text route's scripts, not a build-output estimate.
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
- Status: todo
- Depends on: T-006
- Goal: A tested pure function: target nutrient + grade → kg of product, with the worked arithmetic.
- Acceptance criteria:
  - [ ] `kg product = target nutrient × 100 ÷ %nutrient`, oxide-only, matching the source's form
  - [ ] Reproduces the source's worked example exactly: N 10 kg/rai from urea 46-0-0 → ≈ 22 kg
  - [ ] Reproduces the source's bag example: 50 kg of 16-20-0 contains 8 kg N and 10 kg P₂O₅
  - [ ] Rai ↔ hectare conversion using the source's constants (1 ไร่ = 1,600 m², 1 ha = 6.25 ไร่)
  - [ ] Returns the intermediate steps for display, not just the answer
  - [ ] Rejects a 0% nutrient grade rather than dividing by zero; rejects negative targets
  - [ ] **No elemental↔oxide conversion exists in the code at all**
  - [ ] One unit test per crop row in the source table, asserting the function agrees with the published rate
  - [ ] **(carried from T-007)** A test asserts no `actionable: false` Rate is reachable from the calculator's data queries. T-007 asserted this for `cropsFor` only, because the calculator did not yet exist. The per-crop suite above covers actionable crops only, so sugarcane, mango and pre-tapping rubber are expected to be absent from it by design.
- Test plan: Vitest, including the two source examples as exact-value tests, the division-by-zero and negative cases, and the per-crop suite.
- Notes: Reviewer: yes (calculator). This is the highest-consequence code in the project — a bug here hands a farmer a wrong dose (D10).

### T-014: Calculator UI
- Status: todo
- Depends on: T-013, T-011
- Goal: A touch-friendly calculator that shows its working and its sources.
- Acceptance criteria:
  - [ ] Inputs for target nutrient (kg/rai) and grade; grade selectable from the source's published list as well as free entry
  - [ ] The worked arithmetic is displayed, not just the result
  - [ ] All controls ≥ 44×44pt; numeric keypad triggered on iPad; fully keyboard-operable on Mac
  - [ ] Invalid input produces a clear Thai message, never a crash or `NaN`
  - [ ] Result carries the soil-test note and its citation
  - [ ] Announced correctly by VoiceOver, including the result updating
- Test plan: e2e in all three viewports covering a valid calculation, a zero-nutrient grade, and a negative target. VoiceOver check on iPad. Screenshots both themes.
- Notes: Reviewer: yes (accessibility).

### T-015: NPK bag reader (2D)
- Status: todo
- Depends on: T-014
- Goal: A legible 2D bag label whose three numbers are individually tappable.
- Acceptance criteria:
  - [ ] Each of the three numbers is a ≥ 44×44pt tap target explaining N, P₂O₅, or K₂O
  - [ ] Explanations come from the source, with citations
  - [ ] Works by tap on iPad and click/keyboard on Mac; no hover-only reveal
  - [ ] Label text is real DOM/SVG text — selectable, zoomable, and VoiceOver-readable
  - [ ] Legible at iPad portrait width without horizontal scrolling
- Test plan: e2e tapping each number in all three viewports; keyboard tab-through on Mac; screenshots both themes.
- Notes: Deliberately 2D, not 3D — WebGL text on iPad is blurry, unselectable, invisible to VoiceOver, and untestable (D3).

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
- Status: todo
- Depends on: T-016
- Goal: The 3D substrate: a client island that never leaks a WebGL context and degrades gracefully.
- Acceptance criteria:
  - [ ] React Three Fiber island loaded only on routes that need it; three.js absent from all other route bundles
  - [ ] DPR capped at 2
  - [ ] **Exactly one WebGL context alive at a time**, explicitly disposed on unmount/route change — verified, not assumed
  - [ ] When WebGL is unavailable, a static fallback renders and the lesson text remains fully readable
  - [ ] `prefers-reduced-motion` disables idle animation
  - [ ] 3D route ≤ 600 KB gzipped total
- Test plan: e2e navigating in and out of the 3D route repeatedly, asserting context count stays at 1 and memory does not climb. A test with WebGL disabled asserting the fallback and the text. Bundle-size assertion on both 3D and non-3D routes.
- Notes: Reviewer: yes. iPad Safari silently reloads pages under memory pressure — the disposal rule is the single most important line in the performance budget (D16). The prior art never disposed.

### T-018: Deficiency explorer (3D)
- Status: todo
- Depends on: T-017
- Goal: A rotatable procedural plant where tapping old vs young leaves teaches the mobility rule.
- Acceptance criteria:
  - [ ] Procedural geometry only — no glTF, no textures, no external assets
  - [ ] One-finger rotate, pinch zoom, two-finger pan on iPad; drag, scroll/pinch zoom, click on Mac
  - [ ] Old-leaf and young-leaf regions separately selectable, each ≥ 44×44pt in screen space
  - [ ] Each selection shows the symptom and nutrient from the p3 10-row table, with citation
  - [ ] The mobility rule (mobile → old leaves, immobile → young leaves) is stated explicitly
  - [ ] All 10 symptom rows reachable
  - [ ] A non-3D equivalent (the table plus text) is available and VoiceOver-navigable
  - [ ] Sustains 60 fps on iPad 9th-gen or newer
- Test plan: e2e selecting both leaf classes and asserting the correct symptom text, in all three viewports. Manual touch-gesture check on a real iPad plus an fps reading. Screenshots both themes.
- Notes: Reviewer: yes (accessibility + content accuracy). Best-backed interactive in the project (D15). The 3D is for the camera; the text alternative is not optional.

### T-019: Chapters 2–3 — deficiency and fertilizer types (G2, G3)
- Status: todo
- Depends on: T-012, T-018
- Goal: The two strongest chapters, with their four source tables rendered and cited.
- Acceptance criteria:
  - [ ] Deficiency chapter renders the p3 symptom table (10 rows) and links to the explorer
  - [ ] Types chapter renders organic NPK (5), straight fertilizers (7), compound grades (6), and soil conditioners with lime equivalence (4)
  - [ ] All requested types present: urea, AS, DAP, TSP, rock phosphate, KCl, K₂SO₄, compound, slow-release, foliar, lime, marl, dolomite, gypsum
  - [ ] Tables readable at iPad portrait width without horizontal scroll
  - [ ] Every row cited; tier badges shown
- Test plan: e2e asserting row counts per table and the presence of each named fertilizer type. Screenshots at all three sizes.
- Notes: Reviewer: yes (content accuracy).

### T-020: Crop matcher (G6)
- Status: todo
- Depends on: T-019
- Goal: Pick one of 8 crops, see type, rate, and timing with citation and tier.
- Acceptance criteria:
  - [ ] All 8 crops selectable: rice, corn, cassava, sugarcane, rubber, mango, durian, vegetables
  - [ ] Data from the p12–13 table (10 rows); rates shown as ranges with the soil-test note
  - [ ] `commercial`-tier-only rates shown as descriptive text, not as actionable numbers
  - [ ] No `KH`-tagged row is reachable
  - [ ] Keyboard and touch operable; no hover-only reveal
  - [ ] **(carried from T-007)** A crop for which `cropsFor()` returns no actionable guidance (sugarcane, mango, both rubber rows) shows an explicit "no reliable source" state with its descriptive text from `cropsForReading()`, instead of rendering a crop with no advice.
- Test plan: e2e cycling all 8 crops, asserting the rate matches the JSON and that the KH table is unreachable. Unit test on the tier-filtering query.
- Notes: Reviewer: yes (content accuracy). Mango's rate is per-tree (1–2 kg/tree), not per-rai — the UI must not assume every rate shares a unit.

### T-021: Quiz with `localStorage` progress (G7 review)
- Status: todo
- Depends on: T-019
- Goal: The 6 verbatim source questions, with progress surviving a reload.
- Acceptance criteria:
  - [ ] All 6 Thai questions from p6–7 verbatim; no invented questions
  - [ ] Progress persists across reload via `localStorage`; no accounts, no network calls
  - [ ] Every `localStorage` read and write wrapped so private browsing or blocked storage cannot throw
  - [ ] Works fully with storage unavailable, just without persistence
  - [ ] Keyboard and touch operable; results announced by VoiceOver
- Test plan: e2e answering, reloading, and asserting persistence; a second run with storage blocked asserting no crash. All three viewports.
- Notes: Reviewer: yes (accessibility). No new questions without going through the D8 gate.

### T-022: Basal vs top dressing — static annotated diagram (G5)
- Status: todo
- Depends on: T-019
- Goal: An honest labelled diagram of ปุ๋ยรองพื้น vs ปุ๋ยแต่งหน้า.
- Acceptance criteria:
  - [ ] Static SVG diagram, no time slider, no animation
  - [ ] Both terms defined from the source (§2.7, p5) with citation
  - [ ] Thai rates shown where the source gives them (basal 20–25 kg/rai; urea top-dress 5–10 kg/rai) with soil-test note
  - [ ] Diagram text is real SVG text, VoiceOver-readable, with a text alternative
- Test plan: Screenshots all three viewports and both themes; VoiceOver read-through.
- Notes: Deliberately demoted from the original scrubbable timeline — four lines of source support a picture, not an animation (D15). Cambodian rice timing detail stays excluded (D11).

### T-023: Chapters 4 and 7 — safe use, storage, mistakes, environment (G7)
- Status: todo
- Depends on: T-019
- Goal: The safety chapter complete, including the 4R framing and the 6 common mistakes.
- Acceptance criteria:
  - [ ] 4R (right source, rate, time, place) presented from the source
  - [ ] All 6 common mistakes present; storage and safety guidance present; eutrophication caution present
  - [ ] Every claim cited
- Test plan: e2e asserting 6 mistake entries and the 4R section; screenshots.
- Notes: Reviewer: yes (content accuracy).

---

## P4 — Hardening

### T-024: Enforce the performance budget in CI
- Status: todo
- Depends on: T-023
- Goal: The budget becomes a build failure rather than an aspiration.
- Acceptance criteria:
  - [ ] CI fails when a text route exceeds 180 KB gzipped JS or a 3D route exceeds 600 KB
  - [ ] Font files asserted ≤ 60 KB woff2 each
  - [ ] Lighthouse run in CI: performance ≥ 90, accessibility = 100
  - [ ] LCP < 2.0 s on a throttled 4G profile for text routes
  - [ ] Measured page weight for every route recorded in the task notes
- Test plan: Deliberately exceed a budget on a scratch branch and confirm CI fails.
- Notes: D16. Report the final page weights to the owner.

### T-025: Accessibility audit
- Status: todo
- Depends on: T-023
- Goal: Full keyboard and VoiceOver usability across every route and interactive.
- Acceptance criteria:
  - [ ] Every interactive reachable and operable by keyboard alone on Mac
  - [ ] VoiceOver labels on all controls and both 3D scenes, each with a text alternative
  - [ ] Contrast passes in light and dark for all text and all tier badges
  - [ ] No information conveyed by colour alone
  - [ ] `prefers-reduced-motion` honoured everywhere
  - [ ] Axe reports zero violations on every route
- Test plan: Automated axe sweep over all routes, plus manual VoiceOver pass on a real iPad and keyboard-only pass on Mac.
- Notes: Reviewer: yes (accessibility).

### T-026: Phone layouts must not break
- Status: todo
- Depends on: T-023
- Goal: Confirm phones degrade acceptably even though they are not a v1 target.
- Acceptance criteria:
  - [ ] No horizontal page scroll at 390 px wide on any route
  - [ ] All tables remain readable (scroll container or reflow, owner's choice per table)
  - [ ] 3D scenes either work or show the static fallback — never a broken canvas
- Test plan: WebKit at 390×844; screenshot every route.
- Notes: PRD §4 non-goal, but "must not break" is still a criterion.

---

## Open follow-ups (created on demand, not yet scheduled)

- Approved entries from `docs/content/ADDITIONS.md` become one task each (gated by T-008).
- Issues found at the T-016 iPad gate become tasks before P3 begins.
- Items in `docs/BACKLOG.md` are out of v1 by decision, not by omission.
