import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BotArenaAdapter, type ArenaTransport } from "./adapter.js";
import type { BotArenaMessage, BotArenaThread } from "./botarena-client.js";
import type { AkukiReply, AkukiRunner, IncomingArenaMessage } from "./contract.js";
import { ArenaStateStore } from "./state.js";

const AKUKI_BOT_ID = "bot-akuki";

function thread(overrides: Partial<BotArenaThread> = {}): BotArenaThread {
  return {
    id: "t1",
    name: "arena-general",
    lastMessageAt: null,
    participantBotIds: [AKUKI_BOT_ID],
    isArchived: false,
    ...overrides,
  };
}

function message(overrides: Partial<BotArenaMessage> = {}): BotArenaMessage {
  return {
    id: "m1",
    threadId: "t1",
    senderType: "user",
    senderId: "u-zosia",
    text: "hej",
    replyToId: null,
    mentions: [],
    createdAt: "2026-09-04T10:00:00.000Z",
    attachments: [],
    status: "final",
    ...overrides,
  };
}

type FakeTransport = ArenaTransport & {
  posted: { threadId: string; text: string; replyToId: string | null | undefined }[];
  messages: BotArenaMessage[];
  threads: BotArenaThread[];
  failPost: boolean;
};

function fakeTransport(init: Partial<Pick<FakeTransport, "threads" | "messages">> = {}): FakeTransport {
  const state: FakeTransport = {
    posted: [],
    messages: init.messages ?? [],
    threads: init.threads ?? [thread()],
    failPost: false,
    listThreads: async () => state.threads,
    getMessages: async () => state.messages,
    postMessage: async (threadId, body) => {
      if (state.failPost) {
        throw new Error("arena unreachable");
      }
      state.posted.push({ threadId, text: body.text, replyToId: body.replyToId });
      return `posted-${state.posted.length}`;
    },
  };
  return state;
}

type FakeRunner = AkukiRunner & {
  seen: IncomingArenaMessage[];
  assessed: IncomingArenaMessage[];
  recorded: IncomingArenaMessage[];
};

function fakeRunner(
  reply: (m: IncomingArenaMessage) => AkukiReply | Promise<AkukiReply>,
  assess: (m: IncomingArenaMessage) => void | Promise<void> = () => {},
): FakeRunner {
  const seen: IncomingArenaMessage[] = [];
  const assessed: IncomingArenaMessage[] = [];
  const recorded: IncomingArenaMessage[] = [];
  return {
    seen,
    assessed,
    recorded,
    recordMessage: async (incoming) => {
      recorded.push(incoming);
    },
    handleMessage: async (incoming) => {
      seen.push(incoming);
      return reply(incoming);
    },
    assessMessage: async (incoming) => {
      assessed.push(incoming);
      await assess(incoming);
    },
  };
}

const directory = { nameOf: async (id: string) => `name-of-${id}` };

let dir: string;
let store: ArenaStateStore;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "akuki-arena-adapter-"));
  store = new ArenaStateStore(join(dir, "state.db"));
});

afterEach(() => {
  store.close();
  rmSync(dir, { recursive: true, force: true });
});

function build(
  transport: ArenaTransport,
  runner: AkukiRunner,
  overrides: Partial<ConstructorParameters<typeof BotArenaAdapter>[0]> = {},
): BotArenaAdapter {
  return new BotArenaAdapter({
    transport,
    runner,
    state: store,
    directory,
    botId: AKUKI_BOT_ID,
    now: () => 1_800_000_000_000,
    ...overrides,
  });
}

describe("thread selection", () => {
  it("ignores threads Akuki is not seated in, archived ones, and non-allowlisted ones", async () => {
    const transport = fakeTransport({
      threads: [
        thread({ id: "seated" }),
        thread({ id: "not-seated", participantBotIds: ["bot-sol"] }),
        thread({ id: "archived", isArchived: true }),
        thread({ id: "other-seated" }),
      ],
      messages: [message()],
    });
    const seen: string[] = [];
    const adapter = build(transport, fakeRunner(() => ({ text: null })), {
      threadAllowlist: new Set(["seated"]),
      log: (_level, text) => seen.push(text),
    });

    await adapter.pollOnce();

    expect(seen.filter((line) => line.includes("first sight"))).toHaveLength(1);
    expect(seen.some((line) => line.includes("thread seated:"))).toBe(true);
  });
});

