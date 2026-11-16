---
id: TASK-054
title: Rozmiar promptu odpowiedzi rozbity na sekcje rejestru dowodów
status: In Progress
assignee: []
created_date: '2026-10-26 11:56'
updated_date: '2026-11-16 13:20'
labels:
  - tokens
  - prompt
  - measurement
dependencies: []
priority: high
type: spike
ordinal: 54000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The reply calls are the largest token cost. In the 19–25.10 measurement they were cognition-system-2 at 30.8% (about 183k input tokens per call), cognition-system-1 at 11.4% (about 123k) and cognition-plan at 7.5%. The evidence ledger has 17 sections with caps, a 60k target and a 100k hard cap (config/index.ts), but those caps do not explain 183k. The rest of the prompt has never been broken down: system prompt, scaffolding, the turn transcript, tools and their schemas, and the open questions.

The goal is a measurement, not a change. For a sample of real turns from after 26.10, measure how many tokens each piece of the reply prompt takes, separately for S1, S2 and plan. Use the existing trace (BORG_TRACE, /var/lib/akuki/trace/turns.jsonl) and the ledger's estimatedTokens where they suffice. Add instrumentation only where they do not, and treat it as a separate decision.

This is the basis for future-development §9 (lowering ledger caps) and §10 (why S2 is chosen in 64% of replies). Run it after the 24 h reading of the 26.10 changes, so that the board is already out of the prompt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 For at least 10 turns (S1 and S2), a table of tokens per prompt part: system, scaffolding, each ledger section, transcript, tools, other
- [x] #2 The chars/4 estimate (util/token-estimate.ts) compared with the provider-reported input_tokens for the same call
- [x] #3 Named the 3 largest parts, with whether config can reduce them
- [ ] #4 Conclusion written down; any change goes through the six-step gate separately
- [ ] #5 Decision on correcting the token estimate (chars/4 against the measured 2.2–2.3 chars per token): what changes, its effect on the ledger caps and compaction, and a before/after measurement
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-10-27, first pass from the existing trace (/var/lib/akuki/trace/turns.jsonl, turns since 19.10, 298 reply calls: 126 S1, 172 S2). The trace joins evidence_ledger.completed, deliberation.finalizer_context.completed and llm_call.started/completed (usage) by turnId.

Medians per call:
- S1: 109k real input tokens, 250k prompt chars. Static block 27k chars, dynamic block 218k chars. The ledger, at about 30k estimated tokens, is about 122k chars.
- S2: 161k real tokens, 355k chars. Static 27k, dynamic 323k. The ledger is about 32k estimated tokens, about 128k chars.

AC #2: the chars/4 estimate (util/token-estimate.ts) undercounts real tokens about 1.7 times. Polish text plus ids come to 2.2–2.3 chars per token. So the ledger caps (60k target, 100k hard cap) are in estimated units, and the target is really about 100k provider tokens. The ledger in practice is about 53k real tokens, not 30k.

Rough split of an S1 call, in real tokens (chars ÷ 2.3):
- static guidance: about 12k
- ledger: about 53k
- the rest of the dynamic block: about 42k. That is the cacheable_dynamic surface (finalizer_base_dynamic_prompt) plus tool availability and inhibition.

S2 has about 46k more on top. These are the S2-only blocks (borg_additional_retrieval, borg_s2_plan) and/or a larger cacheable_dynamic.

Largest ledger sections (median estimated tokens): current_session_transcript 6k (compacted from about 37k), autobiographical_recall 2.3k (S2), retrieved_memory_evidence 1.7–2.6k, action_states 1.2k, shared_state_recall 1.1k, open_questions 0.6–1.1k. Their sum is about 14k against the ledger's 30k total, so about half the ledger is rendering overhead: framing, labels and ids. action_states and shared_state_recall come from before 26.10 and should drop out after the deploy.

Not measurable from the existing trace: the breakdown of the about 42k non-ledger dynamic part, and the S2 extra. The trace records the dynamic block as a single figure (legacy_dynamic). To split it, the trace needs per-block chars for each prompt-surface block. That is instrumentation, so it goes to Zosia for a decision.

