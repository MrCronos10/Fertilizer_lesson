# Proposed additions to the corpus (D8 gate)

The source pamphlet is thin exactly where two goals need it most: **G4** (calculation) and
**G5** (basal vs top dressing), and five of its crops have no rate the site may act on
(see `TIER-REVIEW.md`). This file proposes official claims to fill those gaps — ten entries, A-01 to A-10.

**Nothing here is on the site.** Each entry is inert until you tick its box, and a test
fails if any file under `content/` references an unticked entry. Ticked entries become
their own follow-up task; this task only produces the list.

## How to read an entry

- **Source** is an exact URL on `doa.go.th`, `ldd.go.th` or `ricethailand.go.th` — the only
  hosts D8 allows.
- **Exact claim** is copied from the document, in Thai, with whitespace normalised from the
  PDF text layer. It is never paraphrased.
- **How it was read** says what was checked. Every document below was downloaded and read
  directly, not summarised by a search engine. Search-engine summaries were used only to find
  documents, and they were wrong more than once: one attributed a **durian** fertilizer
  rate to **mango**, and none of their numbers is used here.
- **Conflicts with the corpus** lists every place the official text disagrees with the
  pamphlet. These are the entries to read most carefully.

Tick a box (`- [x]`) to approve, or leave it and say why.

---

### A-01 — Worked fertilizer calculation, both directions
- [ ] Approved by owner
- **Goals:** G4
- **Feature:** Calculator worked example (T-013/T-014)
- **Source:** <https://www.doa.go.th/ac/phetchaburi/wp-content/uploads/2023/02/%E0%B8%84%E0%B8%B3%E0%B9%81%E0%B8%99%E0%B8%B0%E0%B8%99%E0%B8%B3%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B9%83%E0%B8%8A%E0%B9%89%E0%B8%9B%E0%B8%B8%E0%B9%8B%E0%B8%A2%E0%B8%95%E0%B8%B2%E0%B8%A1%E0%B8%84%E0%B9%88%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B9%80%E0%B8%84%E0%B8%A3%E0%B8%B2%E0%B8%B0%E0%B8%AB%E0%B9%8C%E0%B8%94%E0%B8%B4%E0%B8%99%E0%B8%AA%E0%B8%B3%E0%B8%AB%E0%B8%A3%E0%B8%B1%E0%B8%9A%E0%B8%9E%E0%B8%B7%E0%B8%8A%E0%B9%84%E0%B8%A3%E0%B9%88%E0%B9%80%E0%B8%A8%E0%B8%A3%E0%B8%A9%E0%B8%90%E0%B8%81%E0%B8%B4%E0%B8%88-1.pdf>
- **Document:** คำแนะนำการใช้ปุ๋ยตามค่าวิเคราะห์ดิน สำหรับพืชไร่เศรษฐกิจ — Department of Agriculture, Division of Agricultural Production Inputs Research. No date is printed on the pages read; the URL path says 2023/02.
- **Where:** PDF page 29 (printed page 24), section 6.3 of the **sugarcane** chapter. The "ตารางที่ 8" it mentions is the sugarcane soil-test table (PDF page 24); table numbers restart in each crop chapter of this document, so it is not the maize Table 8 on page 71.
- **Exact claim:**
  > หากดินมีปริมาณฟอสฟอรัสที่เป็นประโยชน์ 20 มิลลิกรัมต่อกิโลกรัม เมื่อพิจารณาจากคำแนะนำการใช้ปุ๋ยตามค่าวิเคราะห์ดินในตารางที่ 8 พบว่า จะต้องใช้ปุ๋ยที่ให้ธาตุฟอสฟอรัส 6 กิโลกรัม P2O5 ต่อไร่ นั่นคือ หากใช้ปุ๋ย 16-16-8 เป็นปุ๋ยรองพื้นในครั้งที่ 1 จะต้องใช้ปุ๋ย 16-16-8 เท่ากับ 6 x 100/16 = 37.5 หรือ 38 กิโลกรัม ซึ่งจากการใช้ปุ๋ย 16-16-8 อัตรา 38 กิโลกรัมต่อไร่ จะให้ธาตุอาหารไนโตรเจน เท่ากับ 16 /100 x 38 = 6 กิโลกรัม N ต่อไร่ และให้ธาตุโพแทสเซียม เท่ากับ 8/100 x 38 = 3 กิโลกรัม K2O ต่อไร่
- **How it was read:** downloaded the PDF and read the text layer with `pypdf`; the arithmetic was re-checked (6×100÷16 = 37.5; 16÷100×38 = 6.08; 8÷100×38 = 3.04).
- **Why it matters:** the pamphlet's only worked example is one line (10 kg N from urea ≈ 22 kg). This one goes **both ways** — nutrient needed → kg of product, then kg of product → nutrient delivered — and does it with P₂O₅ and K₂O, which is exactly the oxide-form rule the project is built on.
- **Conflicts with the corpus:** none. It uses the same formula as the pamphlet's ch03. Note the example is worked for sugarcane; the arithmetic is crop-independent, but the 6 kg P₂O₅ figure is sugarcane's soil-test recommendation, not a general rate.

---

