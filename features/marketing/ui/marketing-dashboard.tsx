"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  archiveContentIdea,
  createContentIdea,
  updateContentIdea,
  type MarketingActionResult,
} from "@/features/marketing/application/actions";
import {
  accountLabels,
  type AccountIdentity,
  type AssetNeed,
  type ContentIdea,
  type ContentLaneRow,
  type MarketingAccountId,
  type MarketingDashboardData,
  type MarketingStatus,
  type PerformancePost,
  type WeeklyScheduleRow,
  type WinningTopic,
} from "@/features/marketing/domain/marketing";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { DataTable } from "@/shared/ui/data-table";
import { FileUploader } from "@/shared/ui/file-uploader";
import { MiniBarChart, MiniLineChart } from "@/shared/ui/mini-chart";
import { StatusPill } from "@/shared/ui/status-pill";

const accountStyles: Record<MarketingAccountId, string> = {
  ccad: "border-accent/30 bg-accent/10 text-accent",
  william: "border-[#5f6f52]/30 bg-[#eff4ea] text-[#405038]",
  alice: "border-[#bd6f53]/30 bg-[#fff1ea] text-[#9a4f39]",
  mascot: "border-[#7366a8]/30 bg-[#f0eefb] text-[#574a91]",
};

const roleStyles: Record<string, string> = {
  Primary: "border-accent/30 bg-accent/10 text-accent",
  Secondary: "border-border bg-muted text-muted-foreground",
  No: "border-border bg-transparent text-muted-foreground",
};

const fieldClass =
  "min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground";

export function MarketingDashboard({
  data,
}: {
  data: MarketingDashboardData;
}) {
  return (
    <div className="grid gap-5">
      <section className="grid gap-4 xl:grid-cols-4">
        {data.accounts.map((account) => (
          <AccountIdentityCard key={account.id} account={account} />
        ))}
      </section>

      <ContentLaneMatrix rows={data.laneRows} />

      <IdeaPipelineBoard
        statuses={data.workflowStatuses}
        ideas={data.ideas}
      />

      <WeeklyContentCalendar rows={data.weeklySchedule} />

      <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <PerformanceLearningPanel posts={data.performancePosts} />
        <WinningTopicsPanel topics={data.winningTopics} />
      </section>

      <MarketingChartsPanel posts={data.performancePosts} />

      <AssetsNeededPanel assets={data.assetNeeds} />
    </div>
  );
}

