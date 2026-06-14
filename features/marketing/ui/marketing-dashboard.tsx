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
import { Card } from "@/shared/ui/card";
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
  return (
    <Card>
      <SectionHeading
        title="Idea pipeline"
        description="Static sample cards for now; the columns match the future workflow states."
      />
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
                    <IdeaCard key={idea.title} idea={idea} />
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
    <Card>
      <SectionHeading
        title="Winning topics"
        description="Patterns worth repeating across the next content cycle."
      />
      <div className="mt-5 grid gap-3">
        {topics.map((topic) => (
          <article
            key={topic.topic}
            className="rounded-lg border border-border bg-background/70 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold">{topic.topic}</h3>
              <AccountTag account={topic.account} />
            </div>
            <p className="mt-3 text-sm font-medium">{topic.result}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {topic.repeat}
            </p>
          </article>
        ))}
      </div>
    </Card>
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
    </Card>
  );
}

function IdeaCard({ idea }: { idea: ContentIdea }) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold leading-5">{idea.title}</h4>
        <PriorityPill priority={idea.priority} />
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
      </dl>
    </article>
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
