# Database Schema

## 1. Principles

- PostgreSQL in Supabase is the durable source of truth.
- Every business record is scoped by `organization_id`.
- Authentication identity and organization membership are separate concepts.
- Important history is append-only where practical.
- Archive business records instead of hard-deleting them.
- Use constraints and transactional database functions for critical invariants.
- Record every durable application-data mutation in append-only database change
  history.
- Keep Studio XP as the primary progression ledger, with Character XP in a
  separate lightweight individual ledger.
- Store studio stat impact as contribution metadata, not staff ratings.
- Use `timestamptz` and store timestamps in UTC.
- Generate UUID primary keys.

## 2. Shared Conventions

Unless noted otherwise, durable tables include:

- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Money uses integer minor units, such as cents, to avoid floating-point errors.
Currency uses an uppercase ISO 4217 code.

## 3. Core Tables

### `organizations`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `name` | text | `Cloud Centre of Art & Design` |
| `slug` | text | Unique stable identifier |
| `timezone` | text | IANA timezone |
| `currency_code` | text | Default ledger currency |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update |

Constraints:

- Unique `slug`
- Non-empty `name`
- Three-character `currency_code`

### `profiles`

Application profile records are the app-facing companion to Supabase Auth
users. Supabase Auth remains the identity provider; the public schema should not
duplicate password, session, or credential fields.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key; references `auth.users.id` |
| `display_name` | text | Staff-facing name |
| `avatar_url` | text nullable | Optional avatar |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update |

Profiles do not store XP or permission roles.

User cards may show Character Level, but that level should be derived from
`character_xp_events` rather than stored as mutable profile state.

### `organization_members`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid | References `organizations.id` |
| `user_id` | uuid | References `profiles.id` |
| `role` | enum | `staff` or `admin` |
| `is_active` | boolean | Defaults true |
| `joined_at` | timestamptz | Membership start |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update |

Constraints:

- Unique pair: `organization_id`, `user_id`

### `organization_invitations`

Invite-only onboarding records paired with privileged Supabase Auth
invitations.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid | References `organizations.id` |
| `email` | text | Lowercase invited email |
| `role` | enum | `staff` or `admin` |
| `status` | enum | `pending`, `accepted`, `revoked`, or `expired` |
| `invited_by_member_id` | uuid nullable | Admin attribution |
| `expires_at` | timestamptz nullable | Optional expiry |
| `accepted_at` | timestamptz nullable | Acceptance time |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update |

Constraints:

- At most one pending invitation per organization and email
- Only admins can read or manage invitations
- A new Auth user with a matching valid pending invitation receives an active
  membership and the invitation is marked accepted

### `tasks`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid | Organization scope |
| `title` | text | Required |
| `description` | text nullable | Optional detail |
| `work_category_id` | uuid | References `work_categories.id` |
| `work_category_name` | text | Historical category-name snapshot |
| `status` | enum | `backlog`, `planned`, `in_progress`, `blocked`, `done` |
| `priority` | enum | `low`, `normal`, `high`, `urgent` |
| `assignee_member_id` | uuid nullable | References `organization_members.id` |
| `xp_value` | integer nullable | Future Studio XP value override |
| `studio_stat_impact` | jsonb | Optional Stability/Reputation/Creativity/Community impact |
| `blocked_reason` | text nullable | Required product context when blocked |
| `handoff_target_member_id` | uuid nullable | Optional intended handoff recipient |
| `due_at` | timestamptz nullable | Optional due time |
| `completed_at` | timestamptz nullable | Set while the task is currently done |
| `first_completed_at` | timestamptz nullable | Immutable first completion time |
| `created_by_member_id` | uuid | Creator attribution |
| `completed_by_member_id` | uuid nullable | Member who completed the task |
| `archived_at` | timestamptz nullable | Soft archive |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update |

Constraints:

- Non-empty `title`
- Work category belongs to the same organization
- Assignee and creator must belong to the same organization
- `completed_at` is required when `status = 'done'`
- `first_completed_at` is retained when a task is reopened
- Product-facing future statuses are Backlog, Today, This Week, Blocked,
  Waiting, and Completed. Keep any migration from current enum values explicit.
