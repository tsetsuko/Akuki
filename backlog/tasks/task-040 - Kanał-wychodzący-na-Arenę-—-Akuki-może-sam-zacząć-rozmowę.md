---
id: TASK-040
title: Kanał wychodzący na Arenę — Akuki może sam zacząć rozmowę
status: In Progress
assignee: []
created_date: '2026-09-14 08:59'
updated_date: '2026-09-14 09:00'
labels: []
dependencies: []
modified_files:
  - connector/src/outbound.ts
  - connector/src/outbound.test.ts
  - connector/src/plugin.ts
  - connector/src/plugin.test.ts
  - connector/src/boundary.test.ts
  - connector/README.md
priority: high
type: feature
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Akuki nigdy nie zaczął żadnej rozmowy. Wszystkie 69 tur w żywej pamięci to reakcje na cudzą wiadomość, bo konektor Areny celowo nie rejestrował żadnego kanału wyjściowego. Jednocześnie w jego pamięci leży 20 otwartych pytań, 62 zdarzenia tożsamościowe i 53 węzły wiedzy — materiał jest, brakuje drogi wyjścia. To jest mechaniczna przyczyna wrażenia, że Akuki jest "pusty": postać z własnym wnętrzem przynosi własny materiał, a on nie miał jak.

Zakres: jeden kanał wychodzący, który wozi WYŁĄCZNIE wiadomości inicjowane przez Akukiego. Ścieżka odpowiedzi zostaje nietknięta — borg oddaje wiadomość konektorowi tylko na turze o pochodzeniu `directed_outbound`, a zwykła odpowiedź nadal jest publikowana przez adapter po zapisaniu jej w bazie, co utrzymuje gwarancję "dokładnie jeden post przeżywa awarię".

Limity pochodzą z domyślnych wartości borga i nie są nowym mechanizmem: dwie wypowiedzi na dobę, najwyżej jedna na wątek, okno 24 godzin. Decyzja Zosi z 2026-09-14.

Uwaga o izolacji: to poszerza powierzchnię wyjścia Akukiego. Do tej pory odzywał się wyłącznie wtedy, gdy ktoś go zaczepił. Zgoda udzielona wprost.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Konektor wychodzący istnieje w connector/src/outbound.ts, nie importuje borga i jest objęty boundary.test.ts
- [x] #2 Kanał jest rejestrowany w plugin.ts przed otwarciem Borga, a brak poświadczeń Areny daje pustą listę zamiast wyjątku
- [x] #3 Zwykła odpowiedź nadal wychodzi dokładnie jedną drogą — test pokazuje dokładnie jeden zarejestrowany kanał dla source_type botarena
- [x] #4 Brak identyfikatora wątku w sesji kończy się wyjątkiem, a nie cichym porzuceniem wiadomości
- [ ] #5 autonomy.proactiveOutbound.enabled wraz z autoryzacją source_type botarena ustawione w config.json tenanta na VPS
- [ ] #6 Po wgraniu: w dzienniku widać wypowiedź autonomiczną i nie widać zdublowanej odpowiedzi
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Zrobione lokalnie, niewgrane na VPS.

connector/src/outbound.ts — nowy plik, transport-only, bez importu borga, dopisany do TRANSPORT_FILES w boundary.test.ts. createArenaOutboundConnector czyta z sesji wyłącznie source_external_id (identyfikator wątku) i publikuje przez BotArenaClient.postMessage. Brak identyfikatora wątku rzuca wyjątkiem, bo borg zamienia rzut na zapisane transport_failed, a cicha strata wiadomości inicjowanej przez Akukiego byłaby niepoliczalna.

connector/src/plugin.ts — kanał budowany w createDemoPlugin, nie w start(), bo host czyta outboundConnectors przy otwieraniu Borga, czyli przed start(). Brak poświadczeń Areny nie rzuca (rzut z createDemoPlugin zabija serwer demo), tylko zostawia pustą listę i wypisuje ostrzeżenie.

Dlaczego nie dubluje odpowiedzi: post-generation-phase.ts wywołuje outboundDelivery.deliver wyłącznie gdy isDirectedOutboundTurnOrigin(origin), a ta funkcja zwraca true tylko dla "directed_outbound". Tura Areny idzie przez ArenaAkukiRunner.handleMessage, które woła borg.turn bez origin, więc auto-dostarczenie się nie uruchamia. Stary komentarz w plugin.ts mówiący, że kanał wyjściowy zdublowałby odpowiedzi, był ostrożniejszy niż kod.

Limity nie są nowym kodem: autonomy.proactiveOutbound ma maxPostsPerWindow=2, maxPostsPerTargetPerWindow=1, windowMs=86400000 jako wartości domyślne, czyli dokładnie dwie na dobę i jedna na wątek. AutonomousOutboundPolicy oferuje wątek jako cel tylko wtedy, gdy zarejestrowany jest konektor dla jego source_type (transportSourceTypes z rejestru), więc wyjęcie konektora odbiera zdolność zamiast zostawiać martwą trasę.

Harmonogram autonomii już działa: demo/server/src/index.ts woła autonomy.scheduler.start(), maxWakesPerWindow=6.

Testy: 125 przechodzi w konektorze, typy czyste.

Do wgrania na VPS zostaje krok 5: w /var/lib/akuki/data/akuki/config.json dopisać blok autonomy.proactiveOutbound z enabled=true oraz allowByConfig.sourceTypes=["botarena"]. Zmiennej środowiskowej na autoryzację po source_type nie ma — jest tylko BORG_AUTONOMY_PROACTIVE_OUTBOUND_ENABLED i liczniki, więc autoryzacja celu musi iść przez config.json albo przez dyrektywę twórczyni (allowByCreatorDirective, domyślnie włączone, tag tematu proactive_outbound).
<!-- SECTION:NOTES:END -->
