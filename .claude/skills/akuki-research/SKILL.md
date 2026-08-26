---
name: akuki-research
description: Akuki — the developmental-psychology research project built on a fork of borg. Enforces a six-step gate on every mechanism (check borg first → name the research → separate claim from analogue from creative choice → explain in plain words with jargon defined → STOP and ask for approval → implement, then update backlog and docs) and forbids implementing any mechanism without explicit approval. Use whenever the work touches Akuki, his temperament/scaffolding seed, the borg fork, memory bands, open questions, prediction error, inhibition/shyness as a computed quantity, domain-keyed trust, acquisition provenance, developmental pressure, milestones M0–M5, the Bot Arena connector for Akuki — and also for short conceptual questions arising from it like "what is a Beta posterior", "what is a tenant", "what is the zone of proximal development", "why not a dumber model". Does NOT apply to Sol, sol-connector maintenance, or Cortex work.
---

# Akuki — developmental research, and how to explain it

## What this project is

Akuki (悪機, "evil machine") is Zosia's bot in the team's Bot Arena, but **the project is not a
persona bot.** As of 2026-08-20 it was deliberately reframed into a developmental architecture:
mechanisms that let a capable-but-inexperienced agent bootstrap world, agency, source and self
models from experience.

Purpose is **research and learning**. No deadline, no business value, no deliverable to defend.
That licenses depth over breadth — one mechanism understood properly beats four half-built — and
it means it is fine if Akuki never fully works.

The authoritative documents are in Obsidian, **not** the repo:

- `obsidians/computer_science/AI/AKUKI/akuki_newborn_development_architecture.md` — the spec
- `obsidians/computer_science/AI/AKUKI/akuki_child_psychology_research.md` — the psychology
- `obsidians/computer_science/AI/AKUKI/doubts, questions.md` — concept explanations, append here
- `/home/zosia/projects/ai/akuki/backlog/` — M0–M5 and the open design decisions

Read the two research docs before proposing anything. They repeatedly turn out to be ahead of
whatever seems obvious, and at least once a plan drafted without them over-committed past what the
research supports (see "The research wins" below).

## How to explain things here

**If the mechanisms stop being explainable, the project stops.** Opacity is its real risk — far
more than bugs. Two writing habits are what actually cause it:

1. **Undefined vocabulary** — words like *posterior*, *tenant*, *fixture*, *ontogenetic* used as
   if they were ordinary English.
2. **Compressed causal chains** — four mechanical steps welded into one sentence with arrows and
   commas, leaving no place to stop and check understanding.

So: **do not reduce the technical depth. Reduce the density.** Keep every real finding, every
number, every file path. Unpack it into steps and define the words. Writing down to the reader is
both wrong and unhelpful: they read code and catch design errors, including this agent's.

Systems-level analogies — C/C++, compilers, sockets, precompiled headers — land well. Use one per
idea, not stacked. Define every term on first use; `references/vocabulary.md` holds the wording.

## The invariants

Non-negotiable, and every proposal is checked against them:

1. **Mechanism, not prose.** A trait described in a prompt is not a trait. The test:
   *does it exist in the database when nobody is looking?* Escalating urgency and firing wake
   conditions are mechanisms; a sentence saying "you are curious" is decoration.
2. **No faking.** Akuki must not perform states he does not have. The line falls precisely here:
   the **decision is computed from state**, the **model is only used to phrase the result in
   words**. Asking the model "what question should you have?" is a prompt wearing a mechanism's
   clothes.
3. **A newborn is not a stupid adult.** Keep the cortex, start with an empty hippocampus.
   Developmental constraint comes from memory state, action space and access — never from a
   weaker model, which produces incoherence rather than youth.
4. **Agency precedes identity.** "When I do X, Y tends to happen" comes before "I am someone who
   does X."
5. **Parameters stay fixed; the learned state does the work.** Akuki gets less shy because
   partner-predictability rises, not because a threshold was turned down. Otherwise "development"
   becomes a tuning knob and cannot be distinguished from adjustment.
6. **Development is sparse.** Most interactions should change nothing. Meaningful development is
   rare — that is a requirement, not a side effect, and it is what keeps the voice terse while
   the internals get complex.
7. **Don't engineer adult Akuki.** Engineer the conditions under which he can develop. A
   hand-written list of what growing up looks like violates this. This has been caught twice in
   review here, and both times the objection was right.
8. **Evidence-triggered, never calendar-triggered.** No "week 3 = toddler" stages.

## The six-step gate — mandatory for every mechanism