describe("first sight", () => {
  it("marks the existing window as before Akuki came online and runs no turn", async () => {
    const transport = fakeTransport({
      messages: [message({ id: "old-1" }), message({ id: "old-2" })],
    });
    const runner = fakeRunner(() => ({ text: "should not happen" }));
    const adapter = build(transport, runner);

    await adapter.pollOnce();

    expect(runner.seen).toHaveLength(0);
    expect(transport.posted).toHaveLength(0);
    expect(store.getFloor("t1")).toBe(Date.parse("2026-09-04T10:00:00.000Z"));
  });

  it("replays the backlog when catch-up is switched on", async () => {
    const transport = fakeTransport({ messages: [message({ id: "old-1" })] });
    const runner = fakeRunner(() => ({ text: "odpowiedź" }));
    const adapter = build(transport, runner, { catchUpBacklog: true });

    await adapter.pollOnce();

    expect(runner.seen.map((m) => m.messageId)).toEqual(["old-1"]);
  });
});

describe("catch-up window", () => {
  const SAID_AT = Date.parse("2026-09-04T10:00:00.000Z");

  it("retires a message said before the window instead of answering it late", async () => {
    // An absence: the floor is below the message, so without a window this message
    // would get its own turn however long the process was away.
    store.setFloor("t1", SAID_AT - 1);
    const transport = fakeTransport({ messages: [message({ id: "stale" })] });
    const runner = fakeRunner(() => ({ text: "should not happen" }));
    const lines: string[] = [];
    const adapter = build(transport, runner, {
      maxCatchUpAgeMs: 10 * 60 * 1000,
      now: () => SAID_AT + 30 * 60 * 1000,
      log: (_level, text) => lines.push(text),
    });

    await adapter.pollOnce();

    expect(runner.seen).toHaveLength(0);
    expect(transport.posted).toHaveLength(0);
    // Skipped, not absent: what he never heard has to stay countable.
    expect(store.get("t1", "stale")?.state).toBe("skipped");
    expect(lines.some((line) => line.includes("catch-up window"))).toBe(true);
  });

  it("answers a message inside the window", async () => {
    store.setFloor("t1", SAID_AT - 1);
    const transport = fakeTransport({ messages: [message({ id: "fresh" })] });
    const runner = fakeRunner(() => ({ text: "jestem" }));
    const adapter = build(transport, runner, {
      maxCatchUpAgeMs: 10 * 60 * 1000,
      now: () => SAID_AT + 60 * 1000,
    });

    await adapter.pollOnce();

    expect(runner.seen.map((m) => m.messageId)).toEqual(["fresh"]);
    expect(store.get("t1", "fresh")?.state).toBe("published");
  });

  it("answers however late when no window is configured", async () => {
    store.setFloor("t1", SAID_AT - 1);
    const transport = fakeTransport({ messages: [message({ id: "stale" })] });
    const runner = fakeRunner(() => ({ text: "jestem" }));
    const adapter = build(transport, runner, { now: () => SAID_AT + 30 * 60 * 1000 });

    await adapter.pollOnce();

    expect(runner.seen.map((m) => m.messageId)).toEqual(["stale"]);
  });

  it("writes no row in a dry run, so the next real run still decides for itself", async () => {
    store.setFloor("t1", SAID_AT - 1);
    const transport = fakeTransport({ messages: [message({ id: "stale" })] });
    const runner = fakeRunner(() => ({ text: "should not happen" }));
    const lines: string[] = [];
    const adapter = build(transport, runner, {
      maxCatchUpAgeMs: 10 * 60 * 1000,
      now: () => SAID_AT + 30 * 60 * 1000,
      dryRun: true,
      log: (_level, text) => lines.push(text),
    });

    await adapter.pollOnce();

    expect(store.get("t1", "stale")).toBeUndefined();
    expect(lines.some((line) => line.includes("[dry-run] would skip"))).toBe(true);
  });
});

