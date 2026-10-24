# Thai phrasing flagged for the owner

The extraction rule is that agronomic meaning is never changed under cover of style
editing (D19), so nothing in this list has been touched in `content/th/`. These are
places where the source's Thai is clumsy, regional, or reads like a translation, and
where a beginner might stumble. Each one is a question for you, not a proposed edit.

Decide each with ✅ (leave as the source has it) or ✍️ (reword — and say how).

**An approved reword is never applied by editing `docs/content/raw/`.** That directory
is the only surviving evidence of what the PDF actually said; editing it to make a
reword pass would destroy the audit trail and silently re-bless every future change to
the same line. An approved reword is recorded as an explicit, justified exception in
`docs/content/raw/manifest.json`, alongside the three entries already in
`excludedProse`, so the deviation stays visible in the diff forever.

## Reads like English, not Thai

| #   | Where               | Source text                             | Why it is flagged                                                                                                                                                      |
| --- | ------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `ch04` สิ่งแวดล้อม   | `สาหร่ายบลูม`                            | A transliteration of "algal bloom". Thai normally says `สาหร่ายสะพรั่ง` or, colloquially, `น้ำเขียว`. A home gardener is unlikely to recognise `บลูม`.                        |
| 2   | `ch02` 2.2 ข้อดี     | `ออกฤทธิ์เร็ว`                            | `ออกฤทธิ์` is pharmacological — it is what a drug or a poison does. For fertilizer, `ให้ผลเร็ว` or `พืชตอบสนองเร็ว` is the ordinary phrasing.                                  |
| 3   | `ch02` 2.5          | `ข้อดีคือใส่ครั้งเดียว N สูญเสียน้อย`        | Three clauses stacked with no connective. Grammatical, but reads as notes rather than prose.                                                                             |

## Terminology that may not land with beginners

| #   | Where             | Source text          | Why it is flagged                                                                                                                                                       |
| --- | ----------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 4   | `ch02` 2.3 heading | `ปุ๋ยแม่ปุ๋ย N-P-K`     | Redundant. The standard term is just `แม่ปุ๋ย`. `ปุ๋ยแม่ปุ๋ย` reads as "fertilizer mother-fertilizer".                                                                       |
| 5   | `ch04` ความปลอดภัย | `เก็บปุ๋ยในที่แห้งบนแคร่` | `แคร่` is a raised bamboo or wooden platform — regional, and not obviously the same idea as a pallet to a reader outside the farming north-east.                           |
| 6   | `ch02` 2.1          | `สารเร่ง พด.`         | An LDD product code with no expansion anywhere in the book. A beginner has no way to decode `พด.`, and unlike `แคร่` there is not even a guessable everyday meaning.        |
| 7   | `ch04` ความผิดพลาด  | `เอกสาร MSU Extension EB0209` | A bare untranslated English document ID and unexpanded acronym, carrying the single most actionable number in the chapter (N loss of 30–44%). The reader most likely to act on it is the least likely to parse it. |

## Content divergences worth your eye

These are not phrasing problems. They are places where the source is internally
inconsistent or where a category is represented by a single example, which matters more
for the data extraction in T-006 than for the prose.

| #   | Where                  | What                                                                                                                                                                                 |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8   | `ch01` nutrient groups | The Thai micronutrient row lists `Fe, Zn, B, Mn, Cu, Mo, Cl, Ni`; the Khmer edition of the same table (p7) omits `Cl` and `Ni`. The Thai edition is what v1 ships; flagging the divergence. |
| 9   | `ch01` mobility rule   | The Thai immobile list is `(Fe, Ca, B, S, Mn)`; the Khmer edition omits `Mn`. Same resolution — Thai wins — but the deficiency explorer (T-019) is built on this rule, so it should be deliberate. |
| 10  | `ch02` organic table   | `ปุ๋ยพืชสด (ปอเทือง)` gives one species, sunn hemp, as the NPK figure for the whole green-manure category. The number is the source's; the generalisation is the source's too.            |
| 11  | `ch02` 2.8             | `ปูนขาว … ห้ามใส่พร้อมยูเรีย` is stated without a reason. It is correct (ammonia volatilisation), but a beginner reading a bare prohibition is likely to ignore it.                         |
| 12  | `ch05` rice, sandy soil | The pamphlet lists `16-8-8` among sandy-soil rice grades (p5, and p12 where the row cites TAS 4401-2008). TAS 4401-2008 itself lists only `16-16-8` and `18-12-6` for loam, sand and sandy loam and does not contain `16-8-8` anywhere (checked by reading the standard in full). The extraction keeps the pamphlet's figure, since that is what the source prints; it is flagged because the cited standard does not back it. |

