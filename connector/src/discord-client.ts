// Discord direct messages as a second transport for the same adapter. Transport only.
//
// WHAT THIS IS FOR. One private conversation: Zosia writes to Akuki from her phone
// when she is away from the computer. Nothing else -- no server channels, no other
// people. That narrowness is the design, not a first step towards more.
//
// IT SPEAKS THE ADAPTER'S SHAPE. The poll loop in adapter.ts already owns the hard
// parts: the floor, the durable state machine, the "heard in full, answered once"
// queue, crash-safe posting. Discord is mapped into the same thread/message shape
// the Arena client produces, so none of that is written twice. The DM channel is
// presented as one thread marked `direct`, which tells the adapter that everything
// said in it is said to Akuki.
//
// OUTGOING ONLY, like the Arena client. Discord's usual route is a gateway
// websocket; polling the REST API instead keeps the same shape as the Arena loop and
// needs no inbound port. Reading a DM's content needs no privileged intent: Discord
// exempts "Content in DMs with the app" from the message content intent.
//
// THE TRUST BOUNDARY IS HERE. Only messages written by the one configured Discord
// user, or by Akuki's own bot account, ever leave this file. The runner credits
// every message in a direct conversation to Akuki's creator, so letting a third
// author through would put someone else's words in Zosia's mouth.
//
// No attachment download, for the same isolation reason as the Arena client:
// attachment metadata is parsed only so the adapter can log what it did not pass on.

import type {
  BotArenaAttachmentInfo,
  BotArenaMessage,
  BotArenaThread,
  FetchImpl,
} from "./botarena-client.js";
import { unknownPrincipalName } from "./directory.js";

export const DISCORD_API_BASE = "https://discord.com/api/v10";

/** Discord rejects a message body longer than this. */
export const DISCORD_MESSAGE_LIMIT = 2000;

/** DEFAULT (0) and REPLY (19). Everything else is a pin, a call, a join notice. */
const CONVERSATIONAL_MESSAGE_TYPES = new Set([0, 19]);

const DEFAULT_TIMEOUT_MS = 20_000;
const ERROR_BODY_CHARS = 300;
const PAGE_SIZE = 50;

export class DiscordError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
    this.name = "DiscordError";
  }
}

