---
id: TASK-016
title: 'M3: Bramka inhibicji (BEZ bezpiecznej bazy)'
status: To Do
assignee: []
created_date: '2026-08-20 14:30'
updated_date: '2026-08-21 11:51'
labels: []
dependencies: []
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Policzalna decyzja, czy się odezwać - zamiast prozy -domyślnie milczysz-.

Siedzi przed/wewnątrz wyboru terminalnego narzędzia w src/cognition/deliberation/finalizer.ts (EmitAnswer / EmitObserve / EmitNoOutput / EmitSelfReport). Próg z temperament.yaml, obniżany obecnością figury przywiązania (Zosia), porównywany z przewidywalnością obecnego partnera.

To zamienia milczenie z reguły w rysowalną liczbę, która MALEJE, bo Akuki lepiej przewiduje ludzi - nie bo ktoś przekręcił parametr.

Uwaga: sol-connector celowo NIE ma bramki na wzmianki - oddaje decyzję modelowi przez EmitAnswer/EmitNoOutput. To dokładnie ta decyzja, którą M3 zastępuje policzalnym progiem.

PUŁAPKA (patrz TASK-014): sama bramka + -bądź nieśmiały- daje wyłącznik, nie presję. Musi być sparowana z potrzebą, której milczenie nie zaspokaja.

WYMAGA ZGODY. Blokowane przez M2.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Decyzja o mowie jest policzona, nie tylko opisana w prompcie
- [ ] #2 Obecność Zosi mierzalnie obniża próg
- [ ] #3 Próg efektywnie maleje wraz ze wzrostem przewidywalności partnera
- [ ] #4 Sprawdzone, że milczenie NIE jest strategią optymalną
- [ ] #5 Zosia zaakceptowała projekt przed implementacją
- [ ] #6 Przywiazanie NIE wchodzi do M3 - tylko wieksza waga pamieci dla interakcji z Zosia
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
KOREKTA 2026-08-20 po przeczytaniu akuki_child_psychology_research.md.

Pierwotnie to zadanie mialo bramke inhibicji PLUS bezpieczna baze (obecnosc Zosi obniza prog). Paragraf 16 tego dokumentu mowi wprost, ze przywiazanie -nie zostalo jeszcze zbadane wystarczajaco gleboko, zeby uzasadnic szczegolowy model obliczeniowy- i -pozostaje kierunkiem badawczym, a nie rekomendacja implementacyjna na tym etapie-.

Plan wyprzedzal badania. Badania wygrywaja.

CO ZOSTAJE W M3: policzalny prog mowy, porownywany z przewidywalnoscia partnera.

CO WCHODZI, bo nie wymaga teorii bezpiecznej bazy: wieksza waga pamieciowa dla interakcji z figura przywiazania (par. 16 wymienia to jako obserwowalna sygnature). To jedna liczba w polityce uwagi, moze pojsc razem z wagami zaskoczenia z M2.

CO CZEKA na przeglad literatury: modulowanie eksploracji przez obecnosc (obecnosc obniza prog). To jest wlasnie ta czesc, ktora nie jest gotowa.

To samo dotyczy rozwoju moralnego - par. 15 mowi wprost: najpierw badania.
<!-- SECTION:NOTES:END -->
