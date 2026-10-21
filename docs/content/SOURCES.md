# Sources and extraction record

Every word of Thai on this site came out of one file. This document says which file,
which page, and exactly what was changed on the way in. If a sentence on the site is
not traceable through this document, it is a bug.

## The source

| Key                                  | Value                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `sourceId`                           | `beginner-fertilizer-textbook-th-kh`                                                                                           |
| File                                 | `A Beginner's Fertilizer Textbook in Thai and Khmer_ NPK Basics, Fertilizer Types and Crop Guidance.pdf`                        |
| Pages                                | 15                                                                                                                             |
| Where it lives                       | The project owner's local disk only. Git-ignored under D14 — it is not ours to redistribute.                                   |
| Thai edition (`ภาคที่ 1`)            | pages 2–7                                                                                                                      |
| Khmer edition (`ភាគទី ២`)            | pages 7–11 (p11 is shared with the crop table) — **not extracted**, see below                                                  |
| Shared bilingual tables              | pages 11–14 (the crop table starts partway down p11)                                                                           |
| English front matter and back matter | pages 1, 14–15, plus a column of page-1 overflow that reflows onto p2                                                          |

The Khmer edition is skipped for two reasons: Khmer is out of scope for v1 (D18 keeps
the door open, it does not walk through it), and the Khmer text layer does not extract
reliably — clusters lose their subscript consonants and vowel signs, so
`ជីគីមី` comes out as `ជ គ ម`. Re-extracting Khmer will need OCR or the original
document, not this PDF's text layer.

## How the raw extraction was produced

`pypdf` 6.21.1, `PdfReader(path).pages[n].extract_text()`, one file per page, written
to `docs/content/raw/pNN.txt`. Pages 8–10 (Khmer only) were discarded for the reason
above. Nothing was edited by hand on the way into those files: they are the audit
baseline, and `lib/content.test.ts` diffs the shipped MDX against them on every run.
`docs/content/raw/manifest.json` records which lines of which page each chapter was
built from, which is what lets that check be an equality diff rather than a search.

Formatting that the text layer drops — bold runs, and the position of each inline
citation pill — was read off the pages rendered at 2× through CoreGraphics. The page
images were not kept; they are reproducible from the PDF.

## Mapping: chapter file → source

| File                | Chapter                              | Source pages | Goals              |
| ------------------- | ------------------------------------ | ------------ | ------------------ |
| `content/th/ch01.mdx` | ปุ๋ยคืออะไร และพืชต้องการธาตุอาหารอะไร | 2–3          | G1, G2             |
| `content/th/ch02.mdx` | ประเภทของปุ๋ย ลักษณะ และควรใช้กับอะไร  | 3–5          | G3, G5             |
| `content/th/ch03.mdx` | วิธีอ่านตัวเลขบนกระสอบ                 | 6            | G4                 |
| `content/th/ch04.mdx` | การใส่ปุ๋ยในทางปฏิบัติ                  | 6            | G5, G7             |
| `content/th/ch05.mdx` | ตารางจับคู่ปุ๋ยกับพืช                   | 11–13        | G6                 |
| `content/th/ch06.mdx` | อภิธานศัพท์                           | 14           | G1, G3, G5         |
| `content/th/ch07.mdx` | สรุปและแบบทดสอบ                       | 6–7          | G1–G7              |

Chapters 5 and 6 are the source's own shared bilingual tables. They carry no Thai
prose at all, which is why their frontmatter says `proseFromSource: false`.

## Cleanup rules applied

D19 allows mechanical cleanup only. Every rule used is listed here; no other change
was made.

`lib/content.test.ts` enforces this by rebuilding each chapter's expected text from
the raw lines named in `manifest.json`, stripping whitespace from both sides, and
asserting the two are **equal**. Equality is the point: a containment check would
happily pass a chapter that had been truncated, reordered, or cut to a single
surviving line, and each of those corrupts agronomic advice without changing a word.
Six deliberately corrupted variants are asserted to fail that check, so the guard
cannot quietly go slack.

