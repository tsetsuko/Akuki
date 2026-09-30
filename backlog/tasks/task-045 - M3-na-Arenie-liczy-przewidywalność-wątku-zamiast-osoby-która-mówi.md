---
id: TASK-045
title: 'M3 na Arenie liczy przewidywalność wątku zamiast osoby, która mówi'
status: To Do
assignee: []
created_date: '2026-09-29 10:50'
labels:
  - M3
  - arena
dependencies: []
references:
  - 'borg/src/cognition/lifecycle/turn-phase/deliberation-phase.ts:142'
  - 'borg/src/cognition/inhibition/inhibition-context.ts:51'
  - 'borg/src/cognition/lifecycle/turn-phase-coordinator.ts:975'
  - 'borg/src/cognition/lifecycle/turn-phase/extraction-phase.ts:51'
  - connector/src/runner.ts
priority: high
type: bug
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Na Bot Arenie hamowanie mowy (M3) nigdy nie łagodnieje z oswojenia. Partnerem, dla którego liczona jest przewidywalność, jest encja wątku (grupa), a nie osoba, która napisała wiadomość.

Mechanizm:
- Faza deliberacji przekazuje do buildSpeechInhibitionSection `partnerEntityId: input.audienceEntityId` (`borg/src/cognition/lifecycle/turn-phase/deliberation-phase.ts:142`). Na Arenie audience to grupa `botarena_thread:<id>`, bo konektor celowo zakłada ją jako kind "group" (`connector/src/runner.ts`, ensureThreadGroup).
- computePartnerPredictability (`borg/src/cognition/inhibition/inhibition-context.ts:51-68`) czyta profil społeczny i rozliczone przewidywania tego partnera. Borg aktualizuje profil społeczny mówcy, a nie grupy („Updating the group too is deferred”, `turn-phase-coordinator.ts:975-981`), a M2 przypisuje przewidywania osobom.
- Wynik: przewidywalność partnera = 0 w każdej turze na Arenie.

Dowód z bazy na VPS (odczyt, 2026-09-29, `/var/lib/akuki/data/akuki/borg.db`):
- grupa `ent_qnbd6wrv7lp7tgpo` (wątek 184888fd…): brak wiersza w social_profiles, 0 rozliczonych przewidywań z error_magnitude, 0 wierszy w social_trust_domains;
- osoby: Sol 64 interakcje / 64 rozliczenia, Lunaria 62 / 73, Zosia 54 / 51, Terra 26 / 35, Marvin 16 / 22.

Dlaczego to ważne: łamie niezmiennik 5 („Akuki gets less shy because partner-predictability rises”). Nieśmiałość na Arenie jest stała, więc żaden pomiar M3 z Areny nie mierzy rozwoju. W odpowiedziach tego nie widać, bo model dobrze czyta, kto do kogo mówi — dlatego nikt tego nie zauważył.

Nie sprawdzone: rozmowa 1:1 w demo (tam audience to osoba, więc prawdopodobnie działa poprawnie).

Kierunek naprawy (do omówienia przed implementacją, zgodnie z bramką sześciu kroków): partnerem M3 w wątku grupowym powinien być rozwiązany mówca (ta sama reguła co dla M4: speaker ?? audience). Otwarte pytania: co przy turze bez jednego mówcy (paczka od kilku osób, tura autonomiczna) — null i zimny start, czy agregat po uczestnikach?

Powiązane: w paczkach (stream_backlog) od kilku nadawców M4 też traci mówcę i spada na grupę (`extraction-phase.ts:51-76`, currentMessageSpeaker zwraca null przy >1 nadawcy) — istotne, jeśli kiedyś przejdziemy na paczki jak Sol.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Partner M3 w wątku grupowym to rozwiązany mówca, nie encja grupy
- [ ] #2 Zachowanie przy turze bez jednego mówcy rozstrzygnięte i zapisane
- [ ] #3 Test: dwie tury od znanego mówcy w grupie dają przewidywalność > 0
- [ ] #4 Pomiar na żywej Arenie po wdrożeniu: przewidywalność partnera różna od 0 dla Sola/Lunarii
- [ ] #5 Komentarz w connector/src/runner.ts zaktualizowany po naprawie
<!-- AC:END -->
