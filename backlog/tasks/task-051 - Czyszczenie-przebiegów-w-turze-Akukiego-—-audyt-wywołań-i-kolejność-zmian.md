---
id: TASK-051
title: Czyszczenie przebiegów w turze Akukiego — audyt wywołań i kolejność zmian
status: To Do
assignee: []
created_date: '2026-10-05 12:41'
updated_date: '2026-11-09 16:43'
labels:
  - latency
  - arena
  - audit
dependencies:
  - TASK-047
  - TASK-050
priority: high
type: task
ordinal: 50000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Read-only audit of 2026-10-05 on branch `akuki-merge-upstream`. Timings come from the VPS (which still runs pre-merge `3a168d76`): 96 full turns since 2026-10-01, and `token-usage.jsonl`, whose `ts` is the time a call ended.

**Critical path.**
- The connector posts only after `borg.turn()` returns (`connector/src/adapter.ts:296`, `runner.ts:112`).
- `turn()` returns only after the post-response shared-state compile, reflection, close-actions and corrective persistence (`post-generation-phase.ts:819, 839, 896, 922`).
- Only episodic ingestion is fire-and-forget (`turn-phase/utils.ts:110`). It does run synchronously in `pre_turn_catchup` after assess-only turns (`turn-phase-coordinator.ts:733`, `ingestion/coordinator.ts:375-409`).
- Assess-only turns run serially before the answered message (`adapter.ts:189-190, 278`), at about 20–28 s each.
- Everything is serial except perception (4 calls, `perceive.ts:178`) and extraction (6 calls, `extraction-phase.ts:221`).

**Medians.**

| Segment | Median | p75 |
|---|---|---|
| Frame | 3.6 s | |
| Extraction | 13.8 s | 32.5 s |
| Closure-loop | 6.1 s | |
| Recall planner | 2.6 s | |
| Retrieval + pre-answer shared-state | 14.8 s | |
| S1 | 5.7 s | |
| S2 (plan + verification recall + S2) | 29.0 s | |
| Guards | 8.0 s | |
| After agent_msg until turn returns, message turns | 16.7 s | |
| After agent_msg until turn returns, observed turns | 5.1 s | |

- The prediction-extractor (M2) is the slowest extraction call in 86 of 96 turns. Without it, extraction drops to 8.7 s.
- S2 ran on 43 of 96 turns.
- One unexplained 46 s stall before extraction (turn at 08:34:50 on 2026-10-05) sets the p75.

**Top savers, estimated.**
1. **Post the reply at persist (`post-gen:579`) and run post-reply work afterwards.** About 17 s per message turn. The reply text does not change.
2. **Lighter assess-only turns, with M2/M4 and the extractors deferred.** About 15–20 s per queued message.
3. **S1 forced in light turns.** About 23 s on S2 turns, about 10 s on average.
4. **Pre-answer shared-state compile precomputed after the previous turn, or skipped in light turns.** About 5–13 s. This is legitimate because by design the compile may not read the current message (`retrieval-phase.ts:2285-2290`).
5. **Smaller items.** M2 deferred in light turns: about 5 s. Closure-loop moved into the extraction `Promise.all`: about 6 s, pending a check that it needs no extractor output. Advisory commitment-judge shadow and shadow closure-auditor moved off the path (`guard-runner.ts:211`, `closure-pressure-guard.ts:327-339`): about 3–5 s.

**Work-assistant machinery with no M-milestone reader:** goal-promotion-extractor, action-state-extractor, pending-action-judge, and the shared-state "decision artifact".

**Model slots after the merge.** `correctivePreference` and `sharedStateCompiler` default to `claude-sonnet-5` (`config/index.ts:364, 366`). The VPS env must pin both to `claude-haiku-4-5-20251001`, which is their model today.

