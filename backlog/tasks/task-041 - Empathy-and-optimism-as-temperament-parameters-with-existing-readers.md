---
id: TASK-041
title: Empathy and optimism as temperament parameters with existing readers
status: In Progress
assignee: []
created_date: '2026-09-15 19:06'
updated_date: '2026-09-15 19:20'
labels:
  - akuki
  - seed
  - affect
dependencies: []
priority: high
type: feature
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Zosia asked for empathy and optimism as dispositions after reading the Bot Arena log of 2026-09-15, where Akuki's register stayed cold and accounting-like despite the five dispositions seeded on 2026-09-14.

Both turned out to have readers that predate the request, so neither needed a new subsystem.

Empathy is the weight with which the affective reading of someone else's message moves Akuki's own mood. Borg already blends an incoming affective signal into mood state with a constant weight (default 0.3). Temperament now owns that value and sets it to 0.45.

Optimism is the valence the mood returns to when nothing is happening. Borg decayed mood by multiplying it toward zero; it now decays the distance from a configurable resting point, which temperament sets to 0.25. That resting point already has a downstream consumer: caution in the speech-inhibition signal rises only while valence is negative, so a positive resting point means caution lifts sooner after an unpleasant exchange.

Neither disposition appears on the licensed list in akuki_child_psychology_research.md par. 18. Empathy appears once in the whole document, in par. 15, as a question to investigate. Both are therefore recorded in temperament.yaml as explicit creative choices with no research authority, in the same form as the imitation retention thresholds.

Two voice prohibitions ship with them: no metaphors of Akuki's own coining (picking up someone else's image stays allowed, which is where the only light exchange in the log came from), and no closing sentence shaped as a maxim or verdict.

Known cost, recorded before measuring: changing the two mood constants re-bases every measurement collected so far. 162 prediction reconciliations stop being comparable with anything measured afterwards.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 temperament.yaml carries empathy.contagion_weight and optimism.resting_valence, each annotated as a creative choice with no support in the project's research documents
- [x] #2 Both keys are listed in TEMPERAMENT_CONSUMERS and their consumer is in LANDED_TASKS, so the orphan guard would fail if nothing read them
- [x] #3 Mood decays toward a configurable resting point rather than toward zero, with the previous behaviour preserved when the resting point is zero
- [x] #4 The resting point is passed at every site that constructs the mood repository, including the offline test harness
- [x] #5 scaffolding.md carries the no-own-metaphor and no-aphorism rules, both removable
- [x] #6 A test proves the new decay reaches the resting point and that a zero resting point still decays to zero
- [x] #7 Full test suite and the heuristics guard pass
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Entry 12 added to znane-wady.md covering the orphan-reader mistake and the two construction sites
- [ ] #2 Deployed to the VPS and the seed confirmed live in prompt_overrides and the affect config
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verification of the full suite, recorded because the headline number is misleading: 25 tests fail out of 4077, and every one of them fails identically without this change.

Checked by shelving the working tree with git stash and re-running the same files on a clean HEAD:

- scripts/debug.test.ts (11), scripts/chat.test.ts (2), assessor/cli.test.ts (1) fail on clean HEAD as well. Fourteen.
- src/cognition/evidence-ledger/builder.test.ts (1) and assessor/scenarios/index.test.ts (1) fail on clean HEAD in the same small batch, both at roughly 15 s, i.e. the per-test timeout.
- simulator/runner.test.ts fails the same six tests on clean HEAD as with the change, five of them at the 15 s timeout.
- src/memory/episodic/repository.test.ts and src/offline/belief-reviser/index.test.ts pass when run in a small batch and failed only in the full 353-file parallel run.
- demo/server passes with the change.

One failure looked like a real regression rather than a timeout: "passes the persona display name as the stable Borg audience" took 3.1 s. Run in isolation it passes both with and without the change, so it was collateral from the earlier failures in its own file.

What the change itself is measured by: src/akuki/ and src/memory/affective/ pass (89 tests), src/config/ passes, npx tsc --noEmit is clean, npm run heuristics:guard is clean.

Not done here: nothing is deployed. The seed on the VPS still carries the 2026-09-14 rules only. Order of deployment is Zosia's decision, because she also intends to give Akuki feedback in the Arena directly and the two must not land together or neither is measurable.
<!-- SECTION:NOTES:END -->
