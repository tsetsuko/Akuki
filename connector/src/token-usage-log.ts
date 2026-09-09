// Token telemetry for the live Arena path.
//
// WHY THIS EXISTS. borg reports every model call through a TokenUsageSink, and the
// fork already has a collector for it, but the connector never passed one -- so the
// one path Akuki actually walks on the Arena spent tokens without measuring any of
// them. TASK-013 names "no telemetry" as a condition for aborting the experiment,
// and its AC #2 (usage per role) and AC #6 (canary measured the turn, maintenance
// and cache) cannot be met without this.
//
// WHY A FILE, NOT AN IN-MEMORY TOTAL. Totals held in memory are lost exactly when
// the answer matters: a crash, an OOM, a kill -9 mid-turn. One line per call, flushed
// as it happens, survives all three and can be re-aggregated any number of ways
// afterwards. Aggregation is deliberately NOT done here.
//
// The write is synchronous. A model call takes seconds; appending a ~150-byte line
// takes microseconds, and buffering it would reintroduce the loss this file exists
// to avoid.

import { appendFileSync } from "node:fs";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";

import type { TokenUsageEvent, TokenUsageSink } from "borg";

export type TokenUsageLog = {
  /** Pass to buildAkukiClients; undefined when telemetry is off. */
  usageSink: TokenUsageSink | undefined;
  /** The file being written, or null when telemetry is off. */
  path: string | null;
};

export type TokenUsageLogLine = {
  /** ISO-8601, so a line is readable without joining it to anything. */
  ts: string;
  /** Call-site label from borg (e.g. "reflection", "offline-reflector"). */
  budget: string;
  /** Provider-returned model id when available, else the requested one. */
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
};

export function tokenUsageLogLine(event: TokenUsageEvent, now: Date): TokenUsageLogLine {
  return {
    ts: now.toISOString(),
    budget: event.budget,
    model: event.model,
    input_tokens: event.input_tokens,
    output_tokens: event.output_tokens,
    cache_read_input_tokens: event.cache_read_input_tokens ?? 0,
    cache_creation_input_tokens: event.cache_creation_input_tokens ?? 0,
  };
}

export type CreateTokenUsageLogOptions = {
  /** Absolute path to the JSONL file. Null or empty turns telemetry off. */
  path: string | null;
  /** Reported once at startup and once on the first write failure. */
  log: (level: "info" | "warn" | "error", message: string) => void;
  /** Test seams. */
  appendFile?: (path: string, contents: string) => void;
  ensureDir?: (path: string) => void;
  now?: () => Date;
};

export function createTokenUsageLog(options: CreateTokenUsageLogOptions): TokenUsageLog {
  const path = options.path === null || options.path.trim() === "" ? null : options.path.trim();

  if (path === null) {
    // Said out loud rather than defaulted to a path of our choosing: a connector
    // that quietly writes an unbounded file somewhere is its own surprise, and a
    // connector that measures nothing must be visible as such in the log.
    options.log(
      "warn",
      "token usage NOT measured: AKUKI_ARENA_TOKEN_USAGE_LOG is unset, so this run spends " +
        "tokens without telemetry",
    );
    return { usageSink: undefined, path: null };
  }

  const appendFile = options.appendFile ?? ((target, contents) => appendFileSync(target, contents));
  const ensureDir = options.ensureDir ?? ((target) => mkdirSync(target, { recursive: true }));
  const now = options.now ?? (() => new Date());
  let disabled = false;

  ensureDir(dirname(path));
  options.log("info", `token usage log: ${path}`);

  return {
    path,
    usageSink: (event: TokenUsageEvent) => {
      if (disabled) {
        return;
      }

      try {
        appendFile(path, `${JSON.stringify(tokenUsageLogLine(event, now()))}\n`);
      } catch (error) {
        // A failing telemetry file must never take a turn down with it, but it also
        // must not fail silently on every call: report once, then stay quiet.
        disabled = true;
        options.log(
          "error",
          `token usage log disabled after a write failure: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    },
  };
}
