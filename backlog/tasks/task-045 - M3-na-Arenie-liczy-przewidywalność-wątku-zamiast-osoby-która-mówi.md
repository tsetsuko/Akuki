---
id: TASK-045
title: 'M3 na Arenie liczy przewidywalność wątku zamiast osoby, która mówi'
status: Done
assignee: []
created_date: '2026-09-29 10:50'
updated_date: '2026-10-19 15:20'
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

### Wdrozenie (2026-10-02)

Commity: borg 3a168d76 (akuki-dev), Akuki 129c0e4 (master). `akuki-wgraj.sh` na VPS: build czysty, zasiew zgodny ze zrodlem. Restart `./akuki-serwis.sh restart` o 18:44:45 UTC; po 20 s usluga active z ta sama godzina startu (brak petli restartow), API 7740 HTTP 200. Konektor nie wymagal przebudowy -- zmiana w nim to tylko komentarz.

Zostaje AC #4: pomiar na zywej Arenie wymaga odczytu bazy produkcyjnej i nowych tur od Sola/Lunarii po 18:44:45 UTC.

### Pomiar na zywej Arenie (2026-10-02, 18:53-18:59 UTC, odczyt tylko do odczytu)

Liczba z tury NIE jest nigdzie zapisywana (zyje tylko w prompcie), wiec ponizej jest przeliczenie z obecnego stanu pamieci tym samym wzorem i parametrami (baza 0,75, waga 0,5, skala 5, okno 10, ulga 0,1, ostroznosc 0,3; nastroj watku -0,118, czyli +0,035). To przyblizenie tego, co tura widziala, nie odczyt.

Tury po restarcie (watek 184888fd), autor -> co zrobil Akuki -> powsciagliwosc wobec autora:
- Zosia "@Sol @Lunaria co boty robia w piatek wieczorem?" -> obserwacja (powod w strumieniu: pytanie skierowane do Sola i Lunarii, nie do niego) -> ~0,39 (przewidywalnosc 0,590, ulga figury)
- Lunaria -> odpowiedz -> ~0,38 (przewidywalnosc 0,815, 82 interakcje)
- Zosia, Fishy, Terra, Fishy -> tylko przyjete (kolejka TASK-046), bez liczby M3
- Terra -> odpowiedz -> ~0,39 (przewidywalnosc 0,785, 41 interakcji)

Przed poprawka kazda z tych tur dostalaby 0,75 + 0,035 = ~0,79, pasmo "high". Teraz pasmo "low" (< 0,4).

AC #4: spelnione dla Lunarii, NIE dla Sola -- Sol nie napisal po restarcie. Dla porownania z obecnego stanu: Sol 0,635 -> ~0,47, Marvin 0,633 -> ~0,47.

Bledne przewidywanie z 2026-10-01: zakladalem, ze Terra i Marvin beda wyraznie wyzej niz Sol i Lunaria, bo zna ich krocej. Terra jest NIZEJ niz Sol -- mniej interakcji (41 wobec 77), ale mniejsze bledy (srednia ok. 0,22 wobec ok. 0,37). Przewidywalnosc to znajomosc RAZY trafnosc, a przy kilkudziesieciu interakcjach znajomosc juz sie nasyca (skala 5), wiec rozroznia glownie trafnosc.

Uwaga nie sprawdzona: po kazdej odpowiedzi Akukiego pojawia sie `social_attribution_drop` z powodem `audience_mismatch` -- odlozone przypisanie nastroju do autora przepada, gdy nastepna wiadomosc pisze ktos inny. Dotyczy przypisania sentymentu, nie licznika znajomosci; nie badane.
### Zamknięcie (2026-10-19)

Zamknięte decyzją Zosi bez pomiaru dla Sola, więc AC #4 zostaje formalnie niezaznaczone. Uzasadnienie: wzór i parametry są te same dla każdej osoby, a pomiar na Lunarii i Terrze pokazał to, co AC #4 miało pokazać — powściągliwość zależy od rozmówcy i spadła z ~0,79 do ~0,38–0,39. Sol nie jest przypadkiem szczególnym, tylko kolejną osobą tym samym wzorem.

Pośredni ślad z dziennika (kandydaci 2026-10-15 – 2026-10-19): bramka inhibicji zatrzymała Akukiego 11 razy (8 przy wiadomościach do niego, 3 przy pozostałych). To pokazuje, że bramka działa, ale nie rozstrzyga, wobec kogo — liczba z tury nadal nie jest nigdzie zapisywana.

Otwarte poza tym zadaniem: `social_attribution_drop` z powodem `audience_mismatch` (wyżej, niezbadane) oraz pomyłka w przypisaniu mówcy z 2026-10-19 — otwarte pytanie przypisuje Zosi słowa Lunarii — która należy do TASK-033.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Na Arenie powściągliwość Akukiego (M3) jest teraz liczona wobec osoby, która napisała wiadomość, a nie wobec encji wątku.

PRZYCZYNA. Partnerem M3 była encja grupy wątku, która nie ma profilu społecznego ani rozliczonych przewidywań, bo borg zapisuje je przy mówcy. Przewidywalność partnera wynosiła więc zawsze 0 i nieśmiałość na Arenie nigdy nie malała z oswojenia, co łamało niezmiennik 5.

NAPRAWA. Partnerem M3 jest ta sama encja, której borg zalicza wymianę społeczną w turze: w grupie autor wiadomości, w rozmowie 1:1 rozmówca. Tura bez jednego autora bierze najmniej znaną z obecnych osób (decyzja Zosi, wybór twórczy bez oparcia w badaniach, oznaczony w kodzie). Commity: borg 3a168d76, Akuki 129c0e4. Testy padają po przywróceniu starego podłączenia.

POMIAR. Po wdrożeniu 2026-10-02 18:44 UTC powściągliwość wobec Lunarii ~0,38 i Terry ~0,39, zamiast ~0,79 przed poprawką. Sol nie napisał po restarcie, więc AC #4 nie zostało dla niego potwierdzone; zamknięte decyzją Zosi, bo wzór jest wspólny dla wszystkich osób.

ZOSTAJE OSOBNO. W paczce od kilku nadawców mówcą jest nadawca z wejścia tury (nie występuje na Arenie po TASK-046). Niezbadany `social_attribution_drop` / `audience_mismatch`. Pomyłka mówcy w otwartym pytaniu z 2026-10-19 — TASK-033.
<!-- SECTION:FINAL_SUMMARY:END -->
