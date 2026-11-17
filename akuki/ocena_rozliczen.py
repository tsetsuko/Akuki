"""TASK-052: ocena rozliczeń przewidywań na ślepo, poza torem tury.

Pytanie zadania: czy to, co model nazywa błędem 0,3–0,6, jest zaskoczeniem pośrednim
w sensie badań (Kidd i in. 2012), czy zwykłym częściowym trafieniem. Odpowiedzieć może
tylko ktoś inny niż model, więc skrypt robi dwie rzeczy i niczego nie ocenia sam:

  arkusz    losuje rozliczenia z żywej pamięci (tylko do odczytu) i pisze arkusz bez
            oceny modelu oraz osobny klucz z tą oceną. Większość próbki to pasmo
            0,3–0,6; kilka niskich i wysokich jest wmieszanych jako punkty odniesienia,
            żeby było widać, czy ocena człowieka w ogóle idzie za oceną modelu.
  porownaj  czyta oceny z arkusza, łączy z kluczem i wypisuje tabelę: ocena modelu
            kontra ocena człowieka.

Ocena modelu jest ukryta celowo. Widząc 0,5 przy pozycji, trudno ocenić ją inaczej.

Użycie:
    python -m akuki.ocena_rozliczen arkusz [--n 30] [--kontrola 5] [--ziarno 52]
    python -m akuki.ocena_rozliczen porownaj [ścieżka-arkusza]
"""

from __future__ import annotations

import json
import random
import re
from collections import Counter
from datetime import date
from pathlib import Path

from akuki.dziennik import VAULT, _remote

OUT_DIR = VAULT / "ocena-rozliczen"

SCALE = {
    "0": "trafione — stało się to, czego oczekiwał",
    "1": "częściowo — zwykła rozbieżność, nic, do czego warto wracać",
    "2": "zaskoczenie pośrednie — coś nieoczekiwanego, ale zrozumiałego; warto by się nad tym zastanowić",
    "3": "pełne rozminięcie albo szum — nie było jak tego przewidzieć",
}

# Uruchamiany NA VPS-ie. Czyta bazę w trybie tylko do odczytu i pliki strumienia.
# Na wyjściu: wszystkie rozliczenia z treścią oczekiwania i rozmową między powstaniem
# oczekiwania a rozliczeniem. Losowanie robi laptop, żeby ziarno było powtarzalne.
REMOTE_READ = r'''
import { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DATA = "/var/lib/akuki/data/akuki";
const db = new DatabaseSync(join(DATA, "borg.db"), { readOnly: true });
const names = new Map(db.prepare("SELECT id, canonical_name FROM entities").all().map((r) => [r.id, r.canonical_name]));
const textOf = (c) => typeof c === "string" ? c : (c && typeof c === "object" ? (c.text ?? c.message ?? JSON.stringify(c)) : String(c));

const bySession = new Map();
for (const file of readdirSync(join(DATA, "stream")).filter((f) => f.endsWith(".jsonl"))) {
  for (const line of readFileSync(join(DATA, "stream", file), "utf8").split("\n")) {
    if (!line.trim()) continue;
    let e; try { e = JSON.parse(line); } catch { continue; }
    if (e.kind !== "user_msg" && e.kind !== "agent_msg") continue;
    if (!bySession.has(e.session_id)) bySession.set(e.session_id, []);
    bySession.get(e.session_id).push({
      ts: e.timestamp,
      who: e.kind === "agent_msg" ? "Akuki" : (names.get(e.sender_entity_id) ?? "?"),
      text: textOf(e.content),
    });
  }
}
for (const list of bySession.values()) list.sort((a, b) => a.ts - b.ts);

const rows = db.prepare(`
  SELECT r.prediction_id, r.error_magnitude, r.content AS model_says, r.created_ts AS rts,
         e.content AS expectation, e.about, e.created_ts AS ets, e.session_id
  FROM prediction_events r
  JOIN prediction_events e ON e.prediction_id = r.prediction_id AND e.kind = 'expectation'
  WHERE r.kind = 'reconciliation' AND r.error_magnitude IS NOT NULL`).all();

const out = rows.map((r) => ({
  ...r,
  context: (bySession.get(r.session_id) ?? []).filter((m) => m.ts >= r.ets && m.ts <= r.rts),
}));
process.stdout.write(JSON.stringify(out));
'''


def fetch() -> list[dict]:
    raw = _remote("sudo -n node --input-type=module", stdin=REMOTE_READ.encode())
    return json.loads(raw)


def sample(rows: list[dict], n: int, control: int, seed: int) -> list[dict]:
    """n z pasma 0,3–0,6 plus po `control` z dołu (≤0,15) i z góry (≥0,7), wymieszane."""
    rng = random.Random(seed)
    band = [r for r in rows if 0.3 <= r["error_magnitude"] <= 0.6]
    low = [r for r in rows if r["error_magnitude"] <= 0.15]
    high = [r for r in rows if r["error_magnitude"] >= 0.7]
    picked = (rng.sample(band, min(n, len(band)))
              + rng.sample(low, min(control, len(low)))
              + rng.sample(high, min(control, len(high))))
    rng.shuffle(picked)
    return picked


def _clip(text: str, n: int = 500) -> str:
    text = " ".join(text.split())
    return text if len(text) <= n else text[:n] + f" […+{len(text) - n}]"


def _context(messages: list[dict], head: int = 3, tail: int = 7) -> list[str]:
    """Rozmowa od powstania oczekiwania do rozliczenia; długą skraca w środku."""
    lines = [f"> **{m['who']}:** {_clip(m['text'])}" for m in messages]
    if len(lines) > head + tail:
        lines = lines[:head] + [f"> *… pominięte {len(lines) - head - tail} wiadomości …*"] + lines[-tail:]
    return lines or ["> *(brak wiadomości w strumieniu między oczekiwaniem a rozliczeniem)*"]


