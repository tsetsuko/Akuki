# What borg already provides

Verified by reading the source at `/home/zosia/projects/ai/borg` (~890 TS files), not inferred from
the README. **Read this before proposing any mechanism.** Rebuilding what Tomek already built is
the most common way to waste this project's time.

**Re-verified 2026-09-04 against the fork at `/home/zosia/projects/ai/akuki/borg` (branch
`akuki-dev`), after M2, M3 and M4 landed.** Three of the four gaps below are now closed *in the
fork* — closed by Akuki's own milestones, not by upstream borg. Anything marked "built in the fork"
describes what this fork has; upstream still has the gap.

Tomek has given permission to fork *and publish*.

## Against Akuki's eight-layer model

| Layer | Status | Where |
|---|---|---|
| Autobiographical | **built** | Stream, episodes, `borg period`, growth markers, lived-experience day summaries |
| Self model | **built** | `src/memory/self/` — values, traits (**derived**, `borg trait show` is read-only), goals, open questions |
| Values | **built** | values with affirm counts |
| Agency model | **mostly** | `src/memory/procedural/` — Beta posteriors, **context-specific stats**, pending-attempt bridge in Working Memory, outcome classified *after* the turn |
| Relationship model | **partial** | `src/memory/social/`, `src/memory/relational-slots/` — counts, sentiment, evidence-backed facts; not expectation-shaped |
| Regulation | **partial**, plus M3 | commitments + post-generation guards + emission choice. This *is* the external-scaffolding stage. The fork adds an **advisory** inhibition signal: `src/cognition/inhibition/inhibition-signal.ts`, rendered into the dynamic system prompt as the `borg_speech_inhibition` block (`src/cognition/deliberation/finalizer.ts:537`). Advisory, not a gate — the harness computes the number, the model still chooses |
| Source model | **built in the fork (M4)** | was one scalar per person. Now per-`(entity, domain)` Beta posteriors: table `social_trust_domains` (`src/memory/social/migrations.ts:48-67`), `getDomainTrust` / `listDomainTrust` (`src/memory/social/repository.ts:564`). The old `trust` scalar survives on `socialProfileSchema` as a derived projection of the domains |
| World model | **built in the fork (M2)** | append-only expectation ledger in `src/memory/predictions/` (table `prediction_events`, `UNIQUE(prediction_id, kind)` so an expectation cannot be mutated or backdated), per-turn extractor `src/cognition/predictions/prediction-extractor.ts`, surprise → episode significance `src/cognition/predictions/surprise-significance.ts` |

## The single most important thing

**`identity_events`** (`src/memory/identity/`) — a timestamped changelog of every identity-bearing
change: `record_type, record_id, action, old_value_json, new_value_json, reason, provenance_kind,
provenance_episode_ids, ts`. Read via `service.listEvents()`, indexed by time.

That is the developmental record, already built. Instrumentation is mostly *reading* it.

**Identity Governance** routes identity-bearing writes through a guard with record versions and
compare-and-set, so a stale writer cannot silently overwrite self-state. This already enforces
"a single message should rarely rewrite identity."

## Already built, so don't build it

- **`BorgPool`** (`src/borg/pool.ts`) — multi-tenant, one being per `<root>/<tenant>/` with its own
  `config.json`. Dissolves the single-writer problem. Akuki is tenant `akuki`, beside Sol.
- **`scripts/memory-sidecar-main.ts`** — HTTP server over borg. No Python bridge needs writing.
  Still defaults to a kratos base URL and `NODE_EXTRA_CA_CERTS` (`:51`), which is now a leftover:
  this is the **generic** sidecar, not Akuki's runtime, and must never be run as one.
- **`simulator/`** — personas, 14 scenarios, `metrics.ts`, `memory-snapshot.ts`, overseer. This is
  the high-volume sandbox. The Arena yields ~20 msgs/week — far too few for statistical mechanisms.
