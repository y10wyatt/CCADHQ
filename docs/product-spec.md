# Product Specification

## 1. Product Summary

CCAD HQ is an authenticated internal operations app for Cloud Centre of Art &
Design. It gives staff a shared view of current work, focus activity, simple
financial movement, and the studio's collective progress.

The organization is the character. Work performed by staff contributes to one
shared Studio XP total and one CCAD level. The product must encourage
collaboration rather than individual competition.

## 2. Goals

- Make the next useful studio action obvious.
- Help staff work alongside each other, whether colocated or remote.
- Keep tasks and basic financial activity visible without adding heavy process.
- Turn consistent operational work into visible organizational progress.
- Provide a foundation that future staff can understand quickly.

## 3. Non-Goals

- Student or parent access
- Learning management
- Customer relationship management
- Payment collection or bank integrations
- AI-generated content or assistants
- Chat, direct messages, or video calls
- Calendar integrations
- Payroll, accounting, invoicing, or tax reporting
- Individual XP, levels, rankings, or performance scoring

## 4. Users And Permissions

### Initial users

- William, admin
- Alice, admin

### Future users

- Additional authenticated CCAD staff

### MVP roles

| Role | Capabilities |
| --- | --- |
| Staff | View dashboard, run focus sessions, manage tasks, create finance entries, and edit or archive finance entries they created |
| Admin | All staff capabilities plus manage members and edit or archive any finance entry |

All authorized product users belong to the single CCAD organization in MVP.
The data model should remain organization-scoped so another organization could
be supported later without redesigning core tables.

Accounts are invite-only with no unrestricted public signup. Invited users
create an email/password account and then sign in with those credentials.
Password recovery uses a time-limited email link. An authenticated user without
an active organization membership cannot access product data or authenticated
product routes.

## 5. Navigation

Primary navigation contains exactly four MVP tabs:

1. Home
2. Focus Room
3. Tasks
4. Finance

Studio XP is visible across the product but does not require its own MVP tab.
Realtime presence appears where useful, primarily on Home and in Focus Room.
Pixel office is a later alternative visualization, not a primary tab.

## 6. Functional Requirements

### 6.1 Home Dashboard

Home answers: "What is happening, what matters next, and how is CCAD doing?"

Required sections:

- Outstanding and priority task summary
- Studio XP level and progress to next level
- Current-month income, expenses, and net summary
- Compact current focus and presence summary
- Recent activity summary

Acceptance criteria:

- A signed-in user can understand the studio's current state without opening
  another tab.
- Home remains an at-a-glance summary rather than duplicating detailed feature
  screens.
- Every summary links to its relevant detailed tab.
- Empty and partially configured states remain useful.
- Stale realtime information is clearly distinguishable from current presence.

### 6.2 Focus Room

The Focus Room provides personal Pomodoro and freeform stopwatch modes within a
shared coworking space.

Required behavior:

- Default intervals: 25-minute focus, 5-minute short break, and 15-minute long
  break.
- Pomodoro interval lengths are fixed in MVP.
- One long break is offered after every four completed Pomodoro focus
  intervals.
- Timers never start automatically.
- Freeform mode lets a user start tracking, stop when finished, and record the
  actual elapsed focus time without selecting a planned duration.
- Every Pomodoro or freeform focus session requires a work name, work
  description, and focus category. Users can revise these details while the
  session is active. Break intervals record only timing, type, and member.
- Focus sessions and tasks use the same shared work categories.
- Active users can add, rename, and archive work categories.
- Users can optionally link a focus session to an existing task. The task name,
  description, and category prefill the focus form, while the session preserves
  its own historical snapshot.
- Users can continue previous work by starting a new focus session from a prior
  focus session. Its work details and optional task link prefill, while the
  previous session remains unchanged.
- User can start, pause, resume, cancel, and complete a timer.
- A user can have only one active timer of any kind across all devices.
- Timer state survives page refresh and temporary disconnection.
- A timer continues locally during temporary disconnection and submits its final
  state after reconnection. Server state wins if another device changed it.
- Reaching zero automatically completes a Pomodoro and awards Studio XP once,
  but does not start the next timer.
- Finishing a Pomodoro early records its actual elapsed time without awarding
  Studio XP.