### A-02 — Sugarcane: when to apply, and why there is no flat rate
- [ ] Approved by owner
- **Goals:** G5, G6
- **Feature:** Sugarcane in the crop matcher (T-020), basal vs top-dressing diagram (T-021)
- **Source:** <https://www.doa.go.th/ac/phetchaburi/wp-content/uploads/2023/02/%E0%B8%84%E0%B8%B3%E0%B9%81%E0%B8%99%E0%B8%B0%E0%B8%99%E0%B8%B3%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B9%83%E0%B8%8A%E0%B9%89%E0%B8%9B%E0%B8%B8%E0%B9%8B%E0%B8%A2%E0%B8%95%E0%B8%B2%E0%B8%A1%E0%B8%84%E0%B9%88%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B9%80%E0%B8%84%E0%B8%A3%E0%B8%B2%E0%B8%B0%E0%B8%AB%E0%B9%8C%E0%B8%94%E0%B8%B4%E0%B8%99%E0%B8%AA%E0%B8%B3%E0%B8%AB%E0%B8%A3%E0%B8%B1%E0%B8%9A%E0%B8%9E%E0%B8%B7%E0%B8%8A%E0%B9%84%E0%B8%A3%E0%B9%88%E0%B9%80%E0%B8%A8%E0%B8%A3%E0%B8%A9%E0%B8%90%E0%B8%81%E0%B8%B4%E0%B8%88-1.pdf> (same document as A-01)
- **Where:** PDF pages 27 and 29 (printed 22 and 24), notes under the plant-cane tables; PDF page 30 (printed 25), Table 13
- **Exact claim (timing):**
  > ครั้งที่ 1 ใส่ปุ๋ยรองพื้นก่อนปลูกโดยผสมปุ๋ย 46-0-0 ปุ๋ย 18-46-0 และ 0-0-60 ตามสัดส่วนที่กำหนด แล้วใช้ให้หมดในครั้งเดียว ครั้งที่ 2 ใส่ปุ๋ย 46-0-0 เมื่ออ้อยอายุ 3 - 4 เดือน หลังปลูก โดยวิธีโรยข้างแถวแล้วกลบ
- **Exact claim (the rates are a lookup, not a number):** Table 13 gives the rate by soil analysis — organic matter (%) × available phosphorus (mg/kg) × exchangeable potassium (mg/kg), **45 rows** (an earlier draft of this file said 54; that was a miscount). One row, as printed:
  > <0.75 | 7-30 | <60 | 27 | 6 | 18 | 38 | 46 | 25
  read as: organic matter <0.75%, P 7–30, K <60 → recommended 27 kg N, 6 kg P₂O₅, 18 kg K₂O per rai → first application 38 kg of 16-16-8, second application 46 kg of 46-0-0 and 25 kg of 0-0-60.
- **Exact claim (the table's own header and footnote, PDF pages 30–31):** the header reads ใส่ปุ๋ยครั้งที่ 1 (รองพื้น) over the 16-16-8 column and ใส่ปุ๋ยครั้งที่ 2 (กก./ไร่) over the 46-0-0 and 0-0-60 columns. The footnote on the next page, which belongs to this table, reads:
  > กรณีดินมีอินทรียวัตถุต่ำกว่า 0.75 เปอร์เซ็นต์ ควรปรับปรุงดินด้วยวัสดุอินทรีย์ เช่น กากตะกอนหม้อกรองอ้อย อัตรา 1 ตันต่อไร่ ถ้าความเป็นกรด-ด่าง (pH) น้อยกว่า 5.6 1) ใส่ปูนโดโลไมต์ อัตรา 100 กิโลกรัมต่อไร่ 2) ควรใช้ปุ๋ยยูเรีย (46-0-0) เป็นแหล่งของไนโตรเจน ถ้าความเป็นกรด-ด่าง (pH) มากกว่า 7.3 1) เลือกใช้พันธุ์ที่เจริญเติบโตได้ดีในดินด่าง เช่น พันธุ์อู่ทอง 14 2) ใช้ปุ๋ยแอมโมเนียมซัลเฟต (21-0-0 + 24%S) เป็นแหล่งของไนโตรเจน
  > วิธีการใส่ปุ๋ยอ้อยปลูก แบ่งใส่ปุ๋ย 2 - 3 ครั้ง ครั้งที่ 1 ใส่ปุ๋ยรองพื้นพร้อมปลูก ให้มีธาตุอาหารไนโตรเจน ฟอสฟอรัส และโพแทสเซียม ครบทั้ง 3 ธาตุ โดยใส่ปุ๋ยฟอสเฟตตามอัตราแนะนำร่วมกับปุ๋ยไนโตรเจนและปุ๋ยโพแทช อย่างน้อย 1 ใน 3 ของอัตราแนะนำ ครั้งที่ 2 เมื่ออ้อยอายุ 3 - 4 เดือน หรือ 5 - 6 เดือน (กรณีปลูกอ้อยข้ามแล้ง) และดินมีความชื้นเหมาะสม ใส่ปุ๋ยไนโตรเจนและปุ๋ยโพแทชที่เหลือทั้งหมด โดยโรยข้างแถวปลูกแล้วพรวนกลบ
  > กรณีดินทรายหรือร่วนปนทราย ควรแบ่งใส่ปุ๋ย 3 ครั้ง โดยครั้งที่ 1 ให้ใส่ปุ๋ยฟอสเฟตตามอัตราแนะนำ ส่วนปุ๋ยไนโตรเจนและปุ๋ยโพแทชให้แบ่งใส่ 1 ใน 3 ของอัตราแนะนำ จากนั้นใส่ปุ๋ยไนโตรเจนและปุ๋ยโพแทช อีก 2 ครั้ง เมื่ออ้อยอายุ 3 - 4 เดือน และ 5 - 6 เดือนโดยใส่ครั้งละ 1 ใน 3 ของอัตราแนะนำ