- Studio stat impact must only contain approved stat keys and non-negative
  contribution values.

Recommended indexes:

- `(organization_id, status, archived_at)`
- `(organization_id, assignee_member_id, status)`
- `(organization_id, work_category_id, status)`
- `(organization_id, due_at)` where not archived

### `focus_sessions`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid | Organization scope |
| `member_id` | uuid | Session owner |
| `work_name` | text nullable | Required for focus work; null for breaks |
| `work_description` | text nullable | Required for focus work; null for breaks |
| `work_category_id` | uuid nullable | Required for focus work; null for breaks |
| `work_category_name` | text nullable | Historical category-name snapshot |
| `linked_task_id` | uuid nullable | Optional source task reference |
| `continued_from_session_id` | uuid nullable | Optional prior focus session |
| `mode` | enum | `pomodoro` or `freeform` |
| `kind` | enum | `focus`, `short_break`, `long_break` |
| `state` | enum | `running`, `paused`, `completed`, `cancelled` |
| `planned_duration_seconds` | integer nullable | Required for Pomodoro; null for freeform |
| `started_at` | timestamptz | First start |
| `resumed_at` | timestamptz nullable | Current freeform running interval start |
| `ends_at` | timestamptz nullable | Expected end while running |
| `paused_at` | timestamptz nullable | Current pause start |
| `remaining_seconds_at_pause` | integer nullable | Resume source |
| `elapsed_seconds_at_pause` | integer nullable | Freeform resume source |
| `recorded_duration_seconds` | integer nullable | Final elapsed focus time |
| `completed_at` | timestamptz nullable | Completion time |
| `cancelled_at` | timestamptz nullable | Cancellation time |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update |

Constraints:

- Durations, remaining seconds, and elapsed seconds are non-negative.
- Focus sessions require non-empty `work_name`, non-empty `work_description`,
  and a same-organization work category.
- Linked tasks and prior sessions must belong to the same organization.
- Work name, description, and category are historical snapshots and do not
  change when a linked task or category is later edited.
- Break sessions do not require work metadata.
- Pomodoro sessions require a planned duration; freeform sessions do not.
- Freeform sessions use the `focus` kind.
- Break sessions use Pomodoro mode.
- State-specific timestamps are internally consistent.
- At most one active session of any kind per member, enforced by a partial
  unique index for `running` and `paused` states.
- `record_past_focus_session` creates an already-completed focus session for
  the current member, snapshots the category name, and awards Pomodoro XP only
  when the logged duration is at least 25 minutes.

Recommended indexes:

- `(organization_id, member_id, created_at desc)`
- `(organization_id, state)` for active-session queries
- `(organization_id, work_category_id, created_at desc)`
- `(organization_id, linked_task_id, created_at desc)`

### `work_categories`

Shared categories for tasks and recorded focus work.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid | Organization scope |
| `name` | text | Required category name |
| `created_by_member_id` | uuid | Creator attribution |
| `archived_at` | timestamptz nullable | Soft archive |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update |

Constraints:

- Unique active category name per organization
- Non-empty `name`
- Historical tasks and sessions retain their category reference after category
  archival

### `xp_events`

Append-only ledger of shared Studio XP awards and corrections.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid | Organization receiving XP |
| `event_type` | enum | Approved XP source or `correction` |
| `points` | integer | Positive award or signed admin correction |
| `source_type` | text | For example `task` or `focus_session` |
| `source_id` | uuid nullable | Durable source record |
| `idempotency_key` | text | Unique award identity |
| `actor_member_id` | uuid nullable | Attribution |
| `description` | text | Human-readable activity text |
| `metadata` | jsonb | Small versioned context only |
| `created_at` | timestamptz | Award time |

Constraints:

- Unique pair: `organization_id`, `idempotency_key`
- Non-zero `points`
- Only admin-created `correction` events may be negative
- No update or delete for normal application roles

Recommended indexes:

- `(organization_id, created_at desc)`
- `(organization_id, event_type, created_at desc)`
- `(organization_id, source_type, source_id)`

