---
id: TASK-046
title: 'Kolejka na Arenie: przyjmij każdą wiadomość, odpowiedz tylko na najnowszą'
status: In Progress
assignee: []
created_date: '2026-09-29 13:38'
updated_date: '2026-09-29 13:38'
labels:
  - arena
  - connector
  - throughput
dependencies: []
modified_files:
  - borg/src/cognition/turn-input.ts
  - borg/src/cognition/lifecycle/turn-phase-coordinator.ts
  - borg/src/cognition/lifecycle/turn-phase/post-generation-phase.ts
  - borg/src/cognition/lifecycle/turn-phase/types.ts
  - borg/src/cognition/reflection/turn-reflection-coordinator.ts
  - borg/src/cognition/generation/types.ts
  - borg/src/cognition/turn-orchestrator.ts
  - borg/src/tracing/tracer.ts
  - borg/src/outbound/outbound-turn.ts
  - borg/src/borg/__tests__/assess-only.test.ts
  - connector/src/contract.ts
  - connector/src/runner.ts
  - connector/src/adapter.ts
  - connector/src/state.ts
  - connector/src/service.ts
  - connector/src/adapter.test.ts
  - connector/README.md
priority: high
type: feature
ordinal: 26000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Problem: pełna tura trwa ~90 s (mediana 69 s do odpowiedzi + 17 s po niej, pomiar 2026-09-29), wiadomości w ruchliwym wątku przychodzą ~co minutę, konektor robi jedną pełną turę na wiadomość po kolei. Kolejka rosła bez końca — 2026-09-29 odpowiedź po 23 minutach.

Decyzja Zosi (2026-09-29): nie paczkować jak Sol (M4 zlewa nadawców w grupę, M2 ocenia paczkę raz), tylko rozdzielić przyjęcie od odpowiedzi. Gdy czeka kilka wiadomości, każda oprócz najnowszej przechodzi turę „tylko przyjmij”, najnowsza — pełną turę.

Trzy decyzje Zosi:
1. przyjęte wiadomości ruszają nastrój,
2. przyjęte wiadomości nie uruchamiają refleksji,
3. wiadomości, które przyjdą w trakcie odpowiedzi, czekają do następnego odpytania.

Zbudowane:
- borg (fork): flaga `assessOnly` w wejściu tury (`src/cognition/turn-input.ts`). Wczesne wyjście po fazie extract (`turn-phase-coordinator.ts`) przez `finalizeAssessedTurn` (`post-generation-phase.ts`): zapis nastroju i kontaktu społecznego (wspólna metoda `recordReception` w `turn-reflection-coordinator.ts`, ta sama, której używa pełna tura), zapis pamięci roboczej, zobowiązania korygujące, archiwizacja akcji. Brak znacznika w strumieniu. Nowy wynik `assessed` (emisja, ścieżka, terminalOutcome). Odrzucane poza pojedynczą wiadomością użytkownika.
- connector: `AkukiRunner.assessMessage`, wybór najnowszej wiadomości dostającej turę w `adapter.pollThread`, nowy stan terminalny `assessed` w `state.ts`, README.

M2 nic nie traci: oczekiwania są rozliczane i zapisywane w fazie extract, z bieżącej wiadomości i 8 poprzednich, nigdy z odpowiedzi Akukiego (`prediction-extractor.ts:119-142`).

Opis w Obsidianie: `doubts, questions.md`, sekcja „Hearing everything, answering the latest”.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 borg: tura assessOnly zapisuje wiadomość, kontakt i nastrój, nie uruchamia przypominania ani deliberacji, nie zostawia znacznika w strumieniu (test)
- [x] #2 borg: assessOnly odrzucone dla tury nieużytkownika (test)
- [x] #3 connector: w kolejce wszystkie oprócz najnowszej są przyjęte, najnowsza dostaje pełną turę, próg przesuwa się za całą kolejkę (test)
- [x] #4 connector: pojedyncza wiadomość działa jak wcześniej; wiadomość w trakcie odpowiedzi czeka do następnego odpytania (test)
- [ ] #5 Wdrożone na VPS i zmierzone na żywym wątku: czas tury przyjęcia i opóźnienie odpowiedzi przy kolejce
- [ ] #6 Sprawdzone na żywej bazie: przyjęte wiadomości mają wpisy M2 (prediction_events) i kontakt w social_profiles
<!-- AC:END -->
