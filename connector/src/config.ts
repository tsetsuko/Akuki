// Adapter configuration, read from the environment.
//
// Every name carries the AKUKI_ARENA_ prefix so transport settings can never be
// confused with borg's own BORG_* configuration or with the AKUKI_* model and
// tenant variables. Mixing those up is how a deployment ends up pointing the
// wrong process at the wrong data directory.
//
// This file validates SHAPE only -- present, non-empty, positive -- and throws on
// a missing required value rather than defaulting. A silent default here would
// mean a connector that starts, looks healthy, and talks to nothing.

/** Deliberately not exported as a borg ConfigError: the transport owns its own failures. */
export class ArenaConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArenaConfigError";
  }
}

export type ArenaConfig = {
  apiBase: string;
  botToken: string;
  sessionCookie: string;
  botId: string;
  stateDbPath: string;
  pollIntervalMs: number;
  threadAllowlist: ReadonlySet<string>;
  catchUpBacklog: boolean;
  /** Null means no window: a message is answered however long it waited. */
  maxCatchUpAgeMs: number | null;
  /** JSONL file for per-call token telemetry. Null turns measurement off. */
  tokenUsageLogPath: string | null;
};

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name];
  if (value === undefined || value.trim() === "") {
    throw new ArenaConfigError(`Missing required env var: ${name}`);
  }
  return value.trim();
}

function optional(env: NodeJS.ProcessEnv, name: string, fallback: string): string {
  const value = env[name];
  return value === undefined || value.trim() === "" ? fallback : value.trim();
}

function optionalPositiveInt(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const raw = env[name];
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ArenaConfigError(`Env var ${name} must be a positive integer, got: ${raw}`);
  }
  return parsed;
}

/** Null when unset, so a caller can tell "no window" from "a window of zero". */
function optionalPositiveIntOrNull(env: NodeJS.ProcessEnv, name: string): number | null {
  const raw = env[name];
  if (raw === undefined || raw.trim() === "") {
    return null;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ArenaConfigError(`Env var ${name} must be a positive integer, got: ${raw}`);
  }
  return parsed;
}

/** Null when unset, so an absent path is distinguishable from a blank one. */
function optionalOrNull(env: NodeJS.ProcessEnv, name: string): string | null {
  const value = env[name];
  return value === undefined || value.trim() === "" ? null : value.trim();
}

function optionalBool(env: NodeJS.ProcessEnv, name: string, fallback: boolean): boolean {
  const raw = env[name];
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export function loadArenaConfig(env: NodeJS.ProcessEnv = process.env): ArenaConfig {
  const allowlist = optional(env, "AKUKI_ARENA_THREAD_ALLOWLIST", "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "");

  return {
    apiBase: required(env, "AKUKI_ARENA_API_BASE"),
    botToken: required(env, "AKUKI_ARENA_BOT_TOKEN"),
    sessionCookie: required(env, "AKUKI_ARENA_SESSION_COOKIE"),
    botId: required(env, "AKUKI_ARENA_BOT_ID"),
    // Never inside the tenant directory: that directory has exactly one writer,
    // borg, and dropping a second database in it invites confusion during a
    // migration or a backup.
    stateDbPath: optional(env, "AKUKI_ARENA_STATE_DB", "./.akuki-arena/state.db"),
    pollIntervalMs: optionalPositiveInt(env, "AKUKI_ARENA_POLL_INTERVAL_MS", 4_000),
    threadAllowlist: new Set(allowlist),
    // Defaults to false: on a first connection, replaying the thread's history
    // would have Akuki answer conversations that happened before he existed.
    catchUpBacklog: optionalBool(env, "AKUKI_ARENA_CATCH_UP_BACKLOG", false),
    // How far back a returning process still answers. Unset keeps the old
    // behaviour, where an absence of any length is repaid message by message.
    maxCatchUpAgeMs: optionalPositiveIntOrNull(env, "AKUKI_ARENA_MAX_CATCH_UP_AGE_MS"),
    // No default path. A connector that starts quietly appending to a file nobody
    // asked for is a surprise; a connector that measures nothing must say so, and
    // createTokenUsageLog logs a warning when this is null.
    tokenUsageLogPath: optionalOrNull(env, "AKUKI_ARENA_TOKEN_USAGE_LOG"),
  };
}

/**
 * Discord direct messages: one private conversation between Akuki and Zosia.
 * Optional as a whole -- with no bot token, Discord is simply off and the Arena
 * runs exactly as before. Once a token is given, the rest is required, because a
 * half-configured channel is the connector that starts and talks to nothing.
 */
export type DiscordConfig = {
  botToken: string;
  /** Akuki's own Discord bot user id, for the self-skip. */
  botId: string;
  /** The one Discord user he hears. Every other author is dropped. */
  userId: string;
  /** Its own file: Discord ids and Arena ids live in separate state. */
  stateDbPath: string;
};

export function loadDiscordConfig(env: NodeJS.ProcessEnv = process.env): DiscordConfig | null {
  const botToken = optionalOrNull(env, "AKUKI_DISCORD_BOT_TOKEN");
  if (botToken === null) {
    return null;
  }
  return {
    botToken,
    botId: required(env, "AKUKI_DISCORD_BOT_ID"),
    userId: required(env, "AKUKI_DISCORD_USER_ID"),
    stateDbPath: optional(env, "AKUKI_DISCORD_STATE_DB", "./.akuki-discord/state.db"),
  };
}
