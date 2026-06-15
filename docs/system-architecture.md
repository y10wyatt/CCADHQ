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
  character-xp/
  studio-stats/
  tasks/
  handoffs/
  weekly-quests/
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
- Character XP awards use the same application boundary but write to a separate
  non-ranking individual ledger.
- Tasks and weekly quests request studio-stat contribution mapping through a
  studio-progress contract, not through presentation components.
- Handoffs own ownership-transfer rules and may request XP after a completed
  handoff.
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
- Accounts are invite-only and use email/password credentials.
- Account confirmation and password recovery use time-limited email links.
- Auth email callbacks resolve from the explicit app URL first, then trusted
  forwarded request headers, and finally local development.
- Supabase Auth URL Configuration must use the production app as Site URL and
  allow the exact production `/auth/confirm` callback.
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
- Studio XP / Studio Level remain the primary progression surface.
- Character XP is a separate lightweight progression feature and must not
  produce rankings or productivity scores.
- Studio stats classify contribution types without becoming staff ratings.
- Handoffs reduce ownership ambiguity and stay separate from chat or CRM.
- Weekly quests create shared direction without ranking staff.
- Realtime presence is ephemeral and non-critical
- Pixel office is an isolated consumer of presence
- Finance is a manual operational ledger, not accounting software
- Freeform focus sessions record elapsed time without awarding XP
- Database-triggered append-only change history covers all durable application
  data
- Full finance history is admin-only, and a database-history viewer is deferred
  beyond MVP

Record material changes and rationale in `build-log.md`.

## 15. Studio Progression Direction

Future progression work should keep the current Studio XP feature as the
implemented foundation for organization-level progression. The architecture
should add Character XP and Weekly Quests deliberately rather than introducing a
competing shared XP system.

Recommended boundaries:

- `features/xp/` continues to own shared ledger math, idempotency, corrections,
  and Studio Level calculations.
- `features/character-xp/` owns individual character events, level calculation,
  and user-card display models.
- `features/studio-stats/` owns Stability, Reputation, Creativity, and
  Community contribution rules.
- `features/weekly-quests/` owns quest lifecycle and completion rules.
- `features/handoffs/` owns lightweight ownership-transfer state.

React components should receive already-computed Studio Level, Character Level,
quest, handoff, and studio-stat view models. They should not decide award
eligibility or calculate progression.

## 16. Phase 1 Implementation

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

## 17. Phase 2 Implementation

Phase 2 connects the app shell to the dedicated Supabase project:

- `shared/database/supabase/` owns browser, server, and proxy client creation.
- `features/auth/` owns current-member contracts, protected membership lookup,
  password sign-in, invited account creation, recovery, and sign-out.
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

## 18. Phase 3 Implementation

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

Initial admin onboarding uses database invitations as the allowlist. Invited
account creation may create an Auth user, but the Auth trigger rejects any email
without a valid pending organization invitation. Password recovery is available
for existing accounts without weakening the invitation gate. This keeps first
sign-in self-service without enabling unrestricted public signup.

## 19. Phase 4 Implementation

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

## 20. Error-Monitoring Implementation

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

## 21. Phase 5 Implementation

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

## 22. Phase 6 Implementation

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

## 23. Phase 7 Implementation

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

## 24. Phase 8 Realtime Presence Implementation

Phase 8 adds an ephemeral coworking-presence feature boundary:

- `features/presence/domain/` owns status derivation, route-location mapping,
  payload validation, and multi-client member normalization.
- `features/presence/application/` reads only the current member's active focus
  state needed to derive presence.
- `features/presence/ui/` owns the workspace provider and replaceable accessible
  presence panel consumed by Focus Room and Studio XP.
- The provider subscribes once per workspace to
  `org:{organization_id}:presence`, updates only on meaningful state changes,
  and removes the channel on exit.
- Realtime failures become connecting, stale, or unavailable UI states and
  never block durable workflows.
- Presence has no durable table and never enters database change history.

