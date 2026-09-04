# Znane wady i blokery

Stan na 2026-09-04. Ten dokument opisuje potwierdzone problemy obecnego wdrożenia; nie jest zgodą
na wdrażanie obejść. Problemy rozwiązane albo unieważnione decyzją są przeniesione na koniec, do
sekcji historycznej — nie kasujemy ich, bo powód zamknięcia jest sam w sobie informacją.

## Blokery produkcyjne

### Brakuje connectora Bot Areny dla Akukiego

Akuki-aware runtime istnieje w forku Borga, ale nie ma jeszcze cienkiego adaptera, który odpytuje
Bot Arenę, przekazuje znormalizowane wiadomości do `AkukiRunner` i publikuje odpowiedzi. Tomek
wyraził zgodę na użycie `sol-connector` jako inspiracji dla integracji z Bot Areną. Zgoda nie
obejmuje borgowej części Sola ani mechanicznego kopiowania dużych fragmentów kodu.

Od 2026-09-02 to jest jedyna pozostała brama do uruchomienia Akukiego na Arenie: dostęp do modeli
przestał być blokerem, brakuje kodu connectora.

Śledzenie: TASK-011.

### VPS nie jest jeszcze gotową usługą

Na VPS-ie istnieją repozytoria i użytkownik `akuki`; `npm ci` oraz `npm run build` zakończyły się
poprawnie. Smoke test przeszedł tam 2026-09-01: dwie tury z `/opt/akuki/app` jako użytkownik
`akuki`, wszystkie wywołania `claude-opus-4-8` przez aiproxy, embeddingi Ollama `bge-m3`/1024 na
localhoście, cache czytany między turami (`cache_read_input_tokens` 16578 → 23645). Dodatkowo
odczyt t0 testu internalizacji, 28 tur, w `/var/lib/akuki/internalization-t0-live`.

Nadal nie ma usługi systemd, produkcyjnego data root, connectora ani stale działającego procesu.
Udany smoke test na katalogu `akuki-smoke` nie jest usługą i nie migruje żywego tenanta.

Śledzenie: TASK-024.

## Wady i ryzyka konfiguracji

### `npm start` uruchamia niewłaściwy proces dla docelowej architektury

`npm start` w Borgu uruchamia generic memory sidecar. Sidecar udostępnia `recall`, `remember` i
`append-turn`, ale nie generuje odpowiedzi. Nie stosuje automatycznie seeda Akukiego, nie używa
Akuki-aware routera modeli i nie komunikuje się z Bot Areną. Nie uruchamiać go jako głównego
runtime'u Akukiego.

Sidecar i właściwy Akuki-aware runtime nie mogą równocześnie pisać do tego samego katalogu tenanta.

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

### Nieustalone miejsce i topologia produkcyjnego runtime'u

`sol-connector` nie jest referencją dla runtime'u Akukiego ani dowodem, że Akuki powinien otwierać
Borga tak samo jak Sol. Repozytorium nie zawiera service unitu ani manifestów deploymentowych. Nie
wiadomo jeszcze, czy `AkukiRunner` powinien utrzymywać długowieczną instancję Borga. Connector nie
może zawierać logiki dostępu do dostawców modeli — to własność środowiska deploymentowego.

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

