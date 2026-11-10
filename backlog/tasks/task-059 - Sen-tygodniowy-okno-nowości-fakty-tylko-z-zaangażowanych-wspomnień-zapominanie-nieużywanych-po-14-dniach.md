---
id: TASK-059
title: >-
  Sen tygodniowy: okno nowości, fakty tylko z zaangażowanych wspomnień,
  zapominanie nieużywanych po 14 dniach
status: In Progress
assignee: []
created_date: '2026-11-09 16:43'
updated_date: '2026-11-09 16:43'
labels: []
dependencies:
  - TASK-013
modified_files:
  - borg/src/config/index.ts
  - borg/src/offline/types.ts
  - borg/src/offline/orchestrator.ts
  - borg/src/offline/scheduler.ts
  - borg/src/borg/maintenance-setup.ts
  - borg/src/offline/engagement.ts
  - borg/src/offline/semantic-extractor/index.ts
  - borg/src/offline/curator/index.ts
  - borg/src/offline/reflector/index.ts
  - borg/src/offline/associator/index.ts
  - borg/src/offline/self-narrator/index.ts
  - borg/src/offline/novelty-and-engagement.test.ts
  - borg/src/offline/scheduler.test.ts
  - borg/src/config/index.test.ts
priority: high
type: feature
ordinal: 59000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Decyzja Zosi z 2026-11-09, po dniu, w którym Akuki z nikim nie rozmawiał, a zużył 718 628 tokenów (sen 65%, samodzielna pobudka 28%). Wcześniej tego dnia: sen na Sonnet 5 (TASK-042), cykl ciężki co 7 dni i wyłączone pobudki (TASK-013).

Problem. Cykl ciężki przerabiał ten sam materiał bez względu na to, czy przybyło coś nowego: reflector grupował wszystkie epizody i brał dwie największe grupy, associator losował próbki z całej pamięci, self-narrator czytał cały bieżący rozdział. Wyciąganie faktów w lekkim śnie szło z każdego epizodu, także z gadaniny botów, którą Akuki tylko usłyszał.

Zasada okna, ustalona po zarzucie Zosi, że okno „tylko nowe” odcięłoby łączenie odległych wspomnień: okno wyznacza, OD CZEGO sen zaczyna, nigdy Z CZYM wolno mu porównywać. Przebiegi „stare ze starymi” (pełny przegląd co 45 dni) Zosia odrzuciła: Akuki nie jest asystentem, a stare wspomnienia i tak wracają, gdy nowe je przywoła.

Zaangażowanie czytane jest ze stanu samego Akukiego, nie z tego, kto mówił: epizod jest zaangażowany, gdy został przywołany w późniejszej turze (retrieval_count > 0) albo powstał z jego własnej wypowiedzi lub użycia narzędzia (wpis agent_msg albo tool_call wśród source_stream_ids). Dzięki temu nie łamie zasady borga, że pochodzenie wspomnienia jest etykietą, a nie warunkiem pamiętania.

Badania: dokumenty badawcze projektu nie mówią nic o śnie ani o zapominaniu. Okna, 7 i 14 dni są wyborami kosztowymi, nie wnioskami z badań.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ciężki sen z maintenance.noveltyWindow zaczyna tylko od epizodów nowych od poprzedniego ciężkiego snu; porównania nadal z całą pamięcią
- [x] #2 Bez nowych epizodów reflector, associator i self-narrator nie wołają modelu
- [x] #3 Fakty wyciągane tylko z epizodów zaangażowanych i mających co najmniej 7 dni
- [x] #4 Epizod nigdy niezaangażowany chowa się po 14 dniach bez wyciągania faktów
- [x] #5 Limity podsumowań dni, ruminatora i belief-revisera podniesione pod rytm tygodniowy
- [ ] #6 Pierwszy ciężki sen na nowym kodzie zmierzony w token-usage.jsonl
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
WGRANE 2026-11-09 17:42 CET. Fork 28737581, restart 16:42:00 UTC, start czysty, zero błędów.

