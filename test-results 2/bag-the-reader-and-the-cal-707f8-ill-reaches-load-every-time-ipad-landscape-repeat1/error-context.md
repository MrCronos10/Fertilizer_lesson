# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: bag.spec.ts >> the reader and the calculator coexist: the page still reaches load every time
- Location: e2e/bag.spec.ts:217:5

# Error details

```
TimeoutError: page.goto: Timeout 10000ms exceeded.
Call log:
  - navigating to "http://localhost:3499/th/ch03", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=f7e1]:
  - generic [aria-hidden] [ref=f7e2]: กAกAกA
  - link "ข้ามไปยังเนื้อหา" [ref=f7e3]:
    - /url: "#content"
  - banner [ref=f7e4]:
    - link "เครื่องหมายของเว็บไซต์ เรียนรู้เรื่องปุ๋ย" [ref=f7e5]:
      - /url: /th
      - img "เครื่องหมายของเว็บไซต์" [ref=f7e6]
      - generic [ref=f7e10]: เรียนรู้เรื่องปุ๋ย
    - generic [ref=f7e11]:
      - link "สารบัญ" [ref=f7e12]:
        - /url: /th#chapters
      - link "ที่มาของข้อมูล" [ref=f7e13]:
        - /url: "#sources"
      - button "สลับเป็นโหมดกลางคืน" [ref=f7e14] [cursor=pointer]
  - main [ref=f7e16]:
    - article [ref=f7e17]:
      - generic [ref=f7e18]:
        - generic [ref=f7e19]:
          - link "สารบัญ" [ref=f7e20]:
            - /url: /th
          - generic [ref=f7e21]: บทที่ 3 จาก 7
        - generic [ref=f7e33]:
          - generic [ref=f7e34]: บทที่ 3
          - heading "วิธีอ่านตัวเลขบนกระสอบ" [level=1] [ref=f7e35]
      - generic [ref=f7e36]:
        - link "ไปที่ที่มาของข้อมูล" [ref=f7e37]:
          - /url: "#sources"
        - generic [ref=f7e38]:
          - text: ระดับแหล่งข้อมูลในบทนี้
          - generic [ref=f7e39]:
            - generic [aria-hidden] [ref=f7e40]: ▲
            - generic [ref=f7e41]: "ระดับแหล่งที่มา:"
            - text: เชิงพาณิชย์
      - generic [ref=f7e42]:
        - generic [ref=f7e43]:
          - paragraph [ref=f7e44]: ตัวเลข 3 ตัวบนกระสอบคือเปอร์เซ็นต์ของ N – P₂O₅ – K₂O ตัวอย่างเช่น 16-20-0 กระสอบ 50 กก. มี N 8 กก. P₂O₅ 10 กก. และไม่มี K
          - generic [ref=f7e45]:
            - group "ตัวเลข 3 ตัวบนกระสอบ" [ref=f7e46]:
              - generic [ref=f7e48]:
                - generic [ref=f7e49]:
                  - generic [ref=f7e50] [cursor=pointer]:
                    - radio "N 16 เปอร์เซ็นต์" [checked]
                    - generic [aria-hidden] [ref=f7e51]: "N"
                    - generic [aria-hidden] [ref=f7e52]: "16"
                  - generic [ref=f7e53] [cursor=pointer]:
                    - radio "P₂O₅ 20 เปอร์เซ็นต์"
                    - generic [aria-hidden] [ref=f7e54]: P₂O₅
                    - generic [aria-hidden] [ref=f7e55]: "20"
                  - generic [ref=f7e56] [cursor=pointer]:
                    - radio "K₂O 0 เปอร์เซ็นต์"
                    - generic [aria-hidden] [ref=f7e57]: K₂O
                    - generic [aria-hidden] [ref=f7e58]: "0"
                - paragraph [ref=f7e59]: 50 กก.
            - status [ref=f7e60]:
              - generic [ref=f7e61]:
                - paragraph [ref=f7e62]:
                  - generic [aria-hidden] [ref=f7e63]: "N"
                  - generic [ref=f7e64]: N = ใบเขียว โตเร็ว
                - paragraph [ref=f7e65]: กระสอบ 50 กก. มี N 8 กก.
                - paragraph [ref=f7e66]: "หน้าในเอกสารต้นฉบับ: 2, 6"
        - generic [ref=f7e67]:
          - list [ref=f7e68]:
            - listitem [ref=f7e69]:
              - strong [ref=f7e70]: "คำนวณ:"
              - text: ถ้าต้องการ N 10 กก./ไร่ จากยูเรีย ให้ใช้ 10 × 100 ÷ 46 ≈ 22 กก.
            - listitem [ref=f7e71]:
              - strong [ref=f7e72]: "หน่วย:"
              - text: 1 ไร่ = 1,600 ตร.ม.
              - superscript [ref=f7e73]:
                - 'link "ที่มาของข้อมูล: VietnamPlus ระดับแหล่งที่มา: เชิงพาณิชย์" [ref=f7e74]':
                  - /url: "#src-vietnamplus"
                  - generic [ref=f7e75]: "ที่มาของข้อมูล:"
                  - text: VietnamPlus
                  - generic [ref=f7e76]:
                    - generic [aria-hidden] [ref=f7e77]: ▲
                    - generic [ref=f7e78]: "ระดับแหล่งที่มา:"
                    - text: เชิงพาณิชย์
              - text: และ 1 เฮกตาร์ = 6.25 ไร่
            - listitem [ref=f7e79]:
              - strong [ref=f7e80]: "ฉลาก:"
              - text: ซื้อเฉพาะปุ๋ยที่มีเลขทะเบียน
          - region [ref=f7e81]:
            - heading "คำนวณปริมาณปุ๋ย" [level=2] [ref=f7e82]
            - generic [ref=f7e83]:
              - group "ธาตุที่ต้องการ" [ref=f7e84]:
                - generic [ref=f7e86]:
                  - generic [ref=f7e87] [cursor=pointer]:
                    - radio "N" [checked] [ref=f7e88]
                    - generic [ref=f7e89]: "N"
                  - generic [ref=f7e90] [cursor=pointer]:
                    - radio "P₂O₅" [ref=f7e91]
                    - generic [ref=f7e92]: P₂O₅
                  - generic [ref=f7e93] [cursor=pointer]:
                    - radio "K₂O" [ref=f7e94]
                    - generic [ref=f7e95]: K₂O
              - generic [ref=f7e96]:
                - generic [ref=f7e97]: ปริมาณธาตุที่ต้องการ (กก./ไร่)
                - textbox "ปริมาณธาตุที่ต้องการ (กก./ไร่)" [ref=f7e98]
              - group "สูตร (ตัวเลข 3 ตัวบนกระสอบ)" [ref=f7e99]:
                - generic [ref=f7e101]:
                  - generic [ref=f7e102]: เลือกสูตรที่มีในเอกสาร
                  - combobox "เลือกสูตรที่มีในเอกสาร" [ref=f7e103]:
                    - option "กรอกเอง" [selected]
                    - option "46-0-0 ยูเรีย"
                    - option "21-0-0 แอมโมเนียมซัลเฟต"
                    - option "18-46-0 DAP"
                    - option "0-46-0 TSP"
                    - option "0-0-60 KCl"
                    - option "0-0-50 K₂SO₄"
                    - option "15-15-15"
                    - option "16-16-16"
                    - option "16-20-0"
                    - option "18-22-0"
                    - option "20-20-0"
                    - option "16-16-8"
                    - option "18-12-6"
                    - option "16-8-8"
                    - option "15-7-18"
                    - option "13-13-21"
                    - option "20-8-20"
                    - option "20-10-12"
                    - option "8-24-24"
                    - option "12-24-12"
                - generic [ref=f7e104]:
                  - generic [ref=f7e105]:
                    - generic [ref=f7e106]: N (%)
                    - textbox "N (%)" [ref=f7e108]
                  - generic [ref=f7e109]:
                    - generic [ref=f7e110]: P₂O₅ (%)
                    - textbox "P₂O₅ (%)" [ref=f7e112]
                  - generic [ref=f7e113]:
                    - generic [ref=f7e114]: K₂O (%)
                    - textbox "K₂O (%)" [ref=f7e116]
              - button "คำนวณ" [ref=f7e117] [cursor=pointer]
            - alert [ref=f7e118]
            - status
          - region [ref=f7e119]:
            - heading "ที่มาของข้อมูล" [level=2] [ref=f7e120]
            - paragraph [ref=f7e121]: "หน้าในเอกสารต้นฉบับ: 6"
            - list [ref=f7e122]:
              - listitem [ref=f7e123]:
                - text: VietnamPlus
                - generic [ref=f7e124]:
                  - generic [aria-hidden] [ref=f7e125]: ▲
                  - generic [ref=f7e126]: "ระดับแหล่งที่มา:"
                  - text: เชิงพาณิชย์
                - list [ref=f7e127]:
                  - listitem [ref=f7e128]:
                    - link "en.vietnamplus.vn/thailand-subsidises-fertiliser-costs-for-rice-farmers-post289207.vnp" [ref=f7e129]:
                      - /url: https://en.vietnamplus.vn/thailand-subsidises-fertiliser-costs-for-rice-farmers-post289207.vnp
            - paragraph [ref=f7e130]: อัตราปุ๋ยที่แสดงบนเว็บไซต์เป็น จุดเริ่มต้น เท่านั้น แนะนำให้ ตรวจวิเคราะห์ดิน ก่อนใช้ปุ๋ยจริง
      - navigation "เลื่อนระหว่างบท" [ref=f7e131]:
        - 'link "บทก่อนหน้า: ประเภทของปุ๋ย ลักษณะ และควรใช้กับอะไร" [ref=f7e132]':
          - /url: /th/ch02
        - link "สารบัญ" [ref=f7e133]:
          - /url: /th
        - 'link "บทถัดไป: การใส่ปุ๋ยในทางปฏิบัติ" [ref=f7e134]':
          - /url: /th/ch04
  - alert [ref=f7e135]
```

