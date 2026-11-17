---
id: TASK-044
title: 'shared-state-compiler: 21,8% tokenów tury, 39 tys. na wywołanie'
status: To Do
assignee: []
created_date: '2026-09-21 13:34'
updated_date: '2026-10-26 11:43'
labels: []
dependencies:
  - TASK-042
priority: medium
type: spike
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Najdroższe pojedyncze miejsce wywołania w pomiarze z `/var/lib/akuki/token-usage.jsonl` (2026-09-15..17): 122 wywołania, 4 769 178 tokenów, 21,8% całości. Rozbicie: input 3 361 267, output 13 617, cache-read 1 051 468, cache-creation 342 826. Około 39 tys. tokenów na wywołanie przy 13,6 tys. tokenów wyjścia łącznie — czyli prawie cały koszt to wielkość wejścia, nie to, co kompilator wypisuje.

Czym to jest. Kompilator wspólnego stanu (`borg/src/cognition/shared-state/compiler.ts`, prompt w `borg/src/cognition/prompts/shared-state.ts`) utrzymuje jedną tablicę na rozmówcę: trwałe ustalenia i ograniczenia obowiązujące w tej relacji. Nie zapisuje zadań, zobowiązań ani faktów społecznych — te mają własne pasma pamięci. Na wejściu dostaje poprzednią wersję tablicy, bieżącą turę i widoczny w prompcie rejestr, a na wyjściu zwraca wyłącznie wywołanie narzędzia z listą operacji na wpisach. Sam prompt nazywa to „kompilatorem struktury": nie ocenia, czy odpowiedź Akukiego jest trafna, i niczego w niej nie zmienia.

Odpala się dwa razy na turę, w dwóch przebiegach: `pre_answer` przed odpowiedzią i `post_response` po niej (122 wywołania na 105 tur to ta para minus tury, w których drugi przebieg nie doszedł do skutku). Podział istnieje po to, żeby trwały fakt powstały z odpowiedzi Akukiego został zapisany dopiero wtedy, gdy ta odpowiedź faktycznie istnieje jako materiał źródłowy.

Dlaczego to jest zadanie, a nie od razu zmiana. Nie wiadomo jeszcze, co dokładnie składa się na te 39 tys. tokenów wejścia: cała poprzednia tablica, ile rejestru, ile historii tury. Dopóki to nie jest rozłożone, każda zmiana byłaby zgadywaniem. Po TASK-042 to wywołanie chodzi na roli recallExpansion, czyli na haiku, więc pilność kosztowa spada pięciokrotnie — ale udział w tokenach zostaje ten sam i wciąż jest największy ze wszystkich.

Osobna obserwacja z tego samego pomiaru, do sprawdzenia przy okazji: `perception-mode-fallback` i `perception-entity-fallback` odpaliły w 105 turach na 105. Ścieżka nazwana „fallback", która odpala się w każdej turze, sugeruje, że ścieżka główna nigdy nie rozstrzyga — a jeśli tak, to jest to osobny, cichy koszt dwóch wywołań LLM na turę.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rozbite, z czego składa się wejście jednego wywołania: poprzednia tablica, rejestr, historia tury — z liczbami tokenów
- [ ] #2 Ustalone, czy oba przebiegi (pre_answer i post_response) są potrzebne w każdej turze
- [ ] #3 Sprawdzone, dlaczego perception-mode-fallback i perception-entity-fallback odpalają w każdej turze
- [ ] #4 Wniosek zapisany: co (jeśli cokolwiek) zmieniamy, wraz z pomiarem, na którym się opiera
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-10-26: Zosia decided to switch the shared-state compiler off for Akuki instead of breaking its input down. It had no reader in M2–M4, and in the 19–25.10 measurement it took 19.8% of input tokens (433 calls, 41k → 66k per call). Implementation is in the TASK-051 notes (flag generation.evidenceLedger.decisionArtifact.enabled). AC #3, why the perception fallbacks fire on every turn, stays open.
<!-- SECTION:NOTES:END -->