- Completing a freeform focus session records its elapsed time but does not
  award Studio XP in MVP.
- Presence shows who is online and who is currently focusing.
- The timer remains usable if realtime presence is unavailable.

Acceptance criteria:

- Remaining time is derived from timestamps, not a fragile client-only counter.
- Freeform elapsed time is derived from timestamps.
- A completed interval cannot award duplicate XP after retry or refresh.
- Cancelled or abandoned intervals do not award XP.
- Conflicting offline updates do not overwrite newer server state.
- Browser completion notifications and sounds are available but disabled until
  the user enables them and grants any required browser permission.

### 6.3 Studio XP

Studio XP makes operational progress visible without scoring individuals.

Required behavior:

- Show the current CCAD level, total XP, and progress to the next level.
- Award XP from approved operational events.
- Show a shared, human-readable recent XP activity feed.
- Preserve attribution to the staff member who caused an event for context and
  auditability.
- Provide a detailed Studio XP drill-down from Home and the app shell without
  adding Studio XP as a primary MVP tab.
- Allow admins to append signed corrections with a required reason.
- Never show personal XP totals, levels, or leaderboards.

Detailed rules are defined in `xp-system.md`.

### 6.4 Tasks

Tasks provide lightweight shared work management.

Required fields:

- Title
- Optional description
- Work category
- Status: backlog, planned, in progress, blocked, or done
- Priority: low, normal, high, or urgent
- Optional assignee
- Optional due date
- Current completion timestamp
- First completion timestamp retained across reopen and recompletion

Required behavior:

- Create, edit, assign, prioritize, complete, reopen, and archive tasks.
- Filter by status, priority, assignee, and due state.
- Use a Kanban board as the primary view and provide a list/table alternate
  view.
- Staff can edit and archive tasks created by other staff.
- Completing a task awards Studio XP once.
- Reopening a task does not remove earned XP; completing it again does not award
  XP unless an admin explicitly creates a corrective event.

### 6.5 Finance

Finance is a simple internal ledger, not an accounting system.

Required fields:

- Entry type: income or expense
- Amount
- Date
- Category
- Description
- Optional note
- Creator and timestamps

Required behavior:

- Create, edit, archive, and review manual entries.
- Show monthly income, expenses, and net total.
- Filter by month, type, and category.
- Display currency consistently.
- Require confirmation before archiving an entry.
- Preserve the recorded category name when category configuration later changes.

Finance entries do not award XP in MVP. This avoids encouraging artificial
financial activity and keeps progression tied to completed work.

### 6.6 Realtime Presence

Realtime presence communicates availability and focus state, not productivity
measurement.

Required statuses:

- Online
- Focusing
- On break
- Away

Presence is ephemeral and must not become a historical attendance log. Details
are defined in `realtime-presence.md`.

### 6.7 Pixel Office

Pixel office is a lightweight visual representation of active staff and their
current status.

Constraints:

- It consumes the same presence contract as other screens.
- It is isolated from business rules and core workflows.
- It must not block or replace accessible status lists.
- It must be possible to remove or redesign it without changing presence,
  focus, task, finance, or XP logic.

### 6.8 Studio Access

Studio Access is a small admin-only operational screen outside the primary MVP
navigation.

Required capabilities:

- Invite future staff by email as staff or admin.
- Keep invitations time-limited and revocable.
- Change member roles and activate or deactivate access.
- Prevent admins from deactivating themselves.
- Require at least one active admin at all times.
- Preserve access changes in append-only history and audit events.

Studio Access is account administration, not a CRM or staff-performance tool.

## 7. Cross-Cutting Requirements

### Security

- Authentication is required for all product routes and data.
- Access is organization-scoped and enforced with database Row Level Security.
- Admin-only actions are enforced server-side.
- Financial records and audit attribution are not exposed outside the
  organization.
- Every durable application-data change is recorded in append-only database
  history, even when the change is not visible in the app.
- Full finance change history is restricted to admins.
- Deactivated staff remain visible as inactive historical attribution.

### Reliability

- Important mutations are idempotent.
- Core workflows show useful loading, empty, error, and retry states.
- Focus timing and saved data tolerate refreshes and short network outages.
- Realtime is an enhancement; its outage must not block core operations.

