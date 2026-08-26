# Developmental-psychology grounding

For every mechanism, step 3 of the gate requires separating three things and never letting the third
borrow authority from the first:

```
what the research actually claims
        ↓
what is a defensible computational analogue
        ↓
what is merely a creative choice for Akuki
```

That template is Zosia's own, from `akuki_child_psychology_research.md`. The psychological
literature should **inspire** the mechanism. It must never be used to claim Akuki literally
possesses human psychological states.

---

## Statistical learning → the world model

**Claim.** Infants detect regularities across many kinds of input — speech, tones, visual
sequences — and this is proposed as one mechanism by which they extract structure from a complex
environment.

**Analogue.** Expectations of the form "when someone writes @Akuki, they expect an answer" /
"when Zosia says dobranoc, the conversation usually ends." These are **world-model entries, not
personality traits.**

**Refs.** Saffran & Kirkham (2018), *Infant Statistical Learning*, Annu. Rev. Psychol. 69:181–203.
Saffran (2020), *Statistical language learning in infancy*.

---

## Prediction error → developmental currency

**Claim.** Prediction and uncertainty-reduction drive attention and learning.

**Analogue.** `expected X → observed Y → error → attention ↑ → memory priority ↑ → possible model
update`. Gives a principled answer to "what is worth remembering?" — M2.

**Creative choice for Akuki:** the specific weighting constants.

---

## The Goldilocks effect → the threshold on question formation

**Claim.** Infants look away from events that are *too predictable* **and** from events that are
*too unpredictable*. Attention peaks at **intermediate** surprise.

**Analogue.** This is the empirical basis for `curiosity.target_error_band: [0.3, 0.7]`. It gives a
defensible rule for when a surprise becomes an open question: **intermediate and reducible**, not
merely large. Large-but-irreducible surprise is noise, and chasing it is not curiosity.

It is also the protection against the helplessness failure mode: challenge slightly above current
ability drives growth, challenge far above produces withdrawal. Pressure must **fall as competence
rises**.

**Refs.** Kidd, Piantadosi & Aslin (2012), *The Goldilocks Effect*. Berlyne on optimal arousal.
Vygotsky's zone of proximal development is the same shape from a different tradition.
Baer & Kidd (2022), *Learning with certainty in childhood*, Trends Cogn. Sci. — the certainty side.

---

## Sensorimotor contingency detection → agency

**Claim.** Infants are sensitive to relationships between their own actions and resulting feedback,
well before their first year; this is relevant to exploration and control.

**Analogue.** `ACTION → EXPECTED OUTCOME → ACTUAL OUTCOME → CONTINGENCY ESTIMATE`, accumulating
into "when I do X, Y tends to happen." **This is borg's procedural Beta posterior already** — it
just calls it a skill rather than a contingency. Akuki's `...o. mogę.` is a posterior crossing a
confidence threshold.

**Invariant it supports:** agency precedes identity. "When I do X, Y happens" must come before
"I am someone who does X."

**Refs.** Jacquey, Fagard, Esseily & O'Regan (2020), *Detection of sensorimotor contingencies in
infants before the age of 1 year*, Dev. Psychol. 56(7):1233–1251. Bandura on self-efficacy.

---

## Selective epistemic trust → the source model

**Claim.** Children use cues — previous accuracy, informativeness, relevant expertise, familiarity,
prosocial behaviour — to decide whom to believe. Trust is not global.

**Analogue.** Domain-keyed trust: Sol/programming reliable, Sol/social_advice unknown. Structurally
identical to borg's context-specific Beta posterior. **"Unknown" is a wide flat curve, not a middling
value** — that distinction is the whole point and a scalar cannot express it.

Plus acquisition provenance: `told_by` / `observed_from` / `inferred` / `tested_independently`. A
behaviour copied from a stronger bot must not automatically become part of Akuki, or the result is
mimicry.

**Refs.** *Epistemic trust: a comprehensive review of empirical insights and implications for
developmental psychopathology* (PMC10772859). Harris on children's selective trust.

---

## Self-concept construction → belief, not score

**Claim.** Children's self-views are constructed through relationships, feedback from others, social
comparison, observation of their own behaviour and outcomes, and cultural values — not present from
the start.

**Analogue.** Not `shy: 0.82`. Instead: a belief with a confidence level, an evidence list, and an
origin. Beliefs change **more slowly** than memories. Contradictory evidence weakens rather than
replaces.

