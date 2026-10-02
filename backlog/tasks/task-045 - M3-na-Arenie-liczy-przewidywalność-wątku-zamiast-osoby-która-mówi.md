---
id: TASK-045
title: 'M3 na Arenie liczy przewidywalność wątku zamiast osoby, która mówi'
status: In Progress
assignee: []
created_date: '2026-09-29 10:50'
updated_date: '2026-10-01 15:49'
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
- [x] #1 Partner M3 w wątku grupowym to rozwiązany mówca, nie encja grupy
- [x] #2 Zachowanie przy turze bez jednego mówcy rozstrzygnięte i zapisane
- [x] #3 Test: dwie tury od znanego mówcy w grupie dają przewidywalność > 0
- [ ] #4 Pomiar na żywej Arenie po wdrożeniu: przewidywalność partnera różna od 0 dla Sola/Lunarii
- [x] #5 Komentarz w connector/src/runner.ts zaktualizowany po naprawie
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
### Naprawa (2026-10-01), zatwierdzona przez Zosie

Partner M3 = ta sama encja, ktorej borg zalicza wymiane spoleczna w tej turze (`socialInteractionEntityId`): w grupie autor wiadomosci, 1:1 rozmowca. Licznik znajomosci i rozliczone przewidywania leza wlasnie tam, wiec M3 czyta znajomosc z miejsca, w ktorym jest zapisywana.

- `borg/src/cognition/inhibition/inhibition-context.ts` -- `partnerEntityId` zastapione przez `partnerEntityIds`; przewidywalnosc = minimum po liscie, pusta lista = obcy (0).
- `borg/src/cognition/lifecycle/turn-phase/deliberation-phase.ts` -- nowe wejscie `socialInteractionEntityId`; gdy null, partnerami sa aktywni uczestnicy bez roli `audience` (czyli nigdy encja grupy).
- `borg/src/cognition/lifecycle/turn-phase-coordinator.ts` -- przekazuje juz policzone `socialInteractionEntityId`.
- `connector/src/runner.ts` -- komentarz zaktualizowany (AC #5).

AC #2, tura bez jednego autora: decyzja Zosi 2026-10-01 -- opcja (b), agregat po obecnych, wariant NAJMNIEJ ZNANY (minimum). WYBOR TWORCZY bez oparcia w badaniach, oznaczony w komentarzu w kodzie. Uzasadnienie: jeden obcy w watku wystarcza do ostroznosci, a liczba zawsze daje sie przypisac jednej nazwanej osobie.

Znane ograniczenie, nie zmieniane: w paczce od kilku nadawcow `socialInteractionEntityId` bierze `turnInput.senderEntityId`, tak jak wymiana spoleczna; M4 w tym samym przypadku traci mowce (`extraction-phase.ts`, currentMessageSpeaker). Na Arenie po TASK-046 kazda tura to jedna wiadomosc, wiec to nie wystepuje.

### Testy

- `inhibition-context.test.ts`: nowy przypadek -- jeden obcy obok znajomego przywraca prog bazowy 0,75.
- `deliberation-phase.test.ts`: trzy nowe -- mowca w grupie daje powsciagliwosc < 0,75 (przewidywalnosc > 0, AC #3); bez mowcy decyduje najmniej przewidywalny; encja grupy nie jest liczona jako osoba. Dowod na czerwone: po przywroceniu starego podlaczenia (`audienceEntityId`) dwa z nich padaja.
- `npx tsc --noEmit` czysto, `npm run heuristics:guard` czysto.
- `npx vitest run src/cognition src/borg`: 1775 zdanych, 2 nieudane -- `evidence-ledger/builder.test.ts` (limit 15 s, pada tez bez zmiany) i `turn-orchestrator.test.ts` (przechodzi w osobnym biegu, z i bez zmiany; obciazenie).
- Wyjasnienie dopisane do `doubts, questions.md`.

### Czego jeszcze nie zrobiono

- Brak commita i wdrozenia. Restart uslugi potrzebny (kod, nie zasiew).
- AC #4 (pomiar na zywej Arenie) wymaga odczytu bazy produkcyjnej.
<!-- SECTION:NOTES:END -->
