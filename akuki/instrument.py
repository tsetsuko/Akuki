"""Odczyt rozwoju Akukiego: snapshoty (JSON) + identity_events (SQLite).

Dlaczego to jest w Pythonie, a nie w TypeScripcie razem z resztą:
IdentityEventRepository.list() nie przyjmuje ZAKRESU CZASU — tylko
{recordType, recordId, limit}, limit domyślnie 50 (repository.ts:148).
Tabela `identity_events` ma za to oba indeksy po `ts DESC`, więc czytanie
jej wprost z SQLite daje dokładnie to, czego API nie daje: okno czasowe.
"""

from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

DATA_ROOT = Path("/home/zosia/projects/ai/akuki/data")
TENANT_DIR = DATA_ROOT / "akuki"
SNAPSHOT_DIR = DATA_ROOT / "snapshots"

# Wartości `record_type` to ZAMKNIĘTY enum (memory/identity/types.ts:5-18).
# `action` NIE jest enumem — to wolny TEXT, i bywa PODMIENIANY: identityEventAction()
# (identity/service.ts:119-126) przepisuje close/resolve/abandon/bump_urgency na
# "correction_apply", ilekroć ustawiony jest review_item_id. Dlatego nigdy nie grupuj
# wyłącznie po `action` — trzymaj przy nim record_type i review_item_id.
RELABELLED_BY_REVIEW = {"close", "resolve", "abandon", "bump_urgency"}


def _ts(ms: int | float | None) -> str:
    if ms is None:
        return "-"
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M:%S")


# --------------------------------------------------------------------------- snapshots

def load_snapshot(path: str | Path) -> dict[str, Any]:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def list_snapshots(directory: str | Path = SNAPSHOT_DIR) -> list[Path]:
    """Posortowane rosnąco po nazwie — nazwa zawiera znacznik czasu ISO."""
    return sorted(Path(directory).glob("*.json"))


@dataclass(frozen=True)
class CountDelta:
    key: str
    before: int
    after: int

    @property
    def delta(self) -> int:
        return self.after - self.before


def diff_counts(before: dict[str, Any], after: dict[str, Any]) -> list[CountDelta]:
    keys = sorted(set(before.get("counts", {})) | set(after.get("counts", {})))
    return [
        CountDelta(k, before.get("counts", {}).get(k, 0), after.get("counts", {}).get(k, 0))
        for k in keys
    ]


