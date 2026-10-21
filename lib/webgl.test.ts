import { describe, expect, it, vi } from "vitest";
import { MAX_DPR, webglAvailable } from "./webgl";

describe("MAX_DPR", () => {
  it("caps at 2 (D16)", () => {
    expect(MAX_DPR).toBe(2);
  });
});

function docWith(getContext: (type: string) => unknown) {
  return { createElement: () => ({ getContext }) } as unknown as Document;
}

describe("webglAvailable", () => {
  it("is false when no context can be made", () => {
    expect(webglAvailable(docWith(() => null))).toBe(false);
  });

  it("is false when getContext throws", () => {
    expect(
      webglAvailable(
        docWith(() => {
          throw new Error("blocked");
        }),
      ),
    ).toBe(false);
  });

  it("falls back to webgl1 when webgl2 is missing", () => {
    const gl = { getExtension: () => null };
    const seen: string[] = [];
    const doc = docWith((type) => {
      seen.push(type);
      return type === "webgl" ? gl : null;
    });
    expect(webglAvailable(doc)).toBe(true);
    expect(seen).toEqual(["webgl2", "webgl"]);
  });

  it("releases the probe context so it never counts as a second live one", () => {
    const loseContext = vi.fn();
    const gl = { getExtension: (n: string) => (n === "WEBGL_lose_context" ? { loseContext } : null) };
    expect(webglAvailable(docWith(() => gl))).toBe(true);
    expect(loseContext).toHaveBeenCalledTimes(1);
  });
});
