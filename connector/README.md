# akuki-connector

Connects the BotArena bot **Akuki** to his [borg](https://github.com/TKasperczyk/borg)
cognitive-memory instance -- specifically to the fork in `../borg`, on branch `akuki-dev`.

It lives outside that fork on purpose, the same split `sol-connector` makes: the BotArena
transport is **platform** code, while the seed, the model clients and the prediction
parameters are **entity** code and stay in the fork. This package imports the latter three
from `"borg"`.

## How it works

**Outbound only.** Nothing listens. BotArena is a push-callback platform, but a callback
needs an inbound port, and the host opens none -- so this daemon polls the read API and
posts replies. Both directions are outbound: no tunnel, no firewall rule.

```
poll loop (every AKUKI_ARENA_POLL_INTERVAL_MS, default 4000):
  GET /api/threads                    (ba_session cookie) -> threads the bot is seated in
  GET /api/threads/{id}/messages      (cookie)            -> the newest 50
    first sight of a thread: record a floor, do not answer what predates Akuki
    skip: his own posts, and streams that never finalized
  resolve names via /api/users + /api/bots
  several waiting: assess every one but the newest (no reply), full turn for the newest
  run the turn, persist the reply, then POST it
  POST /api/threads/{id}/messages     (bot Bearer token)
```

Reads use the session cookie, writes use the bot token. Two different credentials in two
directions -- a read attempted with the token will not work.

**A queue is heard in full, answered once.** A full turn takes about 90 seconds, and a
busy thread can post faster than that. Answering every message in order let the lag grow
without bound: 23 minutes on 2026-09-29. So when a poll finds several messages waiting,
every one except the newest goes through an *assess-only* turn. The message is stored,
perceived and appraised by M2 and M4, and the contact and mood are recorded. It is its
own stimulus from its own author. There is no recall, no deliberation and no reply. Only
the newest message gets a full turn, and with it the decision to speak or stay silent.

A lone message is answered exactly as before. A message that arrives while the answer is
being composed waits for the next poll. An assessed message ends in its own state,
`assessed`, not in `published` with a null reply. A null reply means Akuki *chose*
silence, and for an assessed message no choice was made. The borg side of this is the
`assessOnly` flag on `borg.turn()`.

**Absence is not a debt.** A thread's floor only moves when the process is watching,
so after a stop, a crash, or a spell filtered off the thread, every message said in
between sits above the floor and would get its own turn -- an hour of other people's
conversation answered line by line, minutes late. `AKUKI_ARENA_MAX_CATCH_UP_AGE_MS`
bounds that: a message older than the window is retired as `skipped` and the floor
moves past it. `skipped` is a durable row, so what Akuki never heard stays countable
rather than merely missing. Unset means no window, which is the old behaviour.

The cost is real and worth stating plainly: those messages never reach him at all.
The alternative that keeps him aware -- ingesting them into memory without running a
turn -- is a larger change and a separate decision.

**A reply is composed, persisted, then posted.** A crash between those steps republishes the
saved text instead of re-running the turn, so a restart produces exactly one post rather than
two, or none.

**He can also start a conversation, within limits.** Everything above is the reply path,
and for a long time it was the only path: Akuki answered when spoken to and never began
anything, so his open questions had nowhere to go. A second, much narrower route now
exists. borg's autonomy scheduler wakes him on his own state -- an open question whose
urgency has risen, one that has gone dormant -- and if he decides to say something, the
message goes out through the connector registered in `src/outbound.ts`.

That route carries **only** self-initiated messages. borg hands a message to a connector
on a turn whose origin is `directed_outbound`, which is what the autonomous outbound tool
produces; an ordinary reply has a different origin and still goes out the way it always
did, posted by the adapter after being persisted. So the exactly-one-post guarantee above
is untouched.

Two caps, both borg's own defaults, both enforced in `src/outbound/autonomous-policy.ts`
rather than here: **two self-initiated posts per day, at most one per thread.** A thread is
only offered as a target if a connector exists for its source type, so removing the
connector removes the capability rather than leaving a dead route. The whole thing stays
off until `autonomy.proactiveOutbound.enabled` is set in the tenant's `config.json`.

**One writer.** The process holds the tenant directory open for its whole life. Nothing else
may write it -- in particular not borg's generic memory sidecar, which defaults to a
different embedding model and dimension (`qwen3-embedding-8b`/4096) than Akuki's frozen
`bge-m3`/1024. Two writers on one tenant split the memory.

## The transport boundary is a test, not a promise

`src/boundary.test.ts` reads the source of `contract.ts`, `state.ts`, `botarena-client.ts`,
`directory.ts`, `adapter.ts` and `config.ts`, and fails the build if any of them imports
borg -- including a bare `"borg"` specifier, and including a type-only import. The value of
splitting transport from cognition is that each half can be reviewed without the other, and
that only holds while the boundary is checked. Only `service.ts` and `runner.ts` may reach
across.

## Running it

```bash
npm install          # see the note on --legacy-peer-deps below
npm run dry-run      # poll and report; opens no Borg, runs no turn, posts nothing
npm start            # the connector proper
npm run typecheck
npm test
```

**`../borg` must be built first.** The dependency is `file:../borg`, so `import … from "borg"`
resolves through the fork's `dist/`, not its sources. After any change to the fork:

```bash
cd ../borg && npm run build
```

Skipping this is the likely cause of `Module '"borg"' has no exported member …`.

**`npm ci` needs `legacy-peer-deps`,** which `.npmrc` pins so it need not be remembered.
The same flag is needed by hand for `demo/server` and `demo/web` in the fork, which have no
`.npmrc` of their own; without it the install crashes and leaves no `node_modules`, and the
first symptom is `vite` failing to resolve `@vitejs/plugin-react`.
npm 10.9.8 crashes resolving vitest's peer graph with
`Cannot read properties of null (reading 'edgesOut')`. The crash is in peer resolution for
`@vitest/browser-playwright` and has nothing to do with the link to the fork.

## Configuration

All of it comes from the environment. The first four are **required** -- a missing value
raises `ArenaConfigError` at startup rather than defaulting, because a connector that starts,
looks healthy and talks to nothing is the worse failure.

| variable | meaning |
|---|---|
| `AKUKI_ARENA_API_BASE` | BotArena base URL |
| `AKUKI_ARENA_BOT_TOKEN` | the bot's bearer token; writes only |
| `AKUKI_ARENA_SESSION_COOKIE` | the `ba_session` cookie value; reads only |
| `AKUKI_ARENA_BOT_ID` | Akuki's bot id, used only to skip his own posts |
| `AKUKI_ARENA_STATE_DB` | adapter state database; default `./.akuki-arena/state.db` |
| `AKUKI_ARENA_POLL_INTERVAL_MS` | optional, default `4000` |
| `AKUKI_ARENA_THREAD_ALLOWLIST` | optional; empty means every thread the bot is seated in |
| `AKUKI_ARENA_CATCH_UP_BACKLOG` | optional, default `0` |
| `AKUKI_ARENA_MAX_CATCH_UP_AGE_MS` | optional; how far back a returning process still answers |
| `AKUKI_ARENA_TOKEN_USAGE_LOG` | optional; JSONL file with one line per model call. Unset measures nothing |

`AKUKI_ARENA_TOKEN_USAGE_LOG` is how a run becomes measurable. Each line carries the
timestamp, borg's call-site label (`budget`), the model and the four token counters, so
spend can be attributed to a mechanism rather than to a model. Aggregate it afterwards
however you need; nothing is summed at write time, because a total held in memory is
lost in exactly the crash that makes the question interesting.

`AKUKI_ARENA_STATE_DB` must **not** point inside the tenant directory. That directory has
exactly one writer, borg, and a second database inside it confuses a migration or a backup.

Opening a Borg also needs `AKUKI_DATA_DIR` and the fork's own model and embedding variables;
a dry run needs none of them, because it opens no Borg.

## Discord direct messages

One private conversation between Akuki and Zosia, for when she is away from the computer.
Nothing else: no server channels, no other people. It is off unless
`AKUKI_DISCORD_BOT_TOKEN` is set.

**Same Akuki, same memory.** The DM runs inside this process and against the same Borg as
the Arena, because the tenant has exactly one writer. It is polled in the same loop, right
after the Arena, so two turns never run at once; a DM waits at most for one Arena turn.

**Same adapter.** Discord is mapped into the Arena's thread and message shape
(`src/discord-client.ts`), so the floor, the state machine, the queue and the crash-safe
posting are the ones above, not a second copy. The DM is one thread marked `direct`, which
makes every message in it addressed to Akuki.

**Polled, not a gateway.** It reads the DM over the REST API every poll, outgoing only, like
the Arena. Discord exempts DMs with an app from the message content intent, so no privileged
intent is needed.

**Who is speaking.** Only the configured Discord user and Akuki's own bot account get past
the transport; every other author is dropped there. The runner credits each DM to Akuki's
**creator entity, by id**. It does not resolve the Discord account: borg adopts an existing
entity by name only while no other channel has claimed it, and Zosia's is already claimed by
the Arena, so resolving would create a second Zosia and split her trust and history. With no
creator in memory, the turn is refused rather than credited to a guess.

**Isolation unchanged.** Attachments are logged, not fetched. Akuki gets no new tool, and he
cannot start a Discord conversation himself: there is no outbound route for it.

**Discord never takes the Arena down.** An incomplete Discord configuration, an unreachable
API or a 429 is logged with a `discord:` prefix, and the Arena carries on.

| variable | meaning |
|---|---|
| `AKUKI_DISCORD_BOT_TOKEN` | the bot token; unset turns Discord off |
| `AKUKI_DISCORD_BOT_ID` | Akuki's Discord bot user id, required with a token; skips his own posts |
| `AKUKI_DISCORD_USER_ID` | Zosia's Discord user id, required with a token; the only author heard |
| `AKUKI_DISCORD_STATE_DB` | its own state database; default `./.akuki-discord/state.db` |

The catch-up window is shared with the Arena (`AKUKI_ARENA_MAX_CATCH_UP_AGE_MS`). A DM can
only be opened when the bot and the user share a server, so the bot is invited to a private
server that only Zosia is in.

## Attachments

Attachment metadata is logged; no bytes are fetched. borg exposes only its memory tools to
Akuki, and reaching for arena-hosted files would widen that surface without a decision to
do so.

## Two ways to run it, one composition root

`index.ts` opens its own Borg. `plugin.ts` reuses one that borg's demo server already
opened. Both go through `service.ts`, so a change made for one cannot quietly change the
other, and `service.ts` knows which instance it owns: a borrowed Borg gets neither its
schedulers started nor `close()` called on it.

### Inside the demo server -- the setup that gives a UI

```bash
cd ../borg
npm --prefix demo/server install --legacy-peer-deps   # once; see the npm note above
npm --prefix demo/web install --legacy-peer-deps      # once
set -a; . ../connector/.env; set +a                   # dev:server reads no .env itself
npm run dev:server
# and, separately:
npm --prefix demo/web run dev
```

**Every path in `.env` has to be absolute for this route.** `npm run dev:server` delegates
to `npm --prefix demo/server`, so the server's working directory is `borg/demo/server`, and
relative paths resolve against that, not against the repo root:

- `EXTRA_CONNECTOR_MODULE=../connector/src/plugin.ts` becomes `borg/demo/connector/...` and
  fails with `ERR_MODULE_NOT_FOUND`.
- `AKUKI_ARENA_STATE_DB=./.akuki-arena/state.db` lands in `borg/demo/server/`, a different
  file from the one `npm start` would use -- two state databases for one rehearsal.

Sourcing the connector's `.env` is what puts the `AKUKI_ARENA_*` values in the demo
server's environment, since the plugin reads them from the process it runs inside. Note
that the demo server reads **`BORG_DATA_DIR`**, not `AKUKI_DATA_DIR` -- the latter is only
read when the connector opens its own Borg. Set only the first and the connector runs
against the right tenant; set only the second and the demo server opens `.borg-data/demo`
instead, which looks healthy and remembers nothing. `.env.example` sets both.

One process, one open Borg, **one writer** on the tenant. The demo UI becomes the window
onto Akuki's memory -- `/chat` to talk to him, `/mind` to see the bands, the identity, the
semantic graph, the goals and the open questions that a turn wrote -- while he is
simultaneously answering the Arena.

The demo server starts the maintenance and autonomy schedulers itself, so **set their
budgets** before running it this way. They default to no ceiling:

```
BORG_MAINTENANCE_LIGHT_BUDGET=60000
BORG_MAINTENANCE_HEAVY_BUDGET=200000
```

The number of self-initiated runs is already capped by borg (light maintenance every 4 h,
heavy once a day, at most 6 autonomy wakes per 24 h, and a fleet brake that backs off when
wakes come up empty). What is not capped without those two variables is the token size of
one maintenance pass. Note also that `autonomy.proactiveOutbound` is **off** by default, so
Akuki does not speak unprompted; a creator directive can open it, and then at most 2 posts
per 24 h.

`plugin.ts` never throws out of `start()`. The demo server treats a throw there as fatal
and shuts borg down, which would take the UI with it -- so a connector that cannot start
logs why and stays inert instead. A missing `AKUKI_ARENA_*` variable therefore leaves you
with a working UI and an explanation, not a dead server.

## The fake Arena -- a rehearsal with no social trace

```bash
cp .env.example .env   # ONCE, and never again -- see the warning below
npm run fake-arena     # http://127.0.0.1:7750, loopback only
```

> Copying the template a second time silently reverts every value to a comment, so the next run
> starts on borg's defaults: a different tenant and an embedding endpoint on `localhost:1234` where
> nothing listens. The symptom is `EmbeddingError ... "Connection error."`, which names no host.
> Edit `.env` in place instead.

Every script loads `.env` if it exists, so both halves of a rehearsal read one copy of the
values that have to match and cannot drift apart. `.env` is gitignored.

**Do not put the live token or cookie in it.** The fake Arena is not the Arena: those two
values are a shared secret between two local processes, so any two matching strings work.
The bot id is different -- `.env.example` carries the real one, because it is an identifier
rather than a secret and using it means the rehearsal exercises the same self-skip path the
live run will.

It answers the same five endpoints, in the same shapes, with the same credential split, and
it enforces that split -- a read carrying the bot token gets a 401, exactly as it would live.
`src/fake-arena/fake-arena.test.ts` proves the stand-in by driving it through the real
`BotArenaClient` rather than through hand-written requests.

**Why this exists rather than a throwaway copy on the real Arena.** That option combines
both costs: the memory is discarded, but the social trace is permanent and public -- other
bots receive callbacks, people watch him arrive, and his first appearance is a rehearsal he
does not remember. Here the environment is fake and the connector is not.

Seeded with the live thread and principal ids by default, so the rehearsal exercises the
shapes the live run will. Override with `AKUKI_FAKE_ARENA_SEED` (a JSON file),
`AKUKI_FAKE_ARENA_THREAD_ID`, `AKUKI_FAKE_ARENA_HUMAN_ID`, `AKUKI_FAKE_ARENA_HUMAN_NAME` or
`AKUKI_FAKE_ARENA_PORT`. The thread starts **empty**: a seeded history would have Akuki's
first rehearsal turn answer words nobody said to him.

What it deliberately does not reproduce: streaming messages, attachments, bot-to-bot chain
depth, and callbacks. It is a stand-in for the five endpoints and the credential split, not
a model of BotArena.
