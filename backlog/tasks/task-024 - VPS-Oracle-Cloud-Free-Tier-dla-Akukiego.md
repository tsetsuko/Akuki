---
id: TASK-024
title: >-
  VPS Oracle Cloud Free Tier dla Akukiego — konfiguracja, bezpieczeństwo i
  wdrożenie
status: In Progress
assignee: []
created_date: '2026-08-27'
updated_date: '2026-09-02 17:21'
labels: []
dependencies:
  - TASK-011
  - TASK-025
priority: medium
ordinal: 7500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Przygotowac VPS dla Akukiego na Oracle Cloud Infrastructure (OCI) Always Free. Zosia nigdy
wczesniej nie konfigurowala OCI, wiec zadanie zawiera instrukcje od zalozenia konta do odtwarzalnego
uruchomienia uslugi.

TASK-011 jest zaleznoscia tylko dla OSTATNIEGO etapu: stalego procesu laczacego Akukiego z Bot Arena.
Konto, siec, VM, zabezpieczenia, Node, kod i kopie zapasowe mozna przygotowac wczesniej. Dostęp do
providerów pozostaje osobnym blokerem TASK-025.

To zadanie NIE zmienia mechanizmow rozwojowych Akukiego. Zmienia miejsce uruchomienia i granice
operacyjne, dlatego migracja zywego katalogu musi zachowac:

- jeden proces zapisujacy pamiec (single writer),
- model embeddingow i wymiar zgodne z migrowanym katalogiem (kanoniczna konfiguracja nadal wymaga decyzji),
- brak publicznego dostepu do runtime'u Borga i plikow pamieci,
- sekrety poza repozytorium,
- kopie zapasowa poza VPS-em,
- sprawdzalny koszt 0, nie zalozenie "Free Tier na pewno oznacza zero".

### Co wiemy przed rozpoczeciem

- Rekomendowany ksztalt to ARM `VM.Standard.A1.Flex`, bo mikroinstancja AMD ma tylko 1 GB RAM,
  co jest za malo na komfortowe uruchomienie Node + borga.
- Fork ma zaleznosci ARM64: lockfile zawiera `@lancedb/lancedb-linux-arm64-gnu`, esbuild ARM64
  i pozostale natywne paczki. To jest wskazowka, nie dowod — instalacja i smoke test na prawdziwej
  maszynie ARM sa osobnym krokiem.
- Akuki dzis potrzebuje Node `>=22.18.0`.
- Katalog zywego tenanta jest maly, ale jest stanem nieodtwarzalnym po rozpoczeciu rozmow.

### Stan wykonany 2026-08-28

- VM istnieje; użytkownik usługi to `akuki` z katalogiem domowym `/var/lib/akuki` i shellem
  `nologin`.
- `/opt/akuki/spec` zawiera repozytorium specyfikacji Akukiego.
- `/opt/akuki/app` zawiera `tsetsuko/borg`, branch `akuki-dev`.
- Oba repozytoria mają osobne deploy keys tylko do odczytu.
- `npm ci` i `npm run build` zakończyły się poprawnie.
- Nie utworzono usługi systemd, nie zapisano sekretów, nie przeniesiono produkcyjnych danych i nie
  uruchomiono procesu.
- VPS nie rozwiązuje prywatnych domen Kratosa; dostęp do modeli jest blokerem opisanym w TASK-025.
- `npm start` uruchamia generic memory sidecar, a nie pełny runtime Akukiego. Nie tworzyć dla niego
  produkcyjnej usługi. Docelowa kompozycja używa cienkiego `BotArenaAdapter` i osobnego
  `AkukiRunner`; topologia procesu zależy od ustalenia kanonicznego lifecycle w TASK-011.
- Tomek wskazał dwa warianty providerów: Fortinet na VPS-ie dla Kratosa albo prostszy
  Anthropic-only na firmowej subskrypcji. Pierwszy wymaga decyzji sieciowej (TASK-025), drugi pomiaru
  i zatwierdzenia wpływu na limity organizacji (TASK-013).
- Tomek następnie zatwierdził krótkotrwały eksperyment Anthropic-only na swoją odpowiedzialność,
  z natychmiastowym wyłączeniem przy zbyt dużym zużyciu. To zezwala na kontrolowany test, nie na
  nieograniczony start produkcyjny.

