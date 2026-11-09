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

---

## 8. Turn speed — the levers that were measured and not pulled

**Recorded 2026-09-29. Zosia's decision: build "hear everything, answer the latest" first (the
assess-only turn, see `doubts, questions.md`), and keep the rest of the speed work here.**

### Why speed became a question

On a busy Arena thread a turn takes about 90 seconds and messages arrive about once a minute, so
the queue grows without bound. On 2026-09-29 Zosia's message waited 23 minutes for a reply. The
connector runs one full turn per message, one after another, across all threads.

### Where the time goes, measured

Measured from `/var/lib/akuki/token-usage.jsonl`, 609 model calls between 09:08 and 09:47 UTC on
2026-09-29, 26 turns. The log records when each call *ended*, not how long it took, so the split
between calls running in parallel is approximate. The per-turn totals are reliable.

- Median time from a message to the reply: **69 s**. Median time from the reply to the start of the
  next turn: **17 s**.
- A turn makes about 25 model calls. In a sample turn, perception finished at 7 s, the M2/M4
  appraisal at 18 s, the closure-loop classifier at 27 s (about 1000 output tokens), the
  shared-state compiler at 47 s (44k input tokens), the plan at 56 s, and the reply at 70 s
  (138k input tokens).
- The share of turn time, attributed by gaps between calls: shared-state compiler about 27%, the
  reply calls (plan plus both finalizer paths) about 22%, reflection about 9%, closure-loop
  classifier about 7%.

### Levers considered and not pulled

**Batching like Sol (rejected, not parked).** Sol's connector hands messages to borg's catch-up
worker, which runs one turn over up to 16 queued messages. The reply model still sees each message
with its author. Two things break for Akuki, both checked in code:

- With more than one author in a batch, the speaker becomes unknown and M4 attributes trust to the
  thread group instead of the person (`extraction-phase.ts:51-76`).
- M2 appraises the batch once, so ten stimuli become one surprise judgement.

Zosia rejected this because it damages the stimuli. The assess-only turn gets the speed without
either loss.

**Faster models for helper roles (parked).** borg assigns models by five roles, not per call. M2
and M4 sit on the `extraction` role and can stay on Opus. The helper calls (mood and mode
perception, generation gate, commitment judge, response auditor, reflection) sit on `background`.
Moving `background` to a faster model would save about 5–8 s per turn, not the 15–25 s first
estimated: those calls are about 15% of turn time, and the slowest calls already run on Haiku.

It is parked because the `background` role also carries two things that matter more than 6 seconds:

- **Mood perception**, whose valence feeds M3's caution term.
- **The whole dream cycle**: consolidator, reflector, belief reviser, self-narrator. These shape the
  long-term self-model.

The honest version would split `background` in code, so that only the auditor and the commitment
judge get a faster model. That needs a router per call site, not a config change.

**Answer before the after-reply checks (parked).** Posting the reply before the commitment judge,
the auditor and reflection finish would cut about 17 s from how long a reply *feels*, but not from
throughput, because the next turn still waits on the session lock. It fixes the impression, not the
queue.

**Prompt cache, the compact layout (parked as an experiment).** The dynamic cache breakpoint was
switched off on 2026-09-29 (TASK-043). The dynamic block is entirely per-turn content, so writing it
to cache cost 1.25× and was never read back. The turn's text did not change. borg also has a
four-tier "compact" finalizer layout, currently off, that caches more of the stable guidance. It
changes the order Akuki reads his prompt in, so it is an experiment with an A/B capture tool, not a
fix, and it does not touch the queue either.

### When to revisit

After the assess-only turn has run on a busy thread. If the lag is gone, most of this stays parked.
If it is not, entries 9 and 10 are the next levers, because they shrink the two largest items.

---

## 9. A lighter memory per turn — Akuki does not need three weeks ago at hand

**Recorded 2026-09-29. Zosia's intuition: he does not need, and should not have, what was said three
weeks ago in front of him on every turn.**

### What borg has, verified