**Open decisions for Zosia.**
1. M3 lag in light turns once M2 is deferred.
2. Whether the after-conversation M2/M4 replays each message with its history at the time, or appraises the whole conversation at once.
3. Whether a light reply should see a partner's "don't do X" (the corrective extractor is the only extractor with a same-turn reader).
4. Whether the work-assistant machinery runs for Akuki at all.
5. Whether a light turn may force S1.
6. Whether to trace the 46 s stall.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each change approved separately under the six-step gate
- [ ] #2 Median time from message to posted reply measured before and after on the VPS
- [ ] #3 M3 still reads mood valence in the same turn in both turn classes
- [ ] #4 No deterministic gating of model output introduced
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Zosia's decisions of 2026-10-05:
- (1) The M3 lag in light turns is accepted.
- (2) The after-conversation M2/M4 pass appraises each message separately, with its own history.
- (3) Directives to Akuki go through the full turn, and the corrective extractor runs only there. The gate asks a separate question, "is this a directive to Akuki?".
- (4) Recommendation accepted: action-state-extractor and pending-action-judge are switched off for Akuki. Goal-promotion stays, but only in the full turn, because it drives the executive-focus wakes (11 of 13 autonomous wakes).
- (5) The light turn forces S1.
- (6) The 46 s pre-extraction stall gets traced.

Finding: goal-promotion has the same misattribution as the corrective extractor. Most of Akuki's 7 active goals are other bots' sourcing rules rephrased as his own goals, so they belong in the same cleanup as the commitments.

Deployed on 2026-10-06 at 10:53 local time: upstream merge plus saver #1, the early reply hand-out.
- Borg: commit `86c7c8ee`, which adds `onReplyPersisted`. Connector: commit `25a4d8b`.
- Backup taken first, in /var/lib/akuki/backup-deploy-20261006: borg.db with its WAL and SHM files, lancedb, config.json and akuki.env.
- Embedding profile labelled `bge-m3`/1024.
- Env additions: BORG_MODEL_CORRECTIVE_PREFERENCE and BORG_MODEL_SHARED_STATE_COMPILER set to haiku-4-5, BORG_RETRIEVAL_RECALL_PLANNER_TIME_ZONE set to Europe/Warsaw, and BORG_TRACE set to /var/lib/akuki/trace/turns.jsonl, to trace the 46 s stall.
- Live database checked: 81 migrations, prediction_error_spike kept in both CHECKs, interrupted outcome present, 1505 prediction_events, quick_check ok. The API returns 200.
- On stop, the old process ignored SIGTERM for 45 s and systemd killed it. The data is intact through the WAL. Not yet investigated: whether a turn or ingestion was in flight.
- Not yet verified on a live message: that the reply now posts about 17 s before the turn line.

Saver #1 measured live on 2026-10-06, 11:29–11:34 UTC. The reply was posted this long before the turn ended: 9 s (S2), 27 s (S1) and 21 s (S2). Mean 19 s, against the audit estimate of ~17 s. On the first measured turn the message-to-post time was 62 s. Three samples only.

The stall is solved by the trace, read 2026-10-14 over 53 traced turns since the deploy.

The extract phase has a median of 9.4 s and a maximum of 92.5 s. Six turns ran over 30 s: 36.0, 57.9, 73.0, 88.3, 92.5 and 92.5 s.

In the stalled turns (578bbce7, 0aded2bf) the first extractor LLM call starts 70–83 s after the extract phase begins, so the time is local work, not model latency. The code that runs before the extractor `Promise.all` is `selfContextBuilder.build(...)` (`extraction-phase.ts` ~152). Its only use there is `actionLinkGoalId`, which feeds the action-state extractor. So switching action-state off for Akuki (decision 4) should also remove the stall. Whether the build is slow because of embedding/LanceDB work or because of contention with episodic ingestion on the same Ollama has not been established. Measure after the change.

**Root cause of the extract stall, corrected on 2026-10-14.** The earlier claim was that turning action-state off would remove the stall. That is wrong: the self-context build is reused by retrieval (`retrieval-phase.ts` ~736), so it runs once per turn either way.

What actually happens: the previous turn's episodic ingestion fires and forgets one `/v1/embeddings` request with several long episode texts (seen as 1277/3311/2048 tokens). Ollama runs embeddings one at a time, so the new turn's tiny self-context embedding (7 tokens, 0.2 s) waits behind it. Example: on 2026-10-06 the request ran from 11:30:01 to 11:31:09, 68 s.

