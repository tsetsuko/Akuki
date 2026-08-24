"""Terminal chat with Akuki.

    ANTHROPIC_API_KEY="$(pass show akuki/anthropic-key)" python -m akuki.chat

Commands:
    /as <imię> <tekst>   powiedz coś jako inny bot (Lunaria, Fishy, Sol...)
    /notes               otwórz persona/notes.md w $EDITOR
    /voice               otwórz persona/akuki.md w $EDITOR
    /quit                wyjdź

`/as` is the important one. In a one-to-one terminal Akuki is always being addressed, so
his silence rule never fires and you can't tell whether it works. `/as Lunaria ...` fakes
the other bots talking past him, which is the only way to check that he really keeps quiet.
"""

from __future__ import annotations

import os
import readline  # noqa: F401  -- gives the input() prompt arrow keys and history
import subprocess
import sys

from . import persona
from .core import respond
from .llm import Llm, LlmError
from .memory import SqliteMemory

THREAD = os.environ.get("AKUKI_THREAD", "terminal")

DIM = "\033[2m"
CYAN = "\033[36m"
RESET = "\033[0m"

BANNER = f"""{DIM}Akuki 悪機 -- wątek "{THREAD}"
/as <imię> <tekst>   mów jako inny bot      /notes   edytuj jego notatki
/voice               edytuj jego charakter  /quit    wyjdź{RESET}"""


def _edit(filename: str) -> None:
    path = persona.PERSONA_DIR / filename
    editor = os.environ.get("EDITOR") or os.environ.get("VISUAL") or "nano"
    try:
        subprocess.call([editor, str(path)])
    except FileNotFoundError:
        print(f"{DIM}(nie znalazłem edytora: {editor} -- ustaw $EDITOR){RESET}")
        return
    print(f"{DIM}(zapisane -- działa od następnej wiadomości){RESET}")


def _turn(text: str, sender: str, is_bot: bool, memory: SqliteMemory, llm: Llm) -> None:
    try:
        reply = respond(text, sender=sender, thread=THREAD, memory=memory, llm=llm, is_bot=is_bot)
    except LlmError as err:
        print(f"{DIM}{err}{RESET}")
        return
    if reply is None:
        print(f"{DIM}(Akuki milczy){RESET}")
    else:
        print(f"{CYAN}akuki>{RESET} {reply}")


def main() -> int:
    owner = os.environ.get("AKUKI_OWNER", "zosia")
    db = os.environ.get("AKUKI_DB", ".akuki/akuki.db")

    try:
        persona.system_prompt()
    except FileNotFoundError as err:
        print(err, file=sys.stderr)
        return 1

    memory = SqliteMemory(db)
    llm = Llm()
    print(BANNER)

    try:
        while True:
            try:
                line = input(f"{owner}> ").strip()
            except (EOFError, KeyboardInterrupt):
                print()
                break

            if not line:
                continue
            if line in ("/quit", "/exit", "/q"):
                break
            if line == "/notes":
                _edit(persona.NOTES_FILE)
                continue
            if line == "/voice":
                _edit(persona.VOICE_FILE)
                continue

            if line.startswith("/as "):
                rest = line[4:].strip()
                name, _, said = rest.partition(" ")
                said = said.strip()
                if not name or not said:
                    print(f"{DIM}(użycie: /as Lunaria jakiś tekst){RESET}")
                    continue
                print(f"{DIM}{name}> {said}{RESET}")
                _turn(said, sender=name, is_bot=True, memory=memory, llm=llm)
                continue

            if line.startswith("/"):
                print(f"{DIM}(nie znam takiej komendy){RESET}")
                continue

            _turn(line, sender=owner, is_bot=False, memory=memory, llm=llm)
    finally:
        memory.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
