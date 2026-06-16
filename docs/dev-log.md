# Development Log

Update this log after every completed development task. Add entries newest
first. Keep entries concise and factual.

## Entry Template

```text
## YYYY-MM-DD HH:MM TZ - Short title

- Goal:
- Files changed:
- What works:
- Known issues:
- Next recommended step:
```

## 2026-06-15 17:45 PDT - Add Resources link library

- Goal: Add a Resources tab for quick access to meeting notes, Google Docs,
  folders, and internal reference links.
- Files changed: `app/(app)/resources/page.tsx`, `features/resources/**`,
  `shared/config/navigation.ts`, `shared/ui/app-shell.tsx`,
  `shared/database/database.types.ts`,
  `supabase/migrations/20260615103000_resources.sql`,
  `features/studio-notes/application/actions.ts`, `docs/build-log.md`,
  `docs/dev-log.md`.
- What works: Resources can be displayed, searched, filtered by category,
  created, edited, archived, pinned, and opened in a new tab once the migration
  is applied.
- Known issues: Studio Notes and Resources writes require Supabase migrations to
  be applied in production.
- Next recommended step: Apply the pending Supabase migrations, then add the
  first meeting-notes Google Doc link from the Resources page.

## 2026-06-15 02:10 PDT - Add Students, Marketing Ideas, and Studio Notes persistence

- Goal: Turn the scoped CCADHQ operating-system pieces into practical
  Supabase-backed workflows without expanding navigation beyond Students,
  Marketing, and Home Studio Notes.
- Files changed: `app/(app)/students/**`, `app/(app)/marketing/page.tsx`,
  `app/(app)/page.tsx`, `features/students/**`, `features/marketing/**`,
  `features/studio-notes/**`, `features/dashboard/ui/dashboard-overview.tsx`,
  `shared/config/navigation.ts`, `shared/ui/app-shell.tsx`,
  `shared/database/database.types.ts`, `shared/ui/data-table.tsx`,
  `shared/ui/file-uploader.tsx`, `shared/ui/mini-chart.tsx`,
  `shared/ui/skeleton.tsx`,
  `supabase/migrations/20260614090000_students_marketing_notes.sql`,
  `docs/build-log.md`, `docs/dev-log.md`, `docs/product-spec.md`,
  `docs/database-schema.md`, `docs/system-architecture.md`,
  `docs/ui-guidelines.md`.
- What works: Students can be created, edited, archived, opened in a detail
  page, and given class logs; Marketing ideas can be added, edited, archived,
  and moved through the pipeline; Studio Notes on Home can be created, edited,
  deleted, pinned, and visually marked important.
- Known issues: The Supabase migration could not be applied from this session
  because the connector returned a permission error; local browser verification
  is blocked until real Supabase environment variables are available in
  `.env.local`.
- Next recommended step: Apply the migration in Supabase, then verify the
  Students page, Marketing idea pipeline, and Home Studio Notes with a signed-in
  staff account.

## 2026-06-06 18:06 PDT - Refine Finance, Tasks, Home, and Presence surfaces

- Goal: Add recurring finance labels, collapse completed tasks, improve Home
  activity visibility, and remove duplicate Home Pixel Office/presence surfaces.
- Files changed: `features/finance/**`, `features/tasks/ui/tasks-workspace.tsx`,
  `features/dashboard/**`, `features/studio-xp/ui/studio-xp-overview.tsx`,
  `features/focus/ui/focus-room-client.tsx`, `shared/database/database.types.ts`,
  `supabase/migrations/20260607004000_finance_recurring_entries.sql`,
  `docs/product-spec.md`, `docs/database-schema.md`,
  `docs/system-architecture.md`, `docs/ui-guidelines.md`,
  `docs/build-log.md`, `docs/dev-log.md`.
- What works: Finance entries can be marked one-time, weekly, monthly, or
  yearly; completed tasks are grouped behind a show/hide control; Home recent
  activity names the actor and can be collapsed; Pixel Office is available in
  Studio XP and Focus Room presence contexts.
- Known issues: Recurring finance entries do not auto-create future ledger rows;
  this is intentional for the current implementation.
- Next recommended step: Apply the new Supabase migration before deploying code
  that writes finance recurrence.

## 2026-06-06 17:36 PDT - Brighten CCAD HQ interface theme

- Goal: Make the UI colors lighter and brighter using the provided dashboard
  reference as loose direction without copying it exactly.
- Files changed: `app/globals.css`, `shared/ui/app-shell.tsx`,
  `shared/ui/card.tsx`, `shared/ui/button.tsx`, `shared/ui/status-pill.tsx`,
  `features/dashboard/ui/dashboard-overview.tsx`, `docs/build-log.md`,
  `docs/dev-log.md`.
