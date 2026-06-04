import { describe, expect, it } from "vitest";

import { normalizeAuthNextPath } from "@/features/auth/domain/auth";

describe("authentication redirects", () => {
  it("preserves local application paths", () => {
    expect(normalizeAuthNextPath("/tasks")).toBe("/tasks");
  });

  it("rejects external and protocol-relative redirects", () => {
    expect(normalizeAuthNextPath("https://example.com")).toBe("/");
    expect(normalizeAuthNextPath("//example.com")).toBe("/");
  });

  it("defaults missing redirect paths to home", () => {
    expect(normalizeAuthNextPath(null)).toBe("/");
    expect(normalizeAuthNextPath(undefined)).toBe("/");
  });
});
