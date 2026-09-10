#!/usr/bin/env bash
# TASK-037: czy Akuki nie zaniża własnych błędów przewidywania.
#
# error_magnitude to WŁASNA ocena modelu, nie policzona różnica tekstów. Ten
# skrypt nie ocenia jej i nie koryguje. Wypisuje dwie rzeczy, żeby ocenę mógł
# zrobić ktoś inny, poza torem tury:
#   [1] rozkład WSZYSTKICH rozliczeń, nie tylko dziesięciu ostatnich,
#   [2] pary oczekiwanie–rzeczywistość razem z surowymi wypowiedziami z tury,
#       w której oczekiwanie zostało rozliczone.
# Czyta żywą pamięć na VPS-ie tylko do odczytu i niczego nie zapisuje.
set -euo pipefail

VPS_USER=ubuntu
VPS_ADDR=${AKUKI_VPS_ADDR:-100.124.237.35}
VPS_KEY=${AKUKI_VPS_KEY:-$HOME/.ssh/akuki_oci}
# Ile par wypisać (od najnowszej). "all" = wszystkie.
PAIRS=${AKUKI_PAIRS:-20}

ssh -o BatchMode=yes -o ConnectTimeout=15 -i "$VPS_KEY" "$VPS_USER@$VPS_ADDR" \
  "sudo -n env AKUKI_PAIRS='$PAIRS' node --input-type=module" <<'REMOTE' 2>&1 | grep -viE "experimentalwarning|trace-warnings"
import { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = "/var/lib/akuki/data/akuki";
const db = new DatabaseSync(join(DATA_DIR, "borg.db"), { readOnly: true });
const all = (sql, ...args) => db.prepare(sql).all(...args);
const nameOf = (id) =>
  id ? (db.prepare("SELECT canonical_name FROM entities WHERE id = ?").get(id)?.canonical_name ?? id) : "?";

const events = all("SELECT * FROM prediction_events ORDER BY created_ts ASC");
const expectations = events.filter((e) => e.kind === "expectation");
const reconciliations = events.filter((e) => e.kind === "reconciliation");
const byPredictionId = new Map(expectations.map((e) => [e.prediction_id, e]));

console.log("== [0] ile czego ==");
console.log("   wpisów razem:", events.length);
console.log("   oczekiwań:", expectations.length);
console.log("   rozliczeń:", reconciliations.length);
console.log("   oczekiwań wciąż otwartych:", expectations.length - reconciliations.length);

const scored = reconciliations.filter((r) => r.error_magnitude !== null);
console.log("   rozliczeń z oceną błędu:", scored.length);

console.log("\n== [1] rozkład WSZYSTKICH ocen błędu (0..1) ==");
if (scored.length === 0) {
  console.log("   brak ocenionych rozliczeń");
} else {
  const values = scored.map((r) => r.error_magnitude).sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const median =
    values.length % 2 === 1
      ? values[(values.length - 1) / 2]
      : (values[values.length / 2 - 1] + values[values.length / 2]) / 2;
  console.log("   min:", values[0], "| mediana:", median, "| max:", values[values.length - 1]);
  console.log("   średnia:", (sum / values.length).toFixed(4));
  console.log("   powyżej 0,3:", values.filter((v) => v > 0.3).length, "z", values.length);
  console.log("   powyżej 0,5:", values.filter((v) => v > 0.5).length, "z", values.length);
  console.log("   dokładnie 0:", values.filter((v) => v === 0).length);
  const edges = [0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.7, 1.0001];
  for (let i = 0; i < edges.length - 1; i += 1) {
    const n = values.filter((v) => v >= edges[i] && v < edges[i + 1]).length;
    const label = `[${edges[i]}..${edges[i + 1] > 1 ? 1 : edges[i + 1]})`.padEnd(14);
    console.log("  ", label, String(n).padStart(3), "#".repeat(n));
  }
  console.log("\n   dokładne wartości, od najstarszej:");
  console.log("  ", scored.map((r) => r.error_magnitude).join(", "));
  const distinct = [...new Set(values)].sort((a, b) => a - b);
  console.log("   użyte różne wartości:", distinct.join(", "), `(${distinct.length} sztuk)`);
}

// Surowe wypowiedzi z tur -- z plików strumienia, nie z bazy.
const turns = new Map();
let streamFiles = [];
try {
  streamFiles = readdirSync(join(DATA_DIR, "stream")).filter((f) => f.endsWith(".jsonl"));
} catch {
  streamFiles = [];
}
for (const file of streamFiles) {
  const text = readFileSync(join(DATA_DIR, "stream", file), "utf8");
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (!entry.turn_id) continue;
    if (!["user_msg", "agent_msg", "agent_suppressed", "agent_observed"].includes(entry.kind)) continue;
    if (!turns.has(entry.turn_id)) turns.set(entry.turn_id, []);
    turns.get(entry.turn_id).push(entry);
  }
}

