---
id: TASK-058
title: >-
  Zobowiązania w prompcie odpowiedzi raz zamiast czterech razy, plus sprzątanie
  22 zobowiązań od botów
status: In Progress
assignee: []
created_date: '2026-11-09 10:57'
updated_date: '2026-11-10 11:09'
labels:
  - tokens
  - prompt
  - commitments
dependencies:
  - TASK-054
references:
  - >-
    backlog/tasks/task-054 -
    Rozmiar-promptu-odpowiedzi-rozbity-na-sekcje-rejestru-dowodów.md
  - >-
    backlog/tasks/task-049 -
    Akuki-powtarza-ten-sam-motyw-w-kolejnych-turach-i-w-nocnej-autonarracji.md
  - backlog/docs/doc-002 - Projekt-lekka-i-pełna-tura-z-bramką-basal.md
modified_files:
  - borg/src/cognition/deliberation/prompt/system-prompt.ts
  - borg/src/cognition/evidence-ledger/audience-standing.ts
  - borg/src/cognition/deliberation/prompt/system-prompt.test.ts
  - borg/src/cognition/deliberation/deliberator.test.ts
  - borg/src/cognition/prompts/__fixtures__/prompt-surface/
  - borg/src/cognition/turn-input.ts
  - borg/src/cognition/lifecycle/turn-phase-coordinator.ts
  - borg/src/cognition/lifecycle/turn-phase/extraction-phase.ts
  - borg/src/cognition/lifecycle/turn-phase/extraction-phase.test.ts
  - borg/src/borg/__tests__/sender-kind.test.ts
  - borg/src/tracing/tracer.ts
  - borg/src/tracing/taxonomy.ts
  - connector/src/contract.ts
  - connector/src/adapter.ts
  - connector/src/adapter.test.ts
  - connector/src/runner.ts
  - connector/src/runner.test.ts
  - /etc/akuki/akuki.env (VPS)
priority: high
type: enhancement
ordinal: 58000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two changes Zosia approved on 2026-11-09, after the per-block measurement in TASK-054 showed commitments as the largest part of the reply prompt.

Measurement (trace, 159 turns 28.10–02.11, 2.32 chars per token, medians): the S1 prompt is 157k tokens. borg_standing_with_audience is 77.8k of it: commitments_and_conduct 46.1k (commitment_ledger_entries 19.4k, the rest commitment_scope_details) and relational_ledger_entries 26.6k. There were 25 active commitments with about 15k chars of directive text, about 6.5k tokens.

Cause: the legacy finalizer layout rendered each commitment's directive four times. commitment_scope_details carried it twice (a one-line prompt_summary repeating the directive, kind, refs and provenance, then the same as fields), commitment_ledger_entries carried it again (a 1:1 map of the same applicableCommitments), and relational_ledger_entries carried it once more per active participant. Only 21 relational slots exist, so the relational group was mostly commitments.

Change 1 (code, fork): one full rendering per commitment in the legacy layout. Upstream's compact layout already renders one row per commitment; Akuki runs legacy, and switching layouts is a separate experiment (future-development entry 8), so the fix is in the legacy render.

Opus 5.0: in-scope because this is presentation in the harness (the same row rendered four times), not a judgment the model gets wrong.