### Uwaga o limitach Free Tier

Oficjalne strony Oracle sa obecnie niespojne: jedna opisuje ekwiwalent 2 OCPU / 12 GB RAM dla A1,
inna nadal podaje 4 OCPU / 24 GB RAM. Nie rozstrzygamy tego komentarzem ani blogiem. W dniu
zakladania konta zapisujemy, co pokazuje ekran `Limits, Quotas and Usage`, i tworzymy WYŁĄCZNIE
zasoby oznaczone `Always Free eligible`, z estymowanym kosztem 0.

Budzet i alert kosztowy NIE sa twardym limitem wydatkow. Ostrzegaja, ale nie zatrzymuja zasobow.
Twarda ochrona to: brak upgrade do Pay As You Go, etykieta Always Free, kontrola limitow, brak
niepotrzebnych zasobow i reczne sprawdzenie estymaty przed kliknieciem Create.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Konto OCI Free Tier zalozone; region domowy i rzeczywiste limity z konsoli zapisane z data
- [ ] #2 MFA oraz alerty budzetowe wlaczone; brak upgrade do Pay As You Go
- [ ] #3 A1 ARM64 VM utworzona jako Always Free z estymowanym kosztem 0
- [ ] #4 NSG i firewall wpuszczaja tylko SSH od Zosi/Bastiona; brak publicznych portow aplikacji
- [ ] #5 Node >=22.18, npm ci, typecheck, build i LanceDB ARM64 smoke test przechodza
- [ ] #6 Provider embeddingów, model i wymiar zatwierdzone; zgodność z migrowanym corpusem potwierdzona
- [ ] #7 Sekrety poza repo, plik 0600; modele i CA skonfigurowane bez wklejania sekretow do historii
- [ ] #8 Migracja tenanta przeprowadzona przez zatrzymanie writera, kopie, sumy kontrolne i atomowe podstawienie
- [ ] #9 Backup poza VPS odtworzony probnie; procedura awaryjna zapisana
- [ ] #10 Po TASK-011 jeden proces konektora przezywa restart i nie dubluje ani nie gubi wiadomosci
- [ ] #11 Stan i zachowanie po migracji porownane snapshotem; migracja nie zmienila mechanizmow ani modeli
- [ ] #12 Zatwierdzony dostęp do Kratosa działa z prywatnym DNS/routingiem i pełną walidacją TLS (TASK-025)
<!-- AC:END -->

## Tutorial

<!-- SECTION:TUTORIAL:BEGIN -->
### Etap 0 — decyzje przed zalozeniem konta

1. Wybierz region domowy blisko Polski, ale sprawdz dostepnosc A1. Regionu domowego nie mozna
   pozniej zmienic, a zasoby Always Free Compute musza powstac w regionie domowym.
2. Nie wybieraj regionu tylko dlatego, ze ktos w internecie mial tam wolne A1. Pojemnosc zmienia sie.
3. Ustal adres e-mail do konta oraz telefon/aplikacje do MFA.
4. Przygotuj lokalny klucz SSH. Nie korzystaj z hasla do logowania na serwer:

   ```bash
   ssh-keygen -t ed25519 -a 64 -f ~/.ssh/akuki_oci -C akuki-oci
   ```

   Prywatny plik `~/.ssh/akuki_oci` zostaje lokalnie. Do OCI wgrywa sie tylko plik `.pub`.

### Etap 1 — konto i bariera kosztowa

1. Wejdz na `https://signup.oraclecloud.com` i zaloz konto Free Tier.
2. Wybierz region domowy swiadomie — po utworzeniu tenancy nie da sie go zmienic.
3. Oracle moze poprosic o karte do weryfikacji. Wedlug dokumentacji karta nie jest obciazana,
   dopoki konto nie zostanie recznie podniesione do platnego. Nie klikaj `Upgrade`.
4. Po pierwszym logowaniu wlacz MFA dla swojego uzytkownika.
5. Otworz `Governance & Administration -> Limits, Quotas and Usage` i zapisz do notatki:
   - limit A1 OCPU,
   - limit A1 memory,
   - limit Block Volume,
   - region i date odczytu.
6. Utworz compartment `akuki`, zeby zasoby i koszty projektu byly oddzielone od przyszlych
   eksperymentow.
