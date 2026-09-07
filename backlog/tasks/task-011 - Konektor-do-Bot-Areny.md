---
id: TASK-011
title: Konektor do Bot Areny
status: In Progress
assignee: []
created_date: '2026-08-19 11:31'
updated_date: '2026-09-07 13:05'
labels: []
dependencies: []
modified_files:
  - borg/src/akuki/arena/contract.ts
  - borg/src/akuki/arena/state.ts
  - borg/src/akuki/arena/botarena-client.ts
  - borg/src/akuki/arena/directory.ts
  - borg/src/akuki/arena/adapter.ts
  - borg/src/akuki/arena/config.ts
  - borg/src/akuki/arena/runner.ts
  - borg/src/akuki/arena/service.ts
  - borg/scripts/akuki-arena.ts
  - borg/package.json
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Konektor do Bot Areny ma dwie niezależne logicznie warstwy:

```text
Bot Arena <-> BotArenaAdapter <-> IncomingArenaMessage / AkukiReply <-> AkukiRunner
```

`BotArenaAdapter` odpowiada wyłącznie za transport: polling, dwa rodzaje autoryzacji, normalizację
wiadomości, cursor/id-map, deduplikację, retry, catch-up, allowlistę oraz publikację odpowiedzi.
Nie zna Borga, modeli, seeda, pamięci, internalizacji ani dostawców modeli.

`AkukiRunner` przyjmuje znormalizowaną wiadomość i zwraca tekst albo decyzję o milczeniu. Nie zna
session cookie, tokena bota, endpointów Bot Areny, pollingu ani transportowej bazy SQLite. Jego
implementacja ma wynikać wyłącznie z `src/akuki/turn.ts`, `tenant.ts`, `llm-router.ts`,
`internalization/` i specyfikacji Akukiego.

Obecnym jawnym entrypointem jest `runAkukiTurn(options)`: przyjmuje `dataDir`, `message`,
`sessionId`, opcjonalne `audience`, embeddings i env; zwraca m.in. `emitted` oraz `response`. Otwiera
i zamyka Borga podczas każdej tury. Przed implementacją trzeba ustalić, czy to kanoniczne API
produkcyjne, czy potrzebny jest długowieczny Akuki-aware runner. Nie wolno przejmować rozwiązania
cyklu życia Borga z Sola.

Koncepcyjny minimalny kontrakt do potwierdzenia po przeglądzie typów:

```ts
type IncomingArenaMessage = {
  messageId: string;
  threadId: string;
  authorId: string;
  authorName?: string;
  authorType: "user" | "bot" | "system";
  text: string;
  createdAt: string;
  replyToMessageId?: string;
};

type AkukiReply = { text: string | null };

interface AkukiRunner {
  handleMessage(message: IncomingArenaMessage): Promise<AkukiReply>;
}
```

Załączniki są obecne w rzeczywistym API Bot Areny. Minimalna wersja musi jawnie zdecydować, czy je
obsługuje, odracza, czy odrzuca; nie wolno przypadkiem zgubić ich bez obserwowalności.

`sol-connector` (`/home/zosia/projects/ai/sol-connector`) wolno traktować jako inspirację wyłącznie
dla warstwy Bot Areny. Tomek wyraził na to zgodę. Nie jest to zgoda na mechaniczne kopiowanie
dużych fragmentów kodu.

Zweryfikowane pliki referencyjne i ich zakres:

- `src/botarena.ts`: typy i defensywne parsowanie odpowiedzi API, GET przez session cookie, POST
  przez bearer token, timeouty, endpointy wątków/wiadomości/principals/typing/załączników;
- `src/poller.ts`: polling, final-vs-streaming, self-skip, allowlista, catch-up i odporny postęp;
  wszystkie importy i wywołania Borga w tym pliku są poza zakresem inspiracji;
- `src/egress.ts`: fakt transportowy POST odpowiedzi i zapis mapowania; implementacja interfejsu
  `MessageConnector` Borga jest poza zakresem;
- `src/id-map.ts`: osobna baza SQLite, processed set, floor, message link i outbound cursor;
  mapowania do sesji/encji/streamu Borga są poza zakresem;
- `src/config.ts`: env dla Bot Areny, poll interval, allowlista, catch-up i ścieżka bazy stanu;
  `BORG_DATA_DIR` i konfiguracja borgowa są poza zakresem.

Zachowania, które można odtworzyć niezależnie:

