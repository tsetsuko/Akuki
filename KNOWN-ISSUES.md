# Znane wady i blokery

Stan na 2026-09-04 (aktualizacja po dostarczeniu connectora). Ten dokument opisuje potwierdzone problemy obecnego wdrożenia; nie jest zgodą
na wdrażanie obejść. Problemy rozwiązane albo unieważnione decyzją są przeniesione na koniec, do
sekcji historycznej — nie kasujemy ich, bo powód zamknięcia jest sam w sobie informacją.

## Blokery produkcyjne

### Connector Bot Areny nie opublikował jeszcze ani jednej wiadomości na prawdziwej Arenie

Stan na 2026-09-07. Connector mieszka w pakiecie `connector/` obok forka, nie w forku — do
2026-09-07 był w `borg/src/akuki/arena/` z launcherem `borg/scripts/akuki-arena.ts` i skryptami
`npm run akuki:arena*`; te ścieżki i skrypty **już nie istnieją**. Uruchamia się go przez
`npm start` albo `npm run dry-run` w pakiecie, albo jako plugin w serwerze demo borga. Kryteria
odbiorcze TASK-011 są spełnione po stronie kodu: 107 testów w pakiecie, typecheck zero błędów
w pakiecie i w forku, `npm run heuristics:guard` zielony.

CO ZOSTAŁO SPRAWDZONE NA ŻYWO 2026-09-07:

- Dry-run z VPS-a przeciw prawdziwej Bot Arenie przeszedł. Poświadczenia działają, id bota
  potwierdzone przez `GET /api/bots`, okno wiadomości zakotwiczone na najnowszym końcu. Baza stanu
  po trzech przebiegach: zero wierszy.
- Akuki wykonywał prawdziwe tury lokalnie, na kopii tenanta, przeciw udawanej Arenie
  (`connector/src/fake-arena/`) hostowany w serwerze demo borga.

CO NADAL NIESPRAWDZONE:

- **Publikacja na prawdziwą Arenę.** Dry-run niczego nie wysyła, a wszystkie tury poszły na
  udawaną Arenę. Ani jedna wiadomość Akukiego nie trafiła na `a.jadsoft.pl`.
