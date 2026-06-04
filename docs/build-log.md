# Build Log

This log records meaningful project decisions, implementation milestones, and
verification results. Add entries newest first. Keep entries concise and link
to more detailed documentation when needed. Use `dev-log.md` for the required
record of every completed development task.

## Entry Template

```text
## YYYY-MM-DD - Short title

### Scope
- What changed

### Decisions
- Important decisions and rationale

### Verification
- Checks performed and results

### Follow-ups
- Remaining work or open questions
```

## 2026-06-04 - Explicit Vercel framework preset

### Scope

- Added a root `vercel.json` that selects Vercel's Next.js framework preset.

### Decisions

- Keep the deployment framework contract in version control because Vercel
  project metadata reported no framework preset despite detecting Next.js
  during builds.

### Verification

- Confirmed local Next.js build output contains all expected application routes.
- Confirmed the current Vercel deployment builds successfully but is not served
  before application routing.

### Follow-ups

- Push the configuration, redeploy production, and verify the production domain.

## 2026-06-04 - Complete Phase 10 Studio Access

### Scope

- Added an admin-only Studio Access route for staff invitations, roles, and
  active/inactive account access.
- Added guarded database functions, audit events, direct-write revocation, and
  historical profile visibility for inactive members.

### Decisions

- Keep Studio Access outside primary MVP navigation and separate from CRM or
  employee-performance concepts.
- Give invitations a 14-day access window without adding email delivery.
- Serialize role changes and preserve at least one active admin.

### Verification

- Full-project ESLint, TypeScript, 44 tests, and the production build passed.
- Live migrations applied successfully.
- Rollback-only live testing passed admin invite/revoke, non-admin denial,
  direct-write denial, audit history, change history, self-deactivation denial,
  and last-admin denial.
- Anonymous execute privileges on the new guarded functions were removed and
  verified.

### Follow-ups

- Publish Phase 9 and Phase 10.
- Apply and live-test Phase 8 after Supabase repairs its managed Realtime
  schema.

## 2026-06-04 - Complete Phase 9 optional Pixel Office

### Scope

- Added a Home view toggle between the default accessible coworking status list
  and a lightweight Pixel Office visualization.
- Added isolated status-to-zone mapping, deterministic member placement, empty
  states, and text equivalents.

### Decisions

- Keep Pixel Office out of primary navigation and core workflows.
- Consume normalized `PresenceMember` records through the existing provider;
  do not add subscriptions, durable state, or attendance history.
- Keep the accessible status list as the default Home view.

### Verification

- Full-project ESLint, TypeScript, 41 tests, and the production build passed.
- Supabase private mode remains blocked by the missing managed `realtime`
  schema; Pixel Office degrades safely when presence is unavailable.
- Visual browser review could not run because the in-app browser connection was
  unavailable in the Windows sandbox.

### Follow-ups

- Complete visual browser review when a local or hosted preview is available.
- Apply and live-test Phase 8 authorization after Supabase repairs the managed
  Realtime schema.

## 2026-06-04 - Implement Phase 8 realtime presence client

### Scope

- Added an ephemeral workspace presence provider, pure normalization rules, and
  one accessible presence panel used by Home and Focus Room.
- Added a private organization-channel policy migration without adding a
  durable presence table.

### Decisions

- Keep the client private-channel only instead of weakening presence to a
  public channel when authorization is unavailable.
- Derive focus and break status from durable focus state, publish only
  meaningful transitions, mark inactivity away after ten minutes, and retain
  stale state for two minutes after connection loss.

### Verification

- ESLint, TypeScript, 38 tests, and the production build passed.
- Supabase confirmed the project is healthy but has not initialized the managed
  `realtime.messages` authorization surface; the policy migration correctly
  remains unapplied.

### Follow-ups

- Disable `Allow public access` in Supabase Realtime settings, then apply the
  Phase 8 policy migration and run two-user live presence tests.
- Begin Pixel Office only after private presence is live.

## 2026-06-04 - Complete Phase 7 internal Finance ledger

### Scope

- Replaced the Finance placeholder with monthly income, expense, and net
  summaries, a lightweight comparison, filters, manual entry forms, and ledger
  review.
- Added guarded finance transactions and historical category-name snapshots.

### Decisions

- Store amounts as exact positive minor units and derive currency from the
  organization.
- Allow creators to edit/archive their entries and admins to manage any
  organization entry.
- Keep monthly totals independent from narrower type/category ledger filters.
- Keep Finance separate from Studio XP.

### Verification

