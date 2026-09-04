# Znane wady i blokery

Stan na 2026-08-28. Ten dokument opisuje potwierdzone problemy obecnego wdrożenia; nie jest zgodą
na wdrażanie obejść.

## Blokery produkcyjne

### VPS nie ma dostępu do Kratosa

Oracle VPS nie rozwiązuje żadnej z używanych obecnie domen:

```text
inference.kratos.omc.hdp.it.p4
inference.kratos.p4.int
```

Test kończy się `Could not resolve host` i `HTTP 000`. Nie ma potwierdzonego prywatnego DNS ani
routingu z VPS-a do sieci Play. Nie instalować VPN-u i nie zmieniać DNS, SSH ani firewalla bez
formalnej zgody. Reverse SSH przez laptop może być wyłącznie zatwierdzonym rozwiązaniem
developerskim; wymaga zachowania właściwej nazwy hosta dla SNI i walidacji certyfikatu.

Śledzenie: TASK-025.

### Wariant Fortinet/proxy może niepotrzebnie zrobić z VPS-a gateway do P4

Tomek opisał warunkowy wariant: Fortinet na VPS-ie, `ip_forward`, reguły NAT/mangle i dodatkowy
port proxy ograniczony w OCI do publicznego IP Zosi. To opis wysokopoziomowy, nie gotowa ani
zatwierdzona procedura.

Dla samego Akukiego działającego na VPS-ie publiczny port proxy nie jest potrzebny: runtime mógłby
łączyć się z Kratosem wychodząco przez klienta VPN na VPS-ie. Wystawienie portu oraz forwardowanie
całej podsieci P4 uczyniłoby VPS bramą dla laptopa i potencjalnie innych hostów, zwiększając zakres
dostępu do prywatnej sieci. Wymaga to osobnej zgody i projektu zespołu sieciowego.

Standardowe `ip route` wskazuje adres next-hop, nie `adres:port`; dostęp do podsieci przez port TCP
wymaga dodatkowego, jawnie określonego mechanizmu tunelowania/proxy. Nie wdrażać opisu dosłownie
bez technicznej weryfikacji.

### Brakuje connectora Bot Areny dla Akukiego

Akuki-aware runtime istnieje w forku Borga, ale nie ma jeszcze cienkiego adaptera, który odpytuje
Bot Arenę, przekazuje znormalizowane wiadomości do `AkukiRunner` i publikuje odpowiedzi. Tomek
wyraził zgodę na użycie `sol-connector` jako inspiracji dla integracji z Bot Areną. Zgoda nie
obejmuje borgowej części Sola ani mechanicznego kopiowania dużych fragmentów kodu.

Śledzenie: TASK-011.

### VPS nie jest jeszcze gotową usługą

Na VPS-ie istnieją repozytoria i użytkownik `akuki`; `npm ci` oraz `npm run build` zakończyły się
poprawnie. Nie ma jednak usługi systemd, sekretów, produkcyjnego data root, connectora ani
uruchomionego procesu. Udany build nie jest testem dostępu do modeli ani pełnego turnu.

Śledzenie: TASK-024.

## Wady i ryzyka konfiguracji

### `npm start` uruchamia niewłaściwy proces dla docelowej architektury

`npm start` w Borgu uruchamia generic memory sidecar. Sidecar udostępnia `recall`, `remember` i
`append-turn`, ale nie generuje odpowiedzi. Nie stosuje automatycznie seeda Akukiego, nie używa
Akuki-aware routera modeli i nie komunikuje się z Bot Areną. Nie uruchamiać go jako głównego
runtime'u Akukiego.

Sidecar i właściwy Akuki-aware runtime nie mogą równocześnie pisać do tego samego katalogu tenanta.

### Niespójne domeny Kratosa

Generic sidecar domyślnie używa `inference.kratos.omc.hdp.it.p4`, a Akuki-aware runtime
`inference.kratos.p4.int`. Nie wiadomo jeszcze, która domena jest kanoniczna i właściwa dla
docelowego środowiska.

