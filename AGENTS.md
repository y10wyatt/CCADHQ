# CCAD HQ Agent Guide

This repository is for CCAD HQ, the internal command center for Cloud Centre of
Art & Design.

## Product Principle

The organization is the character. CCAD earns Studio XP and levels up through
the combined work of its staff. Studio XP and Studio Level are the primary
progression systems.

Individual activity may be recorded for accountability and lightweight
Character XP, but character progression must remain secondary, non-punitive,
and non-ranking. The product must not create leaderboards, personal productivity
scores, winner/loser language, or rankings by staff worth.

## Office Psychology Principles

CCAD HQ should create visibility, momentum, and shared accountability without
feeling like surveillance.

Design rules:

- Show current work state, not personal judgment.
- Avoid shame mechanics, productivity scores, and punitive streak loss.
- Use light competition through character levels, streaks, and contribution
  summaries.
- Keep Studio Level as the primary progression system.
- Make invisible operational work visible and valuable.
- Represent different work types as different forms of contribution.
- Use quests to create shared direction.
- Use blocked states and handoffs to reduce ambiguity.
- Never rank staff by worth, productivity, or importance.

## Current Phase

The project is in implementation. Phases 1 through 10 are complete, including
private Supabase Realtime presence authorization. The foundation includes the
responsive app shell, invite-only authentication, admin-managed staff access,
durable Home summaries, persisted Focus Room, shared Studio XP, detailed Tasks
and Finance, private presence policies, Pixel Office, crash monitoring, RLS,
and database change history. Continue to treat the documentation in `docs/` as
the implementation source of truth.

The next documentation direction keeps shared Studio XP, adds lightweight
Character XP, and introduces Weekly Quests. Treat these updates as product and
architecture guidance until application code and migrations explicitly implement
them.

## Scope

MVP navigation:

1. Home
2. Focus Room
3. Tasks
4. Finance

Build order:

1. Home dashboard
2. Focus Room timer
3. Studio XP system
4. Character XP
5. Tasks
6. Finance
7. Realtime presence
8. Pixel office

Explicitly out of scope:

- Student and parent portals
- LMS and CRM features
- Payment processing
- AI features
- Chat and video
- Calendar integrations

## Engineering Expectations

- Use Next.js, TypeScript, Tailwind CSS, shadcn/ui, Supabase, Supabase Realtime,
  and Vercel.
- Follow SOLID principles and keep feature modules independently understandable.
- Keep business rules separate from React components, Supabase access, and
  presentation details.
- Prefer dependency inversion: business services depend on interfaces, while
  Supabase and browser APIs implement those interfaces.
- Keep server-only operations and secrets out of client modules.
- Use schema validation at external boundaries.
- Make mutations idempotent where duplicate submissions could affect XP,
  finance, or task state.
- Treat database migrations and Row Level Security policies as required parts of
  each data feature.
- Preserve an append-only database history of every durable application-data
  change through database-level auditing.
- Keep user attribution for auditability. Award primary progression to the
  organization, with only lightweight non-ranking Character XP for individuals.

## UI Expectations

- Build screens from replaceable layout sections and reusable primitives.
- Keep design tokens and navigation definitions centralized.
- Do not embed business rules in visual components.
- Keep the pixel-office visualization optional and isolated from core workflows.
- Meet WCAG 2.2 AA expectations for contrast, keyboard navigation, focus,
  reduced motion, and form labels.
- Design desktop-first for studio operations, while keeping core actions usable
  on mobile.

## Placeholder Assets

Codex may create simple SVG placeholder assets in `public/placeholders`.

Rules:

- Prefer SVG for placeholder UI, icons, empty states, and pixel-office mockups.
- Do not create polished brand illustrations unless explicitly requested.
- Do not use copyrighted characters, stock images, or external image URLs.
- Keep assets lightweight, editable, and replaceable.
- Final CCAD brand assets should replace placeholders before public launch.

## Delivery Expectations

Before considering a feature complete:

- Confirm it matches `docs/product-spec.md`.
- Update relevant architecture and schema documentation when contracts change.
- Add automated coverage appropriate to the feature risk.
- Verify loading, empty, error, and permission-denied states.
- After every completed development task, add a concise factual entry to
  `docs/dev-log.md` with the date/time, goal, files changed, what works, known
  issues, and next recommended step.
- Add an entry to `docs/build-log.md` when the task introduces a meaningful
  product, architecture, or implementation decision.
- Avoid unrelated refactors.

## Source Of Truth

- Product behavior: `docs/product-spec.md`
- System boundaries: `docs/system-architecture.md`
- Data model and access: `docs/database-schema.md`
- Presence behavior: `docs/realtime-presence.md`
- Progression rules: `docs/xp-system.md`
- UI conventions: `docs/ui-guidelines.md`
- Decision and delivery history: `docs/build-log.md`
- Completed development task history: `docs/dev-log.md`
- Error-monitoring and redaction rules: `docs/error-monitoring.md`
