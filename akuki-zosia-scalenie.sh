#!/usr/bin/env bash
# Scalenie dwoch encji o imieniu Zosia (TASK-038, AC#3 i AC#4).
#
# Encja z seeda (creator, user_declared) jest ta, ktora zostaje. Encja utworzona
# przez konektor Areny zostaje przeniesiona na nia i usunieta.
#
# DOMYSLNIE PROBA: czyta, liczy, wypisuje plan i stan przed, NIC nie zapisuje.
# Zapis dopiero z argumentem --wykonaj, i tylko przy zatrzymanej usludze.
# Przed zapisem skrypt sam robi kopie katalogu tenanta na VPS-ie; to kopia
# dodatkowa, NIE zastepuje kopii z akuki-backup-odtworzenie.md.
set -euo pipefail

VPS_USER=ubuntu
VPS_ADDR=${AKUKI_VPS_ADDR:-100.124.237.35}
VPS_KEY=${AKUKI_VPS_KEY:-$HOME/.ssh/akuki_oci}

SEED=ent_ry4lo3ia73wug8pz
ARENA=ent_k789l9ogu43tlbmp

WYKONAJ=0
if [ "${1:-}" = "--wykonaj" ]; then
  WYKONAJ=1
fi

ssh -o BatchMode=yes -o ConnectTimeout=15 -i "$VPS_KEY" "$VPS_USER@$VPS_ADDR" \
  "sudo -n env SEED=$SEED ARENA=$ARENA WYKONAJ=$WYKONAJ bash -s" <<'REMOTE'
set -euo pipefail

DANE=/var/lib/akuki/data/akuki

if [ "$WYKONAJ" = "1" ]; then
  if systemctl is-active --quiet akuki; then
    echo "USLUGA DZIALA. Zatrzymaj ja (systemctl stop akuki) i uruchom ponownie." >&2
    exit 1
  fi
  STAMP=$(date -u +%Y%m%dT%H%M%SZ)
  KOPIA=/var/lib/akuki/przed-scaleniem-$STAMP
  cp -a "$DANE" "$KOPIA"
  echo "== kopia dodatkowa przed zapisem: $KOPIA =="
  find "$KOPIA" -type f | wc -l | xargs echo "   plikow w kopii:"
fi

node --input-type=module <<'NODE' 2>&1 | grep -viE "experimentalwarning|trace-warnings"
import { DatabaseSync } from "node:sqlite";

const SEED = process.env.SEED;
const ARENA = process.env.ARENA;
const WYKONAJ = process.env.WYKONAJ === "1";

// Sciezka z otoczenia tylko po to, zeby ten sam kod dal sie przecwiczyc na kopii.
const db = new DatabaseSync(process.env.BORG_DB ?? "/var/lib/akuki/data/akuki/borg.db");
db.exec("PRAGMA foreign_keys = ON");

const all = (sql, ...a) => db.prepare(sql).all(...a);
const one = (sql, ...a) => db.prepare(sql).get(...a);
const run = (sql, ...a) => db.prepare(sql).run(...a);
const when = (ms) => (ms === null || ms === undefined ? "brak" : new Date(Number(ms)).toISOString());

// Te same liczby, ktore czyta bramka inhibicji: zazylosc ze skali 5 interakcji,
// trafnosc ze sredniej z ostatnich 10 zaskoczen, ulga 0,1 za figure przywiazania.
const PROG = 0.75, WAGA_NIEPEWNOSCI = 0.5, SKALA = 5, ULGA = 0.1, OKNO = 10;

function powsciagliwosc(entityId, figuraObecna) {
  const profil = one("SELECT interaction_count FROM social_profiles WHERE entity_id = ?", entityId);
  const n = profil ? Number(profil.interaction_count) : 0;
  const zazylosc = 1 - Math.exp(-n / SKALA);
  const bledy = all(
    `SELECT error_magnitude FROM prediction_events
     WHERE about_entity_id = ? AND error_magnitude IS NOT NULL
     ORDER BY created_at DESC LIMIT ${OKNO}`,
    entityId,
  ).map((r) => Number(r.error_magnitude));
  const sredniBlad = bledy.length === 0 ? null : bledy.reduce((s, b) => s + b, 0) / bledy.length;
  const przewidywalnosc = sredniBlad === null ? 0 : zazylosc * (1 - sredniBlad);
  const wynik = Math.min(1, Math.max(0, PROG - WAGA_NIEPEWNOSCI * przewidywalnosc - (figuraObecna ? ULGA : 0)));
  return { n, zazylosc, bledy: bledy.length, sredniBlad, przewidywalnosc, wynik };
}