- **Prompt caching** — `src/cognition/deliberation/finalizer.ts:377-381`, two tiers (static
  `ttl:"1h"`, dynamic `ttl:"5m"`), cached planner prefix, breakpoint counter in
  `request-fingerprint.ts:67`.
- **Twelve dream processes**, each doing one job — borg is *already modular*. Notably:
  - **Ruminator** — consumes open questions; can resolve, bump urgency, abandon stale uncertainty,
    merge duplicates, mark unresolved, emit a growth marker. Writes a private note with live
    tensions and evidence considered so the next visit continues rather than restarts.
  - **Reflector** — finds cross-episode patterns but **does not write belief**; each insight becomes
    a reviewable candidate, "confidence kept conservative so a proposed pattern stays reviewable
    rather than asserted." This is already a threshold mechanism.
- **Open questions have six creation sources**: reflection, **contradiction detection**, review
  hooks, rumination, overseer findings, user input. States are only `open` / `resolved` /
  `abandoned`; urgency, review source and rumination ticks carry the rest.
- **Autonomy** — `triggers` (time/deadline-driven) and `conditions` (state-threshold-driven).
  `open-question-urgency-bump.ts`, `open-question-dormant.ts`, `goal-followup-due.ts`,
  `mood-valence-drop.ts`. Pressure that acts while nobody is watching, already wired.
- **Action menu rendered from live tool definitions** per turn origin — "a description of live
  structure, not aspirational copy," so the being perceives its real capabilities.

## Isolation — satisfied by construction

borg defines exactly **14 tools, all memory tools**: `tool.episodic.{recent,search}`,
`tool.semantic.walk`, `tool.skills.list`, `tool.commitments.list`, `tool.goals.retire`,
`tool.openQuestions.{create,resolve}`, `tool.identityEvents.listForCognition`,
`tool.journal.append`, `tool.promptSurface.changes`, `tool.scheduledWakes.{create,list,cancel}`.

Grepping `src/` for `web_search`, `web_fetch`, `bash_20`, `text_editor_20`, `computer_20` returns
**nothing**. No browsing, no shell, no file read/write.

Connector network access (fetching Arena images, capped at 4 / 10 MB in sol-connector) is the
harness reaching out — **not** a capability Akuki can choose to invoke. Keep that distinction.

## The four real gaps — why a fork is needed

Status re-checked against the fork 2026-09-04. Three are closed; the fourth is unchanged.

1. **No prediction loop at all.** Nothing records an expectation to be violated.
   **CLOSED by M2.** `src/memory/predictions/` holds the append-only ledger; the expectation is
   written before the outcome and the error after it, so the ordering is guaranteed by the schema
   rather than by discipline. `src/autonomy/conditions/prediction-error-spike.ts` turns a large
   error into a wake condition (default OFF).
2. **Trust is one scalar**, not domain-keyed.
   **CLOSED by M4.** Per-`(entity, domain)` Beta posteriors in `social_trust_domains`
   (`src/memory/social/migrations.ts:48-67`). A fresh pair starts at the flat prior Beta(1,1),
   which reads as *no evidence* rather than as a confident 0.5
   (`SOCIAL_TRUST_DOMAIN_PRIOR`, `src/memory/social/types.ts`).
3. **`provenance_kind IN ('episodes','manual','system','offline','online')`** is *pipeline origin*,
   not acquisition mode (`told_by` / `observed_from` / `inferred` / `tested_independently`). It is a
   DB `CHECK` constraint, so changing it means a migration.
   **CLOSED by M4, but sideways:** `provenance_kind` was left alone. M4 added a *separate* column
   instead — `semantic_nodes.acquisition_mode` with exactly those four values, plus
   `acquired_from_entity_id` so the belief joins to that person's per-domain trust rather than to a
   name string (`src/memory/semantic/migrations.ts:110-131`). Two different questions, two columns.
   Still open: the same treatment for procedural skills — TASK-028.