describe("routing", () => {
  it("hands every final foreign message to Akuki without inspecting content", async () => {
    const transport = fakeTransport();
    const runner = fakeRunner(() => ({ text: "ok" }));
    const adapter = build(transport, runner, { catchUpBacklog: true });

    transport.messages = [
      message({ id: "no-mention", text: "coś zupełnie nie o Akukim" }),
      message({ id: "from-a-bot", senderId: "bot-sol", senderType: "bot" }),
      message({ id: "mentioning", mentions: [AKUKI_BOT_ID] }),
    ];

    await adapter.pollOnce();

    // All three reach him. The queue order decides which is answered (the newest);
    // who wrote it does not, and none of them is addressed to someone else.
    expect(runner.assessed.map((m) => m.messageId)).toEqual(["no-mention", "from-a-bot"]);
    expect(runner.seen.map((m) => m.messageId)).toEqual(["mentioning"]);
  });

  it("stores, never analyses or answers, a message addressed to someone else (TASK-060)", async () => {
    const transport = fakeTransport({
      messages: [message({ id: "to-sol", senderId: "bot-lunaria", mentions: ["bot-sol"] })],
    });
    const runner = fakeRunner(() => ({ text: "should not happen" }));
    const lines: string[] = [];
    const adapter = build(transport, runner, {
      catchUpBacklog: true,
      log: (_level, text) => lines.push(text),
    });

    await adapter.pollOnce();

    // Stored in his conversation, but no turn of any kind, even as the newest.
    expect(runner.recorded.map((m) => m.messageId)).toEqual(["to-sol"]);
    expect(runner.assessed).toHaveLength(0);
    expect(runner.seen).toHaveLength(0);
    expect(store.get("t1", "to-sol")?.state, lines.join(" | ")).toBe("heard");
    expect(lines.some((line) => line.includes("heard, addressed to someone else"))).toBe(true);
  });

  it("answers the latest message not addressed elsewhere when the newest is", async () => {
    const transport = fakeTransport({
      messages: [
        message({ id: "general", text: "co słychać?" }),
        message({ id: "to-sol", senderId: "bot-lunaria", mentions: ["bot-sol"] }),
      ],
    });
    const runner = fakeRunner(() => ({ text: "ok" }));
    const adapter = build(transport, runner, { catchUpBacklog: true });

    await adapter.pollOnce();

    expect(runner.seen.map((m) => m.messageId)).toEqual(["general"]);
    expect(runner.recorded.map((m) => m.messageId)).toEqual(["to-sol"]);
    expect(runner.assessed).toHaveLength(0);
  });

  it("still answers a message that mentions Akuki or replies to him", async () => {
    for (const [name, overrides, page] of [
      ["mentions both", { mentions: ["bot-sol", AKUKI_BOT_ID] }, []],
      [
        "replies to his post",
        { mentions: ["bot-sol"], replyToId: "his" },
        [message({ id: "his", senderId: AKUKI_BOT_ID, senderType: "bot" })],
      ],
      ["replies to a post not on the page", { mentions: ["bot-sol"], replyToId: "gone" }, []],
    ] as const) {
      // A fresh store per case, so one case's "answered" row cannot hide the next.
      store.close();
      store = new ArenaStateStore(join(dir, `state-${name.replaceAll(" ", "-")}.db`));
      const transport = fakeTransport({
        messages: [...page, message({ id: "m-new", senderId: "bot-lunaria", ...overrides })],
      });
      const runner = fakeRunner(() => ({ text: "ok" }));
      const adapter = build(transport, runner, { catchUpBacklog: true });

      await adapter.pollOnce();

      expect(runner.seen.map((m) => m.messageId), name).toEqual(["m-new"]);
    }
  });

  it("never runs a turn for Akuki's own post", async () => {
    const transport = fakeTransport({
      messages: [message({ id: "mine", senderId: AKUKI_BOT_ID, senderType: "bot" })],
    });
    const runner = fakeRunner(() => ({ text: "loop!" }));
    const adapter = build(transport, runner, { catchUpBacklog: true });

    await adapter.pollOnce();

    expect(runner.seen).toHaveLength(0);
    expect(store.get("t1", "mine")?.state).toBe("skipped");
  });

  it("normalizes only the fields something downstream reads (see TASK-033)", async () => {
    const transport = fakeTransport({
      messages: [message({ replyToId: "m0", mentions: ["u-x"] })],
    });
    const runner = fakeRunner(() => ({ text: null }));
    const adapter = build(transport, runner, { catchUpBacklog: true });

    await adapter.pollOnce();

    expect(runner.seen[0]).toEqual({
      messageId: "m1",
      threadId: "t1",
      threadName: "arena-general",
      authorId: "u-zosia",
      authorName: "name-of-u-zosia",
      authorKind: "person",
      text: "hej",
      createdAtMs: Date.parse("2026-09-04T10:00:00.000Z"),
      // Replies to a post not on the page, so possibly his.
      addressedToAkuki: true,
    });
  });

  it("marks whether each message was addressed to him, from structure alone (TASK-061)", async () => {
    const transport = fakeTransport({
      messages: [
        message({ id: "his", senderId: AKUKI_BOT_ID, senderType: "bot", createdAt: "2026-09-04T09:59:00.000Z" }),
        message({ id: "to-room", text: "Akuki, co myślisz?", createdAt: "2026-09-04T10:00:00.000Z" }),
        message({ id: "mentions-him", mentions: [AKUKI_BOT_ID], createdAt: "2026-09-04T10:00:01.000Z" }),
        message({ id: "reply-to-his", replyToId: "his", createdAt: "2026-09-04T10:00:02.000Z" }),
        message({ id: "reply-to-room", replyToId: "to-room", createdAt: "2026-09-04T10:00:03.000Z" }),
        message({ id: "reply-off-page", replyToId: "gone", createdAt: "2026-09-04T10:00:04.000Z" }),
      ],
    });
    const runner = fakeRunner(() => ({ text: null }));
    const adapter = build(transport, runner, { catchUpBacklog: true });

    await adapter.pollOnce();

    const all = [...runner.assessed, ...runner.seen];
    expect(Object.fromEntries(all.map((m) => [m.messageId, m.addressedToAkuki]))).toEqual({
      // His name in the text does not count: routing never reads the text.
      "to-room": false,
      "mentions-him": true,
      "reply-to-his": true,
      "reply-to-room": false,
      "reply-off-page": true,
    });
  });

  it("passes the author's kind on, naming the Arena's user a person", async () => {
    const transport = fakeTransport({
      messages: [
        message({ id: "from-user", senderType: "user", createdAt: "2026-09-04T10:00:00.000Z" }),
        message({ id: "from-bot", senderType: "bot", senderId: "u-sol", createdAt: "2026-09-04T10:00:01.000Z" }),
        message({ id: "from-system", senderType: "system", senderId: "u-sys", createdAt: "2026-09-04T10:00:02.000Z" }),
      ],
    });
    const seen: IncomingArenaMessage[] = [];
    const runner: AkukiRunner = {
      recordMessage: async () => {},
      handleMessage: async (incoming) => {
        seen.push(incoming);
        return { text: null };
      },
      assessMessage: async (incoming) => {
        seen.push(incoming);
      },
    };
    const adapter = build(transport, runner, { catchUpBacklog: true });

    await adapter.pollOnce();

    expect(seen.map((incoming) => [incoming.messageId, incoming.authorKind])).toEqual([
      ["from-user", "person"],
      ["from-bot", "bot"],
      ["from-system", "system"],
    ]);
  });
});

