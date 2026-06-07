# Realtime Presence

## 1. Purpose

Presence helps staff feel that they are working together. It communicates
availability and current focus state; it is not an attendance system,
productivity score, or durable history.

Presence must remain optional. A realtime outage must not block focus sessions,
tasks, finance, or XP persistence.

## 2. Technology

Use Supabase Realtime Presence for ephemeral state.

Recommended organization channel:

```text
org:{organization_id}:presence
```

Authorization must ensure the authenticated user is an active member of the
organization before joining.

## 3. Normalized Presence Contract

Each connected client tracks a small payload:

| Field | Type | Purpose |
| --- | --- | --- |
| `memberId` | uuid | Organization member identity |
| `displayName` | string | Staff-facing name |
| `avatarUrl` | string or null | Optional avatar |
| `characterLevel` | integer or null | Lightweight non-ranking level for user cards |
| `status` | enum | `online`, `focusing`, `paused`, `idle`, `break`, `away`, or `offline` |
| `location` | enum | `home`, `focus_room`, `tasks`, `finance`, or `pixel_office` |
| `focusSessionId` | uuid or null | Active Pomodoro or freeform session reference |
| `currentTaskId` | uuid or null | Optional linked task reference |
| `currentTaskTitle` | string or null | Short task label for ambient context |
| `focusCategory` | string or null | Current focus or task category |
| `focusStartedAt` | ISO timestamp or null | Enables elapsed-time display |
| `focusEndsAt` | ISO timestamp or null | Enables remaining-time display for fixed timers |
| `updatedAt` | ISO timestamp | Helps identify stale state |
| `clientId` | string | Distinguishes multiple tabs or devices |
| `version` | integer | Payload contract version |

Do not include private notes, task descriptions, finance data, detailed
progress metrics, or activity history. Presence should expose enough context to
coordinate work, not enough detail to supervise people.

## 4. Presence Card Display

A user presence card should show:

- User name
- Character Level
- Current task, when available
- Current focus session state
- Elapsed or remaining focus time
- Category
- Optional status: focusing, paused, idle, offline

Presence cards should feel ambient. They show current work state, not personal
judgment, productivity score, or attendance.

## 5. Status Rules

- `online`: connected and recently active, not focusing or on a break.
- `focusing`: member has an active running Pomodoro or freeform focus session.
- `paused`: member has paused an active focus or break timer.
- `idle`: connected but not recently interacting; use when product language
  benefits from a softer display than away.
- `break`: member has an active running break interval.
- `away`: client remains connected but has had no interaction for the configured
  inactivity period.
- `offline`: member is not currently connected; this is a display state derived
  by the client, not a stored attendance record.

Focus state overrides away state while a timer is running. A paused timer does
not automatically mean focusing; show the member as online or away based on
activity.

## 6. Multiple Clients

A member may have several tabs or devices. The UI should aggregate all presence
entries by `memberId`:

1. If any client reports `focusing`, show focusing.
2. Otherwise, if any client reports `break`, show on break.
3. Otherwise, if any client reports `paused`, show paused.
4. Otherwise, if any client reports `online`, show online.
5. Otherwise, show idle or away.

The active location can use the most recently updated non-away client. The
pixel office must show one avatar per member, not one per client.

## 7. Lifecycle

### Join

1. Confirm authenticated organization membership.
2. Subscribe to the organization presence channel.
3. Track the initial payload after subscription succeeds.
4. Normalize the full presence state for consumers.

### Update

Update tracked state when:

- The user changes primary tab.
- A focus or break timer changes state.
- The user becomes away or returns.
- Profile display information changes.

Avoid high-frequency updates. Timer countdown ticks must not publish presence.

### Leave

Untrack and unsubscribe when signing out or leaving the application. Unexpected
disconnects rely on Realtime presence cleanup.

## 8. Consumer Contract

Home, Focus Room, and Pixel Office consume a normalized presence service rather
than Supabase channel payloads directly.