def render_sheet(items: list[dict], seed: int) -> str:
    out = [
        "---", "typ: ocena-rozliczen", f"zadanie: TASK-052", f"ziarno: {seed}",
        f"pozycji: {len(items)}", "---", "",
        "# Ocena rozliczeń na ślepo", "",
        "Przy każdej pozycji przeczytaj, czego Akuki oczekiwał i co potem padło w rozmowie.",
        "Oceny modelu tu nie ma, jest w osobnym pliku z kluczem — nie zaglądaj do niego przed końcem.",
        "Wpisz cyfrę po „Ocena:” i literę po „Wielowątkowe:”.", "",
        "**Skala oceny:**", "",
        *[f"- **{k}** — {v}" for k, v in SCALE.items()], "",
        "**Wielowątkowe:** `t`, jeśli oczekiwanie łączy kilka osobnych twierdzeń "
        "(„X zrobi A, a Y nie zrobi B”), `n`, jeśli jedno.", "",
        "Pomiń pozycję, której nie da się ocenić z tego, co widać: wpisz `?`.", "",
    ]
    for i, item in enumerate(items, 1):
        out += [
            "---", "", f"## {i:02d}", "",
            f"**O czym:** {item.get('about') or '—'}", "",
            f"**Oczekiwał:** {_clip(item['expectation'], 800)}", "",
            "**Co padło potem:**", "",
            *_context(item["context"]), "",
            "Ocena: ", "Wielowątkowe: ", "",
        ]
    return "\n".join(out)


def write_sheet(n: int, control: int, seed: int) -> tuple[Path, Path]:
    items = sample(fetch(), n, control, seed)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    stem = OUT_DIR / f"{date.today().isoformat()}"
    sheet, key = Path(f"{stem}-arkusz.md"), Path(f"{stem}-klucz.json")
    sheet.write_text(render_sheet(items, seed), encoding="utf-8")
    key.write_text(json.dumps(
        [{"nr": i, "prediction_id": it["prediction_id"], "error_magnitude": it["error_magnitude"],
          "model_says": it["model_says"]} for i, it in enumerate(items, 1)],
        ensure_ascii=False, indent=2), encoding="utf-8")
    return sheet, key


# ------------------------------------------------------------------------ porównanie

RATING = re.compile(r"^## (\d+)\s*$.*?^Ocena:[ \t]*(\S*)[ \t]*$.*?^Wielowątkowe:[ \t]*(\S*)[ \t]*$", re.M | re.S)


def parse_ratings(text: str) -> dict[int, tuple[str, str]]:
    return {int(nr): (score, multi.lower()) for nr, score, multi in RATING.findall(text)}


def bucket(error: float) -> str:
    if error <= 0.15:
        return "≤0,15"
    if error >= 0.7:
        return "≥0,7"
    return "0,3–0,6"


def compare(sheet: Path) -> str:
    key = {k["nr"]: k for k in json.loads(Path(str(sheet).replace("-arkusz.md", "-klucz.json")).read_text("utf-8"))}
    ratings = parse_ratings(sheet.read_text("utf-8"))
    rated = {nr: r for nr, r in ratings.items() if r[0] in SCALE}
    lines = [f"ocenione: {len(rated)} z {len(key)} (pominięte albo puste: {len(key) - len(rated)})", ""]

    table: dict[str, Counter] = {b: Counter() for b in ("≤0,15", "0,3–0,6", "≥0,7")}
    for nr, (score, _) in rated.items():
        table[bucket(key[nr]["error_magnitude"])][score] += 1
    lines.append("ocena modelu  |  " + "  ".join(f"{s}" for s in SCALE) + "   (Twoja ocena)")
    for b, counts in table.items():
        lines.append(f"{b:>12}  |  " + "  ".join(str(counts[s]) for s in SCALE))

    band = table["0,3–0,6"]
    total = sum(band.values())
    if total:
        lines += ["", f"pasmo 0,3–0,6: zaskoczenie pośrednie (2) w {band['2']} z {total} "
                      f"({100 * band['2'] / total:.0f}%), zwykła rozbieżność albo trafienie (0–1) w "
                      f"{band['0'] + band['1']} z {total}"]

    multi = [(key[nr]["error_magnitude"], m) for nr, (_, m) in rated.items() if m in ("t", "n")]
    for flag, label in (("t", "wielowątkowe"), ("n", "jednowątkowe")):
        errs = [e for e, m in multi if m == flag]
        if errs:
            lines.append(f"{label}: {len(errs)}, średnia ocena modelu {sum(errs) / len(errs):.2f}")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    import sys

    args = list(sys.argv[1:] if argv is None else argv)
    cmd = args[0] if args else ""
    opt = lambda name, default: int(args[args.index(name) + 1]) if name in args else default
    if cmd == "arkusz":
        sheet, key = write_sheet(opt("--n", 30), opt("--kontrola", 5), opt("--ziarno", 52))
        print("arkusz:", sheet, "\nklucz (nie otwieraj przed oceną):", key)
        return 0
    if cmd == "porownaj":
        sheets = sorted(OUT_DIR.glob("*-arkusz.md"))
        sheet = Path(args[1]) if len(args) > 1 else (sheets[-1] if sheets else None)
        if sheet is None:
            print("brak arkusza; najpierw: python -m akuki.ocena_rozliczen arkusz")
            return 1
        print(compare(sheet))
        return 0
    print("użyj: arkusz [--n 30] [--kontrola 5] [--ziarno 52] | porownaj [ścieżka-arkusza]")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
