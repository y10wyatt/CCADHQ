# System Architecture

## 1. Architecture Goals

The architecture should make CCAD HQ easy to change as studio workflows evolve.
Business rules must remain testable without React, Supabase, or realtime
connections, and visual redesigns must not require rewriting domain behavior.

Primary quality goals:

- Clear feature ownership
- SOLID boundaries and dependency inversion
- Secure organization-scoped data access
- Replaceable UI composition
- Graceful degradation when realtime is unavailable
- Simple deployment and operations

## 2. Technology Responsibilities

| Technology | Responsibility |
| --- | --- |
| Next.js | Routing, server rendering, server actions or route handlers |
| TypeScript | Shared contracts and static safety |
| Tailwind CSS | Token-driven styling and responsive layout |
| shadcn/ui | Accessible, editable UI primitives |
| Supabase Auth | Staff authentication |
| Supabase Postgres | Durable product data and transactional rules |
| Supabase Realtime | Ephemeral presence and selected data updates |
| Vercel | Web deployment, previews, and environment configuration |

## 3. Recommended Module Structure

When application implementation begins, organize by feature rather than by
technical file type.

```text
app/
  (authenticated)/
    home/
    focus-room/
    tasks/
    finance/
features/
  dashboard/
  focus/
  xp/
  tasks/
  finance/
  presence/
  pixel-office/
shared/
  auth/
  database/
  ui/
  validation/
  observability/
```

Each feature should expose a small public API and keep internal details private.
A feature may contain:

- `domain`: entities, value objects, and pure business rules
- `application`: use cases and service interfaces
- `infrastructure`: Supabase repositories and external adapters
- `ui`: replaceable React components and view models

This is a boundary model, not a requirement to create empty folders. Add layers
only when the feature needs them.

## 4. Dependency Rules

Dependencies point inward:

```text
UI -> application use cases -> domain rules
infrastructure adapters -> application interfaces
```

- Domain logic must not import React, Next.js, Supabase clients, or browser APIs.
- UI components request behavior through use cases or feature services.
- Supabase repositories implement interfaces owned by the application layer.
- Cross-feature access goes through public contracts, not another feature's
  private files.
- Shared code contains genuinely cross-cutting behavior, not miscellaneous
  helpers.

Examples:

- Focus completion requests an XP award through an `XpAwarder` interface.
- Tasks request XP through the same interface without knowing XP ledger storage.
- Focus and Tasks consume a shared work-category contract without importing each
  other's private implementation.
- Pixel office reads a `PresenceMember` view model and does not subscribe to
  Supabase directly.

## 5. Request And Data Flow

### Read flow

1. A route or page requests a feature query.
2. The query reads organization-scoped data through a repository.
3. Server-side code maps records into a stable view model.
4. Replaceable UI sections render the view model.

### Mutation flow

1. UI submits validated intent.
2. A server-side use case authorizes the acting member.
3. The use case applies domain rules and calls repositories.
4. Database transaction or function persists related records atomically.
5. The client receives a result and refreshes affected views.

Critical operations such as "complete focus session and award XP" should be one
atomic database operation with an idempotency key.

Durable application tables use database triggers to write append-only change
history. This provides a backstop for changes made through application use
cases, administrative tools, or direct database operations.

## 6. Server And Client Boundaries

Prefer server-rendered reads and server-side mutations.

Use client components only for:

- Interactive timer controls
- Realtime subscriptions
- Rich filters or dialogs requiring local interaction
- Pixel-office rendering

Never expose privileged Supabase credentials in the browser. Client database
access must use the anonymous key and remain protected by Row Level Security.
Admin operations must validate authorization server-side.

## 7. Authentication And Authorization

- Supabase Auth identifies a user.
- `organization_members` maps the auth user to CCAD and its role.
- Accounts are invite-only and use email magic links.
- William and Alice are the initial organization admins.
- Authenticated users without an active membership are denied product access.
- Deactivated members remain available as inactive historical attribution.
- Every durable business table includes `organization_id`.
- Row Level Security checks active membership for reads and writes.
- Role checks protect admin-only operations.
- Database functions that bypass normal policies must be minimal, reviewed, and
  explicitly scoped.

## 8. Realtime Architecture

Presence uses Supabase Realtime Presence channels and is ephemeral. Durable
records such as tasks and finance entries remain in Postgres.

Feature code consumes a presence abstraction:

```text
PresenceProvider -> normalized presence store -> Home / Focus Room / Pixel Office
```

If realtime disconnects, screens show the last-known state as stale and core
workflows continue. See `realtime-presence.md`.

## 9. UI Architecture

Screens should be composed from sections with stable view-model contracts:

```text
Page shell
  -> page header
  -> section grid
  -> feature cards
  -> shared primitives
```

