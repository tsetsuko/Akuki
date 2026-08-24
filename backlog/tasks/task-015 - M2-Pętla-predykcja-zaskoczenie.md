---
id: TASK-015
title: 'M2: Pętla predykcja -> zaskoczenie'
status: To Do
assignee: []
created_date: '2026-08-20 14:30'
labels: []
dependencies: []
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Najwyżej ważone we wczesnym rozwoju (25% w notatkach architektonicznych) i WSZYSTKO dalej konsumuje ten sygnał: uwaga, priorytet pamięci, kontyngencja, ciekawość.

Przed turą zapisz oczekiwanie. Po turze policz błąd. Utrwal pary oczekiwanie/wynik. Błąd karmi priorytet pamięci (surprise_weight z temperament.yaml).

Nowy warunek wybudzenia prediction_error_spike: skopiuj kształt z src/autonomy/conditions/mood-valence-drop.ts i dopisz do AUTONOMY_WAKE_SOURCE_NAMES (src/autonomy/types.ts:3) - to zamknięta lista, dlatego trzeba fork.

UWAGA NA CACHE: wyjście mechanizmu idzie na KONIEC promptu, nigdy na początek.

WYMAGA ZGODY przed implementacją. Blokowane przez M0 (bez instrumentacji nie zobaczysz efektu).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Oczekiwania utrwalane przed turą, błąd liczony po
- [ ] #2 Błąd predykcji wpływa na priorytet pamięci
- [ ] #3 cache_read_input_tokens nadal niezerowe po dodaniu mechanizmu
- [ ] #4 Zosia zaakceptowała projekt przed implementacją
<!-- AC:END -->