describe("streaming messages", () => {
  it("leaves a fresh streaming message for the next poll", async () => {
    const transport = fakeTransport({
      messages: [message({ id: "streaming", status: "streaming" })],
    });
    const runner = fakeRunner(() => ({ text: "too early" }));
    const adapter = build(transport, runner, { catchUpBacklog: true });

    await adapter.pollOnce();

    expect(runner.seen).toHaveLength(0);
    expect(store.get("t1", "streaming")).toBeUndefined();

    transport.messages = [message({ id: "streaming", status: "final" })];
    await adapter.pollOnce();

    expect(runner.seen.map((m) => m.messageId)).toEqual(["streaming"]);
  });

  it("retires a dead stream so it cannot hold the thread forever", async () => {
    const transport = fakeTransport({
      messages: [
        message({ id: "dead", status: "streaming", createdAt: "2026-09-04T10:00:00.000Z" }),
        message({ id: "later", createdAt: "2026-09-04T10:30:00.000Z" }),
      ],
    });
    const runner = fakeRunner(() => ({ text: "ok" }));
    const logged: string[] = [];
    const adapter = build(transport, runner, {
      catchUpBacklog: true,
      log: (_level, text) => logged.push(text),
    });

    await adapter.pollOnce();

    expect(logged.some((line) => line.includes("stream never finalized"))).toBe(true);
    expect(runner.seen.map((m) => m.messageId)).toEqual(["later"]);
    // Retiring the dead stream is what lets the floor pass it; the row is then
    // pruned away precisely because it can never be reconsidered.
    expect(store.getFloor("t1")).toBe(Date.parse("2026-09-04T10:30:00.000Z"));
    expect(store.get("t1", "dead")).toBeUndefined();
  });
});

