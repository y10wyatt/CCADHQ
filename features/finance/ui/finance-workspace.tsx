"use client";

import {
  Archive,
  Check,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  archiveFinanceEntry,
  createFinanceEntry,
  updateFinanceEntry,
  type FinanceActionResult,
} from "@/features/finance/application/actions";
import {
  formatCurrency,
  formatEntryDate,
  formatMonthLabel,
  formatRecurrence,
  getPreviousMonthKey,
  parseAmountToMinor,
  summarizeFinance,
  type FinanceEntryView,
  type FinanceViewModel,
} from "@/features/finance/domain/finance";
import type {
  FinanceEntryType,
  FinanceRecurrence,
} from "@/shared/database/database.types";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { DataTable } from "@/shared/ui/data-table";
import { MiniBarChart } from "@/shared/ui/mini-chart";
import { StatusPill } from "@/shared/ui/status-pill";

const fieldClass =
  "min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground";

export function FinanceWorkspace({ finance }: { finance: FinanceViewModel }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceEntryView | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState(finance.currentMonth);
  const [typeFilter, setTypeFilter] = useState<FinanceEntryType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const months = useMemo(
    () =>
      Array.from(
        new Set([
          finance.currentMonth,
          ...finance.entries.map((entry) => entry.entryDate.slice(0, 7)),
        ]),
      ).sort((a, b) => b.localeCompare(a)),
    [finance.currentMonth, finance.entries],
  );
  const monthEntries = useMemo(
    () =>
      finance.entries.filter((entry) => entry.entryDate.startsWith(monthFilter)),
    [finance.entries, monthFilter],
  );
  const filteredEntries = useMemo(
    () =>
      monthEntries.filter(
        (entry) =>
          (typeFilter === "all" || entry.entryType === typeFilter) &&
          (categoryFilter === "all" || entry.categoryId === categoryFilter) &&
          matchesFinanceSearch(entry, searchQuery),
      ),
    [categoryFilter, monthEntries, searchQuery, typeFilter],
  );
  const summary = summarizeFinance(monthEntries);
  const monthLabel = formatMonthLabel(monthFilter, finance.timezone);
  const previousMonth = getPreviousMonthKey(monthFilter);
  const previousSummary = summarizeFinance(
    finance.entries.filter((entry) =>
      entry.entryDate.startsWith(previousMonth),
    ),
  );
  const latestUpdate = monthEntries.reduce<string | null>(
    (latest, entry) =>
      latest === null || entry.updatedAt > latest ? entry.updatedAt : latest,
    null,
  );

  function runAction(
    action: () => Promise<FinanceActionResult>,
    successMessage: string,
    onSuccess?: () => void,
  ) {
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      if (!result.ok) {
        setMessage(result.error ?? "Unable to update Finance.");
        return;
      }
      setMessage(successMessage);
      onSuccess?.();
      router.refresh();
    });
  }

  function beginCreate() {
    setEditingEntry(null);
    setFormOpen(true);
  }

  function beginEdit(entry: FinanceEntryView) {
    setEditingEntry(entry);
    setFormOpen(true);
  }

  return (
    <div className="grid gap-5">
      {message && (
        <p
          aria-live="polite"
          className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent"
        >
          {message}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Income"
          value={formatCurrency(summary.incomeMinor, finance.currencyCode)}
          month={monthLabel}
          tone="success"
        />
        <SummaryCard
          label="Expenses"
          value={formatCurrency(summary.expenseMinor, finance.currencyCode)}
          month={monthLabel}
          tone="warning"
        />
        <SummaryCard
          label="Net"
          value={formatCurrency(summary.netMinor, finance.currencyCode)}
          month={monthLabel}
          tone={
            summary.netMinor > 0
              ? "success"
              : summary.netMinor < 0
                ? "warning"
                : "neutral"
          }
        />
      </section>

      {summary.expenseMinor > 0 && summary.incomeMinor === 0 && (
        <p
          role="status"
          className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm leading-6 text-foreground"
        >
          {monthLabel} has expenses but no recorded income. Check whether income
          entries are missing before relying on the net total.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        {latestUpdate
          ? `Selected month last updated ${formatUpdatedAt(latestUpdate, finance.timezone)}.`
          : `No entries recorded for ${monthLabel}.`}
      </p>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Ledger controls</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Monthly totals use every active entry in the selected month.
            </p>
          </div>
          <Button onClick={beginCreate}>
            <Plus aria-hidden="true" />
            Add entry
          </Button>
        </div>
        <label className="mt-5 grid gap-2 text-xs font-medium text-muted-foreground">
          Search
          <span className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-foreground">
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search description, note, category, or owner"
              className="min-h-10 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </span>
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <FilterSelect
            label="Month"
            value={monthFilter}
            onChange={setMonthFilter}
            options={months.map((month) => ({
              value: month,
              label: formatMonthLabel(month, finance.timezone),
            }))}
          />
          <FilterSelect
            label="Type"
            value={typeFilter}
            onChange={(value) => setTypeFilter(value as FinanceEntryType | "all")}
            options={[
              { value: "all", label: "All types" },
              { value: "income", label: "Income" },
              { value: "expense", label: "Expense" },
            ]}
          />
          <FilterSelect
            label="Category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: "all", label: "All categories" },
              ...finance.categories.map((category) => ({
                value: category.id,
                label: `${category.name} (${capitalize(category.entryType)})`,
              })),
            ]}
          />
        </div>
      </Card>

      {formOpen && (
        <FinanceEntryForm
          key={editingEntry?.id ?? "new-entry"}
          entry={editingEntry}
          finance={finance}
          disabled={isPending}
          onClose={() => setFormOpen(false)}
          onSubmit={(input) =>
            runAction(
              () =>
                editingEntry
                  ? updateFinanceEntry({ entryId: editingEntry.id, ...input })
                  : createFinanceEntry(input),
              editingEntry ? "Finance entry updated." : "Finance entry created.",
              () => setFormOpen(false),
            )
          }
        />
      )}

      <MonthlyComparison
        incomeMinor={summary.incomeMinor}
        expenseMinor={summary.expenseMinor}
        currencyCode={finance.currencyCode}
        monthLabel={monthLabel}
        previousMonthLabel={formatMonthLabel(previousMonth, finance.timezone)}
        previousNetMinor={previousSummary.netMinor}
      />

      <LedgerTable
        entries={filteredEntries}
        timezone={finance.timezone}
        disabled={isPending}
        onEdit={beginEdit}
        onArchive={(entry) => {
          if (window.confirm(`Archive "${entry.description}"?`)) {
            runAction(
              () => archiveFinanceEntry(entry.id),
              "Finance entry archived.",
            );
          }
        }}
      />
    </div>
  );
}

function formatUpdatedAt(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(value));
}