- What works: The app now uses a light studio palette, softer card shadows,
  brighter active navigation, and pastel Home metric cards.
- Known issues: Local browser runtime still needs Supabase environment values to
  view signed-in screens in development.
- Next recommended step: Review the Home, Focus Room, Tasks, and Finance pages
  with real data and tune any individual card colors that feel too soft.

## 2026-06-06 17:25 PDT - Add interactive Pixel Office placement

- Goal: Let staff click the Pixel Office to move their own character in the
  shared live room.
- Files changed: `docs/realtime-presence.md`, `docs/system-architecture.md`,
  `docs/build-log.md`, `docs/dev-log.md`,
  `features/presence/domain/presence.ts`,
  `features/presence/domain/presence.test.ts`,
  `features/presence/ui/presence-provider.tsx`,
  `features/pixel-office/domain/pixel-office.ts`,
  `features/pixel-office/domain/pixel-office.test.ts`,
  `features/pixel-office/ui/pixel-office-panel.tsx`,
  `features/pixel-office/ui/pixel-office.tsx`.
- What works: Pixel Office clicks broadcast the current member's ephemeral room
  coordinate through private presence, coworkers can receive that coordinate,
  and automatic status-zone placement remains the fallback.
- Known issues: Positions reset when presence disconnects or the user refreshes;
  this is intentional because the feature is not durable.
- Next recommended step: Verify with two signed-in staff accounts that each
  person can move their own character and see the other's movement.

## 2026-06-06 16:34 PDT - Add past focus session logging

- Goal: Let staff log Focus Room sessions completed outside the live timer and
  make task completion messaging show Character XP.
- Files changed: `docs/product-spec.md`, `docs/xp-system.md`,
  `docs/database-schema.md`, `docs/build-log.md`, `docs/dev-log.md`,
  `shared/database/database.types.ts`, `features/focus/application/actions.ts`,
  `features/focus/ui/focus-room-client.tsx`,
  `features/tasks/application/actions.ts`,
  `features/tasks/ui/tasks-workspace.tsx`,
  `supabase/migrations/20260606233400_record_past_focus_sessions.sql`.
- What works: Focus Room has a Log past session form, the new guarded Supabase
  RPC creates completed focus-session rows, full manually logged Pomodoros award
  Studio XP and Character XP, and task completion messages now mention personal
  Character XP when awarded.
- Known issues: Manual past-session logging trusts active staff to enter honest
  historical time; no admin approval workflow is included.
- Next recommended step: Apply the migration to Supabase and verify the form
  with one past Pomodoro and one freeform session in a seeded organization.

## 2026-06-05 07:37 PDT - Implement Character XP and Weekly Quests

- Goal: Replace Home placeholder Character XP and Weekly Quest data with
  account-linked Character XP, durable editable Weekly Quests, and Tasks-page
  quest visibility.
- Files changed: `AGENTS.md`, `README.md`, `docs/product-spec.md`,
  `docs/system-architecture.md`, `docs/xp-system.md`,
  `docs/ui-guidelines.md`, `docs/database-schema.md`, `docs/build-log.md`,
  `docs/dev-log.md`, `shared/database/database.types.ts`,
  `shared/domain/xp-progress.ts`,
  `features/character-xp/domain/character-xp.ts`,
  `features/character-xp/domain/character-xp.test.ts`,
  `features/weekly-quests/domain/weekly-quests.ts`,
  `features/weekly-quests/domain/weekly-quests.test.ts`,
  `features/weekly-quests/application/get-weekly-quests.ts`,
  `features/weekly-quests/application/actions.ts`,
  `features/weekly-quests/ui/weekly-quests-panel.tsx`,
  `features/dashboard/domain/studio-progress.ts`,
  `features/dashboard/domain/dashboard-view-model.ts`,
  `features/dashboard/application/build-dashboard-view-model.ts`,
  `features/dashboard/application/build-dashboard-view-model.test.ts`,
  `features/dashboard/infrastructure/supabase-dashboard-query.ts`,
  `features/dashboard/ui/dashboard-overview.tsx`, `app/(app)/tasks/page.tsx`,
  `supabase/migrations/20260605150000_character_xp_weekly_quests.sql`.
- What works: Supabase has `character_xp_events` and `weekly_quests`, two
  active seeded Weekly Quests, two backfilled Character XP events, guarded quest
  RPCs, idempotent Character XP awards for future focus/task/quest completions,
  Home account-linked Character XP cards, and the same editable quest panel on
  Home and Tasks.
- Known issues: Production currently has one active organization member, so
  Alice appears after her account becomes an active member. Weekly Quest steps
  are numeric progress rather than individual checklist rows.
- Next recommended step: Add optional per-quest checklist steps or show
  Character XP on presence cards once Alice has active access.