- ESLint, TypeScript, 32 tests, and production build passed.
- The live migration and rollback-only Finance workflow test passed create,
  update, type/category mismatch denial, unauthorized denial, archive
  idempotency, archived-entry protection, audit history, no-XP behavior, and
  clean rollback.
- Security and performance advisors were reviewed; Finance RPC notices are
  intentional and unused-index notices are expected on the low-volume project.

### Follow-ups

- Begin Phase 8 with realtime coworking presence.
- Publish the full public GitHub source so the connected Vercel project can
  produce a working hosted preview.

## 2026-06-03 - Complete Phase 6 shared Tasks

### Scope

- Added a Kanban-first shared Tasks workspace with list view, filters, shared
  create/edit controls, status transitions, and archive confirmation.
- Added guarded task transactions, category-name snapshots, immutable first
  completion, and atomic first-completion Studio XP.

### Decisions

- Keep status transitions accessible through labeled controls instead of making
  drag and drop a workflow dependency.
- Revoke direct task writes and route mutations through active-member
  authorizing database RPCs.
- Preserve `first_completed_at` across reopen and recompletion while
  `completed_at` represents the current done state.

### Verification

- ESLint, TypeScript, 27 tests, and production build passed.
- The live migration and rollback-only task workflow test passed create, edit,
  first completion, same-status retry, reopen, recompletion, archive,
  unauthorized denial, one-time XP, and audit-history assertions.
- Security and performance advisors were reviewed; task RPC notices are
  intentional and unused-index notices are expected on the low-volume project.

### Follow-ups

- Begin Phase 7 with the detailed Finance workflow.
- Complete visual browser QA when the local preview can remain running.

## 2026-06-03 - Complete Phase 5 shared Studio XP

### Scope

- Added a detailed shared Studio XP drill-down, live app-shell progress, and an
  attributed organization activity feed.
- Added admin-only signed corrections and shared level-up results.
- Kept Studio XP out of primary MVP navigation and removed the hard-coded shell
  level.

### Decisions

- Preserve the append-only ledger as the only Studio XP source of truth.
- Require admin correction reasons, idempotent retry keys, serialized XP
  mutations, and protection against totals below zero.
- Return previous/new levels from corrections and full Pomodoro awards.
- Defer task-completion XP until the Tasks workflow can award it atomically.

### Verification

- ESLint, TypeScript, 22 tests, and production build passed.
- Rollback-only live tests passed correction idempotency, staff denial,
  below-zero protection, correction level transitions, full-Pomodoro level-up
  results, and clean rollback.
- Live migration and advisor checks completed; authenticated security-definer
  RPC warnings are intentional and empty-table unused-index notices are
  expected.

### Follow-ups

- Begin Phase 6 with the detailed Tasks workflow and atomic first-completion XP.
- Complete visual browser QA when the local preview can remain running.

## 2026-06-03 - Add crash-monitoring foundation

### Scope

- Added structured server and browser incident reporting, global/workspace
  recovery boundaries, and lightweight authenticated incident references.
- Documented monitoring redaction and retention rules.

### Decisions

- Keep full messages and stacks in runtime logs, not the CCAD application
  database.
- Store only incident correlation fields with admin-only reads.
- Keep the monitoring-provider boundary vendor-neutral until Vercel exists.

### Verification

- Automated observability tests and production build passed.
- A rollback-only live incident test passed idempotent recording and
  append-only change-history capture.

### Follow-ups

- Connect a dedicated monitoring service or Vercel Log Drain before public
  launch.
- Add an admin incident viewer only if operational use justifies it.

## 2026-06-03 - Complete Phase 4 persisted Focus Room

### Scope

- Added persisted Pomodoro, break, and freeform focus sessions.
- Added shared category management, task-linked focus details, and previous-work
  continuation.
- Added durable category-name snapshots so later category renames do not rewrite
  focus history.
- Added atomic, idempotent Studio XP awards for full Pomodoro focus intervals.

### Decisions

- Use server timestamps and owner-authorizing database RPCs for timer state.
- Allow active focus details to be revised; break sessions omit work details.
- Record early Pomodoro completion without XP and auto-complete at zero without
  auto-starting another timer.
- Offer one completed long break per four-full-Pomodoro milestone.

### Verification

- ESLint, TypeScript, 17 tests, and production build passed.
- Live Supabase has the Phase 4 migrations, RLS, six focus RPCs, two
  audit/update triggers, durable category snapshots, and six approved
  categories.
- A rollback-only live RPC smoke test passed start, pause, resume, active detail
  update, freeform completion without XP, full-Pomodoro XP, and duplicate
  completion idempotency.
- Supabase advisor warnings for authenticated security-definer focus RPCs are
  intentional and reviewed; unused-index notices are expected on empty tables.