2026-10-27: per-block instrumentation added, borg 3766ace1 (pushed to akuki-dev). deliberation.finalizer_context.completed now carries dynamic_block_chars (rendered chars of each finalizer dynamic-surface block: base dynamic prompt, tool availability, ledger, inhibition, additional retrieval, S2 plan, regeneration) and base_dynamic_section_chars (rendered chars of each base prompt section inside the dynamic block). This is trace only: the prompt text does not change, which the existing byte-identical finalizer tests confirm. The new test (finalizer.test.ts, both cache layouts) fails on the old code. tsc and heuristics:guard pass. src/cognition, src/config, src/borg and src/tracing: 2097 passing, 1 known failure (the builder timeout). NOT YET DEPLOYED: the production deploy was blocked by permissions in the agent session, so Zosia runs it herself (akuki-wgraj.sh on the VPS, then ./akuki-serwis.sh restart). Limitation: it measures chars, not tokens. Converting at about 2.3 chars per token gives an approximation.

2026-10-27, Zosia's request: correcting the token estimate goes into this task as a separate decision, AC #5. Facts: util/token-estimate.ts estimates chars/4, but Akuki's real prompts come to 2.2–2.3 chars per token (298 reply calls since 19.10), so the estimate undercounts about 1.7 times. Every limit counted with it (ledger target 60k and hard cap 100k, section caps, transcript budget 2.5k, shared-state render, planner budgets, maxClusterInputTokens in offline) is in reality about 1.7 times larger than its name says. A correction would change behaviour: at the same settings the ledger would shrink by about 40%, and compaction would cut more. Options to weigh: (a) change the divisor globally, which affects all of borg including the offline processes; (b) leave the estimate and lower the caps in the tenant config by a factor of about 1.7, which needs no code; (c) estimate from the provider's real usage, which is more machinery. Do not implement before the per-block measurement and TASK-055 (the quality tests), so that the effect can be seen.

2026-10-28, per-block measurement. Zosia deployed 3766ace1 on 27.10 at 08:43 UTC. 38 turns carry the new fields (12 S1, 26 S2). Real tokens = chars ÷ the measured chars-per-token ratio (2.30–2.34).

S1 (median 143k real tokens; the cache reads only 13k, the static block):
- static guidance: 11.6k
- base dynamic prompt (finalizer_base_dynamic_prompt): 88.5k. Of that:
  - borg_standing_with_audience: 66.9k
  - borg_mechanism_evidence: 9.6k
  - host_capabilities: 3.1k
  - self_snapshot: 2.9k
  - audience_profile: 2.1k
  - working_state: 1.8k
  - the rest under 1k each
- evidence ledger: 43.1k. By section: transcript 10.8k, retrieved_memory_evidence 8.0k, group_channel_memory 2.7k, attribution_matrix 1.3k, action_states 1.2k, the rest about 1k. The sections add up to about 28k, so about 15k is ledger framing.
- inhibition 0.4k, tool availability 0.1k

S2 (median 197k): the same, plus borg_additional_retrieval 38.4k (max 55.8k) and the plan 0.7k. Base dynamic 90.5k (standing 67.3k), ledger 51.4k (with autobiographical_recall 3.5k and open_questions 2.2k).