## 2026-06-05 07:00 PDT - Add Home character and quest placeholders

- Goal: Keep Studio XP as shared progression while adding placeholder Character
  XP cards and Weekly Quests to Home.
- Files changed: `AGENTS.md`, `README.md`, `docs/product-spec.md`,
  `docs/system-architecture.md`, `docs/xp-system.md`,
  `docs/ui-guidelines.md`, `docs/database-schema.md`, `docs/build-log.md`,
  `docs/dev-log.md`, `features/dashboard/domain/dashboard-view-model.ts`,
  `features/dashboard/application/build-dashboard-view-model.ts`,
  `features/dashboard/application/build-dashboard-view-model.test.ts`,
  `features/dashboard/ui/dashboard-overview.tsx`.
- What works: Home now exposes placeholder Character XP cards for William and
  Alice plus Weekly Quest progress cards, and documentation consistently keeps
  Studio XP as the organization-level progression name.
- Known issues: Character XP and Weekly Quests are placeholder dashboard data,
  not yet backed by migrations or Supabase queries. Browser screenshot
  verification was unavailable because the Node browser kernel crashed.
- Next recommended step: Implement durable Character XP and Weekly Quest tables
  and replace the Home placeholders with Supabase-backed view models.

## 2026-06-04 19:43 PDT - Document Character XP and quest direction

- Goal: Update project documentation for Studio XP, lightweight Character XP,
  studio stats, handoffs, quests, richer presence cards, and MVP-friendly schema
  direction.
- Files changed: `AGENTS.md`, `README.md`, `docs/product-spec.md`,
  `docs/system-architecture.md`, `docs/xp-system.md`,
  `docs/realtime-presence.md`, `docs/ui-guidelines.md`,
  `docs/database-schema.md`, `docs/build-log.md`, `docs/dev-log.md`.
- What works: Documentation now keeps Studio Level as primary progression while
  allowing secondary non-ranking Character Level, defines Stability,
  Reputation, Creativity, and Community stats, adds handoff and weekly quest
  direction, and documents suggested schema tables.
- Known issues: No application code, migrations, tests, or UI have been updated
  for the new progression model yet; current implementation still uses Studio
  XP naming and existing task statuses.
- Next recommended step: Implement Character XP or Weekly Quests behind
  compatibility contracts that keep Studio XP as the shared progression system.

## 2026-06-04 19:39 PDT - Widen private presence write authorization

- Goal: Resolve remaining private Realtime presence join rejection after read
  authorization was widened.
- Files changed:
  `supabase/migrations/20260605034000_realtime_presence_write_authorization.sql`,
  `docs/build-log.md`, `docs/dev-log.md`.
- What works: The live `realtime.messages` insert policy now permits active
  organization members to pass private channel authorization for both
  `broadcast` and `presence`; channel access remains private and org-scoped.
- Known issues: Hosted browser presence still needs a fresh reload and log
  check after the policy change.
- Next recommended step: Hard refresh the app, sign out/in if needed, and
  re-check Realtime logs for unauthorized topic reads.

## 2026-06-04 19:34 PDT - Widen private presence read authorization

- Goal: Stop private Realtime presence joins from being rejected during channel
  read authorization.
- Files changed:
  `supabase/migrations/20260605032000_realtime_presence_read_authorization.sql`,
  `docs/build-log.md`, `docs/dev-log.md`.
- What works: The live `realtime.messages` select policy now permits active
  organization members to read private channel authorization for both
  `broadcast` and `presence`, while the insert policy remains presence-only.
- Known issues: Hosted browser presence still needs a fresh reload and log
  check after the policy change.
- Next recommended step: Hard refresh the app and re-check Realtime logs for
  unauthorized topic reads.

## 2026-06-04 19:03 PDT - Pass server session token to presence

- Goal: Fix private Realtime presence still becoming unavailable after channel
  policies and topic helper were corrected.
- Files changed: `app/(app)/layout.tsx`, `shared/ui/app-shell.tsx`,
  `features/presence/ui/presence-provider.tsx`, `docs/build-log.md`,
  `docs/dev-log.md`.
- What works: Workspace layout now passes the server-verified Supabase access
  token into the presence provider before joining the private channel; ESLint,
  TypeScript, 50 tests, and production build pass.
- Known issues: The change must be committed, pushed, and deployed before
  hosted presence can be retested.
- Next recommended step: Deploy, reload the app, and confirm Realtime logs no
  longer report unauthorized reads for the organization presence topic.

## 2026-06-04 18:51 PDT - Fix private presence join

- Goal: Resolve unavailable private Realtime presence after policies were
  enabled.
- Files changed: `features/presence/ui/presence-provider.tsx`,
  `supabase/migrations/20260605013900_realtime_presence_topic_helper.sql`,
  `docs/build-log.md`, `docs/dev-log.md`.