7. Utworz budzet dla compartmentu `akuki` z alertami przy bardzo niskiej kwocie, np. 1 PLN i 5 PLN.
   To czujnik dymu, nie bezpiecznik.

STOP: przed tworzeniem VM pokazac Zosi ekran limitow i plan zasobow. Nie zakladac liczb z tutoriala.

### Etap 2 — siec bez publicznej aplikacji

1. Uruchom `Start VCN Wizard -> Create VCN with Internet Connectivity`.
2. Nazwij siec `akuki-vcn` i utworz publiczna podsiec dla jednej VM.
3. Utworz Network Security Group `akuki-vps`. Oracle rekomenduje NSG zamiast dokladania regul
   aplikacyjnych do listy calej podsieci.
4. Dodaj tylko jedna regule ingress:
   - stateful,
   - TCP,
   - port docelowy 22,
   - source: publiczny adres Zosi z maska `/32`, NIE `0.0.0.0/0`.
5. Egress musi pozwalac na HTTPS do zatwierdzonych dostawcow modeli, Bot Areny, npm, Git i aktualizacji systemu.
6. Nie otwieraj portow runtime'u Borga ani narzędzi developerskich. Bot Arena ma byc odpytywana przez
   konektor, wiec nie potrzebuje publicznego portu przychodzacego.
7. Obecna reguła SSH na port 22 może pozostać ograniczona do publicznego IP Zosi. Ewentualny nowy
   port proxy wymaga osobnej reguły `/32`, host firewalla i zgody sieciowej; nie jest potrzebny, jeśli
   z P4 korzysta wyłącznie runtime na VPS-ie.
7. Jesli adres domowy jest zmienny, aktualizuj `/32` albo uzyj OCI Bastion. Nie poszerzaj SSH na
   caly internet jako stalego rozwiazania.

### Etap 3 — utworzenie VM

1. `Compute -> Instances -> Create instance`.
2. Compartment: `akuki`; nazwa: `akuki-01`.
3. Obraz: Ubuntu 24.04 LTS ARM64.
4. Shape: `VM.Standard.A1.Flex`, koniecznie z etykieta `Always Free eligible`.
5. Przydziel zasoby mieszczace sie w limitach pokazanych w TWOJEJ konsoli. Rozsadny punkt startowy
   to 2 OCPU i 12 GB RAM, ale ekran limitow ma pierwszenstwo.
6. Boot volume: najmniejszy sensowny rozmiar mieszczacy system, model embeddingowy, kod, logi i
   backup roboczy; nie przekraczaj lacznego darmowego limitu Block Volume. Przed Create sprawdz
   estymate kosztu.
7. Wybierz `akuki-vcn`, publiczna podsiec i NSG `akuki-vps`.
8. Wklej zawartosc `~/.ssh/akuki_oci.pub`.
9. Przed `Create`: etykieta Always Free, koszt 0, ARM A1, poprawny NSG, poprawny klucz.
10. Jesli pojawi sie `out of host capacity`, nie zmieniaj shape na platny. Sprobuj innego
    availability domain albo wroc pozniej. To brak pojemnosci, nie blad konfiguracji.

Oracle moze odzyskac bezczynna instancje Always Free. Nie generujemy sztucznego ruchu, by oszukiwac
regule bezczynnosci; zamiast tego wdrozenie ma byc odtwarzalne, a dane regularnie kopiowane poza VPS.

### Etap 4 — pierwsze SSH i utwardzenie systemu

Na komputerze Zosi:

```bash
chmod 600 ~/.ssh/akuki_oci
ssh -i ~/.ssh/akuki_oci ubuntu@PUBLICZNY_IP
```

Na VPS:

```bash
uname -m
sudo apt update
sudo apt full-upgrade
sudo reboot
```

Oczekiwane `uname -m`: `aarch64`. Po restarcie polacz sie ponownie i sprawdz:

```bash
sudo systemctl status ssh
sudo ss -lntup
```

Nastepnie:

1. Zostaw logowanie SSH kluczem; nie wlaczaj hasel ani logowania roota.
2. Ustaw firewall hosta jako druga warstwe ochrony. Regula ma odpowiadac NSG: SSH tylko z adresu
   Zosi, zadnych publicznych portow aplikacji.
