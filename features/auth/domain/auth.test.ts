import { describe, expect, it } from "vitest";

import {
  normalizeAuthNextPath,
  resolveAuthOrigin,
} from "@/features/auth/domain/auth";

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

describe("authentication callback origin", () => {
  it("prefers the explicitly configured public application URL", () => {
    expect(
      resolveAuthOrigin({
        configuredOrigin: "https://ccadhq.vercel.app/",
        forwardedHost: "localhost:3000",
        forwardedProto: "http",
      }),
    ).toBe("https://ccadhq.vercel.app");
  });

  it("uses Vercel forwarded headers when no public URL is configured", () => {
    expect(
      resolveAuthOrigin({
        forwardedHost: "ccadhq.vercel.app",
        forwardedProto: "https",
      }),
    ).toBe("https://ccadhq.vercel.app");
  });

  it("keeps local development callbacks on HTTP", () => {
    expect(resolveAuthOrigin({ host: "localhost:3000" })).toBe(
      "http://localhost:3000",
    );
  });
});
