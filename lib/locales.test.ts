import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, isSupportedLocale } from "./locales";

describe("locales", () => {
  it("serves Thai only in v1", () => {
    expect(SUPPORTED_LOCALES).toEqual(["th"]);
  });

  it("defaults to Thai", () => {
    expect(DEFAULT_LOCALE).toBe("th");
    expect(isSupportedLocale(DEFAULT_LOCALE)).toBe(true);
  });

  it("rejects locales that are not shipped", () => {
    expect(isSupportedLocale("km")).toBe(false);
    expect(isSupportedLocale("en")).toBe(false);
  });
});