describe("publishing", () => {
  it("commits the reply before posting and marks it published after", async () => {
    const transport = fakeTransport({ messages: [message()] });
    const runner = fakeRunner(() => ({ text: "cześć" }));
    const adapter = build(transport, runner, { catchUpBacklog: true });

    await adapter.pollOnce();

    expect(transport.posted).toEqual([{ threadId: "t1", text: "cześć", replyToId: "m1" }]);
    expect(store.get("t1", "m1")?.state).toBe("published");
  });

  it("records silence as handled and posts nothing", async () => {
    const transport = fakeTransport({ messages: [message()] });
    const runner = fakeRunner(() => ({ text: null }));
    const adapter = build(transport, runner, { catchUpBacklog: true });

    await adapter.pollOnce();

    expect(transport.posted).toHaveLength(0);
    const row = store.get("t1", "m1");
    expect(row?.state).toBe("published");
    expect(row?.replyText).toBeNull();
  });

  it("retries only the post after a transport failure, never the turn", async () => {
    const transport = fakeTransport({ messages: [message()] });
    const runner = fakeRunner(() => ({ text: "jedna odpowiedź" }));
    const adapter = build(transport, runner, { catchUpBacklog: true });

    transport.failPost = true;
    await adapter.pollOnce();

    expect(store.get("t1", "m1")?.state).toBe("reply_ready");
    expect(store.getFloor("t1")).toBe(0);

    transport.failPost = false;
    await adapter.pollOnce();

    // Exactly one turn, exactly one post: the stored text was re-sent, not re-thought.
    expect(runner.seen).toHaveLength(1);
    expect(transport.posted).toEqual([{ threadId: "t1", text: "jedna odpowiedź", replyToId: "m1" }]);
    expect(store.get("t1", "m1")?.state).toBe("published");
  });

  it("does not answer the same message twice across polls", async () => {
    const transport = fakeTransport({ messages: [message()] });
    const runner = fakeRunner(() => ({ text: "raz" }));
    const adapter = build(transport, runner, { catchUpBacklog: true });

    await adapter.pollOnce();
    await adapter.pollOnce();
    await adapter.pollOnce();

    expect(runner.seen).toHaveLength(1);
    expect(transport.posted).toHaveLength(1);
  });
});

describe("posting the reply before the turn ends", () => {
  function earlyRunner(
    text: string,
    after: () => void | Promise<void> = () => {},
  ): AkukiRunner {
    return {
      handleMessage: async (_incoming, onReply) => {
        await onReply?.(text);
        await after();
        return { text };
      },
      assessMessage: async () => {},
      recordMessage: async () => {},
    };
  }

  it("posts once, from the hand-out, while the turn is still running", async () => {
    const transport = fakeTransport({ messages: [message()] });
    let postedWhileRunning = 0;
    const runner = earlyRunner("od razu", () => {
      postedWhileRunning = transport.posted.length;
    });
    const adapter = build(transport, runner, { catchUpBacklog: true });

    await adapter.pollOnce();

    expect(postedWhileRunning).toBe(1);
    expect(transport.posted).toEqual([{ threadId: "t1", text: "od razu", replyToId: "m1" }]);
    expect(store.get("t1", "m1")?.state).toBe("published");
  });

  it("keeps a handed-out reply when the post-reply work fails", async () => {
    const transport = fakeTransport({ messages: [message()] });
    const runner = earlyRunner("zdążyłem", () => {
      throw new Error("reflection blew up");
    });
    const adapter = build(transport, runner, { catchUpBacklog: true });

    await adapter.pollOnce();

    expect(transport.posted).toHaveLength(1);
    expect(store.get("t1", "m1")?.state).toBe("published");
  });

  it("leaves a handed-out reply reply_ready for retry when its post fails", async () => {
    const transport = fakeTransport({ messages: [message()] });
    const runner = earlyRunner("spróbuję jeszcze raz");
    const adapter = build(transport, runner, { catchUpBacklog: true });

    transport.failPost = true;
    await adapter.pollOnce();
    expect(store.get("t1", "m1")?.state).toBe("reply_ready");

    transport.failPost = false;
    await adapter.pollOnce();
    expect(transport.posted).toEqual([
      { threadId: "t1", text: "spróbuję jeszcze raz", replyToId: "m1" },
    ]);
    expect(store.get("t1", "m1")?.state).toBe("published");
  });
});

describe("failures inside the turn", () => {
  it("abandons the message instead of re-running a turn borg may already hold", async () => {
    const transport = fakeTransport({ messages: [message()] });
    const runner = fakeRunner(() => {
      throw new Error("cognition blew up");
    });
    const logged: string[] = [];
    const adapter = build(transport, runner, {
      catchUpBacklog: true,
      log: (_level, text) => logged.push(text),
    });

    await adapter.pollOnce();
    await adapter.pollOnce();

    expect(runner.seen).toHaveLength(1);
    expect(store.get("t1", "m1")?.state).toBe("abandoned");
    expect(logged.some((line) => line.includes("not retried"))).toBe(true);
  });

  it("keeps polling other threads when one thread fails", async () => {
    const transport = fakeTransport({
      threads: [thread({ id: "broken" }), thread({ id: "fine" })],
    });
    transport.getMessages = async (threadId: string) => {
      if (threadId === "broken") {
        throw new Error("boom");
      }
      return [message({ threadId: "fine" })];
    };
    const runner = fakeRunner(() => ({ text: "ok" }));
    const adapter = build(transport, runner, { catchUpBacklog: true });

    await adapter.pollOnce();

    expect(runner.seen.map((m) => m.threadId)).toEqual(["fine"]);
  });
});