### Model i wymiar embeddingów wymagają zamrożenia przed migracją

Materiały wdrożeniowe zawierają zarówno lokalny wariant `bge-m3`/1024, jak i konfigurację Kratosa
`qwen3-embedding-8b`/4096. Nie wolno podłączyć istniejącej pamięci do innego modelu lub wymiaru bez
jawnej decyzji i migracji/re-embeddingu. Przed przeniesieniem żywego tenanta trzeba ustalić
kanoniczną konfigurację.

### Nieustalone miejsce i topologia produkcyjnego runtime'u

`sol-connector` nie jest referencją dla runtime'u Akukiego ani dowodem, że Akuki powinien otwierać
Borga tak samo jak Sol. Repozytorium nie zawiera też VPN-u, proxy, tunelu, service unitu ani
manifestów deploymentowych. Nie wiadomo jeszcze, czy Akuki dostanie host wewnętrzny, zatwierdzony
gateway, czy pozostanie na Oracle VPS, ani czy `AkukiRunner` powinien utrzymywać długowieczną
instancję Borga. Connector nie może zawierać logiki dostępu do Kratosa.

## Jakość i zależności

### Pełny Vitest nie jest zielony

Ostatni pełny przebieg (2026-09-03, `vitest run src`): 3685 testów przechodzi, 13 nie. Zbiór
czerwonych zmienia się między przebiegami — wszystkie poza jednym to timeouty 15 s pod pełnym
obciążeniem równoległym, więc ich liczba zależy od tego, jak zajęta jest maszyna (m.in. stronicowanie
leksykalne epizodów, reverse-scan evidence ledgera, belief-reviser, review-resolver, retrieval
pipeline-sprint2, reflector, scheduler autonomii). Każdy z tych plików przechodzi uruchomiony
osobno.

Jedyna stała porażka to `demo/server/src/__tests__/server.test.ts`, który w ogóle się nie zbiera:
`Cannot find package '@hono/node-server'`. To brak zależności w środowisku, nie kod.

Wcześniejsza diagnoza mówiąca o 8 plikach, 23 testach i 5 błędach jest nieaktualna: dominującą
przyczyną było brakujące wsparcie testowe dla ekstraktorów poturowych (opisane niżej), naprawione
2026-09-03. Nadal nie należy opisywać pełnego suite jako przechodzącego, ale rozstrzygnięte jest,
że pozostałe czerwone to obciążenie i środowisko, nie regresja.

Osobno, poza Vitestem, czerwony jest `scripts/heuristics-guard.ts`: wiersze otwartych oczekiwań M2
trafiają do modelu bez etykiety disclosure (`src/cognition/predictions/prediction-extractor.ts`).
Śledzenie: TASK-029.

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

Tomek wskazał Anthropica dla wszystkich ról jako najprostszy wariant bez Kratosa i VPN-u. Borg
może jednak generować duży ruch także bez wiadomości z Areny: maintenance jest domyślnie włączony,
lekki cykl ma kadencję 4 h, ciężki 24 h, a globalne budżety obu cykli są domyślnie nieograniczone.
Limity procesów są wysokie — m.in. reflector 800 000 i self-narrator 500 000 tokenów na przebieg.

Tomek zatwierdził krótkotrwały eksperyment Anthropic-only na swoją odpowiedzialność. Akceptowanym
ryzykiem testu jest szybsze wyczerpanie bieżących limitów; jeśli zużycie okaże się za wysokie,
eksperyment ma zostać natychmiast wyłączony. Zgoda nie oznacza bezterminowego runtime'u 24/7 ani
rezygnacji z pomiaru i limitów.

Nadal nie wiadomo, czy firmowy dostęp jest rozliczany per użytkownik, przez wspólną pulę, dodatkowe
użycie czy wewnętrzny proxy. Test musi rejestrować zużycie i mieć prostą procedurę zatrzymania.
Śledzenie: TASK-013.