Current total XP is `sum(points)` for the organization. A cached summary may be
added only if measurements show the ledger query is insufficient.

### `studio_xp_events`

Suggested explicit future name for the organization-level Studio XP ledger if
the project outgrows the generic `xp_events` name. This may be a rename or
compatibility view over `xp_events`; do not create a competing ledger without a
migration plan.

Recommended columns match `xp_events` with these naming clarifications:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid | Organization receiving XP |
| `event_type` | enum | Approved Studio XP source or `correction` |
| `points` | integer | Positive award or signed admin correction |
| `source_type` | text | For example `task`, `focus_session`, `handoff`, or `weekly_quest` |
| `source_id` | uuid nullable | Durable source record |
| `idempotency_key` | text | Unique award identity |
| `actor_member_id` | uuid nullable | Attribution |
| `studio_stat_impact` | jsonb | Optional Stability/Reputation/Creativity/Community impact |
| `description` | text | Human-readable activity text |
| `metadata` | jsonb | Small versioned context only |
| `created_at` | timestamptz | Award time |

### `character_xp_events`

Append-only ledger of lightweight individual Character XP.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid | Organization scope |
| `member_id` | uuid | Member receiving Character XP |
| `event_type` | enum | `focus_session`, `task`, `handoff`, `streak`, `maintenance`, or `correction` |
| `points` | integer | Positive award or signed admin correction |
| `source_type` | text | Durable source type |
| `source_id` | uuid nullable | Durable source record |
| `idempotency_key` | text | Unique award identity per member |
| `actor_member_id` | uuid nullable | Acting or correcting member |
| `description` | text | Human-readable activity text |
| `metadata` | jsonb | Small versioned context only |
| `created_at` | timestamptz | Award time |

Constraints:

- Unique triple: `organization_id`, `member_id`, `idempotency_key`
- Positive points for normal events
- Negative points only for admin corrections with an audit reason
- No update or delete for normal application roles
- Do not use this table to build leaderboards or rankings

### `studio_stats`

Suggested configuration and summary table for the four contribution categories.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid | Organization scope |
| `stat_key` | enum | `stability`, `reputation`, `creativity`, or `community` |
| `display_name` | text | Staff-facing label |
| `description` | text | What the stat represents |
| `sort_order` | integer | Stable display order |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update |

Stat totals can be calculated from task, quest, and XP metadata unless measured
performance requires a cached summary.

### `weekly_quests`

Shared weekly goals that create direction without ranking staff.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid | Organization scope |
| `title` | text | Required |
| `description` | text nullable | Context and outcome |
| `status` | enum | `planned`, `active`, `completed`, or `archived` |
| `xp_value` | integer | Studio XP award value |
| `studio_stat_impact` | jsonb | Optional stat contribution |
| `owner_member_id` | uuid nullable | Optional owner; quests may be shared |
| `starts_at` | timestamptz | Start time |
| `due_at` | timestamptz | Due time |
| `completed_at` | timestamptz nullable | Completion time |
| `completed_by_member_id` | uuid nullable | Completion attribution |
| `created_by_member_id` | uuid | Creator attribution |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update |

### `handoffs`

Lightweight ownership-transfer records.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid | Organization scope |
| `title` | text | Required |
| `context` | text | What the receiver needs to know |
| `assigned_member_id` | uuid | Receiver |
| `created_by_member_id` | uuid | Sender |
| `linked_task_id` | uuid nullable | Optional related task |
| `status` | enum | `open`, `accepted`, `completed`, `cancelled`, or `archived` |
| `due_at` | timestamptz nullable | Optional due time |
| `completed_at` | timestamptz nullable | Completion time |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update |

Handoffs exist to reduce ambiguity. They must not become a blame ledger.

### `finance_categories`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid | Organization scope |
| `name` | text | Display name |
| `entry_type` | enum | `income` or `expense` |
| `is_active` | boolean | Available for new entries |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update |

Constraints:

- Unique active category name per organization and entry type