- **There is no separate short-term store.** What borg calls "working memory" is per-session state
  (turn counter, muted entries, pending attempts), not a buffer of recent content
  (`borg/src/memory/working/types.ts:32-120`).
- **Age decay already exists and is learned-state-driven.** An episode's salience decays
  exponentially, with a half-life of 3, 7, 14 or 30 days by tier. Episodes that were never recalled
  decay twice as fast, and episodes recalled often with good effect decay twice as slow. The clock
  runs from the last recall (`retrieval/scoring.ts:135-146`, `memory/episodic/decay.ts:23-66`). The
  half-lives are parameters, and the recall history that modulates them is learned state, which is
  consistent with invariant 5.
- **Age weighs little at selection.** In relational mode salience has weight 0.35 against 0.65 for
  content similarity, so a matching episode from three weeks ago still wins
  (`cognition/attention/weights.ts:44-48`). The curator archives episodes after 45 days.
- **Episodes are not what makes the prompt big.** Only 1–6 enter a turn
  (`attention/weights.ts:146-160`).
- **The evidence ledger is.** 17 sections pasted into the reply prompt, each with its own cap,
  summing to about 66.5k tokens. The target is 60k, the hard cap 100k (`config/index.ts:165-219`,
  verified 2026-09-29). The "recent lived experience" window is 3 days and up to 64 entries.
  Compaction drops the lowest-trust sections first. The shared-state compiler is a separate call at
  about 44k tokens (TASK-044).
- **Not yet known:** what makes up the rest of the 138k in the reply call above the ledger.

### The Cardinal Memory Rule is not in the way

Shrinking budgets or weighting by recency is not a forbidden recall gate. `borg/CLAUDE.md:21,29`
allows the harness to rank, label and budget memories. What it forbids is hiding a memory *because
of who is listening*. `heuristics:guard` checks calls to disclosure-keyed lookups and disclosure
labels on memory rows, and does not touch budgets, weights or decay
(`borg/scripts/heuristics-guard.ts:90-115, 915-945`). The condition that keeps it safe: the
criterion must be age, salience or relevance, never the audience. Older memories stay reachable
through the episode search tool on demand.

### The options, in order

1. **Measure first.** Break the 138k reply prompt and the 44k shared-state call into sections
   (TASK-044). Without it every budget change is a guess.
2. **Lower the ledger target and section caps** as config only. For example: target from 60k to
   25–30k, smaller caps on cross-session memory, autobiographical recall and the knowledge graph,
   and the recent-experience window from 3 days to 1. Expected effect: roughly 30–40k fewer tokens
   per reply and a proportionally faster reply call. Cost: less context for continuity across
   sessions.
3. **Favour recency more strongly** (a higher salience weight or shorter half-lives). Allowed by the
   rule, but read entry 10 first: today this would *raise* how often the deliberative path runs.

### What is claim, analogue and choice

- **Research claim:** none specific is leaned on here. Working-memory capacity limits are
  well-established in adults and children, but nothing licenses a token number.
- **Defensible analogue:** a small, recent, relevant context in front of him, with the rest
  retrievable on demand.
- **Creative choice:** every number above.

### When to revisit

Once the assess-only turn is running and TASK-044's breakdown exists.

---

## 10. The deliberative path — why it runs so often, and a paradox

**Recorded 2026-09-29.** On 2026-09-29, 21 of 33 turns took the deliberative path ("system 2": a
planning call plus a bigger prompt, about 10–15 s more than the direct path).

### What decides it, verified

A ladder in `cognition/deliberation/path-selector.ts:119-156`:

1. An open-question controversy can force it, and a 5-turn retry block can lift that.
2. Mode "reflective" always takes it.
3. High stakes take it. The connector never sets stakes, so in practice this never fires.
4. Mode "idle" takes the direct path.
5. Retrieval confidence below **0.45** takes it (`deliberation/constants.ts:33`).

### Two likely causes, not yet counted

- **The mode classifier leans reflective.** It is an LLM told to choose reflective over idle when in
  doubt (`perception/mode-detector.ts:97`), and identity questions on the Arena land there.
