# Future development — parked ideas, kept because they are good, not because they are next

This file holds designs that were deliberately **not** built for Akuki's first generation. Nothing
here is rejected on merit. Each entry records the idea in enough detail that it can be picked up
cold, plus the specific reason it was parked and the condition under which it becomes worth
revisiting.

Rule for this file: **an idea parked here is not a backlog item.** If something here starts
blocking real work, it graduates back into `backlog/` and goes through the six-step gate from
`SKILL.md` like anything else.

---

## 1. Artificial developmental pressure (TASK-014)

**Parked 2026-09-04. Zosia's decision: out of scope for Akuki generation 1, overkill at this
stage.**

### The idea

Living organisms develop under pressure. A language model has none — it is equally content
answering, staying silent, or repeating itself forever. If Akuki is to *develop* rather than
merely *operate*, the pressure has to be built, and the way to build it is through strong
constraints.

The design's central move is that this unifies M2, M3 and M5 into one engine instead of three
separate features.

### Two different pressures

**Phylogenetic pressure** acts across generations — variation, selection, inheritance. It is what
shaped innate machinery in living things. Its analogue here would be replacing a hand-written
`temperament.yaml` with parameters that were *selected for* rather than *chosen*.

**Ontogenetic pressure** acts within a single lifetime: the strategy that used to work stops being
enough. This is the one that can operate on a single Akuki, and it is the one the design proposes
to build.

### Pressure needs four things

1. **A need** — something the entity lacks.
2. **Difficulty** — the need is not trivially met.
3. **Feedback** — the entity can tell whether it is getting closer.
4. **Insufficiency of the current repertoire** — this is the one everyone forgets. If what Akuki
   already does satisfies the need, that is *practice*, not development.

### Three needs already exist as state in the database

This is why the design is cheap in principle: the needs are not new machinery.

- **Prediction error** — M2's ledger.
- **Open questions with self-escalating urgency** — `conditions/open-question-urgency-bump.ts`,
  `triggers/open-question-dormant.ts`.
- **Unmet goals** with a `terminal_condition` — `triggers/goal-followup-due.ts`.

So the work is not *creating* pressure. The work is **not discharging it too cheaply**.

### The gate is the pressure source

If Akuki needs something but cannot speak until he predicts his partner well enough, then the only
route to relief runs through better prediction. The constraint and the need are coupled.

### Two traps

**Trap 1 — the zero action becomes optimal.** Silence fully satisfies "be shy", so there is no
pressure at all. For every constraint, ask: *what is the laziest fully-compliant behaviour?* If
that behaviour is stable and comfortable, the constraint buys nothing.

**Trap 2 — pressure above the zone of proximal development produces learned helplessness, not
growth.** Already encoded in `target_error_band [0.3, 0.7]`: the error must be *intermediate* and
*reducible*. Pressure has to fall as competence rises. The LLM-flavoured version of both traps: an
unsatisfiable constraint yields incoherence, or gaming — a degenerate compliant output — rather
than adaptation.

### The test for whether pressure is real

**Does the pressure exist in the database when nobody is looking?** Escalating urgency and firing
wake conditions are mechanisms. A sentence in a prompt saying "you urgently need to understand
this" is decoration.

### Four questions that were never settled

Recorded in `doubts, questions.md` with confidence levels, all still open:

| Question | Leaning | Confidence |
|---|---|---|
| Which need is the primary one? | open questions | medium |
| What is the release valve? | the inhibition threshold, maybe plus memory access | **low** |
| Is an evolutionary layer in scope? (many Akukis, varied temperament, selected on development) | note it, do not build it | high |
| Fixed pressure, or pressure that tracks competence? | tracks competence | high |

Asking four design questions at once was itself identified as the problem — it is too many to
answer in one pass.

### Known conflicts to resolve before ever building this

- **"More access to his own memory" as a reward collides with borg's Cardinal Memory Rule**
  (recall is global, disclosure is contextual). `npm run heuristics:guard` fails the build on a
  recall gate. Any release valve involving memory has to be a *disclosure* or *action* valve, never
  a recall valve.
