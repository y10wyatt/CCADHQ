import Link from "next/link";
import { ArrowUpRight, CalendarCheck } from "lucide-react";

import type { DashboardStudentPlanItem } from "@/features/dashboard/domain/student-plan";
import { Card } from "@/shared/ui/card";
import { StatusPill } from "@/shared/ui/status-pill";

export function StudentPlanPanel({
  items,
}: {
  items: DashboardStudentPlanItem[];
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="size-5 text-accent" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Student plan</h2>
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Upcoming classes, preparation, follow-ups, and package attention.
          </p>
        </div>
        <Link
          href="/students"
          className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 text-sm font-medium transition-colors hover:border-accent/60 hover:bg-muted"
        >
          All students
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-5 rounded-lg border border-dashed border-border p-5 text-sm leading-6 text-muted-foreground">
          No student work needs attention right now.
        </p>
      ) : (
        <div className="mt-5 divide-y divide-border">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group flex min-h-16 items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="font-medium group-hover:text-accent">
                  {item.label}
                </p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  {item.detail}
                </p>
              </div>
              <StatusPill tone={item.tone}>
                {item.tone === "warning" ? "Attention" : "Planned"}
              </StatusPill>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
