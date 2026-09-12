#!/usr/bin/env bash
# Uruchamianie Akukiego i sprawdzanie, czy naprawde zyje.
#
#   ./akuki-serwis.sh            stan (domyslnie)
#   ./akuki-serwis.sh start      podnosi usluge i pokazuje stan
#   ./akuki-serwis.sh stop       zatrzymuje usluge (przed scaleniem, kopia, migracja)
#   ./akuki-serwis.sh restart    zatrzymuje i podnosi, np. po nowym buildzie
#   ./akuki-serwis.sh log        ostatnie 50 linii dziennika
#   ./akuki-serwis.sh gui        tunel do VPS-a + front na laptopie (Ctrl+C konczy)
#
# "Aktywny" i "zywy" to dwie rozne rzeczy i skrypt rozdziela je celowo: systemd
# moze raportowac active, podczas gdy proces nie odpowiada. Dlatego stan pyta
# jeszcze API serwera demo na 127.0.0.1:7740 po stronie VPS-a.
#
# Kod wyjscia stanu: 0 gdy aktywny I odpowiada, 1 w kazdym innym przypadku.
set -euo pipefail

VPS_USER=ubuntu
VPS_ADDR=${AKUKI_VPS_ADDR:-100.124.237.35}
VPS_KEY=${AKUKI_VPS_KEY:-$HOME/.ssh/akuki_oci}

AKCJA=${1:-stan}
case "$AKCJA" in
  stan|status) AKCJA=stan ;;
  start|stop|restart|log|gui) ;;
  *) echo "Nieznana akcja: $AKCJA. Uzyj: stan | start | stop | restart | log | gui" >&2; exit 2 ;;
esac

# Front dziala NA LAPTOPIE, nie na VPS-ie: serwer deweloperski Vite przekazuje
# /api na 127.0.0.1:7740, wiec wystarczy, zeby ten port byl tunelem do VPS-a.
# Dlatego ta akcja jest obslugiwana tu, lokalnie, i nie idzie przez ssh nizej.
if [ "$AKCJA" = "gui" ]; then
  KATALOG=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

  # Tunel dostaje wlasne gniazdo sterujace, zeby dalo sie go zamknac PRECYZYJNIE.
  # Zabijanie po wzorcu wiersza polecen (pkill -f "7740:...") trafia takze
  # w interaktywna sesje ssh z tym samym przekierowaniem i zrywa komus terminal.
  GNIAZDO=${AKUKI_TUNEL_SOCK:-/tmp/akuki-tunel-7740.sock}

  if (exec 3<>/dev/tcp/127.0.0.1/7740) 2>/dev/null; then
    echo "port 7740 lokalnie juz zajety -- uzywam tego, co juz nasluchuje"
    echo "UWAGA: jesli to lokalnie uruchomiony Borg, a nie tunel, masz DWOCH piszacych"
    echo "       do pamieci Akukiego. Sprawdz czym to jest: lsof -i :7740"
  else
    echo "otwieram tunel 7740 -> $VPS_ADDR"
    ssh -f -N -M -S "$GNIAZDO" -o BatchMode=yes -o ConnectTimeout=15 \
      -o ExitOnForwardFailure=yes -i "$VPS_KEY" \
      -L 7740:127.0.0.1:7740 "$VPS_USER@$VPS_ADDR"
  fi

  KOD=$(curl -s -o /dev/null -m 5 -w "%{http_code}" http://127.0.0.1:7740/api/state || echo 000)
  echo "API przez tunel: HTTP $KOD"
  if [ "$KOD" != "200" ]; then
    echo "API nie odpowiada, front pokazalby pusta skorupe. Sprawdz: ./akuki-serwis.sh stan" >&2
    exit 1
  fi

  echo "front: http://localhost:5173 (Ctrl+C konczy front; tunel zostaje)"
  echo "zamkniecie tunelu: ssh -S $GNIAZDO -O exit $VPS_USER@$VPS_ADDR"
  exec npm --prefix "$KATALOG/borg" run dev:web
fi

ssh -o BatchMode=yes -o ConnectTimeout=15 -i "$VPS_KEY" "$VPS_USER@$VPS_ADDR" \
  "sudo -n env AKCJA=$AKCJA bash -s" <<'REMOTE'
set -uo pipefail

case "$AKCJA" in
  start)   systemctl start akuki ;;
  stop)    systemctl stop akuki ;;
  restart) systemctl restart akuki ;;
esac

if [ "$AKCJA" = "log" ]; then
  journalctl -u akuki -n 50 --no-pager
  exit 0
fi

if [ "$AKCJA" = "stop" ]; then
  echo "usluga: $(systemctl is-active akuki)"
  echo "Akuki zatrzymany. Podniesienie: ./akuki-serwis.sh start"
  exit 0
fi

# Po starcie proces potrzebuje chwili na otwarcie portu; pytamy do 10 razy
# co sekunde, zamiast raz od razu i falszywie orzekac, ze nie odpowiada.
KOD=000
for _ in $(seq 1 10); do
  KOD=$(curl -s -o /dev/null -m 3 -w "%{http_code}" http://127.0.0.1:7740/api/state || echo 000)
  [ "$KOD" = "200" ] && break
  sleep 1
done

AKTYWNA=$(systemctl is-active akuki)
OD=$(systemctl show akuki --property=ActiveEnterTimestamp --value)

echo "usluga:      $AKTYWNA (od: ${OD:-brak})"
echo "API 7740:    HTTP $KOD"
echo "pamiec:      $(journalctl -u akuki -n 200 --no-pager | grep -o 'tenant=[^ ]*' | tail -1)"
echo "rozmowca:    $(journalctl -u akuki -n 200 --no-pager | grep -o 'default session audience: .*' | tail -1)"
echo "konektor:    $(journalctl -u akuki -n 200 --no-pager | grep -c 'connector started inside the host process') start(ow) w ostatnich 200 liniach"

BLEDY=$(journalctl -u akuki -n 200 --no-pager | grep -ciE "fatal|unhandled|Error:" || true)
[ "$BLEDY" -gt 0 ] && echo "UWAGA:       $BLEDY linii z bledem w ostatnich 200 -- zajrzyj przez ./akuki-serwis.sh log"

if [ "$AKTYWNA" = "active" ] && [ "$KOD" = "200" ]; then
  echo "wniosek:     zywy"
  exit 0
fi

echo "wniosek:     NIE ZYJE (aktywny=$AKTYWNA, API=$KOD)"
exit 1
REMOTE