### `finance_entries`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid | Organization scope |
| `entry_type` | enum | `income` or `expense` |
| `amount_minor` | bigint | Positive amount in minor units |
| `currency_code` | text | ISO currency |
| `entry_date` | date | Ledger date |
| `category_id` | uuid | References `finance_categories.id` |
| `category_name` | text | Historical category-name snapshot |
| `description` | text | Required summary |
| `note` | text nullable | Optional detail |
| `recurrence` | enum | `none`, `weekly`, `monthly`, or `yearly` marker |
| `created_by_member_id` | uuid | Creator attribution |
| `archived_at` | timestamptz nullable | Soft archive |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update |

Constraints:

- `amount_minor > 0`
- Category entry type and organization match the entry
- Creator belongs to the organization
- Category name is retained when category configuration later changes
- Recurrence is a marker only; future ledger rows are not generated
  automatically.

Recommended indexes:

- `(organization_id, entry_date desc)` where not archived
- `(organization_id, entry_type, entry_date)` where not archived
- `(organization_id, category_id, entry_date)` where not archived

### `students`

Internal student records for active and archived mentorship relationships.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid | Organization scope |
| `name` | text | Required display name |
| `grade` | text | Student grade or school stage |
| `program` | enum | `Portfolio`, `AP Drawing`, `Animation`, `Trial`, or `Other` |
| `status` | enum | `Active`, `Trial`, `Paused`, or `Completed` |
| `main_goal` | text | High-level student goal |
| `current_focus` | text | Current studio focus |
| `next_action` | text | Next staff action |
| `next_class_date` | date nullable | Upcoming class date |
| `last_class_date` | date nullable | Most recent class date |
| `follow_up_needed` | boolean | Whether staff should follow up |
| `permission_to_post` | enum | `Yes`, `No`, or `Pending` |
| `notes` | text | Internal notes |
| `strengths` | text[] | Student strengths |
| `needs_support` | text[] | Support areas |
| `application_targets` | text[] | Target schools or programs |
| `parent_notes` | text | Parent communication context |
| `payment_notes` | text | Payment/package context |
| `archived_at` | timestamptz nullable | Soft archive |
| `created_by_member_id` | uuid | Creator attribution |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update |

### `class_logs`

Session notes attached to a student.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid | Organization scope |
| `student_id` | uuid | References `students.id` |
| `log_date` | date | Class/session date |
| `teacher` | enum | `William`, `Alice`, `Gerald`, or `Other` |
| `duration` | text | Human-readable class length |
| `worked_on` | text | What happened in class |
| `feedback_given` | text | Critique or guidance given |
| `homework_assigned` | text | Homework or next work |
| `materials_needed` | text | Materials or assets needed |
| `parent_update_sent` | boolean | Whether parent update was sent |
| `next_class_focus` | text | Next session focus |
| `image_url` | text nullable | Future storage hook |
| `created_by_member_id` | uuid | Creator attribution |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update |

### `marketing_content_ideas`

Durable idea pipeline records for the Marketing workspace.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid | Organization scope |
| `title` | text | Required idea title |
| `account` | enum | `CCAD`, `William`, `Alice`, or `Mascot` |
| `owner` | enum | `William`, `Alice`, `Team`, or `Other` |
| `content_lane` | text | Content category or lane |
| `audience` | text | Intended audience |
| `format` | text | Post format |
| `priority` | enum | `Low`, `Medium`, or `High` |
| `deadline` | date nullable | Optional deadline |
| `cta` | text | Call to action |
| `status` | enum | Pipeline status |
| `notes` | text | Internal planning notes |
| `archived_at` | timestamptz nullable | Soft archive |
| `created_by_member_id` | uuid | Creator attribution |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update |

### `studio_notes`

Casual internal notes shown on Home.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid | Organization scope |
| `note_text` | text | Required note body |
| `author` | enum | `William`, `Alice`, or `Team` |
| `category` | enum | `Reminder`, `Content Idea`, `Student Follow-up`, `Admin`, `Website`, `Marketing`, or `Random` |
| `priority` | enum | `Normal` or `Important` |
| `pinned` | boolean | Pinned notes sort first |
| `archived_at` | timestamptz nullable | Soft archive/delete |
| `created_by_member_id` | uuid | Creator attribution |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update |

