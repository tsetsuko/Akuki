"""Dziennik rozwoju Akukiego: pobiera snapshoty z VPS-a i pisze notatkę z kandydatami.

Podział pracy jest celowy. Skrypt NIE pisze obserwacji i niczego nie interpretuje.
Zbiera tylko dwie rzeczy, z których człowiek potem wybiera:

  - pasek liczb: tempo odpowiedzi i decyzje mówić/milczeć z Areny i dziennika usługi,
  - kandydatów: co ruszyło się w stanie (snapshoty) i co Akuki powiedział w tym okresie.

Obserwacja w dzienniku powstaje ręcznie, z szablonu. Gdyby skrypt sam ją pisał,
dziennik mierzyłby to, co skrypt umie zauważyć, a nie to, co się wydarzyło.

Użycie:
    python -m akuki.dziennik pobierz           # tylko snapshoty z VPS-a
    python -m akuki.dziennik kandydaci         # od ostatniej notatki z kandydatami
    python -m akuki.dziennik kandydaci --od 2026-10-15
"""

from __future__ import annotations

import io
import json
import re
import statistics
import subprocess
import tarfile
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

from akuki.instrument import SNAPSHOT_DIR, diff_counts, diff_records, list_snapshots, load_snapshot

REPO = Path(__file__).resolve().parent.parent
VAULT = REPO / "dziennik"
CANDIDATES_DIR = VAULT / "kandydaci"

SSH = ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=15",
       "-i", str(Path.home() / ".ssh/akuki_oci"), "ubuntu@100.124.237.35"]
REMOTE_SNAPSHOT_DIR = "/var/lib/akuki/snapshots"
REMOTE_ENV = "/etc/akuki/akuki.env"

# API Areny podaje created_at bez strefy, w czasie polskim. Sprawdzone 2026-10-19:
# post zalogowany przez usługę o 16:15:37 UTC ma w API created_at 18:15:37.
ARENA_TZ = ZoneInfo("Europe/Warsaw")

# Uruchamiany NA VPS-ie, z env usługi, bo ciasteczko do odczytu Areny jest tylko tam
# i nie powinno przechodzić przez laptopa. Na wyjściu są wyłącznie wiadomości i nazwy.
REMOTE_FETCH = r'''
import json, os, sys, urllib.parse, urllib.request
base = os.environ["AKUKI_ARENA_API_BASE"].rstrip("/")
cookie = os.environ["AKUKI_ARENA_SESSION_COOKIE"]
since = sys.argv[1]
def get(path):
    req = urllib.request.Request(base + path, headers={"Cookie": "ba_session=" + cookie})
    return json.load(urllib.request.urlopen(req, timeout=30))
threads = {}
for tid in filter(None, os.environ.get("AKUKI_ARENA_THREAD_ALLOWLIST", "").split(",")):
    out, before = [], None
    while True:
        q = "" if before is None else "?before=" + urllib.parse.quote(before)
        page = get(f"/api/threads/{tid.strip()}/messages{q}")
        msgs = page["messages"]
        if not msgs:
            break
        out = msgs + out
        before = msgs[0]["created_at"]
        if before < since or not page.get("has_more"):
            break
    threads[tid.strip()] = out
names = {u["id"]: u["name"] for u in get("/api/users")["users"]}
names.update({b["id"]: b["name"] for b in get("/api/bots")["bots"]})
json.dump({"bot_id": os.environ["AKUKI_ARENA_BOT_ID"], "names": names, "threads": threads}, sys.stdout)
'''

TURN_LINE = re.compile(r"turn [0-9a-f-]+/([0-9a-f-]+): emitted=\w+ kind=(\w+)")


def _remote(command: str, stdin: bytes | None = None) -> bytes:
    return subprocess.run(SSH + [command], input=stdin, capture_output=True, check=True).stdout


# ------------------------------------------------------------------------ snapshoty

