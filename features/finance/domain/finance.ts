import type { FinanceEntryType } from "@/shared/database/database.types";

export interface FinanceCategoryOption {
  id: string;
  name: string;
  entryType: FinanceEntryType;
}

export interface FinanceEntryView {
  id: string;
  entryType: FinanceEntryType;
  amountMinor: number;
  currencyCode: string;
  entryDate: string;
  categoryId: string;
  categoryName: string;
  description: string;
  note: string | null;
  creatorName: string;
  canManage: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceViewModel {
  entries: FinanceEntryView[];
  categories: FinanceCategoryOption[];
  currencyCode: string;
  timezone: string;
  currentMonth: string;
  currentDate: string;
}

export interface FinanceSummary {
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
}

export function summarizeFinance(entries: FinanceEntryView[]): FinanceSummary {
  const incomeMinor = sumByType(entries, "income");
  const expenseMinor = sumByType(entries, "expense");
  return {
    incomeMinor,
    expenseMinor,
    netMinor: incomeMinor - expenseMinor,
  };
}

export function parseAmountToMinor(amount: string): number | null {
  const normalized = amount.trim().replaceAll(",", "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(minor) && minor > 0 ? minor : null;
}

export function formatCurrency(amountMinor: number, currencyCode: string) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currencyCode,
  }).format(amountMinor / 100);
}

export function formatEntryDate(entryDate: string, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  }).format(new Date(`${entryDate}T12:00:00.000Z`));
}

export function getMonthKey(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: timezone,
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
}

export function getDateKey(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  }).formatToParts(now);
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function formatMonthLabel(month: string, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "long",
    year: "numeric",
    timeZone: timezone,
  }).format(new Date(`${month}-15T12:00:00.000Z`));
}

function sumByType(entries: FinanceEntryView[], type: FinanceEntryType) {
  return entries
    .filter((entry) => entry.entryType === type)
    .reduce((total, entry) => total + entry.amountMinor, 0);
}
