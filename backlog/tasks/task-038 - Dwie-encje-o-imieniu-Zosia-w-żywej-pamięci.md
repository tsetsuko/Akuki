---
id: TASK-038
title: 'Dwie encje o imieniu Zosia w żywej pamięci — znajomość rozdzielona na dwie osoby'
status: To Do
assignee: []
created_date: '2026-09-09 16:10'
labels:
  - akuki
  - M3
  - M4
dependencies: []
priority: high
type: bug
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Zmierzone 2026-09-09 na zywej pamieci na VPS-ie, odczytem tylko do odczytu przez
`akuki-niesmialosc-check.sh`. Tabela `social_profiles` ma CZTERY wiersze, a wsrod nich DWA
osobne wiersze o nazwie `Zosia`:

    Zosia    | interakcji: 9 | zaufanie: 0,778
    Sol      | interakcji: 5 | zaufanie: 0,760
    Lunaria  | interakcji: 3 | zaufanie: 0,667
    Zosia    | interakcji: 3 | zaufanie: 0,667

To sa dwie rozne encje, nie jeden wiersz policzony dwa razy: profil spoleczny jest kluczowany
identyfikatorem encji.

DLACZEGO TO NIE JEST KOSMETYKA. Powsciagliwosc Akukiego (M3) maleje wraz z liczba interakcji
z danym partnerem. Rozdzielenie Zosi na dwie osoby po 9 i 3 interakcje daje inna liczbe niz
jedna osoba z 12 — a wiec jego zachowanie wobec niej jest liczone z zanizonej znajomosci.
Zaufanie per dziedzina (M4) i prowenienecja nabycia wskazuja identyfikator encji, wiec ta sama
rozbieznosc dotyczy tego, komu wierzy i od kogo sie uczy.

TO JEST TEN SAM RODZAJ AWARII CO `alice`, TYLKO CICHSZY. Tamta byla widoczna, bo Akuki
zwrocil uwage na obce imie. Tutaj obie encje nazywaja sie tak samo, wiec w rozmowie nic tego
nie zdradzi — objawem jest wylacznie liczba w bazie.

DO USTALENIA PRZED NAPRAWA (kolejnosc ma znaczenie):
1. Skad wzial sie drugi wiersz: czy powstal przy naprawie etykiety rozmowcy 2026-09-08, przy
   pierwszym kontakcie przez konektor, czy jeszcze inaczej. Rozstrzyga to porownanie
   `created_at` obu encji z data naprawy i z pierwsza tura na Arenie.
2. Ktora encja jest ta z seeda (`user_declared`, rola `creator`, identyfikator
   `ent_ry4lo3ia73wug8pz`), a ktora powstala pozniej i z jaka prowenienecja nazwy.
3. Czy scalenie jest bezpieczne, czyli co jeszcze wskazuje na te druga encje — epizody, wiersze
   spoleczne, wydarzenia tozsamosciowe, wpisy strumienia. Scalanie encji rusza pamiec i wymaga
   osobnej zgody Zosi oraz kopii zapasowej przed wykonaniem.

Uwaga: naprawa etykiety rozmowcy z 2026-09-08 stemplowala sesje domyslna przy KAZDYM starcie
wlasnie po to, zeby nie tworzyc drugiej osoby o tym samym imieniu, i wtedy zadzialala
(dowodem byla rownosc identyfikatorow). Ten wiersz jest wiec albo starszy od naprawy, albo
powstal inna droga niz sesja demo — najpewniej przez konektor Areny.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ustalone i zapisane, skad wzial sie drugi wiersz Zosi, z porownaniem dat i prowenienecji nazwy
- [ ] #2 Rozstrzygniete, ktore wiersze w calej bazie wskazuja na kazda z dwoch encji
- [ ] #3 Decyzja o scaleniu albo pozostawieniu podjeta przez Zosie, po kopii zapasowej
- [ ] #4 Jesli scalenie: znajomosc i zaufanie po scaleniu porownane z wartosciami sprzed, zeby bylo widac, co sie zmienilo
- [ ] #5 Zamkniete zrodlo powstawania drugiej encji, a nie tylko skutek
<!-- AC:END -->