The service exposes:

- Current normalized member list
- Connection state: connecting, live, stale, or unavailable
- Last successful sync time
- Subscribe and unsubscribe lifecycle

This keeps Supabase-specific behavior isolated and makes the visual experience
replaceable.

## 9. Resilience

- Reconnect with bounded exponential backoff.
- Mark last-known presence as stale when disconnected.
- Remove stale state after a short display grace period.
- Never infer that a disconnected member intentionally went offline.
- Do not block timer completion or durable writes while reconnecting.
- Show a quiet status indicator instead of repeated disruptive errors.

Suggested initial values, to validate during implementation:

- Away after 10 minutes of inactivity
- Stale immediately after connection loss
- Hide stale member state after 2 minutes

## 10. Privacy And Safety

- Do not persist presence history.
- Do not calculate attendance, hours worked, or individual focus totals from
  presence.
- Do not expose exact idle duration to coworkers.
- Do not use Character Level to sort or rank presence lists.
- Keep the payload minimal.
- Treat status as approximate.

## 11. Testing

Required scenarios:

- Two users see each other join and leave.
- Focus and break transitions update without publishing countdown ticks.
- Multiple tabs aggregate into one member.
- Closing one of several tabs does not mark the member offline.
- Reconnection marks state stale and then restores it.
- Realtime outage does not break the Focus Room timer.
- Unauthorized users cannot join the organization channel.
- Character Level and current task display without exposing task descriptions or
  private notes.
- Presence lists do not rank members by level, status, or activity.

## 12. Pixel Office Integration

Pixel office maps normalized status to visual state:

- Online: available workstation state
- Focusing: focus animation or indicator
- Break: break-area state
- Away: subdued idle state
- Offline: absent or quiet empty-desk state

The mapping belongs to the pixel-office feature. The presence contract must not
contain visual coordinates, sprites, or animation details.

## 13. Phase 8 Implementation Status

Implemented:

- A workspace-level presence provider owns the Supabase channel lifecycle.
- Home and Focus Room consume one replaceable accessible presence panel.
- Running focus and break sessions override away status; paused sessions do not.
- Client state updates on route, focus state, profile, and away transitions,
  never on timer countdown ticks.
- Multiple client entries are normalized into one member using the approved
  status precedence and most recent non-away location.
- Realtime payloads are validated before entering the normalized store.
- Connection loss marks last-known state stale and removes it after two minutes.
- Inactivity changes a connected client to away after ten minutes.
- Presence remains ephemeral and creates no change-history or attendance rows.

Activated infrastructure:

- Supabase Realtime service is enabled.
- Public channel access is disabled so only private channels are allowed.
- The managed `realtime.messages` and `realtime.subscription` relations exist.
- `20260604122400_phase_8_realtime_presence.sql` has been applied.
- `organization_members_receive_presence` and
  `organization_members_send_presence` limit presence access to authenticated
  active organization members for `org:{organization_id}:presence`.

Pending live verification:

- Live-test join, leave, multiple-tab, focus, break, reconnect, and
  unauthorized access with two active signed-in users.

Manual repair check:

```sql
select
  to_regnamespace('realtime') as realtime_schema,
  to_regclass('realtime.messages') as messages_table,
  to_regclass('realtime.subscription') as subscription_table;
```

All three results should be non-null. Do not manually create or modify the
managed Realtime schema.

## 14. Phase 9 Pixel Office Integration

- Home provides a toggle between the default accessible presence list and Pixel
  Office.
- Pixel Office maps normalized members into workstation, break-area,
  open-studio, and quiet-corner zones.
- Room coordinates and visual treatment remain inside `features/pixel-office/`.
- Staff may click the Pixel Office to publish an ephemeral room coordinate for
  their own character through the same private presence payload.
- Pixel Office does not subscribe directly, persist state, or affect presence
  authorization.
- Every visible occupant retains a text name, status, and location equivalent.