Keep navigation, spacing, color, typography, radii, and motion in centralized
tokens. Avoid page-specific hard-coded styling where a semantic token or
component variant is appropriate. See `ui-guidelines.md`.

## 10. Validation And Error Handling

- Validate all external input at the server boundary.
- Return typed, user-safe errors from use cases.
- Log diagnostic context without exposing secrets or sensitive finance notes.
- Distinguish validation, authorization, conflict, unavailable, and unexpected
  failures.
- Provide a retry path for recoverable failures.

## 11. Testing Strategy

| Test type | Purpose |
| --- | --- |
| Domain unit tests | XP math, timer state transitions, task lifecycle |
| Application tests | Use cases, permissions, idempotency, repository contracts |
| Database tests | Constraints, functions, triggers, and RLS policies |
| Component tests | Important visual states and interactions |
| End-to-end tests | Sign-in and critical workflows across tabs |

Highest-risk tests:

- Focus completion awards XP exactly once.
- Task completion awards XP exactly once.
- Users cannot access data outside their organization.
- Finance totals and archived-record behavior are correct.
- Realtime loss does not break the focus timer.

## 12. Deployment And Environments

Use separate Supabase projects or isolated branches for development, preview,
and production where practical.

Required environment classes:

- Local development
- Vercel preview
- Production

Current infrastructure:

- Dedicated Supabase project: `CCAD HQ`
- Supabase project reference: `nhxwyybrfeflekliookp`
- Supabase region: `ca-central-1`
- The `ccadhq` Vercel project is connected to the public GitHub repository;
  publishing the full source remains required before the first working hosted
  preview.

Database changes must be migrations committed with the relevant feature.
Preview deployments must never point at the production database by default.

## 13. Observability

At minimum, record:

- Unexpected server errors with correlation context
- Failed critical mutations
- XP award conflicts or duplicate attempts
- Realtime connection health at aggregate level

Do not turn presence or focus events into employee surveillance analytics.

Observability logs and database change history serve different purposes.
Operational logs diagnose system behavior; append-only database history records
who changed durable application data, what changed, and when.

## 14. Architecture Decisions

Initial decisions:

- Feature-based modular architecture
- Organization-scoped data model from day one
- Shared append-only XP ledger
- Realtime presence is ephemeral and non-critical
- Pixel office is an isolated consumer of presence
- Finance is a manual operational ledger, not accounting software
- Freeform focus sessions record elapsed time without awarding XP
- Database-triggered append-only change history covers all durable application
  data
- Full finance history is admin-only, and a database-history viewer is deferred
  beyond MVP

Record material changes and rationale in `build-log.md`.

## 15. Phase 1 Implementation

The initial implementation follows the documented feature boundaries:

- `app/(app)/` owns routes and page composition for the four MVP tabs.
- `features/dashboard/` contains the first domain contract, query interface,
  mock infrastructure adapter, and Home UI.
- `shared/config/` owns centralized navigation.
- `shared/ui/` owns editable shadcn-compatible UI primitives and the responsive
  app shell.
- `shared/lib/` owns genuinely cross-cutting utilities.

The Home dashboard depends on `DashboardQuery`, not its mock implementation.
Later Supabase-backed data access should implement that application interface
without rewriting the dashboard UI contract.

## 16. Phase 2 Implementation

Phase 2 connects the app shell to the dedicated Supabase project:

- `shared/database/supabase/` owns browser, server, and proxy client creation.
- `features/auth/` owns current-member contracts, protected membership lookup,
  magic-link requests, and sign-out.
- `proxy.ts` refreshes Supabase sessions and redirects unauthenticated workspace
  requests to `/login`.
- The protected app layout requires an active organization membership before
  rendering any workspace route.
- Initial migrations create organization, profile, membership, invitation,
  shared category, audit event, and change-history tables.
- Private security-definer membership helpers avoid recursive RLS policies.
- Database triggers create profiles from invited auth users and record every
  durable foundation-table mutation in append-only change history.

The app uses only the public Supabase URL and publishable key. New-user
creation is restricted by the pending-invitation check inside the Auth-user
database trigger; no service key is exposed to client code.

## 17. Phase 3 Implementation

Phase 3 replaces Home mock data with durable organization-scoped summaries:

- `SupabaseDashboardQuery` implements the existing `DashboardQuery` contract
  without changing Home UI ownership.
- A pure dashboard mapper owns currency, timezone, greeting, XP-level, and
  empty-state presentation rules.
- Home reads bounded task counts, current-month finance entries, total Studio
  XP, and five recent XP events.
- Realtime presence is represented honestly as unavailable until its dedicated
  phase; no hard-coded online staff appear on Home.
