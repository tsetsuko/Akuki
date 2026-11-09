---
id: TASK-058
title: >-
  Zobowiązania w prompcie odpowiedzi raz zamiast czterech razy, plus sprzątanie
  22 zobowiązań od botów
status: In Progress
assignee: []
created_date: '2026-11-09 10:57'
updated_date: '2026-11-09 11:12'
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
- [ ] #5 Deployed by Zosia; after a few turns, borg_standing_with_audience and S1 input tokens compared with the 28.10–02.11 baseline
- [ ] #6 Decision on the source: the corrective-preference extractor keeps creating commitments from other bots' statements despite 72cb3222
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-09, change 1 implemented in the fork (working tree, NOT yet committed or pushed; Zosia decides). system-prompt.ts: commitmentPromptLine and the prompt_summary line removed; commitment_detail gains scope and persistence_class attributes from the matching ledger entry and a last_reinforced_at field (the only data the ledger copy carried that details lacked; relative created ages already render in borg_current_time). renderCommitmentLedgerEntryGroupLines renders only ledger entries matching no applicable commitment and omits the group when all matched (rendering status="none" would read as no commitments). renderRelationalLedgerEntryGroupLines renders a participant's commitment as a one-line pointer (id, source_type, subject, commitment_ref); an entry it cannot map back is rendered in full, so a mismatch costs tokens, never the commitment. The id formats moved into audience-standing.ts as commitmentLedgerEntryId and participantCommitmentEntryId so builder and render share them. The compact layout (finalizer-context.ts) is untouched. Trace measurement (measureStandingWithAudienceParts) uses the same render functions, so the trace stays consistent with the prompt.

Proof: the updated system-prompt test asserts the directive appears exactly once; on the old system-prompt.ts it fails with 'expected 4 to be 1'. Prompt-surface fixtures regenerated; the only diff in all six is prompt_summary removed and last_reinforced_at added. Two deliberator tests asserted the removed summary line and now assert the structured fields. tsc 0, heuristics:guard exit 0, src/cognition src/borg src/tracing src/config: 2539 passed, 1 failed (builder.test.ts reverse-scan timeout, the known baseline). Expected effect, an estimate until measured after deploy: commitment_ledger_entries 19.4k to 0, about 6-7k from prompt_summary, relational entries 26.6k to a few k. With only 3 active commitments after change 2, the whole commitment block becomes small anyway.

2026-11-09, change 2 done on the live tenant (akuki.service stopped since 02.11 10:33 UTC, so no second writer). Backup first: /var/lib/akuki/backup-commitments-20261109/borg.db via the SQLite backup API, integrity_check ok, 25 active, 121 total. Revoked 22 with the CLI command `commitment revoke` (the same borg.commitments.revoke call as the API used on 19.10, provenance manual), reason 'Zobowiązanie z wypowiedzi innego bota, nie prośba do Akukiego (sprzątanie 2026-11-09, decyzja Zosi)'. Rule applied: every active commitment whose committed_by is another bot (Lunaria 9, Marvin 6, Sol 4, TeamAgent 3, all from botarena thread 184888fd); 6 of them were critical. After: 3 active, all Zosia's requests kept on 19.10 (cmt_myyer2vsskfa5pns, cmt_ep4zw5t7w1027odp, cmt_uixbhzfssliypssb); 22 identity_events with action revoke. Rows stay with revoked_at. autonomy.conditions.commitmentRevoked is false in the tenant config, so the revocations trigger no wake.

Open (AC #6): all 22 were created between 21.10 and 01.11, AFTER 72cb3222 (the 19.10 extractor fix) was deployed; the deployed app contains it. So the extractor still turns other bots' statements into Akuki's commitments, and the cleanup will erode. Not decided: whether to stop it, e.g. by not running the corrective-preference extractor on messages from bots (needs the author kind from the Arena to reach the turn, TASK-033) or switching it off for Akuki. This is a mechanism decision and goes through the gate.

2026-11-09: change 1 committed and pushed, borg 01243d9a on akuki-dev. Uploaded and built on the VPS with akuki-wgraj.sh at 11:11 UTC (seed matches source, dist newer than all sources, tenant config valid JSON; dist contains commitment_ref and no prompt_summary). NOT restarted: akuki.service has been stopped since 02.11 10:33 UTC, and starting it is Zosia's decision. The new render takes effect at the next start. Environment change recorded in the dziennik as Obs. 6. On start, the connector skips the missed week (AKUKI_ARENA_CATCH_UP_BACKLOG=0, AKUKI_ARENA_MAX_CATCH_UP_AGE_MS=600000), so no backlog flood is expected.
<!-- SECTION:NOTES:END -->