def _by_id(rows: Iterable[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {r["id"]: r for r in rows if isinstance(r, dict) and r.get("id")}


def diff_records(
    before: dict[str, Any], after: dict[str, Any], section: str, name: str
) -> tuple[list[dict], list[dict], list[tuple[dict, dict]]]:
    """Zwraca (dodane, usunięte, zmienione) dla jednej listy rekordów."""
    a = _by_id(before.get(section, {}).get(name, []))
    b = _by_id(after.get(section, {}).get(name, []))
    added = [b[i] for i in b.keys() - a.keys()]
    removed = [a[i] for i in a.keys() - b.keys()]
    changed = [(a[i], b[i]) for i in a.keys() & b.keys() if a[i] != b[i]]
    return added, removed, changed


# ---------------------------------------------------------------- identity_events

def read_identity_events(
    db_path: str | Path = TENANT_DIR / "borg.db",
    since_ms: int | None = None,
    until_ms: int | None = None,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    """Czyta changelog rozwoju. Otwiera bazę TYLKO DO ODCZYTU (mode=ro)."""
    sql = ("select id, record_type, record_id, action, reason, provenance_kind, "
           "review_item_id, ts from identity_events")
    where, params = [], []
    if since_ms is not None:
        where.append("ts >= ?")
        params.append(since_ms)
    if until_ms is not None:
        where.append("ts < ?")
        params.append(until_ms)
    if where:
        sql += " where " + " and ".join(where)
    sql += " order by ts asc, id asc"
    if limit is not None:
        sql += f" limit {int(limit)}"

    con = sqlite3.connect(f"file:{Path(db_path)}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    try:
        return [dict(r) for r in con.execute(sql, params)]
    finally:
        con.close()


def event_label(event: dict[str, Any]) -> str:
    """record_type/action, z jawnym oznaczeniem podmiany przez review."""
    action = event.get("action")
    if action == "correction_apply" and event.get("review_item_id") is not None:
        return f"{event['record_type']}/correction_apply (podmienione z jednego z: {'/'.join(sorted(RELABELLED_BY_REVIEW))})"
    return f"{event['record_type']}/{action}"


# ------------------------------------------------------------------- otwarte pytania

# Kto zapisał wiersz — czyta się z DWÓCH kolumn naraz, nie z jednej.
#   provenance_kind    = którym POTOKIEM to poszło
#   provenance_process = nazwa procesu wewnątrz tego potoku
# Do tego `unresolved_rumination_ticks` na wierszu pytania: TYLKO Ruminator go zwiększa,
# więc 0 oznacza, że Ruminator nigdy tego pytania nie ruszał.
PROVENANCE_MEANING = {
    "online": "w trakcie TURY (potok on-line)",
    "online_reflector": "wywołanie narzędzia tool.openQuestions.resolve przez sam MODEL "
                        "(src/tools/internal/open-questions-resolve.ts:119, "
                        'traceDecisionReason="autonomous_tool")',
    "offline": "cykl snu / maintenance (dream)",
    "manual": "człowiek — CLI albo zasiew",
    "system": "system",
    "episodes": "wyprowadzone z epizodów",
}


def read_open_questions(db_path: str | Path = TENANT_DIR / "borg.db") -> list[dict[str, Any]]:
    con = sqlite3.connect(f"file:{Path(db_path)}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    try:
        return [dict(r) for r in con.execute("select * from open_questions order by created_at asc")]
    finally:
        con.close()


def render_questions(rows: list[dict[str, Any]]) -> str:
    out: list[str] = [f"otwarte pytania: {len(rows)}"]
    for q in rows:
        out.append("")
        out.append(f"  {q['id']}  [{q['status']}]  urgency={q['urgency']}")
        out.append(f"  {q['question']}")
        kind = q.get("provenance_kind")
        out.append(f"    utworzone   : kind={kind!r} process={q.get('provenance_process')!r}")
        out.append(f"                  -> {PROVENANCE_MEANING.get(kind, 'nieznane')}")
        out.append(f"    source      : {q.get('source')}   (skąd wziął się pomysł na pytanie)")
        ticks = q.get("unresolved_rumination_ticks")
        out.append(f"    tiki Ruminatora: {ticks}" + ("   <- 0 = Ruminator NIGDY go nie dotknął" if ticks == 0 else ""))
        out.append(f"    utworzone   : {_ts(q.get('created_at'))}")
        if q.get("resolved_at"):
            out.append(f"    rozwiązane  : {_ts(q.get('resolved_at'))}")
            out.append(f"    uzasadnienie: {q.get('resolution_note')}")
    out.append("")
    out.append("UWAGA: żeby wiedzieć, KTO rozwiązał, popatrz na identity_events dla tego record_id")
    out.append("       (komenda: events) — wiersz pytania trzyma prowenienecję UTWORZENIA, a nie zmiany.")
    return "\n".join(out)


# ------------------------------------------------------------------------- raport

def render_diff(before: dict[str, Any], after: dict[str, Any]) -> str:
    out: list[str] = []
    out.append(f"snapshot A : {_ts(before.get('capturedAtMs'))}")
    out.append(f"snapshot B : {_ts(after.get('capturedAtMs'))}")
    out.append("")
    out.append("WEKTOR STANU (tylko to, co się ruszyło)")

    moved = [d for d in diff_counts(before, after) if d.delta != 0]
    if not moved:
        out.append("  (nic — rozwój ma być RZADKI, więc to jest poprawny wynik, nie błąd)")
    for d in moved:
        out.append(f"  {d.key:18} {d.before:5} -> {d.after:5}  ({d.delta:+d})")

    for section, name, title in (
        ("self", "openQuestions", "OTWARTE PYTANIA"),
        ("self", "values", "WARTOŚCI"),
        ("self", "traits", "CECHY"),
        ("self", "growthMarkers", "ZNACZNIKI WZROSTU"),
        ("procedural", "skills", "UMIEJĘTNOŚCI (Beta: alfa=successes+1, beta=failures+1)"),
        ("social", "profiles", "PROFILE SPOŁECZNE"),
    ):
        added, removed, changed = diff_records(before, after, section, name)
        if not (added or removed or changed):
            continue
        out.append("")
        out.append(title)
        for r in added:
            out.append(f"  + {json.dumps(r, ensure_ascii=False)}")
        for r in removed:
            out.append(f"  - {json.dumps(r, ensure_ascii=False)}")
        for old, new in changed:
            diffs = {k: (old.get(k), new.get(k)) for k in new if old.get(k) != new.get(k)}
            out.append(f"  ~ {new.get('id')}: " + ", ".join(f"{k}: {v[0]} -> {v[1]}" for k, v in diffs.items()))
    return "\n".join(out)


def list_experiments() -> list[Path]:
    """Katalogi eksperymentów — każdy to KOPIA Akukiego, nie on sam."""
    root = DATA_ROOT / "experiments"
    return sorted(d for d in root.glob("*/akuki") if d.is_dir()) if root.is_dir() else []


def main(argv: list[str] | None = None) -> int:
    import sys

    args = list(sys.argv[1:] if argv is None else argv)

    # --dir <ścieżka> wskazuje, KTÓREGO Akukiego czytamy: prawdziwego czy kopię.
    tenant = TENANT_DIR
    if "--dir" in args:
        i = args.index("--dir")
        tenant = Path(args[i + 1])
        del args[i:i + 2]

    db = tenant / "borg.db"
    cmd = args[0] if args else "diff"

    if cmd == "which":
        print(f"prawdziwy Akuki : {TENANT_DIR}")
        print(f"czytam teraz    : {tenant}" + ("   <- TO JEST KOPIA" if tenant != TENANT_DIR else "   <- to jest PRAWDZIWY"))
        exps = list_experiments()
        print(f"\nkopie eksperymentów ({len(exps)}):")
        for d in exps:
            print(f"  {d}")
        return 0

    if cmd == "questions":
        print(f"(czytam: {tenant})")
        print(render_questions(read_open_questions(db)))
        return 0

    if cmd == "events":
        print(f"(czytam: {tenant})")
        events = read_identity_events(db)
        print(f"identity_events: {len(events)}")
        for e in events:
            print(f"  #{e['id']:4} {_ts(e['ts'])}  {event_label(e)}")
            print(f"        record_id={e['record_id']}  provenance={e['provenance_kind']}")
            if e.get("reason"):
                print(f"        reason={e['reason']}")
        return 0

    if cmd == "diff":
        paths = [Path(p) for p in args[1:3]] if len(args) >= 3 else list_snapshots()[-2:]
        if len(paths) < 2:
            print("potrzebne dwa snapshoty; jest:", len(paths))
            return 1
        print(render_diff(load_snapshot(paths[0]), load_snapshot(paths[1])))
        return 0

    print(f"nieznana komenda: {cmd} (użyj: which | questions | events | diff) [--dir <katalog>]")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
