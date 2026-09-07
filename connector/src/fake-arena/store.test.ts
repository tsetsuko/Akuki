import { describe, expect, it } from "vitest";

import { FakeArenaStore, type FakeMessage } from "./store.js";

const THREAD = "t1";

function seeded(ids: string[]): FakeMessage[] {
  return ids.map((id, index) => ({
    id,
    thread_id: THREAD,
    sender_type: "user" as const,
    sender_id: "u1",
    text: `seeded ${id}`,
    reply_to_id: null,
    mentions: [],
    created_at: new Date(1_700_000_000_000 + index * 1000).toISOString(),
    status: "final" as const,
  }));
}

function store(messages: FakeMessage[]): FakeArenaStore {
  return new FakeArenaStore({
    threads: [{ id: THREAD, name: "t", participant_bot_ids: ["b1"], is_archived: false }],
    users: [{ id: "u1", name: "Zosia" }],
    bots: [{ id: "b1", name: "Akuki" }],
    messages,
  });
}

describe("FakeArenaStore ids", () => {
  it("starts past seeded ids, so a reseeded store cannot mint a duplicate", () => {
    // The restart test reseeds the store from its own contents and then expects the
    // reply to be a NEW message. With the counter restarting at zero it was handed
    // the id the human message already had -- a duplicate that would make a real
    // bug look like a fixture quirk.
    const posted = store(seeded(["fake-0001", "fake-0002"])).post({
      threadId: THREAD,
      senderId: "b1",
      senderType: "bot",
      text: "reply",
    });
    expect(posted.id).toBe("fake-0003");
  });

  it("ignores seeded ids that are not its own shape", () => {
    const posted = store(seeded(["abc", "uuid-like-thing"])).post({
      threadId: THREAD,
      senderId: "b1",
      senderType: "bot",
      text: "reply",
    });
    expect(posted.id).toBe("fake-0001");
  });

  it("gives every message a distinct timestamp", () => {
    const s = store([]);
    const first = s.post({ threadId: THREAD, senderId: "u1", senderType: "user", text: "a" });
    const second = s.post({ threadId: THREAD, senderId: "u1", senderType: "user", text: "b" });
    // Equal timestamps would make the adapter's contiguous-prefix floor ambiguous.
    expect(first.created_at).not.toBe(second.created_at);
  });
});