def pull_snapshots(target: Path = SNAPSHOT_DIR) -> list[str]:
    """Dociąga z VPS-a snapshoty, których jeszcze nie ma lokalnie. Zwraca nowe nazwy."""
    target.mkdir(parents=True, exist_ok=True)
    try:
        raw = _remote(f"sudo tar -C {REMOTE_SNAPSHOT_DIR} -cf - .")
    except subprocess.CalledProcessError as error:
        # Brak katalogu = timer jeszcze nie zadziałał. Notatka i tak powstaje, z lokalnych.
        print("nie pobrałem snapshotów:", error.stderr.decode().strip())
        return []
    new: list[str] = []
    with tarfile.open(fileobj=io.BytesIO(raw)) as tar:
        for member in tar.getmembers():
            name = Path(member.name).name
            if not member.isfile() or not name.endswith(".json") or (target / name).exists():
                continue
            (target / name).write_bytes(tar.extractfile(member).read())
            new.append(name)
    return sorted(new)


def pick_snapshots(paths: list[Path], start_ms: int) -> tuple[dict | None, dict | None]:
    """Najnowszy snapshot sprzed początku okresu i najnowszy w ogóle.

    Gdy żaden nie jest starszy od początku okresu, bierze najstarszy, jaki jest:
    porównanie obejmie wtedy krótszy odcinek, i notatka mówi to wprost.
    """
    snaps = [load_snapshot(p) for p in paths]
    if len(snaps) < 2:
        return None, snaps[-1] if snaps else None
    earlier = [s for s in snaps if s["capturedAtMs"] <= start_ms]
    before = earlier[-1] if earlier else snaps[0]
    after = snaps[-1]
    return (before, after) if before is not after else (None, after)


# --------------------------------------------------------------------------- Arena

def arena_time(created_at: str) -> datetime:
    return datetime.fromisoformat(created_at[:26]).replace(tzinfo=ARENA_TZ)


@dataclass(frozen=True)
class Reply:
    at: datetime
    to_name: str
    trigger: str
    text: str
    latency_s: float | None


def akuki_replies(messages: list[dict], bot_id: str, names: dict[str, str]) -> list[Reply]:
    by_id = {m["id"]: m for m in messages}
    out = []
    for m in messages:
        if m["sender_id"] != bot_id:
            continue
        trigger = by_id.get(m.get("reply_to_id") or "")
        latency = None
        if trigger is not None:
            latency = (arena_time(m["created_at"]) - arena_time(trigger["created_at"])).total_seconds()
        out.append(Reply(
            at=arena_time(m["created_at"]),
            to_name=names.get(trigger["sender_id"], "?") if trigger else "?",
            trigger=trigger["text"] if trigger else "",
            text=m["text"],
            latency_s=latency,
        ))
    return out


def addressed_to(message: dict, bot_id: str, by_id: dict[str, dict]) -> bool:
    """Do Akukiego = oznaczony albo odpowiedź na jego wiadomość. Tylko pola struktury."""
    if bot_id in (message.get("mentions") or []):
        return True
    parent = by_id.get(message.get("reply_to_id") or "")
    return parent is not None and parent["sender_id"] == bot_id


def turn_kinds(journal: str, messages: list[dict], bot_id: str) -> Counter:
    """Decyzje z dziennika usługi, rozbite na to, czy wiadomość była do niego."""
    by_id = {m["id"]: m for m in messages}
    kinds: Counter = Counter()
    for match in TURN_LINE.finditer(journal):
        message = by_id.get(match.group(1))
        if message is None:
            continue
        kinds[(match.group(2), addressed_to(message, bot_id, by_id))] += 1
    return kinds


def latency_summary(replies: list[Reply]) -> str:
    values = sorted(r.latency_s for r in replies if r.latency_s is not None)
    if not values:
        return "brak odpowiedzi z przypisaną wiadomością"
    p90 = values[min(len(values) - 1, int(0.9 * len(values)))]
    return (f"n={len(values)}, mediana {statistics.median(values):.0f} s, "
            f"p90 {p90:.0f} s, max {values[-1]:.0f} s")


