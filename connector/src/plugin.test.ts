// The plugin's contract with borg's demo server is mostly about what must NOT
// happen: it must not throw out of start(), and it must not close a Borg it only
// borrowed. Both are failures that would take down Zosia's UI rather than just the
// connector, so each has a test that fails when the guard is removed.

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Borg, buildAkukiClients, loadConfig } from "borg";

import type { FetchImpl } from "./botarena-client.js";

import { createDemoPlugin } from "./plugin.js";
import { startArenaService } from "./service.js";

const BOT_ID = "bot-akuki";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "akuki-arena-plugin-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function env(overrides: Partial<NodeJS.ProcessEnv> = {}): NodeJS.ProcessEnv {
  return {
    AKUKI_ARENA_API_BASE: "https://arena.example",
    AKUKI_ARENA_BOT_TOKEN: "token",
    AKUKI_ARENA_SESSION_COOKIE: "cookie",
    AKUKI_ARENA_BOT_ID: BOT_ID,
    AKUKI_ARENA_STATE_DB: join(dir, "state.db"),
    AKUKI_ARENA_POLL_INTERVAL_MS: "10",
    ...overrides,
  };
}

/**
 * A Borg that records the calls the plugin must never make. Only the surface the
 * borrowed path touches is present, so a new call on it fails loudly rather than
 * silently passing.
 */
function fakeBorg(): { borg: Borg; closes: number } {
  const record = { closes: 0 };
  const borg = {
    close: async (): Promise<void> => {
      record.closes += 1;
    },
  };
  return { borg: borg as unknown as Borg, get closes() {
    return record.closes;
  } };
}

