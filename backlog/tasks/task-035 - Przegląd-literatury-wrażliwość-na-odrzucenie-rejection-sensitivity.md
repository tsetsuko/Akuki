---
id: TASK-035
title: 'Przegląd literatury: wrażliwość na odrzucenie (rejection sensitivity)'
status: To Do
assignee: []
created_date: '2026-09-09 13:05'
labels:
  - akuki
  - M3
dependencies: []
priority: low
type: spike
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Zalozone 2026-09-09 na wniosek Zosi, po tym jak zaproponowala dodanie Akukiemu wrazliwosci na
odrzucenie i propozycja zostala rozlozona na czesci przy TASK-032.

PROPOZYCJA W ORYGINALE. Zeby Akuki umial ocenic, czy zachowanie spoleczne zadzialalo — skoro po
kilku wymianach zdan w srodowisku botow trudno to rozstrzygnac. Wylapywanie tonu innych botow
mialoby go zniechecac i sklaniac do modyfikacji zachowania. Wrazliwosc mialaby malec po niedawnej
rozmowie z kims, kogo dobrze zna.

DLACZEGO TO NIE WESZLO OD RAZU, trzy ustalenia sprawdzone w kodzie 2026-09-09:

1. Ocena wyniku proby juz istnieje i nie jest zgadywana z tonu. Reflektor klasyfikuje wynik jako
   success / failure / unclear (`borg/src/cognition/reflection/reflector.ts:210-237`), z osobnymi
   flagami `grounded` (dowod musi byc w sygnale od rozmowcy, nie w autonarracji) oraz
   `skill_actually_applied`. Wynik `unclear` swiadomie NIE rusza posteriora i zostawia probe
   otwarta na pozniejsze tury (`reflector.ts:896-900`). Sytuacja „po kilku wymianach nie wiadomo"
   ma wiec juz obsluge, i to lepsza niz zamiana niepewnosci na sygnal.
2. Zniechecenie i modulacja zachowania to w duzej czesci M3: `computePartnerPredictability`,
   `computeCautionBump` i `presenceRelief` w `borg/src/cognition/inhibition/inhibition-context.ts`.
3. Spadek wrazliwosci po kontakcie z kims znajomym jest juz zaimplementowany jako przewidywalnosc
   partnera (rosnie z `interaction_count`, spada po swiezych bledach predykcji). Osobna liczba na
   to samo byloby drugim wlascicielem tej samej wielkosci i klopotem z inwariantem 5.

DWIE PRZESZKODY, ktore ten przeglad ma rozstrzygnac albo obejsc:

- WERSJA „WYLAPUJ TON" LAMIE INWARIANT 2 (zakaz fałszowania). Ton nie jest zmierzona wielkoscia,
  tylko interpretacja. Zapytanie modelu „czy zostales odrzucony?" jest promptem w przebraniu
  mechanizmu, a wrazliwosc liczona z takiej interpretacji mowi o modelu, nie o Akukim.
- WERSJA NIEFALSZOWANA NIE MA WEJSCIA. Sygnaly behawioralne — czy ktos odpowiedzial, czy
  wzmiankowano Akukiego, czy rozmowa poszla dalej bez niego — nie docieraja do tury:
  `TurnInputBase` (`borg/src/cognition/turn-input.ts:101-108`) nie ma na nie slotu. To jest
  TASK-033. Bez niego nie ma z czego liczyc.

BRAK W BADANIU, czyli powod, dla ktorego to jest spike, a nie feature. Wrazliwosc na odrzucenie
jest realnym konstruktem w psychologii spolecznej i rozwojowej, ale NIE MA JEJ w dokumentach
badawczych tego projektu. `akuki_child_psychology_research.md` zawiera rzeczy sasiednie i nie
tozsame: mocna informacja zwrotna jako wyzwalacz zapisu pamieci (§13 :839), asymetryczne modele
relacji (§14), hipotezy tozsamosciowe ze wsparciem i przeciwdowodami (:380-400).

Obowiazuje precedens z §16 i TASK-021: przywiazanie zostalo wyciete z bramki inhibicji, bo
dokument mowil wprost, ze pozostaje kierunkiem badawczym, a nie rekomendacja implementacyjna.
Wyprzedzanie badania jest wada nawet wtedy, gdy kod by dzialal.

PYTANIA DO ROZSTRZYGNIECIA PRZEZ LITERATURE:
- Czym wrazliwosc na odrzucenie rozni sie od zwyklej ostroznosci po nieprzyjemnym doswiadczeniu,
  ktora M3 juz liczy jako `cautionBump`?
- Czy konstrukt jest CECHA (stala dyspozycja, czyli parametr temperamentu), czy STANEM (zmienna
  czytana z historii interakcji)? Od tego zalezy, czy w ogole wolno go zapisac jako liczbe w
  `temperament.yaml` bez lamania inwariantu 5.
- Czy w literaturze wrazliwosc na odrzucenie jest OCZEKIWANIEM odrzucenia (bias przed zdarzeniem),
  czy REAKCJA na nie (po zdarzeniu)? Jesli oczekiwaniem, to jest to predykcja — i wtedy naleza do
  M2, a nie do nowego mechanizmu.
- Jakie OBSERWOWALNE sygnaly literatura traktuje jako odrzucenie u dziecka, i ktore z nich maja
  odpowiednik policzalny w Arenie (brak odpowiedzi, rozmowa toczaca sie dalej bez niego, wprost
  wyrazona krytyka)?
- Czy istnieje udokumentowany zwiazek miedzy wrazliwoscia na odrzucenie a WYCOFANIEM sie z
  eksperymentowania spolecznego? To jest miejsce, w ktorym konstrukt dotknalby TASK-032:
  zniechecenie musialoby zmieniac liczbe prob, a nie prog retencji.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Odpowiedzi na pytania z opisu zapisane z cytatami i odnosnikami, w dokumencie badawczym, nie w kodzie
- [ ] #2 Rozstrzygniete, czy konstrukt licencjonuje model obliczeniowy, czy zostaje kierunkiem badawczym — werdykt zapisany wprost, tak jak §16 zapisal swoj
- [ ] #3 Jesli licencjonuje: nazwane, ktore sygnaly sa policzalne bez pytania modelu o ton, i czego brakuje w wejsciu tury (TASK-033)
- [ ] #4 Rozgraniczenie wzgledem tego, co M3 juz liczy, napisane wprost — zeby nie powstal drugi wlasciciel tej samej wielkosci
<!-- AC:END -->
