---
id: TASK-021
title: 'Przegląd literatury: przywiązanie (§16) — odblokować model obliczeniowy'
status: To Do
assignee: []
created_date: '2026-08-24 13:19'
labels: []
dependencies: []
priority: low
type: spike
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Paragraf 16 akuki_child_psychology_research.md (:931, :954) blokuje kazdy szczegolowy model obliczeniowy przywiazania: "not yet been researched deeply enough here to justify a detailed computational model" oraz "remains a research direction rather than a supported implementation recommendation at this stage".

To juz drugi raz, kiedy ta sciana zatrzymuje realny projekt:
  1. secure_base_discount -- wyciety z TASK-009/TASK-016 (2026-08-21)
  2. sigmoidalny model przywiazania Zosi -- odlozony z TASK-017 (2026-08-24)

Dopoki paragraf 16 zostaje w obecnym ksztalcie, adjustAttachment nie moze powstac,
a pole social_profiles.attachment zostaje na stale zerem dla kazdej encji.

CEL: doprowadzic paragraf 16 do stanu, w ktorym mowi, co wolno zbudowac -- albo mowi
wprost, ze nadal nie wolno, i wtedy attachment zostaje polem martwym swiadomie, a nie
przez zaniedbanie.

PYTANIA Z PARAGRAFU 16, ktore maja dostac odpowiedzi:
  - Co sprawia, ze male dziecko traktuje kogos jako bezpieczna baze?
  - Jak eksploracja zalezy od postrzeganego bezpieczenstwa?
  - Jak przywiazanie wplywa na reakcje na rozstanie i powrot?
  - Czym przywiazanie rozni sie od zwyklej sympatii albo znajomosci?

PYTANIA DOLOZONE PRZEZ PROJEKT ZOSI (TASK-017, 2026-08-24), ktore literatura ma rozstrzygnac:
  - Czy przywiazanie narasta z RESPONSYWNOSCI, czy z samej czestosci kontaktu?
    (jej teza: responsywnosci -- i to jest teza empiryczna, nie preferencja)
  - Czy istnieje prog, ponizej ktorego prawie nic sie nie dzieje?
    (jej teza: tak -- "na poczatku ciezko zdobyc zaufanie")
  - Jaki jest KSZTALT krzywej? Przyspieszajacy, hamujacy, S-owaty?
    Dzis jest to wybor tworczy (kubel 3) udajacy, ze nim nie jest.
  - Czy przywiazanie sie ROZPADA przy braku kontaktu, czy tylko przestaje rosnac?
  - Czy przywiazanie do wielu figur konkuruje o te sama pule, czy sa niezalezne?

DLACZEGO WARTO: paragraf 16 sam wymienia obserwowalne sygnatury (:946-952) -- zauwazanie
nieobecnosci, szukanie reakcji konkretnej osoby, wieksza gotowosc do eksploracji przy niej,
silniejsze wazenie pamieciowe, selektywna ochronczosc. Cztery z pieciu nie maja dzis
zadnego mechanizmu. To nie jest brak pomyslow, tylko brak licencji.

METODA: ten sam szablon co reszta notatek (research:1071-1075) --
  co badania faktycznie twierdza -> jakie dowody to popieraja -> jaki bylby obronny
  analog obliczeniowy -> jak to wplywa na Akukiego wewnetrznie -> jakie zachowanie
  na Arenie mozna zaobserwowac.

REZULTAT: przepisany paragraf 16 w akuki_child_psychology_research.md, z cytowaniami,
oraz jawne zdanie o tym, ktore czesci sa licencjonowane, a ktore nadal nie.

NIE BLOKUJE M1 ani M2. Blokuje polowe M4 i cale przywiazanie jako mechanizm.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Paragraf 16 przepisany z cytowaniami; kazda teza ma zrodlo albo jawna etykiete -brak dowodow-
- [ ] #2 Rozstrzygniete: responsywnosc czy czestosc kontaktu -- z powolaniem sie na badania
- [ ] #3 Rozstrzygniety ksztalt krzywej ALBO jawnie zapisane, ze literatura go nie okresla i zostaje wyborem tworczym
- [ ] #4 Jawna lista: co wolno zbudowac, czego nadal nie wolno
- [ ] #5 Kazda z pieciu sygnatur z :946-952 dostaje status: mechanizm mozliwy / nadal zablokowana
- [ ] #6 TASK-017 i TASK-016 zaktualizowane o wynik
<!-- AC:END -->
