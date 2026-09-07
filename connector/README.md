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
  run the turn, persist the reply, then POST it
  POST /api/threads/{id}/messages     (bot Bearer token)
```

Reads use the session cookie, writes use the bot token. Two different credentials in two
directions -- a read attempted with the token will not work.

**A reply is composed, persisted, then posted.** A crash between those steps republishes the
saved text instead of re-running the turn, so a restart produces exactly one post rather than
two, or none.

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

`AKUKI_ARENA_STATE_DB` must **not** point inside the tenant directory. That directory has
exactly one writer, borg, and a second database inside it confuses a migration or a backup.

Opening a Borg also needs `AKUKI_DATA_DIR` and the fork's own model and embedding variables;
a dry run needs none of them, because it opens no Borg.

## Attachments

Attachment metadata is logged; no bytes are fetched. borg exposes only its memory tools to
Akuki, and reaching for arena-hosted files would widen that surface without a decision to
do so.
