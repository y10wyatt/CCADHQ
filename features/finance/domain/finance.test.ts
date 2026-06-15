import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  getDateKey,
  getMonthKey,
  parseAmountToMinor,
  summarizeFinance,
  type FinanceEntryView,
} from "@/features/finance/domain/finance";

const entry = (
  entryType: "income" | "expense",
  amountMinor: number,
): FinanceEntryView => ({
  id: crypto.randomUUID(),
  entryType,
  amountMinor,
  currencyCode: "CAD",
  entryDate: "2026-06-04",
  categoryId: crypto.randomUUID(),
  categoryName: "Test",
  description: "Test entry",
  note: null,
  recurrence: "none",
  creatorName: "William",
  canManage: true,
  createdAt: "2026-06-04T00:00:00.000Z",
  updatedAt: "2026-06-04T00:00:00.000Z",
});

describe("finance domain", () => {
  it("parses a decimal amount into minor units without floating-point math", () => {
    expect(parseAmountToMinor("1,234.5")).toBe(123450);
    expect(parseAmountToMinor("12.345")).toBeNull();
    expect(parseAmountToMinor("0")).toBeNull();
  });

  it("summarizes income, expenses, and net", () => {
    expect(
      summarizeFinance([
        entry("income", 10000),
        entry("income", 2500),
        entry("expense", 4000),
      ]),
    ).toEqual({ incomeMinor: 12500, expenseMinor: 4000, netMinor: 8500 });
  });

  it("uses the organization timezone for the current month", () => {
    expect(
      getMonthKey(new Date("2026-07-01T02:00:00.000Z"), "America/Vancouver"),
    ).toBe("2026-06");
  });

  it("uses the organization timezone for the current date", () => {
    expect(
      getDateKey(new Date("2026-07-01T02:00:00.000Z"), "America/Vancouver"),
    ).toBe("2026-06-30");
  });

  it("formats currency consistently", () => {
    expect(formatCurrency(123456, "CAD")).toContain("1,234.56");
  });
});