All four tables use organization-member RLS policies, updated-at triggers, and
change-history triggers. The migration seeds starter Studio Notes per existing
organization when no notes already exist.

### `change_history`

Append-only database history for every insert, update, and delete on durable
application tables, including inserts into append-only ledgers. The table is an
internal operational record and does not require an MVP user interface.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid nullable | Organization scope when applicable |
| `table_name` | text | Changed application table |
| `record_id` | uuid nullable | Changed record |
| `operation` | enum | `insert`, `update`, or `delete` |
| `actor_user_id` | uuid nullable | Auth user when available |
| `actor_member_id` | uuid nullable | Organization member when available |
| `source` | text | For example `app`, `admin`, `migration`, or `system` |
| `changed_fields` | text[] | Fields changed by an update |
| `old_data` | jsonb nullable | Record state before change |
| `new_data` | jsonb nullable | Record state after change |
| `occurred_at` | timestamptz | Change time |

Requirements:

- Populate through database triggers, not only application code.
- Cover every durable application table, including append-only tables.
- Exclude secrets and redact fields explicitly classified as sensitive.
- Full finance-entry history may include notes and is readable only by admins.
- Do not create history records for `change_history` itself.
- Normal application roles cannot update or delete history.
- Retain history unless an explicit future retention policy is approved.

### `audit_events`

Use for security-significant or administrative events that are not adequately
represented as a row change, such as an access denial or admin correction
reason. This complements, rather than replaces, `change_history`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid | Organization scope |
| `actor_member_id` | uuid nullable | Acting member |
| `action` | text | Stable action identifier |
| `entity_type` | text | Affected entity type |
| `entity_id` | uuid nullable | Affected entity |
| `details` | jsonb | Sanitized change context |
| `created_at` | timestamptz | Event time |

Audit events are append-only. Do not put secrets or unnecessary finance note
content into `details`. All changes to durable records, including finance
entries, are also captured in `change_history`.

### `application_incidents`

Lightweight references for authenticated browser failures. Full messages and
stack traces remain in deployment runtime logs.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid | Organization scope |
| `member_id` | uuid | Member experiencing the failure |
| `incident_key` | uuid | Idempotent incident reference |
| `source` | text | Approved browser incident source |
| `route` | text | Route where the failure occurred |
| `digest` | text nullable | Next.js server-error digest when available |
| `deployment_id` | text nullable | Deployment correlation reference |
| `created_at` | timestamptz | Incident time |

Only admins can read incident references. Authenticated inserts use a
membership-checking database function. Incident records exclude messages,
stacks, request data, form values, and authentication material.

## 4. Realtime Data

Realtime presence is not stored as a durable table. It uses Supabase Realtime
Presence channels and a small ephemeral payload described in
`realtime-presence.md`.

### `presence_state`

Suggested future current-state cache only if product needs server-rendered
presence cards or cross-session recovery. The current implementation does not
store presence in Postgres.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `organization_id` | uuid | Organization scope |
| `member_id` | uuid | Member represented |
| `status` | enum | `online`, `focusing`, `paused`, `idle`, `break`, `away`, or `offline` |
| `current_task_id` | uuid nullable | Optional current task reference |
| `focus_session_id` | uuid nullable | Optional active focus session |
| `focus_category` | text nullable | Ambient category label |
| `focus_started_at` | timestamptz nullable | Elapsed-time display support |
| `focus_ends_at` | timestamptz nullable | Remaining-time display support |
| `last_seen_at` | timestamptz | Current-state freshness |
| `updated_at` | timestamptz | Last update |

Rules:

- Treat this table as replaceable current state, not durable history.
- Exclude it from append-only application-data history unless a future decision
  explicitly approves current-state auditing.
- Do not use it to calculate attendance, hours worked, individual focus totals,
  or productivity scores.
- Prefer Supabase Realtime Presence when a durable current-state cache is not
  required.

The Phase 8 migration contains organization-member policies for the managed
`realtime.messages` authorization surface. Private-only channels are enabled,
Supabase has initialized the managed Realtime relations, and the CCAD
organization-member send/receive policies are applied. Do not manually create
or modify Supabase-managed Realtime tables.