# ------------------------------------------------------------------------ notatka

KIND_MEANING = {
    "message": "odpowiedział",
    "observed": "milczał z wyboru",
    "suppressed": "zatrzymała go bramka inhibicji",
    "assessed": "usłyszał w kolejce, bez odpowiedzi",
}


def _ts(ms: int) -> str:
    return datetime.fromtimestamp(ms / 1000, tz=ARENA_TZ).strftime("%Y-%m-%d %H:%M")


def _quote(text: str) -> str:
    return "\n".join("> " + line for line in text.strip().splitlines())


def render_state(before: dict | None, after: dict | None, start_ms: int) -> list[str]:
    out = ["## Kandydaci ze stanu", ""]
    if after is None:
        return out + ["Brak snapshotów. Sprawdź, czy na VPS-ie działa `akuki-snapshot.timer`.", ""]
    if before is None:
        out += [f"Jest tylko jeden snapshot ({_ts(after['capturedAtMs'])}), więc nie ma z czym porównać.",
                "Poniżej to, co ten snapshot pozwala odczytać sam z siebie.", ""]
    else:
        out += [f"Porównanie: {_ts(before['capturedAtMs'])} → {_ts(after['capturedAtMs'])}."]
        if before["capturedAtMs"] > start_ms:
            out += ["Uwaga: najstarszy snapshot jest młodszy niż początek okresu, porównanie jest krótsze."]
        out.append("")
        moved = [d for d in diff_counts(before, after) if d.delta != 0]
        out += ["### Liczniki, które się ruszyły", ""]
        out += [f"- {d.key}: {d.before} → {d.after} ({d.delta:+d})" for d in moved] or [
            "- nic (rozwój ma być rzadki, to poprawny wynik)"]
        out.append("")
        for section, name, title, label in (
            ("self", "traits", "Cechy", "label"),
            ("self", "values", "Wartości", "label"),
            ("procedural", "skills", "Umiejętności", "id"),
        ):
            added, removed, changed = diff_records(before, after, section, name)
            if not (added or removed or changed):
                continue
            out += [f"### {title}", ""]
            out += [f"- nowe: {r.get(label)} `{json.dumps(r, ensure_ascii=False)}`" for r in added]
            out += [f"- zniknęło: {r.get(label)}" for r in removed]
            for old, new in changed:
                diffs = ", ".join(f"{k}: {old.get(k)} → {new.get(k)}" for k in new if old.get(k) != new.get(k))
                out.append(f"- zmiana {new.get(label)}: {diffs}")
            out.append("")

    out += ["### Cechy teraz", ""]
    out += [f"- {t.get('label')} ({t.get('state')}): siła {t.get('strength', 0):.2f}, "
            f"dowody {t.get('evidence_count')}" for t in after["self"]["traits"]] or ["- brak"]
    out.append("")

    markers = [g for g in after["self"]["growthMarkers"] if g.get("ts", 0) >= start_ms]
    out += [f"### Znaczniki wzrostu z tego okresu ({len(markers)})", "",
            "Pisze je sam Akuki w nocnej autonarracji. To jego opis zmiany, nie pomiar.", ""]
    for g in sorted(markers, key=lambda g: g["ts"]):
        out += [f"**{_ts(g['ts'])} · {g.get('category')}** (pewność {g.get('confidence')})", "",
                _quote(g.get("what_changed", "")), ""]

    questions = [q for q in after["self"]["openQuestions"] if q.get("created_at", 0) >= start_ms]
    out += [f"### Nowe otwarte pytania ({len(questions)})", ""]
    by_source = Counter(q.get("source") for q in questions)
    if by_source:
        out += ["Źródła: " + ", ".join(f"{k} {v}" for k, v in by_source.most_common()), ""]
    out += [f"- [{q.get('status')}] {q.get('question')}" for q in sorted(questions, key=lambda q: q["created_at"])]
    out.append("")
    return out


