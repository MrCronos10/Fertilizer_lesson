# Backlog

Out of v1 **by decision, not by omission**. Each entry records why it was excluded, so a future
reader doesn't re-litigate a settled trade-off. Scope creep found during a task gets appended here
rather than built.

---

## Content & curriculum

### Khmer language version
Excluded from v1 (PRD §4). The source's Khmer half (p7–10) does not extract reliably from the
PDF — glyph clusters drop throughout — so this needs fresh translation, not extraction. The
groundwork is already laid: `/th` URL prefix from day one, locale-neutral numbers with translatable
labels (D18), so adding `/km` is additive rather than a rewrite. The source's p14 glossary carries
Khmer column data that will help.

### Cambodian rice recommendations (source Table 5.1, 9 rows)
Retained in the data layer tagged `country: KH`, excluded from the UI (D11). Becomes usable if and
when the Khmer version ships. Do **not** surface these for Thai users: they are keyed to Cambodian
soil groups and do not transfer.

### Compost / factory-process chapter (candidate Chapter 8)
The owner's `factory-walkthrough-th.html` is a polished 9-zone organic fertilizer factory tour
(เดินชมโรงงานปุ๋ยอินทรีย์), and all three secondary PDFs plus both images cover the same ground:
compost *manufacturing*. Excluded because it is a different curriculum from beginner NPK and would
unbalance the site (D12b). If revived, the genuinely citable sources are the Thai journal article
(อานัฐ ตันโช, วารสารดินและปุ๋ย ปีที่ 37) and the NSTDA infographic — not the ChatGPT summary, whose
citation markers are unresolvable artifacts.

### Additional quiz questions
v1 uses only the 6 verbatim Thai questions from p6–7 (D20). More questions means authoring
agronomic content, which goes through the D8 approval gate first.

### Soil-test interpretation
Every rate on the site says "get a soil test", and the site then offers nothing about reading one.
Genuinely useful, entirely unsupported by the source. Would need official LDD material via D8.

---

## Interactives

### Soil cross-section 3D scene
Originally the most visually appealing idea in the brief, and cut (D15). The source contains no
soil-layer pedagogy — no horizon descriptions, no root-depth figures, nothing about where nutrients
sit. Building it means inventing the teaching content, which violates PRD §7.1. Revivable if D8
brings in LDD soil-profile material.

### Scrubbable basal/top-dressing timeline
Demoted to a static annotated diagram in T-022. The source gives §2.7 about four lines, and the
only real timing detail is in the excluded Cambodian rice table. A time slider implies
week-by-week precision the source cannot support. Revisit if D8 adds official per-crop timing.

### Calculator: blend mixing
Combining two or more fertilizers to hit a target N–P₂O₅–K₂O. Useful, and the feature most likely
to produce a confidently wrong number with nothing in the source to validate it against (D10).
Would need its own validation dataset before being trustworthy.

### Calculator: cost per kg of nutrient
Compare value between grades. Needs price data, which is market data, which goes stale — a
different kind of source problem from everything else here.

### Calculator: elemental ↔ oxide conversion
**Deliberately absent, and should stay absent.** Bags are labelled in oxide form and the source
works entirely in oxide; offering the conversion creates a ~2.3× error path for phosphorus for no
beginner benefit (D10). If ever added, it belongs behind an explicit expert mode, never in the
default flow.

---

## Platform & engineering

### Phone-first design
Phones must not break (T-026) but are not designed for. If analytics show meaningful phone traffic,
this is the first thing to revisit — and for the actual audience of Thai small farmers, that is a
realistic outcome worth watching.

### Offline / PWA
A service worker would suit the audience well: the site is fully static, and rural connectivity is
patchy. Deferred only to keep v1 small.

### Printable chapter / PDF export
A one-page printable summary per chapter would be genuinely useful for farmers without a device in
the field. Pure CSS `@media print` work, no new content required.

### glTF modelled assets
v1 is 100% procedural (D7). Revisit only if the procedural plant looks too crude on screen — and
then weigh licensing, page weight, and the Draco/meshopt pipeline against the fact that a stylized
diagram usually teaches better than a photoreal one.

### Content search
Seven short chapters don't need it. Would matter if the corpus grows substantially via D8.

### Owner-facing content editing
Content lives in MDX and JSON edited through git. A CMS would decouple content from deploys, which
only matters if someone other than the owner starts writing.
