---
id: TASK-060
title: >-
  Tańsze tury: wiadomość do kogoś innego tylko odsłuchana, bez refleksji po
  milczeniu, mniejszy rejestr dowodów
status: In Progress
assignee: []
created_date: '2026-11-10 11:40'
updated_date: '2026-11-10 11:50'
labels:
  - tokens
  - connector
  - reflection
  - evidence-ledger
dependencies:
  - TASK-058
  - TASK-057
modified_files:
  - connector/src/adapter.ts
  - connector/src/adapter.test.ts
  - connector/src/state.ts
  - borg/src/cognition/reflection/turn-reflection-coordinator.ts
  - borg/src/cognition/reflection/turn-reflection-coordinator.test.ts
  - borg/src/cognition/turn-orchestrator.ts
  - borg/src/cognition/lifecycle/turn-phase/post-generation-phase.ts
  - borg/src/config/index.ts
  - borg/src/config/index.test.ts
  - borg/src/offline/test-support.ts
  - borg/src/tracing/tracer.ts
  - borg/src/tracing/taxonomy.ts
priority: high
type: enhancement
ordinal: 60000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Approved by Zosia on 2026-11-10 after a token spike: between 11:17 and 11:28 CET Lunaria and Sol talked to each other (every message @-mentioned the other), each of the 9 messages got a full turn because they arrived one at a time, and Akuki chose to observe every time. About 1.65M tokens for no words. A full turn costs about 180k (reply prompt about 117k after TASK-057/058, reflection about 33k on Opus, the rest about 30k).

Three changes:
1. Connector: a message whose Arena mention list names someone and not Akuki, and that does not reply to one of his posts, goes through the assess-only turn even when it is the newest. It is still heard (stored, perceived, M2/M4 appraised, contact and mood recorded); he is only not asked to decide whether to speak. Structured mention/reply fields only, never text. A reply whose target is not on the fetched page counts as possibly his and is answered.
2. Fork: config switch cognition.reflection.afterSilentTurn (default true, upstream behaviour). Off: a full turn that ends in silence (observed or suppressed) still records the contact and the mood (M3 familiarity reads contacts), but makes no reflector call, so it yields no trait demonstration, goal progress, open question or skill outcome. Traced as reflection.skipped_after_silence.
3. Tenant config: smaller evidence ledger through per-section caps, not the global target, because the global target trims whole sections lowest-trust first (memory, episodes, semantic graph, autobiographical recall go first, the transcript last).

Research note: change 1 changes when Akuki is asked to decide at all, which matters for M3 analysis of silences (future-development entry 12, gate 1). Change 2 removes a source of open questions after silent turns.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Connector: a message addressed elsewhere is assessed, never answered, even as the newest; the latest message not addressed elsewhere is answered instead; a message mentioning Akuki, replying to his post, or replying to a post not on the page is still answered; tests fail on the old adapter
- [x] #2 Fork: reflection.afterSilentTurn=false skips the reflector on observed/suppressed turns, keeps contact and mood, traces reflection.skipped_after_silence; default reflects as upstream; tests fail on the old coordinator
- [x] #3 tsc, heuristics:guard, connector tests, and fork src/cognition src/borg src/tracing src/config src/offline pass except known timeouts
- [ ] #4 Ledger caps chosen with Zosia and set in tenant config with a backup
- [ ] #5 Deployed and restarted by decision of Zosia; Kalendarium zmian updated
- [ ] #6 After a few days: share of full turns vs assess-only, reflection calls, ledger size and tokens per inbound message compared with 09.11–10.11
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-10, changes 1 and 2 implemented, committed and pushed; NOT deployed (akuki.service stopped since 10.11 11:07 UTC, not by this session).

Change 2, borg 125a08e9 (akuki-dev): cognition.reflection.afterSilentTurn, default true. TurnReflectionCoordinator.run still calls recordReception, then either the unchanged reflector call (moved into a private reflect method) or skipReflectorAfterSilence, which returns the post-action working memory with empty effects and traces reflection.skipped_after_silence {emission}. The rest of run (pending social attribution, pending procedural attempts, working-memory save) is unchanged. post-generation passes emissionKind; turn-orchestrator passes the config. Proof: the new coordinator test fails on the old coordinator ('expected vi.fn() to not be called at all, but actually been called 1 times'); config test for the default and the switch. Verified alone in a clean worktree at HEAD plus this patch: tsc 0, 419 tests in src/cognition/reflection, src/config, src/cognition/lifecycle. In the shared tree: tsc 0, heuristics:guard 0, src/cognition src/borg src/tracing src/config src/offline 2940 passed, 3 failed, all 15 s timeouts (builder reverse-scan known; belief-revision drain fails on HEAD too; participant scan caps passes alone). The tenant config still needs cognition.reflection.afterSilentTurn=false at deploy.

Change 1, akuki repo (connector): BotArenaAdapter.addressedElsewhere(message, page) is true when message.mentions is non-empty, does not include botId, and the message does not reply to one of his posts; a reply whose target is not on the fetched page is not addressed elsewhere. pollOnce picks the answered message among those that get a turn and are not addressed elsewhere; the assess log line names the reason. Header comment updated. Proof: two new adapter tests fail on the old adapter; the third (mentions him / replies to him / reply target not on page) guards existing behaviour. Connector: tsc 0, 137 tests.

Unrelated defect found by the new test and fixed in connector/src/state.ts: asState did not list "assessed", so every assessed row read back as "abandoned". Both are terminal, so floor and routing were unaffected; only reads and reports were wrong (e.g. any count of abandoned messages since 30.09 includes assessed ones).

Change 3 held: session akuki-d2 has a TASK-058 follow-up that removes per-row rendering overhead from the ledger (about 23k real tokens per turn, 38–39%) and asked for the section caps to go live in a separate restart so the two effects can be told apart. Proposed caps (chars/4 units): current_session_transcript 8000→4000, retrieved_raw_stream_evidence 7000→2500, retrieved_memory_evidence 7000→2500, autobiographical_recall 5000→1500, semantic_graph 5500→1200, group_channel_memory 3000→1000. The global target stays: trimming to it removes whole sections lowest-trust first (compaction.ts LOWEST_TRUST_SECTION_COMPACTION_PRIORITY), so memory would go before the transcript.

Correction to the state.ts note above: only TypeScript reads of message_state went through asState (ArenaStateStore get and its row listing); nothing in the Python tooling reads message_state, and the stored column was always correct. So no report outside the connector was affected; the 'any count since 30.09' remark overstated it.
<!-- SECTION:NOTES:END -->