- What works: Browser presence now sets the authenticated session token before
  joining the private channel, and the Realtime policy helper uses Supabase's
  documented `realtime.topic()` helper. ESLint, TypeScript, 50 tests, and
  production build pass.
- Known issues: The browser client change must be committed, pushed, and
  redeployed before hosted presence can be re-tested.
- Next recommended step: Deploy this fix, reload two signed-in sessions, and
  verify live presence changes from online to focusing or break.

## 2026-06-04 18:37 PDT - Activate private Realtime presence policies

- Goal: Enable private organization-scoped coworking presence without allowing
  public Realtime channels.
- Files changed: `AGENTS.md`, `README.md`, `docs/database-schema.md`,
  `docs/realtime-presence.md`, `docs/system-architecture.md`,
  `docs/product-spec.md`, `docs/build-log.md`, `docs/dev-log.md`.
- What works: Supabase managed Realtime relations exist, the Phase 8 migration
  applied successfully, and `realtime.messages` now has authenticated
  organization-member send/receive policies.
- Known issues: Two-user live verification for join, leave, focus, break,
  reconnect, and unauthorized access is still pending.
- Next recommended step: Reload the deployed app with William and Alice signed
  in on separate browsers/devices and verify presence states.

## 2026-06-04 18:25 PDT - Embed required Focus Room details

- Goal: Make required Focus Room setup obvious before starting Pomodoro or
  freeform time.
- Files changed: `features/focus/ui/focus-room-client.tsx`,
  `docs/build-log.md`, `docs/dev-log.md`.
- What works: Work details now live inside the timer card, required fields are
  labeled, linked task is labeled optional, and the start button guidance is
  adjacent to the timer controls.
- Known issues: Realtime private-channel authorization is active, but two-user
  live presence verification is still pending.
- Next recommended step: Commit, push, and redeploy the Focus Room UI update.

## 2026-06-04 18:21 PDT - Clarify Focus Room start state

- Goal: Make Focus Room recover clearly when a start attempt meets an existing
  active session or missing required details.
- Files changed: `features/focus/application/actions.ts`,
  `features/focus/ui/focus-room-client.tsx`, `docs/build-log.md`,
  `docs/dev-log.md`.
- What works: Start attempts now check for an active session before inserting,
  refresh Focus Room after both success and failure, and explain that work name,
  description, and category are required before Pomodoro or freeform starts.
- Known issues: William currently has one running Pomodoro in production, so a
  second session cannot start until that session is finished or cancelled.
- Next recommended step: Publish the fix and use the active-session controls to
  finish or cancel the current production session.

## 2026-06-04 13:12 PDT - Fix hosted auth callback origin

- Goal: Prevent password recovery and confirmation emails from redirecting to
  localhost in production.
- Files changed: `.env.example`, `features/auth/application/actions.ts`,
  `features/auth/domain/auth.ts`, `features/auth/domain/auth.test.ts`,
  `README.md`, `docs/system-architecture.md`, `docs/build-log.md`,
  `docs/dev-log.md`.
- What works: Auth callback requests prefer the canonical production app URL,
  then Vercel forwarded headers, while local development remains supported.
- Known issues: Supabase Auth URL Configuration must still be updated because
  disallowed callback URLs fall back to its current localhost Site URL.
- Next recommended step: Set the Supabase production Site URL and exact
  `/auth/confirm` redirect URL, then request a fresh reset email.

## 2026-06-04 13:00 PDT - Add invite-only password authentication

- Goal: Replace magic-link-only sign-in with account email and password.
- Files changed: `app/login/page.tsx`, `app/reset-password/page.tsx`,
  `app/auth/**`, `features/auth/**`, `features/studio-access/**`,
  `shared/database/supabase/proxy.ts`, `README.md`, and relevant `docs/**`.
- What works: Invited account creation, password sign-in, password recovery,
  password update, safe post-auth redirects, and invitation-gated Auth-user
  creation; lint, TypeScript, 47 tests, and production build pass.
- Known issues: Existing magic-link-created accounts must use Forgot password
  once. Production confirmation and recovery require the deployed callback URL
  in the Supabase Auth redirect allowlist.
- Next recommended step: Push and deploy, then test account recovery and invited
  account creation against production email delivery.

## 2026-06-04 12:45 PDT - Pin Vercel framework preset

- Goal: Correct the production deployment configuration returning Vercel
  `404 NOT_FOUND` before application routing.
- Files changed: `vercel.json`, `docs/build-log.md`, `docs/dev-log.md`.
- What works: Vercel deployments now explicitly select the Next.js framework
  preset instead of relying on the project's missing preset; lint, TypeScript,
  and all 44 tests pass.