The client is configured for private channels. Private-only Realtime is enabled
and the organization-member policies from the Phase 8 migration are applied to
Supabase's managed `realtime.messages` authorization surface.

## 25. Phase 9 Pixel Office Implementation

Phase 9 adds an optional visualization boundary over normalized presence:

- `features/pixel-office/domain/` owns status-to-zone mapping and deterministic
  room placement.
- `features/pixel-office/ui/` owns the room background, occupant rendering,
  empty states, and text equivalents.
- `features/presence/ui/presence-workspace.tsx` owns the view toggle between the
  default accessible status list and Pixel Office.
- Pixel Office receives `PresenceMember` view models through the existing
  provider and never creates a Supabase client or subscription.
- Clicked Pixel Office coordinates are ephemeral presence fields, broadcast only
  while the member is online and not stored in application tables.
- No Pixel Office state is durable, audited, or used for attendance.
- The feature can be removed or redesigned without changing presence, Focus,
  Tasks, Finance, XP, or navigation contracts.

Live room occupants now depend on the private presence provider and should be
verified with two signed-in staff accounts. The visualization still degrades to
a quiet unavailable state if Realtime disconnects or authorization fails.

## 26. Phase 10 Studio Access Implementation

Phase 10 adds a small admin-only access-management boundary:

- `features/studio-access/domain/` owns access view models and effective
  invitation-status presentation.
- `features/studio-access/application/` owns admin authorization,
  organization-scoped loading, validation, and guarded RPC calls.
- `features/studio-access/ui/` owns replaceable invitation, member, and history
  sections.
- `/studio-access` is linked from the admin account area, never primary MVP
  navigation.
- Database RPCs own invitation, role, and activation writes; direct
  authenticated writes are revoked.
- Member access changes serialize last-admin checks, reject self-deactivation,
  append audit events, and retain change history.
- Active organization members may still read inactive member profiles so
  historical attribution remains useful.

## 27. Character XP And Weekly Quests Implementation

- `features/character-xp/domain/` owns Character XP member summaries and level
  calculation inputs.
- `features/weekly-quests/domain/` owns quest view models, studio stat labels,
  reward labels, and progress formatting.
- `features/weekly-quests/application/` owns Supabase-backed quest loading and
  validated server actions.
- `features/weekly-quests/ui/` owns the reusable editable quest panel consumed
  by Home and Tasks.
- `features/dashboard/` composes active member, Character XP, Studio XP,
  finance, task, and Weekly Quest data without owning quest or Character XP
  rules.
- `shared/domain/xp-progress.ts` owns the shared XP level curve used by Studio
  XP and Character XP.
- Database RPCs keep Character XP awards idempotent and source-backed alongside
  the existing Studio XP ledger.

## 28. Students, Marketing, And Studio Notes Implementation

Phase 28 adds the first scoped CCAD operating-system surfaces beyond Tasks and
Finance:

- `features/students/domain/` owns student and class-log view models, enums, and
  display lists.
- `features/students/application/` owns organization-scoped student loading and
  validated server actions for student and class-log writes.
- `features/students/ui/` owns the card workspace and student detail workspace.
- `features/marketing/domain/` owns account identity, lane, calendar,
  performance, asset, and idea view models.
- `features/marketing/application/` owns organization-scoped idea loading and
  validated server actions for content-idea writes.
- `features/marketing/ui/` owns the planning dashboard and editable idea
  pipeline.
- `features/studio-notes/application/` owns organization-scoped note loading and
  validated server actions for note writes.
- `features/studio-notes/ui/` owns the reusable Home note wall, note cards, and
  note form behavior.
- The Dashboard composes Studio Notes as a Home section but does not own note
  persistence rules.
- The database migration creates organization-scoped tables for students, class
  logs, marketing ideas, and studio notes with RLS and change-history triggers.

This phase intentionally keeps Marketing account identity and performance
learning as structured planning data while making the idea pipeline durable.
Class-log photos and marketing files are represented by lightweight URL/local
preview hooks until a Supabase Storage feature boundary is added.
