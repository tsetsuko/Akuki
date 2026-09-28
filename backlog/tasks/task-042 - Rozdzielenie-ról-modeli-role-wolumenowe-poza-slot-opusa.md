---
id: TASK-042
title: 'Rozdzielenie ról modeli: role wolumenowe poza slot opusa'
status: In Progress
assignee: []
created_date: '2026-09-21 13:33'
updated_date: '2026-09-28 18:46'
labels: []
dependencies:
  - TASK-013
priority: high
type: chore
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Wszystkie pięć ról modeli wskazywało jeden model, `claude-opus-4-8`, mimo że borg ma dla nich osobne domyślne wartości. To jest punkt 2 opisu TASK-013, nigdy nie wykonany.

Stan zastany w `/etc/akuki/akuki.env` (2026-09-21): BORG_MODEL_COGNITION, BORG_MODEL_EXTRACTION, BORG_MODEL_RECALL_EXPANSION, BORG_MODEL_BACKGROUND i BORG_MODEL_CREATOR_DIRECTIVE — wszystkie ustawione na `claude-opus-4-8`.

Domyślne borga (`borg/src/config/index.ts:317-331`): cognition `claude-opus-4-8`, background `claude-opus-5`, extraction `claude-opus-5`, recallExpansion `claude-haiku-4-5-20251001`, creatorDirective `claude-sonnet-4-6`.

Pomiar, który to wywołał: `/var/lib/akuki/token-usage.jsonl`, 1915 wywołań z 2026-09-15..17, razem 21 902 333 tokeny (input + output + cache-read + cache-creation), 105 tur Areny, około 205-226 tys. tokenów na turę. Wszystkie wywołania na `claude-opus-4-8`.

Największe pozycje według etykiety miejsca wywołania: shared-state-compiler 4 769 178 (21,8%), cognition-system-2 3 481 884 (15,9%), cognition-system-1 3 276 066 (15,0%), cognition-plan 2 664 025 (12,2%), reflection 1 491 763 (6,8%), a dwanaście ekstraktorów i klasyfikatorów odpalanych w każdej turze razem około 5,6 mln (25%).

Czego ten podział NIE załatwi, i trzeba to zapisać, żeby nikt nie liczył na więcej. Cennik Anthropica: opus-4-8 i opus-5 kosztują tyle samo (5 USD za milion tokenów wejścia, 25 USD za milion wyjścia), sonnet-4-6 to 3/15, haiku-4-5 to 1/5. Przeniesienie ról extraction i background na opus-5 jest więc zgodne z domyślną konfiguracją borga, ale samo w sobie nie obniża rachunku. Jedyna rola, która realnie tanieje, to recallExpansion na haiku — a to akurat ona obsługuje shared-state-compiler (`borg/src/cognition/lifecycle/turn-phase/retrieval-phase.ts:2213`) i recall-expansion, czyli 4 944 406 tokenów z 21,9 mln, ponad 22% ruchu, pięciokrotnie taniej.

Druga rzecz zmierzona przy okazji, ważniejsza niż cennik: pula tokenów w aiproxy (`https://aiproxy.tomaszkasperczyk.name`) jest wyczerpana dla modeli opus i sonnet. Sonda z VPS-a 2026-09-21 na `/v1/messages`: `claude-opus-4-8`, `claude-opus-5`, `claude-sonnet-4-6` i `claude-sonnet-5` zwracają HTTP 429 z komunikatem „All pool tokens are currently rate-limited", a `claude-haiku-4-5-20251001` odpowiada HTTP 200. Przy takim stanie puli rola creatorDirective na sonnecie też nie wystartuje, dopóki limit się nie zresetuje.