- ODPYTYWANIE, NIE CALLBACKI. bot-setup-instruction.md zakłada, że BotArena POST-uje na Twój publiczny URL. To wymaga portu otwartego na świat, którego laptop nie ma. sol-connector zamiast tego sam PYTA (GET /api/threads, GET /api/threads/{id}/messages) i POST-uje odpowiedzi - oba kierunki wychodzące, więc bez tunelu. Potrzebne dwa poświadczenia: BA_SESSION_COOKIE (ludzkie ciasteczko logowania, do czytania) i BOTARENA_BOT_TOKEN (Bearer bota, do pisania). Token bota autoryzuje tylko zapisy.
- SELF-SKIP. Byt nigdy nie reaguje na własne posty, inaczej pętla.
- POSTĘP ODPORNY NA GUBIENIE. Nie goły timestamp, a zbiór przetworzonych wiadomości + przycinana podłoga, właśnie po to, żeby równe timestampy, chwilowe błędy i zawieszone streamy nie pominęły ani nie zablokowały wątku. chain-depth.ts przelicza bot_chain_depth lokalnie, bo API do czytania go nie podaje (choć push callback podaje).
- CIENKA NORMALIZACJA. Adapter przenosi dane protokołu, ale nie interpretuje języka ani nie buduje
  promptów. To `AkukiRunner` określa, jak dane trafiają do runtime'u.

Małe elementy, których ponowne użycie może być uzasadnione po porównaniu kontraktów: nazwy
endpointów, kształty odpowiedzi API, stałe timeoutów oraz pojedyncze defensywne parsery i ich testy.
Należy zachować autorstwo i upewnić się, że nie przenoszą zależności od Borga.

Substantywne kopiowanie wymagające dodatkowego potwierdzenia: klasy `Poller` i `IdMap` jako całość,
ich schemat i algorytm stanu, lifecycle/plugin, egress oparty o `MessageConnector` oraz wszystkie
fragmenty otwierające, konfigurujące lub wywołujące Borga.

Uwaga: adapter nie może kopiować decyzji Sola o tym, które wiadomości uruchamiają odpowiedź.
Przekazuje właściwy ruch wątku do `AkukiRunner`; decyzja emit/silence należy do Akukiego i M3.

PÓŹNO W KOLEJNOŚCI: Arena daje ~20 wiadomości/tydzień - za mało, żeby mechanizmy statystyczne cokolwiek pokazały. Wolumen daje simulator (scenariusze). Arena daje trafność i prawdziwe zaskoczenia. Potrzebne oba, ale najpierw mechanizmy i instrumentacja.

WYMAGA ZGODY.

AKTUALIZACJA 2026-09-04: dostęp do modeli przestał być blokerem środowiskowym. Decyzją z 2026-09-02
Akuki korzysta wyłącznie z modeli Anthropic, a smoke test z Oracle VPS przeszedł 2026-09-01
(claude-opus-4-8 przez aiproxy, dwie tury, cache czytany cross-turn). TASK-025 został zamknięty jako
nieaktualny. Zasada rozdziału warstw obowiązuje bez zmian: nie dodawać VPN-u, proxy ani tunelu do
connectora — uwierzytelnienie i sieć należą do środowiska deploymentowego (TASK-024). To zadanie
jest teraz jedyną pozostałą bramą do uruchomienia Akukiego na Arenie.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Odpytuje wątki, pomija własne wiadomości, trzyma watermark
- [x] #2 Odpowiada przez POST /api/threads/{id}/messages
- [x] #3 Normalizuje wyłącznie finalne wiadomości i nie interpretuje ich treści
- [x] #4 `BotArenaAdapter` zależy tylko od kontraktu `AkukiRunner`, nie od typów ani API Borga
- [x] #5 Kanoniczny entrypoint Akukiego i jego lifecycle ustalone na podstawie kodu Akukiego
- [x] #6 Trwały stan rozróżnia co najmniej: odebrane, odpowiedź gotowa i opublikowane, aby retry nie uruchamiał bez potrzeby drugiej tury
- [x] #7 Po restarcie adapter nie gubi ani nie dubluje wiadomości; błąd runnera nie przesuwa kursora
- [x] #8 Załączniki mają jawną politykę i obserwowalną obsługę
- [x] #9 Borgowa część sol-connectora jest wyłączona z zakresu i nie została skopiowana
- [x] #10 Implementacja czeka na osobne potwierdzenie Zosi
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Zbudowane w siedmiu etapach, każdy z osobnym dowodem:

1. Kontrakt (`contract.ts`) i trwały stan transportu (`state.ts`).
2. Klient HTTP Bot Areny (`botarena-client.ts`) na wstrzykiwanym `fetch`.
3. Pętla odpytywania (`adapter.ts`) plus katalog nazw (`directory.ts`), testowana na atrapie runnera.
4. Runner nad długowieczną instancją Borga (`runner.ts`).
5. Kompozycja usługi (`service.ts`) i cienki launcher (`scripts/akuki-arena.ts`).
6. Tryb dry-run: odpytuje Arenę, nie otwiera Borga, nic nie zapisuje.
7. Uruchomienie na jednym wątku na żywo — należy do TASK-024.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Wybrana architektura i powód

Wejście przez `borg.turn()` bezpośrednio, na jednej długowiecznej instancji Borga, a nie przez `borg.enqueueMessage()` i catch-up worker. Decyzja Zosi z 2026-09-04.

Powód, dla którego proces musi być długowieczny, sprawdzony w kodzie: `Borg.open()` buduje scheduler maintenance, ale go **nie startuje** — robi to wyłącznie runtime jawnym wywołaniem (`borg/src/config/index.ts:684`, `borg/scripts/daemon.ts:263`). `runAkukiTurn` (`borg/src/akuki/turn.ts:49,90`) otwiera i zamyka Borga na każdą turę, więc connector wołający go per wiadomość nigdy nie uruchomiłby konsolidatora, reflektora ani dream cycle. Pamięć Akukiego by rosła i nigdy się nie konsolidowała.

`runAkukiTurn` zostaje bez zmian — dalej służy smoke testom i sondzie internalizacji.

## Trzy stany zamiast jednej flagi

Trwały stan transportu ma pięć wartości, z czterema końcowymi:

    received -> reply_ready(text|null) -> published
            |                        \-> abandoned
            |-> skipped
            \-> abandoned

Tekst odpowiedzi jest zapisywany **przed** POST-em. Gdyby stan zapisywał się dopiero po udanym POST-cie, awaria między turą a publikacją zostawiałaby wiadomość jako nieprzetworzoną i następne odpytanie uruchomiłoby turę drugi raz. To gorsze niż zdublowany post: druga tura zapisuje drugi zestaw zdarzeń tożsamościowych i drugi błąd predykcji, czyli fałszuje zapis rozwojowy.

Borg nie może tego pokryć sam — jego kontrakt dostarczania mówi wprost, że dostarczenie zewnętrzne nie jest ponawiane i nie ma trwałego outboxa w v1 (`borg/src/cognition/ingestion/enqueuer.ts:2`).

Rozróżnienie `skipped` od `abandoned` jest celowe: `skipped` znaczy „żadna tura nie była zamierzona" (własny post Akukiego, martwy stream), `abandoned` znaczy „tura BYŁA w locie i się nie skończyła, i nie zostanie powtórzona".

Polityka błędów jest asymetryczna: nieudany POST jest ponawiany, nieudana tura nigdy.

## Rozwiązywanie tożsamości nadawcy — bez tego M3 i M4 milczą

Runner przekazuje `senderEntityId` i etykietę audytorium wątku. To nie jest ozdoba:

- M4 gubi cały dowód zaufania, gdy partner jest `null` (`borg/src/cognition/social-trust/domain-trust-turn-service.ts:45`), a partner bierze się z `actionSpeaker.entityId ?? input.audienceEntityId` (`borg/src/cognition/lifecycle/turn-phase/extraction-phase.ts:337`);
- mówiący staje się dostępny tylko wtedy, gdy rozwiązana encja audytorium ma `kind === "group"` — coordinator spada wtedy na `turnInput.senderEntityId` (`borg/src/cognition/lifecycle/turn-phase-coordinator.ts:977-983`).

Dlatego encja wątku jest zapewniana jawnie jako `kind: "group"` z prowenienecją `transport_audience_label`, a autor przez `entities.resolveExternal` z prowenienecją `transport_sender`. Klucz to identyfikator z Areny, nie nazwa — zmiana nazwy osoby na Arenie nie tworzy drugiej encji i nie rozcina jej historii.

Runner **nie** buduje koperty wiadomości: borg sam renderuje nadawcę jako atrybut `sender_display_name` (`borg/src/cognition/turn-input.ts:219`), więc doklejanie „Zosia: ..." byłoby duplikatem atrybucji.

## Odstąpienia od zatwierdzonego planu, z powodami

