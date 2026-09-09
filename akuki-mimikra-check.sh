#!/usr/bin/env bash
# Co Akuki przejal od innych i co z tym zrobil (TASK-032).
#
# Czyta pasmo umiejetnosci TYLKO DO ODCZYTU i pokazuje dla kazdej umiejetnosci:
# skad ja ma, ile prob zaliczyl JAKO wlasciciel tej umiejetnosci (proby zalozycielskie
# sa odjete) i jaki werdykt daje z tego prog retencji.
#
# Domyslnie czyta lokalna kopie. AKUKI_DB=<sciezka> czyta inna baze.
set -euo pipefail

DB=${AKUKI_DB:-/home/zosia/projects/ai/akuki/data/experiments/local-20260908T102000/akuki/borg.db}
FLOOR=${AKUKI_RETENTION_FLOOR:-0.6}
CONFIDENCE=${AKUKI_RETENTION_CONFIDENCE:-0.8}

npx --prefix borg tsx --input-type=module <<REMOTE 2>&1 | grep -v ExperimentalWarning | grep -v trace-warnings
import { DatabaseSync } from "node:sqlite";
import { readImitationRetention } from "/home/zosia/projects/ai/akuki/borg/src/memory/procedural/imitation-retention.ts";

const db = new DatabaseSync("${DB}", { readOnly: true });
const params = { floor: ${FLOOR}, confidence: ${CONFIDENCE} };
const columns = db.prepare("PRAGMA table_info(skills)").all().map((row) => row.name);
if (!columns.includes("founding_successes")) {
  console.log("Ta baza nie zna jeszcze prob zalozycielskich (TASK-032).");
  console.log("Uruchom raz serwer na tym katalogu -- migracja dopisze kolumny -- i powtorz.");
  process.exit(0);
}

const skills = db.prepare(\`
  SELECT id, applies_when, status, acquisition_mode, acquired_from_entity_id,
         alpha, beta, successes, failures, founding_successes, founding_failures
  FROM skills
  ORDER BY updated_at DESC
\`).all();

if (skills.length === 0) {
  console.log("Pasmo umiejetnosci jest puste. Nie ma jeszcze czego obserwowac.");
  process.exit(0);
}

const nameOf = (id) =>
  id === null ? "-" : (db.prepare("SELECT canonical_name FROM entities WHERE id = ?").get(id)?.canonical_name ?? id);

for (const skill of skills) {
  const earnedAlpha = Math.max(1, skill.alpha - skill.founding_successes);
  const earnedBeta = Math.max(1, skill.beta - skill.founding_failures);
  const earnedAttempts =
    Math.max(0, skill.successes - skill.founding_successes) +
    Math.max(0, skill.failures - skill.founding_failures);
  const borrowed = skill.acquisition_mode === "observed_from" || skill.acquisition_mode === "told_by";
  const reading = readImitationRetention({ alpha: earnedAlpha, beta: earnedBeta }, params);

  console.log("");
  console.log(skill.applies_when);
  console.log("  skad          :", skill.acquisition_mode ?? "nie wiadomo", "od:", nameOf(skill.acquired_from_entity_id));
  console.log("  stan          :", skill.status);
  console.log("  proby wlasne  :", earnedAttempts, "(zalozycielskich, nieliczonych:", skill.founding_successes + skill.founding_failures + ")");
  console.log("  szansa > prog :", reading.probabilityAboveFloor.toFixed(3), "przy progu", params.floor, "i pewnosci", params.confidence);
  console.log("  werdykt       :",
    skill.status === "rejected" ? "odrzucone -- juz nie jest uzywane"
    : skill.acquisition_mode === "tested_independently" ? "przyjete za wlasne"
    : !borrowed ? "nie dotyczy -- to nie jest zachowanie przejete od kogos"
    : reading.verdict === "retain" ? "gotowe do przyjecia przy nastepnym wyniku"
    : reading.verdict === "reject" ? "gotowe do odrzucenia przy nastepnym wyniku"
    : "za wczesnie -- dowod jeszcze nie rozstrzyga");
}
REMOTE