function zaufanieZDziedzin(entityId) {
  const d = all("SELECT alpha, beta FROM social_trust_domains WHERE entity_id = ?", entityId);
  if (d.length === 0) return null;
  let suma = 0, wagi = 0;
  for (const r of d) {
    const w = Number(r.alpha) + Number(r.beta);
    suma += (Number(r.alpha) / w) * w;
    wagi += w;
  }
  return wagi === 0 ? null : suma / wagi;
}

function raport(etykieta, ids) {
  console.log(`== ${etykieta} ==`);
  for (const [nazwa, id, figura] of ids) {
    const p = one("SELECT interaction_count, trust, attachment, last_interaction_at, record_version FROM social_profiles WHERE entity_id = ?", id);
    if (!p) {
      console.log(`   ${nazwa} ${id}: brak profilu`);
      continue;
    }
    console.log(`   ${nazwa} ${id}`);
    console.log(`      interakcji: ${p.interaction_count} | zaufanie: ${Number(p.trust).toFixed(4)} | wersja wiersza: ${p.record_version} | ostatnia: ${when(p.last_interaction_at)}`);
    for (const d of all("SELECT domain, alpha, beta FROM social_trust_domains WHERE entity_id = ? ORDER BY domain", id)) {
      const sr = Number(d.alpha) / (Number(d.alpha) + Number(d.beta));
      console.log(`      dziedzina ${d.domain}: alpha=${d.alpha} beta=${d.beta} (srednia ${sr.toFixed(3)})`);
    }
    const i = powsciagliwosc(id, figura);
    console.log(`      zazylosc: ${i.zazylosc.toFixed(3)} | zaskoczen w oknie: ${i.bledy}${i.sredniBlad === null ? "" : ` | sredni blad: ${i.sredniBlad.toFixed(3)}`}`);
    console.log(`      przewidywalnosc: ${i.przewidywalnosc.toFixed(3)} | POWSCIAGLIWOSC: ${i.wynik.toFixed(3)}${figura ? " (z ulga za figure przywiazania)" : " (bez ulgi)"}`);
  }
}

// Figura przywiazania rozwiazuje sie po nazwie i trafia w encje starsza, czyli
// z seeda. Dlatego przed scaleniem ulga nalezy sie tylko jej, a encji z Areny nie.
raport("PRZED", [["seed  ", SEED, true], ["Arena ", ARENA, false]]);

function sladAreny() {
  const trafienia = [];
  const tabele = all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").map((r) => r.name);
  for (const t of tabele) {
    for (const k of all(`PRAGMA table_info("${t}")`)) {
      const n = one(`SELECT COUNT(*) AS n FROM "${t}" WHERE CAST("${k.name}" AS TEXT) LIKE ?`, `%${ARENA}%`).n;
      if (n > 0) trafienia.push({ tabela: t, kolumna: k.name, n: Number(n) });
    }
  }
  return trafienia;
}

console.log("== plan: co wskazuje na encje z Areny ==");
for (const t of sladAreny()) console.log(`   ${t.tabela}.${t.kolumna}  ${t.n}`);

if (!WYKONAJ) {
  console.log("== PROBA. Nic nie zapisano. Zapis: ./akuki-zosia-scalenie.sh --wykonaj ==");
  process.exit(0);
}