def render_arena(data: dict, journal: str, start: datetime) -> tuple[list[str], list[str]]:
    """Zwraca osobno pasek liczb i pełną listę wypowiedzi, bo w notatce dzieli je stan."""
    out = ["## Pasek liczb z Areny", ""]
    replies_all: list[Reply] = []
    for tid, messages in data["threads"].items():
        in_period = [m for m in messages if arena_time(m["created_at"]) >= start]
        replies = akuki_replies(in_period, data["bot_id"], data["names"])
        replies_all += replies
        kinds = turn_kinds(journal, in_period, data["bot_id"])
        out += [f"Wątek `{tid[:8]}`: {len(in_period)} wiadomości, w tym {len(replies)} od Akukiego.", "",
                f"- tempo odpowiedzi: {latency_summary(replies)}"]
        for kind, meaning in KIND_MEANING.items():
            to_him, other = kinds[(kind, True)], kinds[(kind, False)]
            if to_him or other:
                out.append(f"- {meaning}: {to_him} do niego, {other} nie do niego")
        out.append("")

    said = ["## Co powiedział", "",
            "Materiał do obserwacji. Pełna lista, bez wyboru: wybór jest Twój.", ""]
    for r in replies_all:
        latency = f", {r.latency_s:.0f} s" if r.latency_s is not None else ""
        trigger = r.trigger.strip().replace("\n", " ")
        said += [f"**{r.at:%m-%d %H:%M}** → {r.to_name}{latency}",
                f"> *{trigger[:200]}{'…' if len(trigger) > 200 else ''}*", ">",
                _quote(r.text), ""]
    return out, said


def default_start() -> datetime:
    notes = sorted(CANDIDATES_DIR.glob("*.md"))
    if notes:
        return datetime.fromisoformat(notes[-1].stem).replace(tzinfo=ARENA_TZ)
    return datetime.now(ARENA_TZ) - timedelta(days=7)


def write_candidates(start: datetime) -> Path:
    pull_snapshots()
    start_ms = int(start.timestamp() * 1000)
    before, after = pick_snapshots(list_snapshots(), start_ms)

    since = start.strftime("%Y-%m-%dT%H:%M:%S")
    data = json.loads(_remote(
        f"sudo bash -c 'set -a; . {REMOTE_ENV}; set +a; python3 - {since}'", REMOTE_FETCH.encode()))
    journal = _remote(f"sudo journalctl -u akuki --since @{start_ms // 1000} --no-pager -o cat").decode()

    now = datetime.now(ARENA_TZ)
    lines = ["---", f"okres_od: {start:%Y-%m-%d %H:%M}", f"okres_do: {now:%Y-%m-%d %H:%M}",
             "typ: kandydaci", "---", "",
             f"# Kandydaci {start:%Y-%m-%d} – {now:%Y-%m-%d}", "",
             "Wygenerowane przez `python -m akuki.dziennik kandydaci`. Nie edytuj: obserwacje",
             "pisz w `obserwacje/` z szablonu i linkuj tutaj, jeśli coś stąd wzięłaś.", ""]
    stats, said = render_arena(data, journal, start)
    lines += stats + render_state(before, after, start_ms) + said

    CANDIDATES_DIR.mkdir(parents=True, exist_ok=True)
    path = CANDIDATES_DIR / f"{now:%Y-%m-%d}.md"
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def main(argv: list[str] | None = None) -> int:
    import sys

    args = list(sys.argv[1:] if argv is None else argv)
    cmd = args[0] if args else "kandydaci"
    if cmd == "pobierz":
        new = pull_snapshots()
        print(f"nowe snapshoty: {len(new)}", *new, sep="\n  ")
        return 0
    if cmd == "kandydaci":
        start = default_start()
        if "--od" in args:
            start = datetime.fromisoformat(args[args.index("--od") + 1]).replace(tzinfo=ARENA_TZ)
        print("zapisane:", write_candidates(start))
        return 0
    print(f"nieznana komenda: {cmd} (użyj: pobierz | kandydaci [--od RRRR-MM-DD])")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
