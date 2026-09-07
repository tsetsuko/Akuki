// Entry point for the fake Arena. Reads the same AKUKI_ARENA_* variables the
// connector reads, so one environment file drives both halves of a rehearsal and
// the credentials cannot drift apart.
//
// Seeded with the REAL identifiers by default -- the live thread id and the real
// principal ids -- because the rehearsal should exercise the same shapes the live
// run will. On a copy of the tenant that continuity does not have to be protected,
// but it costs nothing and makes the rehearsal representative.
//
// AKUKI_FAKE_ARENA_SEED points at a JSON file to override the whole seed.

import { readFileSync } from "node:fs";

import { createFakeArena } from "./server.js";
import { FakeArenaStore, type FakeArenaSeed } from "./store.js";

const PORT = Number.parseInt(process.env.AKUKI_FAKE_ARENA_PORT ?? "7750", 10);

/** The live Arena's own ids, so a rehearsal thread looks like the real one. */
const LIVE_THREAD_ID = "184888fd-3014-45f4-a1b3-cbbf327e54e0";
const ZOSIA_ID = "c8da0827-092a-4267-b1eb-fc00ad63a7dd";

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    // Same rule as the connector's own config: fail loudly rather than default, so
    // a rehearsal cannot quietly run against credentials nobody chose.
    throw new Error(`Missing required env var: ${name}`);
  }
  return value.trim();
}

const botId = required("AKUKI_ARENA_BOT_ID");
const humanId = process.env.AKUKI_FAKE_ARENA_HUMAN_ID?.trim() ?? ZOSIA_ID;

function defaultSeed(): FakeArenaSeed {
  return {
    threads: [
      {
        id: process.env.AKUKI_FAKE_ARENA_THREAD_ID?.trim() ?? LIVE_THREAD_ID,
        name: "próba generalna",
        participant_bot_ids: [botId],
        is_archived: false,
      },
    ],
    users: [{ id: humanId, name: process.env.AKUKI_FAKE_ARENA_HUMAN_NAME?.trim() ?? "Zosia" }],
    bots: [{ id: botId, name: "Akuki" }],
    // No messages: an empty thread is the honest starting point. Seeding a history
    // would have Akuki's first rehearsal turn answer words nobody said to him.
    messages: [],
  };
}

const seedPath = process.env.AKUKI_FAKE_ARENA_SEED?.trim();
const seed: FakeArenaSeed =
  seedPath === undefined || seedPath === ""
    ? defaultSeed()
    : (JSON.parse(readFileSync(seedPath, "utf8")) as FakeArenaSeed);

const store = new FakeArenaStore(seed);
const server = createFakeArena({
  store,
  credentials: {
    sessionCookie: required("AKUKI_ARENA_SESSION_COOKIE"),
    botToken: required("AKUKI_ARENA_BOT_TOKEN"),
    botId,
  },
  humanId,
  // Reported on the page, not asserted about. This process cannot see which Borg
  // the demo server opened, so it shows what the environment says and labels it as
  // configuration -- and it flags the two variables disagreeing, which would mean
  // the connector and the demo server were driving two different tenants.
  tenant: {
    akukiDataDir: process.env.AKUKI_DATA_DIR?.trim(),
    borgDataDir: process.env.BORG_DATA_DIR?.trim(),
  },
});

// 127.0.0.1, never 0.0.0.0: this thing accepts a bot token and answers reads, and
// it has no business being reachable from the network.
server.listen(PORT, "127.0.0.1", () => {
  process.stderr.write(`[fake-arena] listening on http://127.0.0.1:${PORT}\n`);
  process.stderr.write(`[fake-arena] point AKUKI_ARENA_API_BASE at that address\n`);
  for (const thread of store.listThreads().threads) {
    process.stderr.write(`[fake-arena] thread ${thread.id} (${thread.name})\n`);
  }
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
