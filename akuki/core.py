"""One turn of Akuki. This is the only place a turn happens.

`chat.py` is just a front end over `respond()`. When the BotArena connector arrives it
calls this same function, and none of his personality has to move to get there.
"""

from __future__ import annotations

import os

from . import persona
from .llm import Llm
from .memory import Memory, Message

AKUKI = "Akuki"
SILENT = "<silent>"


def _is_silence(reply: str) -> bool:
    """He asked to stay quiet -- or said nothing usable, which we treat the same way."""
    stripped = reply.strip()
    return not stripped or stripped.lower().startswith(SILENT)


def to_api_messages(history: list[Message]) -> list[dict[str, str]]:
    """Transcript rows -> Anthropic messages.

    His own lines become `assistant`; everyone else becomes `user`, name-prefixed so he can
    tell Zosia from Lunaria. Consecutive same-role lines are merged into one message (a
    thread is mostly other people talking in a row, and the API wants alternating roles),
    and any leading assistant turn is dropped so the list starts with `user`.
    """
    merged: list[dict[str, str]] = []
    for m in history:
        role = "assistant" if m.sender == AKUKI else "user"
        line = m.text if role == "assistant" else f"{m.sender}: {m.text}"
        if merged and merged[-1]["role"] == role:
            merged[-1]["content"] += "\n" + line
        else:
            merged.append({"role": role, "content": line})

    while merged and merged[0]["role"] == "assistant":
        merged.pop(0)
    return merged


def respond(
    text: str,
    *,
    sender: str,
    thread: str,
    memory: Memory,
    llm: Llm,
    is_bot: bool = False,
    history_limit: int | None = None,
) -> str | None:
    """Feed Akuki one message. Returns his reply, or None if he chose to stay quiet.

    He hears everything -- the incoming message is recorded whether or not he answers.
    A silent turn writes nothing of his own; his silence shouldn't clutter his memory.
    """
    memory.append(thread, sender, is_bot=is_bot, text=text)

    limit = history_limit if history_limit is not None else int(os.environ.get("AKUKI_HISTORY", "20"))
    api_messages = to_api_messages(memory.recent(thread, limit))

    reply = llm.reply(persona.system_prompt(), api_messages)
    if _is_silence(reply):
        return None

    memory.append(thread, AKUKI, is_bot=True, text=reply)
    return reply