3. Wlacz automatyczne aktualizacje bezpieczenstwa Ubuntu.
4. Ustaw prawidlowa strefe czasu dla logow (`Europe/Warsaw`) albo konsekwentnie zostaw UTC i
   zapisuj to jawnie w dokumentacji operacyjnej.
5. Po kazdej zmianie firewalla zostaw jedna dzialajaca sesje SSH otwarta i sprawdz nowe polaczenie
   w drugim terminalu, zanim zamkniesz pierwsza.

### Etap 5 — runtime Akukiego

1. Zainstaluj Node w wersji spelniajacej `>=22.18.0`. Sprawdz, nie zakladaj:

   ```bash
   node --version
   npm --version
   ```

2. Pobierz fork borga na galaz `akuki-dev`. Dla prywatnego repo uzyj klucza deploy tylko do odczytu;
   nie kopiuj osobistego klucza GitHub na VPS.
3. W katalogu forka:

   ```bash
   npm ci
   npm run typecheck
   npm run build
   ```

4. `npm ci` i `npm run build` wykonano poprawnie. Nadal trzeba wykonać typecheck oraz potwierdzić,
   że natywny pakiet LanceDB ARM64 ładuje się z użytkownika usługi.
5. Nie instaluj Ollamy automatycznie. Aktualny Akuki-aware runtime korzysta z wstrzykiwanych klientów
   i może używać Kratosa do embeddingów. Najpierw zamroź kanoniczny model oraz wymiar i sprawdź
   zgodność z migrowanym katalogiem.
6. Przetestuj pełną ścieżkę Akuki-aware runtime'u na kopii danych dopiero po zatwierdzeniu dostępu
   do providerów w TASK-025. Udany `npm run build` nie potwierdza DNS, TLS, LLM ani embeddingów.

### Etap 6 — sekrety i konfiguracja

1. Utworz `/etc/akuki/` nalezacy do roota.
2. Sekrety zapisz w `/etc/akuki/akuki.env` z prawami `0600`. Plik nie trafia do Git, backupu kodu,
   logow ani historii powloki.
3. Potrzebne wartości obejmują poświadczenia Bot Areny, token Anthropica/proxy, klucz Kratosa i
   ścieżkę do Play Root CA. Nazwy zmiennych runtime'u muszą odpowiadać Akuki-aware ścieżce
   (`AKUKI_LLM_BASE_URL`, `AKUKI_LLM_API_KEY`, `AKUKI_ANTHROPIC_API_KEY`,
   `AKUKI_ENDPOINT_MODEL`), a nie generic memory sidecarowi.
4. Certyfikat CA nie jest sekretem, ale musi byc dostarczony jawnie i wskazany przez
   `NODE_EXTRA_CA_CERTS` przed startem Node.
5. Cognition pozostaje `claude-sonnet-5`; role wolumenowe pozostaja na wybranym modelu Kratosa.
   Migracja VPS nie jest zgoda na zmiane modeli.
6. Przed migracją ustal i zapisz kanoniczny model embeddingów oraz wymiar. Nie mieszaj istniejącego
   corpus 1024 z konfiguracją sidecara `qwen3-embedding-8b`/4096 bez migracji i re-embeddingu.
7. Kazdy serwis systemd dostaje jawny `EnvironmentFile=/etc/akuki/akuki.env`, osobnego
   nieuprzywilejowanego uzytkownika, `Restart=on-failure` i katalog roboczy. Nigdy dwa serwisy
   zapisujace ten sam tenant.

### Etap 7 — migracja danych bez rozdwojenia Akukiego

1. Zatrzymaj wszystkie lokalne procesy mogace pisac do `data/akuki`.
2. Zrob lokalny snapshot instrumentacyjny oraz osobna kopie calego katalogu tenanta.
3. Policz sumy kontrolne kopii.
4. Przenies dane szyfrowanym `rsync`/SSH do katalogu tymczasowego na VPS.
5. Sprawdz sumy po drugiej stronie.
6. Dopiero potem atomowo przemianuj katalog tymczasowy na docelowy.
7. Lokalna kopia pozostaje backupem, ale od tej chwili tylko JEDNA lokalizacja moze byc aktywnym
   writerem. Nie uruchamiac lokalnego i VPS-owego Akukiego rownoczesnie.
