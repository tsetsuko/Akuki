---
id: TASK-053
title: >-
  Odczyt po 24 h: czy wyłączenie kompilatora wspólnego stanu, stanu akcji i
  krótsze okno obniżyły zużycie tokenów
status: In Progress
assignee: []
created_date: '2026-10-26 11:56'
updated_date: '2026-10-30 08:27'
labels:
  - tokens
  - arena
  - measurement
dependencies:
  - TASK-051
priority: high
type: task
ordinal: 53000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On 2026-10-26 at 11:55 UTC, borg 8ea1816f went live on the VPS, with three switches in the tenant config.json:

- generation.evidenceLedger.decisionArtifact.enabled = false. The shared-state compiler is off.
- generation.evidenceLedger.recentLivedExperience.recencyWindowMs = 86400000. The recent-experience window shrinks from 3 days to 1.
- cognition.actionLifecycle.extractionEnabled = false. The action-state extractor is off.

Goal promotion also stopped running in assess-only turns. The backup taken before the change is in /var/lib/akuki/backup-deploy-20261026 (borg.db via the SQLite backup API with quick_check ok, plus lancedb, config.json and akuki.env).

Baseline, 19–25.10: 6455 calls and 124.4M input tokens (input plus cache read plus cache write), so about 300–450k per processed message. Shares: shared-state-compiler 19.8%, action-state-extractor 2.7%, goal-promotion 2.6%.

Prediction: per message, input drops by roughly 22–25%. shared-state-compiler and action-state-extractor go to zero calls. pending-action-judge falls silent, because nothing creates new actions.

Read on 2026-10-27, around 12:00 local time.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Calls and input tokens per processed message (per perception-affective call) compared before (19–25.10) and after (from 26.10 11:55 UTC)
- [x] #2 Confirmed zero calls to shared-state-compiler and action-state-extractor after the deploy
- [x] #3 Checked that goal-promotion-extractor does not fire on assess-only turns (its call count is at most the number of replies, S1+S2)
- [x] #4 Checked the journal for errors since the restart
- [ ] #5 Result written to TASK-051
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
First reading, 2026-10-27 08:08 UTC. Window: from the deploy (26.10 11:55 UTC) to the last call (26.10 19:36 UTC). 125 calls, 8 processed messages, 4 replies (3 S1, 1 S2). The sample is too small for a conclusion about the saving, so AC #1 stays open.
- AC #2, confirmed: 0 calls to shared-state-compiler, action-state-extractor, shared-state-semantic-revision and pending-action-judge.
- AC #3, confirmed: goal-promotion-extractor made 4 calls on 4 replies, so 0 on assess-only messages. corrective-preference also made 4 on 4.
- AC #4, confirmed: the journal shows 0 lines with fatal, unhandled or Error: since the restart, and NRestarts is 0.
- Input per message: 228k (including offline) against 300k before, and 149k excluding offline against 288k before. This is not comparable, for two reasons. First, the mix: 1 S2 in 4 replies against 209 in 324 before. Second, offline weighs heavily on 8 messages: the nightly dream cycle cost about 79k per message, against 11k before.
- Per call, which does not depend on the S1/S2 mix: S1 has a median of 137k (n=3, 132–141k) against 106k before (n=115, 87–185k). S2 is 167k (n=1) against a 176k median. Plan is 50k against 53k. Reflection is 29.5k against 25.5k.
- Contrary to the prediction, S1 did NOT get smaller after the board was removed and the window shortened. On n=3 this may be the content of those turns, and the cause has not been established. It goes to TASK-054 as a question: why S1 reaches 130–140k.
- Next reading: after at least about 50 messages, from the same script (per message and per call).

2026-10-30, reading over the window 26.10 11:55 – 30.10 08:26 UTC: 2977 calls, 278 messages, 125 replies (54 S1, 71 S2), 45.4M input tokens. Per processed message: 163k against 300k before. This is NOT comparable, because the reply share fell from 78% to 45%. Per reply: 363k against 384k, so about −5%. The switched-off calls are gone, but the reply prompts grew: S1 median 106k → 150k, S2 176k → 211k, plan unchanged at 53k. Prediction (−22–25% per message) not met per reply. Full report: Obsidian AKUKI/akuki_token_usage_report_2026-10-30.md.
<!-- SECTION:NOTES:END -->
