#!/usr/bin/env bash
# Czy Akuki w ogole sie powstrzymuje (M3), czy odpowiada na wszystko.
#
# Czyta zywa pamiec na VPS-ie TYLKO DO ODCZYTU i pokazuje skladniki, z ktorych
# liczy sie jego powsciagliwosc, oraz to, co faktycznie robil w turach.
# Nie zmienia zadnego parametru i niczego nie zapisuje.
set -euo pipefail

VPS_USER=ubuntu
VPS_ADDR=${AKUKI_VPS_ADDR:-100.124.237.35}
VPS_KEY=${AKUKI_VPS_KEY:-$HOME/.ssh/akuki_oci}

ssh -o BatchMode=yes -o ConnectTimeout=15 -i "$VPS_KEY" "$VPS_USER@$VPS_ADDR" \
  'sudo -n node --input-type=module' <<'REMOTE' 2>&1 | grep -viE "experimentalwarning|trace-warnings"
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("/var/lib/akuki/data/akuki/borg.db", { readOnly: true });
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r) => r.name);
const has = (t) => tables.includes(t);
const all = (sql) => db.prepare(sql).all();
const nameOf = (id) =>
  db.prepare("SELECT canonical_name FROM entities WHERE id = ?").get(id)?.canonical_name ?? id;

console.log("== co robil w turach ==");
if (has("activity_events")) {
  for (const r of all("SELECT kind, COUNT(*) AS n FROM activity_events GROUP BY kind ORDER BY n DESC LIMIT 20")) {
    console.log("  ", r.kind, r.n);
  }
} else {
  console.log("   brak tabeli activity_events");
}

console.log("== z kim i jak czesto (im wiecej, tym mniej niesmialy) ==");
if (has("social_profiles")) {
  for (const r of all("SELECT entity_id, interaction_count, trust FROM social_profiles ORDER BY interaction_count DESC LIMIT 10")) {
    console.log("  ", nameOf(r.entity_id), "| interakcji:", r.interaction_count, "| zaufanie:", r.trust);
  }
}

console.log("== swieze zaskoczenia (podnosza niesmialosc) ==");
if (has("prediction_events")) {
  console.log("   wszystkich wpisow:", all("SELECT COUNT(*) AS n FROM prediction_events")[0].n);
  for (const r of all("SELECT kind, error_magnitude FROM prediction_events WHERE error_magnitude IS NOT NULL ORDER BY created_at DESC LIMIT 10")) {
    console.log("  ", r.kind, r.error_magnitude);
  }
}

console.log("== nastroj (nieprzyjemny podnosi ostroznosc) ==");
if (has("mood_state")) console.log("  ", JSON.stringify(all("SELECT * FROM mood_state LIMIT 1")[0]));

console.log("== umiejetnosci (pasmo, ktorego dotyczy mimikra) ==");
if (has("skills")) console.log("   skills:", all("SELECT COUNT(*) AS n FROM skills")[0].n);
REMOTE
