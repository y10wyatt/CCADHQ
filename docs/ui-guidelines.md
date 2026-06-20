# UI Guidelines

## 1. Experience Direction

CCAD HQ should feel like a calm, capable studio workspace with a small amount of
playfulness. Operational clarity comes first; the pixel-office layer and XP
celebrations add character without making core work feel like a game interface.

Studio Level is the primary progression signal. Character Level can add a light
personal touch on user cards and presence cards, but must stay secondary and
must never create a leaderboard, productivity score, or shame mechanic.

The interface should answer:

- Where am I?
- What is happening now?
- What needs attention?
- What can I do next?
- Did my action succeed?

CCAD HQ should create visibility, momentum, and shared accountability without
feeling like surveillance. Show current work state, blocked states, handoffs,
and contribution types; avoid personal judgment.

## 2. Revision-Friendly UI Architecture

Keep the interface easy to revise by separating:

- **Design tokens:** color, spacing, typography, radius, shadow, motion
- **Primitives:** button, input, dialog, card, badge, tabs, tooltip
- **Patterns:** page header, metric card, status row, empty state, filters
- **Feature sections:** XP summary, task summary, finance summary, presence list
- **Pages:** composition and data orchestration only

Pages should consume stable view models and compose replaceable sections. A
visual redesign should not require changes to domain rules or database access.

Use shadcn/ui primitives as editable foundations. Wrap them only when a shared
semantic pattern or behavior justifies it.

## 3. Navigation

Primary navigation order:

1. Dashboard
2. Leads
3. Students
4. Marketing
5. Finance
6. Tasks
7. Settings

Guidelines:

- Keep navigation labels and destinations in one centralized definition.
- Clearly show the current tab.
- Keep Studio XP visible in the shell without creating another MVP tab.
- Keep staff invitations and member access inside Settings instead of a
  separate Team tab.
- Show Character Level only as lightweight user-card context.
- Keep Leads separate from Students; enrollment conversion is the boundary.
- Keep sign-out and current-member controls outside primary navigation.
- Do not add Pixel Office to primary navigation until it has a validated use.

## 4. Layout

- Design desktop-first for daily studio use.
- Keep core workflows usable at narrow mobile widths.
- Use a consistent page max width and spacing scale.
- Prefer clear section grids over dense dashboards.
- Let the most actionable content appear first.
- Keep finance amounts and timer values visually scannable.
- Avoid horizontal scrolling for core workflows.

Recommended page pattern:

```text
App shell
  Page header: title, context, primary action
  Primary section: current state or next action
  Supporting section grid
  Recent activity or detailed list
```

## 5. Visual Language

### Color

- Use semantic tokens such as `background`, `surface`, `foreground`, `muted`,
  `accent`, `success`, `warning`, and `danger`.
- Never use raw palette values directly in feature components.
- Never rely on color alone to communicate status.
- Keep finance income and expenses distinguishable with labels and icons as well
  as color.

### Typography

- Use a highly readable UI typeface for operations.
- Reserve any pixel or display typeface for small decorative moments.
- Use a restrained type scale with clear page, section, body, and metadata
  roles.
- Use tabular numerals for timers, XP totals, and finance amounts.

### Shape And Depth

- Centralize radius and shadow tokens.
- Prefer subtle grouping and borders over excessive card nesting.
- Keep important focus and confirmation states visually clear.

### Motion

- Use motion to explain change, not decorate every interaction.
- Keep level-up celebration brief and dismissible.
- Respect `prefers-reduced-motion`.
- Avoid distracting animation during focus sessions.

## 6. Core Component States

Every data-driven section should define:

- Loading
- Empty
- Populated
- Partial or stale
- Error with retry
- Permission denied, where relevant

Do not represent loading as an empty result. Preserve layout where possible to
reduce visual movement.

## 7. Interaction Guidelines

- Use one clear primary action per section.
- Confirm destructive or difficult-to-reverse actions.
- Make optimistic updates only when failure recovery is unambiguous.
- Keep forms short and show validation near the relevant field.
- Preserve entered form data after recoverable errors.
- Give immediate confirmation for completed tasks, focus sessions, and finance
  entries.
