---
id: TASK-061
title: Przewidywania i zaufanie tylko z wiadomości skierowanych do Akukiego
status: In Progress
assignee: []
created_date: '2026-11-16 12:45'
updated_date: '2026-11-16 12:45'
labels:
  - tokens
  - connector
  - M2
  - M4
dependencies:
  - TASK-060
  - TASK-015
  - TASK-017
modified_files:
  - borg/src/cognition/turn-input.ts
  - borg/src/cognition/lifecycle/turn-phase-coordinator.ts
  - borg/src/cognition/lifecycle/turn-phase/extraction-phase.ts
  - borg/src/cognition/lifecycle/turn-phase/extraction-phase.test.ts
  - borg/src/tracing/tracer.ts
  - borg/src/tracing/taxonomy.ts
  - connector/src/contract.ts
  - connector/src/adapter.ts
  - connector/src/adapter.test.ts
  - connector/src/runner.ts
  - connector/src/runner.test.ts
priority: high
type: enhancement
ordinal: 61000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Approved by Zosia on 2026-11-16. The prediction extractor (M2) runs on every turn at about 14.5k tokens on Opus, with no cache hits; on 16.11 it ran 7 times for 104k, 17% of the day. All 7 were at 11:21-11:24, on messages addressed to someone else, before TASK-060's store-only rule went live at 11:38. Two cases still ran it after that: a message said to the room (no mention, no reply) that gets a full turn and usually ends in silence, and an older message assessed in a queue.

The extractor runs in the extract phase, before the decision to speak, so "Akuki stays silent" cannot be the condition. The condition is structural: the message is addressed to Akuki when the Arena mention list names him, or it replies to one of his posts, or it replies to a post not on the fetched page (possibly his; same rule as the answer/record decision, chosen by Zosia). Text is never read.

Zosia also chose to put the domain-trust extractor (M4, about 3.7k per turn) under the same rule.

Changes:
- Fork: SingleMessageTurnInput.directlyAddressed (optional). False skips the prediction and domain-trust appraisals in the extract phase and traces extraction.not_addressed.skipped {skipped: [prediction, domain_trust]}. Absent (operator chat, CLI, upstream) runs both as before. Perception, mood, contact, frame check and the decision to answer are unchanged.
- Connector: IncomingArenaMessage.addressedToAkuki, computed by the adapter from mentions and reply_to; the runner passes it to borg as directlyAddressed on answered and assessed turns.

Research note: expectations and surprise (M2) and per-partner trust (M4) now grow only from exchanges Akuki is addressed in. Grounded in contingency learning: agency comes from what follows one's own engagement, not from watching others. Cost: a room message Akuki chooses to answer forms no predictions either. A drop in prediction counts after deploy is this change, not development.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Fork: directlyAddressed=false skips prediction and domain-trust extractors and traces extraction.not_addressed.skipped; absent or true runs both; test fails on the old extraction phase
- [x] #2 Connector: addressedToAkuki true for a mention of him, a reply to his post, a reply to a post not on the page; false for a room message and a reply to someone else's post; text never read; runner passes it on answered and assessed turns; tests fail on the old adapter and runner
- [x] #3 tsc and heuristics:guard pass in the fork; connector tsc against rebuilt borg/dist and all connector tests pass; fork src/cognition src/borg src/tracing src/config pass except known timeouts
- [ ] #4 Committed, deployed and restarted by decision of Zosia; Kalendarium zmian updated
- [ ] #5 After a few days: prediction-extractor and domain-trust calls and tokens per day compared with 16.11
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-16, implemented, NOT committed, NOT deployed. Fork: extraction-phase test 'appraises predictions and trust only from a message addressed to the being' fails on the old phase ('expected vi.fn() to not be called at all, but actually been called 1 times'). tsc 0, heuristics:guard 0, src/cognition src/borg src/tracing src/config: 2551 passed, 1 failed (evidence-ledger builder reverse-scan, known 15 s timeout). Connector: borg/dist rebuilt (npm run build), tsc --noEmit 0, 140 tests; the two new tests and the updated normalize test fail on the old adapter and runner (3 failed). On the VPS the fork must be rebuilt before the connector is checked (known mistake 13).
<!-- SECTION:NOTES:END -->