const textOf = (content) => {
  if (typeof content === "string") return content;
  if (content && typeof content === "object") {
    for (const key of ["text", "message", "body", "content"]) {
      if (typeof content[key] === "string") return content[key];
    }
    return JSON.stringify(content);
  }
  return String(content);
};
const clip = (s, n = 600) => (s.length > n ? `${s.slice(0, n)} […${s.length - n} znaków dalej]` : s);
const showTurn = (turnId, indent = "      ") => {
  const entries = (turns.get(turnId) ?? []).sort((a, b) => a.timestamp - b.timestamp);
  if (entries.length === 0) {
    console.log(`${indent}(brak wypowiedzi dla turn_id ${turnId} w strumieniu)`);
    return;
  }
  for (const e of entries) {
    const who = e.kind === "user_msg" ? nameOf(e.sender_entity_id) : "AKUKI";
    console.log(`${indent}${e.kind} <${who}>: ${clip(textOf(e.content))}`);
  }
};

const limit = process.env.AKUKI_PAIRS === "all" ? reconciliations.length : Number(process.env.AKUKI_PAIRS ?? 20);
const pairs = reconciliations.slice(-limit).reverse();

console.log(`\n== [2] pary oczekiwanie–rzeczywistość, od najnowszej (${pairs.length} z ${reconciliations.length}) ==`);
for (const rec of pairs) {
  const exp = byPredictionId.get(rec.prediction_id);
  console.log("\n" + "-".repeat(78));
  console.log("   OCENA MODELU (error_magnitude):", rec.error_magnitude);
  console.log("   o kim/o czym:", rec.about ?? exp?.about ?? "null", "| entity:", nameOf(rec.about_entity_id ?? exp?.about_entity_id));
  if (exp) {
    console.log(`   OCZEKIWAŁ (tura ${exp.turn_id}, ${new Date(exp.created_ts).toISOString()}):`);
    console.log("      ", clip(exp.content, 800));
    console.log("      tura, w której oczekiwanie powstało:");
    showTurn(exp.turn_id);
  } else {
    console.log("   OCZEKIWANIE: brak wiersza expectation dla prediction_id", rec.prediction_id);
  }
  console.log(`   MODEL MÓWI, ŻE STAŁO SIĘ (tura ${rec.turn_id}, ${new Date(rec.created_ts).toISOString()}):`);
  console.log("      ", clip(rec.content, 800));
  console.log("      CO FAKTYCZNIE PADŁO W TEJ TURZE:");
  showTurn(rec.turn_id);
}

const openOnes = expectations.filter((e) => !reconciliations.some((r) => r.prediction_id === e.prediction_id));
console.log(`\n== [3] oczekiwania nierozliczone (${openOnes.length}) ==`);
for (const e of openOnes.slice(-15).reverse()) {
  console.log(`   [${new Date(e.created_ts).toISOString()}] ${clip(e.content, 300)}`);
}
REMOTE
