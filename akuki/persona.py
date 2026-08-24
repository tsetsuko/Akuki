"""Who Akuki is, assembled from markdown you can edit while he's running.

Two files, two jobs:
  persona/akuki.md -- his voice. WHO he is. Changes rarely, and changes him a lot.
  persona/notes.md -- what he knows. WHO the others are, what stuck. You grow this by hand.

Both are re-read on every single turn, so editing them shows up in his next reply
without restarting the chat. That loop is the whole point of v1.

Only those two filenames are loaded. Anything else in persona/ is a source document for
a human -- akuki_personality_expansion.md is the design doc the seed was written from,
and it does NOT reach the model.
"""

from __future__ import annotations

import os
from pathlib import Path

PERSONA_DIR = Path(os.environ.get("AKUKI_PERSONA_DIR") or Path(__file__).resolve().parent.parent / "persona")

VOICE_FILE = "akuki.md"
NOTES_FILE = "notes.md"


def _read(name: str) -> str:
    path = PERSONA_DIR / name
    try:
        return path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return ""


def system_prompt() -> str:
    """The full system prompt: voice spec + curated notes."""
    voice = _read(VOICE_FILE)
    if not voice:
        raise FileNotFoundError(
            f"Akuki has no personality: {PERSONA_DIR / VOICE_FILE} is missing or empty."
        )
    notes = _read(NOTES_FILE)
    if not notes:
        return voice
    return f"{voice}\n\n---\n\n# Co Akuki wie (notatki)\n\n{notes}"
