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

## 2026-06-15 - Add Resources link library

### Scope

- Added a Resources tab for frequently used Google Docs, folders, meeting notes,
  and internal reference links.
- Added Resources create, edit, archive, pin, search, and category filtering.
- Added a Supabase migration for the `resources` table with organization-member
  RLS and change-history triggers.
- Improved missing-migration messaging for Studio Notes writes.

### Decisions

- Resources are a lightweight studio reference shelf, not a document manager.
- Pinned resources sort first and links open in a new browser tab.
- The page degrades to an empty state until the Supabase migration is applied.

### Verification

- Pending at implementation time.

### Follow-ups

- Apply the Resources migration and the earlier Students/Marketing/Studio Notes
  migration in Supabase before relying on persistence in production.

## 2026-06-15 - Add Students, Marketing Ideas, and Studio Notes persistence

### Scope

- Added a Students workspace with student cards, create/edit/archive flows, and
  student detail pages.
- Added class logs for each student with create, edit, and delete behavior.
- Connected Studio Notes on Home to Supabase-backed create/edit/delete/pin
  actions and seeded the starter sticky notes.
- Connected the Marketing idea pipeline to Supabase-backed create/edit/archive
  actions while keeping the account identity board and planning reference data.
- Added shared lightweight table, upload, chart, and skeleton UI helpers used by
  the dashboard surfaces.

### Decisions

- Students, class logs, marketing ideas, and studio notes are organization
  scoped and protected with organization-member RLS policies.
- Studio Notes are casual internal messages, not task records; pinned notes sort
  first and important notes get stronger visual treatment.
- Marketing performance, account identity, and planning sections remain
  structured dashboard reference data until a broader content system is needed.

### Verification

- TypeScript passed.
- ESLint passed.
- Vitest passed: 15 files, 55 tests.
- Production build passed. Next.js still warns about multiple lockfiles.

### Follow-ups

- Apply `20260614090000_students_marketing_notes.sql` to Supabase before using
  these persistent workflows in production.
- Add Supabase Storage later for class-log photos and marketing asset files.

## 2026-06-06 - Refine Finance, Tasks, Home, and Presence surfaces

### Scope

- Added a recurrence marker to finance entries and exposed it in the form and
  ledger table.
- Split completed tasks into a separate collapsible section.
- Added actor context and show/hide behavior to Home recent activity.
- Removed the duplicate Home Pixel Office/static presence surfaces and exposed
  the presence workspace in Studio XP and Focus Room.

### Decisions

- Recurring finance entries are labels only for now; the app does not generate
  future ledger rows automatically.
- Completed tasks default out of the main task board/list to keep active work
  easier to scan.
- Pixel Office remains optional and attached to presence-focused contexts rather
  than duplicated on Home.

### Verification

- TypeScript passed.
- ESLint passed.
- Vitest passed: 15 files, 55 tests.

## 2026-06-06 - Brighten CCAD HQ interface theme

### Scope

- Shifted the shared theme from dark navy to a light studio palette.
- Updated shared card, button, status-pill, shell, and Home metric styling.
- Added soft pastel variety to dashboard metric cards while keeping existing
  layouts and workflows intact.

### Decisions

- Used shared design tokens for the main color change so feature screens inherit
  the brighter treatment consistently.
- Kept the palette multi-color and restrained: blue action color, teal success,
  amber warning, coral danger, and light neutral surfaces.

### Verification

- TypeScript passed.
- ESLint passed.
- Vitest passed: 15 files, 55 tests.
- Production build passed. Next.js still warns about multiple lockfiles.

## 2026-06-06 - Add interactive Pixel Office placement

### Scope

- Added optional live Pixel Office coordinates to the private presence payload.
- Let staff click the Pixel Office to move their own visible character.
- Kept automatic status-zone placement as the fallback when no clicked position
  is available.

### Decisions

- Clicked positions are ephemeral Realtime presence data, not durable database
  state, so they cannot become attendance or historical location tracking.
- Pixel Office remains a view over normalized presence and still does not create
  its own Supabase subscription.

### Verification

- TypeScript passed.
- ESLint passed.
- Vitest passed: 15 files, 54 tests.

## 2026-06-06 - Add past Focus Room logging

### Scope

- Added a guarded Supabase RPC for recording completed past focus sessions.
- Added a Focus Room form for entering past Pomodoro or freeform focus work.
- Updated task and focus completion messaging to include Character XP when it is
  awarded.

### Decisions

- Past focus sessions are recorded as completed `focus_sessions` owned by the
  current member.
- Full manually logged Pomodoro sessions follow the existing XP rule and award
  10 Studio XP plus 10 Character XP.
- Freeform past sessions are recorded without Studio XP, matching the current
  live freeform behavior.

### Verification

- ESLint passed.
- TypeScript passed.
- Vitest passed: 15 files, 52 tests.
- Production build passed. Next.js warned about multiple lockfiles because the
  repo is cloned inside another Node workspace.

