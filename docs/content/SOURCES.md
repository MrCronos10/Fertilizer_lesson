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

Row counts are the ones recorded in the T-006 acceptance criteria. Extracting the rows
themselves is T-006; T-005 only reserved their positions.
