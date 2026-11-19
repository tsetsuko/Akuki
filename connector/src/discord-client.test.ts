import { describe, expect, it } from "vitest";

import type { FetchImpl } from "./botarena-client.js";
import { DiscordDmTransport, DiscordError, splitForDiscord } from "./discord-client.js";

const BOT_ID = "111";
const USER_ID = "222";
const CHANNEL_ID = "999";

type Call = { method: string; url: string; body: Record<string, unknown> | null };

function stubDiscord(messages: unknown[] = [], status = 200) {
  const calls: Call[] = [];
  let posted = 0;
  const fetchImpl = (async (input: unknown, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const body = typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : null;
    calls.push({ method, url, body });
    if (status !== 200) {
      return new Response("{\"message\":\"nope\"}", { status });
    }
    if (url.endsWith("/users/@me/channels")) {
      return new Response(JSON.stringify({ id: CHANNEL_ID, type: 1 }));
    }
    if (method === "GET") {
      return new Response(JSON.stringify(messages));
    }
    posted += 1;
    return new Response(JSON.stringify({ id: `posted-${posted}` }));
  }) as unknown as FetchImpl;
  return { calls, fetchImpl };
}

function transport(fetchImpl: FetchImpl) {
  return new DiscordDmTransport({
    botToken: "secret",
    botId: BOT_ID,
    userId: USER_ID,
    apiBase: "https://discord.test/api/v10",
    fetchImpl,
  });
}

function discordMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: "m1",
    type: 0,
    content: "hej",
    timestamp: "2026-11-19T10:00:00.000000+00:00",
    author: { id: USER_ID, username: "zosia", global_name: "Zosia" },
    attachments: [],
    ...overrides,
  };
}

describe("DiscordDmTransport", () => {
  it("opens the DM once and presents it as one direct thread", async () => {
    const { calls, fetchImpl } = stubDiscord();
    const client = transport(fetchImpl);

    const first = await client.listThreads();
    await client.listThreads();

    expect(first).toEqual([
      {
        id: CHANNEL_ID,
        name: "Discord DM",
        lastMessageAt: null,
        participantBotIds: [BOT_ID],
        isArchived: false,
        direct: true,
      },
    ]);
    const opens = calls.filter((call) => call.url.endsWith("/users/@me/channels"));
    expect(opens).toHaveLength(1);
    expect(opens[0]?.body).toEqual({ recipient_id: USER_ID });
  });

  it("authenticates as a bot", async () => {
    let auth: string | null = null;
    const fetchImpl = (async (_input: unknown, init?: RequestInit) => {
      auth = new Headers(init?.headers).get("Authorization");
      return new Response(JSON.stringify({ id: CHANNEL_ID }));
    }) as unknown as FetchImpl;

    await transport(fetchImpl).listThreads();

    expect(auth).toBe("Bot secret");
  });

  it("passes only the configured user and Akuki himself, and only conversational messages", async () => {
    const { fetchImpl } = stubDiscord([
      discordMessage({ id: "from-zosia" }),
      discordMessage({ id: "from-akuki", author: { id: BOT_ID, username: "akuki" } }),
      discordMessage({ id: "from-stranger", author: { id: "333", username: "obcy" } }),
      discordMessage({ id: "pin-notice", type: 6 }),
    ]);

    const messages = await transport(fetchImpl).getMessages(CHANNEL_ID);

    expect(messages.map((message) => [message.id, message.senderType])).toEqual([
      ["from-zosia", "user"],
      ["from-akuki", "bot"],
    ]);
  });

  it("maps a reply, its author's name and attachment metadata", async () => {
    const { fetchImpl } = stubDiscord([
      discordMessage({
        id: "m2",
        type: 19,
        message_reference: { message_id: "m1" },
        attachments: [{ id: "a1", filename: "x.png", content_type: "image/png", size: 10 }],
      }),
    ]);
    const client = transport(fetchImpl);

    const [message] = await client.getMessages(CHANNEL_ID);

    expect(message).toMatchObject({
      id: "m2",
      threadId: CHANNEL_ID,
      senderId: USER_ID,
      text: "hej",
      replyToId: "m1",
      mentions: [],
      status: "final",
      createdAt: "2026-11-19T10:00:00.000000+00:00",
      attachments: [{ id: "a1", kind: "image", filename: "x.png", contentType: "image/png", size: 10 }],
    });
    expect(await client.nameOf(USER_ID)).toBe("Zosia");
    expect(await client.nameOf("444")).toBe("unknown:444");
  });

  it("posts a long reply in pieces, quoting the message only once and pinging nobody", async () => {
    const { calls, fetchImpl } = stubDiscord();
    const text = `${"a".repeat(1500)} ${"b".repeat(1500)}`;

    const id = await transport(fetchImpl).postMessage(CHANNEL_ID, { text, replyToId: "m1" });

    const posts = calls.filter((call) => call.method === "POST");
    expect(id).toBe("posted-1");
    expect(posts.map((post) => post.body?.content)).toEqual(["a".repeat(1500), "b".repeat(1500)]);
    expect(posts[0]?.body?.message_reference).toEqual({ message_id: "m1", fail_if_not_exists: false });
    expect(posts[1]?.body?.message_reference).toBeUndefined();
    expect(posts.every((post) => JSON.stringify(post.body?.allowed_mentions) === '{"parse":[]}')).toBe(
      true,
    );
  });

  it("throws on an error status, so the adapter's retry and floor logic take over", async () => {
    const { fetchImpl } = stubDiscord([], 429);

    await expect(transport(fetchImpl).listThreads()).rejects.toBeInstanceOf(DiscordError);
  });
});

describe("splitForDiscord", () => {
  it("leaves a short text whole, including an empty one", () => {
    expect(splitForDiscord("krótko")).toEqual(["krótko"]);
    expect(splitForDiscord("")).toEqual([""]);
  });

  it("prefers a line break, and cuts a word only when it alone exceeds the limit", () => {
    expect(splitForDiscord("abc def\nghi", 8)).toEqual(["abc def", "ghi"]);
    expect(splitForDiscord("abcdefghij", 4)).toEqual(["abcd", "efgh", "ij"]);
  });
});
