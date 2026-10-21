# Context — Shared vocabulary

The language this project uses. Glossary only: no implementation details, no decisions
(those live in `docs/DECISIONS.md`).

The source pamphlet carries its own 20-row glossary on p14 (Thai / Khmer / English / Chinese).
That glossary is the authority for Thai agronomic terms, and it is imported below under
"Terms from the source glossary". Where this file disagrees with the source, the source wins and
the disagreement is recorded under "Reconciled on import".

Terms marked ✅ are confirmed from the source or from the project brief. A term marked ⚠ is
used by the project but is **not** printed in the source; it is flagged for the owner, never
presented as the source's own.

---

## Agronomic terms (Thai)

### ปุ๋ยรองพื้น — basal fertilizer ✅
In the source (p5, §2.7): "ใส่ก่อนหรือพร้อมปลูก เน้น P และ K" — applied before or at planting, with
the emphasis on P and K, e.g. `16-20-0` or manure. Contrast with **ปุ๋ยแต่งหน้า**. Matches p14
(Basal fertilizer, 基肥). The source defines both terms in about four lines; the only detailed timing is in
the Cambodian rice table, which this project excludes. It uses the terms in a few other places with
no further timing: the straight-fertilizer table (p4, DAP and TSP as ปุ๋ยรองพื้น) and the chapter-7
summary ("ใส่ P และ K เป็นปุ๋ยรองพื้น ส่วน N แบ่งใส่เป็นปุ๋ยแต่งหน้า").

### ปุ๋ยแต่งหน้า — top dressing ✅
In the source (p5, §2.7): "ใส่ระหว่างที่พืชเติบโต เน้น N และแบ่งใส่หลายครั้ง" — applied while the
crop is growing, with the emphasis on N, split into several doses, e.g. urea at rice tillering or
booting. Contrast with **ปุ๋ยรองพื้น**. Matches p14 (Top dressing, 追肥).

### ไร่ — rai ✅
The Thai unit of area used for every Thai rate in the source: 1 ไร่ = 1,600 m², and 1 hectare =
6.25 ไร่. All Thai rates are expressed in kg/rai. Cambodian rates in the source are in kg/ha and
are not converted (see `docs/DECISIONS.md` D11).

