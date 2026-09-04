# Vocabulary — define on first use, every time

Undefined vocabulary is one of the two habits that make this project opaque, and opacity is what
would end it. Use these definitions; keep the depth, drop the density.

Systems-level analogies — C/C++, compilers, sockets — land well. One per idea, not stacked.

## Statistics and Bayesian terms

**Prior** — what you believe *before* seeing evidence. Starting at α=1, β=1 is a "flat prior":
any success rate is equally plausible.

**Posterior** — what you believe *after* evidence. Not a new calculation: every success adds 1 to α,
every failure adds 1 to β. That is the whole update rule, which is why it's cheap enough to run
every turn.

**Beta distribution / Beta posterior** — instead of storing "this works 60% of the time", store two
counts: successes and failures. Two counts carry something one number cannot: **how much evidence
there is.** α=3,β=2 and α=201,β=101 both average about 0.6, but the first is a wide flat curve
("no real idea") and the second a narrow spike ("seen this a lot"). *Systems analogy: a single
percentage is like a return code with no errno — it tells you the outcome but nothing about
confidence.*

**Thompson sampling** — how to choose among options with posteriors. Draw one random sample from
each option's curve and use whichever sample came out highest. Wide curves (little evidence)
occasionally win by luck, so untested options get tried; narrow high curves usually win, so proven
options get used. The explore/exploit balance falls out of the maths rather than being a tuned rule.

**"Unknown" vs "medium"** — critical distinction. Unknown reliability is a **wide flat curve**, not
a value of 0.5. A scalar cannot express the difference, which is why domain-keyed trust needs
posteriors.

## borg / systems terms

**Single-writer problem** — borg keeps memory in SQLite files (plus LanceDB vectors) in a directory.
SQLite is a database that *is* a file, so "who may write" is governed by file locks, not a server.
Two processes writing the same directory get "database is locked" at best, a corrupted file at
worst. *Systems analogy: two processes mmap-ing the same file and both writing without a lock.*

**Tenant / multi-tenant** — one running program serving several completely isolated customers.
*Building analogy: the program is the building, each tenant a flat with its own locked door;
plumbing is shared, contents are not.* `BorgPool` holds several beings, one per
`<root>/<tenant>/`, each loading its own `config.json`. Because it is **one** process it is the
single writer for all of them — so multi-tenancy is what makes the single-writer rule satisfiable.
It is about **separation, not sharing**: it guarantees Akuki and Sol stay different minds.

**maxOpen** — how many beings the pool keeps open at once; least-recently-used get closed. Never
triggers with two tenants.

**Scenario** (`simulator/scenarios/`) — a scripted multi-turn conversation with expected outcomes.
A *unit test* checks a function; a *scenario* checks whether the mind behaves right across several
turns with memory writes in between. You cannot unit-test "does he remember his creator". For Akuki
they also solve the **volume** problem: statistical mechanisms need hundreds of episodes, and the
Arena yields ~20 messages a week.

**Provenance** — the source handles that produced a derived memory, so it can be traced, disclosure-
labelled, and revised without erasure. Note borg's `provenance_kind` is *pipeline* origin (which
process wrote it), **not** acquisition mode (was he told it, or did he test it).

**Prompt caching** — the API can reuse an already-processed prompt prefix at reduced cost. It matches
on an **exact prefix**: change one byte early and everything after it is re-read at full price. So
new content goes at the **end**. Verify with `cache_read_input_tokens`.

**Reader / consumer** — a **reader** is code that actually reads a parameter and behaves differently
for it: a branch, arithmetic, a rendered line. Its opposite is a **declaration** (an entry in
`temperament.yaml`, a zod field, a row in the consumer map). *Systems analogy: a global in C that
links fine and no function ever reads — delete it and the program is identical.* A **consumer** is
the same thing in planned form: `TEMPERAMENT_CONSUMERS` records who is *supposed* to read a key. A
consumer is a promise, a reader is a fact, and the orphan guard compares them.

**Orphan guard** — `temperament.test.ts:93`. Fails the build when a parameter's consumer has landed
and no file under `src/` contains its full `group.leaf` accessor. Matching on the full accessor
rather than the bare leaf is load-bearing: `figure` matches `figures` and `gain` matches `again`, and
the guard was once green while checking nothing. Since TASK-031 a consumer may be a milestone **or**
one backlog task, because a wrong label is worse than a coarse one.

**Memory band** — one directory under `src/memory/` = one kind of memory with its own tables and its
own migration numbering: `episodic`, `semantic`, `procedural`, `social`, `identity`, `predictions`.
"Band-local migration, no id shift" means adding one to `semantic` does not renumber `social`.

