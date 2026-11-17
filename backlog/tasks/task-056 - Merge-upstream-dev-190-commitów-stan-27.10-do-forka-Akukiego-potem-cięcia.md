---
id: TASK-056
title: 'Merge upstream/dev (190 commitów, stan 27.10) do forka Akukiego, potem cięcia'
status: In Progress
assignee: []
created_date: '2026-10-30 11:15'
updated_date: '2026-11-02 09:25'
labels:
  - borg-fork
  - merge
  - tokens
dependencies:
  - TASK-054
priority: high
type: task
ordinal: 56000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Zosia's decision of 2026-10-30: merge all upstream changes first, then make the cuts. Before this, akuki-dev was 51 commits ahead of upstream/dev and 190 behind. The merge base was d112309e (14.09), and the upstream tip is 1d01f886 (27.10).

The merge is done on the branch akuki-merge-upstream-1030 (from akuki-dev at 878c2418). akuki-dev and the VPS stay unchanged until the tests pass and Zosia approves the deploy.

Conflicts (14 files), resolved as follows (final state):
- **src/autonomy/migrations.ts:** id collision. Upstream's preparation_failed (9) and turn_provider_failed (10) keep upstream's ids. The fork's no-op autonomy_wakes_prediction_error_spike (applied on the live bank as 14000009) moves to the fork's own group (memory/predictions/migrations.ts, id 3, composed 29000003). The runner re-ids it by name. This follows the fork's rule that fork groups sit after upstream's, so upstream ids stay what upstream ships and tests.
- **src/memory/commitments/repository.ts:** both sides were kept. From the fork: hasExternalMapping and stampAdopted (TASK-038, deduplicating entities). From upstream: resolveAudienceLabel, and get() following merged_into redirects.
- **demo/server/src/index.ts:** combined. The plugin still loads before loadConfig (prepareEnv). Upstream's hostTracer, memory sampler and the shutdown guard are added. ensureDemoDefaultSession keeps demoAudienceLabel.
- **src/llm/index.ts:** upstream now counts usage once per logical call (runLogicalCall). The fork's change, recording the model id returned by the provider, was carried over into AnthropicCallState.providerModel. The four per-call emitUsage calls from the fork were dropped, because they would double-count.
- **src/llm/openai-compatible.ts:** upstream's structure, plus the provider model id.
- **finalizer.ts / system-prompt.ts:** the fork's trace instrumentation (dynamic_block_chars, base_dynamic_section_chars, the standing parts) is kept together with upstream's shownGoalIds.
- **window_silent_span:** dropped, as upstream removed it in 891e6bad.
- **config:** upstream's model defaults (opus-5-5). Akuki's env pins every slot, so nothing changes in practice.
- **AGENTS.md / README.md:** taken from upstream.
- **Tests:** combined (both sides). Several upstream tests were adapted to the fork (see the notes): provider model in the usage sink, the fork's migrations on Sol's ledger, M2 in the prompt fixtures, and a `reason` field removed from one corrective test.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Conflicts resolved with the decisions recorded (above)
- [x] #2 Typecheck (5 projects) and heuristics:guard pass; vitest src/ shows no new failures against the baseline
- [x] #3 Connector typechecked and tested against the merged borg
- [x] #4 Migrations rehearsed on a copy of the live bank: no lost columns or data, idempotent
- [x] #5 Akuki's tenant config.json validates under the merged schema, and the models do not change
- [x] #6 New tools and changed defaults listed, with Zosia's decision on the tools
- [ ] #7 Pre-merge baseline recorded; after the deploy, a reading by the same script (TASK-053/054)
- [x] #8 Deploy approved by Zosia, with a backup and rollback plan
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-10-30, checks on the merge branch:
- **Connector** (akuki/connector, borg via the ../../borg symlink, merged dist): tsc passes, vitest 132/132.
- **Migrations, rehearsed on a copy of the live bank:** borg.db was copied with the SQLite backup API, quick_check ok, sha256 807fe961….
  - 81 → 88 applied. The 7 new ones: open_question_refusal_backoff, goal_superseded_status, entity_identity_redirects, autonomy_wakes_preparation_failed (14000010), autonomy_wakes_turn_provider_failed (14000011), stream_frame_anomaly_annotations and stream_quarantine_restoration_applications.
  - A second open is a no-op (idempotent).
  - 0 lost columns. goals was rebuilt and its rows are identical (only the CHECK gains 'superseded'). New columns: entities.merged_into, 4 columns on open_questions (refusal backoff), 2 on autonomy_wakes. 3 new tables.
  - No row counts changed. autonomy_wakes still has prediction_error_spike in its CHECK. integrity_check ok, 0 foreign-key violations.
