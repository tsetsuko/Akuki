// HTTP surface of the fake Arena: the five endpoints the connector uses, plus a
// small page to type into.
//
// THE CREDENTIAL SPLIT IS ENFORCED, not waved through. Reads must carry the
// ba_session cookie and writes must carry the bot's bearer token, and the wrong one
// gets a 401 exactly as the real API gives. This is worth the few lines: the split
// is easy to get backwards -- reaching for the token to read /api/bots does not work
// on the real Arena either -- and a permissive fake would let a rehearsal pass while
// the same configuration failed live.
//
// node:http only, so the package gains no dependency for a test double.

import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

import { FakeArenaStore } from "./store.js";
import { renderPage } from "./ui.js";

export type FakeArenaCredentials = {
  sessionCookie: string;
  botToken: string;
  /** Akuki's bot id, so the page can label his posts and the seed can seat him. */
  botId: string;
};

export type FakeArenaOptions = {
  store: FakeArenaStore;
  credentials: FakeArenaCredentials;
  /** Who a message typed into the page is from. */
  humanId: string;
};

const JSON_HEADERS = { "content-type": "application/json" } as const;

export function createFakeArena(options: FakeArenaOptions): Server {
  return createServer((request, response) => {
    void handle(request, response, options).catch((error: unknown) => {
      send(response, 500, { error: String(error) });
    });
  });
}

async function handle(
  request: IncomingMessage,
  response: ServerResponse,
  options: FakeArenaOptions,
): Promise<void> {
  const url = new URL(request.url ?? "/", "http://localhost");
  const path = url.pathname;
  const method = request.method ?? "GET";

  // --- the page, and the one route it posts to -----------------------------------
  //
  // Deliberately NOT under /api: everything below /api is the surface the connector
  // sees, and mixing a convenience route into it would mean the rehearsal exercised
  // an endpoint the real Arena does not have.
  if (method === "GET" && path === "/") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(renderPage(options.store, options.credentials.botId, options.humanId));
    return;
  }
  if (method === "POST" && path === "/say") {
    const body = await readBody(request);
    const text = new URLSearchParams(body).get("text") ?? "";
    const threadId = new URLSearchParams(body).get("thread") ?? "";
    if (text.trim() !== "" && options.store.hasThread(threadId)) {
      options.store.post({
        threadId,
        senderId: options.humanId,
        senderType: "user",
        text,
        mentions: [options.credentials.botId],
      });
    }
    response.writeHead(303, { location: "/" });
    response.end();
    return;
  }

  // --- the connector's five endpoints --------------------------------------------
  if (method === "GET") {
    if (!hasSessionCookie(request, options.credentials.sessionCookie)) {
      send(response, 401, { error: "reads need the ba_session cookie, not the bot token" });
      return;
    }
    if (path === "/api/threads") {
      send(response, 200, options.store.listThreads());
      return;
    }
    if (path === "/api/users") {
      send(response, 200, options.store.listUsers());
      return;
    }
    if (path === "/api/bots") {
      send(response, 200, options.store.listBots());
      return;
    }
    const messages = /^\/api\/threads\/([^/]+)\/messages$/u.exec(path);
    if (messages !== null) {
      const threadId = decodeURIComponent(messages[1] ?? "");
      if (!options.store.hasThread(threadId)) {
        send(response, 404, { error: `no such thread: ${threadId}` });
        return;
      }
      send(response, 200, options.store.listMessages(threadId));
      return;
    }
  }

  if (method === "POST") {
    const posted = /^\/api\/threads\/([^/]+)\/messages$/u.exec(path);
    if (posted !== null) {
      if (!hasBearer(request, options.credentials.botToken)) {
        send(response, 401, { error: "writes need the bot bearer token, not the cookie" });
        return;
      }
      const threadId = decodeURIComponent(posted[1] ?? "");
      if (!options.store.hasThread(threadId)) {
        send(response, 404, { error: `no such thread: ${threadId}` });
        return;
      }
      const raw = await readBody(request);
      const parsed = raw.trim() === "" ? {} : (JSON.parse(raw) as Record<string, unknown>);
      const message = options.store.post({
        threadId,
        senderId: options.credentials.botId,
        senderType: "bot",
        text: typeof parsed.text === "string" ? parsed.text : "",
        replyToId: typeof parsed.reply_to_id === "string" ? parsed.reply_to_id : null,
      });
      send(response, 200, { message });
      return;
    }
  }

  send(response, 404, { error: `no route for ${method} ${path}` });
}

function hasSessionCookie(request: IncomingMessage, expected: string): boolean {
  const cookie = request.headers.cookie ?? "";
  return cookie
    .split(";")
    .map((part) => part.trim())
    .includes(`ba_session=${expected}`);
}

function hasBearer(request: IncomingMessage, expected: string): boolean {
  return request.headers.authorization === `Bearer ${expected}`;
}

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk as Buffer));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function send(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, JSON_HEADERS);
  response.end(JSON.stringify(body));
}