- Do not interrupt focus sessions with non-critical notifications.

## 8. Feature-Specific Guidance

### Home

- Keep Home at-a-glance: outstanding tasks, Studio XP, Character XP cards,
  Weekly Quests, and finance summary are the primary content.
- Character XP cards should use real member accounts and derived XP progress,
  not hard-coded staff scores.
- Use compact summaries rather than duplicating detailed feature screens.
- Summary cards link to their detailed tabs.
- Recent activity can be collapsed and should name the actor as context, not as
  a ranking.
- Clearly label stale presence or delayed summaries.

### Focus Room

- The timer is the dominant visual element.
- Clearly distinguish fixed Pomodoro mode from freeform time-recording mode.
- Require a work name, work description, and category before recording a focus
  session.
- Let users add, rename, and archive shared work categories without leaving the
  workflow.
- Let users select an existing task to prefill focus details.
- Provide a clear `Continue previous work` action that starts a new session
  without modifying the earlier session.
- Start, pause, resume, and cancel controls must be unmistakable.
- Let users revise required work details while a focus session is active.
- Break timers omit work-detail fields.
- Reaching zero may complete the interval, but never start another timer.
- Keep optional completion sounds and browser notifications off until enabled.
- Use timestamps as the source of truth while displaying a smooth countdown or
  elapsed-time counter.
- Show coworkers as ambient context, not a competitive list.

### Tasks

- Use Kanban as the default primary view.
- Show Weekly Quests above the task board as shared direction for the week.
- Support Backlog, Today, This Week, Blocked, Waiting, and Completed as the
  product-facing status language.
- Provide a visible switch between Kanban and list/table views and preserve
  filters between them where practical.
- Default view should emphasize active and priority work.
- Completed tasks should be grouped separately and hidden until requested.
- Filters remain understandable and easy to clear.
- Completion interaction is satisfying but restrained.
- Blocked and overdue states use text or icons in addition to color.
- Waiting and handoff states should make ownership and next action obvious
  without assigning blame.
- Provide labeled status controls so every transition works without drag and
  drop.
- Explain that XP remains earned when a completed task is reopened or
  recompleted.

### Handoffs

- Keep handoffs lightweight and contextual.
- Show title, assigned person, due date, linked task, and status.
- Make the next owner clear without using accusatory language.
- Treat completed handoffs as contribution recognition, not performance
  evidence.

### Finance

- Clearly separate income, expenses, and net.
- Format currency consistently using organization settings.
- Require deliberate confirmation for archive actions.
- Avoid visual language implying this is full accounting software.
- Keep monthly totals independent from narrower type and category table filters.
- Recurring finance entries are labeled as recurring but remain manually
  recorded ledger rows.
- Show view-only state when a staff member cannot edit another creator's entry.

### Students

- Use cards for student summaries so status, program, next action, and follow-up
  state are easy to scan.
- Keep student detail pages quiet and operational, with class logs as the main
  chronological record.
- Parent-update and permission-to-post states should be visible without using
  alarmist styling.
- Archive should feel like moving a student out of the active workspace, not
  deleting their history.

### Leads

- Treat Leads as a boutique admissions pipeline, not a generic sales CRM.
- Use a Kanban board for status flow and keep cards compact enough for daily
  admissions scanning.
- Follow-up indicators should be clear: overdue and due-soon need attention,
  scheduled should feel calm.
- Conversion to Student must feel deliberate and preserve the admissions
  history instead of hiding it.
- Attribution reporting should read as source quality for CCAD admissions, not
  loud sales performance.

### Marketing

- Treat Marketing as an internal editorial planning board, not a generic social
  media dashboard.
- Show only real content ideas from the database; do not use sample strategy,
  calendar, performance, topic, or asset data.
- Idea cards should expose account, owner, priority, deadline, CTA, and status
  without becoming visually noisy.
- Add analytics, planning calendars, or asset management only after they have
  real persisted data.

### Studio Notes

