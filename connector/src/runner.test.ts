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
    addressedToAkuki: true,
    ...overrides,
  };
}

function fakeBorg(creator: { id: string } | null = { id: "ent_creator" }) {
  const turns: Record<string, unknown>[] = [];
  const ensured: Record<string, unknown>[] = [];
  const appended: { input: Record<string, unknown>; options: Record<string, unknown> }[] = [];
  const borg = {
    stream: {
      append: async (input: Record<string, unknown>, options: Record<string, unknown>) => {
        appended.push({ input, options });
        return { id: "strm_1" };
      },
    },
    entities: {
      resolve: () => "ent_thread",
      resolveExternal: () => "ent_author",
      getCreator: () => creator,
    },
    sessions: {
      ensure: (input: Record<string, unknown>) => {
        ensured.push(input);
      },
    },
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
  return { borg: borg as unknown as Borg, turns, appended, ensured };
}

function runnerFor(borg: Borg, conversation?: "arena" | "discord_dm") {
  const sessions = new Map<string, string>();
  return new ArenaAkukiRunner({
    borg,
    ...(conversation === undefined ? {} : { conversation }),
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

  it("tells borg whether the message was addressed to him (TASK-061)", async () => {
    const { borg, turns } = fakeBorg();
    const runner = runnerFor(borg);

    await runner.handleMessage(incoming({ addressedToAkuki: true }));
    await runner.handleMessage(incoming({ messageId: "m2", addressedToAkuki: false }));
    await runner.assessMessage(incoming({ messageId: "m3", addressedToAkuki: false }));

    expect(turns.map((turn) => turn.directlyAddressed)).toEqual([true, false, false]);
  });

  it("stores a message addressed elsewhere in his conversation without any turn (TASK-060)", async () => {
    const { borg, turns, appended } = fakeBorg();
    const runner = runnerFor(borg);

    await runner.handleMessage(incoming({ messageId: "m0", authorKind: "person" }));
    await runner.recordMessage(incoming({ messageId: "m1", text: "@Lunaria a ty?" }));

    // No turn means no perception, no appraisal, no model call at all.
    expect(turns).toHaveLength(1);
    expect(appended).toHaveLength(1);
    expect(appended[0]?.input).toEqual({
      kind: "user_msg",
      content: "@Lunaria a ty?",
      audience: "botarena_thread:t1",
      sender_entity_id: "ent_author",
    });
    // The same conversation the answered turn used.
    expect(appended[0]?.options).toEqual({ session: turns[0]?.sessionId });
  });
});

describe("ArenaAkukiRunner in a Discord DM", () => {
  it("credits the message to the creator by id, as audience and sender, in a dm session", async () => {
    const { borg, turns, ensured } = fakeBorg();
    const runner = runnerFor(borg, "discord_dm");

    await runner.handleMessage(incoming({ threadId: "dm-1", authorId: "discord-zosia", authorKind: "person" }));

    // The id, never the Discord account: resolving that would mint a second Zosia.
    expect(turns[0]).toMatchObject({ audience: "ent_creator", senderEntityId: "ent_creator" });
    expect(ensured[0]).toMatchObject({
      source_type: "discord",
      source_external_id: "dm-1",
      audience_label: "ent_creator",
      audience_entity_id: "ent_creator",
      conversation_kind: "dm",
    });
  });

  it("refuses to run a turn when memory has no creator, rather than guess a partner", async () => {
    const { borg, turns } = fakeBorg(null);
    const runner = runnerFor(borg, "discord_dm");

    await expect(runner.handleMessage(incoming())).rejects.toThrow(/no creator entity/);
    expect(turns).toEqual([]);
  });
});
