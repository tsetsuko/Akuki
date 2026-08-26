# What borg already provides

Verified by reading the source at `/home/zosia/projects/ai/borg` (~890 TS files), not inferred from
the README. **Read this before proposing any mechanism.** Rebuilding what Tomek already built is
the most common way to waste this project's time.

Tomek has given permission to fork *and publish*.

## Against Akuki's eight-layer model

| Layer | Status | Where |
|---|---|---|
| Autobiographical | **built** | Stream, episodes, `borg period`, growth markers, lived-experience day summaries |
| Self model | **built** | `src/memory/self/` — values, traits (**derived**, `borg trait show` is read-only), goals, open questions |
| Values | **built** | values with affirm counts |
| Agency model | **mostly** | `src/memory/procedural/` — Beta posteriors, **context-specific stats**, pending-attempt bridge in Working Memory, outcome classified *after* the turn |
| Relationship model | **partial** | `src/memory/social/`, `src/memory/relational-slots/` — counts, sentiment, evidence-backed facts; not expectation-shaped |
| Regulation | **partial** | commitments + post-generation guards + emission choice. This *is* the external-scaffolding stage |
| Source model | **GAP** | `src/memory/social/types.ts:16` — `trust: z.number().min(0).max(1)`, one scalar per person |
| World model | **GAP** | no predict → observe → error loop anywhere; nothing records an expectation to be violated |

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
  References kratos + `NODE_EXTRA_CA_CERTS`.
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

1. **No prediction loop at all.** Nothing records an expectation to be violated.
2. **Trust is one scalar** (`social/types.ts:16`), not domain-keyed.
3. **`provenance_kind IN ('episodes','manual','system','offline','online')`** is *pipeline origin*,
   not acquisition mode (`told_by` / `observed_from` / `inferred` / `tested_independently`). It is a
   DB `CHECK` constraint, so changing it means a migration.
4. **`AUTONOMY_WAKE_SOURCE_NAMES`** (`src/autonomy/types.ts:3`) is a closed union — a new wake
   condition cannot be registered from outside.

## Patterns to copy rather than invent

- **Domain-keyed trust is borg's context-specific Beta posterior pointed at a person instead of an
  approach.** "Unknown reliability" is a Beta with almost no evidence — a wide, flat curve. Copy
  `src/memory/procedural/`.
- **A new state-threshold module** should copy the shape of
  `src/autonomy/conditions/mood-valence-drop.ts`.
- **Identity hypotheses with support *and* contradiction** map onto the semantic band's existing
  `supports` / `contradicts` edges plus `contested` state — probably a combination, not a new band.

## Cost levers (five model roles, not four)

`src/config/index.ts:1128-1150`: `cognition`, `background`, `extraction`, `recallExpansion`,
`creatorDirective`. Only `cognition` needs to be excellent.

`OpenAICompatibleLLMClient` (`src/llm/index.ts:436`) plus injectable `llmClient` makes P4/kratos
reachable. **Tradeoff:** `openai-compatible.ts:105` notes `cache_control` has no OpenAI analogue, so
that path gets no caching. A cached Anthropic call can beat an uncached free one — measure.

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