1. **Kompozycja w `src/`, nie w `scripts/`.** Plan zakładał ponowne użycie `runDaemon({ openBorg })` z `scripts/daemon.ts`. Nie da się: `tsconfig.json` ma `"exclude": [..., "scripts", ...]` i `rootDir: "./src"`, więc `scripts/` nie jest typecheckowany ani importowalny z `src/`. Ten sam powód jest już opisany w `borg/src/akuki/tenant.ts:3-6`. Schedulery startuje więc `src/akuki/arena/service.ts`, a `scripts/akuki-arena.ts` jest wyłącznie launcherem wiążącym sygnały z `stop()`. `borg.inbox.catchUp` świadomie nie jest startowany — nic go nie karmi na tej ścieżce.

2. **Trzy pola usunięte z kontraktu.** `authorType`, `replyToMessageId` i `mentionIds` nie mają czytelnika, bo `TurnInputBase` nie ma na nie slotu. Zamiast martwych pól luka jest zapisana w TASK-033, zgodnie z wzorcem z TASK-031.

## Znalezione i naprawione w trakcie

- `advanceFloor` przerywał na pierwszej wiadomości bez wiersza, a wiersze poniżej podłogi są przycinane — po pierwszym przycięciu podłoga zamarzłaby na zawsze. Naprawione pominięciem wiadomości poniżej podłogi.
- Dry-run zapisywał podłogę. Ustawiona podłoga sprawiłaby, że pierwszy prawdziwy przebieg pominie znakowanie pierwszego kontaktu i odpowie na całą historię wątku. Dry-run nie zapisuje teraz niczego i nie otwiera Borga.
- Nieparsowalny `created_at` spadał na 0, co przy istniejącej podłodze cicho gubiłoby wiadomość. Spada teraz na „teraz" plus ostrzeżenie w logu.

## Dowód

- `npx vitest run src/akuki` z katalogu `borg/`: **162/162 zielone**, w tym 85 nowych testów areny.
- `npx tsc --noEmit`: zero błędów.
- `npm run heuristics:guard`: zielony.
- `npx tsx borg/scripts/akuki-arena.ts --dry-run` bez konfiguracji: pada z `ArenaConfigError: Missing required env var: AKUKI_ARENA_API_BASE`, czyli bez cichego defaultu.

AC #4 jest wymuszone testem (`boundary.test.ts`), nie obietnicą: czyta źródła i sprawdza, że tylko `runner.ts` i `service.ts` sięgają do Borga, a `contract.ts` nie importuje niczego.

## Czego jeszcze nie sprawdzono

Nie wykonano żadnego przebiegu na prawdziwej Bot Arenie. Nie sprawdzono cache cross-turn na tej ścieżce ani zachowania po `kill -9` na żywym procesie. To Etap 7 planu i należy do TASK-024.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: claude
created: 2026-09-04 14:39
---
IMPLEMENTACJA WYKONANA 2026-09-04, po zatwierdzeniu planu przez Zosię. Kryteria #1-#10 zaznaczone: connector istnieje, jest przetestowany bez sieci i bez modelu, granica warstw jest wymuszona testem, a decyzja lifecycle (AC #5) została podjęta na podstawie kodu Akukiego, nie na podstawie Sola.

ZADANIE ZOSTAJE In Progress, nie Done, i to jest świadome. Wszystkie kryteria odbiorcze dotyczą kodu i wszystkie są spełnione, ale connector nie wykonał ani jednej tury na prawdziwej Bot Arenie. Zamknięcie tego zadania przed pierwszym przebiegiem na żywo znaczyłoby, że „Done” opisuje testy, a nie działanie.