Task or finance Postgres-change subscriptions may be added later if a concrete
workflow needs them. They are not required for initial CRUD behavior.

## 5. Transactional Functions

Critical multi-record operations should use narrowly scoped database functions:

### Complete focus session

- Authorize the member.
- Transition an eligible focus session to `completed`.
- Insert one XP event using a deterministic idempotency key only for an eligible
  completed Pomodoro focus interval.
- Return the completed session and award result.

### Complete freeform focus session

- Authorize the member.
- Validate the session against current server state.
- Record the elapsed duration derived from timestamps.
- Transition the session to `completed`.
- Do not insert an XP event in MVP.

### Complete task

- Authorize the member.
- Transition the task to `done`.
- Preserve the first `completed_at`.
- Insert one XP event using a deterministic idempotency key.
- Return the task and award result.

### Correct XP

- Require admin role.
- Insert a signed `correction` event.
- Insert an audit event.
- Never edit historical XP events.

## 6. Row Level Security

Enable RLS on every public table.

Baseline policy intent:

- Active members can read records for their organization.
- Active members can read organization tasks and use guarded task RPCs to
  create, update, transition, and archive them; direct task writes are revoked.
- Active members can create, rename, and archive shared work categories.
- Active members can create finance entries and update or archive entries they
  created; admins can update or archive any organization finance entry.
- Only admins can manage organization membership, categories, or XP corrections.
- Only admins can read full finance change history.
- No normal role can update or delete XP or audit events.
- No normal role can update or delete change-history records.
- Cross-organization access is denied even when a record ID is known.

Reusable membership checks should be implemented carefully to avoid recursive
RLS policies and unnecessary per-row work.

## 7. Data Retention

- Presence: ephemeral, no attendance history.
- Tasks: archive rather than delete.
- Finance: archive rather than delete; preserve auditability.
- Focus sessions: retain completed and cancelled sessions indefinitely for MVP.
- XP events and audit events: append-only and retained.
- Application incidents: append-only and retained until a formal monitoring
  retention policy is approved.
- Change history: append-only and retained.

## 8. Confirmed Schema Defaults

- Organization timezone: `America/Vancouver`
- Currency: `CAD`
- Initial income categories: tuition and miscellaneous
- Initial expense categories: supplies, rent, payroll, software, marketing,
  utilities, and miscellaneous
- Focus-session history is retained indefinitely for MVP.
- Deactivated members remain available for historical attribution.

## 9. Phase 2 Applied Schema

The dedicated Supabase project currently contains:

- `organizations`, `profiles`, `organization_members`,
  `organization_invitations`, `work_categories`, `change_history`, and
  `audit_events`
- RLS enabled on every public table
- Admin/member policies scoped through private security-definer helpers
- Updated-at triggers on mutable foundation tables
- Change-history triggers on every durable foundation table except
  `change_history` itself
- An Auth-user trigger that creates a profile and accepts matching invitations
- A seeded `ccad` organization using `America/Vancouver` and `CAD`

Later feature migrations add the detailed workflows following the contracts
above.

## 10. Phase 3 Applied Schema

Phase 3 adds:

- `tasks`, `xp_events`, `finance_categories`, and `finance_entries`
- Composite foreign keys that enforce same-organization task, member, and
  finance-category references
- RLS policies for member task access, append-only XP reads, admin-managed
  finance categories, and owner/admin finance updates
- Updated-at and change-history triggers for every new mutable or durable table
- Covering indexes for query paths and composite foreign keys
- Nine seeded finance categories
- Pending admin invitations for `alice.wen112@gmail.com` and
  `williamyfsun@gmail.com`

The Auth-user trigger now rejects emails without a valid pending organization
invitation, then creates the profile and membership and marks matching
invitations accepted.

## 11. Phase 4 Applied Schema

Phase 4 adds:

- `focus_sessions` with same-organization references to members, categories,
  tasks, and prior sessions
- Fixed Pomodoro focus, short-break, and long-break durations plus freeform
  elapsed-time recording
- A partial unique index enforcing one running or paused session per member
- Member-readable RLS with owner-authorizing database RPCs for every timer
  transition
