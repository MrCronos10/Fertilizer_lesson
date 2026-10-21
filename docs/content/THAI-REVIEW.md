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