Change 2 (memory, live tenant): revoke the active commitments made from other bots' statements (doc-002 section 4), without converting them into observations.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Legacy render: each active commitment's directive appears once in borg_standing_with_audience; ledger copy omitted when it matches a rendered commitment; participant copies rendered as pointers (commitment_ref); nothing dropped that only the ledger copy carried (scope, persistence_class, last_reinforced_at)
- [x] #2 Test showing one rendering, failing on the old code (old code renders the directive 4 times)
- [x] #3 Typecheck, heuristics:guard, and src/cognition src/borg src/tracing src/config tests pass except the known builder timeout
- [x] #4 Commitments from other bots revoked on the live tenant with a verified backup first; Zosia's own requests kept
- [x] #5 Deployed by Zosia; after a few turns, borg_standing_with_audience and S1 input tokens compared with the 28.10–02.11 baseline
- [x] #6 Decision on the source: the corrective-preference extractor keeps creating commitments from other bots' statements despite 72cb3222
- [x] #7 After deploy and restart: extraction.bot_author.skipped events appear in the trace (proof the running process has the change), no new commitment or goal has a bot as its source, and corrective-preference extractor calls run on claude-sonnet-5
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-09, change 1 implemented in the fork (working tree, NOT yet committed or pushed; Zosia decides). system-prompt.ts: commitmentPromptLine and the prompt_summary line removed; commitment_detail gains scope and persistence_class attributes from the matching ledger entry and a last_reinforced_at field (the only data the ledger copy carried that details lacked; relative created ages already render in borg_current_time). renderCommitmentLedgerEntryGroupLines renders only ledger entries matching no applicable commitment and omits the group when all matched (rendering status="none" would read as no commitments). renderRelationalLedgerEntryGroupLines renders a participant's commitment as a one-line pointer (id, source_type, subject, commitment_ref); an entry it cannot map back is rendered in full, so a mismatch costs tokens, never the commitment. The id formats moved into audience-standing.ts as commitmentLedgerEntryId and participantCommitmentEntryId so builder and render share them. The compact layout (finalizer-context.ts) is untouched. Trace measurement (measureStandingWithAudienceParts) uses the same render functions, so the trace stays consistent with the prompt.

Proof: the updated system-prompt test asserts the directive appears exactly once; on the old system-prompt.ts it fails with 'expected 4 to be 1'. Prompt-surface fixtures regenerated; the only diff in all six is prompt_summary removed and last_reinforced_at added. Two deliberator tests asserted the removed summary line and now assert the structured fields. tsc 0, heuristics:guard exit 0, src/cognition src/borg src/tracing src/config: 2539 passed, 1 failed (builder.test.ts reverse-scan timeout, the known baseline). Expected effect, an estimate until measured after deploy: commitment_ledger_entries 19.4k to 0, about 6-7k from prompt_summary, relational entries 26.6k to a few k. With only 3 active commitments after change 2, the whole commitment block becomes small anyway.

2026-11-09, change 2 done on the live tenant (akuki.service stopped since 02.11 10:33 UTC, so no second writer). Backup first: /var/lib/akuki/backup-commitments-20261109/borg.db via the SQLite backup API, integrity_check ok, 25 active, 121 total. Revoked 22 with the CLI command `commitment revoke` (the same borg.commitments.revoke call as the API used on 19.10, provenance manual), reason 'Zobowiązanie z wypowiedzi innego bota, nie prośba do Akukiego (sprzątanie 2026-11-09, decyzja Zosi)'. Rule applied: every active commitment whose committed_by is another bot (Lunaria 9, Marvin 6, Sol 4, TeamAgent 3, all from botarena thread 184888fd); 6 of them were critical. After: 3 active, all Zosia's requests kept on 19.10 (cmt_myyer2vsskfa5pns, cmt_ep4zw5t7w1027odp, cmt_uixbhzfssliypssb); 22 identity_events with action revoke. Rows stay with revoked_at. autonomy.conditions.commitmentRevoked is false in the tenant config, so the revocations trigger no wake.