### Follow-ups

- Add detailed Studio XP workflows in Phase 5.
- Add offline mutation reconciliation in a later reliability pass.
- Complete visual browser QA when the local preview can remain running.

## 2026-06-03 - Complete Phase 3 durable Home dashboard

### Scope

- Replaced Home mock data with organization-scoped Supabase summaries.
- Added durable task, Studio XP, finance category, and finance entry
  foundations.
- Added William and Alice as pending admins and tightened first-sign-in
  allowlisting.

### Decisions

- Preserve the existing `DashboardQuery` boundary while replacing only its
  infrastructure adapter.
- Keep dashboard mapping pure and separate from Supabase reads.
- Show presence as unavailable until realtime is real instead of displaying
  hard-coded online users.
- Allow first magic-link requests to create Auth users only when a valid
  database invitation exists.

### Verification

- ESLint, TypeScript, eight tests, and production build passed.
- Live HTTP checks confirmed workspace redirects and invite-only login content.
- All 11 public tables have RLS and expected policies.
- Supabase security advisor reported no findings; foreign-key index findings
  were resolved.

### Follow-ups

- William and Alice can request their first magic links from `/login`.
- Configure hosted Auth redirect URLs before deployment.
- Begin Phase 4 Focus Room timer and persisted focus sessions.

## 2026-06-03 - Complete Phase 2 authentication and database foundation

### Scope

- Connected the app to Supabase Auth using invite-only email magic links.
- Protected workspace routes with active organization-membership checks.
- Applied the initial organization, membership, invitation, category, audit,
  and change-history schema with RLS.

### Decisions

- Keep privileged Auth invitations outside browser code; app login never creates
  public accounts.
- Use private security-definer helpers for reusable non-recursive RLS checks.
- Capture durable changes with database triggers, including direct database
  operations.
- Add covering foreign-key indexes before feature data grows.

### Verification

- Lint, TypeScript, four tests, and production build passed.
- Unauthenticated workspace routes redirect to `/login`; public auth routes
  return successfully.
- All seven public tables have RLS and expected policies.
- Supabase security advisor reported no findings.

### Follow-ups

- Provision William and Alice as admins after receiving their email addresses.
- Configure hosted Auth redirect URLs before deployment.
- Begin Phase 3 Home dashboard data contracts and initial durable summaries.

## 2026-06-03 - Complete Phase 1 application foundation

### Scope

- Scaffolded Next.js App Router, TypeScript, Tailwind CSS, and shadcn-compatible
  shared UI primitives.
- Added a responsive app shell and all four MVP routes.
- Added centralized navigation, semantic design tokens, and placeholder-driven
  layouts.
- Added a typed Home dashboard contract with a replaceable mock adapter.
- Added linting, TypeScript, Vitest, and production build configuration.

### Decisions

- Use feature-first ownership with inward-pointing domain and application
  dependencies.
- Keep Home UI dependent on a `DashboardQuery` interface so Supabase can replace
  mock data without a page rewrite.
- Use the initial neutral dark visual system until final branding is confirmed.
- Treat route content as foundation previews; no feature behavior or Supabase
  data access was added in Phase 1.

### Verification

- ESLint passed with no warnings.
- TypeScript passed with no errors.
- Four Vitest tests passed.
- Next.js production build passed and statically generated all four MVP routes.
- Live HTTP checks returned `200` and expected content for every MVP route.

### Follow-ups

- Begin Phase 2 authentication and database foundation.
- Confirm visual direction, theme support, and future staff finance visibility.

## 2026-06-03 - Create placeholder vector assets

### Scope

- Added six lightweight SVG placeholders for early CCAD HQ layouts.
- Added asset replacement, naming, and format guidance.

### Decisions

- Placeholder visuals use editable SVG with neutral dark-mode-friendly fallback
  colors and `--ccad-*` CSS variables.
- Placeholder assets remain isolated in `public/placeholders/`.
- No raster files or external image dependencies were introduced.

### Verification

- Parsed every SVG as valid XML.
- Confirmed every SVG includes a view box, title, and description.
- Confirmed placeholder files contain no scripts, embedded raster images, or
  external links.

### Follow-ups

- Replace placeholders as the final visual system and artwork are established.

## 2026-06-03 - Create dedicated Supabase project

### Scope

- Created the dedicated `CCAD HQ` Supabase project.
- Recorded its non-secret project reference and Canadian region.

### Decisions

- Project organization: `y10wyatt's Org`
- Project reference: `nhxwyybrfeflekliookp`
- Region: `ca-central-1`
- Reported cost: `$0` monthly
- Vercel project creation remains deferred until the application is ready for
  its first deployment.