- Atomic, idempotent full-Pomodoro completion and Studio XP insertion
- Updated-at and append-only change-history triggers for focus sessions
- The six approved initial shared work categories

The authenticated focus RPCs are intentionally `security definer` functions.
Each function performs explicit active-member and session-owner authorization
before mutating data, while direct focus-session table mutations remain
revoked.

## 12. Phase 5 Applied Schema

Phase 5 adds:

- `application_incidents` with admin-only reads, authenticated idempotent
  recording, and append-only change history
- A reusable database Studio-level function matching the approved quadratic
  progression formula
- An admin-only Studio XP correction RPC that requires a reason, prevents
  totals below zero, is idempotent across retries, and appends rather than edits
  ledger events
- Previous/new Studio-level results from full-Pomodoro completion
- Serialized Studio XP mutations so concurrent changes produce reliable shared
  totals and level transitions

The authenticated incident and XP RPCs are intentionally `security definer`
functions with explicit membership, ownership, or admin authorization and empty
`search_path` settings.

## 13. Phase 6 Applied Schema

Phase 6 adds:

- Required task category-name snapshots and immutable first-completion times
- Guarded create, detail-update, status-transition, and archive task RPCs
- Revoked direct task writes while retaining organization-member reads
- Atomic first-completion task XP with a deterministic one-award key
- Reopen and recompletion behavior that preserves first completion and earned XP

The authenticated task RPCs are intentionally `security definer` functions.
Each verifies active organization membership and same-organization category and
assignee references, uses an empty `search_path`, and preserves append-only
change history.

## 14. Phase 7 Applied Schema

Phase 7 adds:

- Required historical category-name snapshots on finance entries
- Guarded create, update, and archive finance-entry RPCs
- Revoked direct finance-entry writes while retaining member reads
- Organization-derived currency and active matching category enforcement
- Creator-or-admin authorization for edits and archive operations

The authenticated Finance RPCs are intentionally `security definer` functions.
Each verifies active organization membership and ownership or admin permission,
uses an empty `search_path`, and preserves append-only change history.

## 15. Phase 8 Realtime Authorization

Phase 8 adds no durable presence table or presence history. Its migration adds
read and insert policies to Supabase's managed `realtime.messages` table so
only active organization members can receive or track presence on
`org:{organization_id}:presence`.

Private-only Realtime channels are enabled and the organization-member policies
are applied. The remaining verification is live two-user presence testing.

## 16. Phase 10 Applied Studio Access Schema

Phase 10 adds no new durable tables. It adds guarded access-management
functions:

- `create_organization_invitation` creates or refreshes a pending invitation
  for 14 days and rejects existing member emails.
- `revoke_organization_invitation` idempotently revokes pending invitations.
- `update_organization_member_access` changes role and activation while
  rejecting self-deactivation and preserving at least one active admin.

Direct authenticated inserts and updates on `organization_members` and
`organization_invitations` are revoked. The guarded functions require an active
organization admin, use an empty `search_path`, and are not executable by
anonymous users. Access actions append explicit `audit_events` and the existing
change-history triggers preserve the full row changes.

The shared-profile helper now permits active organization members to read
inactive coworkers' profiles for approved historical attribution.

## 17. Character XP And Weekly Quests Applied Schema

This phase adds:

- `character_xp_events`, an append-only organization-scoped ledger linked to
  individual `organization_members`.
- `weekly_quests`, editable shared quest records with status, studio stat,
  Studio XP reward, Character XP reward, numeric progress, due date, completion
  attribution, archive state, updated-at triggers, and change history.
- `character_xp_event_type`, `weekly_quest_status`, and `studio_stat_key`
  enums.
- Guarded Weekly Quest RPCs for create, update, complete, and archive.
- A private Character XP award helper used by task, focus, and quest
  completion flows.
- Backfilled Character XP rows from existing eligible Studio XP task and focus
  events.
- `weekly_quest_completed` as an additional Studio XP event type.

Direct authenticated writes to Character XP and Weekly Quest tables are revoked.
Active organization members can read organization rows through RLS, while all
mutations go through guarded functions that preserve idempotent XP awards and
append-only history.
