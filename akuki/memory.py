"""Akuki's transcript.

The raw log: every message he sees or says, append-only, never edited by hand.
`recent()` is what gets replayed into each turn so he remembers the last few exchanges.

`Memory` is a Protocol on purpose. When borg lands it implements the same two methods
(over HTTP to the Node sidecar) and nothing else in Akuki has to change -- borg takes
over recall, this SQLite file stays as the raw log underneath.
"""

from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Protocol

SCHEMA = """
CREATE TABLE IF NOT EXISTS messages (
  id      INTEGER PRIMARY KEY,
  thread  TEXT    NOT NULL,
  sender  TEXT    NOT NULL,
  is_bot  INTEGER NOT NULL,
  text    TEXT    NOT NULL,
  ts      TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread, id);
"""


@dataclass(frozen=True)
class Message:
    thread: str
    sender: str
    is_bot: bool
    text: str
    ts: str


class Memory(Protocol):
    def append(self, thread: str, sender: str, is_bot: bool, text: str) -> None: ...
    def recent(self, thread: str, n: int = 20) -> list[Message]: ...


class SqliteMemory:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        if self.path.parent != Path(""):
            self.path.parent.mkdir(parents=True, exist_ok=True)
        self._db = sqlite3.connect(self.path)
        self._db.row_factory = sqlite3.Row
        self._db.executescript(SCHEMA)
        self._db.commit()

    def append(self, thread: str, sender: str, is_bot: bool, text: str) -> None:
        self._db.execute(
            "INSERT INTO messages (thread, sender, is_bot, text, ts) VALUES (?, ?, ?, ?, ?)",
            (thread, sender, int(is_bot), text, datetime.now(timezone.utc).isoformat()),
        )
        self._db.commit()

    def recent(self, thread: str, n: int = 20) -> list[Message]:
        """The last `n` messages of a thread, oldest first (prompt order)."""
        rows = self._db.execute(
            "SELECT thread, sender, is_bot, text, ts FROM messages "
            "WHERE thread = ? ORDER BY id DESC LIMIT ?",
            (thread, n),
        ).fetchall()
        return [
            Message(r["thread"], r["sender"], bool(r["is_bot"]), r["text"], r["ts"])
            for r in reversed(rows)
        ]

    def close(self) -> None:
        self._db.close()
