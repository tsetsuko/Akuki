---
id: TASK-055
title: >-
  Zestaw testów regresji jakości: czy Akuki dalej odpowiada prawidłowo po
  odchudzaniu
status: To Do
assignee: []
created_date: '2026-10-26 11:56'
labels:
  - eval
  - quality
  - tokens
dependencies: []
references:
  - >-
    backlog/tasks/task-023 -
    Research-rozszerzenie-promptfoo-z-cortex-evals-na-testowanie-Akukiego.md
priority: high
type: task
ordinal: 55000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Cutting back what borg runs for Akuki (26.10: the shared-state compiler, action-state extraction and a 1-day window; next, the prompt) lowers the cost but can quietly worsen his replies. A capable model sounds sensible even with the machinery missing, so reading the replies by eye is not a measurement. We need a repeatable test set that runs before and after each such change.

What it should measure:
1. Whether Akuki remembers important information.
2. Whether he can recall older memories on request, past the 1-day recent-experience window, through search.
3. Whether he leaves out important context.
4. Whether the deliberative path (S2) still starts in hard cases. This is measured from the trace (the deliberation.path.completed event and its reason field), not from the reply.
5. Whether reply quality has dropped.

Constraints:
- Tests run on a COPY of the tenant (cp -r), never on the live Akuki, and never write to his memory as Zosia (znane-wady §7).
- Wherever possible, measure from state and the trace rather than from reading the reply (invariant 1).
- Reply quality (point 5) needs an LLM grader. That is an audit at eval time, not production policing, so it is allowed under borg/CLAUDE.md.
- TASK-023 (promptfoo from cortex-evals) is the natural tool. Check it before building anything of our own.
- Cost: every eval run is full turns at about 300k input tokens each. Budget the number of cases.

The design goes through the six-step gate before implementation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Design approved by Zosia: cases, the source of the right answers, and metrics for each of the 5 points
- [ ] #2 Cases built from Akuki's real memory (a copy of the tenant), with at least one case per point
- [ ] #3 Points 1–4 measured from state or trace where possible; point 5 by a grader with a written rubric
- [ ] #4 Baseline taken on a copy of the tenant from before 26.10 (backup-deploy-20261026) and a run after the changes, compared
- [ ] #5 Cost of one full run recorded (tokens)
<!-- AC:END -->