function SummaryCard({
  label,
  value,
  month,
  tone,
}: {
  label: string;
  value: string;
  month: string;
  tone: "neutral" | "success" | "warning";
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <StatusPill tone={tone}>{month}</StatusPill>
      </div>
      <p className="mt-4 font-mono text-3xl font-semibold">{value}</p>
    </Card>
  );
}

function MonthlyComparison({
  incomeMinor,
  expenseMinor,
  currencyCode,
  monthLabel,
  previousMonthLabel,
  previousNetMinor,
}: {
  incomeMinor: number;
  expenseMinor: number;
  currencyCode: string;
  monthLabel: string;
  previousMonthLabel: string;
  previousNetMinor: number;
}) {
  const netMinor = incomeMinor - expenseMinor;
  const netDifferenceMinor = netMinor - previousNetMinor;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Income and expenses</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A lightweight comparison for {monthLabel}.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Net is {formatCurrency(Math.abs(netDifferenceMinor), currencyCode)}{" "}
            {netDifferenceMinor >= 0 ? "higher" : "lower"} than{" "}
            {previousMonthLabel}.
          </p>
        </div>
        <StatusPill tone="neutral">Internal visibility</StatusPill>
      </div>
      <div className="mt-6 grid gap-5">
        <MiniBarChart
          data={[
            { label: "Income", value: incomeMinor, tone: "success" },
            { label: "Expenses", value: expenseMinor, tone: "warning" },
          ]}
          valueFormatter={(value) => formatCurrency(value, currencyCode)}
        />
      </div>
    </Card>
  );
}

function LedgerTable({
  entries,
  timezone,
  disabled,
  onEdit,
  onArchive,
}: {
  entries: FinanceEntryView[];
  timezone: string;
  disabled: boolean;
  onEdit: (entry: FinanceEntryView) => void;
  onArchive: (entry: FinanceEntryView) => void;
}) {
  return (
    <DataTable
      title="Ledger entries"
      description={`${entries.length} matching ${entries.length === 1 ? "entry" : "entries"}`}
      rows={entries}
      getRowKey={(entry) => entry.id}
      emptyMessage="No finance entries match these filters."
      columns={[
        {
          key: "date",
          header: "Date",
          className: "whitespace-nowrap",
          render: (entry) => formatEntryDate(entry.entryDate, timezone),
        },
        {
          key: "description",
          header: "Description",
          className: "max-w-sm",
          render: (entry) => (
            <>
                <p className="font-medium">{entry.description}</p>
                {entry.note && (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {entry.note}
                  </p>
                )}
            </>
          ),
        },
        {
          key: "category",
          header: "Category",
          render: (entry) => entry.categoryName,
        },
        {
          key: "recurrence",
          header: "Repeats",
          render: (entry) => (
            <StatusPill tone={entry.recurrence === "none" ? "neutral" : "info"}>
              {formatRecurrence(entry.recurrence)}
            </StatusPill>
          ),
        },
        {
          key: "creator",
          header: "Recorded by",
          render: (entry) => entry.creatorName,
        },
        {
          key: "amount",
          header: "Amount",
          align: "right",
          className: "whitespace-nowrap font-mono font-semibold",
          render: (entry) => (
            <span
              className={entry.entryType === "income" ? "text-success" : "text-warning"}
            >
              {entry.entryType === "income" ? "+" : "-"}
              {formatCurrency(entry.amountMinor, entry.currencyCode)}
            </span>
          ),
        },
        {
          key: "actions",
          header: "Actions",
          render: (entry) =>
            entry.canManage ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => onEdit(entry)}
                >
                  <Pencil aria-hidden="true" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => onArchive(entry)}
                >
                  <Archive aria-hidden="true" />
                  Archive
                </Button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">View only</span>
            ),
        },
      ]}
    />
  );
}