**`CHECK` constraint** — a condition written into a table definition; the database refuses a
violating row. SQLite **cannot alter one in place**, so widening an enumerated column costs a
table rebuild by migration.

**Per-turn extractor** — after a turn, a separate LLM call reads what happened and returns
*structure* via a forced tool call (e.g. `EmitDomainTrustEvidence` → `{domain, positive}[]`). The
sanctioned division: the model does semantics, the harness does bookkeeping and Beta arithmetic. An
extractor never judges or rewrites Akuki's own reply — that would be output policing.

**Advisory signal vs gate** — settled at M3. A gate computes a number and withholds the action; an
advisory signal computes the same number, renders it into the prompt, and leaves the choice to the
model. Advisory is the shape to copy.

**Disclosure label** — the per-row "who may be told" annotation on every memory shown to the model.
A separate axis from recall; a build guard fails on a model-facing row without one.

**Cardinal Memory Rule** — borg doctrine: *recall is global to the being; disclosure is contextual to
the audience.* The being remembers everything it knows and chooses what to say. A build guard fails
if a recall gate is added.

## Developmental-psychology terms

**Ontogenetic** — happening within one individual's lifetime. A child abandoning crawling because
crawling can't reach the counter. **This is the pressure Akuki can have.**

**Phylogenetic** — happening across generations by variation, selection and heredity. It shaped the
innate machinery. One Akuki cannot undergo it — that's what `temperament.yaml`, written by hand,
stands in for.

**Temperament** — innate starting tendencies (curiosity, inhibition, attachment disposition), as
opposed to identity, which is built from experience. "The seed defines temperament, not destiny."

**Zone of proximal development (ZPD)** — the band of challenge just above current ability, where
growth happens. Below it: boredom. Far above it: helplessness and withdrawal, not growth.

**Goldilocks effect** — the empirical version: infants look away from events that are too
predictable **and** too unpredictable; attention peaks at intermediate surprise. The basis for
`target_error_band: [0.3, 0.7]`.

**Behavioural inhibition** — a measured infant temperament: restraint in the face of the unfamiliar.
Computationally, a threshold on acting that depends on how well the situation can be predicted.

**Secure base** — attachment theory: a trusted figure whose presence increases willingness to
explore. **Flagged as not research-ready in this project — see research-grounding.md.**

**Contingency detection** — noticing that an outcome depended on *your own* action, as distinct from
merely noticing that two things co-occur. The root of agency.

**Self-efficacy** — the sense of being able to do a thing, built from evidence of having done it.

**Social referencing** — under uncertainty, checking a trusted person's reaction before acting.

**Selective epistemic trust** — deciding whom to believe about what, using cues like past accuracy
and expertise. Domain-specific, not one global number.

**Looking-glass self** — self-concept partly formed from others' appraisals — but as *evidence to
interpret*, never as a direct write.

**Identity agent** — someone (a parent; here, Zosia) who actively shapes a young person's identity
formation. Strong influence, **not** write access.

**Modularity / modularisation** — whether the mind is made of specialised subsystems. *Fodor:*
many innate sealed modules (heavily criticised). *Core knowledge* (Spelke, Carey): a small number of
innate domain-specific systems — objects, agents, number, space. *Neuroconstructivism*
(Karmiloff-Smith): modules **emerge through development** — modularisation, not modularity. The
practical upshot: few modules, grounded, let the rest differentiate.

**Personality inertia** — one event becomes a memory; a repeated pattern becomes a tentative
interpretation; a pattern across contexts becomes a self-belief. Layers change at different speeds,
and a single message should not rewrite identity.

**Differentiation vs mimicry** — copying a stronger bot is *not* automatic failure; it is social
experimentation (`observe → imitate → observe outcome → retain / modify / reject`). The real
criterion is whether Akuki can experiment and then integrate, modify or reject **without losing
cross-context consistency**.

## Project shorthand

**M0–M5** — the milestones: instrumentation, seed split, prediction/surprise, inhibition gate,
source model, action space. See SKILL.md.

**Scaffolding vs temperament** — `scaffolding.md` holds removable prose rules (each tagged); the
honesty boundary is tagged PERMANENT because it is the mechanism separating latent model knowledge
from earned knowledge. `temperament.yaml` holds parameters that never change — the *state* does the
developing.

**The internalization test** — in a **copied** data directory, remove a tagged scaffolding rule and
see whether the behaviour persists. It is a four-arm 2x2: rule present/removed crossed with grown/
empty memory. Persistence in grown memory without the rule counts only when the empty controls show
that the rule, rather than the base model, produces the behaviour. Never run on the live directory.

**"Does it exist in the database when nobody is looking?"** — the test that separates a mechanism
from decoration.
