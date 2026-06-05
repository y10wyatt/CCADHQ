# Studio And Character XP System

## 1. Principle

The organization is the character. CCAD earns Studio XP and levels up through
the combined work of its staff. Studio XP and Studio Level are the primary
progression systems.

Character XP is allowed only as lightweight individual progression for work
rhythm, consistency, and contribution visibility. It must never become a staff
ranking, productivity score, or shame mechanic.

The system must make progress satisfying without turning operational activity
into surveillance.

## 2. Progression Models

### Studio XP / Studio Level

Studio XP represents CCAD's collective progress, studio health, finance
stability, creative output, reputation, and community growth.

The current implementation stores this shared system in the append-only
`xp_events` ledger. The source of truth should remain one append-only
organization-level Studio XP ledger.

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

### Character XP / Character Level

Character XP represents an individual user's work rhythm, consistency, focus
sessions, completed tasks, completed handoffs, and studio maintenance.

Rules:

- Character Level can be visible on user cards and presence cards.
- Character progression must remain secondary to Studio Level.
- Character XP can only increase or remain unchanged; inactivity should not
  create penalties.
- Streaks can grant bonuses, but missed days do not subtract XP or display
  shame language.
- Do not expose hard rankings, leaderboards, top-performer language,
  loser/winner language, or comparative productivity views.

Use the same quadratic formula initially unless later testing shows character
levels need a slower curve.

## 3. Studio XP Award Rules

Candidate Studio XP sources:

| Event | XP | Notes |
| --- | ---: | --- |
| Any completed focus session | 10 | Current implementation awards only full Pomodoro focus intervals |
| Completed CCAD task | 25 | Current implementation awards 20 for first completion |
| Finance update | 50 | Only meaningful ledger maintenance, not artificial activity |
| Weekly quest completed | 250 | Shared direction and momentum |
| New enrollment milestone | 500 | Internal milestone record only; do not build a student portal |
| Marketing/public-facing task | Task value | May affect Reputation |
| Parent followup | Task value | Internal followup task only; do not build a parent portal |
| Studio maintenance | Task value | Makes invisible operational work visible |

Current implemented MVP rules:

| Event | XP | Conditions |
| --- | ---: | --- |
| Complete Pomodoro focus interval | 10 | Full 25-minute Pomodoro `focus` session only |
| Complete task | 20 | First transition of a task to done |
| Admin correction | Signed | Explicit correction with reason |

Freeform focus sessions, break intervals, cancelled focus sessions, Pomodoros
finished early, task creation, task reopening, and finance entries do not award
XP in the current implementation.

Keep implemented awards deliberately simple until Character XP and Weekly Quests
have matching migrations and tests.

## 4. Character XP Award Rules

Initial candidate rules:

| Event | Character XP | Notes |
| --- | ---: | --- |
| Complete focus session | 10 | Pomodoro or approved freeform focus session |
| Complete task | 15 | Completing user receives credit |
| Complete handoff | 15 | Award when ownership transfer is completed clearly |
| 3-day focus streak | 25 | Positive bonus only; no penalty for missed days |
| Studio maintenance work | 10-25 | Based on task or quest configuration |

Character XP events should preserve source records and idempotency just like
Studio XP. A source event can award both Studio XP and Character XP, but the UI
must keep Studio XP as the primary progression.

## 5. Studio Stats

Tasks and quests may optionally contribute to one or more studio stats:

| Stat | Contribution areas |
| --- | --- |
| Stability | Finance, scheduling, systems, operations, and payments |
| Reputation | Parent trust, student outcomes, testimonials, acceptances, and public-facing quality |
| Creativity | Student projects, critique, portfolio development, class material, and experimental work |
| Community | Events, referrals, alumni/student relationships, and workshops |

Stats describe the type of contribution. They must not become staff ratings.

## 6. Award Invariants

- Studio XP belongs to the organization.
- Character XP belongs to the acting member but is secondary and non-ranking.
- Every award has actor attribution when available.
- Every award has a human-readable description.
- An eligible source awards XP at most once.
- Awarding XP and completing its source happen atomically.
- Historical XP events are not edited or deleted.
- Corrections are new signed ledger entries created by an admin.
- A negative correction cannot reduce the effective total below zero.

## 7. Idempotency

Use deterministic idempotency keys:

