"use client";

import Link from "next/link";
import { ArrowDownAZ, Plus, Search, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  convertLeadToStudent,
  createLead,
  updateLeadStatus,
  type LeadActionResult,
} from "@/features/leads/application/actions";
import {
  activeLeadStatuses,
  formatMoney,
  getFollowUpState,
  leadAssignedStaffOptions,
  leadSources,
  leadStatuses,
  type LeadBoardView,
  type LeadStatus,
  type LeadView,
} from "@/features/leads/domain/leads";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";

const fieldClass =
  "min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground";

type SortMode = "updated" | "revenue" | "follow-up";

export function LeadsWorkspace({ board }: { board: LeadBoardView }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("All");
  const [assignedStaff, setAssignedStaff] = useState("All");
  const [sortMode, setSortMode] = useState<SortMode>("updated");
  const [conversionLead, setConversionLead] = useState<LeadView | null>(null);

  const visibleLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return board.leads
      .filter((lead) => !lead.convertedStudentId && lead.status !== "Enrolled")
      .filter((lead) =>
        source === "All" ? true : lead.source === source,
      )
      .filter((lead) =>
        assignedStaff === "All" ? true : lead.assignedStaff === assignedStaff,
      )
      .filter((lead) => {
        if (!normalizedQuery) return true;
        return [
          lead.studentName,
          lead.parentName,
          lead.school,
          lead.programInterest,
          lead.targetSchools.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (sortMode === "revenue") {
          return b.potentialRevenueMinor - a.potentialRevenueMinor;
        }
        if (sortMode === "follow-up") {
          return (a.nextFollowUpDate ?? "9999-12-31").localeCompare(
            b.nextFollowUpDate ?? "9999-12-31",
          );
        }
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [assignedStaff, board.leads, query, sortMode, source]);

  function runAction(
    action: () => Promise<LeadActionResult>,
    successMessage: string,
    onSuccess?: (result: LeadActionResult) => void,
  ) {
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      if (!result.ok) {
        setMessage(result.error ?? "Unable to update leads.");
        return;
      }
      setMessage(successMessage);
      setFormOpen(false);
      onSuccess?.(result);
      router.refresh();
    });
  }

  function moveLead(lead: LeadView, status: LeadStatus) {
    if (status === lead.status) return;
    if (status === "Enrolled") {
      setConversionLead(lead);
      return;
    }
    runAction(() => updateLeadStatus(lead.id, status), `${lead.studentName} moved.`);
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Active leads" value={board.metrics.activeLeads.toString()} />
        <Metric label="Pipeline revenue" value={formatMoney(board.metrics.pipelineRevenueMinor, board.currencyCode)} />
        <Metric label="Due today" value={board.metrics.followUpsDueToday.toString()} tone={board.metrics.followUpsDueToday > 0 ? "warning" : "neutral"} />
        <Metric label="Overdue" value={board.metrics.overdueFollowUps.toString()} tone={board.metrics.overdueFollowUps > 0 ? "warning" : "neutral"} />
      </section>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Admissions pipeline</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Track prospective students from inquiry to enrollment.
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus aria-hidden="true" />
            Add lead
          </Button>
        </div>
        {message && (
          <p className="mt-5 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
            {message}
          </p>
        )}
        {formOpen && (
          <LeadForm
            disabled={isPending}
            onClose={() => setFormOpen(false)}
            onSubmit={(input) =>
              runAction(() => createLead(input), "Lead created.")
            }
          />
        )}
        <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative grid gap-2 text-sm font-medium">
            <span className="sr-only">Search leads</span>
            <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
            <input
              className={`${fieldClass} pl-10`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search student, parent, school, target..."
            />
          </label>
          <SelectFilter label="Source" value={source} options={["All", ...leadSources]} onChange={setSource} />
          <SelectFilter label="Staff" value={assignedStaff} options={["All", ...leadAssignedStaffOptions]} onChange={setAssignedStaff} />
          <label className="grid gap-2 text-sm font-medium">
            <span className="flex items-center gap-2"><ArrowDownAZ className="size-4" aria-hidden="true" /> Sort</span>
            <select className={fieldClass} value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
              <option value="updated">Newest</option>
              <option value="follow-up">Follow-up date</option>
              <option value="revenue">Revenue</option>
            </select>
          </label>
        </div>
      </Card>

      <section className="grid min-h-[620px] gap-4 overflow-x-auto pb-2 xl:grid-cols-7">
        {leadStatuses.map((status) => (
          <PipelineColumn
            key={status}
            status={status}
            todayIso={board.todayIso}
            currencyCode={board.currencyCode}
            leads={visibleLeads.filter((lead) => lead.status === status)}
            disabled={isPending}
            onMove={moveLead}
          />
        ))}
      </section>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Marketing attribution</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Source quality for admissions conversations and enrolled revenue.
            </p>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-3 pr-4">Source</th>
                <th className="py-3 pr-4">Leads</th>
                <th className="py-3 pr-4">Enrollments</th>
                <th className="py-3 pr-4">Conversion</th>
                <th className="py-3">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {board.sourceReports.map((report) => (
                <tr key={report.source}>
                  <td className="py-3 pr-4 font-medium">{report.source}</td>
                  <td className="py-3 pr-4">{report.leads}</td>
                  <td className="py-3 pr-4">{report.enrollments}</td>
                  <td className="py-3 pr-4">{report.conversionRate}%</td>
                  <td className="py-3">{formatMoney(report.revenueMinor, board.currencyCode)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {conversionLead && (
        <ConversionDialog
          lead={conversionLead}
          disabled={isPending}
          onCancel={() => setConversionLead(null)}
          onConfirm={() =>
            runAction(
              () => convertLeadToStudent(conversionLead.id),
              "Lead converted to student.",
              (result) => {
                setConversionLead(null);
                if (result.studentId) router.push(`/students/${result.studentId}`);
              },
            )
          }
        />
      )}
    </div>
  );
}

function PipelineColumn({
  status,
  leads,
  todayIso,
  currencyCode,
  disabled,
  onMove,
}: {
  status: LeadStatus;
  leads: LeadView[];
  todayIso: string;
  currencyCode: string;
  disabled: boolean;
  onMove: (lead: LeadView, status: LeadStatus) => void;
}) {
  return (
    <div
      className="min-w-72 rounded-xl border border-border bg-card/70 p-3"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const leadJson = event.dataTransfer.getData("application/ccad-lead");
        if (!leadJson) return;
        onMove(JSON.parse(leadJson) as LeadView, status);
      }}
    >
      <div className="flex items-center justify-between gap-3 px-1 py-2">
        <h3 className="text-sm font-semibold">{status}</h3>
        <StatusPill tone={status === "Enrolled" ? "success" : status === "Lost" ? "neutral" : "info"}>{leads.length}</StatusPill>
      </div>
      <div className="mt-3 grid gap-3">
        {leads.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No leads here.
          </p>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              todayIso={todayIso}
              currencyCode={currencyCode}
              disabled={disabled || !activeLeadStatuses.includes(lead.status)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  todayIso,
  currencyCode,
  disabled,
}: {
  lead: LeadView;
  todayIso: string;
  currencyCode: string;
  disabled: boolean;
}) {
  const followUpState = getFollowUpState(lead.nextFollowUpDate, todayIso);

  return (
    <article
      draggable={!disabled}
      onDragStart={(event) => {
        event.dataTransfer.setData("application/ccad-lead", JSON.stringify(lead));
      }}
      className={cn(
        "rounded-lg border border-border bg-background p-4 shadow-sm transition-colors",
        !disabled && "cursor-grab hover:border-accent/60",
      )}
    >
      <Link href={`/leads/${lead.id}`} className="font-semibold hover:text-accent">
        {lead.studentName}
      </Link>
      <p className="mt-1 text-xs text-muted-foreground">
        {lead.grade || "Grade not set"} | {lead.school || "School not set"}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill tone="info">{lead.source}</StatusPill>
        <StatusPill tone={followUpTone(followUpState)}>
          {lead.nextFollowUpDate ? `Follow-up ${lead.nextFollowUpDate}` : "No follow-up"}
        </StatusPill>
      </div>
      <dl className="mt-4 grid gap-2 text-sm">
        <Info label="Interest" value={lead.programInterest || "Not set"} />
        <Info label="Parent" value={lead.parentName || "Not set"} />
        <Info label="Value" value={formatMoney(lead.potentialRevenueMinor, currencyCode)} />
      </dl>
    </article>
  );
}

function LeadForm({
  disabled,
  onClose,
  onSubmit,
}: {
  disabled: boolean;
  onClose: () => void;
  onSubmit: (input: LeadFormInput) => void;
}) {
  const [input, setInput] = useState<LeadFormInput>({
    studentName: "",
    grade: "",
    school: "",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    programInterest: "",
    targetSchools: "",
    goals: "",
    timeline: "",
    source: "Website",
    status: "New Inquiry",
    potentialRevenueMinor: 0,
    assignedStaff: "Team",
    lastContactedDate: "",
    nextFollowUpDate: "",
    notes: "",
  });

  return (
    <form
      className="mt-5 rounded-lg border border-border bg-background/70 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(input);
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-semibold">New admissions lead</h3>
        <button type="button" disabled={disabled} onClick={onClose} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Close lead form</span>
        </button>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <TextField label="Student name" value={input.studentName} onChange={(studentName) => setInput((current) => ({ ...current, studentName }))} />
        <TextField label="Grade" value={input.grade} onChange={(grade) => setInput((current) => ({ ...current, grade }))} />
        <TextField label="School" value={input.school} onChange={(school) => setInput((current) => ({ ...current, school }))} />
        <TextField label="Parent name" value={input.parentName} onChange={(parentName) => setInput((current) => ({ ...current, parentName }))} />
        <TextField label="Email" type="email" value={input.parentEmail} onChange={(parentEmail) => setInput((current) => ({ ...current, parentEmail }))} />
        <TextField label="Phone" value={input.parentPhone} onChange={(parentPhone) => setInput((current) => ({ ...current, parentPhone }))} />
        <TextField label="Program interest" value={input.programInterest} onChange={(programInterest) => setInput((current) => ({ ...current, programInterest }))} />
        <SelectField label="Source" value={input.source} options={leadSources} onChange={(source) => setInput((current) => ({ ...current, source: source as LeadFormInput["source"] }))} />
        <SelectField label="Assigned staff" value={input.assignedStaff} options={leadAssignedStaffOptions} onChange={(assignedStaff) => setInput((current) => ({ ...current, assignedStaff: assignedStaff as LeadFormInput["assignedStaff"] }))} />
        <TextField label="Potential revenue" type="number" value={(input.potentialRevenueMinor / 100).toString()} onChange={(value) => setInput((current) => ({ ...current, potentialRevenueMinor: Math.max(0, Math.round(Number(value || 0) * 100)) }))} />
        <TextField label="Last contacted" type="date" value={input.lastContactedDate ?? ""} onChange={(lastContactedDate) => setInput((current) => ({ ...current, lastContactedDate }))} />
        <TextField label="Next follow-up" type="date" value={input.nextFollowUpDate ?? ""} onChange={(nextFollowUpDate) => setInput((current) => ({ ...current, nextFollowUpDate }))} />
        <TextArea label="Target schools (one per line)" value={input.targetSchools} onChange={(targetSchools) => setInput((current) => ({ ...current, targetSchools }))} />
        <TextArea label="Goals" value={input.goals} onChange={(goals) => setInput((current) => ({ ...current, goals }))} />
        <TextArea label="Timeline" value={input.timeline} onChange={(timeline) => setInput((current) => ({ ...current, timeline }))} />
        <TextArea label="Notes" value={input.notes} onChange={(notes) => setInput((current) => ({ ...current, notes }))} />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" disabled={disabled} onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={disabled || !input.studentName.trim()}>Create lead</Button>
      </div>
    </form>
  );
}

interface LeadFormInput {
  studentName: string;
  grade: string;
  school: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  programInterest: string;
  targetSchools: string;
  goals: string;
  timeline: string;
  source: LeadView["source"];
  status: LeadView["status"];
  potentialRevenueMinor: number;
  assignedStaff: LeadView["assignedStaff"];
  lastContactedDate?: string | null;
  nextFollowUpDate?: string | null;
  notes: string;
}

function ConversionDialog({
  lead,
  disabled,
  onCancel,
  onConfirm,
}: {
  lead: LeadView;
  disabled: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/20 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-[0_20px_80px_rgb(31_59_93/0.18)]">
        <h2 className="text-lg font-semibold">Convert Lead to Student?</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This creates a student profile for {lead.studentName}, preserves the
          admissions timeline, links the original lead record, and removes the
          card from the active pipeline.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" disabled={disabled} onClick={onCancel}>Cancel</Button>
          <Button disabled={disabled} onClick={onConfirm}>Convert lead</Button>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "warning" }) {
  return (
    <Card className="p-5">
      <StatusPill tone={tone}>{label}</StatusPill>
      <p className="mt-5 font-mono text-3xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 leading-5">{value}</dd>
    </div>
  );
}

function SelectFilter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input type={type} className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium lg:col-span-3">
      {label}
      <textarea className={`${fieldClass} min-h-24 py-3`} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function followUpTone(state: ReturnType<typeof getFollowUpState>) {
  if (state === "overdue") return "warning";
  if (state === "due-today" || state === "due-soon") return "warning";
  return "success";
}