8. Pierwszy smoke test wykonaj na KOPII katalogu na VPS. Nie wpisuj zmyslonej wiadomosci Zosi do
   zywej pamieci.

### Etap 8 — usluga i polaczenie z Arena

Ten etap czeka na TASK-011.

1. Konektor odpytuje Bot Arena wychodzaco; nie wystawiamy publicznego HTTP, jesli protokol tego nie
   wymaga.
2. Systemd uruchamia zatwierdzoną kompozycję `BotArenaAdapter` + `AkukiRunner` i pilnuje restartu.
   Adapter nie zarządza Borgiem; lifecycle pamięci należy do runnera.
3. Generic memory sidecar nie jest częścią głównej ścieżki i nie może pisać do tego samego katalogu.
4. Logi nie moga zawierac tokenow, pelnych promptow prywatnych ani zawartosci pamieci bez potrzeby.
5. Po restarcie VM konektor wznawia od ostatniego trwalego kursora i nie odpowiada dwa razy na te
   sama wiadomosc.

### Etap 9 — backup, monitoring i procedura odtworzenia

1. Backup katalogu `data/akuki` trafia regularnie POZA VPS. Backup na tym samym boot volume nie jest
   backupem.
2. Przed kopia zatrzymaj writera albo uzyj zatwierdzonego, spojnego mechanizmu snapshotu. OCI boot
   volume backup jest crash-consistent, ale nie zastepuje aplikacyjnie spojnej kopii zywego tenanta.
3. Monitoruj: miejsce na dysku, RAM, restarty systemd, wiek ostatniego backupu i wzrost plikow logu.
4. Wlacz rotacje logow.
5. Raz wykonaj probe odtworzenia na NOWEJ kopii katalogu i uruchom tylko odczyt/snapshot. Backup,
   ktorego nigdy nie odtworzono, jest obietnica, nie pomiarem.
6. Zapisz instrukcje awaryjna: zatrzymanie uslugi, pobranie najnowszego backupu, kontrola sum,
   odtworzenie katalogu, pojedynczy start writera, snapshot kontrolny.

### Etap 10 — lista odbiorowa

Przed uznaniem VPS za gotowy:

- OCI pokazuje zasoby jako Always Free i estymowany koszt 0.
- MFA jest wlaczone; prywatny SSH key istnieje tylko lokalnie.
- SSH jest ograniczone do `/32` Zosi lub Bastiona.
- Publicznie nie slucha runtime Borga ani żaden port narzędzi developerskich.
- `uname -m` = `aarch64`; Node spelnia `>=22.18.0`.
- `npm ci`, typecheck, build i LanceDB ARM64 smoke test przechodza.
- Kanoniczny provider embeddingów, model i wymiar są zatwierdzone oraz zgodne z danymi.
- Runtime osiąga providerów z pełną walidacją TLS; rozwiązanie produkcyjne nie zależy od laptopa.
- Sekrety maja prawa `0600` i nie sa w Git ani logach.
- Istnieje backup poza VPS i udana proba odtworzenia.
- Jest dokladnie jeden aktywny writer pamieci.
- Restart VM nie tworzy podwojnej odpowiedzi ani nie gubi kursora Arena.
<!-- SECTION:TUTORIAL:END -->

## Sources

<!-- SECTION:SOURCES:BEGIN -->
- Oracle: Always Free resources and idle-instance reclamation:
  https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
- Oracle: Free Tier lifecycle and account upgrade:
  https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm
- Oracle: home region cannot be changed:
  https://docs.oracle.com/en-us/iaas/Content/Identity/Tasks/managingregions.htm
- Oracle: creating a Compute instance:
  https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/launchinginstance.htm
- Oracle: SSH key pairs and Linux connection:
  https://docs.oracle.com/iaas/Content/Compute/Tasks/managingkeypairs.htm
- Oracle: NSGs and security rules:
  https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/securityrules.htm
- Oracle: MFA:
  https://docs.oracle.com/en-us/iaas/Content/Identity/Tasks/usingmfa.htm
- Oracle: budget alert rules:
  https://docs.oracle.com/en-us/iaas/Content/Billing/Tasks/create-alert-rule.htm
- Oracle: boot volume backups:
  https://docs.oracle.com/en-us/iaas/Content/Block/Concepts/bootvolumebackups.htm
<!-- SECTION:SOURCES:END -->