## Not flagged, and why

For the record, these were considered and left alone:

- `ฝนใกล้ตก` (`ch02` 2.6) — colloquial, but unambiguous and natural.
- `ยอดเป็นกระจุก` (`ch01` Zn row) — the standard Thai description of rosetting.
- `กระสอบ` for a fertilizer bag (`ch03`) — correct and universal.
- Arabic rather than Thai numerals throughout — the source's own choice, and the one
  a reader comparing the page against a real bag label needs.

## Deferred to the T-006 table review

- `หน้าที่ (จำง่าย)` — the third column header of the `nutrient-groups` table. Clipped:
  it means "function, in an easy-to-remember form", but as a two-word parenthetical it
  is ambiguous about what exactly is easy to remember. The table rows are not extracted
  yet, so this belongs to T-006's review rather than this one.

## New UI Thai written for T-010 (not from the source)

D6: new Thai is allowed only for interface chrome, and is listed here for you. These live in
`content/th/ui.json`; changing one is a one-line edit. Decide each with ✅ or ✍️.

| #   | Key               | Thai                | Used for                                              |
| --- | ----------------- | ------------------- | ----------------------------------------------------- |
| U1  | `skipToContent`   | `ข้ามไปยังเนื้อหา`   | Keyboard/VoiceOver skip link at the top of every page |
| U2  | `contents`        | `สารบัญ`             | Chapter list heading, nav label, and link back to it  |
| U3  | `chapterNav`      | `เลื่อนระหว่างบท`     | Accessible name of the previous/next navigation       |
| U4  | `previousChapter` | `บทก่อนหน้า`          | Link prefix, followed by the previous chapter's title |
| U5  | `nextChapter`     | `บทถัดไป`            | Link prefix, followed by the next chapter's title     |

`siteTitle` (`เรียนรู้เรื่องปุ๋ย`) is not new: it is the title already shipped since T-002.

## New UI Thai written for T-011 (not from the source)

Same rule as above (D6). These are in `content/th/ui.json`. U6 is a project label and U7–U9
are my own names for the three source tiers (D9); the source has no word for a tier, so
none of them can be quoted. Decide each with ✅ or ✍️.

| #   | Key               | Thai                     | Used for                                                                 |
| --- | ----------------- | ------------------------ | ------------------------------------------------------------------------ |
| U6  | `sources`         | `ที่มาของข้อมูล`          | Not new: the project brief's fixed label (CONTEXT.md). Heading of every chapter's citation section. |
| U7  | `tierOfficial`    | `ทางการ`                  | Badge for `official` sources (government, standards)                      |
| U8  | `tierResearch`    | `งานวิจัย`                | Badge for `research` sources (university, journal)                        |
| U9  | `tierCommercial`  | `เชิงพาณิชย์`             | Badge for `commercial` sources (company, blog, news). Also covers blogs and news, which `เชิงพาณิชย์` does not literally say — a better word is welcome. |
| U10 | `tierLabel`       | `ระดับแหล่งที่มา`         | Read aloud before each badge by VoiceOver; not shown on screen            |
| U11 | `jumpToSources`   | `ไปที่ที่มาของข้อมูล`      | The always-reachable link at the top of each chapter                      |
| U12 | `pamphletPages`   | `หน้าในเอกสารต้นฉบับ`      | "Pages in the original document", followed by e.g. `3–5`                  |
| U13 | `unnamedSources`  | `แหล่งที่ไม่ได้ระบุชื่อ`    | After `+2` / `+3`: sources the pamphlet counts but does not name          |
| U14 | `noLink`          | `ไม่มีลิงก์`              | A source the pamphlet names with no link (e.g. a standard number)         |

`soilTestNote` is **not** new Thai: it is the pamphlet's own p3 sentence
(`ควรส่งดินตรวจที่สถานีพัฒนาที่ดินจังหวัดก่อนเติมปุ๋ย`), and a unit test pins it to the raw
page. Note what the source says: *send soil for testing before applying fertilizer*. It does
not use the words "starting point", so the site does not claim the source said that.

