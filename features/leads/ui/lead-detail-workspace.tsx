"use client";

import { CalendarClock, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createLeadActivity,
  type LeadActionResult,
} from "@/features/leads/application/actions";
import {
  formatMoney,
  getFollowUpState,
  type LeadActivityView,
  type LeadView,
} from "@/features/leads/domain/leads";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";

const fieldClass =
  "min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground";

export function LeadDetailWorkspace({
  lead,
  activities,
  todayIso,
  currencyCode,
}: {
  lead: LeadView;
  activities: LeadActivityView[];
  todayIso: string;
  currencyCode: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function runAction(
    action: () => Promise<LeadActionResult>,
    successMessage: string,
  ) {
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      if (!result.ok) {
        setMessage(result.error ?? "Unable to update the lead.");
        return;
      }
      setMessage(successMessage);
      setFormOpen(false);
      router.refresh();
    });
  }

  const followUpState = getFollowUpState(lead.nextFollowUpDate, todayIso);

  return (
    <div className="grid gap-5">
      <Card>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="info">{lead.status}</StatusPill>
          <StatusPill tone="neutral">{lead.source}</StatusPill>
          <StatusPill tone={followUpState === "scheduled" ? "success" : "warning"}>
            {lead.nextFollowUpDate ? `Follow-up ${lead.nextFollowUpDate}` : "No follow-up scheduled"}
          </StatusPill>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Info label="Student name" value={lead.studentName} />
          <Info label="Parent name" value={lead.parentName} />
          <Info label="Grade" value={lead.grade} />
          <Info label="School" value={lead.school} />
          <Info label="Email" value={lead.parentEmail} />
          <Info label="Phone" value={lead.parentPhone} />
        </div>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <Card>
          <h2 className="text-lg font-semibold">Admissions information</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Info label="Program interest" value={lead.programInterest} />
            <Info label="Timeline" value={lead.timeline} />
            <Info label="Target schools" value={lead.targetSchools.join(", ")} />
            <Info label="Potential revenue" value={formatMoney(lead.potentialRevenueMinor, currencyCode)} />
            <Info label="Goals" value={lead.goals} wide />
            <Info label="Notes" value={lead.notes} wide />
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Follow-up state</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Admissions reminders use the next follow-up date.
              </p>
            </div>
            <CalendarClock className="size-5 text-accent" aria-hidden="true" />
          </div>
          <div className="mt-5 grid gap-4">
            <Info label="Assigned staff" value={lead.assignedStaff} />
            <Info label="Last contacted" value={lead.lastContactedDate ?? "Not recorded"} />
            <Info label="Next follow-up" value={lead.nextFollowUpDate ?? "Not scheduled"} />
          </div>
        </Card>
      </section>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Activity timeline</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Admissions events are kept with the lead after conversion.
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus aria-hidden="true" />
            Add entry
          </Button>
        </div>
        {message && (
          <p className="mt-5 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
            {message}
          </p>
        )}
        {formOpen && (
          <ActivityForm
            leadId={lead.id}
            disabled={isPending}
            onClose={() => setFormOpen(false)}
            onSubmit={(input) =>
              runAction(() => createLeadActivity(input), "Timeline entry added.")
            }
          />
        )}
        <div className="mt-6 grid gap-4">
          {activities.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              No activity entries yet.
            </p>
          ) : (
            activities.map((activity) => (
              <article key={activity.id} className="grid gap-3 border-l-2 border-accent/30 pl-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {formatTimelineDate(activity.activityDate)}
                  </p>
                  <h3 className="mt-1 font-semibold">{activity.title}</h3>
                </div>
                {activity.notes && (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {activity.notes}
                  </p>
                )}
              </article>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function ActivityForm({
  leadId,
  disabled,
  onClose,
  onSubmit,
}: {
  leadId: string;
  disabled: boolean;
  onClose: () => void;
  onSubmit: (input: ActivityInput) => void;
}) {
  const [input, setInput] = useState<ActivityInput>({
    leadId,
    activityDate: new Date().toISOString().slice(0, 10),
    title: "",
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
        <h3 className="text-sm font-semibold">New timeline entry</h3>
        <button type="button" disabled={disabled} onClick={onClose} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Close timeline form</span>
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <TextField label="Date" type="date" value={input.activityDate} onChange={(activityDate) => setInput((current) => ({ ...current, activityDate }))} />
        <TextField label="Title" value={input.title} onChange={(title) => setInput((current) => ({ ...current, title }))} />
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Notes
          <textarea className={`${fieldClass} min-h-24 py-3`} value={input.notes} onChange={(event) => setInput((current) => ({ ...current, notes: event.target.value }))} />
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" disabled={disabled} onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={disabled || !input.title.trim()}>Add entry</Button>
      </div>
    </form>
  );
}

interface ActivityInput {
  leadId: string;
  activityDate: string;
  title: string;
  notes: string;
}

function Info({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "md:col-span-2" : undefined}>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 leading-6">{value || "Not set"}</dd>
    </div>
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

function formatTimelineDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}