function FinanceEntryForm({
  entry,
  finance,
  disabled,
  onClose,
  onSubmit,
}: {
  entry: FinanceEntryView | null;
  finance: FinanceViewModel;
  disabled: boolean;
  onClose: () => void;
  onSubmit: (input: {
    entryType: FinanceEntryType;
    amountMinor: number;
    entryDate: string;
    categoryId: string;
    description: string;
    note: string | null;
    recurrence: FinanceRecurrence;
  }) => void;
}) {
  const initialType = entry?.entryType ?? "expense";
  const initialCategories = finance.categories.filter(
    (category) => category.entryType === initialType,
  );
  const [entryType, setEntryType] = useState<FinanceEntryType>(initialType);
  const [amount, setAmount] = useState(
    entry ? (entry.amountMinor / 100).toFixed(2) : "",
  );
  const [entryDate, setEntryDate] = useState(
    entry?.entryDate ?? finance.currentDate,
  );
  const [categoryId, setCategoryId] = useState(
    initialCategories.some((category) => category.id === entry?.categoryId)
      ? (entry?.categoryId ?? "")
      : (initialCategories[0]?.id ?? ""),
  );
  const [description, setDescription] = useState(entry?.description ?? "");
  const [note, setNote] = useState(entry?.note ?? "");
  const [recurrence, setRecurrence] = useState<FinanceRecurrence>(
    entry?.recurrence ?? "none",
  );
  const [amountError, setAmountError] = useState<string | null>(null);
  const categories = finance.categories.filter(
    (category) => category.entryType === entryType,
  );

  function changeType(type: FinanceEntryType) {
    setEntryType(type);
    setCategoryId(
      finance.categories.find((category) => category.entryType === type)?.id ?? "",
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            {entry ? "Edit finance entry" : "Add finance entry"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Finance entries are internal records and do not award Studio XP.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X aria-hidden="true" />
          Close
        </Button>
      </div>
      <form
        className="mt-5 grid gap-4 lg:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const amountMinor = parseAmountToMinor(amount);
          if (!amountMinor) {
            setAmountError("Enter a positive amount with no more than two decimals.");
            return;
          }
          setAmountError(null);
          onSubmit({
            entryType,
            amountMinor,
            entryDate,
            categoryId,
            description,
            note: note.trim() || null,
            recurrence,
          });
        }}
      >
        <label className="grid gap-2 text-sm font-medium">
          Entry type
          <select
            className={fieldClass}
            value={entryType}
            onChange={(event) => changeType(event.target.value as FinanceEntryType)}
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Amount ({finance.currencyCode})
          <input
            className={fieldClass}
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            aria-describedby={amountError ? "finance-amount-error" : undefined}
          />
          {amountError && (
            <span id="finance-amount-error" className="text-xs text-danger">
              {amountError}
            </span>
          )}
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Date
          <input
            className={fieldClass}
            type="date"
            value={entryDate}
            onChange={(event) => setEntryDate(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Repeats
          <select
            className={fieldClass}
            value={recurrence}
            onChange={(event) =>
              setRecurrence(event.target.value as FinanceRecurrence)
            }
          >
            <option value="none">One-time</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <span className="text-xs font-normal text-muted-foreground">
            Marks the entry as recurring; future entries are still recorded manually.
          </span>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Category
          <select
            className={fieldClass}
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium lg:col-span-2">
          Description
          <input
            className={fieldClass}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium lg:col-span-2">
          Note (optional)
          <textarea
            className={`${fieldClass} min-h-24 py-3`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <div className="flex items-end lg:col-span-2">
          <Button
            type="submit"
            disabled={
              disabled ||
              !description.trim() ||
              !amount.trim() ||
              !entryDate ||
              !categoryId
            }
          >
            {entry ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
            {entry ? "Save entry" : "Create entry"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-xs font-medium text-muted-foreground">
      {label}
      <select
        className={fieldClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function matchesFinanceSearch(entry: FinanceEntryView, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [
    entry.description,
    entry.note ?? "",
    entry.categoryName,
    entry.creatorName,
    formatRecurrence(entry.recurrence),
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}
