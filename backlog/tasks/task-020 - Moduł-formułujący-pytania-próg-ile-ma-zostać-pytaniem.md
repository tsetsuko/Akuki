---
id: TASK-020
title: Moduł formułujący pytania + próg (ile ma zostać pytaniem)
status: To Do
assignee: []
created_date: '2026-08-21 12:26'
labels: []
dependencies: []
ordinal: 3500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pomysł Zosi: modularność mózgu. Moduł, ktory odpala sie na okreslone zdarzenia i formuluje pytania. Plus prog - nie wszystko ma stawac sie otwartym pytaniem.

BORG JUZ JEST MODULARNY - nie wymyslamy modularnosci, dokladamy jeden modul.
 - Ruminator: konsumuje otwarte pytania, moze rozwiazac / podbic pilnosc / porzucic zwietrzala niepewnosc / scalic duplikaty / wystawic growth marker. Gdy nie rozstrzyga, zapisuje prywatna notatke z zywymi napieciami i rozwazonymi dowodami, zeby nastepna wizyta kontynuowala, a nie zaczynala od zera.
 - Reflector: znajduje wzorce miedzy epizodami, ale NIE zapisuje ich jako przekonan - kazdy wniosek idzie jako kandydat do review, -confidence kept conservative so a proposed pattern stays reviewable rather than asserted-. To JUZ jest mechanizm progu.
 - Otwarte pytania maja juz SZESC zrodel: reflection, DETEKCJA SPRZECZNOSCI, review hooks, rumination, overseer, wejscie uzytkownika.
 - Warstwa autonomii: conditions to progi na stanie (wzor: conditions/mood-valence-drop.ts), triggers to czas.

CZEGO NAPRAWDE BRAKUJE (wezsze niz -modularnosc mozgu-):
 1. zrodla pytan napedzanego ZASKOCZENIEM - dzis niemozliwe, bo nie ma petli predykcji (M2)
 2. progu skalibrowanego pod psychologie rozwojowa, a nie pod bezpieczenstwo utrzymania

PROG MA KONKRETNY WYNIK ZA SOBA: Kidd, Piantadosi & Aslin (2012), efekt Goldilocks - niemowleta odwracaja wzrok od zdarzen ZBYT przewidywalnych ORAZ zbyt nieprzewidywalnych; uwaga jest najwyzsza przy zaskoczeniu POSREDNIM. To jest podstawa empiryczna dla target_error_band [0.3, 0.7]. Regula: pytanie powstaje, gdy zaskoczenie jest POSREDNIE I REDUKOWALNE, nie gdy jest duze. Duze ale nieredukowalne to szum, a gonienie za szumem to nie ciekawosc.

OSTRZEZENIE (to samo zastrzezenie, ktore Zosia zglosila do menu dzialan): modularnosc w kognitywistyce jest sporna. Fodor (wiele wrodzonych, zamknietych modulow) jest mocno krytykowany. Core knowledge (Spelke, Carey) uzasadnia tylko MALA liczbe wrodzonych systemow: obiekty, agenci, liczba, przestrzen. Neurokonstruktywizm (Karmiloff-Smith): moduly WYLANIAJA SIE w rozwoju - modularyzacja, nie modularnosc. Czyli: recznie zaprojektowane dziesiec modulow = zaprojektowany dorosly Akuki, dokladnie ten sam blad co menu dzialan. Malo modulow, kazdy uziemiony w czyms, z czym niemowleta faktycznie startuja.

GDZIE PADA GRANICA -BEZ UDAWANIA-:
 - UDAWANIE: zapytac model -jakie pytanie powinienes miec?-. Prompt przebrany za mechanizm.
 - MECHANIZM: wyzwalacz LICZONY ZE STANU (czy zaskoczenie jest w pasmie redukowalnym? czy dotyczy kogos waznego? czy przeczy przekonaniu, ktore juz ma?). Dopiero po otwarciu bramki model SFORMULOWAC pytanie slowami.
 Decyzja mechaniczna, sformulowanie jezykowe. borg juz tak dziala - ruchy Ruminatora to strukturalne wywolania narzedzi, nie wolna proza.

KOLEJNOSC: samego modulu nie da sie zbudowac przed M2 (glowny wyzwalacz to blad predykcji). Co MOZNA wczesniej: polityka progu na papierze - ktore zdarzenia z par. 13 kwalifikuja sie i jak rzadkie ma byc -rzadkie- (par. 12: -meaningful development should be relatively sparse-).

WYMAGA ZGODY. Zadanie projektowe.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Potwierdzone, ktore zrodla pytan borg juz ma, a ktorych brakuje
- [ ] #2 Prog oparty na zaskoczeniu POSREDNIM i REDUKOWALNYM, nie na wielkosci
- [ ] #3 Wyzwalacz liczony ze stanu; model tylko formuluje slowa
- [ ] #4 Liczba modulow mala i uziemiona, nie recznie zaprojektowany zestaw
- [ ] #5 Zosia zaakceptowala projekt przed implementacja
<!-- AC:END -->