- Known issues: The configuration must be committed and redeployed before the
  production domain can be rechecked. Local production build verification is
  blocked by the desktop sandbox denying Turbopack child-process creation; the
  same application build passed on Vercel.
- Next recommended step: Push the configuration and redeploy production.

## 2026-06-04 12:08 PDT - Complete Phase 10 Studio Access

- Goal: Give CCAD admins a guarded way to invite future staff and manage account
  access without expanding into CRM functionality.
- Files changed: `app/(app)/studio-access/**`, `features/studio-access/**`,
  `shared/ui/app-shell.tsx`, `shared/database/database.types.ts`,
  `supabase/migrations/**`, `AGENTS.md`, `README.md`,
  `docs/product-spec.md`, `docs/system-architecture.md`,
  `docs/database-schema.md`, `docs/ui-guidelines.md`, `docs/build-log.md`,
  `docs/dev-log.md`.
- What works: Admin-only staff invitations, invitation revocation, role changes,
  activation/deactivation, inactive-member historical names, direct-write
  revocation, audit events, self-deactivation denial, and last-admin
  protection; live migrations, rollback-only security testing, lint,
  TypeScript, 44 tests, and production build passed.
- Known issues: Visual browser QA remains unavailable; Supabase Realtime
  remains blocked by its missing managed schema.
- Next recommended step: Publish Phase 9 and Phase 10, then complete Phase 8
  when Supabase repairs Realtime.

## 2026-06-04 11:49 PDT - Complete Phase 9 optional Pixel Office

- Goal: Add a lightweight, accessible Pixel Office without coupling it to
  Realtime infrastructure or core workflows.
- Files changed: `features/pixel-office/**`,
  `features/presence/ui/presence-workspace.tsx`,
  `features/dashboard/ui/dashboard-overview.tsx`, `AGENTS.md`, `README.md`,
  `docs/product-spec.md`, `docs/system-architecture.md`,
  `docs/realtime-presence.md`, `docs/build-log.md`, `docs/dev-log.md`.
- What works: Home defaults to the accessible coworking list and can switch to
  Pixel Office; normalized statuses map deterministically to room zones with
  visible status labels, text equivalents, and graceful empty/unavailable
  states; full-project lint, TypeScript, 41 tests, and production build passed.
- Known issues: Live occupants cannot be verified until Supabase repairs the
  missing managed `realtime.messages` and `realtime.subscription` relations;
  visual browser QA could not run because the in-app browser connection was
  unavailable.
- Next recommended step: Apply and live-test Phase 8 authorization after
  Supabase repairs Realtime, and complete visual QA from a working preview.

## 2026-06-04 05:24 PDT - Implement Phase 8 realtime presence client

- Goal: Add ephemeral coworking presence to Home and Focus Room without
  creating attendance history.
- Files changed: `app/(app)/layout.tsx`, `features/presence/**`,
  `features/dashboard/**`, `features/focus/ui/focus-room-client.tsx`,
  `shared/ui/app-shell.tsx`, `supabase/migrations/**`, `AGENTS.md`, `README.md`,
  `docs/realtime-presence.md`, `docs/system-architecture.md`,
  `docs/database-schema.md`, `docs/ui-guidelines.md`, `docs/build-log.md`,
  `docs/dev-log.md`.
- What works: Private-channel client lifecycle, focus/break/online/away status,
  route location, multiple-tab normalization, payload validation, stale and
  unavailable states, and reusable Home/Focus Room UI; lint, TypeScript, 38
  tests, and production build passed.
- Known issues: Supabase private-only channels must be enabled before the
  managed `realtime.messages` authorization schema exists and the Phase 8
  policy migration can apply; two-user and visual browser tests remain pending;
  the connected Vercel project still needs the full source published.
- Next recommended step: Enable private-only Realtime channels, apply the Phase
  8 policy migration, and run two-user live presence verification before
  starting Pixel Office.

## 2026-06-04 05:05 PDT - Complete Phase 7 internal Finance ledger

- Goal: Implement and verify the detailed monthly Finance workflow.
- Files changed: `app/(app)/finance/**`, `features/finance/**`,
  `shared/database/database.types.ts`, `supabase/migrations/**`, `AGENTS.md`,
  `README.md`, `docs/product-spec.md`, `docs/system-architecture.md`,
  `docs/database-schema.md`, `docs/ui-guidelines.md`, `docs/build-log.md`,
  `docs/dev-log.md`.
- What works: Monthly income/expense/net summaries, lightweight comparison,
  month/type/category filters, exact CAD amount handling, manual create/edit,
  creator-or-admin archive controls, category snapshots, and no-XP Finance
  behavior; lint, TypeScript, 32 tests, build, migration, advisors, and
  rollback-only live workflow tests passed.
