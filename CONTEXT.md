# Context — Shared vocabulary

The language this project uses. Glossary only: no implementation details, no decisions
(those live in `docs/DECISIONS.md`).

The source pamphlet carries its own 20-row glossary on p14 (Thai / Khmer / English / Chinese).
That glossary is the authority for Thai agronomic terms and is imported wholesale in task T-009.
Until then, terms below marked ⏳ are provisional and must be reconciled against p14 on import.
Terms marked ✅ are confirmed from the source or from the project brief.

---

## Agronomic terms (Thai)

### ปุ๋ยรองพื้น — basal fertilizer ✅
Fertilizer applied at or before planting, worked into the soil so it is available to young roots.
Contrast with **ปุ๋ยแต่งหน้า**. The source covers both in §2.7 (p5) in about four lines; detailed
timing appears only in the Cambodian rice table, which this project excludes.

### ปุ๋ยแต่งหน้า — top dressing ✅
Fertilizer applied to the soil surface after the crop is already growing. Contrast with
**ปุ๋ยรองพื้น**.

### ไร่ — rai ✅
The Thai unit of area used for every Thai rate in the source: 1 ไร่ = 1,600 m², and 1 hectare =
6.25 ไร่. All Thai rates are expressed in kg/rai. Cambodian rates in the source are in kg/ha and
are not converted (see `docs/DECISIONS.md` D11).

### สูตรปุ๋ย — fertilizer grade ⏳
The three numbers printed on a bag, always read as **N–P₂O₅–K₂O** in that order, e.g. `46-0-0`
(urea) or `16-20-0`. In this project "grade" always means the printed triple, never the chemical
formula of a compound. Note the source's own worked example: a 50 kg bag of `16-20-0` contains
8 kg N and 10 kg P₂O₅.

### ธาตุอาหารหลัก / ธาตุอาหารรอง / จุลธาตุ — primary / secondary / micronutrients ⏳
The three nutrient groups in the source's p2 table. Primary = N, P, K.

### ที่มาของข้อมูล — sources ✅
The citation section shown on every chapter. Not "references", not "bibliography" — this exact
phrase is the user-facing label.

### 4R ✅
The right source, rate, time, and place. Appears in the source's safety chapter (p6).

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
