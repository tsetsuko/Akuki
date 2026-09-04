---
id: TASK-024
title: >-
  VPS Oracle Cloud Free Tier dla Akukiego — konfiguracja, bezpieczeństwo i
  wdrożenie
status: In Progress
assignee: []
created_date: '2026-08-27'
updated_date: '2026-09-04 10:13'
labels: []
dependencies:
  - TASK-011
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
dostawców modeli NIE jest już blokerem: decyzją z 2026-09-02 Akuki korzysta wyłącznie z modeli
Anthropic, a smoke test z VPS-a przeszedł 2026-09-01. TASK-025 (droga przez Kratosa) został
zamknięty jako nieaktualny i zarchiwizowany 2026-09-04.

To zadanie NIE zmienia mechanizmow rozwojowych Akukiego. Zmienia miejsce uruchomienia i granice
operacyjne, dlatego migracja zywego katalogu musi zachowac:

- jeden proces zapisujacy pamiec (single writer),
- model embeddingow i wymiar zgodne z migrowanym katalogiem (kanoniczna konfiguracja zamrozona
  2026-09-04: Ollama, bge-m3, 1024),
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
- VPS nie rozwiązuje prywatnych domen Kratosa. Przestało to mieć znaczenie: droga przez Kratosa
  została porzucona decyzją z 2026-09-02.
- `npm start` uruchamia generic memory sidecar, a nie pełny runtime Akukiego. Nie tworzyć dla niego
  produkcyjnej usługi. Docelowa kompozycja używa cienkiego `BotArenaAdapter` i osobnego
  `AkukiRunner`; topologia procesu zależy od ustalenia kanonicznego lifecycle w TASK-011.
- Tomek wskazał dwa warianty providerów: Fortinet na VPS-ie dla Kratosa albo prostszy
  Anthropic-only na firmowej subskrypcji. Wybrany został drugi (decyzja 2026-09-02); pierwszy
  odpadł. Pomiar i zatwierdzenie wpływu na limity organizacji zostają w TASK-013.
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
- [x] #6 Provider embeddingów, model i wymiar zatwierdzone; zgodność z migrowanym corpusem potwierdzona
- [ ] #7 Sekrety poza repo, plik 0600; modele i CA skonfigurowane bez wklejania sekretow do historii
- [ ] #8 Migracja tenanta przeprowadzona przez zatrzymanie writera, kopie, sumy kontrolne i atomowe podstawienie
- [ ] #9 Backup poza VPS odtworzony probnie; procedura awaryjna zapisana
- [ ] #10 Po TASK-011 jeden proces konektora przezywa restart i nie dubluje ani nie gubi wiadomosci
- [ ] #11 Stan i zachowanie po migracji porownane snapshotem; migracja nie zmienila mechanizmow ani modeli
- [ ] #12 Runtime osiąga dostawcę modeli z użytkownika usługi, z pełną walidacją TLS i bez zależności od laptopa Zosi
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: claude
created: 2026-09-04 09:33
---
CO NAPRAWDĘ JEST ZROBIONE, stan na 2026-09-04 — żeby „In Progress” niosło informację. Sekcja „Stan wykonany 2026-08-28” w opisie była starsza niż rzeczywistość o cztery dni.

ZROBIONE PONAD STAN Z 28.08 (źródło: pomiary zapisane w TASK-022, TASK-013 i TASK-009, wszystkie z 2026-09-01):
- Smoke test Akuki-aware runtime'u przeszedł NA VPS-ie, nie tylko lokalnie: /opt/akuki/app (repo na 4d9cca2c, drzewo czyste), użytkownik akuki, dwie tury, wszystkie wywołania claude-opus-4-8, response.model zgodny na każdym.
- Cache działa cross-turn przez aiproxy z VPS-a: cache_read 16578 → 23645, cache_creation 27818 → 8537.
- Embeddingi Ollama bge-m3/1024 działają na localhoście VPS-a.
- Osobny, dłuższy przebieg: 28 tur odczytu t0 testu internalizacji w /var/lib/akuki/internalization-t0-live, log /var/lib/akuki/internalization-t0.log. To największy dotychczasowy przebieg na tej maszynie.
- Chroniony plik środowiskowy istnieje: /etc/akuki/akuki-smoke.env, root:akuki, 0640, wpisany przez sudoedit (procedura w borg/AKUKI_ORACLE_SMOKE_TEST.md).
- Wszystko to szło na katalogu akuki-smoke, czyli na kopii, nie na żywym tenancie.

