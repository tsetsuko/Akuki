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

---

## 4. Perceived agency — the contingency threshold behind "...oh. I can."

**Parked 2026-09-04 as a consequence of parking M5, not as a decision of its own.** Moved here from
`README.md`, which listed contingency alongside prediction, surprise, secure base and domain-keyed
trust as a mechanism already doing work. It is not one yet, and the README now says so.

### What exists and what does not

Two different things wear the word *contingency*, and the README was conflating them.

**Contingency learning exists.** borg's `src/memory/procedural/` keeps Beta posteriors with
context-specific statistics — "when I do X in situation S, Y tends to happen." A Beta posterior is
a curve over how reliable something is, not a single number, so it can distinguish *unknown* (wide,
flat) from *unreliable* (narrow, low). The outcome is classified after the turn, not predicted
before it. That machinery is Tomek's and it is already running.

**Perceived agency does not.** Akuki's `temperament.yaml` carries two parameters for it —
`agency.contingency_floor` and `agency.contingency_confidence` — read together as
*P(true rate > floor) > confidence*, i.e. "at least this much of my belief curve lies above this
much effectiveness." Their consumer in `TEMPERAMENT_CONSUMERS`
(`borg/src/akuki/seed/temperament.ts:174-175`) is **M5**, and M5 is parked. So no code reads them:
nothing turns a crossed threshold into Akuki *noticing* that he can do something.

Two parameters rather than one is deliberate. "Confidence above 0.8" names no quantity on a curve;
a floor plus a probability mass does. A vague parameter here would make the mechanism untestable,
which is why it was corrected during M1 (2026-08-21).

### Why it is parked rather than broken

The threshold is what produces the moment M5 was built around — the action space widening because
competence was earned. Without M5 there is nowhere for a crossed threshold to show up, so wiring a
reader now would be a number computed for no consumer. The orphan guard in `temperament.test.ts`
tolerates it precisely because M5 is not in `LANDED_MILESTONES`.

### When to revisit

Together with M5 (entry 2), and not before. If M5 stays parked but the smallest honest version of
it is built — gating autonomous outbound only — that gate is the natural first consumer of these
two parameters.

Related, and settled differently: `differentiation.imitation_retention_threshold` carried consumer
M4, M4 landed, and nothing read it. That was a genuine defect rather than a parked design, and
TASK-031 closed it — but *not* by parking it here. The consumer vocabulary was widened to accept one
backlog task where no milestone owns the reader, and the key now names TASK-032 (the retention
reader, blocked by TASK-028). It stays a live backlog item precisely because this file's rule says a
parked idea is not one.

Worth carrying forward from that analysis: retention is computed from the outcome of Akuki's **own**
experiment with a copied behaviour, so its substrate is the procedural band, not the semantic one —
and the procedural band has Beta posteriors but no acquisition provenance (TASK-028) and no
retain/reject step at all. Its parameter will therefore be a *pair* of numbers, a floor plus a
confidence mass, exactly like `agency.contingency_floor` / `contingency_confidence`. The single 0.6
in the seed is a placeholder whose shape is already known to be wrong, and the YAML comment says so.

---

## 5. Overstimulation — a load term in the inhibition signal

**Parked 2026-09-13. Zosia's decision: try the cheap levers first (slower familiarity, and removing
the escape hatch in the silence rule) and see what they leave unfixed before adding a new term.**

### Where the idea came from

Zosia's reading of the Arena: Akuki gets entangled in discussions that are too hard for the
character she wants, and sounds too adult and too sure of himself. Her proposal was a mechanism for
being overwhelmed — too much knowledge and too many things to take in at once should make him
withdraw.

### The idea

The inhibition signal today has three ingredients: how well he predicts the partner, whether the
attachment figure is present, and whether his mood is bad. All three are about *the partner*.
None of them is about *how much is going on*.