| U15 | `soilTestNote` | `ควรส่งดินตรวจที่สถานีพัฒนาที่ดินจังหวัดก่อนเติมปุ๋ย` | **Decide this one.** The wording is the pamphlet's own (p3), but there it closes a warning about yellow leaves (*"ใบเหลืองอาจเกิดจากน้ำขัง รากเสีย หรือดินกรดจัดก็ได้ ควรส่งดินตรวจ…"*). The site attaches it to every rate, which is the site's use of it, not something the pamphlet says about rates. ✅ keep it, or ✍️ give me wording to use instead. |

## New UI Thai written for T-012 (not from the source)

| #   | Key                     | Thai                                | Used for                                                                                                                                                                       |
| --- | ----------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| U16 | `nutrientGroupsCaption` | `ธาตุอาหารพืช`                       | Hidden table caption read by VoiceOver for the p2 table. The pamphlet's table has no caption of its own.                                                                         |
| U17 | `numsHeading`           | `ตัวเลขที่ใช้ในบทนี้ (จากเอกสาร)`     | Heading of each chapter's list of figures. Adapted from your factory page's `ตัวเลขที่ใช้ในโซนนี้ (จากบทความ)`: `โซน` → `บท` (this site has chapters) and `บทความ` → `เอกสาร` (the source is a pamphlet, not an article). Note `ตัวเลข` means "numbers": for chapter 1 the three items are a statute year and two mobility rules, so a word like `ข้อมูลสำคัญ` may fit better. |

The three column headings of the p2 table (`กลุ่ม`, `ธาตุ`, `หน้าที่ (จำง่าย)`) are the pamphlet's
own words and a test pins them to the raw page; they are not new Thai.

## New UI Thai written for T-014, the calculator (not from the source)

Two keys are the pamphlet's own words and are not new: `calcUse` = `ให้ใช้` and `calcKg` = `กก.`
(p6: *"ให้ใช้ 10 × 100 ÷ 46 ≈ 22 กก."*). `calcGrade` = `สูตร (ตัวเลข 3 ตัวบนกระสอบ)` joins the
pamphlet's table heading `สูตร` with its own phrase `ตัวเลข 3 ตัวบนกระสอบ` (ch. 3, p6); it avoids
`สูตรปุ๋ย`, which is still your call (CONTEXT.md). Everything below is written by me.

| #   | Key                    | Thai                                              | Used for                                                              |
| --- | ---------------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| U18 | `calcHeading`          | `คำนวณปริมาณปุ๋ย`                                  | Heading of the calculator                                             |
| U19 | `calcNutrient`         | `ธาตุที่ต้องการ`                                   | Legend over the N / P₂O₅ / K₂O choice                                  |
| U20 | `calcTarget`           | `ปริมาณธาตุที่ต้องการ (กก./ไร่)`                    | Label of the amount field; `กก./ไร่` is the pamphlet's unit            |
| U21 | `calcPick`             | `เลือกสูตรที่มีในเอกสาร`                            | Label of the list of grades the pamphlet prints                        |
| U22 | `calcCustom`           | `กรอกเอง`                                          | First option of that list: type your own three numbers                 |
| U23 | `calcSubmit`           | `คำนวณ`                                            | The button                                                            |
| U24 | `calcPerRai`           | `ต่อไร่`                                           | After the answer: "≈ 22 กก. ต่อไร่" (the target is per rai)            |
| U25 | `calcWorking`          | `วิธีคำนวณ`                                        | Heading over the step-by-step arithmetic                              |
| U26 | `calcErrTargetEmpty`   | `กรอกปริมาณธาตุที่ต้องการ`                          | The amount field is empty                                             |
| U27 | `calcErrTargetInvalid` | `กรอกปริมาณเป็นตัวเลขที่ไม่ติดลบ`                    | The amount is a number but negative                                   |
| U28 | `calcErrGradeEmpty`    | `กรอกตัวเลขสูตรให้ครบทั้ง 3 ช่อง`                   | One of the three grade fields is blank                                |
| U29 | `calcErrGradeInvalid`  | `ตัวเลขสูตรต้องไม่ติดลบ และรวมกันไม่เกิน 100`        | A grade number is negative, or the three add to more than 100         |
| U30 | `calcErrNutrientZero`  | `สูตรนี้ไม่มีธาตุที่เลือก (0%) จึงคำนวณไม่ได้`       | e.g. asking for P₂O₅ from urea 46-0-0                                 |
| U32 | `calcErrNotNumber`     | `กรอกเป็นตัวเลข โดยใช้จุด (.) เป็นทศนิยม`            | Text, `1e3` or a comma such as `1,5` in any field: "enter a number, with a point for decimals" |
| U31 | `calcErrResult`        | `ตัวเลขใหญ่เกินไปที่จะคำนวณ`                        | The amount is so large the answer overflows                           |