- **Akuki's tenant config.json** (taken from the VPS) passes loadConfig on the merged code. All model slots stay the same under Akuki's env. The new slot preTurnExtraction (optional) falls back to recallExpansion (haiku), the model those extractors already used. The switches from 26.10 hold.
- **No dependency files changed** (package.json and lockfiles). 467 files changed, +48.9k/−4.4k.
- **demo/server tsc:** errors from the local environment, not from the merge. There are two copies of zod (demo/server 4.5.4, root 4.4.3), and the code involved has been in the fork since September. The VPS runs the server through tsx, without a typecheck.

**New tools (need Zosia's decision):** tool.episodic.get and tool.stream.get. Both are read-only (writeScope read). Each reads the full text of one of Akuki's own memory records by id (an episode, or a stream entry), with disclosure labels. They are offered only in S2 turns and wake-ups (allowedOrigins autonomous and deliberator). No web, file or shell access. Possible token cost: full reads add input in S2 and in wake-ups.

**Changed defaults and behaviour (with no Akuki config override):**
- review-resolver now also runs in light passes (every 4 h, maxItemsPerPass 3). Before, it cost about 0.1% of tokens.
- autonomy.prepToolTimeoutMs goes from 30 s to 90 s.
- autonomy.maxWakesPerWindowBySource is a new setting, empty by default. It can serve the cuts, e.g. a cap on commitment_revoked.
- Executive-focus presentation latch (e97aabbb): the same goal is not re-presented without a change. Existing goals get one presentation after the deploy, so a short burst of wake-ups is possible, still within the limit of 6 per day.
- Rumination backs off after 3 refusals, for 7 days.
- Frame anomalies become a label instead of an exclusion from recall, but only on the source types in frameAnomaly.peerChannelSourceTypes (default ["kira"]). botarena keeps the strike. The restoration script (scripts/restore-peer-frame-anomalies.ts) is manual, and we do not run it.
- raw recall queries are bounded (retrieval.rawQueryMaxBytes, 6144 B).

**Pre-merge baseline** (26.10 11:55 – 30.10 08:26 UTC, from the token-usage log and the trace; report in Obsidian akuki_token_usage_report_2026-10-30):
- 278 messages and 125 replies
- 363k input per reply, 163k per processed message
- median S1 150k, S2 211k, plan 53k
- wake-up about 620k each
- standing_with_audience 74k (commitments 44k, relational 25k)

2026-10-30, fixes after the first full vitest src/ run (30 failures in 7 files, all explained):
- **Migration numbering, changed from the first resolution.** The no-op autonomy_wakes_prediction_error_spike moved from the autonomy group into the fork's own group (memory/predictions/migrations.ts, id 3, composed 29000003). The autonomy group is again exactly upstream's: preparation_failed 9, turn_provider_failed 10. Reason: the upstream test of Sol's ledger requires upstream ids, and the fork's rule says fork groups sit after upstream's so that upstream ids stay the same. The rehearsal was repeated on a fresh copy of the live bank: the runner moved the applied M2 row 14000009 → 29000003 with applied_at preserved, applied the 7 new migrations, a second open is a no-op, row counts are unchanged, prediction_error_spike is still in both CHECKs, integrity ok, 0 FK.
- **Sol ledger test** (storage/sqlite/migrations.test.ts): the fork's own 7 migrations (6000002, 9000002, 10000003, 10000004, 29000001–29000003) are added as an explicit pending list. On Sol's bank they cannot already be applied.
- **llm/index.test.ts (18 tests):** the fork records the model id reported by the provider in the usage sink (the connector's token log relies on this, and it reveals proxy substitution). Upstream's tests expected the requested model. The expectations were changed to the model of the response that was counted (toolResponse.model, second.model, noToolResponse.model). The upstream behaviour (one sink call per logical call) is unchanged.
- **prompt-surface fixtures (8 files):** regenerated. The whole diff is one line: "3 conditions" becomes "4 conditions … prediction_error_spike" (the fork's M2 wake condition).
- **builder, turn-orchestrator, belief-reviser, demo server "caps activity rows":** all four pass on their own. They were timeouts with the CPU loaded to 17 on 8 cores.
- **Typecheck (5 projects):** 5 errors, the same 5 as on akuki-dev before the merge (an old M4 debt in the tests: skill fixtures lack founding_* and acquisition_mode, and Promise<never[]> in prediction-turn-service.test). The merge adds none. guard passes.

2026-10-30, the merge is committed: **f922b68f** on akuki-merge-upstream-1030. It is NOT pushed, and akuki-dev and the VPS are unchanged.
- Second vitest src/ run: 5757 passed, 3 failed, all `Test timed out in 15000ms` (builder, turn-orchestrator participant scan caps, demo server "caps activity rows"). Each passes on its own. builder and turn-orchestrator are in the fork's known timeout baseline.
- Typecheck: the same 5 errors as before the merge. guard passes.
- dist was rebuilt after the change to migration numbering. Connector: tsc passes, 132/132.
- The new tools tool.episodic.get and tool.stream.get have no config switch (they are registered unconditionally in borg/tools-setup.ts). Turning them off would be a code change in the fork.

**Deploy plan (waiting for Zosia's approval):**
1. Locally: fast-forward akuki-dev → f922b68f, then `git push origin akuki-dev`.
2. VPS: back up borg.db (Python sqlite3.backup, as there is no sqlite3 CLI), lancedb, config.json and akuki.env to /var/lib/akuki/backup-deploy-<date>.
3. VPS: run `akuki-wgraj.sh` (pull --ff-only, build, checks).
4. `./akuki-serwis.sh restart`. The migrations run when Borg opens. Check the journal, API 200 and the connector start.
5. Check _migrations on the live bank: 88 rows, M2 at 29000003.

**Rollback:** the old code (878c2418) will NOT open a bank after the migrations, because the runner refuses applied names it does not know. Rolling back therefore means: stop, restore borg.db (deleting the -wal/-shm) and lancedb from the backup, check out 878c2418 in /opt/akuki/app, build, start. Messages that arrived between the deploy and the rollback would be lost from memory, because CATCH_UP_BACKLOG=0.

2026-10-30, Zosia's decisions and the deploy:
- **Tools:** tool.episodic.get and tool.stream.get stay.
- **Wake-ups (the first cuts):**
  - autonomy.conditions.commitmentRevoked.enabled = false. This trigger caused 20 of 27 wake-ups between 22 and 27.10, 13.8M tokens.
  - autonomy.maxWakesPerWindow 6 → 2 per day. reservedContemplativeWakesPerWindow stays 1. In practice that leaves at most 1 operational wake-up a day (executive focus or open_question_urgency_bump), with the other slot reserved for contemplative sources (scheduled_wake; scheduled_reflection and prediction_error_spike are off).
  - Executive focus stays on.
  - Config backups: config.json.bak-20261030-wakes, plus the copy in backup-deploy-20261030.
- **Deploy, 30.10 at 11:57–11:59 UTC:**
  1. akuki-dev was fast-forwarded to f922b68f and pushed (878c2418..f922b68f).
  2. Service stopped. Backup in /var/lib/akuki/backup-deploy-20261030 (130M): borg.db via the backup API (quick_check ok, 81 migrations), lancedb, stream, working, embedding-profile.json, config.json and akuki.env.
  3. akuki-wgraj.sh, then start.
- **After the start:**
  - API 200, connector started.
  - Live bank: 88 migrations, M2 re-id'd to 29000003, preparation_failed 14000009, turn_provider_failed 14000010, quick_check ok.
  - loadConfig on the deployed dist: maxWakes 2, commitmentRevoked false, execFocus true, sharedState false, window 1 day, actionState false, peerChannelSourceTypes ["kira"].
  - The only error line in the journal predates the deploy: 29.10 09:05, an abandoned turn after a 502 from aiproxy.
- **Rollback,** if needed: stop, restore borg.db (deleting the -wal/-shm), lancedb, stream and working from backup-deploy-20261030, check out 878c2418 in /opt/akuki/app, build, start.
- **Next:** read token use against the pre-merge baseline (TASK-053/054 script) after a day of traffic.

2026-10-30, analysis of the autonomous token sinks over 19–29.10 (11 days, 16.0M input per day), for the next cuts:
- **Wake-ups: 15.2%, 2.44M per day.** 43 turns at 624k each, 2.4 finalizer rounds per wake-up on average (max 7). The loop is capped at 8 iterations by the code constant AUTONOMOUS_MAX_ITERATIONS in turn-action/tool-loop.ts, not by config. Every round reads the whole prompt again (about 250k). Akuki's dynamic cache is off (TASK-043), so rounds within one wake-up get no cache. From 30.10 the cap is 2 per day, and commitment_revoked is off.
- **Offline processes: 4.9%, 781k per day.** Per day:
  - offline-review-open-question 256k (6.5 calls × 39k)
  - overseer 99k
  - associator 90k
  - reflector 88k
  - self-narrator 81k
  - semantic-extraction 47k
  - ruminator 42k, plus duplicate-judgment 12k
  - lived-experience-day-summarizer 34k
  - review-resolver 16k
  - commitment-reconciler 14k
  - consolidator 2k

  The heavy pass runs around 15–17 UTC; the light passes run every 4 h.
- **Open questions, autonomous part:** a review queue item becomes an open question through an LLM call (ReviewOpenQuestionExtractor, review-queue hook), plus rumination: about 310k per day, about 2%. Review queue items over 11 days: contradiction 53, new_insight 32, identity_inconsistency 14, commitment_reconciliation 6, other 8. Open questions created over the same 11 days: reflection 124, contradiction 50, overseer 8, associator 5.
- **Proactive outbound:** 1 wake-up with a post. The direct cost is negligible.

2026-10-31, Zosia's decision: cap a wake-up at 3 rounds, and turn off the overseer and the review-resolver.
- **Code (borg 6325ca4e, pushed to akuki-dev):**
  - New config setting autonomy.maxFinalizerRoundsPerWake, unset by default, which keeps upstream's behaviour.
  - When set, an autonomous finalizer gets maxIterations = N−1 plus closeWithTerminalTools. The last (N-th) request offers only the emission tools, so the wake-up ends in a decision (for example EmitContinueThought) instead of a text-only stop, which the finalizer reads as invalid_tool and regenerates, at the cost of another round.
  - The change sits in the shared tool loop only behind that opt-in. Without it the cap behaves as upstream (text only). It is plumbed config → deliberation-phase → Deliberator → runFinalizer → executeToolLoop.
  - Tests:
    - tool-loop: closing with terminal tools only. It fails on the old code. A no-dispatch guard was checked by mutation.
    - finalizer: the round cap reaches the loop. It fails without the plumbing.
    - config: unset by default, 3 accepted, 0 rejected.
    - The deliberation-phase fixture gained `autonomy: {}`, because it had a partial config without that section.
  - src/cognition + config + autonomy: 2582 passed, 3 known timeouts (builder, turn-orchestrator, executive-focus-due; the last passes on its own). tsc and guard pass.
- **Tenant config (target),** checked locally with loadConfig on the new code:
  - autonomy.maxFinalizerRoundsPerWake = 3
  - maintenance.lightProcesses = [consolidator, semantic-extractor, curator]
  - maintenance.heavyProcesses = the defaults minus overseer and review-resolver
  - Note: these lists are now explicit, so future upstream changes to the default lists will not reach Akuki by themselves.
- **Side effect of turning off the review-resolver:** queue items stay open. Insights from the reflector are not confirmed, and contradictions stay unresolved, showing as an "open revision" label in recall. Nothing is quarantined. The review queue → open question hook still runs at enqueue time, but there are fewer items, because the overseer was a source of identity_inconsistency, misattribution and temporal_drift.
- **Deploy:** blocked by the agent session's permissions (Production Deploy). The script /tmp/akuki-wdroz-ciecia.sh is ready (code, then config with backup config.json.bak-20261031-cuts, then restart), for Zosia to run.
- **Check after the deploy:** autonomy_wakes.finalizer_rounds ≤ 3 for new wake-ups. No offline-overseer or review-resolver calls in the token log.

2026-11-02, reading after the merge (30.10 11:59 – 02.11 08:23 UTC, 2.8 days). The 31.10 cuts (round cap, overseer and review-resolver off) are NOT deployed: the VPS is still on f922b68f, and the tenant config has neither maxFinalizerRoundsPerWake nor the process lists. 0 error lines in the journal over 3 days.
- Per day: 7.7M against 12.15M before (26–30.10). Traffic fell, though, from 72 to 29 messages a day, so this does not measure the cuts.
- Per reply: 385k against 360k (+7%). S1 median 173k against 149k, S2 220k against 210k. The reply prompt keeps growing.
- Wake-ups: 1 in 2.8 days (against about 4 a day before). That was executive_focus_due on 01.11 at 23:50: 2 rounds, 344k, outcome error (LLMRefusalError, the provider refused after the retry).
- Offline: 1018k a day against 815k. review-resolver 55 calls in 2.8 days against 12 in 4 days before, because upstream added it to the light passes. Overseer 24 calls. offline-review-open-question fell to 11 calls (from 28).

2026-11-02, the 31.10 cuts deployed at 08:30 UTC. Zosia ran akuki-wgraj.sh herself through akuki-wdroz-ciecia.sh, which was recreated in the project directory after /tmp was wiped.
- Fork 6325ca4e.
- Config backup: config.json.bak-20261031-cuts.
- After the restart: API 200, connector started, 0 error lines in the journal.
- loadConfig on the deployed dist:
  - maxFinalizerRoundsPerWake 3
  - maxWakesPerWindow 2
  - commitmentRevoked false
  - lightProcesses [consolidator, semantic-extractor, curator]
  - heavyProcesses without overseer and review-resolver
- To check after about a day: autonomy_wakes.finalizer_rounds ≤ 3 on new wake-ups, and no offline-overseer or review-resolver calls in the token log after 08:30.

2026-11-02, correction: tool.episodic.get and tool.stream.get (and tool.ownRecords.list) are offered on EVERY live turn, both S1 and S2, plus in wake-ups. The earlier note said "only in S2 turns and wake-ups", and that was wrong. allowedOrigins [autonomous, deliberator] covers every finalizer: the finalizer runs with origin "deliberator" on both paths. The read-tool menu (LIVE_TURN_READ_FINALIZER_TOOL_MENU) goes into the prompt of every live turn.
<!-- SECTION:NOTES:END -->