Dalsza decyzja, świadomie tu nie podjęta: czy rodzina ekstraktorów (rola extraction, około 25% tokenów, praca mechaniczna) ma zejść na haiku zamiast opusa-5. To zmienia jakość wejścia dla pomiarów M2, M3 i M4, więc jest decyzją badawczą, a nie kosztową.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Pięć ról modeli w /etc/akuki/akuki.env ma wartości zgodne z domyślnymi borga, a nie jedną wspólną
- [x] #2 Konfiguracja przechodzi walidację AKUKI_ANTHROPIC_ONLY=1 (validateAkukiAnthropicOnlyModels) po zmianie
- [ ] #3 Zmierzone zużycie per etykieta wywołania po zmianie, tą samą metodą co pomiar wyjściowy z 2026-09-15..17
- [ ] #4 Zapisana decyzja, czy rola extraction zostaje na opus-5, czy schodzi na haiku
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ZMIANA WYKONANA NA VPS-IE 2026-09-21.

Kopia zapasowa przed zmianą: `/etc/akuki/akuki.env.bak-before-role-split-20260921`. Plik leży poza repozytorium, więc nie ma go w żadnym commicie.

Nowe wartości w `/etc/akuki/akuki.env` (cztery linie zmienione, cognition bez zmian):

- BORG_MODEL_COGNITION=claude-opus-4-8
- BORG_MODEL_EXTRACTION=claude-opus-5
- BORG_MODEL_RECALL_EXPANSION=claude-haiku-4-5-20251001
- BORG_MODEL_BACKGROUND=claude-opus-5
- BORG_MODEL_CREATOR_DIRECTIVE=claude-sonnet-4-6

DOWÓD. `validateAkukiAnthropicOnlyModels(process.env)` z `borg/src/akuki/smoke-config.ts`, uruchomiona jako użytkownik `akuki` na VPS-ie ze środowiskiem wczytanym z `/etc/akuki/akuki.env`: przeszła, wypisując pięć slotów z powyższymi wartościami. To sprawdza obecność wszystkich pięciu ról i to, że każda wskazuje model Anthropica; nie sprawdza, czy proxy te modele obsługuje.

CZEGO NIE ZROBIONO I DLACZEGO. Usługa `akuki` jest nieaktywna od 2026-09-15 20:37 UTC i nie została podniesiona — start to osobna decyzja. Nowe wartości wejdą w życie przy najbliższym starcie, bo systemd wczytuje ten plik przy uruchomieniu jednostki.

Osobny powód, żeby nie startować teraz: pula w aiproxy jest wyczerpana dla modeli opus i sonnet (HTTP 429, sonda z 2026-09-21). Rola cognition stoi na opusie, więc każda tura padłaby na 429. Haiku odpowiada normalnie, czyli po starcie zadziała rola recallExpansion — a to ona niesie shared-state-compiler, największą pozycję pomiaru.

AC #3 i #4 zostają otwarte: pomiaru po zmianie nie da się zebrać, dopóki Akuki nie chodzi, a decyzja o roli extraction (opus-5 czy haiku) należy do Zosi i jest badawcza, nie kosztowa.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: claude
created: 2026-09-28 17:27
---
SONDA PULI PO TYGODNIU, 2026-09-28 — pula nadal zamknięta dla wszystkiego poza haiku.

Z VPS-a, przez `$ANTHROPIC_BASE_URL/v1/messages`, minimalne żądanie (max_tokens 8):

- claude-opus-5: 0 udanych prób na 9 w ciągu 180 sekund, wszystkie HTTP 429
- claude-opus-4-8: HTTP 429
- claude-sonnet-4-6: HTTP 429 (3 próby)
- claude-sonnet-5: HTTP 429 (3 próby)
- claude-haiku-4-5-20251001: HTTP 200

Treść odmowy bez zmian: „All pool tokens are currently rate-limited for opus models. Please try again later or switch models." Nowa informacja wobec 2026-09-21: odpowiedź niesie nagłówek `retry-after: 32`, czyli limit jest oknem kroczącym, a nie blokadą do końca okresu rozliczeniowego. Mimo to dziewięć prób rozłożonych co dwadzieścia sekund nie trafiło ani razu w otwarte okno — pula jest wysycona przez innych użytkowników proxy, nie przez Akukiego, bo Akuki nie chodzi.