The grade list shows each straight fertilizer by the Thai name the pamphlet gives it (`ยูเรีย`,
`แอมโมเนียมซัลเฟต`, `DAP`, `TSP`, `KCl`, `K₂SO₄`); the Chinese gloss in the pamphlet's glossary is
dropped. The soil-test note under every answer is the p3 sentence from U15.

## The bag reader, T-015: no new UI Thai, but two things for you to decide

All five strings the reader adds to `content/th/ui.json` are the pamphlet's own words from p6
and a test pins each to the raw page: `ตัวเลข 3 ตัวบนกระสอบ` (legend), `กระสอบ`, `มี`, `ไม่มี`, and
`เปอร์เซ็นต์` (read aloud with each number: "N 16 เปอร์เซ็นต์").
The explanations are the p2 table's own wording, and the amounts (8 kg, 10 kg) are what the
calculator works out for the pamphlet's own 50 kg bag of 16-20-0.

| #   | Question                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | **`ไม่มี K`, not `ไม่มี K₂O`.** For the K₂O tile the panel says `กระสอบ 50 กก. ไม่มี K`, because that is the pamphlet's wording on p6, and the explanation line above it (`K = ผลโต …`) is the p2 table's. Both use the element letter while the tile says K₂O. I kept the source's words. ✅ keep, or ✍️ show `K₂O`?                |
| Q2  | **Nothing tells a beginner the numbers are tappable.** The tiles look like cards and N is already chosen, so the explanation is visible on arrival, but there is no `แตะตัวเลขเพื่อดูความหมาย` ("tap a number to see what it means"). That would be new Thai, so I did not add it. ✅ leave as is, or ✍️ give me wording?             |

## The deficiency explorer, T-018: five new UI strings, the rest the pamphlet's own

These are the pamphlet's own words, and tests pin them to the raw pages or to chapter 1:
`ใบแก่`, `ใบอ่อน/ยอด` (the two leaf classes, from the p2 sentence), the two rule sentences (`ธาตุที่เคลื่อนที่ได้ในพืช … ใบแก่ ก่อน` and `ธาตุที่เคลื่อนที่ไม่ได้ … ใบอ่อน/ยอด ก่อน`, identical to the figures in `lib/nums.ts`), the column heading `อาการ` (p3), and the caption `อาการขาดธาตุ` (chapter 1's own label). Every symptom is the p3 line.

New Thai, written for the site and **needing your ✅ / ✍️**:

| #   | Key              | Thai                                                                  | Used for                                                                                                                                  |
| --- | ---------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| U33 | `defLegend`      | `เลือกตำแหน่งใบ`                                                       | Label of the three-way choice ("choose which leaves").                                                                                    |
| U34 | `defUnplaced`    | `เอกสารไม่ระบุตำแหน่งใบ`                                               | Third choice: Zn and Cu / Mo, which the pamphlet lists on p3 but does not place on old or young leaves.                                   |
| U35 | `defRuleNone`    | `เอกสารไม่ได้ระบุว่าธาตุกลุ่มนี้แสดงอาการที่ใบแก่หรือใบอ่อนก่อน`           | Shown in place of the rule for that third choice: "the pamphlet does not say whether this group shows on old or young leaves first".      |
| U36 | `defSceneLabel`  | `ภาพวาดต้นพืชสามมิติ ลากเพื่อหมุน`                                         | VoiceOver name of the 3D plant: "a 3D drawing of a plant, drag to rotate". It says "drawing" on purpose and makes no claim about where old and young leaves sit (an earlier draft did; the reviewer removed it). |
| U37 | `defNo3d`        | `เครื่องนี้แสดงภาพสามมิติไม่ได้ ใช้ตัวเลือกด้านบนและตารางด้านล่างแทน`      | Shown instead of the plant when the device cannot do WebGL: "this device cannot show the 3D picture; use the choices above and the table below". |

Also worth your eye: the plant tells nobody it can be dragged or pinched except through U36
(`ลากเพื่อหมุน`, "drag to rotate"), which is read by VoiceOver but not shown on screen.

## The crop matcher, T-020: three new UI strings, three of the pamphlet's own words

The pamphlet's p12–13 crop table is printed in **English**. D6 forbids new agronomic Thai, so each item's wording is shown exactly as printed (marked as English) next to a structured line built from the data: `สูตร` and the number with the source's own unit (`kg/rai`, `kg/ha`, `kg/tree`), not translated. **Decision for you:** if you want those items in Thai, the translation has to be yours, or approved by you line by line.

The pamphlet's own words (pinned to the raw pages by a test): `ปุ๋ยรองพื้น`, `ปุ๋ยแต่งหน้า` (p5), `อัตราอ้างอิง` (p3, there used for the standard's rate). The crop names are the table's own Thai (`ข้าว`, `ข้าวโพด`, `มันสำปะหลัง`, `อ้อย`, `มะม่วง`, `ทุเรียน`, `ผัก`; `ยางพารา` is the p5 word for the group, the two rows are `ยางก่อนเปิดกรีด` and `ยางเปิดกรีด`).