### Follow-ups

- Apply the new migration to Supabase before using the feature in production.
- Consider an admin review or audit view if manual backfilling becomes common.

## 2026-06-05 - Implement Character XP and Weekly Quests

### Scope

- Added durable Character XP events linked to organization members.
- Added editable Weekly Quests with Studio XP rewards, Character XP rewards,
  studio stat impact, progress, due dates, completion, and archive behavior.
- Replaced Home placeholder character and quest data with Supabase-backed view
  models.
- Added the same editable Weekly Quest panel to Home and Tasks.
- Applied the Supabase migration to the `CCAD HQ` project.

### Decisions

- Studio XP remains the shared organization-level progression system.
- Character XP is a separate append-only member ledger and is not stored on
  profiles.
- Character XP is awarded alongside eligible Studio XP sources through guarded
  database functions.
- Weekly Quest completion is idempotent and source-backed.
- Weekly Quest steps are MVP numeric progress, not separate checklist rows.

### Verification

- Supabase migration applied successfully.
- Verified new tables and quest RPCs exist in Supabase.
- Verified two active Weekly Quest rows and two backfilled Character XP rows.
- ESLint passed.
- TypeScript passed.
- Vitest passed: 15 files, 52 tests.
- Production build passed.

### Follow-ups

- Activate Alice's membership so her Character XP card appears from real account
  data.
- Consider checklist-style quest steps after validating numeric progress.

## 2026-06-05 - Add Home character and quest placeholders

### Scope

- Added placeholder Character XP cards to Home using existing William and Alice
  placeholder avatars.
- Added placeholder Weekly Quest cards with Studio XP rewards and progress.
- Corrected current documentation to keep Studio XP and Studio Level as the
  shared organization progression names.

### Decisions

- Studio XP remains the shared organization-level progression system.
- Character XP is visible on Home as lightweight staff rhythm context, not as a
  leaderboard or ranking.
- Weekly Quests appear on Home as shared direction and award Studio XP when
  they become durable.
- The previous "task status migration" phrase referred only to a possible
  future rename of task states; it is not part of this step.

### Verification

- ESLint passed.
- TypeScript passed.
- Vitest passed: 13 files, 50 tests.
- Production build passed.
- Browser screenshot verification was attempted but unavailable because the
  Node browser kernel crashed.

### Follow-ups

- Add durable Character XP and Weekly Quest schema/mutations.
- Replace placeholder Home data with Supabase-backed view models.

## 2026-06-04 - Add Character XP and quest direction

### Scope

- Updated product, architecture, XP, presence, UI, schema, agent, and overview
  documentation for the next product direction.
- Added lightweight Character XP, studio stats, weekly quests, handoffs, richer
  presence cards, and suggested future schema tables.
- Kept Studio XP documented as the organization-level progression foundation.

### Decisions

- Studio Level remains the primary progression system.
- Character Level can be shown on user and presence cards but must stay
  secondary, non-punitive, and non-ranking.
- Stability, Reputation, Creativity, and Community describe contribution types,
  not staff performance.
- Handoffs exist to reduce ownership ambiguity; they are not chat, CRM, or a
  blame ledger.
- Student milestones and parent followups may be represented only as internal
  operational tasks or quests; student and parent portals remain out of scope.

### Verification

- Reviewed `AGENTS.md`, `README.md`, and the existing documentation set before
  editing.
- Updated documentation only; no application code or migrations were added.

### Follow-ups

- Define the first implementation slice: Character XP, handoffs, or Weekly
  Quests.

## 2026-06-04 - Widen private presence write authorization

### Scope

- Replaced the Realtime insert policy so active organization members can pass
  private channel authorization for `broadcast` and `presence` extensions.
- Kept access restricted to the existing organization-scoped presence topic.

### Decisions

- Preserve private Realtime channels instead of enabling public access.
- Match Supabase's combined Broadcast and Presence authorization pattern for
  private channels while keeping the app's visible behavior presence-only.

### Verification

- Applied the policy change to Supabase.
- Pending hard refresh and Realtime log check from the hosted app.

### Follow-ups

- Reload the hosted app with a fresh session and confirm Realtime logs stop
  reporting unauthorized reads for the organization presence topic.

## 2026-06-04 - Widen private presence read authorization

### Scope

- Replaced the Realtime select policy so active organization members can read
  private channel authorization for `broadcast` and `presence` extensions.
- Kept the Realtime insert policy scoped to `presence` only.

### Decisions

- Preserve private channel access and organization membership checks.
- Allow broadcast read authorization because Supabase's private-channel join
  path can require read permission at the channel level even when the app only
  consumes Presence.

### Verification

- Applied the migration to Supabase.
- Confirmed `organization_members_receive_presence` now includes both
  `broadcast` and `presence` extensions.

### Follow-ups

- Hard refresh the hosted app and confirm Realtime logs no longer report
  unauthorized reads for the organization presence topic.

