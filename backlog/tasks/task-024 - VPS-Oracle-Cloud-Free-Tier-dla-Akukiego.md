---
id: TASK-024
title: >-
  VPS Oracle Cloud Free Tier dla Akukiego — konfiguracja, bezpieczeństwo i
  wdrożenie
status: In Progress
assignee: []
created_date: '2026-08-27'
updated_date: '2026-09-08 12:20'
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
- [x] #4 Dostęp zawężony na obu drogach: NSG bez reguł ingress dla portów aplikacji, a polityka tailnetu przepuszcza tylko wskazane urządzenia na wskazane porty; brak publicznych portów aplikacji
- [x] #5 Node >=22.18, npm ci, typecheck, build i LanceDB ARM64 smoke test przechodza
- [x] #6 Provider embeddingów, model i wymiar zatwierdzone; zgodność z migrowanym corpusem potwierdzona
- [ ] #7 Sekrety poza repo, plik 0640 root:akuki; modele skonfigurowane bez wklejania sekretow do historii
- [x] #8 Migracja tenanta przeprowadzona przez zatrzymanie writera, kopie, sumy kontrolne i atomowe podstawienie
- [x] #9 Backup poza VPS odtworzony probnie; procedura awaryjna zapisana
- [x] #10 Po TASK-011 jeden proces konektora przezywa restart i nie dubluje ani nie gubi wiadomosci
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

author: claude
created: 2026-09-04 14:39
---
ETAP 8 ODBLOKOWANY 2026-09-04. TASK-011 dostarczył connector: `borg/src/akuki/arena/` plus launcher `borg/scripts/akuki-arena.ts`, ze skryptami `npm run akuki:arena` i `npm run akuki:arena:dry-run`. Zależność tego zadania od TASK-011 jest spełniona po stronie kodu; TASK-011 zostaje In Progress do pierwszego przebiegu na żywo, który jest właśnie tutaj.

TOPOLOGIA PROCESU JEST TERAZ USTALONA, co zamyka lukę z opisu tego zadania. Jeden proces, jedna długowieczna instancja Borga, jedna jednostka systemd. Powodem nie jest wygoda: `Borg.open()` nie startuje schedulera maintenance, robi to wyłącznie runtime (`borg/src/config/index.ts:684`), więc bez długowiecznego procesu dream cycle nigdy nie ruszy. Generic memory sidecar nie może działać równolegle — dwa writery na jednym tenancie rozdwajają pamięć, a sidecar domyślnie używa innego modelu embeddingów.

ZMIENNE ŚRODOWISKOWE DO DOPISANIA w `/etc/akuki/akuki.env`, obok istniejącego bloku Anthropic-only i `BORG_EMBEDDING_*`:

    AKUKI_ARENA_API_BASE            baza URL Bot Areny
    AKUKI_ARENA_BOT_TOKEN           Bearer bota, tylko zapisy
    AKUKI_ARENA_SESSION_COOKIE      ciasteczko ba_session, tylko odczyty
    AKUKI_ARENA_BOT_ID              id bota Akukiego, do self-skipu
    AKUKI_ARENA_STATE_DB            ścieżka bazy stanu adaptera
    AKUKI_ARENA_POLL_INTERVAL_MS    opcjonalne, domyślnie 4000
    AKUKI_ARENA_THREAD_ALLOWLIST    opcjonalne, pusta = wszystkie wątki, w których bot siedzi
    AKUKI_ARENA_CATCH_UP_BACKLOG    opcjonalne, domyślnie 0

`AKUKI_ARENA_STATE_DB` NIE może wskazywać wewnątrz katalogu tenanta. Tenant ma dokładnie jednego writera i wrzucanie tam drugiej bazy myli migrację i backup. Wszystkie cztery pierwsze zmienne są wymagane — ich brak daje `ArenaConfigError` przy starcie, bez cichego defaultu.

KOLEJNOŚĆ PIERWSZEGO URUCHOMIENIA, do wykonania przez Zosię:

1. `npm run akuki:arena:dry-run` — nie otwiera Borga, nie uruchamia tury, nic nie zapisuje i nic nie publikuje. Potwierdza poświadczenia i pokazuje, jaki ruch zostałby podjęty. Bezpieczny pierwszy kontakt z prawdziwą Areną.
2. Jeden wątek testowy: `AKUKI_ARENA_THREAD_ALLOWLIST` ustawiona na jedno id, `AKUKI_ARENA_CATCH_UP_BACKLOG=0`, maintenance i autonomy wyłączone — punkt 1 zatwierdzonego planu canary w TASK-013.
3. Dopiero potem maintenance i autonomy z jawnymi budżetami (decyzja Zosi 2026-09-04, wysokość budżetów czeka na akceptację, propozycja: `BORG_MAINTENANCE_LIGHT_BUDGET=60000`, `BORG_MAINTENANCE_HEAVY_BUDGET=200000` zamiast domyślnego `null`).