- **A hand-written menu of unlockable capabilities violates invariant #7** ("don't engineer adult
  Akuki"). Zosia raised this objection herself. borg already has the right shape available: the
  Procedural Synthesizer *discovers* skills rather than having them written in.

### When to revisit

When there are real snapshots from the Arena — that is, once M0's instrumentation has produced
data showing whether Akuki actually stalls without pressure, or develops fine without it. Nothing
about the instrumentation depends on any of the four answers.

---

## 2. Evidence-expanded action space (M5, TASK-018)

**Parked 2026-09-04, together with TASK-014.**

### The idea

The finalizer already renders the action menu from **live tool definitions**, varying by turn
origin — see `src/cognition/deliberation/finalizer.ts:204` (`resolveAvailableEmissionNames`) and
`:251` (`EmitContinueThought` is available only when `turnOrigin === "autonomous"`). So the menu is
a description of live structure, not aspirational prose, and Akuki already sees his real options.

M5 proposed widening the gate from *turn origin alone* to *turn origin plus developmental
evidence*, so the menu **grows** with earned competence and Akuki **perceives** that growth. The
phrase in the task is "…o. mogę." — the moment of noticing a new capability.

Transitions triggered by evidence, never by calendar. No "week 3 = toddler" stages.

The early space: observe, answer when addressed, occasionally ask, stay with the familiar. Later:
start conversations, experiment socially, disagree, joke deliberately, choose whom to ask, withhold
a reply. The model could do all of it from day one. What changes is whether Akuki has enough
experience to *choose* it.

### Why it is parked

1. **It is the release valve for a pressure that will not exist.** TASK-018 says so directly:
   without it, pressure has nowhere to discharge and produces learned helplessness. Park the
   pressure and the valve loses the thing it was for.
2. **As written it violates invariant #7.** The "later" list above is a hand-written description of
   what growing up looks like — exactly the thing Zosia objected to in TASK-014.
3. **The shape conflicts with the M3 decision.** M3 was deliberately reduced from a hard gate to an
   **advisory signal**: the harness computes a number and hands it to the model; the model decides.
   M5 is a hard gate on the menu — the same shape one layer down. Reduced to the compliant form
   ("surface the evidence, let him choose"), M5 already exists: M3 supplies the inhibition signal,
   M4 supplies domain-keyed trust and acquisition provenance, and the finalizer supplies the live
   menu.
4. **The genuine technical content is thin.** Most of the "unlockables" are not tools at all — they
   are prose behaviours the model performs anyway. The one real switch is autonomous outbound
   (`src/outbound/autonomous-policy.ts`). That is one narrow task, not a milestone.
5. **Evidence-triggered transitions need evidence, and there is none yet.** With zero Arena
   snapshots, any threshold would be guesswork, and AC#2 ("transitions triggered by evidence, never
   time") cannot honestly be met.

### The honest counter-argument, recorded so it is not lost

Without M5 there is no felt increase in capability — no "…o. mogę." moment. The answer for
generation 1 is that M2, M3 and M4 genuinely change state, and the model can name that change
itself; manufacturing the moment in the harness is the Opus 5.0 out-of-scope case.

### The smallest honest version, if it is ever wanted

Gate **autonomous outbound only** on `partner_predictability`, which M3 already computes
(`src/cognition/inhibition/inhibition-signal.ts`). One condition, one existing number, no menu, no
hand-written list of adult behaviours. Still worth deferring until snapshots exist.

### When to revisit

After Akuki has run on the Arena long enough for the M0 instrumentation to show whether the action
space is actually a limiting factor — and only if TASK-014 is revived, since M5's justification is
downstream of it.

---

## 3. Evolutionary layer — many Akukis, selected on development

**Noted, explicitly not built.** High confidence, and the leaning was already "record it, do not
build it" before this file existed.

Rather than hand-writing `temperament.yaml`, run several Akukis with varied temperament parameters
and select on which of them actually develops. This is the phylogenetic pressure from entry 1,
and it is the only honest way to get temperament parameters that were *selected* rather than
*chosen*.

Out of scope for reasons of cost and time, not merit. It would multiply model spend by the
population size and require a fitness measure for "development" that the project does not yet have
— the M0 instrumentation is the prerequisite, not an optional extra.