describe("restart recovery", () => {
  it("posts a reply composed before the crash without running a second turn", async () => {
    store.markReceived("t1", "m1", Date.parse("2026-09-04T10:00:00.000Z"));
    store.markReplyReady("t1", "m1", "napisane przed awarią");
    store.setFloor("t1", 0);

    const transport = fakeTransport({ messages: [message()] });
    const runner = fakeRunner(() => ({ text: "nie powinno się zdarzyć" }));
    const adapter = build(transport, runner);

    await adapter.recoverAfterRestart();

    expect(transport.posted).toEqual([{ threadId: "t1", text: "napisane przed awarią", replyToId: "m1" }]);
    expect(runner.seen).toHaveLength(0);
    expect(store.get("t1", "m1")?.state).toBe("published");
  });

  it("abandons a turn that was in flight at shutdown", async () => {
    store.markReceived("t1", "m1", Date.parse("2026-09-04T10:00:00.000Z"));
    store.setFloor("t1", 0);

    const transport = fakeTransport({ messages: [message()] });
    const runner = fakeRunner(() => ({ text: "nie" }));
    const logged: string[] = [];
    const adapter = build(transport, runner, { log: (_level, text) => logged.push(text) });

    await adapter.recoverAfterRestart();
    await adapter.pollOnce();

    expect(runner.seen).toHaveLength(0);
    expect(store.get("t1", "m1")?.state).toBe("abandoned");
    expect(logged.some((line) => line.includes("in flight at shutdown"))).toBe(true);
  });
});

