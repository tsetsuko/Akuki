// The transport for messages Akuki starts himself.
//
// Ordinary replies do NOT come through here. The adapter posts those itself, after
// persisting the reply, which is what makes exactly-one-post survive a crash. borg only
// hands a message to a connector on a turn whose origin is `directed_outbound` -- the
// kind produced by the autonomous outbound tool -- so registering this one adds a second
// route for self-initiated messages without touching the reply path.
//
// Why it exists: Akuki accumulates open questions and, with no connector registered, has
// no way to raise one unless somebody speaks to him first. Every turn he has ever taken
// was a reaction. This is the route out.
//
// Transport only, like every other file on this side of the boundary: no borg import, and
// `boundary.test.ts` fails the build if that changes. The session shape below is the part
// of borg's session record this needs, written locally so the type does not cross either.

import type { BotArenaClient } from "./botarena-client.js";
import type { ArenaLog } from "./adapter.js";

/** The fields of a borg session record this transport reads. Structurally compatible. */
export type OutboundSessionView = {
  readonly session_id: string;
  readonly source_external_id?: string | null;
  readonly label?: string | null;
};

export type OutboundDeliverInput = {
  readonly session: OutboundSessionView;
  readonly message: { readonly content: string };
};

export type OutboundDeliverResult = {
  readonly status: "transported";
  readonly externalMessageId?: string;
};

export type ArenaOutboundConnector = {
  readonly sourceType: string;
  deliver(input: OutboundDeliverInput): Promise<OutboundDeliverResult>;
};

export type ArenaOutboundConnectorOptions = {
  client: Pick<BotArenaClient, "postMessage">;
  sourceType: string;
  log?: ArenaLog;
};

/**
 * A thread id is the only thing this needs from the session, and a session without one
 * cannot be posted to at all. Throwing is the documented way a connector reports failure:
 * borg turns the throw into a recorded `transport_failed` rather than a silent drop, which
 * is what we want -- a self-initiated message that vanished should be countable.
 */
export function createArenaOutboundConnector(
  options: ArenaOutboundConnectorOptions,
): ArenaOutboundConnector {
  const log = options.log ?? (() => {});

  return {
    sourceType: options.sourceType,
    async deliver(input: OutboundDeliverInput): Promise<OutboundDeliverResult> {
      const threadId = input.session.source_external_id ?? null;

      if (threadId === null || threadId === "") {
        throw new Error(
          `session ${input.session.session_id} has no Bot Arena thread id, so a self-initiated message cannot be delivered`,
        );
      }

      const messageId = await options.client.postMessage(threadId, {
        text: input.message.content,
      });

      log("info", `autonomous post to thread ${threadId}: message=${messageId ?? "unknown"}`);

      return messageId === undefined
        ? { status: "transported" }
        : { status: "transported", externalMessageId: messageId };
    },
  };
}