Usługa `akuki` nadal nieaktywna od 2026-09-15 20:37 UTC, `token-usage.jsonl` nadal ma 1915 linii z ostatnim wpisem 2026-09-17. Żadnych nowych danych pomiarowych nie przybyło.

CO TO ZNACZY DLA AC #4. Wybór modelu dla roli extraction przestaje być pytaniem o koszt, a staje się pytaniem o dostępność. Opus-5 kosztuje dokładnie tyle co opus-4-8, więc przestawienie extraction na opus-5 nie dało i nie da oszczędności; przy obecnym stanie puli nie da też ani jednego udanego wywołania. Haiku jest jedynym modelem, który odpowiada.

Uwaga, która wyprzedza tę decyzję: rola cognition też stoi na opusie, więc dopóki pula jest wysycona, Akuki nie wykona żadnej tury niezależnie od tego, co ustawimy na extraction. Decyzja o extraction jest wtórna wobec pytania, co zrobić z cognition — a to jest decyzja badawcza najwyższej wagi, bo opis TASK-013 mówi wprost, że tylko cognition musi być doskonałe.
---

author: claude
created: 2026-09-28 18:04
---
KOREKTA, 2026-09-28: OPUS DZIALA. Poprzednie wpisy o wyczerpanej puli byly bledne — przyczyna byl ksztalt zadania, nie limit.

Zosia podala obowiazujacy format zadania do aiproxy. Rozni sie od tego, ktorego uzywalem, jednym elementem: blokiem `system` z prefiksem Claude Code, doslownie: You are Claude Code, Anthropic's official CLI for Claude.

POMIAR ROZSTRZYGAJACY — trzy zadania w tej samej minucie, ten sam token (sha256 7c8545eb), ten sam endpoint, model claude-opus-5:

- z prefiksem Claude Code: HTTP 200, odpowiedz „Tak, dzialam — jestem gotow do pracy.", input_tokens 56
- bez bloku `system`: HTTP 429, rate_limit_error „All pool tokens are currently rate-limited for opus models"
- z blokiem `system` o innej tresci („Jestes pomocnym asystentem."): HTTP 429, ten sam komunikat

Rozstrzyga wiec TRESC prefiksu, nie sama jego obecnosc. Tym samym ksztaltem odpowiedzialy rowniez claude-opus-4-8 (HTTP 200) i claude-sonnet-5 (HTTP 200).

CO TO UNIEWAZNIA. Wszystkie wczesniejsze odczyty „pula wyczerpana dla opusa i sonneta" — z 2026-09-21 i z 2026-09-28, zarowno robione curlem, jak i narzedziem akuki/diag_model.py — mierzyly brak prefiksu, nie dostepnosc modelu. diag_model.py nie wysyla bloku `system` wcale, wiec jego werdykt „limit tieru" jest przy tych modelach falszywie ujemny. Narzedzie wymaga poprawki; do tego czasu ostrzezenie stoi na gorze references/conventions.md.

CO Z TEGO WYNIKA DLA TEGO ZADANIA. Argument „opus i tak nie przejdzie, wiec extraction musi zejsc na haiku" upada. Wybor modelu dla roli extraction wraca do tego, czym byl na poczatku: decyzji o koszcie i o jakosci wejscia dla pomiarow M2, M3 i M4. Upada tez powod, dla ktorego nie podnosilem uslugi — Akuki moze ruszyc z cognition na opusie, o ile konektor wysyla ten sam prefiks systemowy. Tego jeszcze nie sprawdzilem i to jest nastepny krok: czy zadania budowane przez borga przez aiproxy przechodza, czy tez trafiaja w to samo 429.
---

author: claude
created: 2026-09-28 18:14
---
BORG SPRAWDZONY, ZMIANY NIE POTRZEBUJE — 2026-09-28.

Pytanie brzmialo, czy zadania budowane przez borga przechodza przez aiproxy, skoro Akuki ma wlasny prompt systemowy, a nie prefiks Claude Code. Przechodza.

DLACZEGO. AnthropicLLMClient.resolveSystemPrompt (borg/src/llm/index.ts:1983-1997) w trybie oauth sam wstawia CLAUDE_CODE_IDENTITY_BLOCK_TEXT (src/llm/index.ts:34) jako PIERWSZY blok system i dopisuje wlasciwy prompt po nim. Komentarz przy tej stalej mowi, ze endpoint OAuth waliduje tozsamosc i odrzuca wszystko poza ta dokladna trescia — czyli borg zna te regule od dawna, tylko moja sonda jej nie znala. Tryb oauth wlacza sie, gdy jest ANTHROPIC_AUTH_TOKEN i nie ma ANTHROPIC_API_KEY, czyli dokladnie w konfiguracji Akukiego.

DOWOD BIEGIEM, przez klienta borga, z promptem systemowym w stylu Akukiego („Jestes Akuki, dziecko uczace sie przez rozmowe"), bez otwierania Borga i bez dotykania tenanta:

- claude-opus-4-8: odpowiedz „Dziala!"
- claude-sonnet-4-6: odpowiedz „dziala"
- claude-opus-5: HTTP 200, tresc pusta — przy max_tokens 24 odpowiedz konczy sie na limicie jeszcze w fazie myslenia adaptacyjnego. To nie jest awaria, to powod, dla ktorego diag_model.py uzywa 64.

NARZEDZIE POPRAWIONE. akuki/diag_model.py wysyla teraz blok system z prefiksem (stala SYSTEM_PREFIX, z komentarzem i pomiarem uzasadniajacym doslownosc tresci). Bieg na claude-opus-4-8: HTTP 200 w 1136 ms, model zwrocony claude-opus-4-8, kod wyjscia 0.

REGULA DOPISANA DO references/conventions.md: pierwszy blok system musi byc rowny prefiksowi znak w znak. Dalsze bloki moga zawierac cokolwiek, ale doklejenie czegokolwiek do TEGO SAMEGO bloku lamie dopasowanie (zmierzone: prefiks + wlasny tekst w jednym bloku -> 429; prefiks jako osobny pierwszy blok + drugi blok -> 200).

UWAGA NA PRZYSZLOSC: przelaczenie Akukiego z ANTHROPIC_AUTH_TOKEN na ANTHROPIC_API_KEY wylaczy wstawianie prefiksu i wszystko zacznie wracac jako 429 z komunikatem o wyczerpanej puli.

STAN ZADANIA. AC #1 i #2 zamkniete. AC #3 (pomiar po zmianie) czeka na uruchomienie uslugi. AC #4 (extraction: opus-5 czy haiku) wraca do bycia decyzja kosztowo-badawcza, bez przymusu ze strony dostepnosci.
---

author: claude
created: 2026-09-28 18:41
---
ROLA COGNITION PRZESTAWIONA NA claude-opus-5 — 2026-09-28, decyzja Zosi.

Kopia zapasowa przed zmiana: /etc/akuki/akuki.env.bak-before-cognition-opus5-20260928. Zmieniona jedna linia, BORG_MODEL_COGNITION z claude-opus-4-8 na claude-opus-5. Komplet rol po zmianie:

- BORG_MODEL_COGNITION=claude-opus-5
- BORG_MODEL_EXTRACTION=claude-opus-5
- BORG_MODEL_RECALL_EXPANSION=claude-haiku-4-5-20251001
- BORG_MODEL_BACKGROUND=claude-opus-5
- BORG_MODEL_CREATOR_DIRECTIVE=claude-sonnet-4-6

DOWOD. validateAkukiAnthropicOnlyModels na VPS-ie ze srodowiskiem z /etc/akuki/akuki.env: przeszla. Sonda akuki/diag_model.py na claude-opus-5: HTTP 200 w 1813 ms, model zwrocony claude-opus-5, kod wyjscia 0.

KOSZT SIE NIE ZMIENIA. Opus 4.8 i Opus 5 maja identyczny cennik (5 USD za milion tokenow wejscia, 25 USD za milion wyjscia), te same mnozniki cache'u i ten sam tier w puli aiproxy. Zmiana jest jakosciowa, nie kosztowa, i nie wplywa na AC #3 ani na AC #4.

ZASTRZEZENIE POMIAROWE, wazniejsze niz sama zmiana. Dotychczasowe 105 tur pamieci Akukiego powstalo na claude-opus-4-8. Od nastepnego startu cognition jest inne, wiec kazda roznica w M2, M3 i M4 miedzy baza a nowymi odczytami bedzie nierozstrzygalna miedzy rozwojem a zmiana modelu. Zosia podjela te decyzje swiadomie, po tym jak zostala nazwana. Przy czytaniu wynikow trzeba pamietac, gdzie przebiega ta granica: ostatni wpis w token-usage.jsonl na starym modelu ma date 2026-09-17.

UWAGA OPERACYJNA. Opus 5 ma myslenie adaptacyjne wlaczone domyslnie, wiec przy malym max_tokens odpowiedz konczy sie w fazie myslenia i wraca bez tekstu. W sondzie to nadal sukces (HTTP 200, stop_reason max_tokens) i narzedzie oznacza to wprost. W turach borg dobiera limit sam, wiec nie wymaga to zmiany — ale kazdy recznie pisany test na tym modelu musi dawac wiecej niz 64 tokeny, jesli oczekuje tekstu.
---

author: claude
created: 2026-09-28 18:46
---
USLUGA PODNIESIONA, PIERWSZA TURA NA NOWYCH ROLACH — 2026-09-28 18:44:59 UTC.

Start czysty: HTTP 200 na 7740, zero linii z bledem od startu, zero 429. Konektor pominal zalegle wiadomosci z Areny jako starsze niz okno 600 s — to zachowanie zamierzone, nie awaria.

PIERWSZA TURA, zmierzona z token-usage.jsonl (13 wywolan, 18:45:06-18:45:37):

  po modelu:
    claude-haiku-4-5-20251001   10 wywolan   85 489 tokenow
    claude-opus-5                5 wywolan   46 464 tokenow
    razem                                    131 953

  najwieksze pozycje:
    shared-state-compiler   56 043 (haiku)
    cognition-plan          29 322 (opus-5)
    corrective-preference-extractor 7 804
    prediction-extractor    6 790

Dla porownania: baza z 2026-09-15..17 to 205-226 tys. tokenow na ture, wszystko na opusie. Tutaj 132 tys., z czego dwie trzecie na haiku. Jedna tura to jednak jedna tura — AC #3 wymaga kilkunastu, i dopiero wtedy zestawienie bedzie uczciwe.

Schedulery maintenance i autonomy startuje serwer demo, nie konektor (log: „schedulers left to the host: this Borg is borrowed"), z budzetami 60k/200k z akuki.env. Zgodnie z decyzja o pozostawieniu maintenance.

DROBNA NIEZGODNOSC DO SPRAWDZENIA OSOBNO: linia startowa konektora wypisuje `tokenUsageLog=<off>`, a mimo to plik telemetrii rosnie i ma dzisiejsze wpisy. AKUKI_ARENA_TOKEN_USAGE_LOG jest ustawione w /etc/akuki/akuki.env. Czyli albo linia startowa czyta inne zrodlo niz sink wpinany w plugin.ts, albo wypisuje stan sprzed wczytania konfiguracji. Telemetria dziala — myli komunikat, nie pomiar — ale komunikat, ktory mowi „nie mierze", gdy mierzy, jest dokladnie tym rodzajem rzeczy, ktora pozniej kogos wprowadzi w blad.
---
<!-- COMMENTS:END -->
