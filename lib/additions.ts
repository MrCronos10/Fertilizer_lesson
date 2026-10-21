import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * The D8 gate. `docs/content/ADDITIONS.md` proposes facts that are not in the
 * source pamphlet; each is inert until the owner ticks its box. This module
 * parses that file and finds every place `content/` points at an entry, so a
 * test can fail the build if a reference outruns an approval.
 *
 * A first version of this parser was easy to get around, and a review proved
 * it: a markdown-link source parsed as "no source" and then passed through an
 * inheritance clause; an en dash, a lowercase `a-03` or `A 03` slipped past the
 * reference matcher; an earlier `- [x] note` line could flip an entry to
 * approved; a fenced code block could create a ticked entry. Each of those is
 * now a failing case in the test file, and the parser is strict where it was
 * permissive: anything it cannot read unambiguously is reported, never skipped.
 */

/** The only hosts D8 allows an Addition to come from. */
export const ALLOWED_HOSTS = ["doa.go.th", "ldd.go.th", "ricethailand.go.th"] as const;

export interface Addition {
  readonly id: string;
  readonly title: string;
  /** True only if the entry has exactly one approval line and it is ticked. */
  readonly approved: boolean;
  readonly goals: readonly string[];
  readonly feature: string;
  /** Every URL on the entry's Source line, whatever form it was written in. */
  readonly sources: readonly string[];
  /** `A-nn` named by a "same document as A-nn" Source line. */
  readonly inheritsFrom: readonly string[];
  /** The raw Source lines, so a malformed one can be reported. */
  readonly sourceLines: readonly string[];
  /** Every column-0 checkbox line in the entry, ticked or not. */
  readonly checkboxLines: readonly string[];
  readonly approvalLines: readonly string[];
  readonly claimLines: number;
  readonly hasHowRead: boolean;
}

/** Fenced code is documentation, not entries: drop it before parsing. */
function stripFences(markdown: string): string {
  return markdown.replace(/^```[\s\S]*?^```[^\n]*$/gm, "");
}

const ENTRY = /^### (A-\d{2}) — (.+)$/gm;
const LOOSE_HEADING = /^###\s+A\s*[-–‑−—]?\s*\d+.*$/gm;

/** Headings that look like entries but do not match the strict form. */
export function malformedHeadings(markdown: string): string[] {
  const text = stripFences(markdown);
  const strict = new Set([...text.matchAll(ENTRY)].map((m) => m[0]));
  return [...text.matchAll(LOOSE_HEADING)].map((m) => m[0]).filter((h) => !strict.has(h));
}

export function parseAdditions(markdown: string): Addition[] {
  const text = stripFences(markdown);
  const starts = [...text.matchAll(ENTRY)];
  return starts.map((match, i) => {
    const id = match[1]!;
    const body = text.slice(match.index! + match[0].length, starts[i + 1]?.index ?? text.length);

    const checkboxLines = body.split("\n").filter((l) => /^- \[[ xX]\]/.test(l));
    const approvalLines = checkboxLines.filter((l) => /^- \[[ x]\] Approved by owner\s*$/.test(l));
    const sourceLines = body.split("\n").filter((l) => /^- \*\*Source:\*\*/.test(l));

    const sources = sourceLines.flatMap((l) => [...l.matchAll(/https?:\/\/[^\s<>)\]]+/g)].map((m) => m[0]));
    const inheritsFrom = sourceLines.flatMap((l) =>
      /\bsame\b[^\n]*\b(?:document|source)\b/i.test(l) ? [...l.matchAll(/\bA-\d{2}\b/g)].map((m) => m[0]) : [],
    );

    return {
      id,
      title: match[2]!,
      approved: approvalLines.length === 1 && approvalLines[0]!.startsWith("- [x]"),
      goals: (/^- \*\*Goals?:\*\* (.+)$/m.exec(body)?.[1] ?? "").match(/G[1-7]/g) ?? [],
      feature: /^- \*\*Feature:\*\* (.+)$/m.exec(body)?.[1] ?? "",
      sources,
      inheritsFrom,
      sourceLines,
      checkboxLines,
      approvalLines,
      claimLines: body.split("\n").filter((l) => /^\s*>\s*\S/.test(l) || /^\s*\|.+\|/.test(l)).length,
      hasHowRead: /^- \*\*How it was read:\*\*/m.test(body),
    };
  });
}

