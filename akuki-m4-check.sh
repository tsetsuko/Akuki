#!/usr/bin/env bash
# Czy M4 zapisało cokolwiek w żywej pamięci Akukiego na VPS-ie.
#
# M4 ma dwie połowy: zaufanie kluczowane dziedziną (social_trust_domains)
# i prowenienecję nabycia wiedzy (semantic_nodes.acquisition_mode).
# Skrypt czyta tenanta TYLKO DO ODCZYTU, przy działającej usłudze.
set -euo pipefail

VPS_USER=ubuntu
VPS_ADDR=${AKUKI_VPS_ADDR:-100.124.237.35}
VPS_KEY=${AKUKI_VPS_KEY:-$HOME/.ssh/akuki_oci}

ssh -o BatchMode=yes -o ConnectTimeout=15 -i "$VPS_KEY" "$VPS_USER@$VPS_ADDR" \
  'sudo -n node --input-type=module' <<'REMOTE' 2>&1 | grep -v ExperimentalWarning | grep -v trace-warnings
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("/var/lib/akuki/data/akuki/borg.db", { readOnly: true });
const one = (sql) => db.prepare(sql).get();
const many = (sql) => db.prepare(sql).all();

const turns = one("select count(*) as c from action_lifecycle_turn_counter").c;
const domains = many("select * from social_trust_domains");
const acquired = many(
  "select acquisition_mode, count(*) as c from semantic_nodes where acquisition_mode is not null group by acquisition_mode",
);
const nodes = one("select count(*) as c from semantic_nodes").c;

console.log(`tury: ${turns}`);

console.log(`\n[1/2] zaufanie per dziedzina -- social_trust_domains: ${domains.length} wierszy`);
for (const row of domains) console.log(`   ${JSON.stringify(row)}`);
if (domains.length === 0) {
  console.log("   NIE WYSTRZELIŁO. Potrzebna interakcja niosąca dziedzinę:");
  console.log("   ktoś musi powiedzieć coś sprawdzalnego w konkretnym obszarze,");
  console.log("   a Akuki musi to potem potwierdzić albo zderzyć z rzeczywistością.");
}

console.log(`\n[2/2] prowenienecja nabycia -- semantic_nodes: ${nodes} węzłów`);
if (acquired.length === 0) {
  console.log("   NIE WYSTRZELIŁO. Zero węzłów z ustawionym acquisition_mode.");
}
for (const row of acquired) console.log(`   ${row.acquisition_mode} = ${row.c}`);

console.log(
  `\nWERDYKT: ${domains.length > 0 || acquired.length > 0 ? "M4 zapisuje" : "M4 nic jeszcze nie zapisało"}`,
);
REMOTE