### Verification

- Supabase reported the new project status as `ACTIVE_HEALTHY`.

### Follow-ups

- Scaffold the application and prepare the initial database migration.
- Confirm visual direction, theme support, and future staff finance visibility.

## 2026-06-03 - Confirm shared work organization

### Scope

- Unified task and focus categories into shared work categories.
- Added optional task linking and previous-work continuation to Focus Room.
- Confirmed Kanban and list/table as the MVP Tasks views.
- Approved creation of a dedicated CCAD HQ Supabase project.

### Decisions

- Tasks and recorded focus work use the same editable shared categories.
- Linking a focus session to a task prefills work details while preserving a
  historical snapshot on the session.
- Continuing previous work starts a new session and leaves prior history
  unchanged.
- Tasks ship with Kanban as primary and list/table as the alternate view.

### Verification

- Updated product, schema, architecture, and UI documentation consistently.
- Confirmed the connected Supabase account has one organization:
  `y10wyatt's Org`.

### Follow-ups

- Confirm visual direction, theme support, and future staff finance visibility.

## 2026-06-03 - Confirm initial experience direction

### Scope

- Defined required metadata and editable shared categories for recorded focus
  work.
- Confirmed Pomodoro sequencing and optional completion notifications.
- Confirmed Kanban as the primary Tasks view with alternate views.
- Clarified Home as an at-a-glance summary with drill-down navigation.

### Decisions

- Every Pomodoro or freeform focus session requires a work name, description,
  and category.
- Active users can add, rename, and archive shared work categories.
- Long breaks are offered after four completed Pomodoro focus intervals.
- Timers never auto-start.
- Staff can edit and archive tasks created by others.
- Focus-session history is retained indefinitely for MVP.
- Full finance change history is admin-only.
- Deactivated members remain as inactive historical attribution.
- A database-history viewer is preserved as a future capability but is not an
  MVP screen.

### Verification

- Updated product, schema, UI, and overview documentation consistently.
- Confirmed Supabase and Vercel MCP connectors are available.

### Follow-ups

- Confirm whether to create a dedicated CCAD HQ Supabase project.
- Confirm visual direction, theme support, and future staff finance visibility.

## 2026-06-03 - Confirm MVP defaults and durable history

### Scope

- Confirmed organization settings, authentication defaults, initial admins,
  fixed Pomodoro intervals, finance permissions and categories, and fixed XP
  awards.
- Added freeform stopwatch-style focus sessions that record elapsed time.
- Added append-only database-triggered change history for all durable
  application data.

### Decisions

- Organization timezone is `America/Vancouver`; ledger currency is `CAD`.
- Accounts are invite-only with email magic-link login.
- William and Alice are initial admins.
- A member may have one active timer of any kind across all devices.
- Freeform focus sessions record time but do not award XP in MVP.
- Server state wins when conflicting device updates are reconciled.
- Database triggers capture every durable application-data change, including
  append-only ledger inserts, even when changes do not pass through the app UI.

### Verification

- Reviewed product, architecture, schema, realtime, XP, and UI documentation for
  consistency.

### Follow-ups


## 2026-06-03 - Documentation foundation

### Scope

- Established the product specification and explicit MVP boundaries.
- Defined a feature-based modular architecture using Next.js, TypeScript,
  Tailwind CSS, shadcn/ui, Supabase, Supabase Realtime, and Vercel.
- Defined the initial organization-scoped database model and RLS intent.
- Defined ephemeral realtime presence behavior and privacy boundaries.
- Defined the shared Studio XP model, initial awards, and idempotency rules.
- Defined revision-friendly UI and accessibility guidelines.
- Added repository guidance for future implementation work.

### Decisions

- The organization is the character; no individual XP, levels, or leaderboards.
- MVP primary navigation is Home, Focus Room, Tasks, and Finance.
- Build priority is Home, Focus Room, XP, Tasks, Finance, realtime presence,
  then Pixel Office.
- Realtime presence is optional and ephemeral.
- Pixel Office is an isolated visualization over the presence contract.
- XP is an append-only ledger and awards are idempotent.
- Finance is a manual internal ledger and does not award XP.
- All durable business records are organization-scoped.
- UI is composed from centralized tokens, shared primitives, stable view models,
  and replaceable feature sections.

### Verification

- Confirmed all requested documentation files were created.
- Confirmed no application code was added.
- Reviewed documentation for product, architecture, schema, realtime, XP, and
  UI consistency.

### Follow-ups

- Review and approve documentation before beginning application implementation.