### Accessibility

- Target WCAG 2.2 AA.
- All core actions are keyboard accessible.
- Status is never conveyed by color alone.
- Motion respects reduced-motion preferences.
- Pixel office has an equivalent text-based representation.

### Performance

- Initial Home content should become useful quickly on a normal connection.
- Realtime subscriptions are created only where needed and cleaned up on exit.
- Large activity lists use pagination or bounded queries.

## 8. Success Signals

During MVP validation, CCAD should assess:

- Staff open Home regularly to orient their day.
- Focus sessions are completed without timer reliability complaints.
- Priority tasks remain current and are completed through the app.
- Monthly finance totals match the manually entered ledger.
- Studio XP feels motivating without feeling like employee surveillance.

These are product signals, not employee performance metrics.

## 9. Delivery Milestones

| Milestone | Scope | Exit condition |
| --- | --- | --- |
| M1 | Home dashboard | Useful dashboard with mocked or seeded data contracts |
| M2 | Focus timer | Reliable personal timer and persisted focus sessions |
| M3 | Studio XP | Idempotent shared XP ledger and level display |
| M4 | Tasks | Shared task lifecycle and completion XP |
| M5 | Finance | Manual ledger and monthly summary |
| M6 | Realtime presence | Online and focus states with graceful degradation |
| M7 | Pixel office | Optional accessible visual layer over presence |
| M8 | Studio Access | Guarded admin invitations and member access |

## 10. Open Product Decisions

- Visual brand direction
- Whether light and dark themes both ship initially
- Finance visibility for future non-admin staff

## 11. Confirmed MVP Settings

- Organization timezone: `America/Vancouver`
- Ledger currency: `CAD`
- Accounts: invite-only email/password login with password recovery
- Initial admins: William and Alice
- Pomodoro interval lengths: fixed at 25, 5, and 15 minutes
- Freeform focus sessions: record elapsed time without awarding XP
- Recorded focus sessions require a work name, description, and editable shared
  category
- Focus sessions and tasks share work categories
- Focus sessions can link to existing tasks and preserve historical work-detail
  snapshots
- Users can continue previous work by starting a new session from an earlier
  session
- Pomodoro sequence: offer one long break after four full focus intervals;
  reaching zero completes the active interval but never auto-starts another
- Active focus-session details: editable after starting
- Early Pomodoro completion: record actual time without awarding XP
- Break records: timing, type, and member only; no work details
- Task completion XP: fixed at 20 XP with no task-size multiplier
- Tasks: Kanban primary view, list/table alternate view, and shared editing
- Home: at-a-glance summaries with drill-down links
- Notifications and sounds: optional and off until enabled by the user
- Focus-session history: retained indefinitely for MVP
- Database history viewer: preserve capability but do not build an MVP screen
- Finance change history: stores full before/after records and is admin-only
- Deactivated members: remain visible as inactive historical attribution
- Infrastructure: use a dedicated `CCAD HQ` Supabase project
- Initial finance categories: tuition, supplies, rent, payroll, software,
  marketing, utilities, and miscellaneous
- Database history: append-only records for every durable application-data
  change

## 12. Phase 9 Pixel Office Implementation Status

Implemented:

- Home keeps the accessible coworking status list as the default view and
  offers Pixel Office as an optional alternate view.
- Pixel Office consumes normalized `PresenceMember` records and never
  subscribes to Supabase directly.
- Online, focusing, break, and away states map to separate visual room zones.
- Member placement is deterministic and owned entirely by the pixel-office
  feature.
- Names and text status equivalents remain available without relying on color
  or room position.
- Empty and unavailable states preserve Home and all core workflows.

Live occupants remain dependent on Supabase repairing the managed Realtime
schema and the Phase 8 authorization migration being applied.

## 13. Phase 10 Studio Access Implementation Status

Implemented:

- Admin-only Studio Access route linked outside primary navigation.
- Fourteen-day staff/admin invitations with refresh and revoke behavior.
- Guarded role and activation changes with self-deactivation and last-admin
  protection.
- Direct authenticated writes to member and invitation tables are revoked.
- Access actions append both normal change history and explicit audit events.
- Inactive member profiles remain readable for historical attribution.