- Known issues: Admin editing another creator's entry was not live-tested
  because only one active member exists; visual browser QA remains unavailable;
  expected unused-index and intentional authenticated security-definer RPC
  advisor notices remain; the connected Vercel project still needs the full
  source published.
- Next recommended step: Begin Phase 8 with realtime coworking presence.

## 2026-06-03 20:11 PDT - Complete Phase 6 shared Tasks

- Goal: Implement and verify detailed shared task management with atomic
  first-completion Studio XP.
- Files changed: `app/(app)/tasks/**`, `features/tasks/**`,
  `shared/database/database.types.ts`, `supabase/migrations/**`, `AGENTS.md`,
  `README.md`, `docs/product-spec.md`, `docs/system-architecture.md`,
  `docs/database-schema.md`, `docs/xp-system.md`, `docs/ui-guidelines.md`,
  `docs/build-log.md`, `docs/dev-log.md`.
- What works: Kanban-first and list views, status/priority/assignee/due filters,
  shared create/edit/assign/prioritize/archive workflows, accessible status
  transitions, retained category snapshots, current and first completion
  timestamps, and atomic one-time +20 Studio XP; lint, TypeScript, 27 tests,
  build, migration, advisors, and rollback-only live workflow tests passed.
- Known issues: Visual browser QA remains unavailable because the local preview
  cannot remain running; expected unused-index and intentional authenticated
  security-definer RPC advisor notices remain.
- Next recommended step: Begin Phase 7 with the detailed Finance workflow.

## 2026-06-03 19:24 PDT - Complete Phase 5 shared Studio XP

- Goal: Implement the detailed organization-wide Studio XP workflow.
- Files changed: `app/(app)/studio-xp/**`, `app/(app)/layout.tsx`,
  `features/studio-xp/**`, `features/focus/**`, `features/dashboard/**`,
  `shared/ui/app-shell.tsx`, `shared/database/database.types.ts`,
  `supabase/migrations/**`, `AGENTS.md`, `README.md`, `docs/product-spec.md`,
  `docs/system-architecture.md`, `docs/database-schema.md`,
  `docs/xp-system.md`, `docs/ui-guidelines.md`, `docs/build-log.md`,
  `docs/dev-log.md`.
- What works: Live shared level and total, next-level progress, attributed
  activity, Home/app-shell drill-down links, admin signed corrections,
  below-zero protection, and Pomodoro/correction level-up results; lint,
  TypeScript, 22 tests, build, migration, advisors, and rollback-only live
  correction/Pomodoro tests passed, including correction idempotency and staff
  denial.
- Known issues: Task-completion XP awaits the Tasks phase; visual browser QA
  remains unavailable because the local preview cannot remain running; expected
  unused-index and intentional authenticated security-definer RPC advisor
  notices remain.
- Next recommended step: Begin Phase 6 with detailed Tasks and atomic
  first-completion XP.

## 2026-06-03 19:12 PDT - Add crash-monitoring foundation

- Goal: Add practical crash logging and recovery without storing sensitive
  diagnostic content in the application database.
- Files changed: `instrumentation.ts`, `instrumentation-client.ts`,
  `app/global-error.tsx`, `app/(app)/error.tsx`, `app/api/incidents/**`,
  `shared/observability/**`, `shared/database/database.types.ts`,
  `supabase/migrations/**`, `.env.example`, `AGENTS.md`, `README.md`,
  `docs/error-monitoring.md`, `docs/system-architecture.md`,
  `docs/database-schema.md`, `docs/build-log.md`, `docs/dev-log.md`.
- What works: Structured server incidents, uncaught browser incident capture,
  recovery boundaries, authenticated idempotent database incident references,
  admin-only reads, and append-only change history; automated tests, build, and
  rollback-only live incident verification passed.
- Known issues: No Vercel project, external monitoring provider, log drain, or
  admin incident screen exists yet; unauthenticated global failures remain
  runtime-log-only.
- Next recommended step: Connect durable external monitoring when the Vercel
  project is created.

## 2026-06-03 19:04 PDT - Complete Phase 4 persisted Focus Room

- Goal: Implement and verify the persisted Pomodoro/freeform Focus Room.
- Files changed: `app/(app)/focus-room/page.tsx`, `features/focus/**`,
  `shared/database/database.types.ts`, `supabase/migrations/**`, `AGENTS.md`,
  `README.md`, `docs/product-spec.md`, `docs/system-architecture.md`,
  `docs/database-schema.md`, `docs/xp-system.md`, `docs/ui-guidelines.md`,
  `docs/build-log.md`, `docs/dev-log.md`.