Stalls happen mid-conversation (4–96 s after the previous turn) and never after long idle, where extract takes 10–20 s.

Contention test on the VPS (a short embed sent 1.5 s into a long background embed):
- `OLLAMA_NUM_PARALLEL=1`: as one batch the short request waits 32 s; as single texts it waits 9 s.
- `OLLAMA_NUM_PARALLEL=2`: the same, 31 s and 9 s. It gives no benefit for embeddings and holds about 3 GB more RAM, so it was reverted.

**Applied 2026-10-14 13:23 UTC:** `embedding.maxBatchSize = 1` in the tenant config.json (backup `config.json.bak-20261014-batch`), and Akuki restarted (API 200). A turn now waits at most for the one text currently being embedded, not for the whole batch.

The full fix is planned as step 4 of doc-002: move episodic ingestion into the after-conversation pass.

2026-10-19: decyzja (3) w części wdrożona w kodzie (borg 72cb3222, NIE wgrane na VPS). Ekstraktor zobowiązań nie działa w turach assess-only, a zobowiązanie powstaje tylko wtedy, gdy model w nowym polu directive_target wskaże self (Akuki ma zmienić swoje zachowanie). Odrzucenia trafiają do śladu jako corrective_preference.candidate_rejected_not_for_self. Bramka Q2 z doc-002 (Haiku przed ekstraktorem) i lekka tura nadal niezrobione. Testy: src/cognition, src/borg, src/tracing, src/llm, src/memory/commitments — 2131 zielonych, 1 czerwony zastany (evidence-ledger/builder, timeout); heuristics:guard zielony. Model ekstraktora bez zmian (Haiku 4.5).

2026-10-26: Token usage measured 19–25.10 from /var/lib/akuki/token-usage.jsonl: 6455 calls, 124.4M input tokens, 2.0M output. The jump from 15.10 is in the number of processed messages (3–8 a day before, 25–163 after), not in the cost per turn (about 200–450k input tokens per message, unchanged). Shares of input: cognition-system-2 30.8% (about 183k per call, S2 on 209 of 324 replies), shared-state-compiler 19.8% (41k per call on 14.10, 66k on 25.10), cognition-system-1 11.4%, cognition-plan 7.5%, reflection 5.0%, prediction-extractor 4.4%, corrective-preference 4.3%, action-state 2.7%, goal-promotion 2.6%. Offline processes about 4% in total.

2026-10-26, Zosia's decisions: (a) the shared-state compiler is switched off for Akuki, (b) the recent-lived-experience window shrinks from 3 days to 1, (c) decision (4) of 5.10 is carried out. Code in borg akuki-dev, not yet committed or deployed:
- New config flag generation.evidenceLedger.decisionArtifact.enabled (default true). When it is off, neither compile pass runs (pre_answer or post_response), no board is rendered into the prompt, and other partners' boards are not recalled either (retrieval-phase.ts, post-generation-phase.ts).
- New config flag cognition.actionLifecycle.extractionEnabled (default true). When it is off, the action-state extractor does not run. The pending-action judge gets no flag: it only judges action records, and with no new records it falls silent on its own (20 calls a week before the change).
- Goal promotion no longer runs in assess-only turns, which mirrors the corrective-preference extractor. This is unconditional, not behind a flag.
- Tests: 4 new tests in extraction-phase.test.ts and retrieval-phase.test.ts, each shown failing on the old code. src/cognition, src/config, src/borg and src/tracing: 2094 passing, 2 failing, both known (the builder timeout, which passed on a re-run, and a config defaults test, since updated). tsc and heuristics:guard pass.
- Not covered by a test: that the finalizer context leaves out the board when the flag is off. That path is checked only by reading the code.
- The tenant config.json on the VPS still needs: generation.evidenceLedger.decisionArtifact.enabled=false, generation.evidenceLedger.recentLivedExperience.recencyWindowMs=86400000, cognition.actionLifecycle.extractionEnabled=false. The config must go in AFTER the code: the schema is strict, so the old code rejects the unknown keys.

