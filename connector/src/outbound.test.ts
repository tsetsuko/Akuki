import { describe, expect, it, vi } from "vitest";

import { createArenaOutboundConnector } from "./outbound.js";

function connector(postMessage: ReturnType<typeof vi.fn>) {
  return createArenaOutboundConnector({
    client: { postMessage } as never,
    sourceType: "botarena",
  });
}

describe("arena outbound connector", () => {
  it("posts a self-initiated message to the thread the session came from", async () => {
    const postMessage = vi.fn().mockResolvedValue("msg-1");

    const result = await connector(postMessage).deliver({
      session: { session_id: "sess_1", source_external_id: "thread-7" },
      message: { content: "czy nikt nie postawil tej linii?" },
    });

    expect(postMessage).toHaveBeenCalledWith("thread-7", {
      text: "czy nikt nie postawil tej linii?",
    });
    expect(result).toEqual({ status: "transported", externalMessageId: "msg-1" });
  });

  it("still reports transported when the arena returns no message id", async () => {
    const result = await connector(vi.fn().mockResolvedValue(undefined)).deliver({
      session: { session_id: "sess_1", source_external_id: "thread-7" },
      message: { content: "x" },
    });

    expect(result).toEqual({ status: "transported" });
  });

  it("throws rather than dropping a message when the session has no thread", async () => {
    const postMessage = vi.fn();

    await expect(
      connector(postMessage).deliver({
        session: { session_id: "sess_2", source_external_id: null },
        message: { content: "x" },
      }),
    ).rejects.toThrow(/no Bot Arena thread id/u);
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("lets a transport failure surface, so borg can record it", async () => {
    const postMessage = vi.fn().mockRejectedValue(new Error("HTTP 503"));

    await expect(
      connector(postMessage).deliver({
        session: { session_id: "sess_3", source_external_id: "thread-7" },
        message: { content: "x" },
      }),
    ).rejects.toThrow(/HTTP 503/u);
  });
});
