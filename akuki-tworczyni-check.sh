#!/usr/bin/env bash
# Kim jest dla Akukiego "tworczyni" (TASK-063).
#
# Rozmowa na Discordzie przypisuje kazda wiadomosc encji z rola tworczyni, po jej
# identyfikatorze. Ten skrypt pokazuje, kto to jest, zanim pierwsza wiadomosc
# z Discorda trafi do pamieci, a po wdrozeniu pozwala sprawdzic, ze nie powstala
# druga encja Zosi.
#
# Czyta zywa pamiec na VPS-ie TYLKO DO ODCZYTU, tak samo jak
# akuki-zosia-duplikat-check.sh. Niczego nie zapisuje.
#
# Pokazuje trzy rzeczy:
#   1. encje z rola tworczyni (oczekiwana dokladnie jedna),
#   2. wszystkie encje, ktorych nazwa albo alias zawiera "zosia",
#   3. mapowania na identyfikatory zewnetrzne (Arena, a po wdrozeniu ewentualnie Discord).
set -euo pipefail

VPS_USER=ubuntu
VPS_ADDR=${AKUKI_VPS_ADDR:-100.124.237.35}
VPS_KEY=${AKUKI_VPS_KEY:-$HOME/.ssh/akuki_oci}

ssh -o BatchMode=yes -o ConnectTimeout=15 -i "$VPS_KEY" "$VPS_USER@$VPS_ADDR" \
  'sudo -n node --input-type=module' <<'REMOTE' 2>&1 | grep -viE "experimentalwarning|trace-warnings"
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("/var/lib/akuki/data/akuki/borg.db", { readOnly: true });
const all = (sql, ...args) => db.prepare(sql).all(...args);
const when = (ms) => (ms === null || ms === undefined ? "brak" : new Date(Number(ms)).toISOString());
const pokaz = (e) => {
  console.log("  ", e.id);
  console.log("      nazwa:", e.canonical_name, "| aliasy:", e.aliases);
  console.log("      rodzaj:", e.kind, "| rola:", e.borg_role, "| scalona w:", e.merged_into ?? "-");
  console.log("      powstala:", when(e.created_at));
};

const tworczynie = all("SELECT * FROM entities WHERE borg_role = 'creator' ORDER BY created_at");
console.log("== 1. encje z rola tworczyni:", tworczynie.length, "==");
tworczynie.forEach(pokaz);

const zosie = all(
  "SELECT * FROM entities WHERE lower(canonical_name) LIKE '%zosia%' OR lower(aliases) LIKE '%zosia%' ORDER BY created_at",
);
console.log("== 2. encje z 'zosia' w nazwie lub aliasie:", zosie.length, "==");
zosie.forEach(pokaz);

console.log("== 3. mapowania na identyfikatory zewnetrzne ==");
for (const m of all("SELECT * FROM entity_external_ids ORDER BY created_at")) {
  const e = all("SELECT canonical_name FROM entities WHERE id = ?", m.entity_id)[0];
  console.log("  ", m.source, "/", m.external_id, "->", m.entity_id, `(${e?.canonical_name ?? "?"})`);
}
REMOTE
