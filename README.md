# CCAD HQ

CCAD HQ is an internal command center for Cloud Centre of Art & Design. It
brings daily studio operations into one calm workspace: a Home dashboard,
Pomodoro Focus Room, task management, basic finance tracking, shared Studio XP,
realtime coworking presence, and a lightweight pixel-office visualization.

The core product idea is simple:

> The organization is the character. CCAD levels up, not individual users.

## Status

Phases 1 through 7 are complete. Phase 8 realtime-presence application code is
implemented; final private-channel activation in Supabase is pending. The
responsive app shell, four MVP tabs, invite-only authentication, durable Home
summaries, persisted Focus Room, shared Studio XP, detailed Tasks and Finance,
crash monitoring, RLS policies, database change history, and automated project
checks are in place.

## Primary Users

- William
- Alice
- Future CCAD staff

## MVP

The first release has four primary tabs:

- **Home:** at-a-glance outstanding tasks, finance summary, Studio XP progress,
  and links into detailed sections
- **Focus Room:** Pomodoro timer, freeform time recording, and shared coworking
  presence
- **Tasks:** Kanban-first shared task planning with alternate views
- **Finance:** basic manual income and expense tracking

Pixel office is a later visualization layer, not a dependency of the core
workflows.

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
- Vercel URL: `https://ccadhq.vercel.app` (source publication pending)

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
publishable key. Never place a service-role key in a browser-visible variable.

The application routes are:

- `/` - Home dashboard
- `/focus-room` - Persisted Pomodoro and freeform Focus Room
- `/studio-xp` - Detailed shared Studio XP progress and activity
- `/tasks` - Detailed shared Kanban and list task management
- `/finance` - Detailed monthly income and expense ledger
- `/login` - Invite-only magic-link sign-in
- `/access-pending` - Authenticated user without active membership

Workspace routes require an authenticated user with an active CCAD membership.
New staff must have a pending `organization_invitations` record before
requesting their first magic link. The database rejects Auth-user creation for
emails without a valid pending invitation. William and Alice are allowlisted as
pending admins and will receive active admin memberships when they request
their first sign-in links.

Before hosted sign-in testing or deployment, allow the app URL and
`/auth/confirm` callback in Supabase Auth redirect settings.

Home reads live task counts, Studio XP progress and activity, and current-month
finance totals through a typed Supabase adapter. Home and Focus Room now consume
a shared ephemeral presence provider with live, stale, connecting, unavailable,
focus, break, online, and away states.

Before presence can go live, enable private-only channels in the Supabase
Realtime settings so Supabase initializes `realtime.messages`, then apply
`20260604122400_phase_8_realtime_presence.sql`.

The Focus Room supports persisted fixed Pomodoros, freeform time recording,
pause/resume, early completion, active detail editing, optional task links,
previous-work continuation, shared category management, and idempotent Studio
XP for full Pomodoro focus intervals.

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
- [Studio XP system](docs/xp-system.md)
- [UI guidelines](docs/ui-guidelines.md)
- [Asset guidelines](docs/assets.md)
- [Error monitoring](docs/error-monitoring.md)
- [Build log](docs/build-log.md)
- [Development log](docs/dev-log.md)
- [Agent guide](AGENTS.md)

## Product Boundaries

CCAD HQ is an internal operations tool. It is not a student portal, parent
portal, LMS, CRM, payment processor, chat app, video app, AI product, or
calendar integration.

## Implementation Standard

Implementation should favor small feature modules, explicit interfaces, and
separation between business logic, data access, and UI. Design tokens and
replaceable page sections should keep the interface easy to revise as the
studio learns what it needs.