- **How it was read:** text layer. The header and the column reading are confirmed by arithmetic against A-01's example on the same page: 38 kg of 16-16-8 supplies 6.1 kg N and 3.0 kg K₂O, and 46 kg of urea adds 21.2 kg N and 25 kg of 0-0-60 adds 15 kg K₂O, giving 27.3 kg N and 18 kg K₂O, i.e. the table's 27 and 18. The earlier request to confirm the column order is withdrawn: a reviewer checked it against the header.
- **Why it matters:** sugarcane's only backing in the corpus is a fertilizer manufacturer's datasheet (`yara`), so it is currently descriptive-only. This is an official replacement — but it cannot be a flat "kg per rai", because **the official guidance has none**. The pamphlet's `15-15-15 at 60–100 kg/rai/yr` has no counterpart in this document.
- **Decision for you:** (a) accept only the timing claim above, which is safe and small, or (b) also ingest the soil-test tables, which needs a new feature (the user enters organic matter, P and K from a soil test). (b) is real scope, so it is listed here rather than assumed.
- **Conflicts with the corpus:** the pamphlet's sugarcane row (15-15-15, 60–100 kg/rai/yr, two splits ~1 month and 30–60 days after planting) and this document (basal at planting, then 3–4 months, or 5–6 months when planted across the dry season) differ on timing as well as on rate. **The document is also not uniform within itself:** the first timing claim above (from the home-mixed tables) puts everything but urea in one dose at planting, while the footnote splits N and K across two or three doses and requires only ⅓ of N and K at planting. Both are official; the difference is the fertilizer system (home-mixed versus compound).

---

### A-03 — Cassava: a flat rate by soil texture, and when to apply it
- [ ] Approved by owner
- **Goals:** G5, G6
- **Feature:** Cassava in the crop matcher (T-020)
- **Source:** the same DOA document as A-01 (URL above)
- **Where:** PDF page 50 (printed 45), Table 4; PDF page 51 (printed 46), Table 5 and its "วิธีการใส่ปุ๋ย" note
- **Exact claim (Table 4, read from the rendered page):** recommended nutrients in kg N-P₂O₅-K₂O per rai, and the product to apply, by soil texture:

  | ลักษณะเนื้อดิน | แนะนำ (กก. N-P₂O₅-K₂O/ไร่) | ปุ๋ยที่ต้องใช้ (กก./ไร่) |
  | --- | --- | --- |
  | ดินทราย, ดินร่วนปนทราย | 16-8-24 | 100 กก. ของ 15-7-18 กับ 10 กก. ของ 0-0-60 **หรือ** 50 กก. ของ 15-15-15 กับ 18 กก. ของ 46-0-0 กับ 28 กก. ของ 0-0-60 |
  | ดินร่วนเหนียว | 8-4-8 | 50 กก. ของ 15-7-18 |
  | ดินเหนียว, ดินเหนียวปนกรวด, ดินเหนียวที่เป็นดินตื้น | 4-4-8 | 30-40 กก. ของ 13-13-21 **หรือ** 30-40 กก. ของ 15-7-18 |

