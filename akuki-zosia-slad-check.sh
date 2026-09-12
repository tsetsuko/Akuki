#!/usr/bin/env bash
# Pelny slad obu encji Zosi, tez w polach tekstowych i w LanceDB (TASK-038, uzupelnienie AC#2).
#
# Poprzedni skrypt porownywal identyfikator na rownosc, wiec pomijal listy JSON
# (na przyklad activity_events.participant_entity_ids) i caly magazyn wektorowy.
# Ten skrypt szuka identyfikatora jako podciagu we WSZYSTKICH kolumnach kazdej tabeli
# SQLite oraz liczy jego wystapienia w plikach LanceDB.
#
# TYLKO DO ODCZYTU. Nie zapisuje i nie scala niczego.
set -euo pipefail

VPS_USER=ubuntu
VPS_ADDR=${AKUKI_VPS_ADDR:-100.124.237.35}
VPS_KEY=${AKUKI_VPS_KEY:-$HOME/.ssh/akuki_oci}

SEED=ent_ry4lo3ia73wug8pz
ARENA=ent_k789l9ogu43tlbmp

ssh -o BatchMode=yes -o ConnectTimeout=15 -i "$VPS_KEY" "$VPS_USER@$VPS_ADDR" \
  "sudo -n env SEED=$SEED ARENA=$ARENA bash -s" <<'REMOTE'
set -euo pipefail

echo "== SQLite: identyfikator jako podciag, kolumna po kolumnie =="
node --input-type=module <<'NODE' 2>&1 | grep -viE "experimentalwarning|trace-warnings"
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("/var/lib/akuki/data/akuki/borg.db", { readOnly: true });
const ids = { seed: process.env.SEED, arena: process.env.ARENA };
const tabele = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
  .all()
  .map((r) => r.name);

for (const t of tabele) {
  // Nazwa tabeli w cudzyslowach, bo `values` to slowo kluczowe SQL i bez nich
  // PRAGMA konczy sie bledem skladni, przerywajac caly skan.
  const kolumny = db.prepare(`PRAGMA table_info("${t}")`).all();
  for (const k of kolumny) {
    for (const [etykieta, id] of Object.entries(ids)) {
      let n;
      try {
        n = db.prepare(`SELECT COUNT(*) AS n FROM "${t}" WHERE CAST("${k.name}" AS TEXT) LIKE ?`).get(`%${id}%`).n;
      } catch {
        continue;
      }
      if (n > 0) console.log(`   ${t}.${k.name}  ${etykieta}  ${n}`);
    }
  }
}
NODE

echo "== LanceDB: wystapienia identyfikatora w plikach magazynu wektorowego =="
for ID in "$SEED" "$ARENA"; do
  echo "   $ID:"
  if ! grep -rc --binary-files=text "$ID" /var/lib/akuki/data/akuki/lancedb 2>/dev/null \
       | awk -F: '$2 > 0 { printf "      %s  %s\n", $1, $2 }' | grep .; then
    echo "      brak wystapien"
  fi
done
REMOTE