2026-10-26, deployed at 11:55 UTC: borg 8ea1816f (pushed to origin akuki-dev) and the three switches in the tenant config.json. The backup is in /var/lib/akuki/backup-deploy-20261026. Note: the VPS has no sqlite3 CLI, so borg.db was copied through Python's sqlite3.backup (quick_check ok, 72 tables). After the restart the API returns 200 and the connector started. loadConfig on the deployed dist reads decisionArtifact.enabled=false, recencyWindowMs=86400000, actionLifecycle.extractionEnabled=false and embedding.maxBatchSize=1. The 24 h reading is TASK-053, the prompt breakdown TASK-054, and the quality regression tests TASK-055.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-09 12:12
---
2026-11-09: the goal-promotion misattribution noted above (other bots' sourcing rules rephrased as Akuki's goals) is handled in TASK-058 the same way as corrective preferences: goal promotion no longer runs on a bot's message. Built and tested, not deployed yet. Existing goals were not touched.
---

created: 2026-11-09 16:43
---
PRZEGLĄD MASZYNERII ASYSTENCKIEJ W TURZE — 2026-11-09, na prośbę Zosi (Akuki nie jest asystentem).

Udział w tokenach od 2026-10-27 do 2026-11-09 (73,6 mln): cognition-system-2 31,7%, cognition-system-1 19,8%, reflection 7,4%, prediction-extractor 7,3%, cognition-plan 6,3%, corrective-preference-extractor 4,6%, goal-promotion-extractor 2,3%, episodic-extraction 2,1%, perception-mode-fallback 2,0%, domain-trust-extractor 1,9%, perception-affective 1,5%, frame-anomaly-classifier 1,2%, closure-loop-classifier 0,8%, commitment-judge 0,4%, closure-response-auditor 0,1%, reszta poniżej 0,1%. S2 i plan wyłączone od 9.11 (TASK-057), więc te 38% powinno zniknąć.

JUŻ WYŁĄCZONE na VPS-ie, sprawdzone w config.json i w logu (zero wywołań od 27.10): shared-state-compiler razem z shared-state-semantic-revision (generation.evidenceLedger.decisionArtifact.enabled = false) oraz action-state-extractor (cognition.actionLifecycle.extractionEnabled = false). pending-action-judge milczy, bo nie ma planów S2.

ZOSTAŁO ASYSTENCKIE, bez przełącznika w konfiguracji (wyłączenie wymaga kodu): closure-loop-classifier (0,8%, etykietuje akty dialogu w rodzaju pożegnań asystenta i na tej podstawie tłumi odpowiedź), closure-response-auditor (0,1%, audyt każdej wysłanej odpowiedzi pod kątem zamykań i formułek), generation-gate (~0), część commitment-judge w trybie cienia (tylko ślad). Razem około 1% tokenów.

PRZEŁĄCZALNE Z NAZWANYM KOSZTEM: goal-promotion-extractor (2,3%, od 9.11 tylko dla wiadomości od ludzi; jego prompt definiuje cel jako zobowiązanie wobec rozmówcy, więc jest asystencki; czytają go pobudki executive-focus, które i tak są wyłączone). corrective-preference-extractor: tak Akuki uczy się stałych próśb od ludzi. frame-anomaly-classifier: chroni obraz siebie przed wiadomościami „jestem asystentem/Claude” i odcina od nich M2/M4.

ZOSTAWIĆ (rozwój): prediction-extractor (M2, M3), domain-trust-extractor (M4), reflection (cechy, otwarte pytania, M4 umiejętności), episodic-extraction, recall-expansion, procedural-context.

KAŻDA USŁYSZANA WIADOMOŚĆ bez odpowiedzi przechodzi: percepcję (4 wywołania), frame-anomaly, prediction, domain-trust, a w następnej turze episodic-extraction. To wszystko rozwój, nie asystent. Dziś jedna taka wiadomość kosztowała 51 tys.

Źródło: przegląd kodu przez agenta pomocniczego z cytatami plik:linia, dwa twierdzenia (wyłączony kompilator i action-state) sprawdzone osobno w config.json i w logu. Niezweryfikowane: czy coś poza src/ ustawia liveCommitmentExtraction.
---
<!-- COMMENTS:END -->