New Thai, needing your ✅ / ✍️:

| #   | Key                      | Thai                                                                                        | Used for                                                                                                          |
| --- | ------------------------ | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| U38 | `cropLegend`             | `เลือกพืช`                                                                                   | Label of the eight-crop choice ("choose a crop").                                                                 |
| U39 | `cropNoReliable`         | `ยังไม่มีแหล่งที่เชื่อถือได้พอสำหรับพืชนี้ จึงแสดงเป็นข้อความอ้างอิงเท่านั้น ไม่ใช่ตัวเลขที่แนะนำ`  | Shown for a crop (sugarcane, rubber, mango, vegetables) whose only backing is commercial or unattributed: "no source reliable enough for this crop yet, so reference text only, not a recommended figure". Also read aloud on selecting it. |
| U40 | `cropDescriptiveHeading` | `ข้อความอ้างอิง (ไม่ใช่ตัวเลขที่แนะนำ)`                                                        | Heading over any guidance the site will not stand behind as a number: "reference text (not a recommended figure)". |

Things to decide, all in `docs/TASKS.md` T-020 Verified note: the cassava number (a CIAT **regional** figure, about 80–96 kg/rai, roughly 3× the Thai 25–50 kg/rai that sits under the reference heading), the vegetables row (its only source is a Cambodian working paper), and chapter 5's sources list (`irri` and `cambridge` removed).

## The quiz, T-021: eight new UI strings, the questions and answers are the pamphlet's

The six questions and their answers are the pamphlet's own (p6–7), unchanged; a test pins each to the raw pages. The extraction had stray spaces (`?` after a space, `กก .`, `K ₂ SO ₄`); the stored text has them tidied (R14 in `docs/content/SOURCES.md`), words unchanged.

The pamphlet prints answers after an arrow and **no wrong options**, so the quiz is a **self-check**: show the answer, then mark whether you had it. Nothing is graded by the site, so the score line says what it counts (your own marks), not "you scored".

| #   | Key         | Thai                       | Used for                                                                                       |
| --- | ----------- | -------------------------- | ---------------------------------------------------------------------------------------------- |
| U41 | `quizShow`  | `ดูคำตอบ`                   | Button that opens a question's answer ("see the answer").                                      |
| U42 | `quizHide`  | `ซ่อนคำตอบ`                 | Same button when it is open ("hide the answer").                                               |
| U43 | `quizAnswer`| `คำตอบ`                     | Label before the answer.                                                                       |
| U44 | `quizRight` | `ตอบถูก`                    | Mark: "I got it right". Also shown beside a marked question.                                   |
| U45 | `quizAgain` | `ยังไม่ถูก`                 | Mark: "not right yet". Also shown beside a marked question and counted in the score line.      |
| U46 | `quizScore` | `ทำเครื่องหมายว่าตอบถูก`     | Start of the score line: "marked as right: 2 of 6" (`ทำเครื่องหมายว่าตอบถูก 2 จาก 6`, plus `· ยังไม่ถูก 1` when some are marked not yet). |
| U47 | `quizOf`    | `จาก`                       | "of" in the score line.                                                                        |
| U48 | `quizReset` | `เริ่มใหม่`                  | Button that clears all marks ("start over").                                                    |