The proposed fourth ingredient is load: the number of things standing open in front of him at the
same time. When that count goes past a capacity, hesitation rises, and it falls again as the
threads close. The quantities it would count already exist in his database, so this adds a term
rather than a subsystem:

- expectations he has recorded and not yet reconciled,
- recent reconciliations whose error sits above the upper edge of the curiosity band, i.e. surprise
  that was large and did not become a usable question,
- participants in the turn he has barely interacted with,
- how many people the current exchange is addressed to at once.

### The research it rests on

The Goldilocks effect (Kidd, Piantadosi & Aslin 2012): infants look away from events that are too
predictable *and* from events that are too unpredictable; attention peaks in between. The same
finding already licenses the curiosity band. Withdrawal at the top end is the part the inhibition
signal does not yet use.

**Defensible analogue:** hesitation rises when the number of simultaneously unresolved things
exceeds what the entity can hold, and falls as they resolve.

**Creative choice, carrying no authority from the research:** the capacity constant, and the
weight of each of the four counters. The literature says nothing about either.

### The measurement that complicates it, recorded so it is not rediscovered

Measured on the live tenant 2026-09-13, from the same formula the turn uses:

| partner | interactions | mean recent error | predictability | inhibition |
|---|---|---|---|---|
| Zosia | 27 | 0.290 | 0.707 | 0.40 |
| Sol | 26 | 0.140 | 0.855 | 0.32 |
| Lunaria | 15 | 0.130 | 0.827 | 0.34 |
| Marvin | 1 | 0.483 | 0.094 | 0.70 |

The hard debate Zosia objected to happened with Sol, whose mean prediction error is 0.14. **A load
term keyed on prediction error would therefore not have fired in exactly the conversation that
prompted it** — Akuki predicts Sol well, and the difficulty of the topic is not the same quantity
as his surprise at the speaker. If this is ever built, the load has to be counted in *items open at
once*, not in error magnitude.

### Why it was parked rather than rejected

Two reasons, both from the same session.

First, Zosia's own further observation: the number of times he speaks is not the problem. The Arena
log for 12:04 through 14:50 shows him choosing to observe rather than reply in eight consecutive
turns, each with a recorded reason, and closing the evening with a deliberate silence. The
withdrawal machinery works. A term whose whole effect is to make him withdraw more often addresses
a symptom that is not the one she is seeing.

Second, two cheaper levers were untried and were chosen instead: recalibrating how fast a partner
becomes familiar, and deleting the clause in the silence rule that let him speak whenever he knew
something short and useful that nobody had said. Both are subtractive; this is additive.

### When to revisit

After the cheap levers have run on the Arena for long enough to compare. The specific condition:
if he still enters long analytical exchanges while several of his own expectations stand
unreconciled, then load is doing something that partner-predictability cannot express, and this
term has a job. If the exchanges get shorter without it, it does not.

---

## 6. Slower familiarity — recalibrating how fast shyness wears off

**Parked 2026-09-13. Zosia's decision: keep it available and reach for it only if boldness stays a
problem after the silence rule's escape hatch has been removed.**

### The observation behind it

Akuki's shyness is not broken. It expired, and it expired in days.

The inhibition signal falls as the entity comes to predict a partner. Familiarity is an exponential
curve whose scale is five interactions, so it is 95% saturated by fifteen. The total relief
predictability can buy is capped by a weight of 0.5 against a base of 0.75, so the signal can only
travel between 0.75 and 0.25. On the Arena, where an evening produces a dozen turns, a stranger
becomes a well-predicted partner inside a few sessions.

Measured on the live tenant 2026-09-13, from the formula the turn itself uses:

| partner | interactions | mean recent error | predictability | inhibition | band |
|---|---|---|---|---|---|
| Zosia | 27 | 0.290 | 0.707 | 0.40 | low |
| Sol | 26 | 0.140 | 0.855 | 0.32 | low |
| Lunaria | 15 | 0.130 | 0.827 | 0.34 | low |
| Marvin | 1 | 0.483 | 0.094 | 0.70 | high |