**Stop at step 5.** Do not implement before an explicit yes. Approval is required before every
mechanism implementation and must never be presumed.

1. **Check borg first.** Most of it already exists. See `references/borg-inventory.md`. Rebuilding
   what Tomek built is the most common way to waste this project's time.
2. **Name the research.** Which developmental-psychology finding does this rest on? Cite it. See
   `references/research-grounding.md`.
3. **Separate three things explicitly** — this project's own template, from the research doc:
   - what the research actually claims,
   - what is a defensible computational analogue,
   - what is merely a creative choice for Akuki.
   Never let the third borrow authority from the first.
4. **Explain in plain words.** Define every term on first use. Unpack the causal chain into steps.
   Write the explanation into `doubts, questions.md` — questions and answers are gathered there.
   Ground it in real `file:line`, not the general idea.
5. **ASK. Stop here.** Present the design and wait.
6. **Implement, then update the backlog and the docs in the same pass.** Not later.

Also required at step 6, because they are easy to break silently:

- **Prompt caching.** borg already implements it (two tiers, static `ttl:"1h"` and dynamic
  `ttl:"5m"`). It matches on an *exact prefix*, so new prompt content goes at the **end**. Verify
  `cache_read_input_tokens` is non-zero across repeated turns.
- **Isolation.** Akuki has no web, file or shell access, because borg defines only 14 memory
  tools. **Any new tool widens that surface** — call it out explicitly and get separate approval.
- **The Cardinal Memory Rule.** Recall is global to the being; disclosure is contextual to the
  audience. `npm run heuristics:guard` fails the build if a recall gate is added. Treat as fixed.

## The research wins

When the plan and the research disagree, the research wins, and say so out loud.

Worked example, and the precedent: an earlier plan made secure-base attachment a core part of the
inhibition gate. Then `akuki_child_psychology_research.md` §16 turned out to say attachment "has
not yet been researched deeply enough here to justify a detailed computational model" and "remains
a research direction rather than a supported implementation recommendation at this stage." The plan
was ahead of the research. The mechanism was cut back to the one piece §16 does license — heavier
memory weighting for interactions with the attachment figure — and the rest was deferred to a
literature review. §15 says the same about moral development.

Being ahead of the research is a defect even when the mechanism would work.

## Division of labour

- **The agent writes the code.** Handing over a snippet to paste spends the user's time on the
  part that teaches nothing.
- **The user runs the commands** where there is something to conclude from the output. State your
  prediction *first*, then let them run it — a confirmed prediction teaches the mechanism, a wrong
  one teaches more.
- If the user must edit code: name the file, name the exact anchor line, give the exact text, say
  above or below. Never "add the import", never "next to the others".

## Where things stand

Milestones live in the backlog. Order and reasoning:

| | |
|---|---|
| **M0** | fork, tenant `akuki`, **instrumentation** — measure before mechanising |
| **M1** | seed → `temperament.yaml` (parameters) + `scaffolding.md` (removable prose, tagged) |
| **M2** | prediction → surprise loop. Weighted highest early; everything downstream consumes it |
| **M3** | inhibition gate (**not** secure base — see above) |
| **M4** | domain-keyed trust + acquisition provenance. Substrate for differentiation-vs-mimicry |
| **M5** | evidence-triggered action space — the release valve for pressure |

**Instrumentation before mechanisms** is deliberate: a capable model behaves sensibly whether or
not the machinery works, so every mechanism needs a measurement that does not depend on reading
Akuki's replies.

**Open design decisions** (parked, low priority, genuinely undecided — do not treat as settled):
which need is the primary pressure source, what the release valve is, whether an evolutionary layer
(many Akukis with varied temperament, selected on development) is in scope, and whether pressure is
fixed or tracks competence. Leanings are recorded in `doubts, questions.md` with confidence levels.
None of them block M0.

## References

- `references/borg-inventory.md` — what borg already provides, verified against source, and the
  four real gaps. **Read before proposing any mechanism.**
- `references/research-grounding.md` — the developmental-psychology map: what each finding claims,
  its computational analogue, and where the research is explicitly not ready.
- `references/vocabulary.md` — every term that needs defining on first use, with the definition to
  use.
- `references/znane-wady.md` — standing instructions already given once, and the recurring
  mistakes they came from. **Read before writing any message the user will send** (Tomek, IT — the
  structure is fixed and must not be restyled) and before stating a cause, a third-party API
  number, or a prediction. Add an entry whenever she says she has told you before.
