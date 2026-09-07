// The fake Arena's state, with no HTTP anywhere near it.
//
// WHY THIS EXISTS: a rehearsal needs somewhere for Akuki to actually run turns and
// actually keep what he learns, without the real Arena. Putting a throwaway copy of
// him on the real Arena would be the worst of both -- the memory is discarded, but
// the social trace is permanent and public: other bots receive callbacks, people see
// him arrive, and his first appearance is a rehearsal he does not remember.
//
// So the environment is fake and the connector is NOT. Nothing in src/*.ts changes
// for this: the connector already talks to five endpoints, so a local server that
// answers those five is a complete stand-in, reached by pointing
// AKUKI_ARENA_API_BASE at it.
//
// This is a STAND-IN, not a model of BotArena. It does not simulate streaming
// messages, attachments, bot-to-bot chains or callbacks. What it reproduces is the
// shape of the five responses the client parses and the credential split between
// reads and writes -- which is the part a rehearsal has to get right.

export type FakeMessage = {
  id: string;
  thread_id: string;
  sender_type: "user" | "bot" | "system";
  sender_id: string;
  text: string;
  reply_to_id: string | null;
  mentions: string[];
  created_at: string;
  status: "final" | "streaming";
};

export type FakeThread = {
  id: string;
  name: string;
  participant_bot_ids: string[];
  is_archived: boolean;
};

export type FakePrincipal = { id: string; name: string };

export type FakeArenaSeed = {
  threads: FakeThread[];
  users: FakePrincipal[];
  bots: FakePrincipal[];
  messages?: FakeMessage[];
};

export class FakeArenaStore {
  private readonly threads: FakeThread[];
  private readonly users: FakePrincipal[];
  private readonly bots: FakePrincipal[];
  private readonly messages: FakeMessage[];
  private counter = 0;

  constructor(seed: FakeArenaSeed, private readonly now: () => number = Date.now) {
    this.threads = [...seed.threads];
    this.users = [...seed.users];
    this.bots = [...seed.bots];
    this.messages = [...(seed.messages ?? [])];
    // Start past anything seeded, so a reseeded store cannot mint an id a seeded
    // message already has. Found during the restart test of 2026-09-07: the store
    // was reseeded from its own contents and then handed Akuki's reply the same
    // `fake-0001` the human message had. Harmless there, but a double double takes
    // a real bug and makes it look like a fixture quirk.
    this.counter = this.messages.reduce((highest, message) => {
      const digits = /^fake-(\d+)$/u.exec(message.id)?.[1];
      return digits === undefined ? highest : Math.max(highest, Number.parseInt(digits, 10));
    }, 0);
  }

  listThreads(): { threads: FakeThread[] } {
    // last_message_at is deliberately omitted: the client treats a missing value as
    // null and orders by the messages themselves, so a fake that supplied it could
    // hide a bug where the real ordering is wrong.
    return { threads: this.threads.filter((thread) => !thread.is_archived) };
  }

  hasThread(threadId: string): boolean {
    return this.threads.some((thread) => thread.id === threadId);
  }

  /**
   * The newest 50, which is what the real endpoint returns -- confirmed twice: the
   * live dry run of 2026-09-07 came back with exactly 50 for a thread whose newest
   * message was present, and sol-connector's README describes the same window. A
   * fake that returned everything would make an untested paging path look tested.
   */
  listMessages(threadId: string): { messages: FakeMessage[] } {
    const all = this.messages
      .filter((message) => message.thread_id === threadId)
      .sort((left, right) => Date.parse(left.created_at) - Date.parse(right.created_at));
    return { messages: all.slice(-50) };
  }

  listUsers(): { users: FakePrincipal[] } {
    return { users: this.users };
  }

  listBots(): { bots: FakePrincipal[] } {
    return { bots: this.bots };
  }

  /** Appends a message and returns it in the shape the POST endpoint answers with. */
  post(input: {
    threadId: string;
    senderId: string;
    senderType: FakeMessage["sender_type"];
    text: string;
    replyToId?: string | null;
    mentions?: string[];
  }): FakeMessage {
    this.counter += 1;
    const message: FakeMessage = {
      id: `fake-${String(this.counter).padStart(4, "0")}`,
      thread_id: input.threadId,
      sender_type: input.senderType,
      sender_id: input.senderId,
      text: input.text,
      reply_to_id: input.replyToId ?? null,
      mentions: input.mentions ?? [],
      // Every message gets a distinct timestamp. Two messages sharing one would make
      // the adapter's contiguous-prefix floor ambiguous, and a rehearsal that
      // stumbles on its own fixture teaches nothing about the connector.
      created_at: new Date(this.now() + this.counter).toISOString(),
      status: "final",
    };
    this.messages.push(message);
    return message;
  }

  nameOf(id: string): string {
    const found = [...this.users, ...this.bots].find((principal) => principal.id === id);
    return found?.name ?? id;
  }
}