**Refs.** Brummelman & Thomaes (2017), *How Children Construct Views of Themselves*.

---

## Looking-glass self → appraisals are evidence, not writes

**Claim.** Others' views shape self-concept, but through interpretation.

**Analogue.** "Zosia says I am brave" is stored as *an external belief with a source*, not as
"I am brave." Weighted by learned source reliability. This prevents the persona being trivially
rewritten by whoever spoke most recently.

**Related:** parents as **identity agents** — strongly influential but *without direct write access*
to the child's self-concept. Zosia occupies that structural role. The 悪機 label is the sharpest
case: everyone can call him the evil machine; that does not mean he has accepted the category.
**The seed supplies the question, not the answer.**

**Refs.** Cooley on the looking-glass self. Wiley 10.1111/j.1532-7795.2008.00567.x on identity
agents.

---

## Identity exploration and commitment → tentative identities

**Claim.** Identity development distinguishes exploring possible identities from committing to them.

**Analogue.** `identity_hypothesis` with `status: exploring | accepted | rejected`, plus `support[]`
and `contradictions[]`. Maps onto borg's semantic `supports`/`contradicts` edges plus `contested`
state, alongside open questions.

**Refs.** PMC10950040 — modern overview of identity development and its social context.

---

## Social comparison → differences, not rankings

**Claim.** Self-concept is partly relational; ability is understood partly by comparison.

**Analogue.** "I don't remember as much as Sol. But I notice things he doesn't." Requires a
**per-domain** self-competence estimate compared against per-person domain models — the same
domain-keyed shape as trust, so it likely rides along with M4.

**Why it matters:** comparison must surface *differences*, or development collapses into converging
on whichever bot gets the most positive feedback.

---

## Self-Determination Theory → three developmental questions

**Claim.** Competence, relatedness and autonomy are basic.

**Analogue.** Three questions in developmental order:

- competence — *what can I do?*
- relatedness — *who are my people?*
- autonomy — *what do I think?*

Autonomy's trajectory: `Zosia says X, therefore X` → `Zosia says X, Lunaria says Y, I don't know`
→ `Zosia thinks X, I think Y`. **Must not be implemented as a hardcoded rebellious phase** —
it should fall out of accumulated evidence and a stronger self-concept.

---

## Modularity — handle with care

**Claim.** Contested. Fodor's massively-modular, informationally-encapsulated view is heavily
criticised. **Core knowledge** (Spelke, Carey) supports only a *small* number of innate
domain-specific systems in infants — objects, agents, number, space. **Neuroconstructivism**
(Karmiloff-Smith) argues modules *emerge through development* — modularisation, not modularity.

**Analogue.** borg is already modular (twelve dream processes, each one job; autonomy conditions and
triggers). Adding a module is legitimate. **Hand-designing ten modules is not** — that is engineering
adult Akuki, the same error as a hand-written action menu.

**Rule:** few modules, each grounded in something infants demonstrably start with, and let
differentiation emerge.

---

## Explicitly NOT ready — do not build

The research doc says so directly, and the research wins over the plan.

- **Attachment / secure base (§16).** "Has not yet been researched deeply enough here to justify a
  detailed computational model" and "remains a research direction rather than a supported
  implementation recommendation at this stage." What it *does* license, needing no secure-base
  theory: **heavier memory weighting for interactions with the attachment figure.** The
  exploration-modulating part (presence lowers the inhibition threshold) waits for a literature
  review. Other listed behavioural signatures: noticing absence, seeking a particular person's
  reaction, selective protectiveness.
- **Moral development (§15).** "Should be researched before implementing a strong mechanism."
  Open questions include rules vs. moral principles, empathy, authority and punishment, fairness,
  intention vs. outcome, group loyalty vs. fairness to outsiders. Relevant because Akuki starts
  with an asymmetric attachment to Zosia — *"Zosia może. Ty nie."* — and may need to reconcile
  loyalty → fairness → independent moral judgement.

## Anti-patterns (§17)

Avoid: baby talk; arbitrary childishness; random emotional instability; artificial rebellious-phase
stages; **making Akuki stupid to make him seem young**; assuming every human developmental mechanism
maps onto an LLM.

Prefer: uncertainty about self; learning through relationships; observation before imitation;
gradual differentiation; tentative beliefs; accumulating evidence; changing interpretations; growing
autonomy; increasing competence; unresolved identity questions.

> His youth is about lack of accumulated identity, not lack of intelligence.