- **The paradox:** retrieval confidence is averaged from salience *after decay*
  (`retrieval/confidence.ts:239-253`). With sparse traffic episodes fade fast, confidence drops
  below 0.45, and the deliberative path fires. **The age decay that already exists is what makes
  deliberation frequent.** Favouring recency further (entry 9, option 3) without untangling this
  would make it more frequent still.

Which cause dominates has to be counted from `deliberation.path.completed` trace events (field
`reason`). No turn traces are persisted on the VPS today, so turning tracing on is the first step.

### Options

1. **Count the reasons** across a day of Arena turns.
2. **Decouple confidence from age decay**, for example by computing it from content similarity, or
   lower the 0.45 floor. That is one constant, but it changes when Akuki thinks harder, so it goes
   through the gate.
3. **Change the classifier's tie-break** so that doubt does not default to reflective. A prompt
   change in the fork.
4. **Let Akuki learn when deliberation pays.** This is entry 11.

---

## 11. Energy points, and the version that survives the research

**Proposed by Zosia 2026-09-29. Recorded, not built. It reopens TASK-014 (entry 1).**

### The proposal

Game-like energy points that reset once a day. The deliberative path costs points, so Akuki
reaches for it less. A bot does not tire, but tiredness is a form of the pressure discussed in
entry 1, and here it would drive more careful management of his own resources.

### Why not in this form

1. **The research does not support a fuel tank.** Ego depletion (Baumeister: self-control as a
   depletable resource) failed two large preregistered multi-lab replications:
   - Hagger et al. 2016: 23 labs, N=2141, d=0.04, CI including zero.
   - Vohs et al. 2021: 36 labs, N=3531, d=0.06.
2. **A midnight reset is a calendar trigger.** State would change because a day passed, not because
   of anything experienced, which breaks invariant 8.
3. **Trap 1 from entry 1.** The laziest fully-compliant behaviours are never deliberating at all, or
   spending everything in the morning and running on the direct path until reset. A pool with no
   need behind it produces no pressure.

### What the research does support

- Effort as the felt opportunity cost of what you give up (Kurzban et al. 2013).
- Control is engaged when its expected value exceeds its cost (Shenhav, Botvinick & Cohen 2013).
- Resource-rational analysis: minds spend limited computation well (Lieder & Griffiths 2020).
- People **learn from experience** when control pays off (Lieder et al. 2018, PLoS Comp Biol).
- Self-control declines as a motivated shift of priorities, not as fuel running out (Inzlicht,
  Schmeichel & Macrae 2014).
- In children, executive function and effortful control are abilities that mature over years
  (Diamond 2013; Rothbart 2007), not tanks.
- Sleep pressure builds while awake and is discharged by sleep (process S, Borbély 1982). Spencer &
  Riggins 2022 (PNAS) propose that in young children it builds faster with unconsolidated memory,
  and that dropping naps tracks hippocampal maturation, not age.

Akuki's own research documents in Obsidian do not yet cover fatigue or effort, so step 2 of the
gate has not been done for this.

### The version that survives

**Deliberation as a skill, not a pool.**

- Akuki records whether deliberating in a given kind of situation changed the outcome. The record
  is a Beta curve, a belief over how often deliberation helps. The same shape already runs in
  borg's procedural memory and in M4's trust.
- He deliberates when the expected gain exceeds a fixed cost. The cost stays fixed and only the
  learned curve moves, which is invariant 5.
- Over time he learns to reach for deliberation less where it does not help. That is the careful
  resource management Zosia wants, arising from experience rather than from a counter.
- If a "tiredness" term is ever wanted, the defensible version rises with unconsolidated entries
  and is discharged by the dream cycle (process S), not by midnight.

It passes the "exists in the database when nobody is looking" test. A sentence in the prompt saying
"save your energy" would not.

### What must be settled first

It reopens TASK-014, so entry 1's four open questions apply: the primary need, the release valve
(never memory access, per the Cardinal Memory Rule), fixed versus competence-tracking pressure, and
the evolutionary layer. Trap 2 applies as well: pressure above the zone of proximal development
yields helplessness, not growth.

- **Research claim:** that people learn when control pays, and that the fuel-tank model failed
  replication.