| #   | Rule                                                                                                                                       | Example                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| R1  | Runs of two or more spaces collapsed to one.                                                                                                 | `ปุ๋ย  (Fertilizer)` → `ปุ๋ย (Fertilizer)`         |
| R2  | Spaces removed from inside dotted abbreviations.                                                                                             | `พ . ร . บ .` → `พ.ร.บ.`; `กก .` → `กก.`        |
| R3  | Spaces removed immediately inside brackets and quotation marks.                                                                              | `( จำง่าย )` → `(จำง่าย)`                        |
| R4  | Space removed before `:`, `;`, `?` and `%`.                                                                                                  | `อาการขาดธาตุ :` → `อาการขาดธาตุ:`                |
| R5  | Spaces removed around `/` where it joins two terms rather than separating clauses.                                                           | `ใบอ่อน / ยอด` → `ใบอ่อน/ยอด`; `กก ./ ไร่` → `กก./ไร่` |
| R6  | Subscript digits rejoined to their formula.                                                                                                  | `K ₂ SO ₄` → `K₂SO₄`                           |
| R7  | PDF line wrapping undone: lines rejoined into one paragraph, with no space where the break fell inside a word.                               | `เก็บ`+`เกี่ยว` → `เก็บเกี่ยว`                      |
| R8  | Bold restored from the rendered page where the text layer flattened it. No word changed.                                                     | `ใบแก่` → `**ใบแก่**`                           |
| R9  | Dropped: per-page citation-marker footer lists, orphaned fragments of clipped link text (` ที่`, ` ทั้`, ` อื่`), and English front-matter prose that flows onto Thai pages. | —                                              |
| R10 | The `⚠` glyph dropped in favour of a `<Callout type="warn">` wrapper carrying the same meaning in markup.                                     | `⚠ ใบเหลืองอาจ…` → `<Callout type="warn">`      |
| R11 | Table rows lifted out of the prose into locale-neutral JSON (T-006); the MDX keeps a `<SourceTable>` slot in the row's original position.      | —                                              |
| R12 | A run-in bold label that the source uses as a section title promoted to a `##` heading, with the label's own text unchanged — including its colon. | `2.1 ปุ๋ยอินทรีย์ (Organic, 有机肥) ได้จาก…` → heading + paragraph; `สรุป:` → `## สรุป:` |
| R13 | Ordered-list numbering dropped, because markdown renumbers it.                                                                                | `1. N บำรุงใบ…` → `1. N บำรุงใบ…` (marker regenerated) |
| R14 | The quiz's `→` separator dropped, each item split into the `q` and `a` fields of `ch07` frontmatter. Question and answer text unchanged.        | `46-0-0 มีธาตุอะไร? → N อย่างเดียว`             |
| R15 | Three pieces of source prose deliberately not shipped. Each is listed with its reason in `manifest.json` → `excludedProse`, and a test fails if any loses its justification. | the `ภาคที่ 1` part divider; the Khmer halves of the two shared-table headings; `5.2 พืชอื่น ๆ` |
| R16 | **(T-006)** Chinese glossary terms NFKC-normalised. The PDF's CJK font emits some glyphs as Kangxi radicals rather than unified ideographs; NFKC maps one onto the other deterministically. Applied to CJK only — NFKC can reorder Thai combining marks. | `⽣物肥` (U+2F63) → `生物肥` (U+751F) |
| R17 | **(T-006)** Table rows split into typed JSON fields. Numbers are parsed out of the source's strings (`"20–25 kg/rai"` → `{min:20,max:25}` + `unit`). In the crop table the source's own wording is kept verbatim alongside in a `text` field and checked against the page; the other tables keep their Thai labels verbatim instead. | — |
| R18 | **(T-006)** Page furniture dropped when comparing a table against its page: the per-page citation footer, orphaned link fragments, and a column header repeated as a running header on a continuation page (p13 repeats p12's). | — |
| R19 | **(T-006)** One crop cell is split by the p12/p13 page break with other columns printed in between. The split is declared in the test, which also asserts the declared fragments rebuild the stored wording exactly. | the vegetable row's basal cell |

Digits were **not** converted: the source uses Arabic numerals throughout its Thai
edition and so does the site. Units were not converted either — `กก./ไร่` stays
`กก./ไร่`, and all nutrient figures stay in oxide form (N–P₂O₅–K₂O) per the PRD. The
"normalize digits and units" half of the T-005 acceptance criterion is therefore a
deliberate no-op, not an oversight.

R13 and R14 are also applied to the *expected* side of the zero-rewording check, so
they cannot be used to smuggle a change past it.

## Citations

The source prints inline citation pills (`doa`, `irri`, `fao`, `ku`, …) but has no
bibliography. Each pill's anchor position was read off the rendered page and preserved
as `<Cite id="…" />` at that exact point in the prose.

The `citations:` frontmatter list is **every marker the source prints on that
chapter's own material — its prose and its tables — and nothing else.** It is not
"every marker on the page": pages carry more than one chapter, and p14 in particular
prints an `mdpi` pill against an English back-matter recommendation that belongs to
neither the glossary nor the crop table. Two tests hold the line: every `<Cite>` id in
a body must appear in that chapter's list, and every id in a list must actually be
printed somewhere on the chapter's declared source pages.

This is why ch02 lists `phys`, `nutrien-ekonomics`, `sotus`, `tratruamkaset` and
`bansuanporpeang` even though no prose `<Cite>` uses them: they are printed inside the
four tables that chapter owns, and will be attached to specific rows in T-006.

Resolving those ids to actual URLs, and tiering them official/research/commercial, is
T-007. Until then a `<Cite>` is a marker, not a working reference, and no rate in this
corpus should be treated as actionable.

## Component contract for the MDX

These three components do not exist yet; the chapters reference them so the content
does not have to be rewritten when they arrive.

| Component                   | Arrives in | Meaning                                                      |
| --------------------------- | ---------- | ------------------------------------------------------------ |
| `<Cite id="…" more={n} />`  | T-012      | One source pill, in the position the source printed it.       |
| `<SourceTable id="…" />`    | T-006      | The table whose rows live in `content/data/<id>.json`.        |
| `<Quiz chapter={7} />`      | T-021      | Renders the six verbatim questions from `ch07` frontmatter.   |

## The nine tables, and where their slots sit

| Table id                 | Source page | Rows | Slot        |
| ------------------------ | ----------- | ---- | ----------- |
| `nutrient-groups`        | 2           | 3    | `ch01.mdx`  |
| `deficiency-symptoms`    | 3           | 10   | `ch01.mdx`  |
| `organic-fertilizer-npk` | 3           | 5    | `ch02.mdx`  |
| `straight-fertilizers`   | 4           | 7    | `ch02.mdx`  |
| `compound-grades`        | 5           | 6    | `ch02.mdx`  |
| `soil-conditioners`      | 5           | 4    | `ch02.mdx`  |
| `rice-by-soil-group-kh`  | 11          | 9    | `ch05.mdx`  |
| `other-crops`            | 12–13       | 10   | `ch05.mdx`  |
| `glossary`               | 14          | 20   | `ch06.mdx`  |

Row counts are the ones recorded in the T-006 acceptance criteria and are asserted in
`lib/data/data.test.ts` against constants that are written out there rather than read
from the files, so a dropped row cannot hide by also updating the file's `rowCount`.

## Units, and the two places they can kill you (T-006)

**Oxide, never elemental.** The second and third numbers of a grade are percent P₂O₅
and percent K₂O. Elemental P is ~2.29× smaller and elemental K ~1.20× smaller, so a
field named `p` holding a P₂O₅ figure is a 2.3× error that looks entirely plausible.
There is no `p` or `k` key anywhere in `lib/data/types.ts`, and a test walks every key
of every JSON file looking for one.

**Percent is not kilograms.** `Npk` is a percentage grade with fields `n`/`p2o5`/`k2o`;
`NpkKgPerHa` is an absolute amount with fields `nKg`/`p2o5Kg`/`k2oKg`. The field names
differ so the two are **not assignable to each other** — `formatGrade` takes `Npk`, and
handing it a kg/ha figure is a compile error. A first version used a type alias, which
a review correctly called documentation rather than enforcement: aliases are
structurally identical and TypeScript sees no difference. The p11 table prints
`118-23-0` meaning 118 kg N per hectare; rendering that as a bag grade would tell a
grower to buy a fertilizer that cannot exist. A runtime check also rejects any
percentage triple summing above 100%.

## Country tagging (T-006)

Every row carries a `country` of `TH`, `KH` or **`NEUTRAL`**. `NEUTRAL` means the row
is not country-specific — plant chemistry, a bag grade, a glossary term — rather than
that its country is unknown; six of the nine tables are neutral throughout, and the
shared crop table is neutral at row level because the source prints it once for both
editions.

Provenance therefore lives one level down. Every piece of `Guidance` in the crop table
carries a `scope`:

| scope | meaning |
| --- | --- |
| `TH` / `KH` | the source attributes it to that country, e.g. the cassava cell's literal `TH:` and `KH:` prefixes |
| `REGIONAL` | the source presents it as regional (CIAT) |
| `UNSTATED` | the source gives no country at all |

`UNSTATED` exists because of one row. p13 gives the vegetable row a single citation —
CDRI Working Paper 91, a Cambodian socio-economic survey — and prints no `(TH)` marker,
unlike the two rice rows. An earlier version tagged that row's advice `TH`, which a
review rightly called out as asserting a Thai provenance the source never gives.

`lib/data/index.ts` applies the filter in the query functions, and `cropsFor` returns a
row with `basal` and `topDressing` **removed** from it, so there is no unfiltered array
sitting one property access from the filtered one. The unfiltered tables are exported
as `RAW_TABLES`, named so that a component reaching past the queries is visible in
review.

One consequence is visible and intended: **the vegetable row has no rate a Thai grower
can act on**, because the source has none. That gap is what T-008 proposes to fill from
an official source.

## How the numbers are held to the source (T-006)

Row counts and internal consistency are not enough. A first version of
`lib/data/data.test.ts` checked those and whether each Thai label appeared *somewhere
on its page* — and a review proved seven corrupting mutations passed all of it,
including two deficiency symptoms swapped between rows and a rate changed from
20–25 kg/rai to 200–250 kg/ha. Whole-page containment cannot catch a permutation,
because every string is still on the page.

The checks are now **anchored**: a row's fields must appear together, in order, within
the raw lines that row was printed on. Six tables are pinned line by line; p4 and p12
wrap their cells too badly for that, so straight fertilizers are pinned through their
printed grade string and crop guidance through its own verbatim wording, with every
parsed number required to be recoverable from that wording.

Nine deliberately corrupted variants are checked to fail, including an invented
guidance entry appended to a crop row and a kg/ha supply replaced by a string.

`lib/data/validate.ts` does the structural checking the `as Table<…>` casts cannot: the
casts accept a deleted field or a string where an object belongs, and `tsc` reports
nothing. The test suite runs `assertTables()` so the shapes are enforced somewhere
real.

## The bibliography (T-007)

The source prints 67 citation pills and no bibliography. The URLs were not guessed: the
PDF carries each pill as a link annotation, so `content/sources.json` is generated by
reading `/Annots → /A → /URI` with `pypdf` and pairing each annotation with the pill
printed beside it, by page and reading order. The pairing is cross-checked by domain —
all 67 pills agree with the host of the link they were paired with.

| measure | count |
| --- | --- |
| pills = link annotations | 67 |
| distinct documents (URLs) | 41 |
| distinct registrable domains | **37** |
| sources hidden behind overflow pills | 5 |

**The earlier "38 domains" is retired.** It was a planning-time estimate; the annotations
give 37 that can be named. The 5 hidden sources sit behind two overflow pills, `uga +2`
(p2, the mobility rule) and `cgiar +3` (p12, cassava). A pill prints a count, not names,
and no link annotation exists for them, so they are recorded as unresolved rather than
inferred. One consequence worth knowing: the mobility rule that the deficiency explorer is
built on has only **one** nameable source.

A marker is a *domain*, not a document: `doa` covers three different DOA documents. Rows
cite markers, so a row's tier is its domain's tier.

### Tiers and what they gate

`official`, `research` and `commercial` are defined in `content/sources.json` and
reviewed in [`TIER-REVIEW.md`](TIER-REVIEW.md). Every tier is written down in
`tools/source-meta.json` with its rationale and its **basis**: `domain` when the host
itself decides it (a `.go.th` agency, a named university), `inferred-from-url` when only
the URL was inspected. No site was fetched to make a tier. All 15 inferred ones are
`commercial`, and a test fails if an inference-only tier is ever promoted.

`content/sources.json` is generated by `tools/build-sources.py` from the PDF, and the
judgements live in `tools/source-meta.json`, so regenerating reproduces the committed
file byte for byte. Nothing is patched in afterwards. (An earlier version was hand-edited
after generation, which a review rightly flagged.)

Each pill is recorded with its **position** on its page as well as the page. That matters
for one reason: two DOA documents cited on the same page become indistinguishable if
only `(domain, url, page)` is recorded, so swapping them would pass every check. A test
confirms the pill at each position is the domain the bibliography assigns to it, and a
fingerprint over every document covers the rest.

### What "actionable" means, and where it is decided

`Guidance.actionable` decides whether a rate may feed the calculator or the crop matcher.
It is false when the source attributes the guidance to no country or to Cambodia, or when
no source the page attaches to **that piece of guidance** is better than `commercial`.

**It is resolved per piece of guidance, not per row.** A row's Source cell can name three
authorities and carry one pill, and the pill belongs to one line of that cell. The
cassava cell is the case that proved it: it mixes a Thai rate, a Cambodian note and CIAT
regional guidance, but its single pill (`cgiar +3`) sits beside the CIAT line. Resolving
at row level let the Thai dolomite rate (which p5 backs with a blogspot page) and the Thai
15-15-15 rate (which names two authorities with no link) ride on that pill. Each guidance
therefore carries its own `citations` and `namedSources`.

It is a **strongest-link** rule: one non-commercial source is enough, and no number of
commercial sources adds up to one. The stored flag is checked against `isActionable()`
both in the test suite and by `assertTables()`.

`cropsFor()` returns actionable guidance only, so a caller cannot surface a blocked rate
by forgetting a flag. `cropsForReading()` returns everything the audience may read, for
descriptive text. A crop can come back from `cropsFor()` with **empty** guidance arrays
(sugarcane, mango, both rubber rows); the crop matcher must show a "no reliable source"
state for those rather than render a crop with no advice (carried into T-020).

### Named but not linked

Five sources are named in a cell and recorded with `url: null`: `TAS 4401-2008` and
`Rice Department` (the clay-soil rice row), `CDRI Working Paper 91` (the vegetable row), and
`Nakhon Sawan FCRC` and `OAE` (the cassava cell). A name lifts a rate only where its cell
has **no pill at all**. Beside a pill that belongs to another line — the cassava cell — a
name attaches nothing to the line it names, so `liftsActionability` is false for those two.

### TAS 4401-2008 was read in full

The `fao` pill on the sandy-soil rice row links to FAOLEX, which hosts the **text of TAS
4401-2008**, the Thai Agricultural Standard for Good Agricultural Practices for Rice
(National Bureau of Agricultural Commodity and Food Standards, Ministry of Agriculture and
Cooperatives; an unofficial English translation). It states the clay-soil basal rate of
20-25 kg/rai of 16-20-0, 18-22-0 or 20-20-0, a top-dressing of 5-10 kg/rai of urea, and
20-25 kg/rai of 16-16-8 or 18-12-6 for loam, sand and sandy loam. So the `official` tier
for `fao` is right, and the rationale that called it "legislation" was wrong and has been
corrected.

**One divergence from the source pamphlet:** the pamphlet lists `16-8-8` among the
sandy-soil rice grades on p5 (an uncited table row) and on p12, where that row's source
cell cites TAS 4401-2008. TAS 4401-2008 does not contain `16-8-8` anywhere. The extraction keeps the pamphlet's figure, since that is what the
source prints, and the divergence is listed for you in `THAI-REVIEW.md`.
