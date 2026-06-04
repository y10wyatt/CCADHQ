# Studio XP System

## 1. Principle

The organization is the character. CCAD earns XP and levels up through the
combined work of its staff.

The system must make progress satisfying without creating employee rankings or
turning operational activity into surveillance.

## 2. MVP Progression Model

Studio XP is a single organization-wide total calculated from the append-only
`xp_events` ledger.

Recommended level formula:

```text
XP required to enter level L = 100 * (L - 1)^2
```

Examples:

| Level | Total XP required | XP to next level |
| --- | ---: | ---: |
| 1 | 0 | 100 |
| 2 | 100 | 300 |
| 3 | 400 | 500 |
| 4 | 900 | 700 |
| 5 | 1,600 | 900 |
| 6 | 2,500 | 1,100 |

This provides quick early progress and gradually longer levels without needing
a manually maintained level table. Revisit the curve after real usage.

## 3. MVP Award Rules

| Event | XP | Conditions |
| --- | ---: | --- |
| Complete Pomodoro focus interval | 10 | Full 25-minute Pomodoro `focus` session only |
| Complete task | 20 | First transition of a task to done |
| Admin correction | Signed | Explicit correction with reason |

Freeform focus sessions, break intervals, cancelled focus sessions, Pomodoros
finished early, task creation, task reopening, and finance entries do not award
XP.

Keep MVP awards deliberately simple. Task-size multipliers, streaks, bonuses,
and achievements can be considered only after observing actual behavior.

## 4. Award Invariants

- XP belongs to the organization, never the acting member.
- Every award has actor attribution when available.
- Every award has a human-readable description.
- An eligible source awards XP at most once.
- Awarding XP and completing its source happen atomically.
- Historical XP events are not edited or deleted.
- Corrections are new signed ledger entries created by an admin.
- A negative correction cannot reduce the effective total below zero.

## 5. Idempotency

Use deterministic idempotency keys:

```text
focus_session_completed:{focus_session_id}
task_completed:{task_id}
correction:{generated_correction_id}
```

The database enforces one `idempotency_key` per organization. Client retries,
refreshes, duplicate clicks, and concurrent requests must all return the
original award result rather than insert another award.

## 6. Display Rules

Show:

- Current CCAD level
- Total Studio XP
- Progress toward the next level
- Recent activity such as "Alice completed a focus session: +10 Studio XP"
- Brief shared celebration when CCAD reaches a new level

Do not show:

- XP totals by person
- Individual levels
- Leaderboards
- Rankings
- Comparative focus statistics
- Language implying employee value or performance

## 7. Level-Up Behavior

A level-up occurs when an accepted XP event moves total XP across one or more
level thresholds.

Behavior:

- Return the previous and new level from the award operation.
- Show a restrained celebration to active users.
- Keep the core action successful even if celebration UI fails.
- Do not create a second XP event merely to record the level-up.

If one correction crosses several thresholds, report the final new level.

## 8. Ownership And Integration

The XP feature owns:

- Award eligibility contracts
- Ledger insertion
- Idempotency handling
- Total and level calculations
- Progress view models
- Activity descriptions

Other features own the action that may trigger an award. They request an award
through an XP application interface but must not insert ledger rows directly.

Example flow:

```text
Complete task use case
  -> validate task transition
  -> transaction completes task
  -> XP award service inserts idempotent event
  -> return task and Studio XP result
```

## 9. Abuse And Correction Handling

The MVP is a trusted internal tool, but basic safeguards still matter:

- Completion awards are source-backed and idempotent.
- Reopening and recompleting a task does not award more XP.
- Changing a completed focus session is restricted.
- Corrections require admin permission and a reason.
- Correction activity is visible in the shared XP feed and audit log.

## 10. Testing

Required cases:

- Formula returns correct level and progress at, below, and above thresholds.
- Completing an eligible focus interval awards 10 XP once.
- Completing a freeform focus session records time and awards no XP.
- Completing a task awards 20 XP once.
- Duplicate or concurrent requests do not duplicate XP.
- Cancelling focus and completing breaks award no XP.
- Reopening and recompleting a task awards no additional XP.
- Admin correction changes total while preserving history.
- UI never exposes a per-member XP total.

## 11. Future Possibilities

Only consider after MVP validation:

- Named organization milestones
- Cosmetic pixel-office unlocks
- Shared seasonal goals
- XP awards for other clearly valuable operational actions

Any new reward must reinforce shared studio health and resist gaming. Avoid
individual streak pressure and competitive mechanics.

## 12. Phase 5 Implementation

- `/studio-xp` shows current CCAD level, total XP, next-level progress, approved
  awards, and an attributed shared activity feed.
- The app shell and Home link to the detailed shared progression view.
- Admins can append signed positive or negative corrections with a required
  reason; corrections are idempotent and cannot reduce Studio XP below zero.
- Full Pomodoro completion and corrections return previous/new levels for
  restrained level-up confirmation. XP mutations serialize shared-level
  calculations.
- Task-completion XP is implemented in Phase 6 and is awarded atomically with
  the first transition to done.

## 13. Phase 6 Task XP Implementation

- The first transition of a task to done awards 20 Studio XP.
- Task transition and XP insertion are serialized and atomic.
- `task_completed:{task_id}` prevents duplicate awards across retries,
  same-status requests, reopen, and recompletion.
- Reopening preserves the immutable first-completion timestamp and earned XP.
- The Tasks interface reports shared XP and CCAD level-up results without
  creating individual scores.