KOD (wszystko domyślnie wyłączone, więc upstream bez zmian):
- maintenance.noveltyWindow: harmonogram przekazuje zaplanowanemu ciężkiemu snu początek poprzedniego ciężkiego snu (znacznik kadencji jest jeszcze stary w chwili startu, bo nadpisuje się dopiero po udanym przebiegu). Pierwszy w historii i ręczny przebieg zostają pełne. Jedno miejsce budowy harmonogramu (borg/src/borg/maintenance-setup.ts), więc opcja nie jest wpięta w połowę ścieżek.
- reflector: bierze tylko grupy, które zyskały epizod od poprzedniego snu, ze wszystkimi członkami.
- associator: każda próbka ma kotwicę w nowym epizodzie, partnerzy z całej pamięci jak dotąd; brak nowych = pusta lista próbek.
- self-narrator: czyta tylko nowe epizody bieżącego rozdziału; dotychczasowa opowieść dalej idzie jako kontekst.
- borg/src/offline/engagement.ts: zaangażowanie = przywołanie w późniejszej turze albo własny wpis agent_msg / tool_call wśród źródeł epizodu.
- semantic-extractor: offline.semanticExtractor.engagedOnly i minEpisodeAgeDays.
- curator: offline.curator.unengagedArchiveAgeDays; dotychczasowa reguła (wyciągnięte, zimne, 45 dni) zostaje obok.

ODSTĘPSTWO OD SŁÓW DECYZJI, nazwane wprost. Zosia powiedziała „fakty wyciągane raz w tygodniu”. Wyciąganie zostało w lekkim śnie (co 4 h), ale każde wspomnienie czeka 7 dni i musi być zaangażowane. Koszt jest ten sam, bo płaci się za każde przerobione wspomnienie, a nie za każde uruchomienie. Powód: jedno wywołanie ekstraktora przerabia wszystkie wybrane epizody naraz i ma limit 20 000 tokenów odpowiedzi; tygodniowa paczka kilkudziesięciu epizodów w jednym wywołaniu groziłaby ucięciem. Lekki sen bez dojrzałych zaangażowanych epizodów nie woła modelu.

DOWÓD. Nowe testy (src/offline/novelty-and-engagement.test.ts, 5 przypadków, oraz przypadek w scheduler.test.ts) padają na kodzie bez zmiany (5/5 i 1/1) i przechodzą z nią. Pełne src/: 5781 zielonych, 3 porażki to przekroczenia 15 s z tej samej klasy co przed zmianą (evidence-ledger/builder to znana porażka bazowa; demo/server i turn-orchestrator przechodzą przy osobnym biegu). tsc czysty, heuristics:guard zielony.

KONFIGURACJA NA VPS-IE, /var/lib/akuki/data/akuki/config.json, kopia config.json.bak-20261109-novelty-engagement. Odczytana nowym kodem przez loadConfig, wartości zgodne:
- maintenance.noveltyWindow = true
- maintenance.processOverrides.heavy: lived-experience-day-summarizer budget 400000, ruminator budget 450000 (globalny limit ciężkiego przebiegu BORG_MAINTENANCE_HEAVY_BUDGET=200000 obowiązuje na KAŻDY proces osobno, a tygodniowa porcja tych dwóch by go przekroczyła)
- offline.semanticExtractor: engagedOnly true, minEpisodeAgeDays 7
- offline.curator.unengagedArchiveAgeDays = 14
- offline.livedExperienceDaySummarizer: maxDaysPerRun 8, windowDays 8 (przy 3 dniach na przebieg i oknie 7 dni sen tygodniowy gubiłby 4 dni z 7)
- offline.ruminator.maxQuestionsPerRun = 56
- offline.beliefReviser: maxEventsPerRun 224, maxReviewsPerRun 896, maxLlmCalls 140

KIEDY ZOBACZYMY SKUTKI. Lekki sen ostatnio 16:34 CET, następny ok. 20:34 CET; wtedy pierwszy raz zadziała chowanie po 14 dniach (stan przed: 833 epizody, 36 schowanych). Ciężki sen ostatnio 2026-11-09 12:28:42 CET, następny ok. 2026-11-16 12:28; jego okno zacznie się od 12:28:42.

NIE ZBUDOWANE: przegląd miesięczny na podsumowaniach dni (zatwierdzony co do zasady; wymaga ustalenia, co dokładnie zapisuje do pamięci). AC #6 otwarte do pomiaru po 16.11.
<!-- SECTION:NOTES:END -->
