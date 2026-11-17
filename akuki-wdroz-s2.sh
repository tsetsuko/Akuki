#!/usr/bin/env bash
# Wgranie TASK-057 (2026-11-02): S2 dla Akukiego bez trybu refleksyjnego i bez niskiej pewnosci.
# Kolejnosc ma znaczenie: kod najpierw, config potem -- stary kod odrzucilby nowy klucz.
set -euo pipefail
KEY="$HOME/.ssh/akuki_oci"
VPS=ubuntu@100.124.237.35

echo "== 1. wgranie kodu (oczekiwany fork: a7144b96)"
ssh -o BatchMode=yes -i "$KEY" "$VPS" 'sudo -n /opt/akuki/spec/akuki-wgraj.sh' \
  | grep -vE '^(CLI|ESM|DTS) ' | tail -6

echo "== 2. config: deliberation.system2Triggers = oba wylaczone"
ssh -o BatchMode=yes -i "$KEY" "$VPS" 'sudo -n bash -s' <<'REMOTE'
set -e
C=/var/lib/akuki/data/akuki/config.json
cp -a "$C" "$C.bak-20261102-s2"
python3 - "$C" <<'PY'
import json, sys
p = sys.argv[1]
d = json.load(open(p))
d.setdefault("deliberation", {})["system2Triggers"] = {
    "reflectiveMode": False,
    "lowRetrievalConfidence": False,
}
json.dump(d, open(p, "w"), indent=2)
print(json.dumps(d["deliberation"]))
PY
chown akuki:akuki "$C"
REMOTE

echo "== 3. restart"
cd /home/zosia/projects/ai/akuki && ./akuki-serwis.sh restart
