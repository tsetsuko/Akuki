---
id: TASK-033
title: 'Wzmianki, reply-to i rodzaj autora z Areny nie docierają do tury'
status: To Do
assignee: []
created_date: '2026-09-04 14:38'
labels: []
dependencies:
  - TASK-011
priority: medium
type: task
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Connector Bot Areny (TASK-011) normalizuje wiadomość do `IncomingArenaMessage`, ale trzy fakty protokołu są świadomie z tego kontraktu wyłączone, bo nic po stronie Borga ich dziś nie czyta:

- rodzaj autora (`user` / `bot` / `system`),
- identyfikator wiadomości, na którą dana wiadomość odpowiada (`reply_to_id`),
- lista wzmiankowanych podmiotów (`mentions`), w tym wzmianka samego Akukiego.

Powód wyłączenia, sprawdzony w kodzie: `TurnInputBase` (`borg/src/cognition/turn-input.ts:101-108`) ma tylko `audience`, `senderEntityId`, `stakes`, `sessionId`, `globalTurnCounter`, `origin` i `autonomyTrigger`. Nie ma slotu na żadną z tych trzech rzeczy. Jedyną drogą byłoby wpisanie ich do treści wiadomości, a to jest decyzja projektowa dotycząca tego, co dociera do modelu — ile cytowanej wiadomości, pod czyją nazwą, w jakim formacie — i nie została podjęta.

Pole bez czytelnika wygląda jak wsparcie, którego nie ma. Dlatego zamiast trzymać martwe pola w kontrakcie, luka jest zapisana tutaj. To ten sam wzorzec, którym TASK-031 zamknął próg bez czytelnika.

Co trzeba rozstrzygnąć:

1. Czy „zostałem wprost zagadnięty" jest wejściem strukturalnym tury (nowe pole w `TurnInput`), czy elementem koperty wiadomości. Ma to znaczenie rozwojowe: bramka inhibicji M3 działa inaczej, gdy Akuki wie, że pytanie było skierowane do niego.
2. Czy odpowiedź na wcześniejszą wiadomość ma być podawana jako cytat w treści, jako `response_to` w strumieniu, czy w ogóle. Borg ma `response_to` na wpisach strumienia, ale ścieżka `borg.turn()` go nie wystawia.
3. Czy rodzaj autora ma trafiać do modelu, i czy głębokość łańcucha botów (`bot_chain_depth`, liczona lokalnie w `sol-connector/src/chain-depth.ts`, bo API jej nie podaje przy czytaniu) jest tu potrzebna.

Uwaga na regułę kardynalną z `borg/CLAUDE.md`: cokolwiek z tego zostanie dodane, nie może stać się bramką na treść ani rozgałęzieniem po słowach kluczowych. Decyzja „odpowiadam czy milczę" należy do Akukiego i M3.

Kod odniesienia: `borg/src/akuki/arena/contract.ts` (komentarz opisujący wyłączenie), `borg/src/akuki/arena/adapter.ts` (metoda `normalize`), `borg/src/akuki/arena/runner.ts` (komentarz o tym, dlaczego runner nie buduje koperty — borg sam renderuje `sender_display_name`, `borg/src/cognition/turn-input.ts:219`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rozstrzygnięte, czy wzmianka Akukiego jest polem TurnInput czy elementem koperty, z uzasadnieniem rozwojowym
- [ ] #2 Rozstrzygnięta polityka dla reply-to: cytat w treści, response_to w strumieniu albo świadome pominięcie
- [ ] #3 Rozstrzygnięte, czy rodzaj autora i głębokość łańcucha botów docierają do modelu
- [ ] #4 Wybrane rozwiązanie nie wprowadza bramki na treść ani dopasowania słów kluczowych
- [ ] #5 Każde dodane pole ma czytelnika w kodzie, sprawdzony testem
<!-- AC:END -->
