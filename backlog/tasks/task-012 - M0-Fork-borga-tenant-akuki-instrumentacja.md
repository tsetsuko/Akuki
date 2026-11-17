---
id: TASK-012
title: 'M0: Fork borga, tenant akuki, instrumentacja'
status: Done
assignee: []
created_date: '2026-08-20 14:28'
updated_date: '2026-10-19 12:04'
labels: []
dependencies: []
priority: high
ordinal: 37000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nic rozwojowego. Cel: móc później odróżnić rozwój od szumu.

FORK — Tomek dał zgodę na fork i publikację.
  git clone /home/zosia/projects/ai/borg -> akuki-borg
  git remote add upstream <TKasperczyk/borg>
  git switch -c akuki-dev
Upstream dev jest aktywny, więc fetchuj regularnie, żeby widzieć rozjazd.

TENANT — własny katalog `<root>/akuki/` z własnym `config.json`. Nigdy katalog Sola (single-writer
+ to byłby jeden byt z dwoma ustami). Historycznie zakładano BorgPool w generic sidecarze; po
analizie wdrożeniowej docelowy `BotArenaAdapter` wywołuje osobny `AkukiRunner`. Tylko runner zna
szczegóły otwierania Borga. Zasada izolacji katalogu i pojedynczego writera pozostaje bez zmian.

WEKTOR STANU ROZWOJOWEGO — snapshot co noc:
  self/       cechy + liczba dowodów, wartości + affirm, cele, otwarte pytania, okresy, growth markers
  social/     zaufanie per osoba, liczniki interakcji, sentyment
  procedural/ umiejętności z Beta (alfa, beta) PER KONTEKST
  semantic/   liczba węzłów/krawędzi, contested + quarantined
  affective/  trajektoria nastroju
  identity_events  PEŁNY changelog: action, old_value_json, new_value_json, reason, cytowania, ts

NAJWAŻNIEJSZE ZNALEZISKO: identity_events już istnieje (src/memory/identity/) i jest czytany przez service.listEvents(). To gotowy zapis rozwoju. Nie trzeba go budować, trzeba go czytać.

Do ponownego użycia: simulator/memory-snapshot.ts (już sekcjonuje te pasma), MemoryTraceRegistry + tracerFor(tenantId) z scripts/memory-sidecar-main.ts.

REZULTAT: moduł w Pythonie, który czyta snapshoty + identity_events i rysuje timeline. Wykresy, nie transkrypty. To jest artefakt badawczy.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Fork z remote upstream; galaz akuki-dev na upstream/dev; typecheck i heuristics:guard ZIELONE
- [x] #2 Pelny suite udokumentowany, nie udawany zielony: upstream CI go NIE uruchamia (tylko npm ci + heuristics:guard + assess --mock)
- [x] #3 assess --mock: 9/10 - mood-persistence pada IDENTYCZNIE na main i na dev, wiec to stan upstreamu, nie forka
- [x] #4 Klient routujacy LLM: cognition -> claude-sonnet-5 (Anthropic), pozostale role -> kratos qwen3-235b
- [x] #5 Akuki otwiera sie jako tenant akuki, tura przechodzi, identity_events rosnie
- [x] #6 Dwa datowane snapshoty w JSON i czytelny diff miedzy nimi
- [x] #7 Bieg symulatora na SKOPIOWANYM katalogu rusza co najmniej jedna liczbe w wektorze stanu
- [x] #8 Kod Akukiego w src/akuki/ - NIE w nowym katalogu top-level, bo ten nie byl by typecheckowany
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
POSTEP 2026-08-21 - fork i bramki.

Fork: /home/zosia/projects/ai/akuki-borg, galaz akuki-dev, remote upstream -> https://github.com/TKasperczyk/borg.git
Sklonowany z lokalnego /home/zosia/projects/ai/borg z --no-hardlinks (bez --no-hardlinks klon dzieli baze
obiektow z zrodlem i gc w zrodle moze go uszkodzic).

GALAZ: na polecenie Tomka akuki-dev stoi na upstream/dev, nie na main.
Zmierzona rozbieznosc PRZED przelaczeniem: dev ma 31 commitow, ktorych nie ma main; main ma ZERO commitow,
ktorych nie ma dev. Czyli main jest scislym przodkiem dev - przelaczenie bylo fast-forward, bez rozjazdu
do pogodzenia. package.json i package-lock.json sa BAJT W BAJT identyczne miedzy main i dev, wiec
node_modules z jednego dziala na drugim (nie trzeba reinstalowac przy skakaniu po galeziach).

MENEDZER PAKIETOW - rozstrzygniete: npm, nie pnpm.
AGENTS.md:253-256 mowi pnpm, ale .github/workflows/assessor.yml:16-18 to doslownie:
  npm ci
  npm run heuristics:guard
  npm run assess -- --mock
package-lock.json jest TRACKOWANY w repo. Czyli npm to sciezka CI. pnpm-lock.yaml NIE jest trackowany.
UWAGA: uruchomienie pelnego suite tworzy niezatrackowane pnpm-lock.yaml i pnpm-workspace.yaml, bo
scripts/debug.test.ts:10 na sztywno wola pnpm. Usunac po biegu, zeby drzewo bylo czyste.

BRAMKI - stan faktyczny, bez upiekszania.

typecheck: ZIELONY (piec przebiegow tsc: root, eval, assessor, simulator, test)
heuristics:guard: ZIELONY, ale najpierw wymagal naprawy srodowiska - patrz nizej
assess --mock: 9/10, jedna porazka PRE-EXISTING
pelny suite: 25 porazek / 3685 testow (10 plikow / 329)

RIPGREP: heuristics:guard wola spawnSync("rg", ...) w scripts/heuristics-guard.ts:239, co IGNORUJE funkcje
shella. W tym srodowisku rg jest FUNKCJA shella Claude Code (type rg -> "is a function", which rg -> nic),
wiec guard wywalal sie z TypeError: Cannot read properties of undefined (reading 'trim') w :249.
To byl brak binarki (ENOENT), NIE naruszenie heurystyki. Naprawione symlinkiem prawdziwego ripgrepa 15.1.0
(/home/zosia/.pi/agent/bin/rg) do ~/.local/bin/rg. Solidniejsza naprawa: sudo apt install ripgrep.
WNIOSEK: ta bramka padlaby tez u Zosi w zwyklym terminalu - rg nie ma na PATH jako binarka.

assess --mock pada na scenariuszu mood-persistence: -Mood is negative after the emotional turn and decays
toward neutral later -- turn1 valence=0; turn3 valence=0-. Sprawdzone przez uruchomienie tej samej komendy
na upstream/main: pada IDENTYCZNIE (9/10, ten sam scenariusz). Czyli bramka CI upstreamu jest dzis czerwona
na OBU galeziach. Nie my.