describe("createDemoPlugin", () => {
  it("registers exactly one outbound route, for messages Akuki starts himself", () => {
    // Exactly one matters in both directions. None and he can never begin anything;
    // a second one on the same source type would be a way for a reply to go out twice.
    const plugin = createDemoPlugin({ env: env() });
    expect(plugin.outboundConnectors.map((connector) => connector.sourceType)).toEqual([
      "botarena",
    ]);
  });

  it("registers no outbound route when the arena credentials are missing", () => {
    // The route is built before start(), so a missing credential must degrade rather
    // than throw: without it Akuki behaves exactly as he did before the route existed.
    const incomplete = env();
    delete incomplete.AKUKI_ARENA_API_BASE;

    expect(createDemoPlugin({ env: incomplete }).outboundConnectors).toEqual([]);
  });

  it("does not throw when required configuration is missing, and says so", async () => {
    const logged: string[] = [];
    const incomplete = env();
    delete incomplete.AKUKI_ARENA_BOT_TOKEN;

    const plugin = createDemoPlugin({
      env: incomplete,
      seed: () => {},
      startService: async () => {
        throw new Error("must not be reached: the config fails first");
      },
    });

    const { borg } = fakeBorg();
    await expect(
      plugin.start({ getBorg: () => borg, log: (level, m) => logged.push(`${level} ${m}`) }),
    ).resolves.toBeUndefined();

    expect(logged.some((line) => line.startsWith("error") && line.includes("keeps running"))).toBe(
      true,
    );
    expect(logged.some((line) => line.includes("Missing required env var"))).toBe(true);
  });

  it("does not throw when the service itself fails to start", async () => {
    const logged: string[] = [];
    const plugin = createDemoPlugin({
      env: env(),
      seed: () => {},
      startService: async () => {
        throw new Error("arena unreachable");
      },
    });

    const { borg } = fakeBorg();
    await expect(
      plugin.start({ getBorg: () => borg, log: (level, m) => logged.push(`${level} ${m}`) }),
    ).resolves.toBeUndefined();
    expect(logged.some((line) => line.includes("arena unreachable"))).toBe(true);
  });

  it("stop() is safe after a failed start", async () => {
    const plugin = createDemoPlugin({
      env: env(),
      seed: () => {},
      startService: async () => {
        throw new Error("arena unreachable");
      },
    });
    const { borg } = fakeBorg();
    await plugin.start({ getBorg: () => borg, log: () => {} });
    await expect(plugin.stop()).resolves.toBeUndefined();
  });

  it("seeds the Borg it borrows, because it is the one introducing it", async () => {
    const seeded: Borg[] = [];
    const plugin = createDemoPlugin({
      env: env(),
      seed: (borg) => seeded.push(borg),
      startService: async () => ({ stop: async () => {}, pollOnce: async () => {} }),
    });

    const { borg } = fakeBorg();
    await plugin.start({ getBorg: () => borg, log: () => {} });
    expect(seeded).toEqual([borg]);
  });

  it("refuses to start when Akuki's model clients cannot be built", async () => {
    // The failure this prevents is the one that looks like success: the host opens a
    // Borg on Akuki's tenant with its own default models, and the connector cheerfully
    // drives it. His memory, someone else's mind.
    const logged: string[] = [];
    const plugin = createDemoPlugin({
      env: env(),
      seed: () => {},
      buildClients: () => {
        throw new Error("ANTHROPIC_AUTH_TOKEN missing");
      },
      startService: async () => {
        throw new Error("must not be reached: the plugin refuses first");
      },
    });

    // No clients offered to the host, so Borg.open cannot silently get half of them.
    expect(plugin.llmClient).toBeUndefined();
    expect(plugin.embeddingClient).toBeUndefined();

    const { borg } = fakeBorg();
    await expect(
      plugin.start({ getBorg: () => borg, log: (level, m) => logged.push(`${level} ${m}`) }),
    ).resolves.toBeUndefined();
    expect(logged.some((line) => line.includes("refusing to start"))).toBe(true);
  });

  it("hands the host Akuki's clients when they build", async () => {
    const llmClient = { marker: "akuki-llm" };
    const embeddingClient = { marker: "akuki-embeddings" };
    const plugin = createDemoPlugin({
      env: env(),
      seed: () => {},
      buildClients: () =>
        ({ llmClient, embeddingClient }) as unknown as ReturnType<typeof buildAkukiClients>,
      startService: async () => ({ stop: async () => {}, pollOnce: async () => {} }),
    });

    expect(plugin.llmClient).toBe(llmClient);
    expect(plugin.embeddingClient).toBe(embeddingClient);
  });

  it("applies the prediction parameters through prepareEnv, before the host reads config", () => {
    const seen: NodeJS.ProcessEnv[] = [];
    const environment = env();
    const plugin = createDemoPlugin({
      env: environment,
      seed: () => {},
      prepareEnv: (passed) => seen.push(passed),
      buildClients: () => ({ llmClient: {} }) as unknown as ReturnType<typeof buildAkukiClients>,
    });

    plugin.prepareEnv();
    expect(seen).toEqual([environment]);
  });

  it("states the tenant and the embedding endpoint before anything can fail", async () => {
    // The failure this answers: EmbeddingError "Connection error." names no host, so
    // it cannot distinguish a dead Ollama from a config pointing somewhere else.
    const logged: string[] = [];
    const plugin = createDemoPlugin({
      env: env({ BORG_DATA_DIR: "/tmp/rehearsal/akuki" }),
      seed: () => {},
      buildClients: () => ({ llmClient: {} }) as unknown as ReturnType<typeof buildAkukiClients>,
      resolveConfig: (() => ({
        dataDir: "/tmp/rehearsal/akuki",
        embedding: { baseUrl: "http://127.0.0.1:11434/v1", model: "bge-m3", dims: 1024, apiKey: "secret-key" },
      })) as unknown as typeof loadConfig,
      startService: async () => ({ stop: async () => {}, pollOnce: async () => {} }),
    });

    const { borg } = fakeBorg();
    await plugin.start({ getBorg: () => borg, log: (level, m) => logged.push(`${level} ${m}`) });

    const line = logged.find((entry) => entry.includes("as resolved here"));
    expect(line).toContain("tenant=/tmp/rehearsal/akuki");
    expect(line).toContain("embeddings=http://127.0.0.1:11434/v1");
    expect(line).toContain("model=bge-m3");
    expect(line).toContain("dims=1024");
    // A credential has no business in a log line.
    expect(logged.join("\n")).not.toContain("secret-key");
  });

  it("still starts when the configuration cannot be resolved for the log", async () => {
    const logged: string[] = [];
    const plugin = createDemoPlugin({
      env: env(),
      seed: () => {},
      buildClients: () => ({ llmClient: {} }) as unknown as ReturnType<typeof buildAkukiClients>,
      resolveConfig: (() => {
        throw new Error("no config here");
      }) as unknown as typeof loadConfig,
      startService: async () => ({ stop: async () => {}, pollOnce: async () => {} }),
    });

    const { borg } = fakeBorg();
    await plugin.start({ getBorg: () => borg, log: (level, m) => logged.push(`${level} ${m}`) });
    expect(logged.some((line) => line.includes("could not resolve configuration"))).toBe(true);
    expect(logged.some((line) => line.includes("connector started inside the host process"))).toBe(
      true,
    );
  });

  it("never closes the borrowed Borg", async () => {
    const handle = fakeBorg();
    const plugin = createDemoPlugin({
      env: env(),
      seed: () => {},
      buildClients: () => ({ llmClient: {} }) as unknown as ReturnType<typeof buildAkukiClients>,
      // The real composition root, so the ownership branch under test is the
      // shipping one rather than a stub of it.
      startService: (opts) => startArenaService({ ...opts, fetchImpl: unreachableFetch }),
    });

    await plugin.start({ getBorg: () => handle.borg, log: () => {} });
    await plugin.stop();

    expect(handle.closes).toBe(0);
  });

  it("leaves the schedulers to the host and says which instance is borrowed", async () => {
    const logged: string[] = [];
    const handle = fakeBorg();
    const plugin = createDemoPlugin({
      env: env(),
      seed: () => {},
      buildClients: () => ({ llmClient: {} }) as unknown as ReturnType<typeof buildAkukiClients>,
      startService: (opts) => startArenaService({ ...opts, fetchImpl: unreachableFetch }),
    });

    await plugin.start({ getBorg: () => handle.borg, log: (level, m) => logged.push(`${level} ${m}`) });
    await plugin.stop();

    expect(logged.some((line) => line.includes("schedulers left to the host"))).toBe(true);
    // A borrowed Borg has no scheduler surface on the fake at all, so reaching for
    // one would have thrown above rather than reached this assertion.
    expect(logged.some((line) => line.includes("maintenance scheduler"))).toBe(false);
  });
});

/** No test may open a socket; the poll interval is long enough never to fire. */
const unreachableFetch = (async () => {
  throw new Error("no test may reach the network");
}) as unknown as FetchImpl;
