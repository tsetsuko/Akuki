---
id: TASK-029
title: 'M2: open expectations reach the model without a disclosure label'
status: Done
assignee: []
created_date: '2026-09-04 08:21'
updated_date: '2026-09-04 11:25'
labels:
  - M2
  - disclosure
  - heuristics-guard
dependencies: []
references:
  - 'src/cognition/predictions/prediction-extractor.ts:113'
  - scripts/heuristics-guard.ts
  - TASK-015
priority: medium
type: bug
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`scripts/heuristics-guard.ts` fails on HEAD, and has been failing since M2 (TASK-015) landed:

```
model-facing memory serializers missing disclosure labels:
src/cognition/predictions/prediction-extractor.ts:113:73 content in buildMessages
```

The flagged object is the `open_expectations` row that `buildMessages` sends to the extraction model: `{ prediction_id, content, about }`. `content` is a private-bearing model-facing field, and the row carries no disclosure label on the same object. Guard rule (b) in CLAUDE.md requires that a model-facing object literal emitting a private-bearing key also carry a same-object disclosure label.

Neighbouring extractors do not trip this. The `recent_history_context` rows in the same function are covered by the `llm-message-envelope-content` allowlist entry (a single private field `content` alongside a `role` key); the open-expectation rows have no `role` and are genuinely memory rows, so the allowlist does not — and should not — reach them.

This is a design question, not a mechanical fix, which is why it was left rather than patched: **what disclosure label does the entity's own prediction ledger carry?** Expectations are the entity's private, first-person appraisals, not something recalled from a conversation with a participant. The row already stores `origin_audience` as provenance, so the label can probably be derived from it the way other memory rows do, but that has to be a deliberate decision about what a prediction's privacy actually is, not a default copied from episodic memory.

Whatever is chosen, the fix must not gate recall: `listOpen` stays global (that is load-bearing in M2's design), and the label is presentation only. Adding an allowlist entry to the guard instead of a label would paper over the gap and is the wrong answer unless someone can argue that a prediction row is genuinely not private-bearing.

Found while landing M4 (TASK-017); verified pre-existing on HEAD with the M4 changes stashed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Open expectations rendered to the extraction model carry a disclosure label on the same object
- [x] #2 The chosen label for prediction rows is justified in writing (what a prediction's privacy is), not copied by default
- [x] #3 listOpen stays global -- no audience or session predicate is introduced anywhere in the fix
- [x] #4 scripts/heuristics-guard.ts passes without a new allowlist entry for prediction-extractor.ts
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fixed 2026-09-04.

THE LABEL, AND WHY (AC#2). An expectation is the entity's own first-person appraisal of what
comes next. Nobody told it to the entity, so unlike an episodic or social row there is no speaker
whose privacy it inherits. The label is therefore `self_private` with an empty origin audience,
via the new `predictionMemoryDisclosureLabel()` in `src/memory/common/disclosure-serializers.ts`,
which follows the one-serializer-per-memory-kind convention already used for commitments, goals,
open questions, actions, shared state and relational slots.

WHAT WAS DELIBERATELY NOT USED AS PROVENANCE. `about_entity_id` names who the expectation is
ABOUT, not who was in the room when it formed. Feeding it into `originAudienceEntityIds` would
claim that entity witnessed the appraisal, and — because `selfPrivateMemoryDisclosureLabel` copies
its origin ids into `privateToEntityIds` — would mark the entity's own thought as private to
somebody else. The row's `origin_audience` column is free text (`z.string()`), not an entity id,
and is never written by any production caller today: `PredictionExtractor.recordExpectation`
(src/cognition/predictions/prediction-extractor.ts:232) passes no `originAudience`. When that
column starts carrying entity ids, they belong in this label and nowhere else.

WIRING. `OpenExpectationForPrompt` gained a `disclosureLabel` field;
`PredictionTurnService.extractAndReconcile` supplies it while mapping `listOpen` rows, and
`buildMessages` spreads `memoryDisclosurePayloadFields(...)` into each `open_expectations` row, so
the model receives `disclosure` plus `disclosure_label` on the same object as `content`. Same
shape the reflector and turn-self-context already use.

AC#3: `listOpen` is untouched — still global, no session or audience predicate anywhere in the
change. The label is presentation only.

AC#4: no allowlist entry was added to `scripts/heuristics-guard.ts`; the guard passes because the
row now genuinely carries a label.

PROOF. `npm run heuristics:guard` green (was the failure quoted above). Typecheck clean across all
five tsconfigs. New test `labels every open expectation it shows the model as self-private` reads
the serialized prompt payload back out of `FakeLLMClient.requests` and asserts the label rides
along with the content. 21 tests green in src/cognition/predictions, src/memory/common,
src/memory/predictions; 230 green in src/akuki, src/cognition/inhibition, src/borg.
<!-- SECTION:NOTES:END -->
