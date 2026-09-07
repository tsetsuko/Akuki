// The fake Arena is only worth anything if the REAL client can talk to it, so these
// tests drive it through BotArenaClient rather than through hand-written fetches. A
// stand-in verified against a hand-written request would prove the fake agrees with
// the test, not that it agrees with the connector.
//
// These are the only tests in the package that open a socket, and it is a loopback
// socket to a server they started themselves.

import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BotArenaClient } from "../botarena-client.js";
import { createFakeArena } from "./server.js";
import { FakeArenaStore, type FakeMessage } from "./store.js";

const BOT_ID = "bot-akuki";
const HUMAN_ID = "human-zosia";
const COOKIE = "session-value";
const TOKEN = "bot-token";
const THREAD = "thread-1";

let server: Server;
let base: string;
let store: FakeArenaStore;

function seededMessages(count: number): FakeMessage[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `seed-${index}`,
    thread_id: THREAD,
    sender_type: "user" as const,
    sender_id: HUMAN_ID,
    text: `message ${index}`,
    reply_to_id: null,
    mentions: [],
    created_at: new Date(1_700_000_000_000 + index * 1000).toISOString(),
    status: "final" as const,
  }));
}

async function start(messages: FakeMessage[] = []): Promise<void> {
  store = new FakeArenaStore({
    threads: [{ id: THREAD, name: "rehearsal", participant_bot_ids: [BOT_ID], is_archived: false }],
    users: [{ id: HUMAN_ID, name: "Zosia" }],
    bots: [{ id: BOT_ID, name: "Akuki" }],
    messages,
  });
  server = createFakeArena({
    store,
    credentials: { sessionCookie: COOKIE, botToken: TOKEN, botId: BOT_ID },
    humanId: HUMAN_ID,
  });
  // listen() is asynchronous: address() is null until "listening" fires, so awaiting
  // it is the difference between a port number and a TypeError.
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address() as AddressInfo;
  base = `http://127.0.0.1:${address.port}`;
}

function client(overrides: { botToken?: string; sessionCookie?: string } = {}): BotArenaClient {
  return new BotArenaClient({
    apiBase: base,
    botToken: overrides.botToken ?? TOKEN,
    sessionCookie: overrides.sessionCookie ?? COOKIE,
  });
}

beforeEach(async () => {
  await start();
});

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("the fake Arena, driven by the real client", () => {
  it("answers the four reads the connector makes", async () => {
    store.post({ threadId: THREAD, senderId: HUMAN_ID, senderType: "user", text: "cześć" });
    const api = client();

    const threads = await api.listThreads();
    expect(threads.map((thread) => thread.id)).toEqual([THREAD]);
    expect(threads[0]?.participantBotIds).toEqual([BOT_ID]);

    const messages = await api.getMessages(THREAD);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.text).toBe("cześć");
    expect(messages[0]?.status).toBe("final");
    expect(messages[0]?.senderId).toBe(HUMAN_ID);

    const principals = await api.listPrincipals();
    expect(principals).toEqual(
      expect.arrayContaining([
        { id: HUMAN_ID, type: "user", name: "Zosia" },
        { id: BOT_ID, type: "bot", name: "Akuki" },
      ]),
    );
  });

  it("accepts a posted reply and reads it back as Akuki's own", async () => {
    const api = client();
    const id = await api.postMessage(THREAD, { text: "słyszę", replyToId: null });
    expect(id).toBeDefined();

    const messages = await api.getMessages(THREAD);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.senderId).toBe(BOT_ID);
    expect(messages[0]?.senderType).toBe("bot");
    expect(messages[0]?.text).toBe("słyszę");
  });

  it("refuses a read whose cookie is wrong, so the rehearsal cannot pass on bad credentials", async () => {
    const api = client({ sessionCookie: "not-the-cookie" });
    await expect(api.listThreads()).rejects.toThrow(/401/u);
  });

  it("refuses a write whose token is wrong", async () => {
    const api = client({ botToken: "not-the-token" });
    await expect(api.postMessage(THREAD, { text: "x", replyToId: null })).rejects.toThrow(/401/u);
  });

  it("returns the newest 50, the window the live API was measured to return", async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await start(seededMessages(63));

    const messages = await client().getMessages(THREAD);
    expect(messages).toHaveLength(50);
    // The newest is present and the oldest thirteen are not: a fake that returned
    // everything would make the connector's unpaged read look safe on long threads.
    expect(messages.at(-1)?.text).toBe("message 62");
    expect(messages[0]?.text).toBe("message 13");
  });

  it("404s a thread it does not have, rather than answering an empty one", async () => {
    await expect(client().getMessages("no-such-thread")).rejects.toThrow(/404/u);
  });
});
