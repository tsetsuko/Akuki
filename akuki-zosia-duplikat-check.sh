#!/usr/bin/env bash
# Skad wziely sie dwie encje o imieniu Zosia (TASK-038, kroki 1 i 2).
#
# Czyta zywa pamiec na VPS-ie TYLKO DO ODCZYTU. Nie zapisuje ani nie scala niczego.
# Pokazuje trzy rzeczy: pelne wiersze obu encji z data powstania i prowenienecja nazwy,
# mapowania na identyfikatory zewnetrzne (tam widac, ktora encja przyszla z Areny),
# oraz ile wierszy w calej bazie wskazuje na kazda z nich, tabela po tabeli.
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

const zosie = all("SELECT * FROM entities WHERE lower(canonical_name) LIKE '%zosia%' ORDER BY created_at");

console.log("== encje o imieniu Zosia:", zosie.length, "==");
for (const e of zosie) {
  console.log("  ", e.id);
  console.log("      nazwa:", e.canonical_name, "| aliasy:", e.aliases);
  console.log("      rodzaj:", e.kind, "| rola:", e.borg_role, "| prowenienecja nazwy:", e.name_provenance);
  console.log("      powstala:", when(e.created_at));
}

console.log("== mapowania na identyfikatory zewnetrzne ==");
const mapy = all("SELECT * FROM entity_external_ids");
if (mapy.length === 0) console.log("   brak wierszy w entity_external_ids");
for (const m of mapy) {
  const e = all("SELECT canonical_name FROM entities WHERE id = ?", m.entity_id)[0];
  console.log("  ", m.source, "/", m.external_id, "->", m.entity_id,
              `(${e?.canonical_name ?? "?"})`, "| dodane:", when(m.created_at));
}

console.log("== co wskazuje na kazda z encji (tabela.kolumna: liczba wierszy) ==");
const ids = zosie.map((e) => e.id);
const tabele = all("SELECT name FROM sqlite_master WHERE type='table'").map((r) => r.name);
for (const t of tabele) {
  let kolumny;
  try {
    kolumny = all(`PRAGMA table_info(${t})`).map((c) => c.name).filter((c) => /entity|entit/i.test(c));
  } catch {
    continue;
  }
  for (const k of kolumny) {
    for (const id of ids) {
      const n = all(`SELECT COUNT(*) AS n FROM "${t}" WHERE "${k}" = ?`, id)[0].n;
      if (n > 0) console.log(`   ${t}.${k}  ${id}  ${n}`);
    }
  }
}

console.log("== profile spoleczne i zaufanie per dziedzina obu encji ==");
for (const id of ids) {
  const p = all("SELECT interaction_count, trust, attachment, last_interaction_at FROM social_profiles WHERE entity_id = ?", id)[0];
  console.log("  ", id, p ? `interakcji: ${p.interaction_count} | zaufanie: ${p.trust} | przywiazanie: ${p.attachment} | ostatnia: ${when(p.last_interaction_at)}` : "brak profilu");
  for (const d of all("SELECT domain, alpha, beta, created_at FROM social_trust_domains WHERE entity_id = ?", id)) {
    console.log(`      dziedzina ${d.domain}: alpha=${d.alpha} beta=${d.beta} (srednia ${(d.alpha / (d.alpha + d.beta)).toFixed(3)}) od ${when(d.created_at)}`);
  }
}
REMOTE