## 2026-06-04 - Pass server session token to private presence

### Scope

- Passed the server-verified Supabase access token from the workspace layout to
  the presence provider.
- Kept the browser session lookup as a fallback when no server token is
  available.

### Decisions

- Preserve private Realtime authorization and avoid enabling public channels.
- Use the authenticated server session as the source of truth for the Realtime
  join token because workspace rendering already depends on it.

### Verification

- Realtime logs showed unauthorized read attempts for the organization presence
  topic before this code change.
- The same topic and William's user id evaluate as authorized in SQL.
- ESLint, TypeScript, 50 tests, and production build passed.

### Follow-ups

- Deploy and confirm Realtime logs stop reporting unauthorized presence reads.

## 2026-06-04 - Fix private presence channel join

### Scope

- Updated the browser presence provider to set the Supabase session token on
  Realtime before joining the private organization channel.
- Added a migration that changes the presence authorization helper to use
  Supabase's documented `realtime.topic()` helper.

### Decisions

- Keep public channel access disabled.
- Continue using private organization-scoped presence instead of relaxing
  Realtime authorization.

### Verification

- Applied the database helper correction to Supabase.
- Confirmed the live helper definition now uses `realtime.topic()`.
- ESLint, TypeScript, 50 tests, and production build passed.

### Follow-ups

- Deploy the browser client fix and verify presence with two signed-in users.

## 2026-06-04 - Activate private Realtime presence authorization

### Scope

- Applied the Phase 8 Supabase Realtime authorization migration.
- Confirmed `realtime.messages` has authenticated send and receive policies for
  organization presence channels.
- Updated documentation from blocked Realtime schema repair to pending live
  two-user verification.

### Decisions

- Keep public Realtime channel access disabled.
- Authorize presence through private channels scoped to
  `org:{organization_id}:presence`.
- Keep presence ephemeral and non-durable; no attendance history is stored.

### Verification

- Confirmed `realtime.messages` and `realtime.subscription` exist.
- Confirmed `organization_members_receive_presence` and
  `organization_members_send_presence` policies exist on `realtime.messages`.

### Follow-ups

- Test William and Alice signed in at the same time to verify live presence,
  focus, break, disconnect, and unauthorized behavior.

## 2026-06-04 - Embed required Focus Room details

### Scope

- Moved Focus Room work details into the timer card.
- Added explicit required labels to work name, category, and description.
- Labeled linked task as optional.

### Decisions

- Keep required setup physically next to the timer start controls so users can
  understand why Pomodoro or freeform start may be disabled.
- Preserve the existing database requirement that focus sessions include a
  name, description, and shared category.

### Verification

- ESLint, TypeScript, 50 tests, and production build passed.

### Follow-ups

- Publish the UI update to production.

## 2026-06-04 - Clarify Focus Room active-session handling

### Scope

- Added an active-session precheck before starting a Focus Room session.
- Added clearer disabled-start guidance for required work details.
- Refresh Focus Room after start failures as well as successes so stale UI
  catches up to durable session state.

### Decisions

- Keep the one-active-session-per-member database rule and explain it in the
  UI instead of allowing overlapping focus records.
- Treat missing work name, description, or category as a visible preparation
  step before Pomodoro or freeform time can start.

### Verification

- ESLint, TypeScript, 50 tests, and production build passed.
- Live Supabase data confirmed William has one running Pomodoro, so production
  correctly blocks a second active session.

### Follow-ups

- Publish the fix and finish or cancel the current active production session.

## 2026-06-04 - Harden hosted authentication callbacks

### Scope

- Added centralized authentication-origin resolution for signup confirmation
  and password recovery callbacks.
- Documented the exact Supabase production Site URL and redirect allowlist.

### Decisions

- Prefer an explicit canonical app URL, then trusted forwarded request headers,
  before falling back to localhost.
- Keep the callback path exact in production because Supabase falls back to its
  Site URL when a requested redirect is not allowlisted.

### Verification

- Added coverage for configured, Vercel-forwarded, and local callback origins.

### Follow-ups

- Update Supabase Auth URL Configuration so production email links no longer
  fall back to localhost.

## 2026-06-04 - Replace magic-link login with invited password accounts

### Scope

- Replaced magic-link-only sign-in with email/password sign-in, invited account
  creation, password recovery, and password update routes.

### Decisions

- Keep account creation invite-only by relying on the existing database Auth
  trigger to reject emails without a valid pending invitation.
- Keep confirmation and recovery links time-limited while using passwords for
  ordinary sign-in.
- Give existing magic-link-created accounts a one-time transition through
  Forgot password rather than creating duplicate accounts.

### Verification

- Lint and TypeScript passed.
- All 47 tests passed, including local-only redirect protection.
- Production build passed and includes `/login` and `/reset-password`.

### Follow-ups

- Confirm the production Supabase Auth redirect allowlist includes
  `https://ccadhq.vercel.app/auth/confirm`.

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
