import { describe, expect, it } from "vitest";

import type { Borg } from "borg";

import type { IncomingArenaMessage } from "./contract.js";
import { ArenaAkukiRunner } from "./runner.js";

// The runner is the one place the author's kind can be dropped on its way from
// the Arena to borg. borg skips the rule-setting extractors only when the turn
// says the author is a bot, so a runner that forgets the field would quietly
// restore the old behaviour (TASK-058).

function incoming(overrides: Partial<IncomingArenaMessage> = {}): IncomingArenaMessage {
  return {
    messageId: "m1",
    threadId: "t1",
    threadName: "arena-general",
    authorId: "u-sol",
    authorName: "Sol",
    authorKind: "bot",
    text: "When I close a thread, I always summarise it.",
    createdAtMs: 1_800_000_000_000,
    ...overrides,
  };
}

function fakeBorg() {
  const turns: Record<string, unknown>[] = [];
  const borg = {
    entities: {
      resolve: () => "ent_thread",
      resolveExternal: () => "ent_author",
    },
    sessions: { ensure: () => undefined },
    turn: async (input: Record<string, unknown>) => {
      turns.push(input);
      return {
        emitted: false,
        response: "",
        emission: { kind: "observed" },
        path: "system_1",
        usage: {},
      };
    },
  };
  return { borg: borg as unknown as Borg, turns };
}

function runnerFor(borg: Borg) {
  const sessions = new Map<string, string>();
  return new ArenaAkukiRunner({
    borg,
    state: {
      getSessionId: (threadId) => sessions.get(threadId),
      putSessionId: (threadId, sessionId) => {
        sessions.set(threadId, sessionId);
      },
    },
  });
}

describe("ArenaAkukiRunner", () => {
  it("tells borg who wrote the message, on answered and assessed turns alike", async () => {
    const { borg, turns } = fakeBorg();
    const runner = runnerFor(borg);

    await runner.handleMessage(incoming({ authorKind: "bot" }));
    await runner.assessMessage(incoming({ messageId: "m2", authorKind: "person" }));

    expect(turns.map((turn) => turn.senderKind)).toEqual(["bot", "person"]);
  });
});