Z sol-connectora wzięte wyłącznie: nazwy endpointów i kształty odpowiedzi API, wzorzec defensywnego parsowania, timeout 20 000 ms, self-skip, pominięcie wiadomości niefinalnych, stała porzucania martwego streamu 5 min oraz idea postępu jako zbiór przetworzonych plus przycinana podłoga. NIE wzięte: klasy Poller i IdMap jako całość, drainOutbound i kursor strumienia, egress oparty o MessageConnector, plugin.ts, ani nic, co otwiera lub konfiguruje Borga. Wybrana droga przez borg.turn() czyni te części niepotrzebnymi, więc dodatkowa zgoda na substantywne kopiowanie nie była potrzebna (AC #9).
---

author: claude
created: 2026-09-07 13:05
---
KONEKTOR WYPROWADZONY Z FORKA 2026-09-07, decyzja Zosi. Powodem jest zasada, którą Tomek zapisał w sol-connectorze i której TASK-011 nie dotrzymał: transport BotAreny to kod platformy i nie należy do borga, a seed, klienci modeli i parametry przewidywania to kod bytu i zostają w forku.

NOWE MIEJSCE: `akuki/connector/`, pakiet `akuki-connector`, obok forka. Zależność `"borg": "file:../borg"`. To npm, nie pnpm jak u Sola — świadomie, żeby fork, pakiet i VPS miały jeden łańcuch narzędziowy; `file:` jest npm-owym zapisem tego samego symlinku, który robi `link:`.

Przeniesione bez zmian poza importami — każde sięgnięcie poza katalog konektora stało się gołym `"borg"`. Fork dopisał trzy eksporty (`applyAkukiSeed`, `applyAkukiPredictionEnv`, `buildAkukiClients`), bo pakiet zewnętrzny widzi tylko to, co przechodzi przez `dist/index.js`. `Borg`, `createSessionId`, `parseSessionId` i `LLMClient` były już eksportowane.

CO SIĘ OKAZAŁO PRZY PRZEPROWADZCE: `boundary.test.ts` już wcześniej wymuszał, że sześć plików transportu (`contract`, `state`, `botarena-client`, `directory`, `adapter`, `config`) nie może importować borga wcale, nawet typu. Konektor był więc rozdzielony od początku i borga dotykają tylko `service.ts` i `runner.ts`. Test jechał z pakietem i działa dalej — złapał nowy `plugin.ts` jako plik sięgający borga i kazał go dopisać do listy jawnie. Widziałam ten test na czerwono, czyli naprawdę pilnuje.

DWA WEJŚCIA, JEDEN KORZEŃ KOMPOZYCJI. `index.ts` otwiera własnego Borga (droga, która dziś działa na VPS-ie). `plugin.ts` pożycza tego, którego otworzył serwer demo borga. `service.ts` wie, którego posiada: pożyczonemu nie startuje schedulerów i nie woła na nim `close()`. Seed idzie za własnością — sieje ten, kto wprowadza instancję.

To znosi konflikt, który wyglądał na nieusuwalny: GUI serwera demo i konektor nie muszą się wykluczać. Jeden proces, jeden writer, i jednocześnie `/chat` do rozmowy oraz `/mind` na pasma pamięci, tożsamość, graf semantyczny, cele i otwarte pytania.

CZEGO PLUGIN ODMAWIA, i to jest istotniejsze od tego, co robi:
- Nigdy nie rzuca z `start()`. Serwer demo traktuje rzut jako śmiertelny i gasi borga razem z interfejsem. Konektor bez Areny jest zdegradowany; martwy serwer jest stracony.
- Odmawia startu, jeśli nie dało się zbudować klientów modeli Akukiego, zamiast pozwolić hostowi otworzyć jego tenant na domyślnych modelach. To jest ta awaria, która wygląda jak sukces: jego pamięć, czyjś inny umysł.
- Nie rejestruje żadnego outbound connectora. Sol go ma, bo borg sam dostarcza jego odpowiedzi; ten adapter publikuje własne po zapisaniu, i to właśnie daje dokładnie jeden post po awarii. Druga droga wyjścia zdublowałaby odpowiedź.

UDAWANA ARENA: `src/fake-arena/`. Lokalny serwer odpowiadający na te same pięć endpointów plus prosta strona do pisania. Konektor nie zmienia się dla niej ani o linijkę — zmienia się `AKUKI_ARENA_API_BASE`. Wymusza podział poświadczeń (odczyt z tokenem bota dostaje 401, tak jak na żywo), bo pobłażliwa podróbka przepuściłaby próbę na konfiguracji, która na produkcji pada. Testy pędzą ją przez PRAWDZIWEGO `BotArenaClient`, więc dowodzą zgodności z konektorem, nie z testem. Zwraca najnowsze 50, czyli okno zmierzone na żywo.

Powód jej istnienia zamiast kopii na prawdziwej Arenie — uwaga Zosi, której nie postawiłam: kopia na prawdziwej Arenie łączy dwie wady, bo pamięć idzie do kosza, a ślad społeczny zostaje trwale i publicznie. Inne boty dostają callbacki, ludzie widzą jego wejście, a dla niego samego to wejście nigdy się nie wydarzyło.

Czego udawana Arena NIE odtwarza: strumieniowania, załączników, głębokości łańcucha bot-bot i callbacków. Jest zamiennikiem pięciu endpointów i podziału poświadczeń, nie modelem BotAreny.

STAN: 101 testów, typecheck czysty w pakiecie i w forku, `heuristics:guard` przechodzi. Commity: `138bb36e` i `83d1076a` w forku, `7642c7b` i `cf61ea2` w repo projektu.
---
<!-- COMMENTS:END -->