describe("floor", () => {
  it("stops at the first unfinished message but still handles later ones", async () => {
    const first = message({ id: "stuck", createdAt: "2026-09-04T10:00:00.000Z" });
    const second = message({ id: "ok", createdAt: "2026-09-04T10:05:00.000Z" });
    const transport = fakeTransport({ messages: [first, second] });
    const runner = fakeRunner(
      () => ({ text: "ok" }),
      (incoming) => {
        if (incoming.messageId === "stuck") {
          throw new Error("only this one fails");
        }
      },
    );
    const logged: string[] = [];
    const adapter = build(transport, runner, {
      catchUpBacklog: true,
      log: (_level, text) => logged.push(text),
    });

    await adapter.pollOnce();

    // A failed turn is abandoned, and abandoned is terminal, so the floor is free
    // to move past both -- the later message is not held hostage by the earlier one.
    expect(runner.assessed.map((m) => m.messageId)).toEqual(["stuck"]);
    expect(logged.some((line) => line.startsWith("abandoned t1/stuck"))).toBe(true);
    expect(runner.seen.map((m) => m.messageId)).toEqual(["ok"]);
    expect(transport.posted).toEqual([{ threadId: "t1", text: "ok", replyToId: "ok" }]);
    expect(store.getFloor("t1")).toBe(Date.parse("2026-09-04T10:05:00.000Z"));
  });

  it("prunes rows strictly below the floor and keeps the boundary and the unfinished", async () => {
    const oldest = message({ id: "oldest", createdAt: "2026-09-04T10:00:00.000Z" });
    const atFloor = message({ id: "at-floor", createdAt: "2026-09-04T10:05:00.000Z" });
    const unfinished = message({ id: "unfinished", createdAt: "2026-09-04T10:10:00.000Z" });
    const transport = fakeTransport({ messages: [oldest] });
    const runner = fakeRunner(() => ({ text: "ok" }));
    const adapter = build(transport, runner, { catchUpBacklog: true });

    // The third post fails, so the floor stops at the second message.
    let posts = 0;
    transport.postMessage = async (threadId, body) => {
      posts += 1;
      if (posts > 2) {
        throw new Error("arena unreachable");
      }
      transport.posted.push({ threadId, text: body.text, replyToId: body.replyToId });
      return `posted-${posts}`;
    };

    // One message per poll, so each is the newest when it is seen and gets a reply.
    await adapter.pollOnce();
    transport.messages = [oldest, atFloor];
    await adapter.pollOnce();
    transport.messages = [oldest, atFloor, unfinished];
    await adapter.pollOnce();

    expect(store.getFloor("t1")).toBe(Date.parse("2026-09-04T10:05:00.000Z"));
    expect(store.get("t1", "oldest")).toBeUndefined();
    // Equal to the floor is not below it, so this row stays.
    expect(store.get("t1", "at-floor")?.state).toBe("published");
    expect(store.get("t1", "unfinished")?.state).toBe("reply_ready");
  });

  it("holds the floor at an unposted reply and keeps advancing once it lands", async () => {
    const first = message({ id: "unposted", createdAt: "2026-09-04T10:00:00.000Z" });
    const transport = fakeTransport({ messages: [first] });
    const runner = fakeRunner(() => ({ text: "czeka" }));
    const adapter = build(transport, runner, { catchUpBacklog: true });

    transport.failPost = true;
    await adapter.pollOnce();
    expect(store.getFloor("t1")).toBe(0);

    transport.failPost = false;
    await adapter.pollOnce();
    expect(store.getFloor("t1")).toBe(Date.parse("2026-09-04T10:00:00.000Z"));
  });

  it("keeps advancing after pruning has removed the older rows", async () => {
    const transport = fakeTransport();
    const runner = fakeRunner(() => ({ text: "ok" }));
    const adapter = build(transport, runner, { catchUpBacklog: true });

    transport.messages = [message({ id: "a", createdAt: "2026-09-04T10:00:00.000Z" })];
    await adapter.pollOnce();
    const firstFloor = store.getFloor("t1");

    // The API keeps returning the old message; its row is now pruned away.
    transport.messages = [
      message({ id: "a", createdAt: "2026-09-04T10:00:00.000Z" }),
      message({ id: "b", createdAt: "2026-09-04T11:00:00.000Z" }),
    ];
    await adapter.pollOnce();

    expect(firstFloor).toBe(Date.parse("2026-09-04T10:00:00.000Z"));
    expect(store.getFloor("t1")).toBe(Date.parse("2026-09-04T11:00:00.000Z"));
    expect(runner.seen.map((m) => m.messageId)).toEqual(["a", "b"]);
  });

  it("handles two messages sharing one timestamp", async () => {
    const transport = fakeTransport({
      messages: [
        message({ id: "same-1", createdAt: "2026-09-04T10:00:00.000Z" }),
        message({ id: "same-2", createdAt: "2026-09-04T10:00:00.000Z" }),
      ],
    });
    const runner = fakeRunner(() => ({ text: "ok" }));
    const adapter = build(transport, runner, { catchUpBacklog: true });

    await adapter.pollOnce();

    // Both are handled and neither is lost to the tie; the later one in the
    // sorted order is answered.
    expect(runner.assessed.map((m) => m.messageId)).toEqual(["same-1"]);
    expect(runner.seen.map((m) => m.messageId)).toEqual(["same-2"]);
    expect(transport.posted).toHaveLength(1);
    expect(store.getFloor("t1")).toBe(Date.parse("2026-09-04T10:00:00.000Z"));
  });
});