export function hostAllowed(url: string): boolean {
  const host = new URL(url).hostname.toLowerCase();
  return ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

/**
 * Everything wrong with one entry, as readable strings; empty means sound.
 * `all` is the whole parsed file, so "same document as A-nn" can be resolved.
 */
export function auditAddition(a: Addition, all: readonly Addition[]): string[] {
  const problems: string[] = [];
  if (a.approvalLines.length !== 1)
    problems.push(`${a.id}: needs exactly one "- [ ] Approved by owner" line, found ${a.approvalLines.length}`);
  if (a.checkboxLines.length !== a.approvalLines.length)
    problems.push(`${a.id}: has a checkbox line that is not the approval line (it could be mistaken for one)`);

  if (a.sourceLines.length === 0) {
    problems.push(`${a.id}: has no Source line`);
  } else {
    const hasUrl = a.sources.length > 0;
    const inherits = a.inheritsFrom.length > 0;
    if (!hasUrl && !inherits) problems.push(`${a.id}: Source line has no URL and does not name an entry to inherit from`);
    for (const url of a.sources) {
      let allowed = false;
      try {
        allowed = hostAllowed(url);
      } catch {
        /* an unparsable URL is not allowed */
      }
      if (!allowed) problems.push(`${a.id}: source host is not doa.go.th, ldd.go.th or ricethailand.go.th: ${url}`);
    }
    // A URL written as a markdown link or bare text is reported rather than trusted:
    // only the <https://…> form is the convention, and anything else is easy to miss.
    for (const line of a.sourceLines) {
      const angled = [...line.matchAll(/<(https?:\/\/[^>\s]+)>/g)].length;
      const total = [...line.matchAll(/https?:\/\//g)].length;
      if (total !== angled) problems.push(`${a.id}: source URL must be written <https://…>, got: ${line.slice(0, 90)}`);
    }
    for (const target of a.inheritsFrom) {
      const parent = all.find((o) => o.id === target);
      if (!parent) problems.push(`${a.id}: inherits its source from ${target}, which does not exist`);
      else if (parent.sources.length === 0) problems.push(`${a.id}: inherits its source from ${target}, which has no URL`);
    }
  }
  return problems;
}

/**
 * Reads an id however it was written. NFKC folds full-width digits and
 * compatibility dashes; the rest of the dash family is mapped to `-`.
 */
function normalise(text: string): string {
  return text.normalize("NFKC").replace(/[‐-―−‑﹘﹣－]/g, "-");
}

/**
 * `A-07`, `a-7`, `A 07`, `A07`, `A–07`, `id=A-07`, and each end of `A-01-A-03`.
 * Not `A-07x` or the Rice Knowledge Bank's `code=A-60O299W4F9`, whose digits run
 * into letters, and not the hex escapes of a percent-encoded URL (`%B8%A7` holds
 * an `A7`), which would otherwise match all through content/sources.json.
 */
const REFERENCE = /(?<![A-Za-z0-9%#])A\s?-?\s?(0*\d{1,2})(?![A-Za-z0-9])/gi;

export function referencedIds(text: string): string[] {
  const found = [...normalise(text).matchAll(REFERENCE)].map((m) => `A-${m[1]!.replace(/^0+(?=\d)/, "").padStart(2, "0")}`);
  return [...new Set(found)];
}

/** Every file under `dir` that could carry content, as `[path, text]`. */
export function contentFiles(dir: string): [string, string][] {
  const out: [string, string][] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...contentFiles(path));
    else if (/\.(mdx?|json|ts|tsx|js|mjs|ya?ml|csv|txt|html)$/.test(entry)) out.push([path, readFileSync(path, "utf8")]);
  }
  return out;
}

export interface Violation {
  readonly file: string;
  readonly id: string;
  readonly reason: "unticked" | "unknown";
}

/**
 * References that outrun an approval. An id that is not in the file at all is
 * as wrong as an unticked one, so both are reported.
 */
export function gateViolations(
  additions: readonly Addition[],
  files: readonly (readonly [string, string])[],
): Violation[] {
  const byId = new Map(additions.map((a) => [a.id, a]));
  const violations: Violation[] = [];
  for (const [file, text] of files) {
    for (const id of referencedIds(text)) {
      const addition = byId.get(id);
      if (!addition) violations.push({ file, id, reason: "unknown" });
      else if (!addition.approved) violations.push({ file, id, reason: "unticked" });
    }
  }
  return violations;
}

/**
 * The reference check only sees an explicit id, so wording pasted into content
 * without naming its entry would walk straight through it. These strings are
 * distinctive to one entry each — none appears in the pamphlet or its data —
 * and must stay out of `content/` until that entry is ticked. It is a tripwire,
 * not a proof: a paraphrase gets past it, and the owner's tick is what really
 * opens the gate.
 */
export const GUARDED_STRINGS: Readonly<Record<string, readonly string[]>> = {
  "A-01": ["6 x 100/16", "37.5 หรือ 38"],
  "A-02": ["กากตะกอนหม้อกรองอ้อย", "5 - 6 เดือน"],
  "A-03": ["16-8-24", "8-4-8", "4-4-8"],
  "A-04": ["21-30 วัน", "21-30 days"],
  "A-05": ["20-30 วันหลังข้าวงอก", "30 วันก่อนข้าวออกดอก"],
  "A-06": ["ใส่เป็นปุ๋ยรองพื้น เพื่อให้ปุ๋ยอยู่ใกล้บริเวณรากพืชมากที่สุด"],
  "A-07": ["1-1.5 กก./ต้น", "0.8-1 กก./ต้น"],
};

export function findGuardedPastes(
  additions: readonly Addition[],
  files: readonly (readonly [string, string])[],
): { id: string; file: string; needle: string }[] {
  const hits: { id: string; file: string; needle: string }[] = [];
  for (const [id, strings] of Object.entries(GUARDED_STRINGS)) {
    if (additions.find((a) => a.id === id)?.approved) continue;
    for (const needle of strings) {
      for (const [file, text] of files) if (text.includes(needle)) hits.push({ id, file, needle });
    }
  }
  return hits;
}
