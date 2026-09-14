#!/usr/bin/env bash
# Wgranie nowego kodu Akukiego: pobranie, zbudowanie, sprawdzenie.
#
# Uruchamiany NA VPS-ie:
#   ssh akuki
#   /opt/akuki/spec/akuki-wgraj.sh
#
# CZEGO NIE ROBI: nie restartuje uslugi i nie dotyka config.json. Restart jest
# osobna decyzja i robi sie go z laptopa przez ./akuki-serwis.sh restart.
#
# UWAGA, KTORA NIE JEST OCZYWISTA. Samo zbudowanie zmienia juz zachowanie
# Akukiego, bez zadnego restartu. Zasiew -- scaffolding.md i temperament.yaml --
# jest czytany z dist/ przy KAZDEJ turze, wiec nowe reguly obowiazuja od razu po
# buildzie. Restartu potrzebuje dopiero reszta kodu.
#
# Repozytoria i klucze naleza do uzytkownika akuki (katalog domowy /var/lib/akuki,
# nie /home/akuki), wiec kazde polecenie gita i npm idzie przez sudo -u akuki.
# Budowanie jako root zostawiloby w dist/ pliki, ktorych usluga nie umie podmienic.

set -uo pipefail

APP=/opt/akuki/app      # fork borga, galaz akuki-dev
SPEC=/opt/akuki/spec    # repozytorium Akukiego; /opt/akuki/spec/borg to dowiazanie do APP
UZYTKOWNIK=akuki

# Skrypt aktualizuje SAM SIEBIE, bo lezy w repozytorium, ktore pobiera. Bash
# czyta plik w miarę wykonywania, wiec podmiana w trakcie potrafi przeskoczyc
# w srodek zdania. Cale cialo siedzi dlatego w funkcji: bash parsuje ja w
# calosci, zanim wykona pierwsza linie.
main() {
  local przed_app przed_spec

  jako() { sudo -u "$UZYTKOWNIK" -H "$@"; }
  blad() { echo "BLAD: $*" >&2; exit 1; }

  for repo in "$APP" "$SPEC"; do
    [ -d "$repo/.git" ] || blad "$repo nie jest repozytorium gita"
    # Pominiete pliki nieśledzone: w SPEC lezy nieśledzone dowiazanie borg, ktore
    # nie przeszkadza w pobraniu. Blokuja wylacznie zmiany w plikach sledzonych,
    # bo te pull moglby nadpisac.
    if [ -n "$(jako git -C "$repo" status --porcelain --untracked-files=no)" ]; then
      echo "--- niezapisane zmiany w $repo ---" >&2
      jako git -C "$repo" status --short --untracked-files=no >&2
      blad "$repo ma zmiany w plikach sledzonych; pobranie moglo by je nadpisac"
    fi
  done

  przed_app=$(jako git -C "$APP" rev-parse HEAD) || blad "nie odczytalem stanu $APP"
  przed_spec=$(jako git -C "$SPEC" rev-parse HEAD) || blad "nie odczytalem stanu $SPEC"

  echo "== pobieranie =="
  # --ff-only: jesli historia sie rozjechala, chcemy sie o tym dowiedziec,
  # a nie dostac scalenia zrobionego po cichu na serwerze.
  jako git -C "$APP" pull --ff-only || blad "pobranie $APP nie powiodlo sie"
  jako git -C "$SPEC" pull --ff-only || blad "pobranie $SPEC nie powiodlo sie"

  echo
  echo "== co przyszlo =="
  if [ "$przed_app" = "$(jako git -C "$APP" rev-parse HEAD)" ]; then
    echo "fork: bez zmian"
  else
    jako git -C "$APP" log --oneline "$przed_app..HEAD" | sed 's/^/  fork: /'
  fi
  if [ "$przed_spec" = "$(jako git -C "$SPEC" rev-parse HEAD)" ]; then
    echo "konektor: bez zmian"
  else
    jako git -C "$SPEC" log --oneline "$przed_spec..HEAD" | sed 's/^/  konektor: /'
  fi

  # Budowane bezwarunkowo, takze gdy fork sie nie zmienil. Build trwa
  # kilkanascie sekund, a stan, ktoremu ten skrypt ma zapobiegac -- zrodla nowe,
  # dist stary -- wyglada dokladnie jak sukces i nie daje zadnego bledu.
  echo
  echo "== budowanie forka =="
  jako npm --prefix "$APP" run build || blad "budowanie nie powiodlo sie; dist zostal stary"

  echo
  echo "== sprawdzenie =="

  # 1. Zasiew. Porownanie bajt w bajt zamiast szukania konkretnej reguly: dziala
  #    dla kazdej przyszlej zmiany w zasiewie, nie tylko dla tej dzisiejszej.
  local plik
  for plik in scaffolding.md temperament.yaml; do
    [ -f "$APP/dist/$plik" ] || blad "dist/$plik nie istnieje; build nie skopiowal zasiewu"
    if cmp -s "$APP/src/akuki/seed/$plik" "$APP/dist/$plik"; then
      echo "  zasiew $plik: zgodny ze zrodlem"
    else
      blad "dist/$plik rozni sie od src/akuki/seed/$plik; Akuki czytalby stare reguly"
    fi
  done

  # 2. Skompilowany kod. Jesli cokolwiek w src/ jest nowsze niz dist/index.js,
  #    build nie objal wszystkiego.
  [ -f "$APP/dist/index.js" ] || blad "dist/index.js nie istnieje"
  local nowsze
  nowsze=$(find "$APP/src" -name '*.ts' -newer "$APP/dist/index.js" -print -quit 2>/dev/null)
  if [ -n "$nowsze" ]; then
    blad "dist/index.js jest starszy niz $nowsze; build nie objal calosci"
  fi
  echo "  dist/index.js: nowszy niz wszystkie zrodla"

  echo
  echo "fork:     $(jako git -C "$APP" log --oneline -1)"
  echo "konektor: $(jako git -C "$SPEC" log --oneline -1)"
  echo
  echo "Gotowe. Nowy zasiew obowiazuje juz teraz; reszta kodu czeka na restart."
  echo "Restart z laptopa: ./akuki-serwis.sh restart"
}

main "$@"