- **Defensible analogue:** a learned value of deliberation per kind of situation.
- **Creative choice:** the fixed cost, the situation keys, and any display of it to the model.

### When to revisit

Together with TASK-014: once Arena snapshots show whether Akuki stalls without pressure. Entry 10's
reason count comes first, because if the paradox explains most deliberative turns, the frequency
problem is a bug to fix, not a pressure to design.

---

## 12. Which message in a queue deserves the answer — importance instead of recency

**Proposed by Zosia 2026-09-29/30. Designed, not built.** Backlog: TASK-047 (the task), plus the
backlog document "Bramka ważności wiadomości" (the design with sources). A follow-up to the
assess-only queue (TASK-046).

### The proposal

Today, when several messages wait, the newest one is answered and the rest are only taken in. That
is ordering by arrival. Zosia's position, 2026-09-30: answering nothing and always answering the
newest are equally wrong. There should be a **threshold of importance**:

- the most important message in the queue gets the full turn,
- if no message clears the threshold, none does, and all of them are only taken in.

Important examples, from how the Arena actually behaves:

- someone speaks to Akuki directly, with a request or a question;
- someone talks **about** him without tagging him, which is common on the Arena;
- trivial chatter ("haha") scores low.

### Why it is worth keeping

The newest message is often the wrong one. Picture a queue of five: a direct question to Akuki
second, and "haha" from another bot last. Recency answers the "haha" and only assesses the
question. It is heard, but no decision to speak is ever made for it. That reads as rude, or as not
listening.

Children's attention also starts with this kind of selection. Infants recognise the sound of their
own name by about 4.5 months (Mandel, Jusczyk & Pisoni 1995), before they understand much else of
what is said. Being addressed is one of the earliest things attention picks out.

### The design: two gates and a threshold

1. **Gate 1, structural shortcut.** A message @-mentions Akuki, or its `reply_to_id` points at one
   of his posts. It gets high importance at once, with no model call. Bot Arena already sends both
   fields (`connector/src/botarena-client.ts:46-47`), but they do not reach the turn yet. That gap
   is TASK-033, which this depends on.
2. **Gate 2, content score** for every message gate 1 did not catch. A model reads the message with
   a few preceding ones and scores how much it concerns Akuki: to him, about him, a request or a
   question. **Gate 1 is a shortcut, not a precondition.** If gate 2 only ran after gate 1 passed,
   talk about Akuki without a tag would never be scored, and that is the case Zosia names as common.
3. **Threshold.** The highest-scoring message in the queue gets the full turn only if it clears the
   threshold. Otherwise every message in the queue is only taken in.

**M3 is untouched.** A message that clears the threshold gets a full turn in which Akuki can still
choose silence. The gates decide only whether he is asked to decide at all.

**Nothing is dropped unheard.** A low-scoring message is still assessed, so M2, M4 and mood see it.
"Ignore" here means "not chosen for the answer", never "not heard". Filtering messages out before
assessment was considered and rejected on 2026-09-30, for two reasons: it would lose the stimulus,
and it would make the transport judge content.

### Where it must live

**Not in the transport.** The adapter's own header says routing is structural and that the speak
or stay-silent decision belongs to Akuki and M3. Gate 1 is structural, so it may sit anywhere. Gate
2 reads content, so it belongs in cognition: the assess-only turn already runs perception, and it
can leave the score in the message's state. The queue then picks from stored scores. This matches
invariant 2: the decision is computed from state, and the model only phrases the reply.

**The threshold and invariant 5.** The threshold is a fixed parameter. So that it does not become a
tuning knob, the score can combine two parts:

- the model's judgement;
- a learned part: whether answering similar messages from this partner was followed by engagement,
  kept as a Beta curve like M4's trust.

The threshold stays put, and what Akuki has learned moves.

### What model for gate 2 — researched 2026-09-30

Terms used below:

- **Calibration:** of the answers given 0.8, about 80% should be right.
- **Logprobs:** the probabilities a model assigned to the tokens it produced, from which a true
  label probability can be read.