export function AccountIdentityCard({
  account,
}: {
  account: AccountIdentity;
}) {
  return (
    <Card className="flex h-full flex-col gap-5">
      <div>
        <AccountTag account={account.id} />
        <h2 className="mt-4 text-xl font-semibold tracking-tight">
          {account.name}
        </h2>
        <p className="mt-2 text-sm font-medium text-foreground">
          {account.purpose}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {account.audience}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Content
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {account.content.map((item) => (
            <span
              key={item}
              className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto grid gap-3 border-t border-border pt-4 text-sm">
        <DefinitionRow label="Tone" value={account.tone} />
        <DefinitionRow label="Avoid" value={account.avoid} />
        <DefinitionRow label="CTA" value={account.cta} />
      </div>
    </Card>
  );
}

export function ContentLaneMatrix({ rows }: { rows: ContentLaneRow[] }) {
  const accounts: MarketingAccountId[] = ["ccad", "william", "alice", "mascot"];

  return (
    <Card>
      <SectionHeading
        title="Content lane matrix"
        description="Shows who should own each lane, and where supporting angles belong."
      />
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[780px] w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr>
              <th className="border-b border-border pb-3 pr-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Lane
              </th>
              {accounts.map((account) => (
                <th
                  key={account}
                  className="border-b border-border px-3 pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                >
                  {accountLabels[account]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.lane}>
                <th className="border-b border-border/70 py-4 pr-4 font-semibold">
                  {row.lane}
                </th>
                {accounts.map((account) => (
                  <td
                    key={account}
                    className="border-b border-border/70 px-3 py-4"
                  >
                    <RoleBadge role={row.roles[account]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function IdeaPipelineBoard({
  statuses,
  ideas,
}: {
  statuses: MarketingStatus[];
  ideas: ContentIdea[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<ContentIdea | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function runAction(
    action: () => Promise<MarketingActionResult>,
    successMessage: string,
  ) {
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      if (!result.ok) {
        setMessage(result.error ?? "Unable to update Marketing.");
        return;
      }
      setMessage(successMessage);
      setFormOpen(false);
      setEditingIdea(null);
      router.refresh();
    });
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          title="Idea pipeline"
          description="Create, move, and review content ideas by workflow status."
        />
        <Button
          onClick={() => {
            setEditingIdea(null);
            setFormOpen(true);
          }}
        >
          <Plus aria-hidden="true" />
          Add idea
        </Button>
      </div>
      {message && (
        <p className="mt-5 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
          {message}
        </p>
      )}
      {formOpen && (
        <ContentIdeaForm
          idea={editingIdea}
          statuses={statuses}
          disabled={isPending}
          onClose={() => {
            setFormOpen(false);
            setEditingIdea(null);
          }}
          onSubmit={(input) =>
            runAction(
              () =>
                editingIdea
                  ? updateContentIdea({ ideaId: editingIdea.id, ...input })
                  : createContentIdea(input),
              editingIdea ? "Content idea updated." : "Content idea added.",
            )
          }
        />
      )}
      <div className="mt-5 grid gap-3 overflow-x-auto pb-2 xl:grid-cols-4 2xl:grid-cols-8">
        {statuses.map((status) => {
          const columnIdeas = ideas.filter((idea) => idea.status === status);

          return (
            <section
              key={status}
              className="min-h-56 min-w-64 rounded-lg border border-border bg-background/70 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">{status}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {columnIdeas.length}
                </span>
              </div>
              <div className="mt-3 grid gap-3">
                {columnIdeas.length > 0 ? (
                  columnIdeas.map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      statuses={statuses}
                      disabled={isPending}
                      onEdit={() => {
                        setEditingIdea(idea);
                        setFormOpen(true);
                      }}
                      onDelete={() =>
                        runAction(
                          () => archiveContentIdea(idea.id),
                          "Content idea deleted.",
                        )
                      }
                      onStatusChange={(status) =>
                        runAction(
                          () => updateContentIdea({ ideaId: idea.id, ...idea, status }),
                          "Content idea moved.",
                        )
                      }
                    />
                  ))
                ) : (
                  <p className="rounded-md border border-dashed border-border px-3 py-4 text-xs leading-5 text-muted-foreground">
                    No content queued here yet.
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </Card>
  );
}

export function WeeklyContentCalendar({
  rows,
}: {
  rows: WeeklyScheduleRow[];
}) {
  const accounts: MarketingAccountId[] = ["ccad", "william", "alice", "mascot"];

  return (
    <Card>
      <SectionHeading
        title="Weekly content calendar"
        description="A simple publishing roadmap by day and identity."
      />
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[760px] w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr>
              <th className="border-b border-border pb-3 pr-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Day
              </th>
              {accounts.map((account) => (
                <th
                  key={account}
                  className="border-b border-border px-3 pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                >
                  {accountLabels[account]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.day}>
                <th className="border-b border-border/70 py-4 pr-4 font-semibold">
                  {row.day}
                </th>
                {accounts.map((account) => (
                  <td
                    key={account}
                    className="border-b border-border/70 px-3 py-4 align-top"
                  >
                    <div className="grid gap-2">
                      {(row.posts[account] ?? []).map((post) => (
                        <span
                          key={post}
                          className="rounded-md border border-border bg-background px-2.5 py-2 text-xs font-medium"
                        >
                          {post}
                        </span>
                      ))}
                      {!row.posts[account]?.length && (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function PerformanceLearningPanel({
  posts,
}: {
  posts: PerformancePost[];
}) {
  return (
    <Card>
      <SectionHeading
        title="Performance + learning"
        description="Light review after publishing, focused on what to repeat."
      />
      <div className="mt-5 grid gap-4">
        {posts.map((post) => (
          <article
            key={post.title}
            className="rounded-lg border border-border bg-background/70 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{post.title}</h3>
                <AccountTag account={post.account} className="mt-2" />
              </div>
              <StatusPill tone="success">
                {post.consultationsBooked} consultations
              </StatusPill>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
              <Metric label="Views" value={post.views} />
              <Metric label="Saves" value={post.saves} />
              <Metric label="Comments" value={post.comments} />
              <Metric label="Follows" value={post.followsGained} />
              <Metric label="DMs" value={post.inquiries} />
              <Metric label="Booked" value={post.consultationsBooked} />
            </dl>
            <p className="mt-4 border-t border-border pt-3 text-sm leading-6 text-muted-foreground">
              {post.notes}
            </p>
          </article>
        ))}
      </div>
    </Card>
  );
}

function WinningTopicsPanel({ topics }: { topics: WinningTopic[] }) {
  return (
    <DataTable
      title="Winning topics"
      description="Patterns worth repeating across the next content cycle."
      rows={topics}
      getRowKey={(topic) => `${topic.topic}-${topic.account}`}
      minWidth="640px"
      emptyMessage="No winning topics logged yet."
      columns={[
        {
          key: "topic",
          header: "Topic",
          render: (topic) => <span className="font-semibold">{topic.topic}</span>,
        },
        {
          key: "account",
          header: "Account",
          render: (topic) => <AccountTag account={topic.account} />,
        },
        {
          key: "result",
          header: "Result",
          render: (topic) => topic.result,
        },
        {
          key: "repeat",
          header: "What to repeat",
          render: (topic) => (
            <span className="text-muted-foreground">{topic.repeat}</span>
          ),
        },
      ]}
    />
  );
}

export function AssetsNeededPanel({ assets }: { assets: AssetNeed[] }) {
  return (
    <Card>
      <SectionHeading
        title="Assets needed"
        description="Reusable media and writing blocks that make publishing easier."
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {assets.map((asset) => (
          <div
            key={asset.name}
            className="rounded-lg border border-border bg-background/70 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold leading-5">{asset.name}</h3>
              <StatusPill tone={assetTone(asset.status)}>{asset.status}</StatusPill>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Owner: {asset.owner}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <FileUploader
          title="Stage reusable marketing assets"
          description="Drop student work photos, process images, B-roll, post covers, or caption drafts here for local planning. This does not upload to Supabase yet."
        />
      </div>
    </Card>
  );
}

function MarketingChartsPanel({ posts }: { posts: PerformancePost[] }) {
  const totals = posts.reduce(
    (current, post) => ({
      views: current.views + parseMetric(post.views),
      saves: current.saves + parseMetric(post.saves),
      comments: current.comments + parseMetric(post.comments),
      follows: current.follows + parseMetric(post.followsGained),
      inquiries: current.inquiries + parseMetric(post.inquiries),
      booked: current.booked + parseMetric(post.consultationsBooked),
    }),
    { views: 0, saves: 0, comments: 0, follows: 0, inquiries: 0, booked: 0 },
  );

  return (
    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <SectionHeading
          title="Performance snapshot"
          description="Simple aggregate view until live analytics are connected."
        />
        <div className="mt-5">
          <MiniBarChart
            data={[
              { label: "Views", value: totals.views, tone: "info" },
              { label: "Saves", value: totals.saves, tone: "success" },
              { label: "Comments", value: totals.comments, tone: "warning" },
              { label: "Follows", value: totals.follows, tone: "neutral" },
              { label: "DMs", value: totals.inquiries, tone: "info" },
              { label: "Booked", value: totals.booked, tone: "success" },
            ]}
            valueFormatter={(value) => value.toLocaleString()}
          />
        </div>
      </Card>
      <Card>
        <SectionHeading
          title="Post learning trend"
          description="A lightweight trend line based on views per reviewed post."
        />
        <div className="mt-5">
          <MiniLineChart
            data={posts.map((post) => ({
              label: accountLabels[post.account],
              value: parseMetric(post.views),
            }))}
          />
        </div>
      </Card>
    </section>
  );
}

function IdeaCard({
  idea,
  statuses,
  disabled,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  idea: ContentIdea;
  statuses: MarketingStatus[];
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: MarketingStatus) => void;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold leading-5">{idea.title}</h4>
        <PriorityPill priority={idea.priority} />
      </div>
      <div className="mt-3 flex gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Pencil className="size-4" aria-hidden="true" />
          <span className="sr-only">Edit {idea.title}</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-danger"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          <span className="sr-only">Delete {idea.title}</span>
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <AccountTag account={idea.account} />
        <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          {idea.owner}
        </span>
      </div>
      <dl className="mt-4 grid gap-2 text-xs leading-5 text-muted-foreground">
        <DefinitionRow label="Lane" value={idea.lane} />
        <DefinitionRow label="Audience" value={idea.audience} />
        <DefinitionRow label="Format" value={idea.format} />
        <DefinitionRow label="CTA" value={idea.cta} />
        <DefinitionRow label="Deadline" value={idea.deadline} />
        {idea.notes && <DefinitionRow label="Notes" value={idea.notes} />}
      </dl>
      <select
        className={`${fieldClass} mt-4 min-h-9 w-full py-1 text-xs`}
        value={idea.status}
        disabled={disabled}
        onChange={(event) => onStatusChange(event.target.value as MarketingStatus)}
      >
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    </article>
  );
}

function ContentIdeaForm({
  idea,
  statuses,
  disabled,
  onClose,
  onSubmit,
}: {
  idea: ContentIdea | null;
  statuses: MarketingStatus[];
  disabled: boolean;
  onClose: () => void;
  onSubmit: (input: Omit<ContentIdea, "id">) => void;
}) {
  const [input, setInput] = useState<Omit<ContentIdea, "id">>(
    idea
      ? {
          title: idea.title,
          account: idea.account,
          owner: idea.owner,
          lane: idea.lane,
          audience: idea.audience,
          format: idea.format,
          priority: idea.priority,
          deadline: idea.deadline,
          cta: idea.cta,
          status: idea.status,
          notes: idea.notes,
        }
      : {
          title: "",
          account: "ccad",
          owner: "Team",
          lane: "",
          audience: "",
          format: "",
          priority: "Medium",
          deadline: "",
          cta: "",
          status: "Idea Bank",
          notes: "",
        },
  );

  return (
    <form
      className="mt-5 rounded-lg border border-border bg-background/70 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ ...input, title: input.title.trim() });
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">
            {idea ? "Edit content idea" : "New content idea"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Keep the owner, lane, CTA, and next workflow state clear.
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onClose}
          className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Close content idea form</span>
        </button>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <TextField label="Title" value={input.title} onChange={(title) => setInput((current) => ({ ...current, title }))} />
        <SelectField label="Account" value={input.account} options={["ccad", "william", "alice", "mascot"]} onChange={(account) => setInput((current) => ({ ...current, account: account as ContentIdea["account"] }))} />
        <SelectField label="Owner" value={input.owner} options={["William", "Alice", "Team", "Other"]} onChange={(owner) => setInput((current) => ({ ...current, owner: owner as ContentIdea["owner"] }))} />
        <TextField label="Content lane" value={input.lane} onChange={(lane) => setInput((current) => ({ ...current, lane }))} />
        <TextField label="Audience" value={input.audience} onChange={(audience) => setInput((current) => ({ ...current, audience }))} />
        <TextField label="Format" value={input.format} onChange={(format) => setInput((current) => ({ ...current, format }))} />
        <SelectField label="Priority" value={input.priority} options={["Low", "Medium", "High"]} onChange={(priority) => setInput((current) => ({ ...current, priority: priority as ContentIdea["priority"] }))} />
        <TextField label="Deadline" type="date" value={input.deadline} onChange={(deadline) => setInput((current) => ({ ...current, deadline }))} />
        <SelectField label="Status" value={input.status} options={statuses} onChange={(status) => setInput((current) => ({ ...current, status: status as MarketingStatus }))} />
        <TextField label="CTA" value={input.cta} onChange={(cta) => setInput((current) => ({ ...current, cta }))} />
        <label className="grid gap-2 text-sm font-medium lg:col-span-3">
          Notes
          <textarea
            className={`${fieldClass} min-h-24 py-3`}
            value={input.notes}
            onChange={(event) =>
              setInput((current) => ({ ...current, notes: event.target.value }))
            }
          />
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" disabled={disabled} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={disabled || !input.title.trim()}>
          {idea ? "Save idea" : "Create idea"}
        </Button>
      </div>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        type={type}
        className={fieldClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select
        className={fieldClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function AccountTag({
  account,
  className,
}: {
  account: MarketingAccountId;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold",
        accountStyles[account],
        className,
      )}
    >
      {accountLabels[account]}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold",
        roleStyles[role] ?? "border-[#b9a76a]/30 bg-[#fbf6df] text-[#77652a]",
      )}
    >
      {role}
    </span>
  );
}

function PriorityPill({ priority }: { priority: ContentIdea["priority"] }) {
  const tone =
    priority === "High" ? "warning" : priority === "Medium" ? "info" : "neutral";

  return <StatusPill tone={tone}>{priority}</StatusPill>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono text-lg font-semibold">{value}</dd>
    </div>
  );
}

function DefinitionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className="leading-6 text-foreground">{value}</dd>
    </div>
  );
}

function assetTone(status: AssetNeed["status"]) {
  if (status === "Ready") {
    return "success";
  }

  if (status === "Draft") {
    return "info";
  }

  return "warning";
}

function parseMetric(value: string) {
  const normalized = value.trim().toLowerCase();
  const multiplier = normalized.endsWith("k") ? 1000 : 1;
  return Number.parseFloat(normalized.replace("k", "")) * multiplier || 0;
}