- What works: Persisted timer restoration, fixed Pomodoro and break timers,
  freeform time recording, pause/resume/cancel/complete, active detail editing,
  shared category management, optional task linking, previous-work
  continuation, durable category snapshots, one long break per four-Pomodoro
  milestone, and idempotent full-Pomodoro Studio XP; lint, TypeScript, 17
  tests, build, migration, RLS, trigger, category, and advisor checks
  completed; a rollback-only live RPC smoke test passed all timer transitions,
  category snapshots, freeform no-XP completion, and Pomodoro XP idempotency.
- Known issues: Realtime presence remains unavailable by phase design; offline
  mutations are not queued; visual browser QA could not run because the local
  preview server cannot remain running in this Windows sandbox; Supabase warns
  about intentionally exposed authenticated security-definer focus RPCs and
  disabled leaked-password protection, while the app uses magic-link auth.
- Next recommended step: Begin Phase 5 with the detailed shared Studio XP
  workflow and activity presentation.

## 2026-06-03 16:10 PDT - Complete Phase 3 durable Home dashboard

- Goal: Replace Home mock data with durable Supabase summaries and establish
  the task, Studio XP, finance, and initial-admin data foundations.
- Files changed: `app/(app)/page.tsx`, `app/(app)/loading.tsx`,
  `app/(app)/error.tsx`, `features/auth/application/**`,
  `features/dashboard/**`, `shared/database/database.types.ts`,
  `supabase/migrations/**`, `AGENTS.md`, `README.md`,
  `docs/system-architecture.md`, `docs/database-schema.md`,
  `docs/build-log.md`, `docs/dev-log.md`.
- What works: Home reads organization-scoped task counts, Studio XP progress
  and recent activity, and current-month finance totals from Supabase; empty,
  loading, error, and unavailable-presence states are defined; William and
  Alice have pending admin invitations; first sign-in is restricted to invited
  emails; lint, TypeScript, eight tests, build, route checks, RLS checks, and
  Supabase security checks pass.
- Known issues: Hosted Auth redirect URLs still require deployment-time
  configuration; the in-app visual browser could not start in this session;
  unused-index advisor notices are expected while feature tables are empty.
- Next recommended step: Begin Phase 4 with the persisted Pomodoro/freeform
  Focus Room timer and shared work-category management.

## 2026-06-03 15:15 PDT - Complete Phase 2 authentication and database foundation

- Goal: Add invite-only Supabase authentication, active membership protection,
  initial organization schema, RLS, and durable database change history.
- Files changed: `package.json`, `package-lock.json`, `.env.example`,
  `app/(app)/layout.tsx`, `app/login/**`, `app/auth/**`,
  `app/access-pending/**`, `features/auth/**`, `shared/database/**`,
  `shared/ui/app-shell.tsx`, `proxy.ts`, `supabase/migrations/**`, `AGENTS.md`,
  `README.md`, `docs/system-architecture.md`, `docs/database-schema.md`,
  `docs/build-log.md`, `docs/dev-log.md`.
- What works: Invite-only magic-link login flow, session refresh, protected
  workspace routes, current-member loading, sign-out, seven RLS-protected
  foundation tables, invitation acceptance trigger, and append-only change
  history are implemented; lint, TypeScript, tests, build, route checks, and
  Supabase security checks pass.
- Known issues: William and Alice require email addresses before admin Auth
  invitations can be created; hosted Auth redirect URLs must be configured
  before deployment; database is empty so index-usage advisor notices are
  expected.
- Next recommended step: Begin Phase 3 by replacing Home dashboard mock data
  with durable organization-scoped summaries and adding the first dashboard
  feature tables as needed.

## 2026-06-03 14:52 PDT - Complete Phase 1 application foundation

- Goal: Scaffold the application foundation, responsive shell, MVP routes,
  typed Home dashboard mocks, and automated checks.
- Files changed: `package.json`, `package-lock.json`, `.gitignore`,
  `.env.example`, `tsconfig.json`, `next-env.d.ts`, `next.config.ts`,
  `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`,
  `vitest.setup.ts`, `components.json`, `app/**`, `features/dashboard/**`,
  `shared/**`, `AGENTS.md`, `README.md`, `docs/system-architecture.md`,
  `docs/build-log.md`, `docs/dev-log.md`.
- What works: All four MVP routes render in a responsive shared shell; Home uses
  a typed replaceable mock adapter; lint, TypeScript, four tests, production
  build, and live route checks pass.
- Known issues: Authentication and Supabase data are intentionally not connected;
  visual browser preview was unavailable in this session.
- Next recommended step: Begin Phase 2 with authentication lifecycle,
  organization membership, initial schema migrations, change history, and RLS.

## 2026-06-03 14:28 PDT - Add placeholder asset agent policy

