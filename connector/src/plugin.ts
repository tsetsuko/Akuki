// Demo-server plugin entry. borg's demo server, when EXTRA_CONNECTOR_MODULE points
// here, imports this module and calls createDemoPlugin(). The returned object is the
// generic external-connector shape that server expects:
//   { outboundConnectors, start({ getBorg, log }), stop() }
//
// This is the shape sol-connector already proved: Akuki runs inside the demo
// server's process, so there is ONE open Borg -- one writer on the tenant -- and the
// demo UI becomes the window onto his memory (/chat to talk to him, /mind to see
// what the turn wrote) while every line of platform code stays in this package.
//
// NEVER THROW OUT OF start(). The demo server treats a throw here as fatal and shuts
// borg down, which would take the UI down with it. A connector that cannot reach the
// Arena is a degraded system; a dead demo server is a lost one. So a failure to start
// is logged and the plugin stays inert instead.
//
// outboundConnectors is deliberately EMPTY. Sol registers one because borg
// auto-delivers his replies; Akuki's adapter posts to the Arena itself, after
// persisting the reply, which is what makes exactly-one-post survive a crash. Adding
// an outbound connector here would give the same reply two ways out.

import {
  applyAkukiPredictionEnv,
  applyAkukiSeed,
  buildAkukiClients,
  loadConfig,
  type Borg,
  type EmbeddingClient,
  type LLMClient,
  type MessageConnector,
} from "borg";

import { loadArenaConfig } from "./config.js";
import { startArenaService, type ArenaService } from "./service.js";
import { createTokenUsageLog } from "./token-usage-log.js";

export type AkukiPlugin = {
  outboundConnectors: MessageConnector[];
  /** Puts the M2 prediction parameters in the environment before loadConfig reads it. */
  prepareEnv(): void;
  /** Akuki's model clients, so the host opens HIS Borg rather than a default one. */
  llmClient?: LLMClient;
  embeddingClient?: EmbeddingClient;
  start(ctx: { getBorg: () => Borg; log?: (level: string, message: string) => void }): Promise<void>;
  stop(): Promise<void>;
};

export type CreatePluginOptions = {
  env?: NodeJS.ProcessEnv;
  /** Test seam: replaces the composition root so no test opens a socket. */
  startService?: typeof startArenaService;
  /** Test seam: replaces seeding, which needs a real tenant database. */
  seed?: (borg: Borg) => void;
  /** Test seam: replaces client construction, which needs provider credentials. */
  buildClients?: typeof buildAkukiClients;
  /** Test seam: replaces the prediction-parameter side effect on the environment. */
  prepareEnv?: (env: NodeJS.ProcessEnv) => void;
  /** Test seam: replaces configuration resolution, which reads the tenant directory. */
  resolveConfig?: typeof loadConfig;
};