NADAL NIEZROBIONE:
- Brak usługi systemd, brak produkcyjnego data root, brak stale działającego procesu, brak connectora (TASK-011).
- Migracja żywego tenanta nie została wykonana (AC #8, #11).
- Backup poza VPS-em i próbne odtworzenie — nie zrobione (AC #9).
- Kanoniczny provider embeddingów, model i wymiar nie są zatwierdzone (AC #6). bge-m3/1024 jest tym, czego użyto, ale to nie to samo co decyzja.
- Typecheck i smoke test LanceDB ARM64 z użytkownika usługi (AC #5) — npm ci i build przeszły, reszta nie została odnotowana.

ZMIANY W TYM ZADANIU 2026-09-04: AC #12 przepisane z „Zatwierdzony dostęp do Kratosa działa z prywatnym DNS/routingiem i pełną walidacją TLS (TASK-025)” na wymaganie niezależne od dostawcy, bo TASK-025 został zamknięty jako nieaktualny. W tutorialu poprawione: Etap 5 punkty 5-6 (Ollama i smoke test) oraz Etap 6 punkty 3-5 (zmienne środowiskowe trybu Anthropic-only zamiast klucza Kratosa i Play Root CA; cognition claude-opus-4-8 zamiast claude-sonnet-5, które było sprzeczne z borg/src/config/index.ts:322).
---

author: claude
created: 2026-09-04 10:13
---
AC #6 ZAMKNIĘTE 2026-09-04. Zosia zatwierdziła kanoniczną konfigurację embeddingów:

    provider  Ollama, OpenAI-compatible, http://127.0.0.1:11434/v1
    model     bge-m3
    wymiar    1024

Druga połowa kryterium — zgodność z migrowanym korpusem — sprawdzona, nie założona: data/akuki/config.json żywego tenanta ma dokładnie te trzy wartości, tak samo obie kopie w data/archive/ (akuki-pre-seed-20260825T120756 i akuki-wiped-2026-08-24T13-35-33). Ta sama konfiguracja była użyta we wszystkich pomiarach na VPS-ie 2026-09-01. Migracja ani re-embedding nie są potrzebne.

Ostrzeżenie zostaje w mocy i jest zapisane w KNOWN-ISSUES.md: generic memory sidecar nadal domyślnie używa generative-apis/qwen3-embedding-8b/4096 (borg/scripts/memory-sidecar-main.ts:53-54). Innego modelu ani wymiaru nie wolno wpuścić na katalog Akukiego bez migracji i re-embeddingu.

Etap 6 punkt 5 tutoriala już wcześniej poprawiony (claude-opus-4-8 zamiast claude-sonnet-5).
---
<!-- COMMENTS:END -->

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
5. Kanoniczna konfiguracja embeddingów jest zamrożona (Zosia, 2026-09-04): Ollama na
   `http://127.0.0.1:11434/v1`, model `bge-m3`, wymiar 1024 — te same wartości, które ma
   `data/akuki/config.json` żywego tenanta, więc migracja nie wymaga re-embeddingu. Instaluj Ollamę
   świadomie, jako element tej konfiguracji, a nie automatycznie przy okazji czegoś innego.
6. Pełna ścieżka Akuki-aware runtime'u została przetestowana na kopii danych 2026-09-01
   (`/var/lib/akuki/data/akuki-smoke`) i przeszła. Udany `npm run build` nadal nie potwierdza LLM
   ani embeddingów — to potwierdza dopiero smoke test.

### Etap 6 — sekrety i konfiguracja

1. Utworz `/etc/akuki/` nalezacy do roota.
2. Sekrety zapisz w `/etc/akuki/akuki.env` z prawami `0600`. Plik nie trafia do Git, backupu kodu,
   logow ani historii powloki.
3. Potrzebne wartości obejmują poświadczenia Bot Areny oraz uwierzytelnienie do Anthropica.
   Zweryfikowany na VPS-ie zestaw (2026-09-01, opisany w `borg/AKUKI_ORACLE_SMOKE_TEST.md`) to
   tryb proxy: `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_BASE_URL`, `AKUKI_ANTHROPIC_PROXY=1`,
   `AKUKI_ANTHROPIC_ONLY=1`, `AKUKI_DATA_DIR`, pięć zmiennych `BORG_MODEL_*` oraz cztery
   `BORG_EMBEDDING_*`. Tryb bezpośredni używa zamiast tego `ANTHROPIC_API_KEY` bez
   `ANTHROPIC_BASE_URL`. Nie mieszać tych dwóch bloków — smoke guard odrzuca oba naraz.
4. Play Root CA i `NODE_EXTRA_CA_CERTS` odpadły razem z drogą przez Kratosa (decyzja 2026-09-02).
   Nie konfigurować ich dla Akukiego.
5. Cognition to `claude-opus-4-8` (`borg/src/config/index.ts:322`), a w trybie
   `AKUKI_ANTHROPIC_ONLY=1` wszystkie pięć ról musi być modelami `claude-*` — guard odrzuca inne
   (`borg/src/akuki/smoke-config.ts:50`). Migracja VPS nie jest zgodą na zmianę modeli.
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