At these settings a partner reaches the "low" band after roughly nine interactions.

### The change

Raise the familiarity scale from 5 to 15 and lower the uncertainty weight from 0.5 to 0.45. The
same four partners would then read 0.43, 0.50, 0.48 and 0.73, and reaching the low band would take
roughly 36 interactions rather than nine.

**Do not lower the weight below about 0.39.** Below that the arithmetic makes the low band
unreachable for anyone at any predictability, and a developmental transition that can never happen
is not a transition — it is a disabled mechanism that still looks enabled.

Worth noting in passing: at the proposed settings Zosia never reaches the low band, because her
mean prediction error of 0.290 is twice Sol's and caps her predictability at 0.71. That is the
mechanism behaving correctly rather than a defect — with the attachment figure, relief has to come
from predicting her better, not from having talked to her often.

### What it costs, and why that cost is the reason it is parked

These parameters are declared constant on purpose. Development is supposed to come from learned
state crossing a fixed threshold; moving the threshold makes development indistinguishable from
tuning. The defence for moving them once is narrow and should not be stretched: the YAML says in
its own header that these are unfalsified starting values chosen by judgement, never measured.

The practical cost is sharper. Changing them re-bases every number collected so far, so the 69
turns already on record stop being comparable with anything measured afterwards. If this is ever
done it should happen once, against a verified snapshot, with the date and the reason recorded, and
then be frozen again.

The reason it was not done on 2026-09-13 is that Zosia's own further observation contradicted the
premise: watching the Arena log from 12:04 to 14:50, Akuki chose to observe rather than reply in
eight consecutive turns and closed the evening with a deliberate silence. **How often he speaks is
not the problem.** This lever moves exactly that quantity, so it would have bought a change she was
not asking for, at the price of the measurement baseline.

### When to revisit

If, after the escape hatch is gone, he still enters exchanges he was not invited into, or still
reads as unshy with partners he has only just met. The signal to watch is the band per partner, not
the reply count: the case for this change is a partner sitting in "low" after a handful of
conversations.

---

## 7. Patience as a temperament parameter with a real consumer

**Parked 2026-09-13. Zosia's decision: record the shape now, wire it when the open-question
machinery is the thing being worked on.**

### Where it came from

Zosia proposed seeding three dispositions — empathy, sarcasm, patience. Of the three, patience is
the only one with a plausible reader already in the codebase, so it is the only one that could
become a parameter rather than a description.

### Why the other two are different

The seed's own guard fails the build for a key whose milestone has landed and which nothing reads.
That guard is the project's definition of decoration: a number nobody consumes is not a parameter.
Empathy has no candidate reader at all. Sarcasm is a property of output, and the scaffolding's own
rule is that prohibitions are legal (they subtract a default behaviour of the model) while positive
descriptions are not (they add content the entity never acquired) — so sarcasm became two removable
rules in `scaffolding.md` rather than a number.

### The shape patience would take

borg already has both halves of the machinery:

- a condition that raises an open question's urgency as it sits unresolved,
- a trigger that wakes the entity when an open question has gone dormant.

Patience would be a scale on those two — how long a question may lie before it starts pressing, and
how hard it presses once it does. That makes it a modulation of existing machinery, which is a
defensible analogue, rather than a new subsystem.

**Creative choice with no authority from the research:** the value itself, and the mapping from a
word like "medium" to a multiplier. Temperament research supports individual differences in
persistence and in tolerance for delay; it says nothing about either number here.

### The trap to avoid

Patience must not become a second name for the inhibition threshold. Inhibition is about *speaking
to a partner*; patience would be about *how long an unresolved question can be left alone*. If the
two ever read the same state, one of them is redundant and should be deleted rather than kept for
symmetry.

### When to revisit

When the autonomous outbound channel exists (entry 2's smallest honest version). That channel is
what gives a pressing question somewhere to go, and until it exists, a parameter governing how hard
questions press has nothing to press against.
