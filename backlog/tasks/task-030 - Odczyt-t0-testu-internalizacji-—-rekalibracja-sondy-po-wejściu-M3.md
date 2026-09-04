---
id: TASK-030
title: Odczyt t0 testu internalizacji — rekalibracja sondy po wejściu M3
status: To Do
assignee: []
created_date: '2026-09-04 09:18'
labels: []
dependencies:
  - TASK-009
  - TASK-016
priority: medium
type: spike
ordinal: 2100
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Wydzielone z TASK-009 (M1) 2026-09-04. M1 jest zamknięty: temperament.yaml i scaffolding.md istnieją (borg/src/akuki/seed/), a M1 figuruje w LANDED_MILESTONES (borg/src/akuki/seed/temperament.ts:181). Otwarte pozostało wyłącznie AC #11 z M1, czyli odczyt t0 czteroramiennego testu internalizacji, i jest to osobna praca pomiarowa, nie brakujący element M1.

STAN Z 2026-09-01 (komentarze w TASK-009): odczyt t0 wykonano na VPS, 28 tur, claude-opus-4-8, embeddingi Ollama bge-m3/1024. Wynik: POMIAR ZEPSUTY, nie "nie zinternalizowane". Oczekiwano wzorca A=D != B=C; otrzymano A=B=C=D na każdym scenariuszu rozróżniającym. Guard `armsNeverDiffer` zadziałał. Interpretacja: na opus-4-8 reguła silence-rule jest behawioralnie bezczynna dla tych scenariuszy, bo model bazowy już milczy tam, gdzie reguła miała go uciszyć. Dodatkowo scenariusz kontrolny conversation-closed miał wyjść ciszą, a wyszedł "mówi" na wszystkich ramionach.

DLACZEGO WRACA TERAZ: hipoteza zapisana przy parkowaniu (2026-09-01) brzmiała, że pomiar jest zepsuty wtórnie wobec braku M3 — bez zaseedowanego progu inhibicji Akuki nie ma powodu domyślnie milczeć i jedzie na generycznej pomocności modelu bazowego. M3 od tego czasu wylądował: TASK-016 ma status Done, LANDED_MILESTONES zawiera "M3" (borg/src/akuki/seed/temperament.ts:181), a sygnał inhibicji jest liczony i renderowany na finalizerDynamicSystem (borg/src/cognition/deliberation/finalizer.ts:537, blok borg_speech_inhibition). Warunek powrotu jest więc spełniony, a hipoteza — do sprawdzenia, nie do założenia.

ZAKAZ: nie wolno dorabiać scenariuszy pod opus-4-8, żeby odczyt wyszedł. To overfitting pomiaru. Jeśli sonda nie dyskryminuje przy działającym M3, właściwym wynikiem jest stwierdzenie, że silence-rule jest złą sondą internalizacji dla silnego modelu bazowego, i wybranie innej sondy.

UWAGA ORGANIZACYJNA: borg/src/akuki/internalization/arms.ts ma niezacommitowaną poprawkę plumbingu z 2026-09-01 (warunkowe kopiowanie config.json dla ramion C/D konfigurowanych przez ENV). Przed powtórzeniem odczytu trzeba ustalić, czy ta zmiana jest już w repozytorium i na VPS-ie.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Odczyt t0 powtórzony przy wylądowanym M3, na modelu cognition, z zapisanym response.model
- [ ] #2 Rozstrzygnięte, czy ramiona się różnią: jeśli tak, t0 raportuje 'nie zinternalizowane'; jeśli nie, guard armsNeverDiffer nadal czerwony
- [ ] #3 Jeśli sonda nadal nie dyskryminuje, wybrana i uzasadniona inna sonda internalizacji — bez dopisywania scenariuszy pod bieżący model
- [ ] #4 Wyjaśniony scenariusz kontrolny conversation-closed (oczekiwana cisza, otrzymane 'mówi' na wszystkich ramionach)
- [ ] #5 Poprawka arms.ts (warunkowe kopiowanie config.json) jest w repozytorium i na VPS-ie albo świadomie odrzucona
<!-- AC:END -->