# Test source

```ts
  120 |   await expect(panel).toHaveAttribute("aria-live", "polite");
  121 |   await expect(panel).toHaveAttribute("aria-atomic", "true");
  122 |   const before = await panel.locator(":scope > *").first().elementHandle();
  123 |   await press(tile(page, "P₂O₅ 20"));
  124 |   await expect(panel).toContainText(CASES[1]!.role);
  125 |   expect(await before!.evaluate((el) => el.isConnected), "the old explanation node is still in the page").toBe(false);
  126 | });
  127 | 
  128 | test("nothing is revealed by hover alone", async ({ page }) => {
  129 |   await open(page);
  130 |   const hoverRules = await page.evaluate(() => {
  131 |     const found: string[] = [];
  132 |     for (const sheet of [...document.styleSheets]) {
  133 |       let rules: CSSRuleList;
  134 |       try {
  135 |         rules = sheet.cssRules;
  136 |       } catch {
  137 |         continue;
  138 |       }
  139 |       const walk = (list: CSSRuleList) => {
  140 |         for (const rule of [...list]) {
  141 |           if (rule instanceof CSSStyleRule && /bag/.test(rule.selectorText) && /:hover/.test(rule.selectorText)) found.push(rule.selectorText);
  142 |           if ("cssRules" in rule && (rule as CSSGroupingRule).cssRules) walk((rule as CSSGroupingRule).cssRules);
  143 |         }
  144 |       };
  145 |       walk(rules);
  146 |     }
  147 |     return found;
  148 |   });
  149 |   expect(hoverRules).toEqual([]);
  150 | });
  151 | 
  152 | test("the label is real text: selectable, in the DOM, not a canvas or image", async ({ page }) => {
  153 |   await open(page);
  154 |   await expect(page.locator(".bag-reader canvas, .bag-reader img, .bag-reader svg")).toHaveCount(0);
  155 |   for (const c of CASES) {
  156 |     const cell = tile(page, c.name);
  157 |     await expect(cell).toContainText(c.name.split(" ")[0]!);
  158 |     await expect(cell).toContainText(c.name.split(" ")[1]!);
  159 |     const select = await cell.evaluate((el) => getComputedStyle(el).userSelect);
  160 |     expect(select).not.toBe("none");
  161 |   }
  162 | });
  163 | 
  164 | test("the page can be zoomed", async ({ page }) => {
  165 |   await open(page);
  166 |   const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
  167 |   expect(viewport).toBeTruthy();
  168 |   expect(viewport).not.toMatch(/user-scalable\s*=\s*(no|0)/i);
  169 |   expect(viewport).not.toMatch(/maximum-scale\s*=\s*1(\.0)?\b/i);
  170 | });
  171 | 
  172 | test("the numbers are large and legible, and nothing scrolls sideways at the project width or on a phone", async ({ page }) => {
  173 |   const { group } = await open(page);
  174 |   const numberSize = await group.locator(".bag-number").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  175 |   const symbolSize = await group.locator(".bag-symbol").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  176 |   expect(numberSize).toBeGreaterThanOrEqual(32);
  177 |   expect(symbolSize).toBeGreaterThanOrEqual(16);
  178 |   const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  179 |   expect(await overflow()).toBeLessThanOrEqual(0);
  180 |   await page.setViewportSize({ width: 390, height: 844 });
  181 |   expect(await overflow()).toBeLessThanOrEqual(0);
  182 | });
  183 | 
  184 | for (const scheme of ["light", "dark"] as const) {
  185 |   test(`tiles are legible in ${scheme}, chosen and not`, async ({ browser }) => {
  186 |     const context = await browser.newContext({ colorScheme: scheme });
  187 |     const page = await context.newPage();
  188 |     await open(page);
  189 |     const rgb = (v: string) => v.match(/[\d.]+/g)!.map(Number);
  190 |     const lum = ([r, g, b]: number[]) => {
  191 |       const f = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  192 |       return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
  193 |     };
  194 |     const ratio = (a: number[], b: number[]) => {
  195 |       const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  196 |       return (hi! + 0.05) / (lo! + 0.05);
  197 |     };
  198 |     const colours = (label: Locator) =>
  199 |       label.evaluate((el) => ({ fg: getComputedStyle(el).color, bg: getComputedStyle(el).backgroundColor, border: getComputedStyle(el).borderTopColor }));
  200 |     const chosen = await colours(tile(page, "N 16"));
  201 |     const other = await colours(tile(page, "K₂O 0"));
  202 |     expect(ratio(rgb(chosen.fg), rgb(chosen.bg))).toBeGreaterThanOrEqual(4.5);
  203 |     expect(ratio(rgb(other.fg), rgb(other.bg))).toBeGreaterThanOrEqual(4.5);
  204 |     // Not colour alone: the chosen tile also differs in fill from the others.
  205 |     expect(chosen.bg).not.toBe(other.bg);
  206 |     await context.close();
  207 |   });
  208 | }
  209 | 
  210 | test("only chapter 3 carries the bag reader", async ({ request }) => {
  211 |   for (const slug of ["ch01", "ch02", "ch04", "ch05", "ch06", "ch07"]) {
  212 |     expect(await (await request.get(`/th/${slug}`)).text(), slug).not.toContain("bag-reader");
  213 |   }
  214 |   expect(await (await request.get("/th/ch03")).text()).toContain("bag-reader");
  215 | });
  216 | 
  217 | test("the reader and the calculator coexist: the page still reaches load every time", async ({ page }) => {
  218 |   for (let i = 0; i < 6; i++) {
  219 |     await page.goto("/th/ch02", { timeout: 10_000 });
> 220 |     await page.goto("/th/ch03", { timeout: 10_000 });
      |                ^ TimeoutError: page.goto: Timeout 10000ms exceeded.
  221 |   }
  222 | });
  223 | 
```