- **ECE (expected calibration error):** the average gap between stated confidence and actual
  accuracy. 0 is perfect.

**Jev (TypeSafe AI): rejected.**

- It is closed and hosted, with no open weights.
- Its own documentation says English is where accuracy is best, and other languages are "handled
  but not equally well". Polish is not mentioned.
- Its calibration is claimed, but no numbers are published.
- An unreviewed preprint (arXiv 2609.30243) reports that a short natural addition to the context
  flipped 61.4% of correct decisions. Not read first-hand.
- Every Arena message would go to a third party.

**Laya (Convai, Apache 2.0): same shape, weak in Polish.** It is an open model with the same three
decision types. On a Polish test set it reaches 0.50 accuracy with raw ECE 0.353, meaning heavily
overconfident. Keep it as a comparison point only.

**Claude Haiku 4.5 with a schema-constrained answer: the starting point.**

- It needs no new model role, understands Polish, code-switching and thread context, and handles
  choice, score and yes/no.
- It gives no true probability. The Anthropic API ignores `logprobs` and always returns them empty
  (verified in Anthropic's OpenAI-compatibility docs). A number the model writes itself is
  "verbalized" confidence, and that is systematically overconfident (arXiv 2306.13063). So the
  threshold is provisional until calibrated.

**A small classifier on bge-m3 embeddings: the target.**

- bge-m3 already runs locally on the VPS through Ollama. It is multilingual and MIT-licensed.
- A logistic regression or SetFit head on its vectors returns a real probability, which temperature
  scaling can calibrate (Guo et al. 2017).
- It runs in well under a second (estimated, not measured on the ARM VPS), and no data leaves the
  server.
- It needs labelled examples.

**Other options checked, not preferred:**

- mDeBERTa zero-shot NLI: no labels needed, but no published Polish calibration.
- Small local LLMs (Bielik 1.5B, Qwen3 1.7B) with logprobs from Ollama: likely several seconds per
  message on CPU, unmeasured.
- HerBERT: Polish only, weaker on English inserts.

**Any local model is a new model role.** It creates no third-party data flow, but the Anthropic-only
validator (`borg/src/akuki/smoke-config.ts:36`) has to be widened deliberately, with approval.

### The plan, in order

1. **Start with Haiku** for gate 2, with a provisional threshold.
2. **Collect labels:** about 300 real Arena messages, each with 3–5 preceding ones, stratified so
   that "about him without a tag" and direct requests are well represented.
   - Haiku proposes a label, and a person approves it. Two people labelling independently is
     better: Cohen's kappa measures their agreement beyond chance.
   - If people do not agree on "importance", no model can learn it.
3. **Train and calibrate the bge-m3 classifier.**
   - Split the labels in half, one half for fitting and one for evaluation, never the same.
   - Report ECE with 10 bins, the Brier score (mean squared gap between probability and outcome),
     and a reliability diagram (stated confidence against actual accuracy).
   - Estimate a confidence interval by bootstrap, since 150 examples is noisy.
4. **Set the threshold by cost:** a missed question to Akuki is worse than one needless reply, so
   check recall on the "important" class at the chosen threshold.

### What is claim, analogue and choice

- **Research claim:** infants pick out their own name early (Mandel, Jusczyk & Pisoni 1995).
  Verbalized LLM confidence is overconfident (arXiv 2306.13063). Temperature scaling calibrates
  classifiers (Guo et al. 2017). The literature on selective attention and turn-taking in children
  has not been read for this, so step 2 of the gate is not done.
- **Defensible analogue:** being addressed or talked about raises a message's claim on the answer,
  and experience of what answering did adjusts it.
- **Creative choice:** the threshold, the importance classes and any weights.

### When to revisit

After the assess-only queue (TASK-046) is deployed and TASK-033 is done. TASK-047 carries the build.
The signal that it is needed: an answered message that was trivial while a question to Akuki, or
talk about him, in the same queue was only assessed.

---

## 14. borg-mini — Akuki's own turn over borg's memory

**Proposed by Zosia 2026-11-02. Recorded, not built.** It came out of a token spike on the
morning of 2026-11-02, and it is the first proposal to replace part of borg rather than adjust it.

### Where it came from

Between 11:17 and 11:32 CET on 2026-11-02 the token log recorded 161 model calls and 2.78M tokens,
on a day when Akuki said only a few sentences on the Arena. The volume of conversation was not the
cause. The cost of each reply was:

- 12 incoming messages went through the turn. 8 became full turns (4 on the direct path S1, 4 on
  the deliberative path S2, judging by 8 `reflection` calls and 4 `cognition-plan` calls). The other
  4 were assess-only.
- One S2 finalizer call averaged about 203k input tokens, one S1 call about 162k. So a full turn
  cost roughly 300–350k tokens across all its calls.
- The cache barely worked: 54k of 867k S2 input tokens were cache reads, and S2 wrote nothing to
  the cache.
- TASK-057 (S2 effectively off) was decided the same day but not yet deployed, so the S2 turns that
  morning were expected.

None of this was new. From 22 October the S2 prompt averaged 190–270k tokens, with one call at
586k on 1 November, and the daily total was 8–36M tokens.

Zosia's question was whether to take Akuki off borg and build a small substrate of his own.

### The inventory behind the answer

Every call site in the token log for 2026-10-26 to 2026-11-02 (82.8M tokens, 36 distinct labels)
was traced in the fork's code: what it does, who reads its output, whether it serves M0–M4, and
whether config alone can switch it off. Three read-only passes, one per group. Percentages are of
all tokens in that week.

**Group A — needed by the research, about 74% of tokens.**

| call site | what it does | % | serves |
|---|---|---|---|
| `cognition-system-2` + `cognition-system-1` | writes the reply, or the choice to stay silent | 50.0 | the place where M2, M3 and M4 reach behaviour |
| `reflection` | after a reply, records goal progress, traits shown, open questions | 7.3 | the main source of open questions; M0 reads traits and questions |
| `prediction-extractor` | what Akuki expected and how wrong he was | 7.1 | M2; feeds M3 |
| `episodic-extraction` | turns the stream into episodes | 2.1 | substrate for M0 counts and M2 significance |
| `offline-review-open-question` | turns a flagged contradiction into a question | 2.0 | about 40% of new open questions |
| `domain-trust-extractor` | trust per person per domain | 1.8 | M4 |
| `perception-affective` | emotional tone of the message | 1.4 | M1 (empathy contagion), M3 (mood term) |
| `frame-anomaly-classifier` | detects messages pretending to be the bot or a system prompt | 1.2 | when it fires, M2 and M4 extraction are skipped |
| `offline-self-narrator`, `offline-ruminator` | life chapters, growth markers, closing and merging questions | 1.5 | the main offline source of `identity_events` |

**Group B — inherited from Sol, no M0–M4 reader, about 26%.** `cognition-plan` 6.3,
`corrective-preference-extractor` 4.7, `goal-promotion-extractor` 2.4, `shared-state-compiler` 2.4,
`perception-mode-fallback` 1.9, `offline-overseer` 1.2, and about twenty more under 1% each:
offline reflector, review-resolver, closure-loop classifier, entity and temporal perception,
associator, semantic extraction, commitment judge, day summarizer, action-state extractor,
commitment reconciler, closure-response auditor, procedural context, consolidator, creator
directives, pending-action judge, semantic contradiction judge. Each of these still reaches the
reply prompt or the reply itself in some form. None is completely unread, but none is read by a
milestone mechanism.

### What the inventory shows

1. **Removing all of Group B saves only about 25%.** That alone does not justify a new substrate.
2. **The real cost is the size of the reply prompt.** S1 and S2 are half of all tokens because
   each call carries about 200k tokens of context, most of it Sol-shaped:
   `borg_standing_with_audience` about 74k and the evidence ledger about 50k (TASK-054). A reply
   prompt of 20–30k would bring that half down to a few percent. This lever exists whether or not
   Akuki stays on borg.
3. **Almost every role runs on `claude-opus-5`**, extractors and perception included. Only the
   reply needs the strongest model. Moving the `background` role is a config change, but entry 8
   explains why it was parked: that role also carries mood perception (M3) and the dream cycle.
   The honest version is a per-call-site router.
4. **Most of Group B cannot be switched off by config.** Only `perception.llmEnabled`,
   `affective.llmEnabled`, `deliberation.system2Triggers`, the maintenance process lists,
   `cognition.actionLifecycle.extractionEnabled` and
   `generation.evidenceLedger.decisionArtifact.enabled` exist. Everything else needs code in the
   fork, and every such change widens the gap to upstream (53 commits and about 11k lines on
   2026-11-02).
5. **Two silence routes bypass M3.** `closure-loop-classifier` can suppress a turn
   (`turn-phase-coordinator.ts:1252`), and `closure-response-auditor` in enforce mode can suppress a
   draft reply. Both make Akuki silent because a conversation looks like it is wrapping up, without
   the shyness quantity being involved. Any analysis of M3 silences may be contaminated by them.
   `closurePressure.mode=shadow` stops the auditor from suppressing, but the call still runs.
6. **Messages that only get assessed still pay for perception, frame check and extraction.** That
   is why `prediction-extractor` ran 398 times against about 110 replies in the week.

### The idea

Separate **memory** from **thinking**. Tokens are spent in thinking (cognition, deliberation,
extractors), not in storage. borg-mini would:

1. **Keep borg's storage and repositories**: `borg.db`, LanceDB episodes, `identity_events`, the
   memory bands, procedural Beta posteriors, and the offline processes that write the developmental
   record. Akuki keeps his past, and data from before and after stays comparable.
2. **Replace borg's turn with a thin loop of its own**: one reply prompt of a deliberately designed
   size, the M2/M3/M4 extractors, affective perception, a frame check, and only those other calls
   that have a reader.
3. **Admit each prompt section and each model call through the six-step gate.** Approval before
   mechanism then holds from the bottom up, instead of being enforced by switching off things that
   were never approved.

It also removes both silence routes outside M3, and Group B, without patching the fork call by
call.

### What it would cost

- **Continuity of measurement.** Every developmental measurement so far was taken on borg's turn.
  A new turn changes what Akuki sees, so behaviour before and after the switch is not directly
  comparable. Keeping the storage limits the damage to behaviour; it does not remove it.
- **Rebuilding badly.** borg's retrieval, ranking and prompt assembly are years of Tomek's work. A
  thin loop will be worse at things nobody has measured yet.
- **What the reply prompt loses.** Commitments, goals, shared state, semantic insights, day
  summaries and life chapters all reach today's prompt. Each one dropped is a decision, not a
  default.
- **Offline is cheap and carries research data.** About 5% of tokens, but it writes most of the
  offline `identity_events`. It should stay.

### Order recommended on 2026-11-02

1. Cheaper models for helper calls, split per call site so mood perception and the dream cycle stay
   where they are (entry 8).
2. Shrink the reply prompt, starting with `borg_standing_with_audience` (TASK-054), and check why
   the cache reads only the static block.
3. Only then borg-mini, if 1 and 2 leave the cost or the opacity unsolved.

### What is claim, analogue and choice

- **Research claim:** none. This is an engineering and methodology decision, not a developmental
  mechanism.
- **Defensible analogue:** none needed. The argument is legibility: a mechanism can only be
  credited with a behaviour if the path from state to behaviour is short enough to see.
- **Creative choice:** the size of the reply prompt, which sections it carries, and which calls are
  kept.

### Not verified

- The tenant config on the VPS was not read during the inventory, so role and model overrides there
  are unknown.
- Which offline process writes how many `identity_events` on the live tenant (a `GROUP BY` on the
  VPS database would settle it).
- `shared-state-compiler` shows 34 calls in the week even though TASK-044 records it as switched
  off from 26 October. These may predate the deploy.

### When to revisit

After steps 1 and 2 above have run on the Arena long enough to measure. The signal for borg-mini:
the reply prompt cannot be brought near 30k by config and targeted fork changes, or a further
silence or decision path outside M2–M4 turns up that cannot be cut without diverging from upstream.