describe("a queue is heard in full and answered once", () => {
  it("assesses every waiting message but the newest, which gets the only full turn", async () => {
    const transport = fakeTransport({
      messages: [
        message({ id: "a", senderId: "bot-sol", createdAt: "2026-09-04T10:00:00.000Z" }),
        message({ id: "b", senderId: "bot-terra", createdAt: "2026-09-04T10:01:00.000Z" }),
        message({ id: "c", senderId: "u-zosia", createdAt: "2026-09-04T10:02:00.000Z" }),
      ],
    });
    const runner = fakeRunner(() => ({ text: "answer" }));
    const logged: string[] = [];
    const adapter = build(transport, runner, {
      catchUpBacklog: true,
      log: (_level, text) => logged.push(text),
    });

    await adapter.pollOnce();

    // Each earlier message still reaches Akuki, with its own author.
    expect(runner.assessed.map((m) => [m.messageId, m.authorId])).toEqual([
      ["a", "bot-sol"],
      ["b", "bot-terra"],
    ]);
    expect(runner.seen.map((m) => m.messageId)).toEqual(["c"]);
    expect(transport.posted).toEqual([{ threadId: "t1", text: "answer", replyToId: "c" }]);
    expect(logged.filter((line) => line.includes(": assessed,"))).toHaveLength(2);
    // Assessed is terminal, so the floor moves past the whole queue.
    expect(store.getFloor("t1")).toBe(Date.parse("2026-09-04T10:02:00.000Z"));
  });

  it("answers the newest message that gets a turn, not a newer post of Akuki's own", async () => {
    const transport = fakeTransport({
      messages: [
        message({ id: "first", createdAt: "2026-09-04T10:00:00.000Z" }),
        message({ id: "question", createdAt: "2026-09-04T10:01:00.000Z" }),
        message({ id: "own", senderId: AKUKI_BOT_ID, createdAt: "2026-09-04T10:02:00.000Z" }),
      ],
    });
    const runner = fakeRunner(() => ({ text: "answer" }));
    const adapter = build(transport, runner, { catchUpBacklog: true });

    await adapter.pollOnce();

    expect(runner.assessed.map((m) => m.messageId)).toEqual(["first"]);
    expect(runner.seen.map((m) => m.messageId)).toEqual(["question"]);
    expect(store.get("t1", "own")?.state).toBe("skipped");
  });

  it("gives a lone message a full turn, exactly as before", async () => {
    const transport = fakeTransport({ messages: [message({ id: "only" })] });
    const runner = fakeRunner(() => ({ text: "answer" }));
    const adapter = build(transport, runner, { catchUpBacklog: true });

    await adapter.pollOnce();

    expect(runner.assessed).toEqual([]);
    expect(runner.seen.map((m) => m.messageId)).toEqual(["only"]);
  });

  it("leaves a message that arrives during the answer for the next poll", async () => {
    const transport = fakeTransport({
      messages: [message({ id: "first", createdAt: "2026-09-04T10:00:00.000Z" })],
    });
    const late = message({ id: "late", createdAt: "2026-09-04T10:01:00.000Z" });
    const runner = fakeRunner(() => {
      transport.messages = [...transport.messages, late];
      return { text: "answer" };
    });
    const adapter = build(transport, runner, { catchUpBacklog: true });

    await adapter.pollOnce();
    expect(runner.seen.map((m) => m.messageId)).toEqual(["first"]);
    expect(store.get("t1", "late")).toBeUndefined();

    await adapter.pollOnce();
    expect(runner.seen.map((m) => m.messageId)).toEqual(["first", "late"]);
  });
});

describe("attachments", () => {
  it("logs what it declined to pass and passes only the text", async () => {
    const transport = fakeTransport({
      messages: [
        message({
          attachments: [
            { id: "a1", kind: "image", filename: "x.png", contentType: "image/png", size: 4096 },
          ],
        }),
      ],
    });
    const runner = fakeRunner(() => ({ text: "ok" }));
    const logged: string[] = [];
    const adapter = build(transport, runner, {
      catchUpBacklog: true,
      log: (_level, text) => logged.push(text),
    });

    await adapter.pollOnce();

    expect(logged.some((line) => line.includes("attachment(s) not passed"))).toBe(true);
    expect(logged.some((line) => line.includes("a1/image/4096B"))).toBe(true);
    expect(Object.keys(runner.seen[0] ?? {})).not.toContain("attachments");
  });
});

describe("dry run", () => {
  it("reports what it would do and touches neither the runner, the arena nor the state", async () => {
    const transport = fakeTransport({ messages: [message()] });
    const runner = fakeRunner(() => ({ text: "nie wysyłaj" }));
    const logged: string[] = [];
    const adapter = build(transport, runner, {
      catchUpBacklog: true,
      dryRun: true,
      log: (_level, text) => logged.push(text),
    });

    await adapter.pollOnce();

    expect(runner.seen).toHaveLength(0);
    expect(transport.posted).toHaveLength(0);
    expect(store.get("t1", "m1")).toBeUndefined();
    expect(logged.some((line) => line.includes("[dry-run] would run a turn"))).toBe(true);
  });

  it("records no floor, so it cannot change what the first real run does", async () => {
    const transport = fakeTransport({ messages: [message()] });
    const runner = fakeRunner(() => ({ text: "nie wysyłaj" }));

    // Default catch-up (off) is the first-sight path, which is exactly the branch
    // that would otherwise write a floor and make the first real run replay the
    // thread instead of marking it as history.
    const dry = build(transport, runner, { dryRun: true, log: () => {} });
    await dry.pollOnce();

    expect(store.getFloor("t1")).toBeNull();

    const live = build(transport, runner, { log: () => {} });
    await live.pollOnce();

    expect(runner.seen).toHaveLength(0);
    expect(store.getFloor("t1")).toBe(Date.parse("2026-09-04T10:00:00.000Z"));
  });
});