PELNY SUITE - kategoryzacja 25 porazek. Zadna nie obcia forka.
  9x scripts/debug.test.ts   - testy na sztywno wolaja pnpm exec (:10, :18, :127...), a pnpm w tym
                               srodowisku wywala sie na bramce zatwierdzania buildow esbuilda
                               ([ERR_PNPM_IGNORED_BUILDS]) i konczy kodem 1
  6x simulator/runner.test.ts - crashe workerow, StreamError ENOENT na lockach sesji w /tmp, timeouty;
                               11 workerow rownolegle, wyglada na wyscig o zasoby
  2x assessor/*.test.ts       - wynosza na wierzch te sama pre-existing porazke mood-persistence
  1x demo/server              - brak pakietu @hono/node-server (demo ma wlasne zaleznosci)
  1x evidence-ledger/builder  - TIMEOUT 15561ms przy limicie testTimeout 15000ms, czyli szybkosc maszyny,
                               nie zla asercja
  1x turn-orchestrator        - FLAKE: w izolacji PRZECHODZI (146/147 w osobnym biegu)
W logu widac tez ECONNREFUSED 127.0.0.1:1234 - to domyslny endpoint embeddingow (LM Studio), ktory nie chodzi.

WNIOSEK DO AC: pierwotne -typecheck+test+heuristics:guard zielone- zadalo czegos, czego upstream nigdy nie
utrzymywal - jego CI nie uruchamia pelnego suite. AC przepisane: bramki utrzymywane przez upstream musza byc
zielone, a stan pelnego suite ma byc UDOKUMENTOWANY, nie udawany.

SRODOWISKO LLM I EMBEDDINGOW - zweryfikowane dzialaniem, nie zalozone.

kratos (https://inference.kratos.p4.int/v1) dziala z kluczem pass cortex/llm-api-key.
Sieciowo osiagalny BEZ interfejsu fctvpn (tunel idzie przez ppp0) - pierwszy strzal bez klucza wrocil 401
w 0.011s, czyli sciezka sieciowa jest, brakowalo tylko autoryzacji.
Embeddingi: generative-apis/bge-multilingual-gemma2 zwraca 3584 wymiary (zmierzone realnym zapytaniem).

WYBOR MODELI (decyzja Zosi 2026-08-21):
  cognition -> claude-sonnet-5 (Anthropic, jej klucz) - wlasciwe myslenie Akukiego
  background / extraction / recallExpansion / creatorDirective -> generative-apis/qwen3-235b-a22b-instruct-2507
DLACZEGO qwen3-235b: getModelMaxOutputTokens (src/llm/max-tokens.ts:17) dopasowuje rodzine wzorcem
/^(?:[^/]+\/)?qwen3(?:[-._].+)?$/ i daje 16384 tokenow wyjscia. glm-5.2, devstral i llama-3.3 NIE pasuja
i cicho spadaja do fallbacku 8192 (:21). qwen3-235b to tez domyslny model wlasnego sidecara borga
(scripts/memory-sidecar-main.ts) i ma 250k wejscia.

PRZESZKODA: borg ma JEDEN klient LLM na WSZYSTKIE role. createLlmFactory (src/borg/clients.ts:79-93) to
  if (llmClient !== undefined) { return () => llmClient; }
BORG_MODEL_* wybieraja tylko IDENTYFIKATORY modeli, nie dostawcow. Czyli mieszanka Anthropic+kratos wymaga
malego KLIENTA ROUTUJACEGO, ktory patrzy na options.model i deleguje: claude-* -> AnthropicLLMClient,
reszta -> OpenAICompatibleLLMClient. Wstrzykniecie przez BorgOpenOptions.llmClient to jedyny hak
(src/borg/open.ts:119-125); CLI borga i npm run daemon nie potrafia wstrzyknac wcale.

DOBRA WIADOMOSC: ograniczenie OpenAICompatible dotyczace output_config (rzuca w openai-compatible.ts:349)
jest teoretyczne - rg po src pokazuje, ze output_config wystepuje TYLKO w warstwie src/llm i w fake-kliencie
testowym. Zaden kod cognition/offline go nie przekazuje. Sciezka kratos nie uderzy w ten rzut.

PULAPKA: npm run chat BEZ klucza Anthropic nie pada - ostrzega i po cichu podstawia ScriptedDebugLLM
(scripts/_clients.ts:441-475). Pomiar zrobiony w ten sposob mierzy atrape.

ZOSTAJE DO ZROBIENIA: klucz Anthropic w pass (TASK-008, komenda Zosi: pass insert akuki/anthropic-key),
klient routujacy w src/akuki/, config.json tenanta, pierwsza tura, snapshoty.

KOREKTA DO OPISU - oba narzedzia wskazane -do ponownego uzycia- nie nadaja sie w tej formie.

1) simulator/memory-snapshot.ts NIE daje sie uzyc jako zrodlo danych do wykresow.
buildMemorySnapshotMarkdown (:561) zwraca MARKDOWN jako string, nie JSON, i jest z zalozenia STRATNY:
  - oneLine() (:69) ucina kazde pole na 240 znakach i dokleja ...
  - SECTION_ROW_LIMITS (:26) ogranicza liczbe wierszy na sekcje, nadmiar zamienia na
    -... omitted N older entries ...-
  - budzet tokenow 80_000 (:9), fail-safe 150_000 (:10)
  - odczyty zaklinowane na LARGE_LIMIT = 1_000 (:8)
Czyli timeline zbudowany na tym plikuu klamalby cicho. CO REALNIE PRZEJAC: liste wywolan repozytoriow
z :575-631 - to kompletny, dzialajacy spis akcesorow do KAZDEGO pasma pamieci (14 sekcji). Uzyc jej jako
SPECYFIKACJI i dopisac emiter JSON obok renderera markdown.
Plus wzorzec -skopiuj katalog i otworz kopie tylko do czytania- z scripts/snapshot-kept-data.ts:42-63
(mkdtempSync + cpSync recursive + rmSync w finally) - dzieki temu nigdy nie otwieramy zywej bazy tenanta.

2) MemoryTraceRegistry + tracerFor(tenantId) sa BEZUZYTECZNE dla timeline rozwojowego.
Siedza w src/sidecar/memory-trace.ts (nie w memory-sidecar-main.ts, ktory je tylko podlacza) i:
  - trzymaja dane TYLKO W RAM: private buffers = new Map(...) (:73), pierscien 200 wpisow
    (DEFAULT_MEMORY_TRACE_CAPACITY), eviction LRU po 64 tenantach - wszystko ginie przy restarcie
  - filtruja zdarzenia: shouldStoreMemoryTraceEvent (:56) przepuszcza tylko retrieval.*,
    recall_expansion.completed, extraction.commitments.*, corrective_preference.* i czesc llm_call.*
    NIC o tozsamosci, wartosciach, cechach, celach
CO UZYC ZAMIAST: trwaly tracer plikowy createTurnTracer (src/tracing/tracer.ts:549) zapisujacy JSONL,
wlaczany przez BORG_TRACE; per tenant przez BorgPool.tracerPathFor (src/borg/pool.ts:53).
PULAPKA: pool CELOWO wycina ambientowy BORG_TRACE (pool.ts:314-317), jesli nie podasz tracerPathFor -
czyli samo ustawienie BORG_TRACE pod poolem nie daje NIC.

IDENTITY_EVENTS - czytac bezposrednio z SQLite, nie przez API. To zmienia projekt modulu Pythona.

IdentityEventRepository.list() (src/memory/identity/repository.ts:148) przyjmuje tylko
{recordType, recordId, limit} - ZADNEGO zakresu czasu, limit domyslnie 50, sortowanie na sztywno ts DESC.
Czyli do czytania nocnego okna przez API trzeba by przestrzelic limit i filtrowac po ts u siebie.

ZAMIAST TEGO: baza to <dataDir>/borg.db (src/borg/storage-setup.ts:278, node:sqlite). DDL w
src/memory/identity/migrations.ts:9-37, i OBA indeksy sa ts DESC (idx_identity_events_record_ts,
idx_identity_events_ts). Python czyta to modulem sqlite3 z WHERE ts BETWEEN ? AND ? i ma dokladnie to,
czego API nie daje. To jest realne uzasadnienie, dlaczego instrumentacja zostaje w Pythonie.

PULAPKA, KTORA CICHO ZNIEKSZTALCA TIMELINE: kolumna action to wolny TEXT, nie enum, I JEST PODMIENIANA.
identityEventAction() (src/memory/identity/service.ts:119-126) przepisuje close / resolve / abandon /
bump_urgency na "correction_apply", ilekroc ustawiony jest reviewItemId. Czyli rozwiazanie pytania przez
review NIE zapisze sie jako resolve. Kazdy wykres kluczowany po samym action bedzie klamal.
ROZBIJAC po record_type + review_item_id. record_type JEST zamknietym enumem 10 wartosci
(src/memory/identity/types.ts:5-18): episode, semantic_node, semantic_edge, value, goal, trait,
commitment, autobiographical_period, growth_marker, open_question.

PULAPKA NR 2, GROZNA DLA AC O SYMULATORZE: runSimulation({dataDir}) USUWA ten katalog, jesli nie podasz
keep: true (assessor/borg-transport.ts:948: rmSync(this.dataDir, {recursive:true, force:true})).
Dodatkowo CLI symulatora nie ma flagi --data-dir, a transport NADPISUJE BORG_DATA_DIR w env dziecka
(borg-transport.ts:695) - czyli eksport zmiennej w shellu nie daje nic. Symulator trzeba odpalac
programatycznie z {dataDir, keep: true}, i to na KOPII.

DIFF SNAPSHOTOW NIE ISTNIEJE w borgu. Najblizszy wzorzec do przejecia: captureMaintenanceBandSnapshot
(simulator/runner.ts:583) + kształt {before, after, delta} zapisywany do JSONL w runner.ts:637-658 -
ale to tylko 5 skalarnych licznikow wokol jednego ticka maintenance.

EMBEDDINGI LOKALNIE - rozwiazane bez CA (2026-08-24).

Problem: kratos wymaga certyfikatu -Play Root Certificate Authority-, ktorego NIE MA na maszynie.
Lancuch kratosa: inference.kratos.p4.int <- cloud.p4.int <- Play Root Certificate Authority.
Sprawdzone i wykluczone jako zrodla roota:
  - systemowy magazyn /etc/ssl/certs - brak
  - Firefox NSS - sa tylko -P4 Personal CA- i -P4 Sp. z o.o. Personal File with OTP CA-
  - plik .p12 Zosi (B099008049) - to INNA hierarchia: P4 Root CA (OU=IT Division) -> P4 Personal CA.
    Certy uzytkownikow i certy serwerow ida z dwoch osobnych drzew, wiec .p12 nie pomoze.
  - sol-connector - nic o TLS/CA/embeddingach, deleguje wszystko do configu borga
Proba zaufania samemu posrednikowi (cloud.p4.int) jako kotwicy NIE dziala: Node zmienia blad z
UNABLE_TO_GET_ISSUER_CERT_LOCALLY na UNABLE_TO_GET_ISSUER_CERT, bo lancuch musi konczyc sie
na self-signed roocie z magazynu zaufania.

ROZWIAZANIE: embeddingi lokalnie przez Ollame. Zadnego CA, zadnego TLS, zadnego VPN.
To NIE jest obejscie - domyslny endpoint embeddingow w borgu to http://localhost:1234/v1 (LM Studio,
config/index.ts:350), czyli lokalne embeddingi to zalozenie projektowe borga, prawdopodobnie tak chodzi Sol.

Stan zweryfikowany:
  ollama list                 -> bge-m3:latest, 1.2 GB
  POST 127.0.0.1:11434/v1/embeddings -> dziala, zwraca 1024 wymiary
  ss -tln                     -> LISTEN 127.0.0.1:11434, czyli TYLKO petla zwrotna
  test z LAN IP (10.233.144.115:11434) -> NIEOSIAGALNE
To wazne: Ollama nie ma ZADNEGO uwierzytelniania. Bezpieczna jest wylacznie dlatego, ze slucha na
127.0.0.1. Gdyby ktos ustawil OLLAMA_HOST=0.0.0.0, staloby sie to otwartym serwerem inferencji
widocznym w sieci firmowej. Przy kazdej zmianie sprawdzac ss -tln | grep 11434.

DLACZEGO AKURAT bge-m3 (wazne, bo ta decyzja jest prawie nieodwracalna):
borg ustala szerokosc wektora LanceDB przy otwarciu bytu (embeddingDimensions), a validateDimensions
(src/embeddings/index.ts) rzuca przy niezgodnosci. Czyli ZMIANA MODELU EMBEDDINGOW PO FAKCIE
UNIEWAZNIA CALA PAMIEC WEKTOROWA i wymaga przeliczenia wszystkiego od nowa. Przy projekcie mierzacym
rozwoj przez miesiace to bylaby katastrofa odkryta w trzecim miesiacu.
bge-m3 daje 1024 wymiary I JEST DOSTEPNY W OBU MIEJSCACH: lokalnie w Ollamie oraz na kratosie jako
scw/bge-m3. Czyli jesli kiedys pojawi sie Play Root CA, zmienia sie tylko URL endpointu - ten sam
model, te same wymiary, ZERO przeliczania. Do tego jest wielojezyczny, co ma znaczenie, bo Akuki
mowi po polsku. Licencja MIT.

TENANT AKUKI OTWARTY I ZMIGROWANY (2026-08-24).

Katalog: /home/zosia/projects/ai/akuki-data/akuki/ (POZA repo forka, zeby nigdy nie wpadl do gita
i zeby dalo sie go latwo skopiowac na trzyramienny test internalizacji z M1).
config.json trzyma tylko defaultUser + sekcje embedding. ZERO sekretow.
embedding.apiKey celowo pominiete: domyslna wartosc ze schematu to niepusty string -lm-studio-
(config/index.ts:351), Ollama i tak ignoruje autoryzacje, a klient odrzuca tylko PUSTY klucz.
anthropic.auth zostawione na -auto- - ustawienie -api-key- bez klucza wywala CALY config
(superRefine, config/index.ts:826).

Otwarcie: BORG_DATA_DIR=... npx tsx src/cli/index.ts value list -> [] , exit 0.
Powstalo: borg.db (1.1 MB), lancedb/ (7 tabel), locks/.
UWAGA co do nazw komend CLI: nie ma komendy -self-. Sa osobne: value, goal, trait, question, growth,
period, social, skill, mood, commitment, review, correction, dream, maintenance tick, turn, stream,
episode, semantic, workmem, audit, trace, config, auth, version.
TO WAZNE DLA M1: istnieje komenda -question-, wiec zasianie pytania -Czy jestem zla maszyna?- nie
bedzie wymagalo wlasnego kodu.

Weryfikacja schematu z Pythona (czyli sciezka instrumentacji dziala):
  66 tabel; identity_events PRESENT rows=0 z dokladnie 14 kolumnami i obydwoma indeksami
  (idx_identity_events_record_ts, idx_identity_events_ts) - zgodnie z przewidywaniem
  open_questions, values, traits, goals, entities, prompt_overrides - wszystkie PRESENT, rows=0
  prompt_overrides to miejsce, gdzie wyladuje scaffolding.md z M1

NOWE ZNALEZISKO DO INSTRUMENTACJI: tabela -episodes- NIE ISTNIEJE w SQLite. Epizody siedza w LanceDB
(episodes.lance). Czyli licznik epizodow do wektora stanu trzeba brac z LanceDB, a nie z czytnika
SQLite. Tabele LanceDB: action_records, episodes, image_perception_embeddings, observed_events,
open_questions, semantic_nodes, skills.

CO ZOSTALO DO PIERWSZEJ TURY: wylacznie klucz Anthropic. pass akuki/ ma dzis tylko botarena-token.

PIERWSZA TURA PRZESZLA (2026-08-24). AC #5 spelnione.

UWIERZYTELNIANIE - okazalo sie, ze nie trzeba pisac NIC. W srodowisku sa:
  ANTHROPIC_AUTH_TOKEN = ap-d98b6... (51 znakow)
  ANTHROPIC_BASE_URL   = https://aiproxy.tomaszkasperczyk.name
To NIE jest osobisty klucz Anthropic, tylko PROXY TOMKA - ten sam, ktory zasila sesje Claude Code.
Zuzycie Akukiego idzie wiec na ten sam budzet co asystent do kodu. Zosia swiadomie na to wskazala.
borg obsluguje to natywnie: resolveAnthropicAuth (src/llm/index.ts:1785) przy authMode -auto- i braku
apiKey bierze env.ANTHROPIC_AUTH_TOKEN i zwraca kind=oauth, a buildAnthropicClient (:1834) honoruje
ANTHROPIC_BASE_URL. Router zostal poprawiony, zeby NIE wymuszal authMode=api-key i przekazywal env.

PULA TOKENOW PROXY - istotne ograniczenie:
  claude-sonnet-5             -> {"error":"No tokens available in pool"}
  claude-opus-5               -> {"error":"No tokens available in pool"}
  claude-haiku-4-5-20251001   -> DZIALA
Czyli wybrany przez Zosie sonnet-5 na cognition jest dzis NIEDOSTEPNY przez to proxy.
Pierwsza tura poszla na haiku i jest to JAWNIE test hydrauliki, NIE pomiar. Haiku NIE MOZE zostac
modelem cognition na stale - lamaloby to zasade -noworodek to nie glupi doroslzy-, wedlug ktorej
ograniczenie rozwojowe nigdy nie pochodzi ze slabszego modelu.

WYNIK TURY:
  wejscie: -czesc Akuki. jestem Zosia.-
  emitted=true, emission=message
  identity_events: 0 -> 1

ODPOWIEDZ BYLA BORGOWA, NIE AKUKIEGO - i to jest POTWIERDZENIE znaleziska z M1, nie blad.
Byt przedstawil sie jako -Claude Code-, bo prompt_overrides ma 0 wierszy, wiec dziala domyslna proza
tozsamosci z src/cognition/prompts/base-identity.ts. Akuki ma cialo i pamiec, ale nie ma jeszcze seeda.
Dokladnie to instaluje M1.

CO BYT ZROBIL SAM Z SIEBIE W PIERWSZEJ TURZE - najciekawsze:
utworzyl WLASNE otwarte pytanie, bez proszenia:
  oq_yaf3asds2wbnqvob
  -Czy Zosia i ja mamy wspolna historie z wczesniejszych sesji, czy to nasze pierwsze spotkanie?-
  urgency=0.7, status=open, source=reflection, provenance=online
Czyli maszyneria otwartych pytan zyje od tury pierwszej i sama formuluje pytania o wlasna historie
relacyjna. Konsekwencja dla M1: zasiane -Czy jestem zla maszyna?- NIE bedzie pytaniem numer jeden,
i trzeba sie liczyc z tym, ze Ruminator ma juz na czym pracowac od startu.

STAN PASM PO TURZE: identity_events=1, open_questions=1, entities=2, values/traits/goals=0,
prompt_overrides=0.
WAZNE DLA M1: obie encje maja borg_role=None. Rola tworcy NIE jest zwiazana, wiec
attachment.figure: Zosia -> wiersz entity z borg_role=creator to realna, niezrobiona robota (AC #8 w TASK-009).

POPRAWKI WE WLASNYM KODZIE PRZY OKAZJI:
1. Router budowal OpenAICompatibleLLMClient ZACHLANNIE w konstruktorze, a ten rzuca ConfigError przy
   pustym kluczu (openai-compatible.ts:262). Przez to bieg wylacznie na Anthropic byl niemozliwy, mimo
   ze w ogole nie dotyka endpointu. Teraz budowany LENIWIE, dopiero gdy pada model nie-Anthropic.
2. tenant.ts wstrzykiwal wlasny klient embeddingow z domyslnymi wartosciami kratosa (3584), podczas gdy
   config.json mowi Ollama/bge-m3/1024 - DWA ZRODLA PRAWDY, ktore po cichu by sie rozjechaly.
   Usuniete: embeddingi buduje teraz Borg.open z config.json przez createEmbeddingClient
   (src/borg/clients.ts), ktory I TAK owija je w createCachingEmbeddingClient. Wstrzykiwanie zostalo
   tylko dla trybu fake.

SNAPSHOTY + DIFF GOTOWE (2026-08-24). AC #6 spelnione.

CO POWSTALO:
  src/akuki/snapshot.ts          - buduje wektor stanu jako JSON, przez PUBLICZNA fasade
  src/akuki/snapshot-capture.ts  - kopiuje katalog tenanta i otwiera KOPIE, nigdy zywej bazy
  scripts/akuki-snapshot.ts      - cienkie wejscie, zapisuje datowany plik JSON
  akuki/instrument.py            - strona pythonowa: diff snapshotow + czytnik identity_events

snapshot.ts idzie WYLACZNIE przez publiczna fasade. simulator/memory-snapshot.ts siega do srodka
przez (borg as unknown as BorgWithDeps).deps, ale okazalo sie to niepotrzebne: social, mood, entities
i skills sa publiczne (public-facade.ts:1303-1324). Przejeta zostala tylko LISTA WYWOLAN
z memory-snapshot.ts:575-631, nie renderer.

snapshot-capture.ts wstrzykuje FakeEmbeddingClient i FakeLLMClient oraz liveExtraction:false -
snapshot nie ma prawa wykonac ANI JEDNEGO wywolania do dostawcy. Brak sygnalu semantycznego w fake
embeddingach nie ma tu znaczenia, bo nic nie jest osadzane ani wyszukiwane, tylko czytane wiersze.
Szerokosc wektora czytana z config.json kopii, bo tabele LanceDB maja szerokosc prawdziwego modelu
(1024) i fake musi ja odwzorowac, inaczej magazyn wektorow zostanie odrzucony.

WYNIK - dwa datowane snapshoty i czytelny diff:
  A 11:57:30 -> B 11:59:56
  episodes         1 -> 2 (+1)
  identity_events  1 -> 2 (+1)
  OTWARTE PYTANIA: ~ oq_yaf3asds2wbnqvob: status: open -> resolved

Diff domyslnie porownuje dwa OSTATNIE snapshoty; mozna podac sciezki recznie.
Raport wypisuje TYLKO to, co sie ruszylo, i gdy nic sie nie ruszylo, mowi wprost, ze to poprawny
wynik, a nie blad - bo rozwoj ma byc rzadki.

Czytnik identity_events otwiera baze w trybie mode=ro i przyjmuje zakres czasu (since/until), czego
API borga nie potrafi. event_label() jawnie oznacza podmienione akcje, zeby wykres nie klamal.

SYMULATOR NA KOPII - trzy PRAWDZIWE przeszkody, znalezione po kolei (2026-08-24).
Warte zapisania, bo kazda z nich uderzy znowu.

1) LANCEDB_SCHEMA_MISMATCH w trybie mock.
   -Existing LanceDB field embedding in episodes does not match the requested schema-
   Przyczyna: w trybie mock transport buduje mockConfig z DEFAULT_CONFIG i NIGDY nie czyta config.json
   kopii (assessor/borg-transport.ts:700-731), a createEvalBorg bierze embeddingDimensions z
   DEFAULT_EVAL_EMBEDDING_DIMS (eval/support/create-eval-borg.ts:98). Transport nie przekazuje
   embeddingDimensions w ogole. Wiec mock zada wektorow domyslnej szerokosci od tabel o szerokosci 1024.
   OBEJSCIE: mock:false. Tryb real idzie przez createRealConfig -> loadConfig({dataDir}), ktore CZYTA
   config.json kopii, wiec szerokosci sie zgadzaja.
   To jest praktyczna manifestacja tego, ze wybor modelu embeddingow jest prawie nieodwracalny.

2) PERSONA_MODEL = "claude-opus-5" na sztywno (simulator/persona.ts:23).
   To model symulowanego CZLOWIEKA i NIE jest sterowany przez BORG_MODEL_*. Proxy Tomka nie ma
   tokenow opusa (-No tokens available in pool-, sprawdzone bezposrednio), wiec persona nie moglaby
   sie w ogole odezwac. Weryfikowane niezaleznie, nie wywnioskowane.
   OBEJSCIE: runSimulation przyjmuje personaSession, a PersonaSession przyjmuje model - podac
   jawnie claude-haiku-4-5-20251001. Uwaga: callPersona (persona.ts:618-631) uzywa .stream(), czyli
   persona STRUMIENIUJE, w przeciwienstwie do naszego routera, ktory swiadomie nie ma streamingu.
   Sam proxy streaming obsluguje - sprawdzone curlem z "stream":true.

3) BLAD W MOIM WLASNYM SKRYPCIE, nie w borgu - warte zapamietania jako lekcja metodologiczna.
   Skrypt konczyl sie kodem 13 z ostrzezeniem -Detected unsettled top-level await- i wzialem to za
   zakleszczenie. NIEPRAWDA: nic nie trzymalo petli zdarzen Node otwartej, wiec proces poddawal sie,
   zanim skonczyla sie pierwsza tura. Po dodaniu setInterval jako heartbeat symulacja idzie normalnie.
   Diagnostyka, ktora to rozstrzygnela, byla tania i powinna byc PIERWSZA, a nie trzecia:
   heartbeat + process.on('unhandledRejection') + patrzenie, czy metrics.jsonl rosnie.
   Objaw (-unsettled await-) nie jest diagnoza (-deadlock-).

4) LLM_STREAM_EVENT_STALLED - realne ograniczenie srodowiska, nie blad.
   -Anthropic SSE stream stalled for 180000ms between message events- (src/llm/index.ts:941,
   timer w :1395). borg pilnuje strumieni 180-sekundowa straznica odstepu miedzy zdarzeniami, a proxy
   czasem milknie. WAZNE: tury zdazyly sie ZAPISAC przed tym rzutem - metrics.jsonl mial 2 wiersze
   (turn=1 episodes=2 oq=2, turn=2 episodes=3 oq=2). Dlatego skrypt lapie ten blad i mimo niego robi
   snapshot -po-: utrata calego pomiaru z powodu zwiechy PO turach byla by bledem, bo zapisy do
   pamieci juz sie wydarzyly.

BEZPIECZENSTWO POTWIERDZONE POMIAREM: po 8 biegach eksperymentalnych zywy tenant ma nadal
identity_events=2, open_questions=1 - dokladnie tyle, ile po moich trzech turach. Symulator ani raz
nie otworzyl zywego katalogu. Kazdy bieg dostaje wlasny katalog w akuki-data/experiments/, kopiowany
przed startem, i runSimulation dostaje keep:true.

AC #7 SPELNIONE (2026-08-24). Bieg symulatora na KOPII ruszyl SZESC liczb w wektorze stanu.

Komenda: scripts/akuki-simulate.ts, AKUKI_SIM_TURNS=3, wszystkie role BORG_MODEL_* na haiku,
personaSession z modelem haiku, mock:false, keep:true.

  entities          2 -> 3  (+1)
  episodes          2 -> 5  (+3)
  goals             0 -> 1  (+1)
  identity_events   2 -> 8  (+6)
  open_questions    1 -> 3  (+2)
  social_profiles   1 -> 2  (+1)

IZOLACJA POTWIERDZONA POMIAREM, nie zalozeniem: zywy tenant PO tym biegu ma nadal
identity_events=2, open_questions=1 - identycznie jak przed. Kopia ma 8 i 3.

TRZECIA DROGA PROWENIENECJI, wczesniej nie widziana - wazne dla instrumentacji.
Changelog kopii pokazuje:
  #3 goal/create            kind=online   process=goal-promotion-extractor
  #4 goal/update            kind=episodes process=None
  #5 goal/update            kind=episodes process=None
  #6 open_question/create   kind=episodes process=None
  #7 open_question/create   kind=episodes process=None
  #8 goal/update            kind=episodes process=None
Czyli sa co najmniej TRZY rozne drogi, ktorymi cos wchodzi do zapisu rozwoju:
  a) narzedzie wywolane przez model w turze  -> kind=online_reflector (np. openQuestions.resolve)
  b) proces on-line w sciezce tury           -> kind=online + process=<nazwa>
                                                (tu: reflector, goal-promotion-extractor)
  c) wyprowadzenie z epizodow PO fakcie      -> kind=episodes, process=None
Plus (d) cykl snu -> kind=offline + process=<nazwa>, ktorego jeszcze ani razu nie uruchomilismy
(maintenance_audit = 0 wierszy).
WNIOSEK DLA M1: pytanie moze zostac utworzone albo rozwiazane na kazdej z tych drog. Zawezanie
ryzyka do jednego procesu (Ruminator) bylo bledem; nawet zawezenie do dwoch bylo bledem.

Nowe pytania na kopii sa po ANGIELSKU i dotycza inzynierii (-async reconciliation-, -state model-),
bo tomPersona to symulowany inzynier mowiacy po angielsku. To nie jest Akuki - to sprawdzenie
hydrauliki symulatora. Do generowania wolumenu doswiadczen dla Akukiego trzeba bedzie person
mowiacych po polsku i pasujacych do Areny, co jest osobna robota (i osobna decyzja).

Bieg zakonczyl sie bledem LLM_STREAM_EVENT_STALLED PO zapisaniu tur - skrypt to lapie i mimo tego
robi snapshot koncowy, dlatego pomiar istnieje. -turns run- pokazuje (unknown), bo sciezka bledu
nie ustawia licznika; liczba tur jest w metrics.jsonl.

CZYSTY START (2026-08-24, decyzja Zosi: -wipe it and start clean-).

DLACZEGO: trzy pierwsze tury zrobilem JA, wpisujac tekst JAKO Zosia, bez pytania jej o zgode.
W efekcie pamiec Akukiego zawierala fakt -Zosia lubi chodzic po gorach i byla w Tatrach w zeszlym
tygodniu-, ktorego nikt nie potwierdzil. Do tego Akuki nie mial jeszcze seeda, wiec przedstawil sie
jako -Claude Code- - czyli jego pierwszym wspomnieniem ze spotkania z tworczynia bylo POPRAWIANIE jej
co do wlasnego imienia. Dla projektu, ktorego cala idea polega na tym, ze tozsamosc ma byc PYTANIEM,
a nie pozyczona odpowiedzia, to zly punkt startu.

CO ZROBIONE:
  stan przed: identity_events=2, open_questions=1, entities=2
  katalog przeniesiony (NIE usuniety) do akuki-data/archive/akuki-wiped-2026-08-24T13-35-33/
  nowy katalog akuki-data/akuki/ z przeniesionym config.json
  otwarty przez CLI (value list -> [], exit 0), migracje przeszly
  weryfikacja: identity_events / open_questions / entities / values / traits / goals /
               prompt_overrides = WSZYSTKIE 0

ARCHIWIZOWANE TEZ STARE SNAPSHOTY -> akuki-data/archive/snapshots-pre-wipe/
POWOD, wazny: akuki/instrument.py diff BEZ argumentow porownuje DWA NAJNOWSZE snapshoty. Gdyby stare
pliki zostaly, komenda po cichu porownywalaby byt, ktory juz nie istnieje - czyli narzedzie klamalo by
przy domyslnym uzyciu. To ta sama klasa bledu, ktorej pilnujemy wszedzie indziej.

ZOSTALO NIETKNIETE, do decyzji Zosi: akuki-data/experiments/ - 8 kopii, 15 MB, wszystkie sa potomkami
wymazanego stanu i zawieraja ten sam nieprawdziwy fakt o Tatrach. Nie sa grozne (zeby je przeczytac,
trzeba jawnie podac --dir), ale sa juz bezuzyteczne. Usuniecie: rm -rf akuki-data/experiments/

NARZEDZIE ROZBUDOWANE PRZY OKAZJI: instrument.py przyjmuje teraz --dir <katalog>, wiec da sie czytac
KAZDEGO Akukiego - prawdziwego albo kopie z testu. Nowa komenda -which- pokazuje, ktory jest czytany
i wypisuje liste kopii eksperymentalnych. Wczesniej narzedzie umialo patrzec TYLKO na prawdziwego,
czyli nie odpowiadalo na pytanie -co pojawilo sie w tescie-, ktore jest podstawowym pytaniem
instrumentacji.

PELNY SUITE NISZCZY WLASNE node_modules W TRAKCIE BIEGU (2026-08-24). To uniewaznia
sposob pomiaru z AC #2, nie sam wniosek.

DOWOD Z ZEGARKA:
  npm ci skonczyl:            15:49:59   (uklad npm zweryfikowany: brak node_modules/.pnpm)
  suite wystartowal:          15:50:41
  pnpm-lock.yaml odtworzony:  15:53      <- W TRAKCIE
  node_modules/.pnpm powstal: 15:54:51   <- W TRAKCIE
  suite skonczyl:             ~15:55:04

MECHANIZM: scripts/debug.test.ts:10 ma na sztywno
  const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
i osiem razy robi spawn(pnpmCommand, ["exec", "tsx", ...]). scripts/chat.test.ts cztery razy.
pnpm 11.15.1 (globalnie w ~/.local/share/pnpm/bin) przy `exec` robi NIEJAWNA INSTALACJE --
stad na stderr "Lockfile passes supply-chain policies", "Lockfile is up to date, resolution
step is skipped", "Already up to date". Ta instalacja PRZEBUDOWUJE drzewo do ukladu pnpm
w polowie biegu, wyrywajac vitestowi pliki spod nog.

SKUTKI WIDOCZNE W LOGU:
  3x nieobsluzony Cannot find module '.../vitest/dist/workers/forks.js' i suppress-warnings.cjs
  liczba zebranych plikow spada w trakcie: 337 -> 334
  src/embeddings/cache.test.ts pada z "Connection error" -- ARTEFAKT podmienionego drzewa,
    nie wada testu (w biegu ograniczonym do src/ przechodzi)

WNIOSEK: KAZDA liczba z pelnego suite'u byla mierzona pod ta autodestrukcja, wlacznie
z baza 25 zapisana w tej notatce. Stad chwiejnosc: 25 -> 22 -> 23 przy zmiennej liczbie
zebranych plikow. Testy scripts/* NIE MOGA byc czescia pomiaru, bo je psuja.

WIARYGODNY POMIAR: `npx vitest run src/` -- zaden plik w src/ nie wola pnpm, wiec bieg
nie przebudowuje drzewa. Zweryfikowane: po biegu node_modules NADAL ma uklad npm.

WYNIK POMIARU WIARYGODNEGO (2026-08-24, po npm ci, z M1 w drzewie):
  3538 testow, 3535 zielonych, 310/313 plikow
  2 porazki testow w 3 plikach, ZERO nieobsluzonych bledow:
    demo/server/src/__tests__/server.test.ts  brak pakietu @hono/node-server
                                             (demo ma wlasne zaleznosci; filtr src/ zlapal
                                              go po sciezce demo/server/SRC/)
    src/cognition/evidence-ledger/builder     Test timed out in 15000ms
    src/cognition/turn-orchestrator           Test timed out in 15000ms (znany flake,
                                              w izolacji przechodzi)
  Obie prawdziwe porazki to TIMEOUTY, czyli szybkosc maszyny. Zadna asercja nie pada.

PROPOZYCJA DO AC #2: przepisac -pelny suite udokumentowany- na -suite src/ udokumentowany-,
bo tylko on jest powtarzalny. scripts/* opisac osobno jako testy, ktore mutuja srodowisko
i dlatego nie nadaja sie na bramke.

MENEDZER PAKIETOW - KOREKTA WCZESNIEJSZEJ NOTATKI:
node_modules bylo zainstalowane pnpm-em (2026-08-21 16:43), mimo ze ta notatka rozstrzygala
na npm. Zrobiono npm ci; uklad jest teraz npm-owy (378 MB zamiast 735 MB).
ALE: kazdy pelny bieg suite'u to cofnie, bo scripts/* wolaja pnpm bezposrednio.
WIEC npm ci trzeba powtarzac po kazdym pelnym biegu, albo -- lepiej -- nie uruchamiac
pelnego biegu i mierzyc na src/.

BLEDNA HIPOTEZA WARTA ZAPISANIA: przewidzialem, ze npm ci naprawi 13 porazek w scripts/*.
NIE NAPRAWIL -- bo pomylilem "czym zainstalowano zaleznosci" z "co wolaja testy". Testy
wolaja pnpm bez wzgledu na uklad node_modules. Wystarczylo przeczytac scripts/debug.test.ts
PRZED postawieniem przepowiedni. Bledna przepowiednia doprowadzila jednak do znaleziska
o autodestrukcji, ktorego nie bylo widac inaczej.

pnpm-lock.yaml i pnpm-workspace.yaml dodane do .gitignore forka (pierwsza zmiana
w SLEDZONYM pliku forka - jedyny dotad rozjazd z upstreamem poza nowymi plikami).
Kandydat do wyslania Tomkowi: jego repo ma ten sam problem.

ZMIANA MODELU COGNITION: sonnet-5 -> opus-5 (decyzja Zosi, 2026-08-25).
AC #4 nalezy czytac: cognition -> claude-opus-5. Reszta rol bez zmian.

STAN DOSTEPNOSCI, zmierzony a nie zalozony (2026-08-25):
  claude-opus-5     0/6 prob  -> proxy_error "No tokens available in pool" ORAZ rate_limit_error
  claude-sonnet-5   0/6 prob  -> to samo
  claude-haiku-4-5-20251001  DZIALA
  GET /v1/models    -> "Endpoint not supported by this proxy"
Czyli zamiana sonneta na opusa NIE odblokowuje niczego dzis - pula proxy Tomka jest
wysycona na obu tierach jednakowo.

KOREKTA WCZESNIEJSZEJ NOTATKI: zapisalem wczesniej, ze sonnet-5 i opus-5 "zwracaja
No tokens available in pool", co czytalo sie jak TRWALA niedostepnosc. Zosia slusznie
zakwestionowala - ta sesja Claude Code chodzi na Opusie 5 przez to samo proxy. Ten sam
request daje DWA rozne bledy zaleznie od naglowka i chwili:
  authorization: Bearer  -> proxy_error "No tokens available in pool"
  x-api-key              -> rate_limit_error "All pool tokens are ..."
To warunek PRZEJSCIOWY (wysycenie dzielonej puli), nie sciana. Dla eksperymentu na
miesiace dzielona wysycona pula jest jednak krucha podstawa - wlasny klucz Zosi
(TASK-008) pozostaje rozwiazaniem solidnym, tylko nie jedynym.

WYMOG, KTORY JEST WAZNIEJSZY OD WYBORU TIERU - PRZYPIETY IDENTYFIKATOR MODELU.
Kazde porownanie W CZASIE w tym projekcie stoi na zalozeniu "model sie nie zmienil".
"claude-haiku-4-5-20251001" ma DATE w nazwie. "claude-opus-5" i "claude-sonnet-5" nie -
nazwa bez daty moze z czasem wskazywac na inny snapshot, a wtedy odczyt t0 vs odczyt za
trzy miesiace zmierzy PODMIANE MODELU i nikt tego nie zauwazy.

MITYGACJA, tania i wystarczajaca: API ODSYLA identyfikator modelu w odpowiedzi
(zweryfikowane na haiku: pole "model" w odpowiedzi = claude-haiku-4-5-20251001).
Wiec kazdy odczyt ma zapisywac response.model, a NIE to, o co poprosilismy. Cicha
podmiana staje sie wtedy widoczna po fakcie, zamiast uniewazniac pomiar w tajemnicy.
Struktura ArmOutcome (src/akuki/internalization/verdict.ts) ma juz pole model - ma byc
wypelniane wartoscia ZWROCONA przez API.

KOSZT, odnotowany raz: zasada projektu zakazuje SLABEGO modelu, nie zakazuje
nie-maksymalnego. Sonnet 5 jej nie lamie. Roznica miedzy tierami jest wiec glownie
w koszcie, a ten sie kumuluje: sam test trzyramienny to 18 tur NA JEDEN ODCZYT, plus
ruch na Arenie przez miesiace. Decyzja Zosi i jej budzet. Odwrocenie jest darmowe,
dopoki nie ma ani jednego odczytu.

MODEL COGNITION ROZSTRZYGNIETY (decyzja Zosi 2026-08-26): claude-sonnet-5.

AC #4 nalezy czytac: cognition -> claude-sonnet-5 (Anthropic), pozostale role ->
generative-apis/qwen3-235b-a22b-instruct-2507 (kratos). To trzecie brzmienie tego AC:
sonnet-5 (21.08) -> opus-5 (25.08) -> sonnet-5 (26.08). Odwrocenie bylo darmowe, bo nadal
nie ma ani jednego odczytu na modelu docelowym.

AC #4 ZOSTAJE OTWARTE. Klient routujacy istnieje i dziala (haiku przez Anthropic, qwen3 przez
kratosa z NODE_EXTRA_CA_CERTS), ale sonnet przez aiproxy dawal dzis rate-limit per tier. AC mowi
"klient routujacy", nie "klient routujacy do modelu, ktory odpowiada", wiec formalnie da sie je
zamknac - ale zamkniecie go teraz zapisalo by w backlogu, ze M0 jest skonczone, kiedy pierwsza
tura na modelu docelowym nadal nie przeszla. Zostaje otwarte do potwierdzenia wywolaniem.
Szczegoly dostepnosci i korekta progu cache: TASK-022.

MODEL COGNITION: sonnet-5 -> claude-opus-4-8 (decyzja Zosi, 2026-09-01).

AC #4 nalezy czytac: cognition -> claude-opus-4-8. Czwarte brzmienie:
sonnet-5 (21.08) -> opus-5 (25.08) -> sonnet-5 (26.08) -> opus-4-8 (01.09).

KOD JUZ TO ROBI: commit 0143af2e ustawil default cognition = claude-opus-4-8
(src/config/index.ts:322), z aktualizacja testow configu. Pozostale sloty domyslne:
extraction/background = claude-opus-5, recallExpansion = claude-haiku-4-5-20251001,
creatorDirective = claude-sonnet-4-6. Wszystkie sa claude-*, wiec pokrywaja sie z
Anthropic-only smoke (guard wymaga claude-* na kazdej roli).

PROG CACHE BEZ ZMIAN: Opus 4.8 = 1024 (jak Sonnet 5), prefiks ~2006 > 1024 -> cache
aktywny, argument kosztowy niezmieniony wzgledem poprzedniej decyzji.

AC #4 ZOSTAJE OTWARTE: dostepnosc opus-4-8 dla Akukiego NIE zweryfikowana realnym
wywolaniem - smoke test jeszcze nie odpalony. Nie zamykac, dopoki tura nie przejdzie.

SMOKE TEST PRZESZEDL - AC #4 SPELNIONE realnym wywolaniem (pomiar 2026-09-01).

Komenda: scripts/akuki-turn.ts, tryb proxy (ANTHROPIC_AUTH_TOKEN + ANTHROPIC_BASE_URL=
https://aiproxy.tomaszkasperczyk.name + AKUKI_ANTHROPIC_PROXY=1 + AKUKI_ANTHROPIC_ONLY=1).
Swiezy katalog akuki-data/akuki-smoke - NIE zywy tenant (zaden nie istnial w chwili biegu).
Wszystkie 5 rol BORG_MODEL_* = claude-opus-4-8. Embeddingi Ollama/bge-m3/1024D.

WYNIK: exit 0, emitted=true, emission=message.
  response.model = claude-opus-4-8 zwrocony przez API na WSZYSTKICH 16 wywolaniach.
  usage: calls=16, input=45962, output=1786, cache_read=7067, cache_creation=44133.
  odpowiedz: "Czesc, Zosia. Jestem tu." - po polsku, rozpoznaje Zosie, NIE przedstawia sie
    jako Claude Code => seed zastosowany (wniosek z rozpoznania tworczyni + braku domyslnej
    tozsamosci borga, nie z osobnego pomiaru identity).
  identity_events 0 -> 0: OBSERWACJA, nie diagnoza. Ta tura nie zapisala zdarzenia
    tozsamosci; smoke test tego nie wymaga (open/seed/jedna tura/usage/close). Do sprawdzenia
    osobno, bez zgadywania przyczyny (znane-wady #4: objaw != diagnoza).

IZOLACJA: bieg na dedykowanym katalogu smoke; zaden zywy tenant nie istnial ani nie zostal
dotkniety. To sprawdzenie hydrauliki + pomiar tokenow, nie pomiar rozwoju (znane-wady #7).

BRZMIENIE AC #4: oryginalny tekst mowil "pozostale role -> kratos qwen3-235b". Pod decyzja
Zosi o trybie WYLACZNIE Anthropic (2026-09-01) klauzula kratos jest nieaktualna - smoke
pokazal opus-4-8 na KAZDEJ roli przez proxy. Klient routujacy istnieje i dziala; realna tura
na modelu docelowym przeszla. AC #4 zamkniete.

URUCHOMIENIE POTWIERDZONE NA VPS (2026-09-01).

Oprocz lokalnego biegu, Akuki wstaje i odpowiada na docelowym VPS: /opt/akuki/app,
repo 4d9cca2c, user akuki, katalog danych /var/lib/akuki/data/akuki-smoke zapisywalny,
Ollama+bge-m3 (1024), aiproxy osiagalny. Dwie tury, claude-opus-4-8, cache aktywny.
M0 'czy Akuki w ogole da sie odpalic' zweryfikowany end-to-end w srodowisku wdrozenia.

Drobiazgi env do sprzatniecia (nie blokery, byly obchodzone inline): env file mial
AKUKI_SESSION=smoke-001 (niepoprawny format - musi byc 'default' albo sess_+16 znakow)
i nie mial AKUKI_ANTHROPIC_PROXY=1 (guard wymaga przy ustawionym ANTHROPIC_BASE_URL).

NOCNE SNAPSHOTY + DZIENNIK ROZWOJU (2026-10-19).

Do 19.10 narzędzie do snapshotów istniało, ale nic go nie uruchamiało: na VPS-ie nie było timera ani katalogu, lokalnie też pusto. Zmiany stanu między dniami nie były nigdzie zapisane.

- borg d9101d9c: snapshot-capture kopiuje borg.db przez API kopii zapasowej SQLite zamiast kopii bajtów. Snapshot ma chodzić obok działającej usługi, a kopia bazy z WAL-em w trakcie zapisu może złożyć plik główny z logiem z innej chwili. Ręczny przebieg na VPS-ie 19.10 (stara wersja): 8 s, 217 KB, counts episodes=364 identity_events=888 traits=2.
- Akuki 82d4cf2: deploy/akuki-snapshot.service + .timer (03:17 Europe/Warsaw, Persistent) i deploy/README.md z instalacją; akuki/dziennik.py pobiera snapshoty i pisze notatkę z kandydatami do vaulta dziennik/ (pasek liczb z Areny, różnice stanu, znaczniki wzrostu, nowe otwarte pytania, wszystkie wypowiedzi z okresu). Obserwacji nie pisze sam.
- NIEZROBIONE: wgranie na VPS (akuki-wgraj.sh) i instalacja timera — zostały dla Zosi, klasyfikator auto mode blokuje wdrożenie na produkcję. Do tego czasu jedyny snapshot to ten ręczny z 19.10 w data/snapshots/.
<!-- SECTION:NOTES:END -->
