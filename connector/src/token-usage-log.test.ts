import { describe, expect, it } from "vitest";

import { createTokenUsageLog } from "./token-usage-log.js";

type Logged = { level: string; message: string };

function harness(path: string | null, appendFile?: (target: string, contents: string) => void) {
  const logs: Logged[] = [];
  const dirs: string[] = [];
  const written: Array<{ path: string; contents: string }> = [];
  const usageLog = createTokenUsageLog({
    path,
    log: (level, message) => logs.push({ level, message }),
    ensureDir: (target) => dirs.push(target),
    appendFile:
      appendFile ?? ((target, contents) => written.push({ path: target, contents })),
    now: () => new Date("2026-09-09T10:00:00.000Z"),
  });

  return { usageLog, logs, dirs, written };
}

const event = {
  budget: "reflection",
  model: "claude-opus-4-8",
  input_tokens: 120,
  output_tokens: 30,
  cache_read_input_tokens: 900,
};

describe("connector token usage log", () => {
  it("writes one JSON line per model call, with the cache counters filled in", () => {
    const { usageLog, written, dirs } = harness("/var/log/akuki/usage.jsonl");

    void usageLog.usageSink?.(event);

    expect(dirs).toEqual(["/var/log/akuki"]);
    expect(written).toHaveLength(1);
    expect(written[0]?.path).toBe("/var/log/akuki/usage.jsonl");
    expect(written[0]?.contents.endsWith("\n")).toBe(true);
    expect(JSON.parse(written[0]!.contents)).toEqual({
      ts: "2026-09-09T10:00:00.000Z",
      budget: "reflection",
      model: "claude-opus-4-8",
      input_tokens: 120,
      output_tokens: 30,
      cache_read_input_tokens: 900,
      // Absent in the event, zero in the line: a missing counter must not read as
      // an unknown, or the totals stop adding up.
      cache_creation_input_tokens: 0,
    });
  });

  it("says out loud that a run without a path measures nothing", () => {
    const { usageLog, logs, written } = harness(null);

    expect(usageLog.usageSink).toBeUndefined();
    expect(usageLog.path).toBeNull();
    expect(written).toEqual([]);
    expect(logs.some((entry) => entry.level === "warn" && entry.message.includes("NOT measured"))).toBe(
      true,
    );
  });

  it("survives a failing file, reports once, and never throws into a turn", () => {
    let attempts = 0;
    const { usageLog, logs } = harness("/mnt/gone/usage.jsonl", () => {
      attempts += 1;
      throw new Error("ENOSPC: no space left on device");
    });

    expect(() => usageLog.usageSink?.(event)).not.toThrow();
    expect(() => usageLog.usageSink?.(event)).not.toThrow();

    // One attempt, one error line: a broken disk must not shout on every call.
    expect(attempts).toBe(1);
    expect(logs.filter((entry) => entry.level === "error")).toHaveLength(1);
  });
});
