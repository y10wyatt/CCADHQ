# CCAD HQ

CCAD HQ is an internal command center for Cloud Centre of Art & Design. It
brings daily studio operations into one calm workspace: a Dashboard, admissions
Leads CRM, Student records, Marketing planning, Finance tracking, Tasks, shared
Studio XP, lightweight Character XP direction, Weekly Quests, realtime coworking
presence, and a lightweight pixel-office visualization.

The core product idea is simple:

> The organization is the character. Studio Level is primary; Character Level is
> lightweight, non-ranking context for individual work rhythm.

## Status

Phases 1 through 10 are complete, including private Supabase Realtime presence
authorization. The responsive app shell, admissions navigation, invite-only
authentication, admin-managed staff access, durable Dashboard summaries,
persisted Focus Room, shared Studio XP, detailed Tasks and Finance, Students,
Marketing, Leads CRM, optional Pixel Office, Character XP, editable Weekly
Quests, crash monitoring, RLS policies, database change history, and automated
project checks are in place.

## Primary Users

- William
- Alice
- Future CCAD staff

## Primary Workspaces

The current primary navigation is:

- **Dashboard:** at-a-glance outstanding tasks, finance summary, Studio XP
  progress, Leads overview, Character XP cards, Weekly Quests, and links into
  detailed sections
- **Leads:** admissions pipeline for prospective students, follow-ups,
  attribution, and conversion to Students
- **Students:** enrolled student records, class logs, parent context, and next
  actions
- **Marketing:** internal editorial planning and content idea pipeline
- **Finance:** basic manual income and expense tracking
- **Tasks:** Kanban-first shared task planning with alternate views
- **Settings:** organization context, staff invitations, and account access
  management

Pixel Office is an optional Home view over normalized presence and is not a
dependency of the core workflows.

## Build Order

1. Home dashboard
2. Focus Room timer
3. Studio XP system
4. Tasks
5. Finance
6. Realtime presence
7. Pixel office

## Technology

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Postgres and Auth
- Supabase Realtime
- Vercel

## Infrastructure

- Supabase project: `CCAD HQ`
- Supabase project reference: `nhxwyybrfeflekliookp`
- Supabase region: `ca-central-1`
- Vercel project: `ccadhq`
- Vercel URL: `https://ccadhq.vercel.app`
- GitHub repository: `https://github.com/y10wyatt/CCADHQ`

## Local Development

Requirements:

- Node.js 20.9 or newer
- npm 11 or compatible

Commands:

```text
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

Copy `.env.example` to `.env.local` and provide the Supabase project URL and
publishable key. Set `NEXT_PUBLIC_APP_URL` to the environment's canonical app
origin. Never place a service-role key in a browser-visible variable.

The application routes are:

- `/` - Dashboard
- `/leads` - Admissions leads Kanban, filters, and attribution
- `/leads/[leadId]` - Lead profile and activity timeline
- `/focus-room` - Persisted Pomodoro and freeform Focus Room
- `/studio-xp` - Detailed shared Studio XP progress and activity
- `/tasks` - Detailed shared Kanban and list task management
- `/finance` - Detailed monthly income and expense ledger
- `/students` - Student records
- `/students/[studentId]` - Student profile and class logs
- `/marketing` - Marketing planning workspace
- `/team` - Legacy redirect to Settings
- `/settings` - Organization settings, staff invitations, and account access
- `/studio-access` - Legacy redirect to Settings
- `/login` - Invite-only email/password sign-in and account setup
- `/reset-password` - Password recovery completion
- `/access-pending` - Authenticated user without active membership

Workspace routes require an authenticated user with an active CCAD membership.
New staff must have a pending `organization_invitations` record before
creating their password account. The database rejects Auth-user creation for
emails without a valid pending invitation. William and Alice are allowlisted as
admins. Existing accounts created through the earlier magic-link flow must use
Forgot password once to establish a password.

Admins manage future staff from Settings. Invitations permit the email address
to create an account for 14 days. Role and activation changes use guarded
database functions, preserve append-only history, prevent self-deactivation,
and retain at least one active admin.

For production authentication, configure Supabase Auth URL Configuration with:

- Site URL: `https://ccadhq.vercel.app`
- Redirect URL: `https://ccadhq.vercel.app/auth/confirm`
- Local Redirect URL: `http://localhost:3000/auth/confirm`

Supabase falls back to the Site URL when the requested callback is not on the
redirect allowlist. Keep production callback URLs exact.

Home reads live task counts, Studio XP progress and activity, and current-month
finance totals through a typed Supabase adapter. Home also reads active members,
Character XP events, and editable Weekly Quests from Supabase. Home and Focus
Room now consume a shared ephemeral presence provider with live, stale,
connecting, unavailable, focus, break, online, and away states. Home can switch
between the default accessible status list and an isolated Pixel Office
visualization.

Private-only Realtime channels are enabled and the Phase 8 organization-member
policies are applied to `realtime.messages`. Live presence should be verified
with two signed-in staff accounts after deployment.

The Focus Room supports persisted fixed Pomodoros, freeform time recording,
pause/resume, early completion, active detail editing, optional task links,
previous-work continuation, shared category management, and idempotent Studio
XP for full Pomodoro focus intervals.

Leads supports a CCAD-specific admissions Kanban from first inquiry to
enrollment. Each lead tracks student, parent, admissions, marketing source,
pipeline value, assigned staff, follow-up dates, notes, and timeline activity.
Moving a lead to Enrolled asks for confirmation, creates a Student record,
preserves the original lead history, links both records, removes the lead from
the active pipeline, and opens the Student profile.

Studio XP has a detailed drill-down without becoming a primary MVP tab. It
shows live organization-wide progress, attributed shared activity, and
admin-only signed corrections. Unexpected authenticated browser failures create
lightweight incident references while full server diagnostics stay in
structured runtime logs.

## Documentation

- [Product specification](docs/product-spec.md)
- [System architecture](docs/system-architecture.md)
- [Database schema](docs/database-schema.md)
- [Realtime presence](docs/realtime-presence.md)
- [Studio and Character XP system](docs/xp-system.md)
- [UI guidelines](docs/ui-guidelines.md)
- [Asset guidelines](docs/assets.md)
- [Error monitoring](docs/error-monitoring.md)
- [Build log](docs/build-log.md)
- [Development log](docs/dev-log.md)
- [Agent guide](AGENTS.md)

## Product Boundaries

CCAD HQ is an internal operations tool. It is not a student portal, parent
portal, LMS, generic enterprise CRM, payment processor, chat app, video app, AI
product, or calendar integration. Its CRM scope is limited to CCAD admissions
leads and enrollment conversion.

## Implementation Standard

Implementation should favor small feature modules, explicit interfaces, and
separation between business logic, data access, and UI. Design tokens and
replaceable page sections should keep the interface easy to revise as the
studio learns what it needs.