export function createDemoPlugin(options: CreatePluginOptions = {}): AkukiPlugin {
  const env = options.env ?? process.env;
  const startService = options.startService ?? startArenaService;
  const seed = options.seed ?? applyAkukiSeed;

  const buildClients = options.buildClients ?? buildAkukiClients;
  const prepareEnv = options.prepareEnv ?? applyAkukiPredictionEnv;
  const resolveConfig = options.resolveConfig ?? loadConfig;

  let service: ArenaService | null = null;

  // Built here rather than in start(), because the host needs them for Borg.open and
  // start() runs after that. A failure is captured, NOT thrown: a throw out of
  // createDemoPlugin kills the demo server at boot.
  //
  // And it is not swallowed either. Falling back to the host's default clients would
  // open a Borg on Akuki's tenant that is not Akuki -- his memory with someone else's
  // models -- which is precisely the failure that looks like success. So the clients
  // stay absent AND the connector refuses to start, loudly.
  let clients: { llmClient: LLMClient; embeddingClient?: EmbeddingClient } | null = null;
  let clientError: unknown = null;
  try {
    // Same reason as in service.ts: the sink is wired into each client at
    // construction, so it has to exist before the clients do. In this path the host
    // owns the Borg, but the model calls are still Akuki's and still cost his budget.
    const usageLog = createTokenUsageLog({
      path: env.AKUKI_ARENA_TOKEN_USAGE_LOG?.trim() ?? null,
      log: (level, message) => process.stderr.write(`[akuki-arena] ${level} ${message}\n`),
    });
    clients = buildClients({
      env,
      ...(usageLog.usageSink === undefined ? {} : { usageSink: usageLog.usageSink }),
    });
  } catch (error) {
    clientError = error;
    process.stderr.write(
      `[akuki-arena] error Akuki's model clients could not be built; the host will NOT be ` +
        `running Akuki and the connector will stay inert: ${describe(error)}\n`,
    );
  }

  return {
    outboundConnectors: [],
    ...(clients?.llmClient === undefined ? {} : { llmClient: clients.llmClient }),
    ...(clients?.embeddingClient === undefined
      ? {}
      : { embeddingClient: clients.embeddingClient }),

    prepareEnv(): void {
      try {
        prepareEnv(env);
      } catch (error) {
        // Same rule: the host must survive. Absent prediction parameters mean borg
        // falls back to its own defaults, which is wrong for Akuki but recoverable.
        process.stderr.write(
          `[akuki-arena] error prediction parameters not applied: ${describe(error)}\n`,
        );
      }
    },

    async start(ctx): Promise<void> {
      const log = (level: string, message: string): void => {
        if (ctx.log === undefined) {
          process.stderr.write(`[akuki-arena] ${level} ${message}\n`);
          return;
        }
        ctx.log(level, message);
      };

      if (clientError !== null) {
        log(
          "error",
          "refusing to start: the host's Borg was opened without Akuki's model clients, " +
            "so running the connector would put another entity's models on his tenant",
        );
        return;
      }

      try {
        const borg = ctx.getBorg();
        // The plugin introduces this instance to Akuki's seed, so the plugin seeds
        // it. temperament.yaml and scaffolding.md are the source of truth in git and
        // the database follows them, so editing either needs a restart of the host.
        seed(borg);
        // WHERE WILL IT DIAL. An embedding failure surfaces as EmbeddingError
        // "Connection error." and names no host, which is one line of information
        // short of a diagnosis -- it cost an afternoon once. So the tenant and the
        // embedding endpoint are stated up front, before anything can fail.
        //
        // Resolved here rather than read off the Borg, which exposes no config. Same
        // env and same directory as the host used, so it matches in practice, and it
        // is a log line either way -- hence "as resolved here", not "as running".
        logResolvedTarget(env, resolveConfig, log);

        service = await startService({
          env,
          config: loadArenaConfig(env),
          borrowedBorg: borg,
          log: (level, message) => log(level, message),
        });
        log("info", "connector started inside the host process");
      } catch (error) {
        // Config errors land here too: a missing AKUKI_ARENA_* variable must leave
        // the UI running and say why, not kill the server on boot.
        service = null;
        log(
          "error",
          `connector did not start; the host keeps running without it: ${describe(error)}`,
        );
      }
    },

    async stop(): Promise<void> {
      const running = service;
      service = null;
      if (running === null) {
        return;
      }
      // Stops the poll loop and closes the state database. Does NOT close the Borg
      // or its schedulers -- the host owns both, and service.ts knows this instance
      // is borrowed.
      await running.stop();
    },
  };
}

/**
 * States the tenant directory and the embedding endpoint. The API key is left out
 * deliberately: it is a credential, and a log line is the wrong place for one.
 */
function logResolvedTarget(
  env: NodeJS.ProcessEnv,
  resolveConfig: typeof loadConfig,
  log: (level: string, message: string) => void,
): void {
  try {
    const dataDir = env.BORG_DATA_DIR?.trim();
    const config = resolveConfig(dataDir === undefined || dataDir === "" ? {} : { dataDir });
    log(
      "info",
      `as resolved here: tenant=${config.dataDir} ` +
        `embeddings=${config.embedding.baseUrl} model=${config.embedding.model} ` +
        `dims=${String(config.embedding.dims)}`,
    );
  } catch (error) {
    // Never fatal: this is instrumentation, and losing it must not cost the run.
    log("warn", `could not resolve configuration for the log: ${describe(error)}`);
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}