```text
focus_session_completed:{focus_session_id}
task_completed:{task_id}
handoff_completed:{handoff_id}
weekly_quest_completed:{weekly_quest_id}
correction:{generated_correction_id}
```

The database enforces one `idempotency_key` per organization for Studio XP and
one per member/source for Character XP. Client retries, refreshes, duplicate
clicks, and concurrent requests must all return the original award result
rather than insert another award.

## 8. Display Rules

Show:

- Current Studio Level / CCAD Level
- Total Studio XP
- Progress toward the next level
- Recent activity such as "Alice completed a focus session: +10 Studio XP"
- Brief shared celebration when CCAD reaches a new level
- Character Level on user cards and presence cards
- Personal character progress only in lightweight, self-oriented contexts

Do not show:

- Leaderboards
- Rankings
- Comparative focus statistics
- Language implying employee value or performance
- Productivity scores
- Shame language around missed streaks or inactivity

## 9. Level-Up Behavior

A level-up occurs when an accepted XP event moves total XP across one or more
level thresholds.

Behavior:

- Return the previous and new level from the award operation.
- Show a restrained celebration to active users.
- Keep the core action successful even if celebration UI fails.
- Do not create a second XP event merely to record the level-up.

If one correction crosses several thresholds, report the final new level.

## 10. Ownership And Integration

The XP feature owns:

- Award eligibility contracts
- Ledger insertion
- Idempotency handling
- Total and level calculations
- Progress view models
- Activity descriptions
- Office stat contribution mapping
- Character XP level calculations

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

## 11. Abuse And Correction Handling

The MVP is a trusted internal tool, but basic safeguards still matter:

- Completion awards are source-backed and idempotent.
- Reopening and recompleting a task does not award more XP.
- Changing a completed focus session is restricted.
- Corrections require admin permission and a reason.
- Correction activity is visible in the shared XP feed and audit log.
- Character XP has no negative streak penalty or punitive decay.

## 12. Testing

Required cases:

- Formula returns correct level and progress at, below, and above thresholds.
- Completing an eligible focus interval awards 10 XP once.
- Completing a freeform focus session records time and awards no XP.
- Completing a task awards 20 XP once.
- Duplicate or concurrent requests do not duplicate XP.
- Cancelling focus and completing breaks award no XP.
- Reopening and recompleting a task awards no additional XP.
- Admin correction changes total while preserving history.
- Character XP awards are idempotent per source.
- Character Level appears without leaderboards or rank ordering.
- Studio stat impact is stored as contribution metadata, not staff scoring.

## 13. Handoffs And Weekly Quests

Handoffs and weekly quests are future product direction until implemented.

Handoffs should award XP only when they reduce ambiguity and transfer ownership
with useful context. Weekly quests should create shared direction for a small
creative studio and may contribute to Studio XP, Character XP, and studio stats.

Both features must avoid blame language, staff ranking, and hidden surveillance.

## 14. Future Possibilities

Only consider after MVP validation:

- Named organization milestones
- Cosmetic pixel-office unlocks
- Shared seasonal goals
- XP awards for other clearly valuable operational actions

Any new reward must reinforce shared studio health and resist gaming. Keep
individual progression light, optically secondary, and free of shame mechanics.

## 15. Phase 5 Implementation

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

## 16. Phase 6 Task XP Implementation

- The first transition of a task to done awards 20 Studio XP.
- Task transition and XP insertion are serialized and atomic.
- `task_completed:{task_id}` prevents duplicate awards across retries,
  same-status requests, reopen, and recompletion.
- Reopening preserves the immutable first-completion timestamp and earned XP.
- The Tasks interface reports shared XP and CCAD level-up results without
  creating individual scores.

## 17. Character XP And Weekly Quest Implementation

- `character_xp_events` stores append-only member-linked Character XP.
- Existing focus and task Studio XP events are backfilled into Character XP so
  current member cards start from real account activity.
- Full Pomodoro completion awards 10 Character XP to the session owner when the
  same source earns Studio XP.
- First task completion awards 15 Character XP to the completing member when
  the same source earns Studio XP.
- Completing a Weekly Quest awards its configured Studio XP to CCAD and its
  configured Character XP to the completing member.
- Character XP idempotency is scoped by organization, member, and source key.
- Home shows Character Level, Character XP, progress to the next level, and
  contribution counts without ranking staff.
