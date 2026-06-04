# UI Guidelines

## 1. Experience Direction

CCAD HQ should feel like a calm, capable studio workspace with a small amount of
playfulness. Operational clarity comes first; the pixel-office layer and XP
celebrations add character without making core work feel like a game interface.

The interface should answer:

- Where am I?
- What is happening now?
- What needs attention?
- What can I do next?
- Did my action succeed?

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

MVP primary navigation order:

1. Home
2. Focus Room
3. Tasks
4. Finance

Guidelines:

- Keep navigation labels and destinations in one centralized definition.
- Clearly show the current tab.
- Keep Studio XP visible in the shell without creating another MVP tab.
- Place account, settings, and sign-out actions outside primary navigation.
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

- Keep Home at-a-glance: outstanding tasks, Studio XP, and finance summary are
  the primary content.
- Use compact summaries rather than duplicating detailed feature screens.
- Summary cards link to their detailed tabs.
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
- Provide a visible switch between Kanban and list/table views and preserve
  filters between them where practical.
- Default view should emphasize active and priority work.
- Filters remain understandable and easy to clear.
- Completion interaction is satisfying but restrained.
- Blocked and overdue states use text or icons in addition to color.
- Provide labeled status controls so every transition works without drag and
  drop.
- Explain that XP remains earned when a completed task is reopened or
  recompleted.

### Finance

- Clearly separate income, expenses, and net.
- Format currency consistently using organization settings.
- Require deliberate confirmation for archive actions.
- Avoid visual language implying this is full accounting software.
- Keep monthly totals independent from narrower type and category table filters.
- Show view-only state when a staff member cannot edit another creator's entry.

### Studio XP

- Always label it as Studio XP or CCAD progress.
- Shared activity may name the actor but never summarize XP by person.
- Level-up visuals celebrate CCAD.
- Keep Studio XP as a drill-down from Home and the app shell, not a primary MVP
  navigation tab.
- Show admin corrections as append-only shared activity with their reason.

### Presence

- Use the same accessible text panel on Home and in Focus Room.
- Show connecting, live, stale, unavailable, empty, and populated states.
- Label status and location with text; never rely on color alone.
- Describe coworking status as approximate and never as attendance.
- Keep realtime errors quiet so they do not interrupt core workflows.

### Pixel Office

- Treat it as a replaceable view over normalized presence.
- Provide an equivalent accessible text list.
- Do not hide core actions inside the visualization.
- Keep sprites and layout assets isolated from operational UI components.

### Studio Access

- Keep Studio Access outside primary MVP navigation and visible only to admins.
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
- Use `CCAD` or `Studio XP` for shared progression.
- Avoid competitive language such as `top performer`, `rank`, or `beat`.
- Explain errors in plain language and offer a next action.

## 11. UI Review Checklist

- Does the screen make the next action obvious?
- Can the layout be changed without touching business rules?
- Are tokens used instead of feature-specific visual constants?
- Are all core states represented?
- Does it work with keyboard and reduced motion?
- Is status understandable without color?
- Does any wording accidentally score individual staff?
- Does Pixel Office remain optional?