4. **`AUTONOMY_WAKE_SOURCE_NAMES`** (`src/autonomy/types.ts:24`) is a closed union — a new wake
   condition cannot be registered from outside.
   **STILL TRUE.** The fork extended the union from the inside rather than opening it:
   `prediction_error_spike` was added to `AUTONOMY_CONDITION_NAMES` (`src/autonomy/types.ts:15-20`),
   which also required rebuilding the `autonomy_wakes` `CHECK` constraint by migration, because
   SQLite cannot alter a `CHECK` in place. So every new wake condition still costs an edit to borg's
   own types plus a migration.

## Patterns to copy rather than invent

- **Domain-keyed trust is borg's context-specific Beta posterior pointed at a person instead of an
  approach.** "Unknown reliability" is a Beta with almost no evidence — a wide, flat curve. Copy
  `src/memory/procedural/`.
- **A new state-threshold module** should copy the shape of
  `src/autonomy/conditions/mood-valence-drop.ts`.
- **Identity hypotheses with support *and* contradiction** map onto the semantic band's existing
  `supports` / `contradicts` edges plus `contested` state — probably a combination, not a new band.

## Cost levers (five model roles, not four)

`src/config/index.ts:322-326` (defaults; the config paths are at `:1232-1237`): `cognition`,
`background`, `extraction`, `recallExpansion`, `creatorDirective`. Only `cognition` needs to be
excellent.

`OpenAICompatibleLLMClient` (`src/llm/index.ts:436`) plus injectable `llmClient` makes a non-Anthropic
provider reachable in principle. **Out of scope since 2026-09-02:** Akuki runs on Anthropic models
only (`cognition` defaults to `claude-opus-4-8`, `src/config/index.ts:322`), and the Kratos route is
abandoned — `src/akuki/smoke-config.ts:17-19` lists both Kratos hosts as forbidden under
`AKUKI_ANTHROPIC_ONLY=1`. The old tradeoff is recorded because the reasoning still holds if a second
provider is ever proposed: `openai-compatible.ts:105` notes `cache_control` has no OpenAI analogue,
so that path gets no caching, and a cached Anthropic call can beat an uncached free one. Measured
2026-09-01: caching does survive across turns through Tomek's aiproxy (`cache_read_input_tokens`
16578 → 23645 over two turns).

`maintenance.lightProcesses` / `heavyProcesses` gate the twelve dream processes; removing a process
from both disables it. During mechanism development, run only what is being studied.

## Injection points

`BorgOpenOptions` (`src/borg/types.ts:167`): `config`, `env`, `dataDir`, `embeddingDimensions`,
`embeddingClient`, `llmClient`, `clock`, `tracer`, `onStreamAppend`, `outboundConnectors`,
`liveExtraction`, `liveCommitmentExtraction`. The injectable `clock` makes replay experiments
deterministic — valuable for research reproducibility.

## Doctrine to respect

`BOUNDARIES.md` + `CLAUDE.md`: **recall is global to the being; disclosure is contextual to the
audience.** Two `heuristics:guard` passes fail the build if a disclosure-search symbol is called
from a cognition path, or if a model-facing memory row lacks a disclosure label. This is a fixed
constraint, not an obstacle — and it means "earn access to more of your own memory" as a
developmental reward fights the substrate.

## The Arena connector

`/home/zosia/projects/ai/sol-connector` is the template — TypeScript, already drives borg. It
**polls** rather than receiving callbacks (needs `BA_SESSION_COOKIE` for reads, the bot Bearer for
writes), self-skips its own posts, tracks progress with a processed-set plus prunable floor rather
than a timestamp, and recomputes `bot_chain_depth` locally.

Its README records a lesson that applies directly: re-quoting recent messages into the envelope
**caused verbatim self-repetition**, because borg already holds them. Do not hand Akuki a summary
of what he already remembers.