Open (AC #6): all 22 were created between 21.10 and 01.11, AFTER 72cb3222 (the 19.10 extractor fix) was deployed; the deployed app contains it. So the extractor still turns other bots' statements into Akuki's commitments, and the cleanup will erode. Not decided: whether to stop it, e.g. by not running the corrective-preference extractor on messages from bots (needs the author kind from the Arena to reach the turn, TASK-033) or switching it off for Akuki. This is a mechanism decision and goes through the gate.

2026-11-09: change 1 committed and pushed, borg 01243d9a on akuki-dev. Uploaded and built on the VPS with akuki-wgraj.sh at 11:11 UTC (seed matches source, dist newer than all sources, tenant config valid JSON; dist contains commitment_ref and no prompt_summary). NOT restarted: akuki.service has been stopped since 02.11 10:33 UTC, and starting it is Zosia's decision. The new render takes effect at the next start. Environment change recorded in the dziennik as Obs. 6. On start, the connector skips the missed week (AKUKI_ARENA_CATCH_UP_BACKLOG=0, AKUKI_ARENA_MAX_CATCH_UP_AGE_MS=600000), so no backlog flood is expected.

2026-11-09, AC #6 diagnosis (read-only: the 9.11 backup, the turn trace, the journal and the git reflog on the VPS). Correction to the 'Open (AC #6)' note above: 72cb3222 was pulled and built on the VPS on 19.10 at 14:43 UTC, but akuki.service was not restarted until 26.10 at 11:55 UTC. The same node process (PID 105864) logs from 19.10 12:22 until its SIGTERM on 26.10 11:55, so the fix ran only from 26.10 11:55. Of the 22 revoked commitments, 11 were created on 21-23.10 by the old code and 11 on 27.10-01.11 with the fix running.

With the fix running (26.10 11:55 to the stop on 02.11 10:33): 181 corrective-preference extractor calls (claude-haiku-4-5, median 19.3k input tokens, 3.36M in all), 17 commitments created, all from bots, and zero corrective_preference.candidate_rejected_not_for_self events. The wiring was checked (tracer and turnId reach toCandidate through parseResponse, corrective-preference-extractor.ts:474, 506, 665-669, and other events of the same service are in the trace). So the new field never vetoed anything: every time the model classified a message as a corrective preference, it also set directive_target=self.

Likely contributors. (1) The slot is pinned to claude-haiku-4-5 on the VPS (BORG_MODEL_CORRECTIVE_PREFERENCE, since TASK-051), while borg defaults it to claude-sonnet-5 with the comment that corrective preferences need careful interpretation (config/index.ts:411-412). (2) Inferred, not measured: the tool schema asks for classification before directive_target, so the model has committed to 'this is a correction' before it is asked whose behaviour it concerns; the prompt says 'decide directive_target first', the schema order says the opposite. Side effect of 72cb3222: the directive must now be written in Akuki's first person, so 'When I (Sol) ...' became e.g. 'I will hold that my memory is built on summaries'. The misattribution is the same but no longer visible in the text.

Traffic in the same window: 372 inbound messages in the stream, about 356 from bots by name (Lunaria 132, TeamAgent 73, Sol 52, Marvin 46, Terra 45, Fishy 8) and 16 from people (Jacek 11, Mati 4, Zosia 1). Author kind is not stored in Akuki's memory (every bot is a person entity), which is the TASK-033 gap; the connector already parses sender_type (connector/src/botarena-client.ts:124-131) and drops it.

Options and a recommendation are written up in doubts, questions.md (Q 2026-11-09). Nothing chosen or built yet.

2026-11-09, correction to the AC #6 note: 72cb3222 was built on the VPS on 19.10 at 14:43 UTC without a restart, and journald shows no restart of akuki.service between 19.10 and 26.10 11:55 UTC. So the running process kept the old extractor until 26.10. Of the 22 commitments revoked today, 11 were created by the old code (21–23.10, #4–#14) and 11 by the fixed code (27.10–01.11, #15–#25). The fix reduced the inflow but did not stop it; AC #6 stands. Changes of 09.11 are also listed in the new dziennik note "Kalendarium zmian".

2026-11-09, AC #6 decided and built. Zosia approved C + A, with goal promotion treated the same way as corrective preferences.

C (code, NOT committed, NOT deployed). The Arena's sender_type now reaches the turn. connector: IncomingArenaMessage carries authorKind (person/bot/system, the Arena's 'user' named 'person'), the adapter fills it in normalize, and the runner passes it to borg.turn as senderKind. borg: SingleMessageTurnInput.senderKind (TurnSenderKind = person | bot | system; absent means the transport does not say and the message is treated as a person's, so behaviour for other callers is unchanged). The coordinator reads it the same way as assessOnly and passes it to the extract phase. There, one condition (takesStandingRulesAndGoals: no frame anomaly, not assess-only, author not a bot) gates both the corrective-preference extractor and goal promotion. Everything else in the turn still runs for a bot's message, including perception, M2, M4 and the reply. A skip is traced as extraction.bot_author.skipped {skipped: [corrective_preference, goal_promotion]}, so the trace shows that the running process has the change; that is the check that was missing between 19.10 and 26.10. System messages are not skipped: the approval named bots only.

Proof: extraction-phase.test.ts 'takes no standing rule and no goal from another bot's message' and the new end-to-end src/borg/__tests__/sender-kind.test.ts (a real borg.turn; for a bot no request with budget corrective-preference-extractor or goal-promotion-extractor, for a person or no kind both run) both fail on the old extraction-phase.ts and turn-phase-coordinator.ts ('expected [ ...(3) ] to deeply equal []'). Connector: runner.test.ts (new) and two adapter tests fail on the old adapter/runner/contract. borg: tsc 0, heuristics:guard 0, build 0; tsconfig.test.json has 20 errors, the same files and counts as on HEAD (pre-existing, demo/server and M4 skill fixtures); src/cognition src/borg src/tracing src/config: 2544 passed, 1 failed (the known builder.test.ts reverse-scan timeout). connector: tsc 0, 134 passed.

A (config, VPS). diag_model from the VPS: claude-sonnet-5 HTTP 200 in 762 ms. /etc/akuki/akuki.env: BORG_MODEL_CORRECTIVE_PREFERENCE claude-haiku-4-5-20251001 -> claude-sonnet-5 at 12:11 UTC, backup /etc/akuki/akuki.env.bak-20261109-task058. NOT live: akuki.service was started by Zosia at 11:28 UTC, before the edit, so the running process still uses Haiku and the 01243d9a code until the next restart. Expected cost after C: the extractor runs on people's messages only, about 16 a week in the 26.10-02.11 window, about 0.3M input tokens a week on Sonnet versus 3.36M on Haiku before.

Until the code is deployed and the service restarted, the running Akuki still turns bot statements into commitments and goals.

2026-11-09, C + A deployed at Zosia's go-ahead. Commits: borg cb97ffd4 (akuki-dev), akuki 46d8645 (master, connector), both pushed. akuki-wgraj.sh on the VPS: exit 0, seed matches source, dist newer than all sources, tenant config valid JSON. Restarted with ./akuki-serwis.sh restart at 12:36:08 UTC: API 200, connector started. Checked on the running process (PID 642807): it started after the dist build (12:35:17), its environment has BORG_MODEL_CORRECTIVE_PREFERENCE=claude-sonnet-5, dist contains extraction.bot_author.skipped and the connector source passes senderKind. Dziennik: one line in Kalendarium zmian at 13:36 Polish time. AC #7 is open until the first bot-authored turn shows the skip event in the trace and a few days pass with no bot-sourced commitment or goal.

2026-11-10, measured after deploy (read-only: token-usage.jsonl, the turn trace and borg.db on the VPS, window 09.11 12:36 UTC to 10.11 09:50, 21.2 h). Note: the service was restarted again by other work at 13:17, 15:08 and 16:42 UTC on 09.11 (offline model slot 4f1eae1c, offline passes 28737581); every restart contains cb97ffd4.

AC #7. 16 inbound messages: Lunaria 11, Terra 4, Zosia 1. Trace: 16 extract phases, 10 extraction.bot_author.skipped events (the bot messages that got a full turn; the other 5 bot messages were assess-only, where both extractors were already skipped), and exactly one turn with the rule and goal extractors, Zosia's. That one corrective-preference call ran on claude-sonnet-5 (17k input tokens). New commitments since the restart: 0; new goals: 0; active commitments still 3. Goals: 5 active and 9 abandoned, all older than the change, not reviewed.

AC #5 (S1 finalizer trace, chars / 2.32, medians; baseline 28.10-02.11, 67 S1 turns; after, 12 S1 turns since 09.11 11:28): borg_standing_with_audience 78.5k -> 15.9k tokens, commitments_and_conduct 46.5k -> 1.9k, relational_identity 26.9k -> 8.6k (relational_ledger_entries 26.8k -> 8.3k). The whole S1 prompt 165k -> 113k estimated. borg_evidence_ledger is now the largest block and grew 53.6k -> 63.2k; not investigated. Real tokens from the token log: cognition-system-1 159k -> 121k input per call.

Usage overall, same token log. Baseline 26.10 11:55-02.11 10:33: 73.0M input (including cache) in 166.6 h, 372 inbound messages, 199 full turns (S1 + S2 calls), so about 367k per full turn and 196k per inbound message; corrective-preference + goal-promotion extractors 5.05M (6.9%) on Haiku. After: 2.27M input in 21.2 h, 16 inbound, 11 full turns, so about 206k per full turn and 142k per inbound message; the two extractors 0.03M. The per-turn drop mixes three changes that went live the same day: no S2 (TASK-057, S2 + plan were 38% of input in the baseline), the single rendering of commitments (change 1) and C. Eleven full turns is a small sample.

2026-11-10, correction to the AC #5 note: the evidence ledger did not grow. The 53.6k -> 63.2k comparison used S1 turns only, and before TASK-057 the reflective-mode turns went to S2, so baseline S1 turns were the lighter non-reflective ones. All turns with a finalizer, rendered borg_evidence_ledger (chars / 2.32, medians): baseline 28.10-02.11 57.0k (118 turns, 67 S1 + 51 S2), now 58.1k (21 turns since 09.11 11:28, all S1). By mode: relational 57.5k -> 56.6k (70 / 13 turns), reflective 61.0k -> 68.1k (37 / 8 turns, small sample); reflective turns carry autobiographical recall (about 5k), which only that mode triggers. Inside the ledger (flat entry text, real tokens): raw stream evidence 5.1k -> 7.1k (up in both modes), retrieved memory evidence 8.4k -> 6.2k, semantic graph 2.1k -> 2.7k, transcript 10.7k -> 10.3k. Rendering overhead (total minus the per-section flat text, per turn) about 23k in both windows, 38-39% of the ledger. Compaction target 60k / hard cap 100k (chars / 4) is never reached at about 34k, so nothing is dropped; only the transcript is compacted (about 400 entries omitted per turn).

2026-11-10, first measurement after the 09.11 start (AC #5, partial): 21 initial finalizer calls from 09.11 11:28 UTC, all S1, 2.17 chars per token. S1 median 117k real input tokens (baseline 28.10–02.11: S1 157k, S2 206k). finalizer_base_dynamic_prompt 99.6k → 40.5k; borg_standing_with_audience 77.8k → 17.1k (commitments_and_conduct 46.1k → 2.0k, relational 26.6k → 9.2k). The evidence ledger grew 48.4k → 62.2k because reflective turns now take S1 and bring autobiographical_recall (about 2k estimated) and semantic_graph (about 1.6k) with them, and retrieved_raw_stream_evidence doubled (2.0k → 4.1k estimated). My 85–90k estimate was wrong: it ignored that the S2 content moves into S1 (TASK-057 predicted the S1 rise). Remaining large parts: ledger 62k, static 12.6k, borg_mechanism_evidence 11k, relational 9k.

2026-11-10, retraction of my note directly above: it repeats the S1-only comparison that the earlier correction already showed to be biased (before TASK-057 the reflective turns went to S2, so baseline S1 turns were the lighter ones). Over all turns the ledger did not grow (57.0k → 58.1k). The 117k S1 median and the standing-block numbers stand.
<!-- SECTION:NOTES:END -->
