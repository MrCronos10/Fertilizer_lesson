import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

/**
 * iCloud syncs this folder and drops copies named "<name> 2.<ext>" beside the real files. A bulk
 * `git add` once committed nineteen of them. A copy of a test file even runs and passes, which
 * hides that it is a stale copy, so this fails on any tracked file named like one.
 */
describe("repository hygiene", () => {
  it("tracks no iCloud conflict copy (a file named 'name 2.ext')", () => {
    const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
    expect(tracked.filter((f) => / \d\.[^/]*$/.test(f))).toEqual([]);
  });
});