const teraz = Date.now();
db.exec("BEGIN IMMEDIATE");
try {
  // Dziedziny zaufania: przy tej samej nazwie dziedziny sumujemy PRZESLANKI,
  // odejmujac plaski prior (1,1) z wiersza z Areny, zeby nie policzyc go dwa razy.
  for (const d of all("SELECT domain, alpha, beta FROM social_trust_domains WHERE entity_id = ?", ARENA)) {
    const istnieje = one("SELECT alpha FROM social_trust_domains WHERE entity_id = ? AND domain = ?", SEED, d.domain);
    if (istnieje) {
      run(
        "UPDATE social_trust_domains SET alpha = alpha + ?, beta = beta + ?, updated_at = ? WHERE entity_id = ? AND domain = ?",
        Number(d.alpha) - 1, Number(d.beta) - 1, teraz, SEED, d.domain,
      );
      run("DELETE FROM social_trust_domains WHERE entity_id = ? AND domain = ?", ARENA, d.domain);
      console.log(`   dziedzina ${d.domain}: przesłanki dolozone do istniejacej`);
    } else {
      run("UPDATE social_trust_domains SET entity_id = ? WHERE entity_id = ? AND domain = ?", SEED, ARENA, d.domain);
      console.log(`   dziedzina ${d.domain}: przeniesiona bez zmian`);
    }
  }

  for (const [tabela, kolumna] of [
    ["social_events", "entity_id"],
    ["stream_entry_index", "sender_entity_id"],
    ["activity_events", "speaker_entity_id"],
    ["activity_events", "actor_entity_id"],
    ["activity_events", "audience_entity_id"],
    ["prediction_events", "about_entity_id"],
    ["entity_external_ids", "entity_id"],
  ]) {
    const r = run(`UPDATE "${tabela}" SET "${kolumna}" = ? WHERE "${kolumna}" = ?`, SEED, ARENA);
    if (Number(r.changes) > 0) console.log(`   ${tabela}.${kolumna}: przeniesione ${r.changes}`);
  }

  // Listy uczestnikow trzymaja tablice identyfikatorow jako tekst, wiec zamiana
  // idzie przez parsowanie, a powtorzenie po zamianie trzeba usunac.
  let listy = 0;
  for (const r of all("SELECT rowid AS rid, participant_entity_ids FROM activity_events WHERE participant_entity_ids LIKE ?", `%${ARENA}%`)) {
    const przed = JSON.parse(String(r.participant_entity_ids));
    const po = [...new Set(przed.map((x) => (x === ARENA ? SEED : x)))];
    run("UPDATE activity_events SET participant_entity_ids = ? WHERE rowid = ?", JSON.stringify(po), r.rid);
    listy += 1;
  }
  console.log(`   activity_events.participant_entity_ids: przepisane listy ${listy}`);

  // Profil scalonej encji liczymy z dziennika, nie z arytmetyki na dwoch wierszach.
  const liczba = one("SELECT COUNT(*) AS n FROM social_events WHERE entity_id = ? AND kind = 'interaction'", SEED).n;
  const ostatnia = one("SELECT MAX(ts) AS ts FROM social_events WHERE entity_id = ? AND kind = 'interaction'", SEED).ts;
  const nastroje = all(
    `SELECT ts, valence FROM (
       SELECT id, ts, valence FROM social_events
       WHERE entity_id = ? AND kind = 'interaction' AND valence IS NOT NULL
       ORDER BY ts DESC, id DESC LIMIT 50
     ) ORDER BY ts ASC, id ASC`,
    SEED,
  ).map((r) => ({ ts: Number(r.ts), valence: Number(r.valence) }));
  const zaufanie = zaufanieZDziedzin(SEED);

  run(
    `UPDATE social_profiles
     SET interaction_count = ?, last_interaction_at = ?, sentiment_history = ?,
         trust = COALESCE(?, trust), updated_at = ?, record_version = record_version + 1
     WHERE entity_id = ?`,
    Number(liczba), ostatnia === null ? null : Number(ostatnia),
    JSON.stringify(nastroje), zaufanie, teraz, SEED,
  );

  run("DELETE FROM social_profiles WHERE entity_id = ?", ARENA);
  run("DELETE FROM entities WHERE id = ?", ARENA);

  const zostalo = sladAreny();
  if (zostalo.length > 0) {
    console.log("== SLAD ENCJI Z ARENY ZOSTAL, WYCOFUJE ==");
    for (const t of zostalo) console.log(`   ${t.tabela}.${t.kolumna}  ${t.n}`);
    db.exec("ROLLBACK");
    process.exit(1);
  }

  db.exec("COMMIT");
  console.log("== scalone, zapisane ==");
} catch (e) {
  db.exec("ROLLBACK");
  console.log("== blad, wycofane ==");
  throw e;
}

raport("PO", [["scalona", SEED, true]]);
console.log("   integrity_check:", one("PRAGMA integrity_check").integrity_check);
NODE
REMOTE