- Use warm paper tones, thin borders, and light shadows for sticky-note cards.
- Keep rotations subtle and avoid childish or neon styling.
- Pinned notes should sort first and show a small pin indicator.
- Important notes should use a restrained deep-cobalt accent.
- Notes are casual internal messages; avoid task-manager language.
- On mobile, stack notes vertically for easy reading.

### Resources

- Treat Resources as a studio reference shelf, not a generic bookmark manager.
- Pinned links should feel immediately reachable without overwhelming the page.
- Use concise cards with category and owner tags.
- Search and category filters should stay simple and visible.
- External links should clearly open in a new tab.

### Studio XP And Character XP

- Always label shared progression as Studio XP, Studio Level, or CCAD progress.
- Keep Studio Level visually primary.
- Character Level may appear on user cards and presence cards, but should not
  dominate the screen.
- Shared activity may name the actor but never summarize Studio XP by person.
- Level-up visuals celebrate CCAD.
- Keep Studio XP as a drill-down from Home and the app shell, not a primary MVP
  navigation tab.
- Show admin corrections as append-only shared activity with their reason.
- Never sort staff by Character Level or show hard rankings.

### Studio Stats And Quests

- Use Stability, Reputation, Creativity, and Community as contribution lenses.
- Display stat impact as task or quest context, not as staff evaluation.
- Weekly quests should be editable from Home and Tasks.
- Weekly quests should feel like shared direction and momentum.
- Quest completion can create a restrained shared celebration.

### Presence

- Use the same accessible text panel in Focus Room and Studio XP.
- Show connecting, live, stale, unavailable, empty, and populated states.
- Label status and location with text; never rely on color alone.
- Describe coworking status as approximate and never as attendance.
- Presence cards may show Character Level, current task, focus state, elapsed or
  remaining time, and category when available.
- Do not use presence as a supervisory dashboard.
- Keep realtime errors quiet so they do not interrupt core workflows.

### Pixel Office

- Treat it as a replaceable view over normalized presence.
- Provide an equivalent accessible text list.
- Do not hide core actions inside the visualization.
- Keep sprites and layout assets isolated from operational UI components.
- Pixel Office may visualize who is present, who is focusing, office activity
  level, Studio Level, quest completion, and calm office states.

### Staff Access

- Keep staff access controls inside Settings and visible only to admins.
- Explain that creating an invitation does not send an email; the invited
  person must create their account from the login screen.
- Keep password sign-in, invited account creation, and password recovery
  distinct while using the same calm authentication surface.
- Show active/inactive and staff/admin states with text, not color alone.
- Confirm deactivation and invitation revocation.
- Do not offer self-deactivation and explain last-admin protection.
- Keep access administration separate from employee performance or attendance.

## 9. Accessibility

Target WCAG 2.2 AA:

- Full keyboard navigation and visible focus styles
- Semantic headings, landmarks, buttons, and form controls
- Programmatic labels and helpful error messages
- Sufficient text and non-text contrast
- Minimum practical pointer target sizes
- Reduced-motion support
- Screen-reader announcements for meaningful timer transitions
- Text equivalent for presence and pixel-office states

Timer announcements should be useful but not speak every countdown tick.

## 10. Content Style

- Use clear, friendly, direct language.
- Prefer verbs for actions: `Start focus`, `Complete task`, `Add entry`.
- Use `CCAD`, `Studio XP`, or `Studio Level` for shared progression.
- Avoid competitive language such as `top performer`, `rank`, `beat`, `winner`,
  or `loser`.
- Avoid productivity shaming and punitive streak-loss language.
- Explain errors in plain language and offer a next action.

## 11. UI Review Checklist

- Does the screen make the next action obvious?
- Can the layout be changed without touching business rules?
- Are tokens used instead of feature-specific visual constants?
- Are all core states represented?
- Does it work with keyboard and reduced motion?
- Is status understandable without color?
- Does any wording accidentally score individual staff?
- Does Character Level stay secondary to Studio Level?
- Are blocked, waiting, and handoff states clear without blame?
- Does Pixel Office remain optional?