- **Exact claim (timing — a note under Table 5, the soil-test table, not under Table 4):**
  > ใส่ปุ๋ย 1-2 ครั้ง เมื่อมันสำปะหลังอายุ 1-2 เดือนหลังปลูก แล้วแต่กรณี
  > 1) กรณีอัตราแนะนำปุ๋ยไนโตรเจนและโพแทช ไม่เกิน 8 กิโลรัมต่อไร่ ให้ใส่ปุ๋ยไนโตรเจน ปุ๋ยฟอสเฟต และปุ๋ยโพแทชครั้งเดียวเมื่อมันสำปะหลังอายุ 1 -2 เดือน และดินมีความชื้นเหมาะสม โดยใส่สองข้างต้นมันสำปะหลัง แล้วกลบปุ๋ย
  > 2) กรณีอัตราแนะนำปุ๋ยไนโตรเจนและโพแทช มากกว่า 8 กิโลรัมต่อไร่ ให้แบ่งใส่ปุ๋ยไนโตรเจนและปุ๋ยโพแทชออกเป็น 2 ครั้งที่อายุ 1 เดือน และ 2 เดือน สำหรับปุ๋ยฟอสเฟต ให้ใส่ครั้งเดียวเมื่อมันสำปะหลังอายุ 1 เดือน และดินมีความชื้นเหมาะสม โดยใส่สองข้างต้นมันสำปะหลัง แล้วกลบปุ๋ย
  (The source's own spelling "กิโลรัม" is kept.) **This note is printed under Table 5. Applying it to Table 4 is an inference, and it matters:** Table 4's sandy-soil row asks for 16 kg N and 24 kg K₂O, which is the *second* case (split at 1 and 2 months); only the loamy-clay (8-4-8) and clay (4-4-8) rows fall under the first case. The document does not say the rule is meant for Table 4.
- **How it was read:** Table 4's text layer is scrambled, so it was read from the **rendered page image**, then every row was checked by arithmetic: 100 kg of 15-7-18 plus 10 kg of 0-0-60 supplies 15-7-24, and 50 kg of 15-15-15 plus 18 kg of urea plus 28 kg of 0-0-60 supplies 15.8-7.5-24.3, both ≈ the stated 16-8-24; 50 kg of 15-7-18 supplies 7.5-3.5-9 ≈ 8-4-8; 30–40 kg of 13-13-21 supplies 3.9–5.2 N, 3.9–5.2 P₂O₅, 6.3–8.4 K₂O ≈ 4-4-8.
- **Why it matters:** the pamphlet's Thai cassava rate (15-15-15, 25–50 kg/rai, 30–45 days, 20 cm from the plant) names *Nakhon Sawan FCRC* and *OAE* with no link, so it is currently not actionable. This is a **flat-rate, official, by-soil-texture** table that replaces it, and unlike A-02 it needs no soil test.
- **Conflicts with the corpus:** the pamphlet gives 25–50 kg/rai of **15-15-15 alone**; the official table gives 50 kg of 15-15-15 **only as part of a three-product mix** (with urea and KCl) for sandy soil, and different products for the other two textures. The pamphlet's timing of 30–45 days is consistent with the official 1–2 months. **A-03 does not cover the cassava lime line** ("Dolomite 100 kg/rai if pH < 5"); that is A-10.

---

### A-04 — Maize: when the second dose goes on
- [ ] Approved by owner
- **Goals:** G5, G6
- **Feature:** Maize in the crop matcher (T-020), basal vs top-dressing diagram (T-021)
- **Source:** the same DOA document as A-01 (URL above)
- **Where:** PDF page 71 (printed 66), section 5.2
- **Exact claim:**
  > สามารถแนะนำให้เกษตรกรใช้ปุ๋ยเชิงประกอบที่มีธาตุอาหารครบถ้วนทั้งไนโตรเจน ฟอสฟอรัส และโพแทสเซียม ใส่ครั้งแรกเป็นปุ๋ยรองพื้นพร้อมปลูก เช่น ใช้ปุ๋ย 15-15-15, 16-16-8 หรือ 13-13-21 และครั้งที่ 2 เมื่อข้าวโพดอายุได้ 21-30 วัน ให้ใส่ปุ๋ยยูเรีย (46-0-0) กรณีดินมีค่าความเป็นกรด-ด่าง มากกว่า 7 ควรใส่ปุ๋ยแอมโมเนียมซัลเฟต (21-0-0) แทนการใช้ปุ๋ยยูเรีย แต่ควรเพิ่มปริมาณของปุ๋ยแอมโมเนียมซัลเฟตอีก 1 เท่าของอัตราที่แนะนำสำหรับการใช้ปุ๋ยยูเรีย
- **How it was read:** text layer, one paragraph, quoted whole.
- **Why it matters:** this uses the words **ปุ๋ยรองพื้น** and a second dose with a day range — the cleanest official statement of the basal/top-dressing pair for a field crop.
- **Conflicts with the corpus:** the pamphlet's maize row says the second dose is at "20–25 days or ~30 cm tall"; the official text says **21–30 days**. The pamphlet's grade list (15-15-15, 16-16-8, 16-8-8, 20-10-5) differs from the official one (15-15-15, 16-16-8, 13-13-21): `16-8-8` and `20-10-5` are not in this paragraph.

---

### A-05 — Rice: timing of the two applications (direct-seeded fields)
- [ ] Approved by owner
- **Goals:** G5
- **Feature:** Basal vs top-dressing diagram (T-021), rice in the crop matcher
- **Source:** <https://rkb.ricethailand.go.th/web/content_page.php?code=A-XHSIJK3CAP>
- **Document:** "นาหว่านข้าวแห้งหรือนาหยอด", Rice Knowledge Bank, Rice Research and Development Division, Rice Department (กองวิจัยและพัฒนาข้าว กรมการข้าว). No publication date is printed on the page.
- **Where:** sections 1.2.1.1 (sandy) and 1.2.2.1 (clay and clay loam)
- **Exact claim (sandy loam or sand, first application):**
  > ข้าวไวต่อช่วงแสงใส่ปุ๋ยสูตร 16-16-8 อัตรา 20-25 กิโลกรัมต่อไร่ในประมาณ 20-30 วันหลังข้าวงอก หากไม่มีปุ๋ย 16-16-8 ให้ใช้ปุ๋ยแอมโมเนียมฟอสเฟตสูตรต่างๆ เช่น 16-20-0, 18-22-0, 20-20-0 และ 18-46-0 แทนได้โดยใส่อัตรา 20-25 กิโลกรัมต่อไร่ ร่วมกับปุ๋ยโพแทสเซียมคลอไรด์ (0-0-60) อัตรา 5-10 กิโลกรัมต่อไร่
  > ข้าวไม่ไวต่อช่วงแสงใส่ปุ๋ยสูตร 16-16-8 อัตรา 30-35 กิโลกรัมต่อไร่ประมาณ 20-30 วันหลังข้าวงอก
- **Exact claim (second application, both soils):**
  > ข้าวไวต่อช่วงแสงใส่ปุ๋ยยูเรีย (46-0-0) อัตรา 10 กิโลกรัมต่อไร่ หรือปุ๋ยแอมโมเนียมซัลเฟต (21-0-0) อัตรา 20 กิโลกรัมต่อไร่ ที่ระยะกำเนิดช่อดอก หรือ 30 วันก่อนข้าวออกดอก
  > ข้าวไม่ไวต่อช่วงแสงใส่ปุ๋ยยูเรีย (46-0-0) อัตรา 20 กิโลกรัมต่อไร่ หรือปุ๋ยแอมโมเนียมซัลเฟต (21-0-0) อัตรา 40 กิโลกรัมต่อไร่ ที่ระยะกำเนิดช่อดอก หรือ 30 วันก่อนข้าวออกดอก
- **Exact claim (clay and clay loam, first application):**
  > ข้าวไวต่อช่วงแสงใส่ปุ๋ยแอมโมเนียมฟอสเฟตสูตรต่างๆ เช่น 16-20-0, 18-22-0, 20-20-0 และ 18-46-0 อัตรา 20-25 กิโลกรัมต่อไร่ ไร่ ประมาณ 20-30 วันหลังข้าวงอก
- **How it was read:** the page HTML was fetched directly and the Thai text extracted; every sentence above was matched against it character for character.
- **Exact claim (clay and clay loam, non-photoperiod-sensitive rice, first application):**
  > ข้าวไม่ไวต่อช่วงแสงใส่ปุ๋ยแอมโมเนียมฟอสเฟตสูตรต่างๆ เช่น 16-20-0, 18-22-0, 20-20-0 และ 18-46-0 อัตรา 30-35 กิโลกรัมต่อไร่ ไร่ ประมาณ 20-30 วันหลังข้าวงอก
- **Context already inside the corpus — TAS 4401-2008 (the `fao` pill) defines both terms.** It is hosted on FAOLEX, which is not a D8 host, so it is not an Addition and is not proposed as one; it is quoted here because it settles how to read the Rice Department page. Verified by reading the standard in full (English translation):
  > For basal application, the recommended rate of fertilizer may be split into twice, on the planting date and rice tillering stage.
  > Top dress fertilizer means the fertilizer applies at panicle initiation stage of rice plant
- **Conflicts with the corpus — read this one carefully:**
  - **It is not the contradiction it first looks like.** The Rice Department's *first* application (20–30 days after germination, which is the tillering stage) is the basal rate's second half in TAS's sense, and its *second* application (panicle initiation, or 30 days before flowering) is TAS's "top dressing". The pamphlet's definition of ปุ๋ยรองพื้น as "ใส่ก่อนหรือพร้อมปลูก" is **narrower** than TAS's, which lets the basal rate run to tillering. An earlier draft of this entry said the first dose "is not a basal dose"; that overstated it and is withdrawn.
  - **The pamphlet's definition of top dressing differs from TAS's.** The pamphlet says ปุ๋ยแต่งหน้า is applied "ระหว่างที่พืชเติบโต" in several doses, e.g. urea "ตอนข้าวแตกกอหรือตั้งท้อง" (tillering *or* booting). TAS defines top dressing as applied **at panicle initiation** only, and treats the tillering dose as part of the basal rate. How G5 should teach this is a teaching decision, and it is yours.
  - The Rice Department page does not contain the words ปุ๋ยรองพื้น or ปุ๋ยแต่งหน้า; it says การใส่ปุ๋ยเคมีครั้งที่ 1 and ครั้งที่ 2.
  - **Rates and grades differ from the corpus in places.** The page gives 30–35 kg/rai (not 20–25) for non-photoperiod-sensitive rice, in the sandy and clay cases alike, where the corpus gives only 20–25. It also adds 18-46-0 and 0-0-60 at 5–10 kg/rai to the grade lists (the corpus's clay row lists 16-20-0, 18-22-0, 20-20-0; its sandy row 16-16-8, 18-12-6, 16-8-8). Its urea rates (10 and 20 kg/rai) are larger than the pamphlet's "5–10 kg/rai", which TAS states as a top dressing without distinguishing, in the passage read, how the crop is established; they may be different systems, and I have not assumed so.

---

### A-06 — Phosphorus goes down as basal, because it barely moves in soil
- [ ] Approved by owner
- **Goals:** G5
- **Feature:** Chapter 2 (basal vs top dressing), diagram (T-021)
- **Source:** the same DOA document as A-01 (URL above)
- **Where:** PDF page 35 (printed 30), cassava section
- **Exact claim:**
  > ฟอสฟอรัสเป็นธาตุที่เคลื่อนย้ายในดินได้น้อย แต่สามารถเคลื่อนย้ายได้ในต้นพืช ดังนั้นการใช้ปุ๋ยฟอสเฟตจึงจำเป็นต้องใส่เป็นปุ๋ยรองพื้น เพื่อให้ปุ๋ยอยู่ใกล้บริเวณรากพืชมากที่สุด
- **How it was read:** text layer.
- **Why it matters:** this is not a new fact. The pamphlet already says "P เคลื่อนที่ในดินได้น้อย จึงต้อง ใส่ใกล้รากตั้งแต่ตอนปลูก" (p4) — with **no citation printed against it**. This entry would give an existing claim an official source and the *reason* it is true.
- **Conflicts with the corpus:** none.

---

### A-07 — Durian: official timing and rates, which differ from the pamphlet
- [ ] Approved by owner
- **Goals:** G5, G6
- **Feature:** Durian in the crop matcher (T-020)
- **Source:** <https://www.doa.go.th/plprotect/wp-content/uploads/%E0%B9%80%E0%B8%81%E0%B8%B5%E0%B9%88%E0%B8%A2%E0%B8%A7%E0%B8%81%E0%B8%B1%E0%B8%9A%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%A7%E0%B8%B4%E0%B8%88%E0%B8%B1%E0%B8%A2/file_research/Ues_research.pdf>
- **Document:** เอกสารประกอบการประชุมวิชาการกรมวิชาการเกษตร ประจำปี 2562, "โครงการขับเคลื่อนผลงานวิจัยสู่การใช้ประโยชน์ กรมวิชาการเกษตร", section "การเพิ่มประสิทธิภาพการผลิตไม้ผล : ทุเรียน มังคุด และมะม่วง" (Department of Agriculture technical meeting, 27–29 May 2019). Describes technology applied in the eastern region.
- **Where:** PDF page 3 (printed 1), item 1
- **Exact claim:**
  > ทุเรียน ใช้เทคโนโลยีการผลิตทุเรียนคุณภาพ ร่วมกับการใช้ปุ๋ยตามค่าวิเคราะห์ดิน หลังตัดแต่งกิ่ง ใส่ปุ๋ยเคมีสูตร 46-0-0 ในอัตรา 0.8-1 กก./ต้น ร่วมกับการใช้ปุ๋ยอินทรีย์ 10-20 กก./ต้น ระยะก่อนออกดอก ใส่ปุ๋ยเคมีสูตร 8-24-24 อัตรา 1-1.5 กก./ต้น และหลังดอกบาน 1 เดือน ใส่ปุ๋ยเคมีสูตร 13-13-21 อัตรา 0.5-1 กก./ต้น ร่วมกับ 0-0-50 อัตรา 0.5-1 กก./ต้น
  > (ต่อจากนั้น — ส่วนที่เหลือของประโยคเดียวกัน) และเมื่อดอกมีอายุ 6 สัปดาห์ เฉพาะต้นที่มีดอกมากกว่า 1 รุ่น และจำนวนดอกต่อต้นน้อย พ่นด้วยปุ๋ยทางใบที่มีธาตุแคลเซียมและโบรอน จำนวน 1 ครั้ง และใส่ปุ๋ย 13-13-21 อัตรา 0.5-1 กก./ต้น ร่วมกับ 0-0-50 อัตรา 0.5-1 กก./ต้น เพื่อพัฒนาผลปรับปรุงคุณภาพเนื้อของผล
  The passage therefore has **four** applications, not three: after pruning, before flowering, one month after bloom, and a further 13-13-21 + 0-0-50 at six weeks of flower age on low-flowering trees. An earlier draft quoted only the first three as if they were the whole.
- **How it was read:** downloaded the 35-page PDF and read the text layer; the passage was located by searching for the rate, then read in context.
- **Why it matters:** durian is already actionable in the matcher, but its backing is two DOA pills whose documents the pamphlet does not describe. This is a **named, dated, official** statement.
- **Conflicts with the corpus — this is a real disagreement:** the pamphlet's durian row says *after harvest* 15-15-15 or 16-16-16 at 1–3 kg/tree, and *at fruit stage* 8-24-24 ~1 kg/tree. The official text says 46-0-0 after pruning, and 8-24-24 at **1–1.5 kg/tree before flowering**, then 13-13-21 a month after bloom. The same grade (8-24-24) is placed at a different stage and a different rate. Which one the site should show is for you to decide.

---

### A-08 — Lime-type equivalence: an official source for the three factors
- [ ] Approved by owner
- **Goals:** G3, G7
- **Feature:** Soil conditioners table and lime guidance (chapters 2 and 4)
- **Source:** <https://orgweb.ldd.go.th/sources/img/part_km/FILES_10040_66557e6c1039c.pdf>
- **Document:** คู่มือคำแนะนำการใช้ปุ๋ยเคมีร่วมกับปุ๋ยอินทรีย์อย่างมีประสิทธิภาพตามค่าวิเคราะห์ดิน สำหรับการปลูกพืชเศรษฐกิจรายตำบล, Samko district, Ang Thong — Land Development Department, technical document no. 360/01/54, August 2011. **The manual's own rates are for one district and are not proposed here;** only its general appendix is.
- **Where:** PDF pages 47–48 (printed 41–42): the introductory sentence is at the foot of page 47, Table 2 itself is on page 48
- **Exact claim:**
  > ปูนที่ใช้ในการเกษตรมีหลายชนิด เช่น หินปูนบด ปูนขาว หินปูนเผา ปูนโดโลไมต์ และปูนมาร์ล การใส่ปูนชนิดอื่นๆจึงต้องเทียบค่าฤทธิ์ความเป็นด่างของปูนกับแคลเซียมคาร์บอเนตบริสุทธิ์
  > ตารางภาคผนวกที่ 2 การเปรียบเทียบฤทธิ์ด่างของปูนชนิดต่างๆ กับแคลเซียมคาร์บอเนต — ชนิดปูน 100 กก. เทียบเท่าแคลเซียมคาร์บอเนต(กก.): ปูนขาว 134; หินปูนเผา 178; ปูนโดโลไมต์ 108; ปูนมาร์ล 45-80 (ขึ้นอยู่กับสิ่งเจือปน)
- **How it was read:** text layer. The introductory sentence is verbatim; Table 2 is **restructured into one line** (its row labels and values are exact, but the table layout is not reproduced). The document cites the table to Brady & Weil (2004).
- **Why it matters:** the pamphlet's three lime factors (marl 1.25, dolomite 0.92, slaked lime 0.74 "relative to ground limestone") currently lean on `ku`, a university poster. These are the **inverse** of the official figures: 100÷134 = 0.75, 100÷108 = 0.93, 100÷80 = 1.25. So the pamphlet's numbers are consistent with an official source.
- **Conflicts with the corpus:** marl. The pamphlet's 1.25 matches the **best case** of the official range (45–80, "depending on impurities"). At the other end, 100÷45 = **2.2**, i.e. nearly twice as much marl would be needed. The pamphlet states one number where the official source states a range, and the range is wide enough to matter.

---

### A-09 — Lime requirement by starting pH and soil texture
- [ ] Approved by owner
- **Goals:** G7
- **Feature:** Lime guidance (chapters 2 and 4); possible later calculator extension
- **Source:** <https://orgweb.ldd.go.th/sources/img/part_km/FILES_10040_66557e6c1039c.pdf> (same document as A-08)
- **Where:** PDF page 47 (printed 41), appendix Table 1 and the definition above it
- **Exact claim (definition):**
  > ความต้องการปูน (lime requirement: LR) เป็นค่าปริมาณของปูนที่ใช้ในการปรับค่าพีเอชของดินให้มีค่าประมาณ 6.5 ซึ่งเป็นช่วงที่ธาตุอาหารพืชส่วนใหญ่ละลายออกมาอยู่ในรูปที่เป็นประโยชน์ต่อพืช
- **Exact claim (table):**
  > ตารางภาคผนวกที่ 1 ค่าโดยประมาณความต้องการปริมาณหินปูนบดละเอียดหรือแคลเซียมคาร์บอเนต และนำไปใช้ในการปรับค่าพีเอชของดินให้เหมาะสมสำหรับการปลูกพืช โดยพิจารณาจากค่าพีเอชเดิมของดินและเนื้อดิน — กก.ต่อไร่ ของหินปูนบดละเอียด (ดินทราย | ดินร่วนปนทราย | ดินร่วน | ดินร่วนปนดินเหนียวและดินเหนียว): pH 5.0 → 200 | 300 | 400 | 500; pH 4.8 → 570 | 590 | 690 | 840; pH 4.6 → 620 | 600 | 800 | 970; pH 4.5 → 700 | 800 | 1,000 | 1,100; pH 4.4 → 730 | 800 | 1,100 | 1,200; pH 4.2 → 890 | 1,000 | 1,400 | 1,600; pH 4.0 → 1,100 | 1,300 | 1,800 | 2,100; pH 3.8 → 1,400 | 1,700 | 2,100 | 2,800; pH 3.5 → 1,600 | 2,000 | 2,500 | 3,000; pH 3.0 → 2,200 | 2,800 | 3,200 | 4,000
- **How it was read:** text layer. Source line printed under the table: วิโรจ (2532), ทัศนีย์และคณะ (2546). It is quoted as printed. Two features are worth knowing before anyone builds on it: the step from pH 5.0 (200–500) to pH 4.8 (570–840) is abrupt, and the sandy-loam column barely moves between pH 4.8 and 4.6 (590 → 600). Neither is corrected here.
- **Why it matters:** the only lime *rate* in the corpus is the cassava line "Dolomite 100 kg/rai if pH < 5", backed on p5 by a blogspot page. This table is a general neutralising requirement, and the target is stated: **bringing the soil to about pH 6.5**.
- **Conflicts with the corpus — and with another official figure.** An earlier draft called the pamphlet's 100 kg/rai "a cassava-specific blogspot claim" that was "below even the lowest official figure". That was incomplete, because **a second DOA text gives the same 100 kg/rai** (A-10). So two official sources disagree with *each other*:
  - this LDD table: **200–500 kg/rai** of ground limestone at pH 5.0 depending on texture (about 185 kg/rai of dolomite at the pamphlet's own 0.92 factor), rising to **2,200–4,000 kg/rai at pH 3.0**;
  - DOA's crop notes: a flat **100 kg/rai** for cassava below pH 5.0 and for sugarcane below pH 5.6.

  The two are not obviously incompatible — the LDD figure is the amount to reach pH 6.5, the DOA figure is a crop-specific correction — but a grower reading both is given numbers that differ by 2–5× at pH 5.0 and by about 22–40× at pH 3.0. The pamphlet's 100 kg/rai agrees with DOA and not with LDD. Which one the site should present, and whether to present a pH-dependent table at all, is for you to decide.

---

### A-10 — Lime for cassava and sugarcane, from DOA (backs the pamphlet's 100 kg/rai)
- [ ] Approved by owner
- **Goals:** G3, G7
- **Feature:** Cassava in the crop matcher (T-020); lime guidance (chapters 2 and 4)
- **Source:** the same DOA document as A-01 (URL above)
- **Where:** PDF page 37 (printed 32), cassava calcium passage; PDF page 31 (printed 26), sugarcane footnote
- **Exact claim (cassava):**
  > การแก้ไขการขาดแคลเซียมในดิน ถ้าเป็นดินที่มีค่าความเป็นกรด-ด่าง ต่ำกว่า 5.0 ควรปรับปรุงดิน โดยการหว่านหินปูน ปูนขาว หรือ ปูนโดโลไมต์ อัตรา 100 กิโลกรัมต่อไร่ กรณีดินทรายที่ดินมี pH เป็นกลาง แต่มีแคลเซียมต่ำควรปรับปรุงดินโดยใช้ยิปซัม อัตรา 100 กิโลกรัมต่อไร่
- **Exact claim (sugarcane, the footnote quoted in A-02):**
  > ถ้าความเป็นกรด-ด่าง (pH) น้อยกว่า 5.6 1) ใส่ปูนโดโลไมต์ อัตรา 100 กิโลกรัมต่อไร่ 2) ควรใช้ปุ๋ยยูเรีย (46-0-0) เป็นแหล่งของไนโตรเจน
- **How it was read:** text layer; spacing artefacts of the PDF font (for example "ปูนโดโลไม ต์อัตรา") were normalised to "ปูนโดโลไมต์ อัตรา".
- **Why it matters:** the corpus's cassava line "Dolomite 100 kg/rai if pH < 5" is backed only by a blogspot page and is therefore descriptive-only. This is an **official** statement of the same figure, with the same threshold, so it would lift that line to actionable and also supports ch02's lime sentence.
- **Conflicts with the corpus:**
  - The official sentence says **limestone, slaked lime *or* dolomite at the same 100 kg/rai**. The pamphlet's own soil-conditioner table says they are *not* equivalent: slaked lime 0.74 and dolomite 0.92 of the amount of ground limestone (and A-08 gives the official basis for those factors). DOA's flat 100 kg/rai for all three sits oddly beside that, and I have not tried to reconcile them.
  - It conflicts, at face value, with LDD's much larger requirement (A-09). See A-09.
  - It is a **cassava-and-sugarcane** statement. The pamphlet's row is for cassava only.

---

## Searched, and not proposed

Every crop that is non-actionable today was searched for in the three allowed domains. Where nothing usable turned up, that is recorded here rather than papered over.

| Crop | Result |
| --- | --- |
| **Mango** | **No official fertilizer rate found.** The only DOA document that surfaced for mango (the same one as A-07) covers mango *pest management and GAP* and contains no fertilizer rate; the 0.8–1 kg/tree figure that a search summary attached to mango belongs to **durian**. Other DOA research reports mention mango fertilizer figures, but they were not read, and a research-plot result is not a recommendation. |
| **Rubber (both stages)** | **No general official rate found in the allowed domains.** The Land Development Department manual read for A-08 does carry per-rai rubber rows (for example `ยางพารา 4`: 18-46-0 9 kg/rai, 46-0-0 9 kg/rai, 0-0-60 23 kg/rai, split into 4 applications every 3 months), but they are **per soil map unit in one sub-district**, like its vegetable row, and are **found and rejected for that reason** — not absent. The authority for rubber fertilizer is the Rubber Research Institute of Thailand (RRIT) / Rubber Authority, which is not on D8's list; widening D8 to include it is a decision for you, not something this task assumes. |
| **Vegetables** | **No general official rate found.** The Land Development Department manual read for A-08 does give a leafy-vegetable fertilizer row, but it is **per soil map unit in one sub-district** ("ผักกินใบ 4", tambon Ob Thom, Samko district). Presenting that as a starting rate for vegetables would be misleading, so it is rejected for that purpose. |
| **Sugarcane flat rate** | None exists in the official source; see A-02. |

## Replacement candidates for every commercial-only rate (T-007)

| Non-actionable today | Because | Candidate | Fully replaces? |
| --- | --- | --- | --- |
| sugarcane | `yara` datasheet only | A-02 | **Partly** — timing yes; rate only as a soil-test lookup |
| cassava, fertilizer line | unlinked names | A-03 | **Yes** — flat rate by soil texture, plus timing (the timing note is printed under a different table; see A-03) |
| cassava, dolomite 100 kg/rai line | blogspot | A-10 | **Yes** — the same figure and threshold from DOA, though it disagrees with LDD (A-09) |
| mango | `rakbankerd` only | — | **No candidate found** |
| rubber, before tapping | `naikham`, `apkgroup` | — | **No candidate in the allowed domains** |
| rubber, tapped | `tci-thaijo` (inferred) | — | **No candidate in the allowed domains** |
| vegetables | unattributed Cambodian survey | — | **No candidate found** |

After A-03 and A-10 are ticked, cassava's Thai lines would both be on firm ground and five crops would be matchable. Mango, rubber and vegetables stay descriptive-only until an official source is found or D8 is widened.