### สูตร / ตัวเลข 3 ตัวบนกระสอบ — fertilizer grade ✅
The three numbers printed on a bag, always read as **N–P₂O₅–K₂O** in that order, e.g. `46-0-0`
(urea) or `16-20-0`. The source calls them "ตัวเลข 3 ตัวบนกระสอบ" (ch. 3, p6, "the 3 numbers on the
bag") and heads the grade column of its tables simply **สูตร**. In this project "grade" always means
the printed triple, never the chemical formula of a compound. The source's own worked example: a
50 kg bag of `16-20-0` contains 8 kg N and 10 kg P₂O₅.

⚠ The phrase **สูตรปุ๋ย** is natural Thai for this, and an earlier draft of this file used it as the
term. It does not occur anywhere in the source, so it is not recorded as the source's word.
Whether the site's UI may use it is the owner's call.

### ธาตุอาหารหลัก / ธาตุอาหารรอง / จุลธาตุ — macronutrients / secondary nutrients / micronutrients ✅
The three nutrient groups in the source's p2 table, with the source's own English labels:
**Macronutrients** (N, P, K), **Secondary** (Ca, Mg, S) and **Micronutrients** (Fe, Zn, B, Mn, Cu,
Mo, Cl, Ni). Only จุลธาตุ (Micronutrient, 微量元素) is also in the p14 glossary. An earlier draft
called the first group "primary"; the source says Macronutrients, so that is what is used.

### ที่มาของข้อมูล — sources ✅
The citation section shown on every chapter. Not "references", not "bibliography" — this exact
phrase is the user-facing label, set by the project brief. The source itself uses the narrower
"ที่มาของตัวเลข" (p3).

### 4R ✅
The right source, rate, time, and place. Appears in the source's chapter 4, การใส่ปุ๋ยในทางปฏิบัติ
(p6), as "หลัก 4 ถูก (4R): ถูกชนิด ถูกอัตรา ถูกเวลา และถูกที่".

---

## Terms from the source glossary (p14)

All twenty rows of the pamphlet's own glossary. The source also gives each in Khmer and Chinese.
The Chinese is kept in the glossary data; the **Khmer column is not carried anywhere**, because its
text layer does not extract reliably and v1 is Thai-only. Neither is shown in this table. All ✅:
they are the source's own words.

| ไทย | English |
| --- | --- |
| ปุ๋ย | Fertilizer |
| ปุ๋ยเคมี | Chemical fertilizer |
| ปุ๋ยอินทรีย์ | Organic fertilizer |
| ปุ๋ยไนโตรเจน | Nitrogen fertilizer |
| ปุ๋ยฟอสเฟต | Phosphate fertilizer |
| ปุ๋ยโพแทช | Potash fertilizer |
| ปุ๋ยสูตรผสม | Compound fertilizer |
| การใส่ปุ๋ย | Applying fertilizer |
| ปุ๋ยรองพื้น | Basal fertilizer |
| ปุ๋ยแต่งหน้า | Top dressing |
| ปุ๋ยคอก | Manure |
| ปุ๋ยหมัก | Compost |
| ปุ๋ยชีวภาพ | Bio-fertilizer |
| ยูเรีย | Urea |
| ไดแอมโมเนียมฟอสเฟต | DAP |
| ปุ๋ยละลายช้า | Slow-release fertilizer |
| ปุ๋ยทางใบ | Foliar fertilizer |
| ปูน / โดโลไมท์ | Lime / Dolomite |
| จุลธาตุ | Micronutrient |
| ปุ๋ยไหม้ | Fertilizer burn |

## Reconciled on import

Where this file's earlier, provisional wording disagreed with the source, the source won.

1. **สูตรปุ๋ย is not a source term.** The source says "สูตร" (table header) and "ตัวเลข 3 ตัวบนกระสอบ".
   Corrected above; the earlier phrase is kept only as a flagged ⚠ note.
2. **"Primary" nutrients → Macronutrients.** The source's p2 table says ธาตุอาหารหลัก
   (Macronutrients). Corrected above.
3. **ปุ๋ยรองพื้น and ปุ๋ยแต่งหน้า were defined with words the source does not use.** The earlier text
   said basal fertilizer is "worked into the soil so it is available to young roots" and that top
   dressing goes "to the soil surface". Neither phrase is in the source, so both were replaced with
   the source's own p5 wording. One consequence: the source never says a top dressing is left on the
   surface — its chapters 4 and 7 call urea left on the soil surface a mistake and say to bury it.
4. **ปุ๋ยสูตรผสม is ambiguous inside the source.** §2.2 names three chemical types — เชิงเดี่ยว,
   เชิงผสม and เชิงประกอบ — without defining them or giving English for them. §2.4 and p14 use
   ปุ๋ยสูตรผสม for **Compound fertilizer**. The source does not say how the three types map onto that
   term. This file uses the p14 reading and does not guess the rest.
5. **ปูน / โดโลไมท์ lumps terms the chapters separate.** The glossary row is "Lime / Dolomite", but §2.8
   distinguishes ปูนมาร์ล (marl), โดโลไมท์ (dolomite), ปูนขาว (slaked lime) and ยิปซัม (gypsum), says
   they are *not fertilizer* but soil conditioners, and measures the first three against **หินปูนบด**
   (ground limestone), which p14 does not list. Where precision matters, use the §2.8 names.
6. **Not in p14 at all, and confirmed elsewhere in the source:** ไร่ (rai, p6), ธาตุอาหารหลัก and
   ธาตุอาหารรอง (p2), and 4R (p6). ที่มาของข้อมูล is the project brief's label, not the source's — the
   source's nearest phrase is "ที่มาของตัวเลข" (source of the numbers, p3).

7. **Four p14 terms are not used in the chapters.** ปุ๋ยไนโตรเจน, ปุ๋ยฟอสเฟต, ปุ๋ยโพแทช and
   ไดแอมโมเนียมฟอสเฟต appear only in p14. The chapters say โพแทสเซียม (not โพแทช) and "DAP" (p4) rather
   than the Thai name. They are p14-only; the chapters do not use these spellings.
8. **English labels differ between p14 and the chapter headings.** p14 says Chemical fertilizer, Organic
   fertilizer, Compound fertilizer, Slow-release fertilizer, Foliar fertilizer and Micronutrient; the
   headings in chapter 2 say Chemical, Organic, Compound, Slow/Controlled-release and Liquid/Foliar, and
   p2 says Micronutrients. §2.6 pairs ปุ๋ยทางใบ with ปุ๋ยน้ำ (liquid), which p14 omits. The p14 labels are
   the ones used in the table above.

A note for whoever reads ปุ๋ยรองพื้น later: an official standard cited by the source (TAS 4401-2008)
extends the basal rate for rice to the tillering stage, which is wider than "ก่อนหรือพร้อมปลูก". That
disagreement is recorded as proposal A-05 in `docs/content/ADDITIONS.md` and is the owner's to decide;
until then this file follows the source.

---

## Domain concepts (project-canonical English, used in code and docs)

### Nutrient
Always an **oxide-form** quantity: N, P₂O₅, or K₂O. This project never represents elemental P or
K, and never converts between elemental and oxide form, because the two differ by ~2.3× for
phosphorus and bags are labelled in oxide. A quantity without a stated form is an error.

### Rate
A published quantity of fertilizer per unit area or per plant, for a specific crop, from a specific
source page — e.g. "cassava, 15-15-15, 25–50 kg/rai". A Rate is a *range* more often than a single
number, and it is always a **starting point**, never a prescription: every Rate displayed carries
the soil-test note.

### Mobility rule
The teaching principle that mobile nutrients show deficiency in **old** leaves first while immobile
ones show it in **young** leaves first. This is the spine of the deficiency chapter and the single
best-supported idea in the source (p3, 10-row symptom table).

### Source Tier
The authority band assigned to each cited domain, one of three: **official** (a government or
intergovernmental body — doa.go.th, ldd.go.th, ricethailand.go.th, FAO), **research** (a university,
research institute or peer-reviewed journal — irri.org, CIAT, Kasetsart), or **commercial** (everything
else: company, retailer, blog, news, or an inventor's claim). The source's 67 inline links name 37
domains with no bibliography and mixes the tiers freely, so we assign them ourselves and display them.

### Actionable
A Rate is *actionable* when it may feed the calculator or the crop matcher: it is attributed to a
country the site serves, and at least one source behind it is not merely **commercial**. Anything else
is shown as descriptive text only. This is a strongest-link rule — one official or research source is
enough — and not a count: three commercial
sources do not add up to one official one.

### Addition
A proposed fact that is *not* in the source pamphlet, recorded in `docs/content/ADDITIONS.md` with
its claim, its official URL, and the feature that needs it. An Addition is inert until the owner
approves it. Unapproved Additions never reach the site.

### Country tag
A marker on data rows (`TH` or `KH`) recording which country's soils and practice a Rate was
published for. Rows tagged `KH` exist in the data layer but do not render in v1 — Cambodian
soil-group recommendations do not transfer to Thai conditions.

### Chapter
One of seven lesson units, each mapping to a learning goal G1–G7, each a route, each ending in its
own ที่มาของข้อมูล section.

### Interactive
A hands-on element inside a Chapter. Exactly two Interactives use WebGL (the deficiency plant, and
the same plant reused in Chapter 1); the rest are 2D DOM/SVG.

### `nums` / `skip` (inherited pattern)
Two teaching devices borrowed from the owner's earlier `factory-walkthrough-th.html`: `nums` is the
per-section list of figures with their citation ("ตัวเลขที่ใช้ในโซนนี้ (จากบทความ)"), and `skip`
states what goes wrong if you omit this step. Both carry over to Chapters here.