- **Zachowanie po `kill -9`** między zapisem odpowiedzi a jej publikacją (AC #10 w TASK-024). Ma
  pokrycie w testach jednostkowych, nigdy nie wykonane na żywym procesie. To jedyna awaria z tej
  listy, która jest publiczna: zdublowana wypowiedź zostaje w wątku i podwójnie w jego pamięci.
- **Cache cross-turn na tej ścieżce** i zużycie tokenów z włączonym maintenance.

Kolejność wdrożenia jest zapisana w TASK-024, komentarz 8.

Śledzenie: TASK-011 (kod, zostaje In Progress do pierwszej publikacji na żywo), TASK-024
(wdrożenie), TASK-033 (wzmianki, reply-to i rodzaj autora nie docierają do tury), TASK-034
(panel M2/M3/M4).

### VPS nie jest jeszcze gotową usługą

Na VPS-ie istnieją repozytoria i użytkownik `akuki`; `npm ci` oraz `npm run build` zakończyły się
poprawnie. Smoke test przeszedł tam 2026-09-01: dwie tury z `/opt/akuki/app` jako użytkownik
`akuki`, wszystkie wywołania `claude-opus-4-8` przez aiproxy, embeddingi Ollama `bge-m3`/1024 na
localhoście, cache czytany między turami (`cache_read_input_tokens` 16578 → 23645). Dodatkowo
odczyt t0 testu internalizacji, 28 tur, w `/var/lib/akuki/internalization-t0-live`.

Nadal nie ma usługi systemd, produkcyjnego data root ani stale działającego procesu. Connector już
jest (patrz wyżej), więc Etap 8 w TASK-024 nie jest już zablokowany. Udany smoke test na katalogu
`akuki-smoke` nie jest usługą i nie migruje żywego tenanta.

Śledzenie: TASK-024.

## Wady i ryzyka konfiguracji

### `npm start` uruchamia niewłaściwy proces dla docelowej architektury

`npm start` w Borgu uruchamia generic memory sidecar. Sidecar udostępnia `recall`, `remember` i
`append-turn`, ale nie generuje odpowiedzi. Nie stosuje automatycznie seeda Akukiego, nie używa
Akuki-aware routera modeli i nie komunikuje się z Bot Areną. Nie uruchamiać go jako głównego
runtime'u Akukiego. Właściwym poleceniem jest `npm start` w pakiecie `connector/`, albo
uruchomienie konektora jako pluginu w serwerze demo (`EXTRA_CONNECTOR_MODULE`).

Sidecar i właściwy Akuki-aware runtime nie mogą równocześnie pisać do tego samego katalogu tenanta.

### Serwer demo nadawał rozmówcy imię fikstury demonstracyjnej — naprawione 2026-09-08

Sesja domyślna serwera demo dostawała etykietę audience z fikstury Tomka. `ensureDemoDefaultSession`
tworzyła sesję bez audience, a `ensureDemoSession` wstawiała wtedy wartość zapasową
`DEMO_DEFAULT_AUDIENCE_LABEL = "alice"` (`demo/server/src/app.ts:655`, `:764`). Front nie wysyła pola
`audience` — w `demo/web/src/pages/Chat.tsx` nie ma go wcale — więc `/api/turn` przyjmował etykietę
zapisaną w sesji (`app.ts:4291`) i rozwiązywał ją jako osobę z prowenienecją
`transport_audience_label` (`app.ts:860-863`). Skutek: rozmowa Zosi przez `/chat` zapisała się jako
rozmowa z osobą o imieniu `alice`, a wiersze M4 z tej tury dostały jej identyfikator.

Nic w interfejsie tego nie pokazywało. Objawem była dopiero odpowiedź samego Akukiego, który
zauważył rozbieżność między podpisem „Zosia" w treści a etykietą rozmówcy — i miał rację.

NAPRAWA: zmienna środowiskowa `DEMO_AUDIENCE_LABEL`, czytana w `demo/server/src/index.ts` i
przewleczona przez `createDemoServerApp`, tym samym kształtem co `DEMO_HOST` i
`DEMO_CREATOR_ENTITY_NAME`. Nieustawiona zachowuje dawne zachowanie, czyli fiksturę. Ustawiona
jest stemplowana przy każdym starcie **razem z encją, na którą wskazuje**, bo `/api/turn` woli
zapisany `audience_entity_id` od etykiety: przepisanie samej etykiety dałoby sesję nazywającą
jedną osobę i wskazującą na drugą. Prowenienecja stempla to `config_default_user`, ranga 2, więc
nie osłabia `user_declared` z seeda (`src/memory/commitments/repository.ts:70-88`). Linia startowa
serwera wypisuje teraz `default session audience: … ; creator: …`, żeby ta wartość dała się
zobaczyć bez zaglądania do bazy.

W `/etc/akuki/akuki.env` na VPS-ie ma stać `DEMO_AUDIENCE_LABEL=Zosia`.

### Model i wymiar embeddingów — ZAMROŻONE 2026-09-04

Kanoniczna konfiguracja embeddingów, zatwierdzona przez Zosię 2026-09-04:

```text
provider  Ollama, OpenAI-compatible, http://127.0.0.1:11434/v1
model     bge-m3
wymiar    1024
```

Zgodność z istniejącym korpusem sprawdzona, nie założona: `data/akuki/config.json` żywego tenanta
ma dokładnie te trzy wartości, tak samo jak obie kopie w `data/archive/`. Migracja ani
re-embedding nie są potrzebne.

Ostrzeżenie zostaje w mocy na przyszłość i obowiązuje niezależnie od zamknięcia drogi przez
Kratosa: **nie wolno podłączyć istniejącej pamięci do innego modelu lub wymiaru bez jawnej decyzji
i migracji/re-embeddingu.** Wektor policzony innym modelem nie jest porównywalny ze starym, a przy
innym wymiarze po prostu nie wchodzi do indeksu. W szczególności generic memory sidecar nadal
domyślnie używa `generative-apis/qwen3-embedding-8b`/4096
(`borg/scripts/memory-sidecar-main.ts:53-54`) — to inna konfiguracja i nie wolno jej wpuścić na
katalog Akukiego.

### Miejsce runtime'u ustalone, jednostki systemd nadal nie ma

Topologia procesu przestała być otwarta 2026-09-04: jeden długowieczny proces, jedna instancja
Borga otwarta na cały czas życia usługi, schedulery maintenance i autonomy startowane przez
`connector/src/service.ts` (do 2026-09-07 `borg/src/akuki/arena/service.ts`, przed wyprowadzeniem
konektora do własnego pakietu). Powodem nie jest wygoda — `Borg.open()` buduje scheduler maintenance,
ale go nie startuje, robi to wyłącznie runtime (`borg/src/config/index.ts:684`,
`borg/scripts/daemon.ts:263`). Otwieranie Borga na każdą turę, jak robi `runAkukiTurn`, oznaczałoby,
że konsolidator, reflektor i dream cycle nigdy nie ruszą.

Nadal brakuje service unitu i manifestów deploymentowych; repozytorium ich nie zawiera. Connector nie
zawiera logiki dostępu do dostawców modeli i nie może jej zawierać — to własność środowiska
deploymentowego.

`sol-connector` nie jest referencją dla runtime'u Akukiego. Z jego warstwy transportowej wzięte
zostały wyłącznie nazwy endpointów, kształty odpowiedzi API, wzorzec defensywnego parsowania,
timeout 20 000 ms, self-skip, pominięcie wiadomości niefinalnych i idea postępu jako zbiór
przetworzonych plus przycinana podłoga. Borgowa część Sola nie została użyta.

### Pułapki uruchomienia konektora w serwerze demo — 2026-09-07

Cztery rzeczy, z których każda zabrała realny czas jednego dnia. Wszystkie mają cichy albo mylący
objaw, dlatego są tutaj, a nie tylko w README pakietu.

**`npm install` pada i NIE zostawia `node_modules`.** npm 10.9.8 wywala się na grafie peer
dependencies vitest z `Cannot read properties of null (reading 'edgesOut')`. Nie jest to problem
z linkiem `file:` do forka. Dotyczy pakietu `connector`, a także `demo/server` i `demo/web`.
Objaw jest mylący: pierwsze, co widać, to `vite` niemogący rozwiązać `@vitejs/plugin-react`, co
wygląda na brakującą zależność, a jest nieudaną instalacją. Lekarstwo: `--legacy-peer-deps`.
Pakiet `connector` przypina to w swoim `.npmrc`; `demo/server` i `demo/web` swojego nie mają, więc
tam flagę trzeba podać z ręki.

**Ścieżki względne w konfiguracji rozwijają się względem `borg/demo/server`.** `npm run dev:server`
schodzi przez `npm --prefix demo/server`, więc to jest katalog roboczy serwera.
`EXTRA_CONNECTOR_MODULE=../connector/src/plugin.ts` staje się `borg/demo/connector/...` i pada na
`ERR_MODULE_NOT_FOUND`. Ta sama pułapka ciszej: względne `AKUKI_ARENA_STATE_DB` kładzie bazę stanu
adaptera w drzewie roboczym borga i daje **inny plik** niż ten, którego użyłby `npm start` — dwie
bazy stanu dla jednego przebiegu. W tej ścieżce wszystkie ścieżki muszą być bezwzględne.

**Serwer demo czyta `BORG_DATA_DIR`, nie `AKUKI_DATA_DIR`.** Drugą zmienną czyta konektor, gdy sam
otwiera Borga. Ustawienie tylko `AKUKI_DATA_DIR` i uruchomienie przez plugin zostawia serwer
otwierający swój domyślny katalog: byt zdrowy, pusty i obcy, na stronie obiecującej pamięć Akukiego.
Obie muszą wskazywać ten sam katalog.

**Powtórne `cp .env.example .env` cofa całą konfigurację.** Szablon nadpisuje wypełniony plik
i wszystko jest zakomentowane, więc proces startuje na domyślnych wartościach borga — w tym na
embeddingach `text-embedding-qwen3-embedding-8b`/4096 pod `http://localhost:1234/v1`, gdzie nic nie
słucha. Objawem jest `EmbeddingError: Failed to generate embeddings ... "Connection error."`, które
nie podaje hosta. Od 2026-09-07 konektor wypisuje przy starcie linię `as resolved here: tenant=...
embeddings=... model=... dims=...`, właśnie żeby ten objaw dał się zdiagnozować w jednej linii.

### Tailscale omija NSG i firewall hosta — zmierzone 2026-09-08

To najważniejsze ustalenie o sieci Akukiego i było przez cztery dni opisane błędnie, także
w tym pliku. Poprzednia wersja ostrzegała, że bez przypięcia nasłuchu „jedyną warstwą
między światem a pamięcią Akukiego byłaby reguła NSG". Z internetu nie dochodzi tam nic —
Zosia to zauważyła i miała rację. Prawdziwe ryzyko jest inne i większe.

POMIAR. Na VPS-ie postawiony serwer na porcie 39999, którego nie ma ani w regułach ingress
NSG, ani w regule firewalla hosta:

    przez tunel,  100.124.237.35:39999  ->  HTTP 200 w 65 ms
    przez publiczny, 129.159.24.178:39999  ->  HTTP 000, brak odpowiedzi

DLACZEGO. Ruch tailscale'owy przylatuje jako WireGuard po UDP 41641, jądro go rozpakowuje
i pakiety pojawiają się na interfejsie `tailscale0` już WEWNĄTRZ hosta. NSG widzi tylko ten
jeden port UDP i nie ma pojęcia, co jest w środku. A pierwsza reguła łańcucha `INPUT` to
skok do `ts-input`, w którym stoi:

    -A ts-input -i tailscale0 -j ACCEPT

Bezwarunkowo, przed wszystkimi regułami lokalnej polityki. Czyli **każdy port otwarty na
interfejsie tailscale'owym jest dostępny z każdego urządzenia w tailnecie, bez filtrowania**.
Zmierzona polityka tailnetu jest domyślna, „każdy do każdego na każdy port" — gdyby
filtrowała, port 39999 nie odpowiedziałby niezależnie od `iptables`.

TE REGUŁY NALEŻĄ DO TAILSCALE, NIE DO NAS. `tailscale debug prefs` pokazuje
`NetfilterMode: 2`, czyli `tailscaled` sam zarządza swoimi łańcuchami i wstawia je na
początek `INPUT` przy każdym starcie. Ręczne przestawianie ich nie ma sensu, bo zostaną
nadpisane. Właściwą warstwą kontroli jest polityka tailnetu (ACL), nie `iptables`.

STAN FAKTYCZNY, w jednym zdaniu: **dwa firewalle na drodze publicznej, zero na drodze przez
tunel.**

DOTYCZY TO TREŚCI AC #4 w TASK-024, które mówi „NSG i firewall wpuszczają tylko SSH od
Zosi/Bastiona". Zmierzony stan: NSG nie wpuszcza niczego, firewall hosta przyjmuje port 22
z dowolnego adresu (reguła 5 w `INPUT`, bez ograniczenia źródła), a przez tunel wchodzi
wszystko. Kryterium zostaje odhaczone, bo dostęp faktycznie jest zawężony do sieci Zosi,
ale jego opis nie odpowiada mechanizmowi.

### ufw na VPS-ie jest nieaktywny mimo `ufw status: active`

Kolejność w łańcuchu `INPUT`:

    1  ts-input
    2  ACCEPT  state RELATED,ESTABLISHED
    3  ACCEPT  icmp
    4  ACCEPT  -i lo
    5  ACCEPT  tcp dpt:22  state NEW
    6  REJECT  <- wszystko inne odbite TUTAJ
    7  ufw-before-logging-input
    8  ufw-before-input
    9  ufw-after-input
    10 ufw-after-logging-input

Reguła 6 odbija wszystko, a łańcuchy ufw są dopiero w 7-10, więc **żadne nowe połączenie
nigdy do nich nie dochodzi**. Ochronę na drodze publicznej dają reguły dostarczone przez
Oracle'a (polityka `DROP` plus ta reguła odbijająca), nie ufw.

Skutek praktyczny: widniejąca w ufw reguła `22/tcp ALLOW from 83.175.184.155` NIE egzekwuje
niczego. To pozostałość po allowliście per-IP z czasów przed Tailscale, opisanych w
`vps-ssh-dostep.md`. Wygląda jak ochrona i nią nie jest, a `ufw status` mówi „active", co
jest najgorszym rodzajem mylącej informacji.

ZOSTAWIONE ŚWIADOMIE, decyzja Zosi 2026-09-08. Dziś nic przez to nie przecieka, bo NSG
trzyma drogę publiczną, a edycja `iptables` przez SSH grozi odcięciem się od maszyny. Wpis
istnieje po to, żeby nikt — łącznie z nami — nie policzył ufw jako warstwy ochrony.

### Serwer demo nasłuchuje na wszystkich interfejsach

`demo/server/src/index.ts` woła `serve({ fetch, port })`, a `@hono/node-server` bez
`hostname` przyjmuje połączenia na każdym interfejsie. NIE oznacza to dostępu z internetu —
NSG blokuje drogę publiczną. Oznacza dostęp z **każdego urządzenia w tailnecie**, z powodu
opisanego w poprzednim wpisie: `ts-input` przyjmuje wszystko na `tailscale0`, przed
jakąkolwiek regułą lokalną.

ROZWIĄZANE 2026-09-08. Serwer demo przyjmuje teraz `DEMO_HOST` (commit `a600bb88`), a
`/etc/akuki/akuki.env` ustawia `DEMO_HOST=127.0.0.1`. Front (`vite preview`) proxuje `/api`
na `127.0.0.1:7740`, więc API nie musi i nie może być osiągalne z sieci. Nieustawiony
`DEMO_HOST` zachowuje dawne zachowanie, a linia startowa mówi, który interfejs dostał, i
dopisuje „every interface", gdy nie dostała żadnego.

Zostaje jedna droga osiągalna z tailnetu: port frontu. To ona jest właściwym miejscem na
politykę ACL tailnetu.

## Jakość i zależności

### Pełny Vitest nie jest zielony

Ostatni pełny przebieg: 2026-09-04 12:46, `npx vitest run src` w katalogu `borg/`, load average
0,80 na starcie. Wynik:

```text
Test Files  4 failed | 323 passed (327)
     Tests  3 failed | 3696 passed | 1 todo (3700)
  Duration  219.70s
```

Poprzednia notatka mówiła o 3685 zielonych i 13 czerwonych z 2026-09-03; liczby powyżej ją
zastępują. Ten przebieg jest już po commicie `ebd80c48` (etykieta disclosure dla otwartych
oczekiwań M2).

Liczba czerwonych zależy od obciążenia maszyny — ma ona 8 rdzeni, a vitest sam je wysyca. Ten sam
suite uruchomiony wcześniej tego dnia przy load average 39,7, kiedy równolegle pracowała druga
sesja, dał **9 czerwonych plików i 29 czerwonych testów**. Bez podania obciążenia liczba czerwonych
nic nie znaczy.

Cztery czerwone pliki z ostatniego przebiegu dzielą się na trzy różne rzeczy:

**1. Stała porażka środowiskowa.** `demo/server/src/__tests__/server.test.ts` w ogóle się nie
zbiera: `Cannot find package '@hono/node-server'`. Brak zależności, nie kod — sprawdzone:
w `borg/node_modules/` nie ma katalogu `@hono`, a `borg/demo/server/` nie ma własnego
`node_modules`.

**2. ROZSTRZYGNIĘTE 2026-09-04 — było czerwone celowo.**
`src/akuki/seed/temperament.test.ts` > „fails for a parameter whose milestone has landed and which
nothing reads". Nie była to awaria, tylko znalezisko: po dopisaniu `M4` do `LANDED_MILESTONES`
strażnik sierot pokazał, że `differentiation.imitation_retention_threshold` nie ma w kodzie żadnego
czytelnika. Zamknięte przez TASK-031: słownik konsumenta obejmuje teraz kamień milowy **albo** jedno
zadanie z backlogu, a ten klucz wskazuje TASK-032 (czytelnik retencji imitacji, blokowany przez
TASK-028) — bo M4 zbudowało tylko górną połowę tego, czego próg potrzebuje. `M4` **zostało**
w `LANDED_MILESTONES`, strażnik bez wyjątków i bez osłabienia, dwa nowe testy pokazują wariant
zadaniowy i cicho, i czerwono. `npx vitest run src/akuki` → 77/77, typecheck 0.

**3. Timeouty 15 s pod równoległym obciążeniem.** Przechodzą uruchomione osobno przy load average
1,4–2,3:

| plik | osobno | uwaga |
|---|---|---|
| `src/cognition/turn-orchestrator.test.ts` | 92/92 | czerwony w obu przebiegach pełnego suite |
| `src/cognition/evidence-ledger/builder.test.ts` | 55/55 | czerwony w obu przebiegach pełnego suite |
| `src/offline/belief-reviser/index.test.ts` | 38/38 | czerwony przy load 4,6, zielony przy 0,80 |

Nadal nie należy opisywać pełnego suite jako przechodzącego, ale rozstrzygnięte jest, że czerwone
poza `demo/server` i poza strażnikiem sierot to obciążenie, nie regresja.

PUŁAPKA POMIAROWA: `npx vitest run <plik>` trzeba uruchamiać **z katalogu `borg/`**. Uruchomiony
z katalogu głównego repozytorium bierze inną konfigurację — testTimeout 5000 ms zamiast 15 000 —
i te same trzy pliki wywalają się na timeout, co wygląda jak potwierdzenie regresji, a nie jest.

Diagnoza z sierpnia mówiąca o 8 plikach, 23 testach i 5 błędach była nieaktualna już 2026-09-03:
dominującą przyczyną było brakujące wsparcie testowe dla ekstraktorów poturowych (opisane niżej),
naprawione 2026-09-03.

Osobno, poza Vitestem: `scripts/heuristics-guard.ts` jest **zielony**, sprawdzone uruchomieniem
2026-09-04 (`npm run heuristics:guard`, bez błędu). Był czerwony — wiersze otwartych oczekiwań M2
trafiały do modelu bez etykiety disclosure — i został naprawiony commitem `ebd80c48`
(„fix(predictions): label open expectations shown to the extraction model"). TASK-029: Done.

### Nowy ekstraktor poturowy bez fallbacku w `FakeLLMClient` wysadza testy turowe

Każdy ekstraktor wpięty w fazę ekstrakcji wykonuje wywołanie LLM w każdej turze użytkownika. Jeśli
nie ma własnego fallbacku w `src/llm/test-support/fake-client.ts`, w testach, które go nie
skryptują, zjada skryptowaną odpowiedź przeznaczoną dla repliki; tura umiera dopiero niżej, na
`FakeLLMClient has no scripted response available`. Objaw jest odległy od przyczyny — przy M2 i M4
dało to ~130 czerwonych testów w `turn-orchestrator`, `borg/__tests__` i `stop-primitive`.

Dodając ekstraktor, dopisz mu fallback (rozpoznanie po `budget` + pusty wynik), zarejestruj etykiety
w `src/tracing/extractor-labels.ts` i popraw asercje liczące wywołania LLM tury.

### Odłożone podatności zależności

`npm audit` zgłosił problemy obejmujące `@anthropic-ai/sdk`, `esbuild`, `nanoid` i `postcss`.
Nie wykonano `npm audit fix` ani wymuszonej aktualizacji; naprawa wymaga osobnego przeglądu wpływu,
w tym możliwych breaking changes.

### Wpływ pełnego użycia Anthropica na limity zespołu wymaga eksperymentu

Tomek wskazał Anthropica dla wszystkich ról jako najprostszy wariant bez Kratosa i VPN-u; decyzją
z 2026-09-02 to już nie wariant, tylko obowiązująca droga. Zgoda na eksperyment nie stała się przez
to zgodą na runtime 24/7 — poniższe ostrzeżenie obowiązuje dalej. Borg może generować duży ruch także bez wiadomości z Areny: maintenance jest domyślnie włączony,
lekki cykl ma kadencję 4 h, ciężki 24 h, a globalne budżety obu cykli są domyślnie nieograniczone.
Limity procesów są wysokie — m.in. reflector 800 000 i self-narrator 500 000 tokenów na przebieg.

Tomek zatwierdził krótkotrwały eksperyment Anthropic-only na swoją odpowiedzialność. Akceptowanym
ryzykiem testu jest szybsze wyczerpanie bieżących limitów; jeśli zużycie okaże się za wysokie,
eksperyment ma zostać natychmiast wyłączony. Zgoda nie oznacza bezterminowego runtime'u 24/7 ani
rezygnacji z pomiaru i limitów.

Nadal nie wiadomo, czy firmowy dostęp jest rozliczany per użytkownik, przez wspólną pulę, dodatkowe
użycie czy wewnętrzny proxy. Test musi rejestrować zużycie i mieć prostą procedurę zatrzymania.
Śledzenie: TASK-013.

## Historia — droga przez Kratosa (zamknięta 2026-09-02)

Poniższe pozycje **nie zostały rozwiązane technicznie**. Zostały unieważnione decyzją: cognition
Akukiego działa wyłącznie na modelach Anthropic (`claude-opus-4-8`), a droga przez Kratosa —
prywatny DNS, klient Fortinet na VPS-ie, Play Root CA, wewnętrzny endpoint inference — jest
porzucona i nie należy jej kontynuować. Zapis zostaje, żeby nikt nie zaczynał tej pracy od nowa,
sądząc że jest tylko niedokończona.

Ślad w kodzie: `borg/src/akuki/smoke-config.ts:17-19` trzyma `FORBIDDEN_KRATOS_HOSTS`
(`inference.kratos.p4.int`, `inference.kratos.omc.hdp.it.p4`) i odrzuca je w trybie
`AKUKI_ANTHROPIC_ONLY=1` (`smoke-config.ts:103`).

### VPS nie rozwiązywał domen Kratosa (nieaktualne)

Oracle VPS nie rozwiązywał żadnej z używanych wtedy domen:

```text
inference.kratos.omc.hdp.it.p4
inference.kratos.p4.int
```

Test kończył się `Could not resolve host` i `HTTP 000`. Nie było potwierdzonego prywatnego DNS ani
routingu z VPS-a do sieci Play. Śledzone w TASK-025, zamkniętym jako nieaktualne 2026-09-04.

### Wariant Fortinet/proxy (nieaktualny)

Tomek opisał warunkowy wariant: Fortinet na VPS-ie, `ip_forward`, reguły NAT/mangle i dodatkowy port
proxy ograniczony w OCI do publicznego IP Zosi. To był opis wysokopoziomowy, nie gotowa ani
zatwierdzona procedura, i uczyniłby z VPS-a bramę do sieci P4 — osobny projekt sieciowy, nie
wymaganie Akukiego. Wariant odpada razem z całą drogą przez Kratosa.

### Niespójne domeny Kratosa (nieaktualne)

Generic sidecar domyślnie używał `inference.kratos.omc.hdp.it.p4`, a Akuki-aware runtime
`inference.kratos.p4.int`. Która domena jest kanoniczna, pozostało nierozstrzygnięte i przestało
mieć znaczenie dla Akukiego.

Domyślne wartości kratosowe zostały usunięte z kodu 2026-09-04 (decyzja Zosi):
`borg/src/akuki/tenant.ts` nie ma już ani `AKUKI_DEFAULT_BASE_URL`
(`https://inference.kratos.p4.int/v1`), ani `AKUKI_DEFAULT_ENDPOINT_MODEL`
(`generative-apis/qwen3-235b-a22b-instruct-2507`). Rola nie-Anthropic wymaga teraz jawnego
ustawienia `AKUKI_LLM_BASE_URL` i `AKUKI_ENDPOINT_MODEL`; ich brak daje `ConfigError`
z `OpenAICompatibleLLMClient` przy pierwszym wywołaniu modelu spoza rodziny `claude-*`, a nie cichy
fallback na Kratosa.

