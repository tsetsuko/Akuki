---
id: TASK-057
title: >-
  S2 dla Akukiego tylko przy wysokiej stawce i sprzeczności: bez trybu
  refleksyjnego i niskiej pewności
status: In Progress
assignee: []
created_date: '2026-11-02 10:38'
updated_date: '2026-11-09 11:29'
labels:
  - tokens
  - deliberation
  - borg-fork
dependencies:
  - TASK-056
references:
  - future-development.md §10
  - 'Obsidian AKUKI/doubts, questions.md (Q 2026-11-02)'
priority: high
type: task
ordinal: 57000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Zosia's decision of 2026-11-02 (option c, after the six-step gate): two of the natural signals that send a turn to the deliberative path (S2) are switched off for Akuki.

**Why S2 fired.** Counted from the VPS trace since 19.10, out of 252 S2 turns:
- 190 (75%) because the mode classifier said "reflective";
- 62 (25%) because retrieval confidence was below 0.45;
- 0 forced by an open-question contradiction.

Wake-ups took S2 in 43 of 45.

**What S2 costs.** In the token log for 19–29.10, the S2 finalizer was 31% of input and the plan call 7%. Each S2 turn would still need a direct (S1) answer, so the net saving is about 14% of input, roughly 100k per S2 turn.

**What changes:**
- Reflective mode no longer takes S2. The classifier is untouched, because its label also sets the recall weights and limit, the display of open questions in the prompt, and autobiographical recall. Changing the classifier (option b) would have made Akuki recall himself less often.
- Low retrieval confidence no longer takes S2. "When unsure, plan first" is a work-assistant reliability rule, and part of the low confidence is an artefact of decay (future-development §10). Akuki still sees his confidence and the weak-support line, and he still has the memory-reading tools on S1.
- S2 remains for high stakes (which the connector never sets) and for the operational-contradiction override. In effect S2 disappears.

**What goes with it.** The plan before replying, and every new `thought` entry, because S2 plans are their only source. Autobiographical recall and the own-records tool will show no new thoughts; the 446 existing ones stay.

**Code (fork):**
- New config setting `deliberation.system2Triggers` {reflectiveMode, lowRetrievalConfidence}. The default is true/true, which is upstream's ladder.
- path-selector: the reflective and low-confidence rungs check their switch. When a switch is off, the turn takes S1, and the trace records a distinct reason for each:
  - "Reflective mode does not take the deeper path in this deployment."
  - "Low retrieval confidence does not take the deeper path in this deployment."
- The prompt's confidence line describes the ladder that is actually in force. Without the low-confidence trigger it does not print `s2_floor` and says that 0.45 only marks weak support. Upstream's sentence is unchanged when both triggers are on, so the prompt fixtures do not change.
- Plumbed config → deliberation-phase → Deliberator → chooseDeliberationPath and DeliberationContext → summarizeRetrievalConfidence.

**Research.** Neither research document covers deliberation or metacognition, so step 2 of the gate is not done. This is a decision about the cost and fit of borg's machinery, not a developmental mechanism.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Config switch implemented with upstream's default; tests: selector, prompt, config, deliberation-phase and deliberator plumbing, each failing on the old code
- [x] #2 Typecheck and heuristics:guard show no new errors; prompt fixtures unchanged by default
- [x] #3 Tenant config set to reflectiveMode=false and lowRetrievalConfidence=false, with a backup; deploy by Zosia
- [ ] #4 After about 2 days: path reasons counted from the trace (expected: almost no S2), plus tokens per reply and prompt sizes compared with the baseline
- [ ] #5 Checked that autobiographical recall and open questions in the prompt still appear on reflective turns (trace or prompt capture)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-02, code: borg **a7144b96** (pushed to akuki-dev).
- New tests: 3 in path-selector, 1 in the retrieval prompt, 1 in config, 1 in deliberation-phase, 1 in deliberator. The 6 that change behaviour fail on the old code. The seventh, high stakes and the forced contradiction still taking S2, guards the existing behaviour and so passes either way.
- src/cognition + config + borg + autonomy + offline: 3169 passed, 2 known timeouts (builder, turn-orchestrator).
- The prompt-surface fixtures did not change: with the default triggers the prompt is identical.
- Typecheck: the same 5 old errors in the tests. guard passes.
- loadConfig with config.json {deliberation: {finalizerDynamicPromptCacheEnabled: false, system2Triggers: {...false}}} reads both switches as false and keeps the existing keys.
- Deploy: script akuki-wdroz-s2.sh in the project directory (code, then config with backup config.json.bak-20261102-s2, then restart), run by Zosia.
- Expected after the deploy:
  - reflective turns go to S1 with the reason "Reflective mode does not take the deeper path in this deployment."
  - the S1 median rises on reflective turns, which carry autobiographical recall and open questions, and the per-reply saving is about 90k
  - no new thought entries

2026-11-09: deployed. The code was already on the VPS (akuki-wgraj.sh at 11:11 UTC built borg 01243d9a, which contains a7144b96). Config steps of akuki-wdroz-s2.sh run by hand so the backup carries today's date: config.json.bak-20261109-s2, then deliberation.system2Triggers = {reflectiveMode: false, lowRetrievalConfidence: false}; valid JSON. akuki.service started at 11:28:08 UTC (it had been stopped since 02.11 10:33 UTC); API 200, connector live, missed week skipped by the 600 s catch-up window. Started together with TASK-058's changes, so the first days cannot separate the effects (dziennik Obs. 6). AC #4 counts from 11.11.
<!-- SECTION:NOTES:END -->