- Workspace loading and error boundaries cover slow or unavailable data.
- Tasks, XP events, finance categories, and finance entries now exist as
  RLS-protected durable foundations for later detailed workflows.

Initial admin onboarding uses database invitations as the allowlist. Magic-link
requests may create an Auth user, but the Auth trigger rejects any email without
a valid pending organization invitation. This keeps first sign-in self-service
without enabling public signup.

## 18. Phase 4 Implementation

Phase 4 adds a persisted Focus Room behind a focused feature boundary:

- `features/focus/domain/` owns timer display and long-break sequence rules.
- `features/focus/application/` owns server-side view-model loading and
  validated mutations.
- `features/focus/ui/` owns the replaceable Focus Room presentation.
- Server timestamps, not browser counters, remain the durable timer source of
  truth.
- Authenticated, owner-authorizing database RPCs serialize timer transitions
  and atomically award idempotent Studio XP for full Pomodoro focus sessions.
- Focus records snapshot the selected category name so shared-category renames
  do not rewrite historical work meaning.
- Direct focus-session mutations are revoked; RLS permits organization members
  to read session history.
- Realtime presence remains an explicitly unavailable optional panel until its
  dedicated phase.

The Supabase security advisor flags authenticated `security definer` focus
RPCs because they are exposed through the API. This exposure is intentional:
each RPC verifies active membership and session ownership, uses an empty
`search_path`, and exists to keep protected multi-record transitions atomic.

## 19. Error-Monitoring Implementation

- Root and workspace error boundaries provide recovery actions and report
  authenticated browser incidents.
- `instrumentation.ts` emits structured server incidents for deployment runtime
  logs.
- Client instrumentation reports uncaught browser errors and rejected promises.
- `application_incidents` stores only lightweight correlation references; full
  messages and stack traces never enter the application database.
- A future monitoring provider or Vercel Log Drain can replace the current
  runtime-log destination without changing feature code.

Redaction and retention rules are defined in `error-monitoring.md`.

## 20. Phase 5 Implementation

Phase 5 adds a detailed shared Studio XP workflow:

- `features/studio-xp/domain/` owns organization-level progress and activity
  view models.
- `features/studio-xp/application/` owns Supabase queries and validated
  admin-correction actions.
- `features/studio-xp/ui/` owns the replaceable detailed progression screen.
- `/studio-xp` is a drill-down route linked from Home and the app shell, not a
  primary MVP navigation tab.
- Admin corrections and Pomodoro awards return previous/new shared levels.
- The app shell reads live Studio XP instead of showing a hard-coded level.

## 21. Phase 6 Implementation

Phase 6 adds detailed shared Tasks behind a modular feature boundary:

- `features/tasks/domain/` owns task view models, statuses, and due-state rules.
- `features/tasks/application/` owns organization-scoped loading and validated
  task actions.
- `features/tasks/ui/` owns the replaceable Kanban-first and list presentation.
- Guarded database RPCs own task writes; direct authenticated table writes are
  revoked.
- First completion and the one-time 20 Studio XP award occur atomically.
- Reopening clears the current completion time while retaining the immutable
  first completion time and previously earned XP.
- Category names are snapshotted so later shared-category renames do not rewrite
  task history.

## 22. Phase 7 Implementation

Phase 7 adds the detailed internal Finance ledger:

- `features/finance/domain/` owns exact minor-unit parsing, month/date rules,
  summaries, and currency presentation.
- `features/finance/application/` owns organization-scoped loading and
  validated finance actions.
- `features/finance/ui/` owns replaceable monthly summary, comparison, filters,
  entry form, and ledger table sections.
- Guarded database RPCs own finance writes; direct authenticated table writes
  are revoked.
- Entry creators can edit or archive their records, while admins can manage any
  organization entry.
- Finance category names are snapshotted and Finance activity never awards XP.

## 23. Phase 8 Realtime Presence Implementation

Phase 8 adds an ephemeral coworking-presence feature boundary:

- `features/presence/domain/` owns status derivation, route-location mapping,
  payload validation, and multi-client member normalization.
- `features/presence/application/` reads only the current member's active focus
  state needed to derive presence.
- `features/presence/ui/` owns the workspace provider and replaceable accessible
  presence panel consumed by Home and Focus Room.
- The provider subscribes once per workspace to
  `org:{organization_id}:presence`, updates only on meaningful state changes,
  and removes the channel on exit.
- Realtime failures become connecting, stale, or unavailable UI states and
  never block durable workflows.
- Presence has no durable table and never enters database change history.

The client is configured for private channels. Final activation is pending
private-only Realtime project configuration and application of the
organization-member policies in the Phase 8 migration after Supabase
initializes its managed `realtime.messages` authorization surface.