export type DiscordDmTransportOptions = {
  botToken: string;
  /** Akuki's own Discord bot user id. */
  botId: string;
  /** The one Discord user whose messages Akuki hears. */
  userId: string;
  apiBase?: string;
  fetchImpl?: FetchImpl;
  timeoutMs?: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function attachmentKind(contentType: string): BotArenaAttachmentInfo["kind"] {
  if (contentType.startsWith("image/")) {
    return "image";
  }
  if (contentType.startsWith("audio/")) {
    return "audio";
  }
  return "file";
}

function parseAttachment(raw: unknown): BotArenaAttachmentInfo | null {
  const record = asRecord(raw);
  if (record === null) {
    return null;
  }
  const contentType = asString(record.content_type);
  return {
    id: asString(record.id),
    kind: attachmentKind(contentType),
    filename: asString(record.filename),
    contentType,
    size: typeof record.size === "number" ? record.size : 0,
  };
}

/**
 * Split a reply into pieces Discord accepts, preferring a line break, then a space,
 * and cutting mid-word only when a single word is longer than the limit.
 */
export function splitForDiscord(text: string, limit = DISCORD_MESSAGE_LIMIT): string[] {
  const pieces: string[] = [];
  let rest = text;
  while (rest.length > limit) {
    const window = rest.slice(0, limit);
    const cut = Math.max(window.lastIndexOf("\n"), window.lastIndexOf(" "));
    const at = cut > 0 ? cut : limit;
    pieces.push(rest.slice(0, at).trimEnd());
    rest = rest.slice(at).trimStart();
  }
  if (rest !== "" || pieces.length === 0) {
    pieces.push(rest);
  }
  return pieces;
}

export class DiscordDmTransport {
  private readonly apiBase: string;
  private readonly fetchImpl: FetchImpl;
  private readonly timeoutMs: number;
  private readonly names = new Map<string, string>();
  private channelId: string | null = null;

  constructor(private readonly options: DiscordDmTransportOptions) {
    this.apiBase = (options.apiBase ?? DISCORD_API_BASE).replace(/\/+$/u, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * The DM channel as the adapter's one thread. The channel is opened lazily and
   * cached: opening it is idempotent on Discord's side, and doing it here rather
   * than at startup means a network blip at boot delays the first poll instead of
   * disabling Discord until the next restart.
   */
  async listThreads(): Promise<BotArenaThread[]> {
    const channelId = await this.openDm();
    return [
      {
        id: channelId,
        name: "Discord DM",
        lastMessageAt: null,
        participantBotIds: [this.options.botId],
        isArchived: false,
        direct: true,
      },
    ];
  }

  async getMessages(channelId: string): Promise<BotArenaMessage[]> {
    const raw = await this.request("GET", `/channels/${channelId}/messages?limit=${PAGE_SIZE}`);
    const messages: BotArenaMessage[] = [];
    for (const item of asArray(raw)) {
      const message = this.parseMessage(item, channelId);
      if (message !== null) {
        messages.push(message);
      }
    }
    return messages;
  }

  /**
   * Post a reply, split when it exceeds Discord's limit. Only the first piece is
   * marked as a reply, so the thread shows one answer rather than several quotes.
   * A failure part-way through throws, and the adapter's retry re-sends the whole
   * reply: a repeated piece is the price of never losing the rest.
   */
  async postMessage(
    channelId: string,
    body: { text: string; replyToId?: string | null },
  ): Promise<string | undefined> {
    let firstId: string | undefined;
    for (const [index, piece] of splitForDiscord(body.text).entries()) {
      const payload: Record<string, unknown> = {
        content: piece,
        // Akuki's text never pings anyone, whatever it happens to contain.
        allowed_mentions: { parse: [] },
      };
      if (index === 0 && body.replyToId !== undefined && body.replyToId !== null) {
        // fail_if_not_exists: false -- if she deleted the message, the answer still
        // arrives, as a plain message, instead of failing on every retry forever.
        payload.message_reference = { message_id: body.replyToId, fail_if_not_exists: false };
      }
      const created = asRecord(await this.request("POST", `/channels/${channelId}/messages`, payload));
      const id = created === null ? undefined : asString(created.id);
      firstId ??= id === "" ? undefined : id;
    }
    return firstId;
  }

  /** Display name for an author seen in a fetched message; the directory role. */
  async nameOf(id: string): Promise<string> {
    return this.names.get(id) ?? unknownPrincipalName(id);
  }

  private async openDm(): Promise<string> {
    if (this.channelId !== null) {
      return this.channelId;
    }
    const created = asRecord(
      await this.request("POST", "/users/@me/channels", { recipient_id: this.options.userId }),
    );
    const id = created === null ? "" : asString(created.id);
    if (id === "") {
      throw new DiscordError("POST /users/@me/channels returned no channel id", 200, "");
    }
    this.channelId = id;
    return id;
  }

  private parseMessage(raw: unknown, channelId: string): BotArenaMessage | null {
    const record = asRecord(raw);
    if (record === null) {
      return null;
    }
    const id = asString(record.id);
    const type = typeof record.type === "number" ? record.type : -1;
    const author = asRecord(record.author);
    const authorId = author === null ? "" : asString(author.id);
    if (id === "" || !CONVERSATIONAL_MESSAGE_TYPES.has(type)) {
      return null;
    }
    // The trust boundary -- see the header.
    if (authorId !== this.options.userId && authorId !== this.options.botId) {
      return null;
    }
    const name = author === null ? "" : asString(author.global_name) || asString(author.username);
    if (name !== "") {
      this.names.set(authorId, name);
    }
    const reference = asRecord(record.message_reference);
    return {
      id,
      threadId: channelId,
      senderType: authorId === this.options.botId ? "bot" : "user",
      senderId: authorId,
      text: asString(record.content),
      replyToId: reference === null ? null : asString(reference.message_id) || null,
      // Mentions decide addressing only in shared threads. In a direct
      // conversation everything is addressed to Akuki, so they are not carried.
      mentions: [],
      createdAt: asString(record.timestamp),
      attachments: asArray(record.attachments)
        .map(parseAttachment)
        .filter((attachment): attachment is BotArenaAttachmentInfo => attachment !== null),
      // Discord has no streaming messages: what the API returns is final.
      status: "final",
    };
  }

  private async request(method: "GET" | "POST", path: string, jsonBody?: unknown): Promise<unknown> {
    const response = await this.fetchImpl(`${this.apiBase}${path}`, {
      method,
      headers: {
        Authorization: `Bot ${this.options.botToken}`,
        // Discord requires this form of User-Agent for bots.
        "User-Agent": "DiscordBot (akuki-connector, 0.1.0)",
        Accept: "application/json",
        ...(jsonBody === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(jsonBody === undefined ? {} : { body: JSON.stringify(jsonBody) }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    const body = await response.text();
    if (!response.ok) {
      // A 429 lands here too. It is not retried in place: the next poll is the
      // retry, and the poll interval is far longer than Discord's usual wait.
      throw new DiscordError(
        `${method} ${path} -> ${response.status}`,
        response.status,
        body.slice(0, ERROR_BODY_CHARS),
      );
    }
    if (body === "") {
      return {};
    }
    try {
      return JSON.parse(body) as unknown;
    } catch {
      throw new DiscordError(
        `${method} ${path} -> ${response.status} with unparseable body`,
        response.status,
        body.slice(0, ERROR_BODY_CHARS),
      );
    }
  }
}