- Goal: Add repository guidance for creating and replacing placeholder assets.
- Files changed: `AGENTS.md`, `docs/dev-log.md`.
- What works: Agent guidance now defines permitted placeholder SVG usage and
  requires final CCAD brand assets before public launch.
- Known issues: None.
- Next recommended step: Scaffold the application and use placeholders only
  where final assets are unavailable.

## 2026-06-03 14:27 PDT - Create placeholder SVG assets

- Goal: Create simple editable placeholder visuals and document asset handling.
- Files changed: `README.md`, `public/placeholders/pixel-office-empty.svg`,
  `public/placeholders/william-avatar.svg`,
  `public/placeholders/alice-avatar.svg`, `public/placeholders/studio-desk.svg`,
  `public/placeholders/focus-room-banner.svg`,
  `public/placeholders/finance-chart-empty.svg`, `docs/assets.md`,
  `docs/build-log.md`, `docs/dev-log.md`.
- What works: Six dark-mode-friendly SVG placeholders are available under
  `public/placeholders/`; asset replacement and format conventions are
  documented.
- Known issues: Browser-based visual preview was unavailable; XML and dependency
  validation passed.
- Next recommended step: Use the placeholders when scaffolding the app shell and
  initial feature layouts.

## 2026-06-03 14:23 PDT - Create dedicated Supabase project

- Goal: Create and verify a dedicated Supabase project for CCAD HQ.
- Files changed: `README.md`, `docs/system-architecture.md`,
  `docs/build-log.md`, `docs/dev-log.md`.
- What works: The `CCAD HQ` Supabase project exists in `ca-central-1` with
  project reference `nhxwyybrfeflekliookp` and reports `ACTIVE_HEALTHY`.
- Known issues: Vercel project is not yet created; branding, themes, and future
  staff finance visibility remain undecided.
- Next recommended step: Scaffold the application and prepare the initial
  database migration.

## 2026-06-03 14:12 PDT - Confirm shared work organization

- Goal: Define shared task/focus categories, task-linked focus sessions,
  previous-work continuation, and MVP task views.
- Files changed: `docs/product-spec.md`, `docs/database-schema.md`,
  `docs/system-architecture.md`, `docs/ui-guidelines.md`, `docs/build-log.md`,
  `docs/dev-log.md`.
- What works: Documentation now defines shared work categories, historical
  focus snapshots, optional linked tasks, continuation from prior sessions, and
  Kanban/list task views.
- Known issues: Supabase project creation awaits organization, region, and cost
  confirmation.
- Next recommended step: Create the dedicated CCAD HQ Supabase project, then
  scaffold the application and initial migration.

## 2026-06-03 14:07 PDT - Confirm initial experience direction

- Goal: Record approved Focus Room, Tasks, Home dashboard, and notification
  direction and verify connector availability.
- Files changed: `README.md`, `docs/product-spec.md`,
  `docs/system-architecture.md`, `docs/database-schema.md`,
  `docs/ui-guidelines.md`, `docs/build-log.md`, `docs/dev-log.md`.
- What works: Documentation now defines required focus-work metadata and shared
  categories, Pomodoro sequencing, Kanban-first tasks, shared task editing,
  at-a-glance Home summaries, optional timer notifications, history retention,
  and finance-history access.
- Known issues: Alternate task views, branding, themes, future staff finance
  visibility, and the CCAD-specific Supabase project remain undecided.
- Next recommended step: Confirm the remaining first-milestone decisions, then
  scaffold the application and prepare the initial database migration.

## 2026-06-03 13:57 PDT - Confirm MVP decisions and history requirements

- Goal: Record approved MVP defaults, add freeform focus time recording, and
  require database history for every durable application-data change.
- Files changed: `AGENTS.md`, `README.md`, `docs/product-spec.md`,
  `docs/system-architecture.md`, `docs/database-schema.md`,
  `docs/realtime-presence.md`, `docs/xp-system.md`, `docs/ui-guidelines.md`,
  `docs/build-log.md`, `docs/dev-log.md`.
- What works: Documentation now defines invite-only admin access, confirmed
  organization defaults, Pomodoro and freeform focus modes, cross-device timer
  rules, initial finance categories, and database-triggered change history.
- Known issues: Focus-session history retention remains undecided.
- Next recommended step: Define the implementation plan for project scaffolding,
  authentication, database migrations, and the typed Home dashboard contracts.

## 2026-06-03 13:50 PDT - Add development log requirement

- Goal: Establish a required concise log entry after every completed development
  task.
- Files changed: `AGENTS.md`, `README.md`, `docs/build-log.md`,
  `docs/dev-log.md`.
- What works: Repository guidance now requires the development log and
  distinguishes it from the decision-focused build log.
- Known issues: None.
- Next recommended step: Review and approve the documentation foundation before
  beginning application implementation.
