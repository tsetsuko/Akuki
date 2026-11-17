#!/usr/bin/env bash
# Panel zuzycia tokenow Akukiego: pobiera dane z VPS-a i otwiera strone lokalnie.
#
#   ./akuki-tokeny.sh                    pobiera dane i otwiera panel w przegladarce
#   ./akuki-tokeny.sh --bez-otwierania   tylko pobiera dane
#
# Strona (panel/tokeny.html) jest statyczna i nie potrzebuje serwera. Dane laduje
# jako zwykly <script>, bo przegladarka nie pozwala stronie otwartej z file://
# czytac innych plikow przez fetch. Dlatego VPS oddaje od razu gotowy plik .js.
#
# Zrodla na VPS-ie, tylko do odczytu:
#   - log tokenow konektora (sciezka z AKUKI_ARENA_TOKEN_USAGE_LOG w akuki.env),
#     jedna linia na kazde wywolanie modelu;
#   - tabela autonomy_wakes z borg.db tenanta (pobudki), otwarta w trybie ro.
# Do data/tokeny/ trafiaja same liczby i nazwy miejsc wywolan, bez tresci rozmow;
# data/ i tak nie wchodzi do repozytorium.
set -euo pipefail

VPS_USER=ubuntu
VPS_ADDR=${AKUKI_VPS_ADDR:-100.124.237.35}
VPS_KEY=${AKUKI_VPS_KEY:-$HOME/.ssh/akuki_oci}

KATALOG=$(cd "$(dirname "$0")" && pwd)
CEL="$KATALOG/data/tokeny/dane.js"
mkdir -p "$(dirname "$CEL")"

# Pobranie do pliku tymczasowego i podmiana na koncu: przerwane polaczenie
# zostawia poprzednie dane, a nie pusty plik, z ktorym strona by sie nie otworzyla.
TYMCZASOWY=$(mktemp "$CEL.XXXXXX")
trap 'rm -f "$TYMCZASOWY"' EXIT

ssh -C -o BatchMode=yes -o ConnectTimeout=15 -i "$VPS_KEY" "$VPS_USER@$VPS_ADDR" \
  'sudo -n python3 -' > "$TYMCZASOWY" <<'PY'
import datetime
import json
import sqlite3

env = {}
with open("/etc/akuki/akuki.env") as f:
    for line in f:
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            key, value = line.split("=", 1)
            env[key] = value

log_path = env.get("AKUKI_ARENA_TOKEN_USAGE_LOG", "/var/lib/akuki/token-usage.jsonl")
data_dir = env.get("BORG_DATA_DIR") or env.get("AKUKI_DATA_DIR")

# Budget and model names repeat on every line, so they are sent once and rows
# carry their index: the file stays several times smaller than the raw log.
budgets, models, rows, skipped = {}, {}, [], 0


def index(table, key):
    if key not in table:
        table[key] = len(table)
    return table[key]


with open(log_path) as f:
    for line in f:
        try:
            r = json.loads(line)
            ts = datetime.datetime.fromisoformat(r["ts"].replace("Z", "+00:00"))
            rows.append([
                int(ts.timestamp() * 1000),
                index(budgets, r["budget"]),
                index(models, r["model"]),
                r["input_tokens"],
                r["output_tokens"],
                r.get("cache_read_input_tokens") or 0,
                r.get("cache_creation_input_tokens") or 0,
            ])
        except (ValueError, KeyError, TypeError):
            # A line still being appended when the file was read, or a malformed one.
            skipped += 1

wakes = []
if data_dir:
    db = sqlite3.connect(f"file:{data_dir}/borg.db?mode=ro", uri=True)
    try:
        wakes = [
            list(row)
            for row in db.execute(
                "SELECT ts, trigger_name, outcome, finalizer_rounds FROM autonomy_wakes ORDER BY ts"
            )
        ]
    finally:
        db.close()

out = {
    "pobrano": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
    "budzety": list(budgets),
    "modele": list(models),
    "wywolania": rows,
    "pominieteLinie": skipped,
    "pobudki": wakes,
}
print("window.AKUKI_TOKENY = " + json.dumps(out, separators=(",", ":")) + ";")
PY

mv "$TYMCZASOWY" "$CEL"
trap - EXIT
echo "dane: $CEL ($(wc -c < "$CEL") B)"

if [ "${1:-}" != "--bez-otwierania" ]; then
  STRONA="$KATALOG/panel/tokeny.html"
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$STRONA" >/dev/null 2>&1 &
  else
    echo "otworz w przegladarce: file://$STRONA"
  fi
fi