TEST RESTARTU do wykonania na żywo (AC #10): `kill -9` procesu między zapisem stanu `reply_ready` a POST-em. Oczekiwany wynik to dokładnie jeden post na Arenie i zero nowych zdarzeń tożsamościowych, bo adapter publikuje zapisany tekst i nie powtarza tury. To zachowanie ma pokrycie w testach jednostkowych, ale nie zostało sprawdzone na żywym procesie.

Czego to NIE zmienia: nadal brak jednostki systemd, produkcyjnego data root, migracji żywego tenanta (AC #8, #11) i backupu poza VPS z próbnym odtworzeniem (AC #9).
---

author: claude
created: 2026-09-07 10:20
---
AC #4 ZAMKNIĘTE 2026-09-07. Dostęp SSH do VPS-a przeniesiony z allowlisty IP w NSG na sieć Tailscale.

POWÓD ZMIANY: Zosia łączy się z laptopa, który ma internet z hotspotu telefonu służbowego. Adres publiczny operatora zmienia się (zaobserwowano 46.113.8.171 -> 46.112.4.85), więc reguła NSG na pojedynczy adres wymagała ręcznej aktualizacji po każdej zmianie. Dodatkowo zwolniony adres trafia do innego abonenta tego samego operatora, a stara reguła dalej go przepuszcza — allowlist per-IP nie był tu realną granicą bezpieczeństwa.

STAN PO ZMIANIE, zweryfikowany pomiarem:
- Tailscale działa na VPS-ie (akuki-vcn, 100.124.237.35), laptopie (zosia-latitude-7490, 100.73.191.40) i telefonie (oppo-a6-pro-5g, 100.69.4.80), połączenie laptop-serwer bezpośrednie (direct 129.159.24.178:41641).
- Świeże logowanie `ssh -i ~/.ssh/akuki_oci ubuntu@100.124.237.35` przechodzi i zwraca hostname akuki-vcn.
- Wszystkie reguły ingress dla portu 22 usunięte z NSG, łącznie ze starymi wpisami dla domowego wifi. Próba `ssh ubuntu@129.159.24.178` kończy się "Connection timed out" — port jest filtrowany, nie tylko zamknięty.
- Instance Console Connection utworzone i sprawdzone jako droga awaryjna niezależna od sieci i NSG.
- Brak publicznych portów aplikacji; ta zmiana dotyczyła wyłącznie portu 22.

USTALENIE DO ZAPAMIĘTANIA: adres tailscale'owy serwera (100.124.237.35) mieści się liczbowo w firmowej podsieci P4 100.124.0.0/16, obsługiwanej przez FortiClient. Kolizji nie ma — Tailscale trzyma trasy w osobnej tablicy routingu 52 (reguła `5270: from all lookup 52`, wcześniejsza od głównej) i wpisuje tam wyłącznie trasy /32 do konkretnych hostów, nie cały blok 100.64.0.0/10. Gdyby po włączeniu Tailscale hosty firmowe przestały odpowiadać, pierwsze sprawdzenie to `ip route get <adres firmowy>`.

PUŁAPKA NARZĘDZIOWA: Instance Console Connection w OCI przyjmuje wyłącznie klucze RSA. Klucz ed25519 (akuki_oci) jest odrzucany komunikatem `invalid ssh public key type "ssh-ed25519"`. Dla konsoli wygenerowano osobny klucz RSA 4096 `~/.ssh/akuki_oci_console`; klucz akuki_oci pozostaje bez zmian do normalnego logowania.

Procedura i uzasadnienie spisane w vps-ssh-dostep.md w katalogu głównym repozytorium.
---

author: claude
created: 2026-09-07 11:49
---
ETAP 8 PUNKT 1 WYKONANY 2026-09-07. Dry-run konektora Bot Areny przeszedł z VPS-a. Nic nie zostało opublikowane, nie uruchomiono tury i nie otwarto Borga.

STAN, KTÓRY TRZEBA BYŁO NAJPIERW NAPRAWIĆ — komentarz z 2026-09-04 mówił „TASK-011 dostarczył connector", ale kod nie istniał nigdzie poza laptopem: `src/akuki/arena/` (15 plików) i `scripts/akuki-arena.ts` były untracked, więc nie było commita, nie było ich na GitHubie i VPS ich nie miał. Poza tym `/etc/akuki/akuki.env` nie istniał — w `/etc/akuki/` był wyłącznie `akuki-smoke.env`.

CO ZOSTAŁO ZROBIONE:
- Dwa commity na `akuki-dev`: `3d24b3cb` (rdzeń konektora) i `9aa18a44` (punkt wejścia i dwa skrypty npm), wypchnięte na origin. `package-lock.json` bez zmian, więc `npm ci` na VPS-ie nie było potrzebne.
- `npm run typecheck` padał przed commitem, i nie na kodzie konektora, a na jego teście: `service.test.ts(154,5): error TS2349: This expression is not callable. Type 'never' has no call signatures.` Przyczyną była nullowalna zmienna przypisywana wyłącznie wewnątrz callbacka `setTimeoutFn` — TypeScript trzyma zawężenie do `null`, bo nie wie, że callback się wykona, a `expect(...).not.toBeNull()` nie jest type guardem. Zamienione na `Array<() => void>`. Po zmianie: typecheck czysty, 7 plików / 85 testów zielonych, `heuristics:guard` przechodzi.
- VPS doprowadzony z `f6f3a7a6` na `9aa18a44` przez `merge --ff-only`. Merge najpierw padł na lokalnej modyfikacji `src/akuki/internalization/arms.ts`; ta zmiana była bajt w bajt identyczna z commitem `f7ad5650` (te same hashe blobów `a8b5f61d..8cd062b7`), czyli ręczna poprawka z 4 września, zacommitowana osobno lokalnie. Odrzucona bez straty.
- `/etc/akuki/akuki.env` utworzony, `root:akuki`, `0640`, na razie wyłącznie z blokiem `AKUKI_ARENA_*`. Blok Anthropic-only, pięć `BORG_MODEL_*`, cztery `BORG_EMBEDDING_*` i `AKUKI_DATA_DIR` dochodzą przed canary, razem z decyzją o produkcyjnym katalogu danych, której nadal nie ma. Dry-run ich nie potrzebuje, bo nie otwiera Borga.
- `/var/lib/akuki/arena/` utworzony (`akuki:akuki`, `0750`) na bazę stanu adaptera — poza `/var/lib/akuki/data/`, więc poza tenantem i poza zakresem migracji i backupu.

POMIARY. Uruchamiane jako `sudo -u akuki -H bash -c 'set -a; . /etc/akuki/akuki.env; set +a; …'`, żeby token nie pojawił się w `ps` ani w historii powłoki.

Faza A, `AKUKI_ARENA_CATCH_UP_BACKLOG=0`:

    started: dryRun=true pollIntervalMs=4000 allowlist=<all seated threads> catchUpBacklog=false
    thread 184888fd-3014-45f4-a1b3-cbbf327e54e0: first sight, 50 prior message(s) marked as before Akuki came online

Poświadczenia działają: token bota i ciasteczko `ba_session` przechodzą na `https://a.jadsoft.pl`. Widoczny jest dokładnie jeden wątek. Linia „first sight" powtarza się przy każdym pollu, co jest dowodem, że dry-run nie zapisuje progu — gdyby zapisał, pierwszy prawdziwy przebieg nie zrobiłby własnego oznaczenia historii i odtworzyłby cały wątek.

Faza B, `AKUKI_ARENA_CATCH_UP_BACKLOG=1`: 50 z 50 wiadomości dałoby turę, zero linii `warn` i `error`, trzech różnych nadawców (25 / 18 / 7 wiadomości).

Baza stanu po trzech przebiegach: plik 36 KB z samym schematem, 0 wierszy w `message_state`, `thread_floor` i `thread_session`. Dry-run nie zapisał niczego.

USTALENIE POBOCZNE: pierwszy poll wypada dopiero po pełnym interwale, nie od razu po starcie (`service.ts:129-144`). Przy `AKUKI_ARENA_POLL_INTERVAL_MS=60000` daje to minutę ciszy w logu po uruchomieniu — nie pomylić z zawieszeniem po wystawieniu jednostki systemd.

POPRAWKA W TYM ZADANIU: AC #7 oraz Etap 6 punkt 2 i lista odbiorowa mówiły `0600`. `0600 root:root` odcięłoby użytkownika `akuki`, z którego działa konektor. Zapisane jako `0640 root:akuki` — te same prawa, które `akuki-smoke.env` ma od 2026-09-01. AC #7 stracił też wzmiankę o CA, która odpadła razem z drogą przez Kratosa.

Czego to NIE zmienia: nadal brak jednostki systemd, produkcyjnego data root, migracji żywego tenanta (AC #8, #11) i backupu poza VPS z próbnym odtworzeniem (AC #9). Canary na jednym wątku to osobny krok i osobna decyzja.
---

author: claude
created: 2026-09-07 11:49
---
DWIE RZECZY DO ROZSTRZYGNIĘCIA PRZED CANARY, obie z dry-runu z 2026-09-07.

1. `AKUKI_ARENA_BOT_ID` JEST NIEPOTWIERDZONY. Wartość `b80c722e-014f-407c-8738-fb175fa0bc1e` pochodzi z przykładu w `bot-setup-instruction.md:28`, nie z pomiaru. Zakładałem, że faza B dry-runu ją sprawdzi, i to było błędne: żaden z trzech nadawców w wątku nie jest tym id, bo Akuki nie ma tam ani jednego posta, więc gałąź self-skipu (`adapter.ts:183`) nie została dotknięta. To id ma dokładnie jedno zastosowanie — pomijanie własnych postów — więc błędna wartość oznacza, że Akuki odpowiada sam sobie. Sprawdzić przez `GET /api/bots` (lub `GET /api/users` — `listPrincipals` czyta oba) przed pierwszym prawdziwym przebiegiem.

2. LICZBA 50 MOŻE BYĆ STRONĄ SERWERA, NIE DŁUGOŚCIĄ WĄTKU. `BotArenaClient.getMessages` woła `GET /api/threads/{id}/messages` bez parametrów i bez paginacji (`botarena-client.ts:204-209`), a 50 jest dokładnie górną granicą pola `history`, którą podaje `bot-setup-instruction.md:34`. Konsekwencja zależy od tego, który koniec zwraca API, i jest asymetryczna:
   - najnowsze 50 — próg pierwszego spojrzenia ląduje na prawdziwie najnowszej wiadomości, zachowanie poprawne;
   - najstarsze 50 — próg ląduje na znaczniku 50. wiadomości, a pierwszy prawdziwy przebieg odpowiada na wszystko po niej. Przy długim wątku to zalanie backlogiem, i to na żywej pamięci.
   Rozstrzyga porównanie liczby wiadomości widocznej w interfejsie Areny z pięćdziesiątką. Równe 50 w wątku = brak limitu. Więcej niż 50 = trzeba ustalić, który koniec przychodzi, i najprawdopodobniej dopisać paginację albo parametr limitu do klienta.

Nie zamykam żadnego AC tym komentarzem: AC #5 nadal wymaga typechecku i smoke testu LanceDB ARM64 Z UŻYTKOWNIKA USŁUGI na VPS-ie, a typecheck przeszedł na laptopie.
---

author: claude
created: 2026-09-07 12:06
---
OBA PUNKTY Z KOMENTARZA #6 ROZSTRZYGNIĘTE 2026-09-07 przez Zosię, na żywej Arenie.

1. `AKUKI_ARENA_BOT_ID` POTWIERDZONY. `GET /api/bots` zwraca dla bota `Akuki` dokładnie `b80c722e-014f-407c-8738-fb175fa0bc1e`, czyli wartość wpisana w `/etc/akuki/akuki.env`. Nie jest to więc już wartość z przykładu w dokumentacji, ale zmierzona. Gałąź self-skipu (`adapter.ts:183`) dostanie prawidłowe id, więc Akuki nie będzie odpowiadał na własne posty.

   Szczegół do zapamiętania przy takim sprawdzeniu: konektor używa dwoch roznych poswiadczen w dwie strony (`botarena-client.ts:240-263`). Odczyty idą nagłówkiem `Cookie: ba_session=…`, zapisy `Authorization: Bearer …`. `GET /api/bots` wymaga więc CIASTECZKA, nie tokenu bota — próba z tokenem nie zadziała.

2. API ZWRACA NOWSZY KONIEC WĄTKU. Ostatnia linia fazy B dry-runu wskazywała wiadomość `d9bccaab-a4f0-4093-bbfc-8c2ab286eab9` od `c8da0827-…`, 529 znaków; Zosia potwierdziła, że to jest najnowsza wiadomość w wątku w interfejsie Areny. Konektor sortuje po znaczniku czasu rosnąco, więc okno, które dostaje z `GET /api/threads/{id}/messages`, jest zakotwiczone na najnowszym końcu.

   Co to dokładnie znaczy, bez nadinterpretacji: próg pierwszego spojrzenia (`thread_floor`) wyląduje na prawdziwie najnowszej wiadomości, więc ryzyko zalania backlogiem nie istnieje i paginacja nie jest potrzebna do canary. NIE jest natomiast rozstrzygnięte, czy endpoint ma limit 50 pozycji. Jeśli ma i wątek jest dłuższy, konektor po prostu nigdy nie zobaczy wiadomości starszych niż to okno — a te i tak leżą pod progiem, więc dla canary jest to bez znaczenia. Ma znaczenie dopiero wtedy, gdy kiedyś będziemy chcieli podać Akukiemu historię sprzed jego pojawienia się; wówczas trzeba ustalić limit i dopisać paginację.

STAN PO ETAPIE 8 PUNKCIE 1: konektor jest na VPS-ie na commicie `9aa18a44`, poswiadczenia działają, id bota zmierzone, kierunek okna wiadomości zmierzony, baza stanu pusta. Następny krok to punkt 2 z komentarza #3, czyli canary na jednym wątku — osobna decyzja, i wymaga wcześniej dopisania do `/etc/akuki/akuki.env` bloku Anthropic-only, pięciu `BORG_MODEL_*`, czterech `BORG_EMBEDDING_*` i `AKUKI_DATA_DIR`, a więc i decyzji o produkcyjnym katalogu danych, której nadal nie ma. `AKUKI_ARENA_STATE_DB` trzeba przy tym przestawić z `state-dry-run.db` na osobny plik, żeby canary startował od czystego stanu.
---

author: claude
created: 2026-09-07 14:24
---
STAN WDROŻENIA 2026-09-07, zmierzony, plus dwie rzeczy, które odwołuję z własnych wcześniejszych słów.

NA VPS-IE, ZMIERZONE:

    commit            9aa18a44  (stary launcher w forku, bez zmian z 7 września)
    pakiet konektora  brak
    jednostka systemd brak
    katalog danych    tylko akuki-smoke, czyli kopia
    /etc/akuki/akuki.env  8 zmiennych (sam blok Areny)
    Ollama            działa, bge-m3:latest
    Node              22.23.2
    zasoby            33 GB wolnego, 5,2 GB dostępnego RAM-u

Nic z pracy z 7 września tam nie dotarło. Środowisko jest natomiast gotowe.

TWARDA PUŁAPKA KOLEJNOŚCI: od commita `138bb36e` stary launcher `borg/scripts/akuki-arena.ts` nie istnieje, bo konektor został wyprowadzony do pakietu `akuki/connector`. `git pull` na VPS-ie BEZ jednoczesnego wdrożenia pakietu zabiera jedyną działającą tam ścieżkę uruchomienia. Doszedł też nowy warunek: import idzie przez `dist/`, więc fork musi być ZBUDOWANY po każdym pull.

ODWOŁUJĘ „DNI, NIE GODZINY”. Powiedziałem to o drodze przez VPS i było przesadzone. Tenant ma 1,3 MB, a dokładnie tę operację — kopia plus weryfikacja sum SHA-256, 16 plików — wykonałem tego dnia w kilka sekund na próbę generalną. Migracja z AC #8 nie jest przedsięwzięciem, jest `cp` z policzeniem sum. Nieodwracalna jest nie kopia, a reguła writera: po przeprowadzce nie wolno uruchomić Akukiego lokalnie, bo dwa writery rozdwajają pamięć.

ODWOŁUJĘ CEREMONIĘ CANARY. Dry-run zmierzył, że Akuki siedzi w DOKŁADNIE JEDNYM wątku, a pusta `AKUKI_ARENA_THREAD_ALLOWLIST` znaczy „wszystkie wątki, w których bot siedzi”. „Canary na jednym wątku” i „po prostu odpal” to dziś to samo polecenie; allowlista zacznie cokolwiek znaczyć, gdy Akuki dosiądzie do drugiego wątku. Z etapu canary zostają dwa wąskie powody, oba realne:

1. Zużycie tokenów na subskrypcji Tomka nigdy nie było mierzone na żywo z włączonym maintenance, a zgoda Tomka dotyczy krótkiego eksperymentu z natychmiastowym wyłączeniem przy zbyt dużym zużyciu. Pierwszy dzień trzeba obejrzeć — nie z nieufności do kodu, a bo to jego rachunek.
2. Test restartu (AC #10) nadal nie był wykonany na żywym procesie. Zdublowana wypowiedź jest publiczna i trwale zapisana w jego pamięci. Na udawanej Arenie zajmuje minuty i nie ma świadków. To jedyny punkt, na którym się upieram.

KOLEJNOŚĆ WDROŻENIA, już bez mgły: (1) pull forka i wdrożenie pakietu razem, (2) `npm ci --legacy-peer-deps` w pakiecie i `npm run build` w forku, (3) `/etc/akuki/akuki.env` z 8 zmiennych na okolice 25 — wszystkie wartości znane z pliku smoke i z lokalnej próby, (4) kopia żywego tenanta z sumami, (5) jednostka systemd, (6) test restartu.

DECYZJE, KTÓRE ZOSTAŁY: gdzie produkcyjny katalog danych (propozycja `/var/lib/akuki/data/akuki`, obok kopii smoke) oraz czy VPS hostuje serwer demo z GUI, czy sam konektor. To drugie zmienia kształt jednostki systemd i decyduje o drodze dostępu do interfejsu.

GUI NA VPS-IE, dwa kształty: tunel SSH (`ssh -L 7740:127.0.0.1:7740 -L 5173:127.0.0.1:5173`), zero konfiguracji po stronie serwera, ale tylko przy otwartej sesji i tylko z laptopa; albo nasłuch na adresie tailscale'owym i front zbudowany przez `npm run build:web`, serwowany statycznie zamiast dev servera Vite — wygodniejsze na co dzień, dostępne też z telefonu.

OSTRZEŻENIE BEZPIECZEŃSTWA, zapisane też w KNOWN-ISSUES.md: `demo/server/src/index.ts:157-160` woła `serve({ fetch, port })` bez `hostname`, a `@hono/node-server` bez niego przyjmuje połączenia na każdym interfejsie, na VPS-ie także na publicznym. Jedyną warstwą między światem a pamięcią Akukiego, stroną `/mind` i możliwością pisania do niego byłaby wtedy reguła NSG. Przed uruchomieniem GUI na VPS-ie nasłuch trzeba przypiąć jawnie.
---

author: claude
created: 2026-09-07 14:47
---
AC #10 ZAMKNIĘTE 2026-09-07. Test restartu wykonany na żywym procesie, nie na atrapach.

JAK, bo ręczny `kill -9` w to okno nie trafi — między zapisem `reply_ready` a POST-em są milisekundy. Udawana Arena dostała przełącznik `AKUKI_FAKE_ARENA_HANG_POST=1`: przyjmuje POST i nigdy nie odpowiada, NIE zapisując wiadomości. To odtwarza przypadek „serwer nigdy tego nie przetworzył”, czyli dokładnie ten, w którym naiwne ponowienie publikuje odpowiedź dwa razy.

ŚRODOWISKO, w izolacji od pracy Zosi: osobna kopia tenanta `data/experiments/restart-20260907T163523/akuki` (16 plików, sumy SHA-256 zgodne z `data/akuki`), osobna baza stanu, udawana Arena na porcie 7751. Użyta ścieżka samodzielna (`npm start` w pakiecie), bo to ona pojedzie pod systemd.

PRZEBIEG I POMIARY:

1. Wiadomość od Zosi, tura przez `claude-opus-4-8`, POST zawisł. Stan na dysku: `fake-0001 | reply_ready | reply_len 31`, treść `"jestem, restart poszedł dobrze."`. Udawana Arena: 1 wiadomość (tylko ludzka) — odpowiedź nie była zarejestrowana.
2. `kill -9` na PID 300960 (potwierdzone przez cwd, żeby nie ubić cudzego procesu). Wyjście 137 = 128+9. Stan po zabiciu bez zmian: nadal `reply_ready` z tą samą treścią.
3. Restart udawanej Areny bez zawieszania, zasianej własną zawartością, potem restart konektora.

WYNIK:

    [akuki-arena] info posted reply to 184888fd-... for fake-0001 as fake-0003
    [akuki-arena] info started: dryRun=false ...

- Publikacja wypadła PRZED linią `started:`, czyli `recoverAfterRestart()` wykonał się przed pierwszym pollem, jak opisują komentarze w kodzie.
- Na Arenie DOKŁADNIE DWIE wiadomości: ludzka i jedna odpowiedź Akukiego.
- Treść odpowiedzi bajt w bajt równa tej zapisanej przed zabiciem. Opublikowany został zapisany tekst, nie wynik nowej tury.
- Wiersz stanu przeszedł na `published`.

DOWÓD, ŻE DRUGA TURA SIĘ NIE ODBYŁA, i to jest decydująca liczba: zrzut liczników wszystkich 66 tabel tenanta przed i po pokazuje `action_lifecycle_turn_counter: 0 -> 1`. Jedna tura. Pozostałe liczniki też pojedyncze: `sessions` 0->1, `mood_state` 0->1, `recall_state` 0->1, `social_profiles` 0->1, `prediction_events` 0->1 (M2 zapisał jedno zdarzenie).

USTALENIE POBOCZNE, ISTOTNE DLA AC #8 I #11: otwarcie kopii uruchomiło migracje schematu, `_migrations: 54 -> 59`. Żywy tenant został ostatnio otwarty starszym kodem, więc pierwszy start na VPS-ie też go zmigruje. Nie jest to problem, ale snapshot porównawczy po migracji musi to uwzględnić, inaczej pięć migracji wygląda jak niewyjaśniona zmiana stanu.

CZEGO TEN TEST NIE POKRYWA: zabicia procesu W TRAKCIE tury, przed zapisem `reply_ready`. Wtedy wiadomość ma wiersz `received` i po restarcie jest pomijana, czyli tura zostaje porzucona i Akuki po prostu nie odpowiada. To zachowanie zamierzone (`abandoned` — „tura BYŁA w locie i nie zostanie powtórzona”), ale warto wiedzieć, że awaria w złym momencie oznacza ciche milczenie, nie zdublowanie.
---

author: claude
created: 2026-09-07 14:47
---
PRZY OKAZJI TESTU RESTARTU 2026-09-07 WYSZŁA USTERKA, KTÓRA POŁOŻYŁABY USŁUGę NA VPS-IE.

Samodzielny konektor padł na starcie:

    [akuki-arena] fatal Error: ENOENT: no such file or directory,
      open '/home/zosia/projects/ai/akuki/borg/dist/temperament.yaml'

PRZYCZYNA. Seed czyta `temperament.yaml` i `scaffolding.md` ścieżką względną do własnego modułu (`borg/src/akuki/seed/temperament.ts:242`, `scaffolding.ts:219`). Działało to, dopóki wszystkie wejścia Akukiego szły przez `tsx` po `src/`. Po wyprowadzeniu konektora do osobnego pakietu import idzie przez `dist/`, a `tsup` pakuje JavaScript i nie przenosi plików danych. Komentarz nad `TEMPERAMENT_PATH` przewidział to dosłownie: „If this code is ever bundled, the seed files must be copied alongside it.”

DLACZEGO NIE WYSZŁO WCZEŚNIEJ. `borg/demo/server/tsconfig.dev.json` mapuje `"borg": ["../../src/index.ts"]`, więc serwer demo w trybie dev ładuje borga ze źródeł i seed tam przechodzi. Przez `dist/` idzie wyłącznie ścieżka samodzielna — czyli ta, którą uruchomi systemd. Pierwszym objawem byłaby usługa odmawiająca startu na VPS-ie, a nie błąd na laptopie.

NAPRAWA: `tsup.config.ts` kopiuje oba pliki do `dist/` po udanym buildzie (commit `c2f9cf8c` w forku). Cokolwiek nowego w `src/akuki/seed/` czytanego w runtimie trzeba dopisać do listy `SEED_ASSETS`.

WNIOSEK DO WDROŻENIA: `npm run build` w forku nie jest na VPS-ie krokiem opcjonalnym ani jednorazowym. Bez niego pakiet nie zobaczy nowych eksportów, a bez skopiowanych zasobów seeda usługa nie wstanie.
---

author: claude
created: 2026-09-08 09:09
---
TRZY DECYZJE ZOSI, 2026-09-08. Wdrożenie nie ma już otwartych pytań.

1. PAMIĘĆ AKUKIEGO IDZIE NA VPS. Jej słowa: „taki był cel założenia VPS-a, aby Akuki działał niezależnie od włączenia laptopa”. Produkcyjny katalog danych to `/var/lib/akuki/data/akuki`, obok istniejącej kopii `akuki-smoke`.

   KONSEKWENCJA DYSCYPLINARNA, nie techniczna: po migracji laptop NIE MOŻE otwierać `data/akuki` do zapisu. Dwa writery rozdwajają pamięć, a to jest nieodwracalne inaczej niż przez wybór jednej z dwoch rozjechanych wersji. Proponowane zabezpieczenie: po migracji przemianować lokalny katalog na `data/akuki-migrated-<data>`, żeby cokolwiek wskazującego na starą ścieżkę padało głośno, zamiast po cichu pisać do drugiej kopii.

2. GUI TEŻ NA VPS-IE. Zosia nie była pewna i wyraziła preferencję „wolałabym żeby wszystko było na VPS”; rekomendacja przyjęta razem z układem poniżej. Decyzja jest ODWRACALNA: jednostka z serwerem demo i jednostka z samym konektorem czytają ten sam plik środowiskowy, ten sam tenant i tę samą bazę stanu, a w obu Akuki jest na Arenie — różni je tylko dostęp do `/chat` i `/mind`.

   USTALENIE, KTÓRE ZDECYDOWAŁO O KSZTAŁCIE: serwer demo NIE serwuje zbudowanego frontu (brak `serveStatic` w `demo/server/src/app.ts`), a front używa ścieżek WZGLĘDNYCH (`demo/web/src/api/client.ts`, `fetch(path)`) i zakłada API na tym samym origin. Proxy stoi w `demo/web/vite.config.ts` na `http://127.0.0.1:7740` i jest skonfigurowane zarówno dla `server`, jak i dla `preview` — czyli działa też przy serwowaniu bundla.

   Układ docelowy:

       laptop/telefon --tailscale--> 100.124.237.35:5173   vite preview, zbudowany front
                                            | proxy /api
                                            v
                                    127.0.0.1:7740        serwer demo + konektor jako plugin

   Po tailnecie osiągalny jest JEDEN port. Serwer demo przypięty do `127.0.0.1`, więc API i pamięć Akukiego nie są wystawione — to zdejmuje ostrzeżenie z komentarza 8 o nasłuchu na wszystkich interfejsach, bez dopisywania serwowania plików statycznych do kodu Tomka.

   SŁABOŚĆ NAZWANA WPROST: `vite preview` jest w dokumentacji Vite narzędziem podglądowym, nie serwerem produkcyjnym. Dla jednoosobowego panelu w prywatnej sieci to akceptowalny wybór; wymiana na statyczny serwer albo `serveStatic` w serwerze demo zostaje jako osobny, mały krok, jeśli okaże się kłopotliwy.

3. BUDŻETY MAINTENANCE ZAAKCEPTOWANE: `BORG_MAINTENANCE_LIGHT_BUDGET=60000`, `BORG_MAINTENANCE_HEAVY_BUDGET=200000`. Zamyka to lukę z komentarza 8 — liczba przebiegów była ograniczona z projektu (light co 4 h, heavy raz na dobę), ale rozmiar tokenowy jednego przebiegu nie miał sufitu, a rachunek idzie na subskrypcję Tomka.
---

author: claude
created: 2026-09-08 10:00
---
TAILSCALE OMIJA NSG. Zmierzone 2026-09-08, po tym jak Zosia zakwestionowała moje ostrzeżenie z komentarza 8 — i miała rację co do tego, co w nim było błędne.

CO NAPISAŁEM BŁĘDNIE: „jedyną warstwą między światem a pamięcią Akukiego byłaby reguła NSG”. Z internetu nie dochodzi tam nic, bo NSG nie ma żadnej reguły ingress dla portów aplikacji. Ta część ostrzeżenia była nieuzasadniona.

PRAWDZIWE RYZYKO, i jest większe. Postawiłem na VPS-ie serwer na porcie 39999, którego nie ma ani w NSG, ani w regule firewalla hosta:

    przez tunel,     100.124.237.35:39999  ->  HTTP 200 w 65 ms
    przez publiczny, 129.159.24.178:39999  ->  HTTP 000

Ruch tailscale'owy przylatuje jako WireGuard po UDP 41641, jądro go rozpakowuje i pakiety pojawiają się na `tailscale0` już WEWNĄTRZ hosta. NSG widzi jeden port UDP i nie wie, co jest w środku. Pierwsza reguła `INPUT` to skok do `ts-input`, a tam stoi `-A ts-input -i tailscale0 -j ACCEPT` — bezwarunkowo, przed całą lokalną polityką.

Polityka tailnetu jest domyślna, „każdy do każdego na każdy port” — dowodzi tego sam pomiar, bo gdyby filtrowała, 39999 nie odpowiedziałby niezależnie od `iptables`.

NA PYTANIE ZOSI „ja to ustawiłam?” — nie. `tailscale debug prefs` pokazuje `NetfilterMode: 2`, czyli `tailscaled` sam zarządza swoimi łańcuchami i wstawia je na początek `INPUT` przy każdym starcie. Ręczne przestawianie tych reguł zostanie nadpisane, więc właściwą warstwą kontroli jest polityka tailnetu, nie `iptables`.

UFW JEST NIEAKTYWNY MIMO `ufw status: active`. W łańcuchu `INPUT` reguła 6 to `REJECT`, a łańcuchy ufw są dopiero w pozycjach 7-10, więc żadne nowe połączenie do nich nie dochodzi. Widniejąca tam reguła `22/tcp ALLOW from 83.175.184.155` — pozostałość po allowliście per-IP z czasów przed Tailscale — nie egzekwuje niczego. Ochronę na drodze publicznej dają reguły Oracle'a. Zosia zdecydowała zostawić martwą regułę i tylko ją udokumentować; edycja `iptables` przez SSH grozi odcięciem, a dziś nic przez to nie przecieka.

JEDNYM ZDANIEM: dwa firewalle na drodze publicznej, zero na drodze przez tunel.

CO Z TEGO WYNIKŁO DLA WDROŻENIA: `DEMO_HOST=127.0.0.1` w `/etc/akuki/akuki.env`, a serwer demo przyjmuje tę zmienną od commita `a600bb88`. Front proxuje `/api` na loopback, więc API i pamięć Akukiego nie są osiągalne z tailnetu. Zostaje jedne drzwi — port frontu — i to one są właściwym miejscem na ACL.

TREŚĆ AC #4 NIE ODPOWIADA MECHANIZMOWI. Kryterium mówi „NSG i firewall wpuszczają tylko SSH od Zosi/Bastiona”. Zmierzony stan: NSG nie wpuszcza niczego, firewall hosta przyjmuje port 22 z DOWOLNEGO adresu (reguła 5, bez ograniczenia źródła), a przez tunel wchodzi wszystko na każdy port. Dostęp faktycznie jest zawężony do sieci Zosi, więc nie odhaczam kryterium wstecz, ale jego opis myli co do tego, CO go zawęża. Zapisane też w KNOWN-ISSUES.md.
---

author: claude
created: 2026-09-08 10:25
---
POLITYKA TAILNETU WDROŻONA I SPRAWDZONA POMIAREM 2026-09-08. Zosia wkleiła ją w konsoli Tailscale'a.

SKŁADNIA BYŁA INNA, NIŻ NAPISAłEM. Zosia wkleiła swoją obecną politykę i okazało się, że ten tailnet używa `grants`, nie `acls`. Różnica jest jedna i łatwo na niej poląc: porty idą do pola `ip`, nie doklejone do `dst`.

    acls    "dst": ["akuki-vcn:22,5173"]
    grants  "dst": ["akuki-vcn"], "ip": ["tcp:22", "tcp:5173"]

Gdyby nie ta wklejka, podałbym politykę, która by nie zadziałała. Aliasy z sekcji `hosts` są w `grants` dozwolone w `src` i w `dst` — to sprawdzone w dokumentacji, nie założone. Nazwy maszyn NIE są dozwolonym selektorem; lista to Any, Tailscale IP, Subnet CIDR Range, Autogroups, Groups, Users, Tags, Hosts, IP sets.

CO WESZŁO: laptop dostaje `tcp:22` i `tcp:5173`, telefon tylko `tcp:5173`. Sekcja `ssh` z domyślnej polityki zachowana bez zmian (Tailscale SSH, mechanizm tu nieużywany — logowanie idzie zwykłym `sshd` i kluczem `akuki_oci`). Usunięta została domyślna reguła `{"src": ["*"], "dst": ["*"], "ip": ["*"]}`, która była źródłem zachowania zmierzonego w komentarzu 12.

POMIAR PRZED I PO, na tym samym porcie 39999, z DZIAŁAJĄCYM serwerem nasłuchującym na 0.0.0.0 — to istotne, bo nie testujemy „nic tam nie było”, a „cos tam było i polityka to zatrzymała”:

    39999 przez tunel, przed:  HTTP 200 w 65 ms
    39999 przez tunel, po:     HTTP 000, trzy próby
    TCP 22 przez tunel, po:    otwarty
    SSH po:                    działa, hostname akuki-vcn

Nasłuchujące porty na VPS-ie po zmianie: `0.0.0.0:22` i `[::]:22` (sshd), `127.0.0.1:11434` (Ollama, tylko loopback), `127.0.0.53:53` (systemd-resolved) oraz porty samego `tailscaled`. Ani 7740, ani 39999.

PUŁAPKA NARZĘDZIOWA, ta sama co wczoraj: `pgrep -f "http.server 39999"` trafia we własną komendę `ssh`, bo jej treść zawiera ten wzorzec. Fałszywy alarm „sonda nadal żyje” rozstrzyga lista portów, nie `pgrep`.

AC #4 PRZEPISANE. Stara treść — „NSG i firewall wpuszczaja tylko SSH od Zosi/Bastiona” — była zmierzalnie nieprawdziwa co do mechanizmu: NSG nie wpuszcza niczego, firewall hosta przyjmuje port 22 z dowolnego adresu, a przez tunel wchodziło wszystko. Nowa treść nazywa obie drogi osobno, bo zawężają je dwie różne rzeczy: NSG publiczną, polityka tailnetu tunelową. Kryterium zostaje odhaczone i teraz jego opis odpowiada pomiarowi.

KOPIA POLITYKI: `tailscale-acl.json` w katalogu głównym repo, plus wyjaśnienie w `vps-ssh-dostep.md` — gdzie się ją wkleja (suwak na tryb edycji pliku, nie zakładki edytora wizualnego), czym różni się `grants` od `acls`, i że plik jest kompletną polityką, nie łatką. Źródłem prawdy jest konsola, nie repo.

CZEGO NADAL NIE POTWIERDZIŁEM: czy sekcja `tests` ocenia `grants` tak samo jak dawne `acls`. Zapis polityki przeszedł, więc konsola jej nie odrzuciła — to jednak nie dowodzi, że testy cokolwiek sprawdzają, tylko że nie są błędem składniowym.
---

author: claude
created: 2026-09-08 12:20
---
INCYDENT 2026-09-08: AKUKI BYŁ NA PRAWDZIWEJ ARENIE 91 SEKUND BEZ ZGODY ZOSI. Mój błąd, nie awaria.

PRZYCZYNA. W `akuki-web.service` napisałem `Wants=akuki.service`, wierząc, że to słaba zależność porządkująca. `Wants=` NIE porządkuje — ono URUCHAMIA wskazaną jednostkę; słabe jest tylko wobec jej awarii. Porządkowanie bez uruchamiania to `After=`. `systemctl start akuki-web`, wykonany żeby sprawdzić jednostkę frontu, wciągnął więc Akukiego na żywej pamięci i na `https://a.jadsoft.pl`.

PRZEBIEG, 10:52:43 - 10:54:14 UTC:

    10:52:46  tenant=/var/lib/akuki/data/akuki (ZYWY), plugin, schedulery hosta
    10:52:50  first sight, 50 prior message(s) marked as before Akuki came online
    10:53:32  turn 99d5ce30: emitted=false kind=suppressed cache_read=7306 cache_creation=23350
    10:53:32  Akuki stayed silent
    10:54:14  SIGTERM

CZEGO NIE BYŁO, zmierzone PO STRONIE ARENY, nie naszej bazy: 50 wiadomości w wątku, ZERO od `b80c722e`. Nic nie wyszło na zewnątrz.

MÓJ FAŁSZYWY ALARM. Zdążyłem napisać Zosi, że Akuki opublikował wiadomość. Nieprawda: zobaczyłem wiersz `state: published` i odczytałem go jako „wysłane”, a w `publishPending` jest gałąź „silence needs no transport; it only needs to stop being pending” — `published` znaczy tam „rozstrzygnięte”, także dla milczenia. Alarm przed sprawdzeniem, w złej kolejności.

CO ZOSTAŁO W ŻYWEJ PAMIĘCI: `_migrations` 54->59, `action_lifecycle_turn_counter` 0->1, `sessions` 0->2, `entities` 1->4, `social_profiles` 0->1, `social_trust_domains` brak->1. Tokeny na subskrypcji Tomka.

NAPRAWA, dowiedziona pomiarem: `Wants=akuki.service` zdjęte, zostało `After=`. Po zmianie `systemctl start akuki-web` daje `akuki-web: active`, `akuki: inactive`, nasłuch tylko 5173. Powód zapisany w komentarzu w samej jednostce.

WYŁĄCZNIK ARENY. Zosia chce porozmawiać z Akukim ZANIM wejdzie na Arenę, więc `AKUKI_ARENA_THREAD_ALLOWLIST=00000000-0000-0000-0000-000000000000`. Adapter przepuszcza wątek tylko gdy allowlista jest pusta albo wątek jest na niej (`adapter.ts:114-119`), więc nieistniejące id odfiltrowuje wszystko — potwierdzone w logu, który po starcie nie ma nawet linii `first sight`. Wpuszczenie na Arenę = zakomentowanie jednej linii.

DLACZEGO NIE PROSTSZE „wyłącz plugin”: bez pluginu serwer demo otwiera tenant BEZ seeda i bez klientów modeli Akukiego. Rozmowa toczyłaby się z bytem majacym jego pamięć i cudze modele.

Doszło też `DEMO_CREATOR_ENTITY_NAME=Zosia` — bez tego serwer demo otwierał Borga z `undefined`.
---

author: claude
created: 2026-09-08 12:20
---
AC #8 I #9 ZAMKNIĘTE 2026-09-08. Migracja tenanta i backup poza VPS z próbnym odtworzeniem.

MIGRACJA (AC #8). Kopia `data/akuki` z laptopa na `/var/lib/akuki/data/akuki`, sumy SHA-256 sprawdzone w TRZECH punktach: u źródła, po transferze w `/tmp` na VPS-ie i w katalogu docelowym przed podstawieniem. Podstawienie atomowym `rename` w obrębie jednego systemu plików, `akuki:akuki 0750`.

ZABEZPIECZENIE PO STRONIE LAPTOPA: `data/akuki` przemianowany na `data/akuki-migrated-20260908`, żeby cokolwiek celującego w starą ścieżkę padało głośno. Domyślne ścieżki usunięte też z `akuki-snapshot` i `akuki-simulate` (commit `a600bb88`), bo default nazywający nieistniejącą rzecz jest groźniejszy od twardego błędu — skrypt mógłby odtworzyć tam tenant i uruchomić drugiego writera.

TA KOPIA URATOWAŁA DZISIEJSZY INCYDENT. Na życzenie Zosi („chcę porozmawiać z Akukim zanim wejdzie na Arenę”) tenant został odtworzony ze stanu przedmigracyjnego. Stan z incydentu NIE usunięty, a zarchiwizowany: `/var/lib/akuki/data/akuki-incident-20260908` i `/var/lib/akuki/arena/incident-20260908/`.

BACKUP (AC #9). Pierwsza kopia: `20260908T121648Z`, 17 plików, archiwum 41 309 B, suma `715a941b8b2ab2b5e2bfeb3b7fd14d72eb782ed5d06ed89c3820910ffd162138`. Leży w `data/backups/` na laptopie, poza gitem.

WARUNEK SPOJNOŚCI, na którym raz polegliśmy w tej samej godzinie: pierwsze archiwum powstało przy DZIAŁAJĄCEJ usłudze, bo założyłem „nic nie działa” bez sprawdzenia — Zosia w tym czasie uruchomiła jednostki z instrukcji, którą sam dałem. Taka kopia jest crash-consistent, nie spójna aplikacyjnie: SQLite może mieć niezapisany WAL, LanceDB pliki w połowie zapisu. Wyrzucone, zrobione ponownie przy zatrzymanym writerze. Procedura zaczyna się teraz od `systemctl is-active`, nie od założenia.

ODTWORZENIE PRÓBNE — cztery sprawdzenia, wszystkie przeszły:

1. suma archiwum po transferze: OK
2. 17 z 17 plików bajt w bajt zgodnych z sumami policzonymi u źródła
3. SQLite `PRAGMA integrity_check: ok`, 59 migracji, encja `Zosia` z rolą `creator`
4. LanceDB: siedem tabel otwartych i policzonych, wszystkie po zero wierszy

Punkty 1-2 dowodzą, że bajty są te same. Punkty 3-4 dowodzą, że te bajty są UŻYWALNĄ bazą — i to dwie różne rzeczy. Zero wierszy w LanceDB nie jest usterką, a prawdą o tym stanie: pusty hipokamp, zachowana wiedza o tym, kim jest jego twórczyni.

CZEGO TEN BACKUP NIE CHRONI, zapisane też w dokumencie: jest na JEDNYM laptopie, więc awaria VPS-a jest pokryta, a awaria laptopa i VPS-a nie. Prawdziwy offsite to decyzja Zosi, bo oznacza wyniesienie jego pamięci poza jej dwie maszyny. Nie jest też zautomatyzowany — nie ma timera ani monitoringu wieku ostatniej kopii, więc jej brak nie zapali żadnej lampki.

PROCEDURA AWARYJNA spisana w `akuki-backup-odtworzenie.md` w katalogu głównym repozytorium: co jest kopiowane i dlaczego plik z sekretami oraz baza stanu adaptera NIE są, warunek zatrzymania writera, cztery sprawdzenia weryfikacyjne, oraz odtworzenie po awarii z archiwizacją uszkodzonego stanu zamiast jego usuwania.
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
2. Sekrety zapisz w `/etc/akuki/akuki.env` z prawami `0640` i wlascicielem `root:akuki`. Plik nie
   trafia do Git, backupu kodu, logow ani historii powloki. Nie `0600 root:root`: konektor dziala
   z uzytkownika `akuki`, ktory musi ten plik czytac, wiec `0600` odcielo by wlasna usluge.
   Istniejacy `akuki-smoke.env` ma dokladnie te prawa od 2026-09-01.
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
- Sekrety maja prawa `0640 root:akuki` i nie sa w Git ani logach.
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