## Chapters 4 and 7, T-023: one new UI string; the wording flags are still open

| #   | Key              | Thai                                                       | Used for                                                                                                                         |
| --- | ---------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| U49 | `sectionUncited` | `เอกสารต้นฉบับไม่ได้ระบุแหล่งอ้างอิงภายนอกสำหรับข้อความนี้` | Line under a block (4R, safety, mistakes, environment, the chapter 7 summary) whose text the pamphlet prints no outside source for: "the pamphlet names no outside source for this text". |

Rows 1 (`สาหร่ายบลูม`), 5 (`แคร่`) and 7 (`MSU Extension EB0209`) above are **still open** and unchanged: the chapter 4 text is the pamphlet's, word for word, and cannot be edited without your decision.

## Home page, T-027: new UI strings copied verbatim from the redesign

| # | Key | Thai | Used for |
| --- | --- | --- | --- |
| U50 | `homeTagline` | `เว็บไซต์สอนพื้นฐานเรื่องปุ๋ยสำหรับผู้เริ่มต้น เนื้อหาภาษาไทย ใช้ภาพและการโต้ตอบแทนการอ่านตำรา` | Hero line under the title. |
| U51 | `homeStart` | `เริ่มเรียน บทที่ 1` | Primary button to chapter 1. |
| U52 | `homeSeeAll` | `ดูสารบัญทั้ง 7 บท` | Secondary button to the chapter path. |
| U53 | `homeCited` | `ตัวเลขทุกตัวบนเว็บไซต์อ้างอิงกลับไปยังหน้าของแหล่งข้อมูลต้นฉบับได้` | Line under the buttons: every number cites the source page. |
| U54 | `homeDragHint` | `ลากเพื่อหมุนดูรอบต้น` | Hint under the 3D scene: "drag to rotate around the plant". |
| U55 | `homeChapterCount` | `7 บท · เริ่มที่บทที่ 1` | Chapter path caption: "7 chapters, start at chapter 1". |
| U56 | `homeHere` | `คุณอยู่ที่นี่` | Badge on chapter 1: "you are here". |
| U57 | `homeMacro` | `ธาตุอาหารหลัก` | Phone pill beside N P K (the pamphlet's own p2 words). |
| U58 | `homeSafeNote` | `อัตราปุ๋ยที่แสดงบนเว็บไซต์เป็น จุดเริ่มต้น เท่านั้น แนะนำให้ ตรวจวิเคราะห์ดิน ก่อนใช้ปุ๋ยจริง` | Safety strip: rates are a starting point; test the soil first. Differs from `soilTestNote`. |
| U59 | `themeToDark` | `สลับเป็นโหมดกลางคืน` | Accessible name of the theme button in light mode. |
| U60 | `themeToLight` | `สลับเป็นโหมดกลางวัน` | Accessible name of the theme button in dark mode. |
| U61 | `logoLabel` | `เครื่องหมายของเว็บไซต์` | Accessible name of the site mark. |
| U62 | `homeTaglineShort` | `เว็บไซต์สอนพื้นฐานเรื่องปุ๋ยสำหรับผู้เริ่มต้น ใช้ภาพและการโต้ตอบแทนการอ่านตำรา` | Phone hero line: the phone artboard's shorter version of `homeTagline` (drops เนื้อหาภาษาไทย). |
| U63 | `homeChapterCountShort` | `7 บท` | Phone chapter list caption: "7 chapters". |
| U64 | `npkNameN` | `ไนโตรเจน` | N label name. **Not in the pamphlet or the current site**: the design's word. Agronomic, so it needs your check (D6). |
| U65 | `npkNameP` | `ฟอสฟอรัส` | P label name. Same caveat as U64. |
| U66 | `npkNameK` | `โพแทสเซียม` | K label name. Same caveat as U64. |
| U67 | `chapterBack` | `หน้าแรก` | Chapter 1 hero: pill back to the home page ("Home"). From the Chapter-01 artboards. |
| U68 | `chapterWord` | `บทที่` | "Chapter", used before the number in the badge and the progress line. |
| U69 | `chapterFrom` | `จาก` | "of", for "บทที่ 1 จาก 7". |
| U70 | `tierLegend` | `ระดับแหล่งข้อมูลในบทนี้` | Label before the tier badges in the sources bar: "source tiers in this chapter". |
| U71 | `sourceLabel` | `ที่มา` | Label before a block's source line: "Source". From the Chapter-01 artboards. |
| U72 | `moreFrom` | `และอีก` | "and another", before the number of further sources. |
| U73 | `moreUnit` | `แหล่ง` | "sources", after that number: "และอีก 2 แหล่ง". |
| U74 | `defBadgeNone` | `ไม่ระบุ` | Grey badge on the deficiency answer card when the pamphlet names no leaf position: "not specified". From the Chapter-01 artboards. |
| U75 | `defFlatLabel` | `ภาพต้นพืช แสดงตำแหน่งใบแก่ด้านล่างและใบอ่อนหรือยอดด้านบน` | Spoken name of the flat plant shown when the 3D plant cannot run: "a plant, showing the old leaves low and the young leaves or tip high". From the Chapter-01 artboards. |
| U76 | `defGroupNone` | `ไม่มีข้อมูลอ้างอิง` | Group label on the explorer page's answer panel when the pamphlet names no leaf position: "no reference data". From the Deficiency artboards. |
| U77 | `defRulesHeading` | `กฎที่ใช้อ่านอาการ` | Heading of the rules panel: "the rule for reading symptoms". From the Deficiency artboards. |
| U78 | `defNext` | `ต่อไป วิธีอ่านตัวเลขบนกระสอบ` | The explorer page's link on to the bag reader (chapter 3): "Next: how to read the numbers on the bag". From the Deficiency artboards. |
| U79 | `defPickOld` | `เลือกใบแก่` | Spoken name of the hotspot on the 3D plant's old leaves: "choose the old leaves". From the Deficiency artboards. |
| U80 | `defPickYoung` | `เลือกใบอ่อนหรือยอด` | Spoken name of the hotspot on the young leaves or tip: "choose the young leaves or tip". From the Deficiency artboards. |
| U81 | `defHint` | `ลากเพื่อหมุน · แตะจุดบนใบเพื่อดูอาการ` | Hint at the foot of the 3D plant: "drag to rotate · tap a spot on a leaf to see the symptoms". From the Deficiency artboards. Differs from `homeDragHint` (U54). |
| U82 | `defExplore` | `สำรวจอาการขาดธาตุแบบ 3 มิติ` | Chapter 1's footer button into the deficiency explorer: "explore deficiency symptoms in 3D". From the Chapter-01 artboards. |
| U83 | `tableGlossaryCaption` | `อภิธานศัพท์` | Spoken name of chapter 6's glossary table: the chapter's own title ("glossary"), already on the site. |
| U84 | `colThai` | `ไทย` | Header of the glossary's Thai column: the p14 table's own header ("Thai"). |
| U85 | `quizCheckSelf` | `ตรวจคำตอบของคุณเอง` | Label before the quiz's two self-marking buttons: "check your own answer". From the Quiz artboards. |
| U86 | `quizPrev` | `ข้อก่อนหน้า` | Quiz button: "previous question". From the Quiz artboards. |
| U87 | `quizNext` | `ข้อถัดไป` | Quiz button: "next question". From the Quiz artboards. |
| U88 | `quizTotal` | `ทั้งหมด` | Before the number of questions in the side panel's heading, "ทั้งหมด 6 ข้อ" ("6 questions in all"). From the Quiz artboards. |
| U89 | `quizItem` | `ข้อ` | "Question", before a number: "ข้อ 2 จาก 6" and "ทั้งหมด 6 ข้อ". From the Quiz artboards. |
| U90 | `quizUnchecked` | `ยังไม่ตรวจ` | A question's status before it is marked: "not checked yet". From the Quiz artboards. |
| U91 | `quizDeviceNote` | `ความคืบหน้าของแบบทดสอบถูกเก็บไว้ในเครื่องของคุณเท่านั้น ไม่ต้องสมัครสมาชิก` | "Quiz progress is kept on your device only; no sign-up needed." True of the quiz: it saves to this browser's storage and sends nothing (e2e/quiz.spec.ts checks). From the Quiz artboards. |
| U92 | `quizSourceNote` | `คำถามทั้ง 6 ข้อมาจากเอกสารต้นฉบับโดยตรง ไม่มีการเขียนคำถามใหม่` | "All 6 questions come straight from the source; none were written anew." True: lib/quiz-progress.test.ts checks each against p6–7. From the Quiz artboards. |