AC #3, the three largest parts:
1. borg_standing_with_audience, about 67k: half of S1 and a third of S2. Not yet broken down. It is assembled in system-prompt.ts buildStandingWithAudienceSection from audience identity, authority, creator directives, commitments_and_conduct (with commitment_ledger_entries), relational_identity (relational_ledger_entries) and cross_session_awareness (recent lived experience plus observed events). Only commitments are confirmed small in the DB: 23 active ones, about 12k chars, so about 5k tokens. The remaining about 60k is not known yet. Candidates are the cross-session window (147 activity_events in 24 h) and the relational and commitment ledger entries. Whether config can reduce it depends on which part dominates.
2. The ledger, 43–51k. Configurable through the target, section caps and token estimate (AC #5).
3. borg_additional_retrieval in S2, about 38k. S2 only, so it also ties to future-development §10 (S2 on more than 64% of replies).

The S1 median grew from about 106k (19–25.10) to 143k now, even though the board and action-state are gone. Something is accumulating, most likely inside standing. This has not been confirmed.

action_states (1.2k) still renders: old action records remain (4 committed_to_do, 4 scheduled, 2 considering), and only new ones stopped being created.

Next step: split standing_with_audience into its 6 sub-blocks in the trace (an extension of the same instrumentation).

2026-10-28: borg_standing_with_audience split into its parts in the trace, borg 878c2418 (pushed to akuki-dev, waiting for Zosia to deploy). base_dynamic_section_chars now also carries:
- the six parts, keyed borg_standing_with_audience.<part>: audience_identity, authority_context, creator_directive_disclosure, commitments_and_conduct, relational_identity, cross_session_awareness
- the groups inside them: commitments_and_conduct.commitment_ledger_entries, relational_identity.relational_ledger_entries, cross_session_awareness.session_status_snapshot, cross_session_awareness.recent_lived_experience, cross_session_awareness.social_memory_entries

The section is now built from the same list of parts, so its text is unchanged; the existing system-prompt tests pass. The new test checks that the six parts plus the wrapper and its 8 newlines add up exactly to the section length, and it fails on the old code. tsc and heuristics:guard pass. 2097 passing, 1 known failure (the builder timeout).

2026-10-30, breakdown of borg_standing_with_audience. Zosia deployed 878c2418 on 28.10 at 10:42 UTC. 46 turns (29 S1, 17 S2), 2.35 chars per token. Medians in real tokens. The section as a whole is 74.1k (max 88.6k).

- commitments_and_conduct: 44.2k. Inside it:
  - commitment_ledger_entries: 18.8k
  - the remaining about 25k is commitment_scope_details (renderCommitmentDetailsLines)
  - Each active commitment is rendered TWICE, once as a detail and once as a ledger entry.
  - There are 23 active commitments, about 12k chars of directive text in the DB, which comes to about 1.9k tokens per commitment in the prompt. Most of that is metadata (disclosure label, made_to/audience/about, provenance), not the directive.
  - By kind: 14 are participant_preference/rule, 4 preference, 4 boundary, 1 audience_rule. Per Obs. 1 in the dziennik, many of them are other bots' rules stored as Akuki's commitments.
- relational_identity.relational_ledger_entries: 25.4k (min 6.2k, max 28.1k). Content not yet examined.
- cross_session_awareness: 2.4k (max 36.9k). recent_lived_experience has a median of 0 and a max of 34.4k: since 26.10 the 1-day window is usually empty, with an occasional spike. social_memory_entries 2.4k.
- creator_directive_disclosure 1.0k, audience_identity 0.5k, authority_context 0.2k.

AC #3, final list of the largest parts of the S1 prompt (about 143k):
1. Commitments, 44k. Not reducible by config. Two routes: clean up the commitments (the Obs. 1 work already planned, with Zosia's consent to change the memory), and/or render them once instead of twice (a code change in the fork, which goes through the gate).
2. The ledger, 43–51k. Config: target, caps, token estimate (AC #5).
3. Relational entries, 25k. Not yet examined.

The growth of S1 from about 106k to 143k is not proven to come from commitments and relational entries, because there is no breakdown from before 27.10. Both grow with memory, though, so they are the most likely source.

2026-11-09, fresh breakdown over 159 turns from 28.10 10:42 to 02.11 (85 S1, 74 S2), 2.32 chars per token, medians in real tokens. S1 157k (cache read 13.1k, the static block only): static 11.7k, base dynamic 99.6k (standing 77.8k: commitments_and_conduct 46.1k, relational 26.6k, cross-session 2.5k; mechanism_evidence 9.4k; host_capabilities 3.1k; self_snapshot 2.9k), ledger 48.4k (transcript 10.8k, retrieved memory 8.4k, raw stream 3.3k, group channel 2.7k). S2 206k, the same plus additional retrieval 36.5k. Correction to the 30.10 note: the relational group is not unexamined content; with only 21 relational slots it is mostly participant commitments, so each commitment's directive was rendered four times in the legacy layout. Fixed in TASK-058. Also: of 162 initial finalizer calls, 118 (73%) ended in EmitObserve and 30 in EmitAnswer, so most of the reply-prompt cost buys a decision to stay silent. mechanism_evidence is borg's own scheduler/suppression/regeneration evidence, not an M2-M4 section.

2026-11-10, ledger rendering cut for a non-assistant bot (Zosia's decision; borg 81938a14 on akuki-dev, pushed, NOT deployed; Akuki stopped since 11:07 UTC). Measured first (trace, 21 turns since 09.11): the rendered ledger is about 58k real tokens per turn, and about 23k of it (38-39%) is rendering around the entries (total_estimated_tokens minus the sum of estimated_tokens_by_section, per turn). Correction to the 2026-10-27 note: the estimator is chars / 4 for both numbers, so the gap is real rendering overhead, not a different token ratio. What the printed ledger loses: the second copy of each row's disclosure label (the disclosure_label object and disclosure_note in state_metadata; the label fields stay in state, the internal-use sentence moves to one header line, a row with a metadata-only label still prints it); trust_rank, citation_type, stream_index, salience_class, via_retrieval and taint=none on rows; the estimated_tokens header line; framing_counts and the scope paragraph (counts stay on the section object; the autobiographical framing sentence about the counts was removed); the action_states section when cognition.actionLifecycle.extractionEnabled is false. Kept on purpose: author, source type, scope, citations, one label per row, taint when not none, persistence_class, the transcript status line, the goal counterparty guidance (goal rows still carry the field). Entry objects are unchanged, so code readers (compact layout, dedupe, guards) are unaffected. Tests: 4 new tests in renderer.test.ts and builder.test.ts failed on the old code; autobiographical-recall tests that pinned the printed counts now pin their absence; prompt-surface fixtures regenerated (only the intended lines change). Isolated worktree: tsc 0, heuristics:guard 0, src/cognition src/borg src/tracing src/config 2549 passed, 1 failed (the known builder reverse-scan timeout). Expected effect: a smaller gap between total and section sums in evidence_ledger.completed; the size is not known until measured after deploy. Another session (akuki-dd) plans section caps in the tenant config for the same goal; the two effects separate in the trace (gap vs per-section estimates).

2026-11-10: 81938a14 uploaded and built on the VPS with akuki-wgraj.sh (exit 0; seed matches source, dist newer than all sources, tenant config valid JSON; dist contains the ledger disclosure header and includeActionStates, and no framing_counts_scope). NOT started: akuki.service is stopped, and the start and its order with akuki-dd's section caps are Zosia's decision. The same build also carries 125a08e9 (reflection-after-silence switch, default unchanged) and the connector at 052b701 (another session's change: a message addressed to someone else is heard, not answered), so the next start makes all of them live at once. After the start: one line in Kalendarium zmian and a measurement of the gap between total_estimated_tokens and the sum of estimated_tokens_by_section.

2026-11-10, borg_mechanism_evidence broken down (about 23.8k chars, about 10.3k tokens, in every Arena reply prompt; 15.7k chars in the DM session, whose working memory holds no silences or regenerations). Sizes come from the section's text in system-prompt.ts (summarizeMechanismEvidence, about line 2804) and from that difference, not from a captured prompt. Four parts: (1) Harness scheduler state, about 14k chars / 6k tokens: wake budget, sources, refusal semantics, with long explanatory prose. It renders although autonomy.enabled is false for Akuki since 09.11, because open.ts builds the scheduler unconditionally (around lines 561-586) and the prompt reads scheduler.describe(). (2) Recent silences, the newest 10 in this session's working memory, about 3.5k chars / 1.5k tokens, of which about 1.7k chars are fixed explanation (outcome classes, no-output provenance, the invalid-tool note when an entry has that diagnostic). (3) Regenerated answers, the newest 10 (3 now, from 31.10-01.11, one naming the revoked bot commitment cmt_8m3q5vg2932eiwry), about 4.5k chars / 2k tokens, of which about 3.6k chars are three fixed notes (the named-commitment note alone is 2.5k chars). Both rings evict only by displacement, never by clock, so these entries stay in every prompt until newer ones push them out. (4) Answered-window edge, about 1.2k chars / 0.5k tokens. Nothing changed yet; options go to Zosia.

2026-11-10, borg_mechanism_evidence cut (Zosia approved all four parts; borg d1bf46c8 on akuki-dev, pushed; built on the VPS with akuki-wgraj.sh, exit 0; NOT started, akuki.service is stopped). summarizeMechanismEvidence now prints the scheduler state only when the scheduler is enabled (it is disabled for Akuki), never prints the regeneration ring or the answered-window edge, and prints the silences list with only the instruction to report a silence by its real reason (the outcome-class glossary, the no-output provenance and the invalid-tool note are gone). Removed with them: SUPPRESSION_OUTCOME_CLASSES, NO_OUTPUT_PRIMARY_REASONS_WITHOUT_CATEGORY, NO_OUTPUT_DIAGNOSTIC_PROVENANCE, FINALIZER_INVALID_TOOL_TEXT_PROVENANCE, activeCommitmentIdsForLiveness and renderRegenerationCommitmentsSuffix. Working memory still records regenerations and the planner (S2, off for Akuki) still renders its own copy. Tests: 8 changed or new system-prompt tests fail on the old code; 6 regeneration-rendering tests replaced by one that the ring is not printed; prompt-surface fixtures regenerated (only the mechanism-evidence lines change). Isolated worktree: tsc 0, heuristics:guard 0, 2548 passed, 1 failed (the known builder reverse-scan timeout). Expected: about 10.3k -> about 1k tokens on Arena reply prompts (the silences list with 10 entries); to be measured from base_dynamic_section_chars.borg_mechanism_evidence after the start.

2026-11-10, measured live. Started at Zosia's request at 13:16:59 UTC (borg d1bf46c8, connector 052b701; tenant config unchanged since 09.11 16:41, so akuki-dd's section caps were NOT in), stopped at 13:37:07 after one operator-chat message. Comparison in the same session (operator chat, sess_fcp52zoc1a4dzvdb), before = 10.11 09:44 UTC, after = 13:33 UTC: whole turn 218.5k -> 210.1k input tokens; S1 reply call 136.4k -> 129.2k. Inside S1: evidence ledger 73.5k -> 58.3k (rendering overhead 35.2k, 48% -> 13.9k, 24%; the flat section content grew by about 6k), mechanism evidence 6.8k -> 0 (no scheduler state; this session has no silences), static 11.8k unchanged. The cuts saved about 28k, but borg_standing_with_audience grew 26.7k -> 40.5k at the same time: cross_session_awareness.recent_lived_experience went 18.6k -> 32.4k, because the operator chat shows the last 24 h of Akuki's life and the Arena was busy that morning. So the net on this turn is only -7k; the per-part numbers are the measurement of the cuts. Arena turns in the same run: 9 bot messages were only heard (assess, about 20k each: prediction 14k, trust 4k, frame classifier 2k); no full Arena turn happened, so the Arena mechanism-evidence drop (expected about 10k -> about 1k) is not measured yet. Kalendarium zmian: start, both cuts, the connector change (moved from pending) and the stop.

2026-11-10, cross_session_awareness.recent_lived_experience broken down (32.4k tokens in the operator-chat turn at 13:33 UTC, 18.6k at 09:44). It lists events from sessions other than the current one within recencyWindowMs (1 day for Akuki), capped at recentLivedExperience.cap (default 64). At 13:33 that was about 65 rows: 36 user_contact, 19 turn_completed and 9 borg_replied events from the Arena thread (all from 10.11 09-13 UTC), plus one return_silence_delta row; no day summary fell in the window. Each row's content is one sentence of about 60 chars from activity/projection.ts rowText ('X contacted Borg 2h ago in another active session.'), wrapped by renderLedgerEntryLines in system-prompt.ts (around line 812) in about 1.1k chars: XML attributes (id, source_type, scope, actor, trust_rank, state carrying the rendered disclosure label and the internal-use sentence), a value tag, and state_metadata JSON (kind, occurred_at and relative_age twice, session_id, source_stream_ids, the disclosure_label object, the disclosure_note sentence, current_audience_entity_id). So about 95% of the block is framing, about 500 tokens per row. This renderer is separate from the ledger's renderEntry, so 81938a14 did not touch it. It is large in a quiet session while another is busy (the operator chat while the Arena runs); on the Arena the other session is the operator chat, which is mostly empty (median 0 before). Options for Zosia: (A) lower generation.evidenceLedger.recentLivedExperience.cap in the tenant config (no code; 10 gives about 5k), (B) render these rows as one line each with one label and no metadata block (code), (C) collapse same-session events into one density line, as borg already does for days older than 24 h (code; loses per-event order and time). Not chosen yet. The Arena mechanism-evidence drop is still unmeasured: no full Arena turn happened between the 13:17 start and the 13:37 stop.

2026-11-10, recent lived experience: Zosia chose A + B + C. borg 6841de0b on akuki-dev, pushed, built on the VPS (akuki-wgraj.sh exit 0); NOT live, akuki.service is stopped. B (code): renderRecentLivedExperienceLines prints one line per row (the row's text plus its disclosure label's fields when not public; the internal-use sentence once in the interpretation line); a row whose metadata label does not parse falls back to the label rendered into state. C (code + config): new key generation.evidenceLedger.recentLivedExperience.collapseCrossSessionActivity (default false); when true, selectRecentLivedExperienceRows drops the per-event cross_session_activity rows and emits activity density for every day, today included. A (config): cap 64 -> 10. Tenant config.json on the VPS now has cap=10 and collapseCrossSessionActivity=true (backup config.json.bak-20261110-lived-experience; diff is only those keys plus a trailing newline; loadConfig on the deployed dist reads them). Tests: two new tests fail on the old code (system-prompt one-line rows; lived-experience collapse); config default tests updated for the new key. Isolated worktree: tsc 0, heuristics:guard 0, src/cognition src/borg src/tracing src/config src/memory/activity 2576 passed, 1 failed (the known builder reverse-scan timeout). Expected: in the operator chat, the 64-row block of about 32k tokens becomes one density line per Arena day plus the return-silence line. Kalendarium: a ready-not-live line (commit 0916278).

2026-11-16, S1 turn 4a71a45d (operator chat, 11:22 UTC, 101.8k input tokens) from the turn trace. Chars per token 2.05 on the dynamic part; the static block (27 298 chars) equals cache_write 13 578. Split: evidence ledger 138k chars, about 67k tokens (66%); base dynamic 39k chars, about 19k; static 13.6k; messages, inhibition and tools about 2k. Ledger sections in estimated tokens (chars / 4): raw stream 6 900, retrieved memory 6 512, semantic graph 4 334, autobiographical recall 3 400, transcript 3 193, open questions 904; rendering overhead about 8.4k (24% of the ledger). recent_lived_experience is 876 chars after 6841de0b, and mechanism evidence is gone.

2026-11-16, why the trace shows the transcript 'growing' (original_transcript_token_estimate 1 555, compacted_transcript_token_estimate 3 193). It does not grow and nothing was compacted. The two fields measure different things. The original is estimateTranscriptTokens in transcript-compaction.ts: message text plus frame-anomaly notes only. The 'compacted' one is trace-summary.ts estimateSectionTokens of the current_session_transcript section: the section framing, plus for each entry the section label, the id (current_session_stream:<id>), source_type, scope, actor, trust_rank, stream_index, state, taint and persistence_class next to the text. At 1 555 the transcript is under the compaction budget, so compactTranscriptEntries takes the uncompacted branch and renders every entry raw. The difference, about 1.6k estimated or about 3k real tokens, is per-entry metadata, about the same share as the ledger's overall rendering overhead. The field name compacted_transcript_token_estimate is misleading when transcript_compacted is false. Not a bug in compaction; nothing changed.

2026-11-16, Zosia chose option (c) for the S1 prompt: drop the semantic-graph section and cap the raw stream. borg 6d326776 on akuki-dev, local commit (not pushed, not deployed): new config key generation.evidenceLedger.includeSemanticGraph (default true); when false the builder skips addSemanticGraphSection, the same pattern as includeActionStates. Recall and the graph itself are unchanged, and the cut is a fixed budget choice, not an audience gate. The new builder test fails on the old builder.ts and passes on the new one. tsc 0, heuristics:guard 0, src/cognition src/borg src/tracing src/config src/memory/activity: 2577 passed, 1 failed (the known builder reverse-scan timeout). Tenant config still to change on the VPS: includeSemanticGraph=false and sectionOptions.retrieved_raw_stream_evidence.maxTokens=3000 (default 7000). Expected per S1 call: semantic graph about 8.5k -> 0, raw stream about 13.5k -> about 6k, so about 16k less. Kalendarium has a ready-not-live line (akuki 4d47ad5).

2026-11-16, option (c) deployed. borg 6d326776 pushed to akuki-dev and built on the VPS with akuki-wgraj.sh (exit 0; seed matches source, dist newer than all sources, tenant config valid JSON). Tenant config.json edited (backup config.json.bak-20261116-semantic-graph): includeSemanticGraph=false and sectionOptions.retrieved_raw_stream_evidence.maxTokens=3000 added, nothing else changed. loadConfig on the deployed dist returns false, {retrieved_raw_stream_evidence: {maxTokens: 3000}} and recentLivedExperience.cap 10. Restarted with ./akuki-serwis.sh restart: active since 12:25:48 UTC, API 200. Kalendarium: line moved to the live list at 13:25 Polish time (akuki 5618aae). To measure: the first S1 reply after the restart, semantic_graph 0 and raw stream at or below 3000 estimated, expected about 86k instead of 102k.

2026-11-16 14:19 (Polish time): restart for TASK-061 (fork 8c1eec7c). It did not change this task's state: option (c) has been live since the 13:25 restart. A note written here earlier in that session said otherwise, and the Kalendarium line it moved was restored to 13:25 (akuki 55823aa). Reply-prompt sizes from 13:25 to 14:19 are this task's change alone.
<!-- SECTION:NOTES:END -->
