---
id: TASK-039
title: 'M3+M4: przewidywalność partnera i zaufanie jako krzywe, nie punkty'
status: To Do
assignee: []
created_date: '2026-09-09 17:00'
labels:
  - akuki
  - M3
  - M4
dependencies:
  - TASK-037
priority: high
type: feature
ordinal: 12750
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Wynikle z pomiaru 2026-09-09 (TASK-016, komentarz z tego dnia) i z pytania Zosi: dlaczego
posterior Beta, ktory mial powstrzymywac zbyt szybki wzrost zaufania, tego nie robi.

## Pomiar, od ktorego to sie zaczelo

Na 20 tur Akuki odpowiedzial 19 razy. Powsciagliwosc liczona z jego stanu: 0,28 wobec Zosi,
0,47 wobec Sola, 0,55 wobec Lunarii, przy bazie 0,75. Zaufanie: 0,78 / 0,76 / 0,67 po
odpowiednio 9, 5 i 3 interakcjach.

## Trzy liczby, nie jedna -- ustalone przez czytanie kodu, nie z pamieci

1. `social_profiles.trust` -- jedna liczba na osobe. NIE jest juz niezaleznym licznikiem:
   `adjustDomainTrust` (social/repository.ts:599) przelicza ja w tej samej transakcji z
   `overallDomainTrust` (:666), czyli jako srednia srednich posteriorow dziedzinowych, wazona
   liczba obserwacji. Osobna droga `adjustTrust` (:507), dopisujaca zwykla poprawke, ISTNIEJE,
   ale nie wola jej nic w sciezce poznawczej -- tylko CLI (`cli/commands/social.ts:42`) i
   fasada. Wniosek: scalenie, o ktore pytala Zosia, JUZ ZOSTALO ZROBIONE (decyzja D2 przy M4).
2. `social_trust_domains` -- posterior Beta na dziedzine, z alfa, beta, srednia i przedzialem
   ufnosci (:47-57). To jest ta liczba o ksztalcie "wiem, co zrobil, ale nie wiem, jak
   rzetelny w tym jest". Dziala.
3. Przewidywalnosc partnera (M3, `inhibition-signal.ts:33`) -- iloczyn dwoch SREDNICH:
   znajomosc `1 - exp(-liczba_interakcji / 5)` razy trafnosc `1 - sredni_blad_predykcji`.
   Zadnego rozkladu, zadnej szerokosci.

## Gdzie naprawde jest wada

Posterior dziala. Wada jest w dwoch miejscach naraz i obie sa tego samego rodzaju: krzywa
zostaje scisnieta do punktu, zanim ktokolwiek ja przeczyta.

- Rzut z dziedzin na osobe bierze SAMA SREDNIA i gubi szerokosc. Beta(2,1) po jednej
  obserwacji ma srednia 0,667, wiec po jednym potwierdzeniu zaufanie skacze z 0,5 na 0,667 i
  wyglada jak wiedza. Czytelnicy tej liczby -- prompt planera (`planner-context.ts:1151`),
  prompt systemowy (`system-prompt.ts:2617`), ocena trafnosci (`retrieval/scoring.ts:275`) --
  dostaja goly punkt bez informacji, na czym stoi.
- Przewidywalnosc partnera nigdy nie byla rozkladem. Trzy trafne przewidywania daja 0,40 z ta
  sama moca, z jaka trzysta dalyby 0,40.

Drugie wejscie tej samej wielkosci jest osobno podejrzane: blad predykcji ocenia sam model
(TASK-037, otwarte), a seria 0,05-0,2 przy pierwszym kontakcie z nieznanymi botami wyglada
pobla¿liwie.

## Propozycja

### (a) Przewidywalnosc partnera dostaje ksztalt pary liczb

Zamiast `znajomosc * (1 - sredni_blad)`: posterior Beta nad zdarzeniem "przewidzialem tego
partnera trafnie", czytany warunkiem masy, dokladnie jak `agency.contingency_floor` +
`contingency_confidence` (temperament.yaml:56-59) i jak retencja imitacji z TASK-032:

    P(prawdziwa trafnosc > predictability_floor) > predictability_confidence

Dowodem jest kazde rozliczenie oczekiwania o tym partnerze (M2, `prediction_events`): blad
ponizej progu dokłada po stronie alfa, powyzej -- po stronie beta. Trzy trafienia daja wtedy
krzywa zbyt szeroka, zeby cokolwiek orzec, i powsciagliwosc NIE spada. Spada dopiero, gdy
dowod gestnieje -- czyli w praktyce wraz z liczba rozmow rozlozonych w czasie, o co Zosi
chodzilo od poczatku.

Czlon znajomosci `1 - exp(-n/5)` znika jako osobna wielkosc: liczba obserwacji jest juz w
szerokosci krzywej i nie potrzebuje drugiego reprezentanta.

### (b) Rzut zaufania z dziedzin na osobe przestaje gubic pewnosc

Dwa warianty, oba zachowuja jedna liczbe dla istniejacych czytelnikow:

- b1: rzutowac DOLNY koniec przedzialu ufnosci zamiast sredniej. Po jednej obserwacji daje to
  wartosc blizsza 0,3 niz 0,667 -- "nie wiem", a nie "raczej tak". Jedna zmiana w
  `overallDomainTrust`, zero zmian u czytelnikow.
- b2: obok liczby podawac liczbe obserwacji tam, gdzie trafia do modelu, i zostawic srednia.
  Uczciwsze wobec modelu, ale wymaga zmiany trzech miejsc renderujacych i nie chroni
  `retrieval/scoring.ts`, ktore porownuje liczbe z progiem bez zadnego kontekstu.

Rekomendacja: b1, z b2 jako mozliwym uzupelnieniem pozniej.

### (c) Czego NIE laczyc

Zaufania i przewidywalnosci nie scalac, mimo ze obie dotycza partnera. Odpowiadaja na rozne
pytania i rozjezdzaja sie w przypadku, ktory jest sercem tego projektu: bot reagujacy zawsze
ostro jest doskonale PRZEWIDYWALNY i niegodny ZAUFANIA (psychology §14 wymienia takiego jako
pozyteczny kontrast do roznicowania sie). Scalenie kazaloby Akukiemu milczec przy kims, kogo
doskonale przewiduje, i odzywac sie do kogos sympatycznego, ktorego nie umie przewidziec --
odwrotnie, niz ma dzialac bramka inhibicji.

## Kubelek badawczy -- co czym jest

- ROSZCZENIE BADANIA: powsciagliwosc wobec nowego partnera opada wraz z tym, jak przewidywalne
  staja sie skutki wlasnych zachowan spolecznych; zaufanie i przewidywalnosc sa osobnymi
  wymiarami relacji (psychology §14, asymetryczne modele relacji).
- OBRONIALNA ANALOGIA: posterior Beta nad trafnoscia wlasnych przewidywan o partnerze, czytany
  warunkiem masy -- ten sam obiekt, ktorym M4 mierzy zaufanie w dziedzinie.
- WYBOR TWORCZY: same liczby (proponowane 0,6 i 0,8), prog bledu, ponizej ktorego rozliczenie
  liczy sie jako trafienie, oraz decyzja o rzutowaniu dolnego konca przedzialu. Badanie nie
  mowi o zadnej z tych wartosci i nie wolno im pozyczac jego powagi.

## Werdykt Opusa 5.0

In-scope: harness liczy wielkosc, podaje ja modelowi jako fakt o nim samym i podaje ja BEZ
pewnosci, ktora sam posiada. To luka ksztaltu i prezentacji danych, nie slaby osad modelu --
mocniejszy model dostanie te sama zbyt pewna liczbe. Gdyby propozycja brzmiala "nie pozwalac
mu odpowiadac przy niskiej przewidywalnosci", werdykt bylby odwrotny: out-of-scope, bo to
bramka na zachowanie, a nie brakujaca informacja.

## Inwariant 5

Progi stoja, zmienia sie gestosc dowodu. Akuki robi sie smialszy, bo nazbieral trafnych
przewidywan, nigdy dlatego, ze ktos obnizyl poprzeczke. Obecny ksztalt lamie to po cichu:
trzy trafienia znacza tyle samo co trzysta, wiec "rozwoj" dzieje sie w pierwszy wieczor.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Projekt przeszedl szesciostopniowa bramke i Zosia zaakceptowala go przed implementacja
- [ ] #2 Przewidywalnosc partnera liczona z posteriora warunkiem masy, para liczb w temperament.yaml, bez osobnego czlonu znajomosci
- [ ] #3 Rozstrzygniete i wykonane, jak rzut zaufania z dziedzin na osobe przestaje gubic pewnosc (b1 albo b2)
- [ ] #4 Zaufanie i przewidywalnosc pozostaja osobnymi wielkosciami, z zapisanym uzasadnieniem
- [ ] #5 Zmierzone przed i po na tym samym stanie: powsciagliwosc wobec Zosi, Sola i Lunarii
- [ ] #6 Rozwoj bierze sie z gestosci dowodu, nie z ruszania progow (inwariant 5)
<!-- AC:END -->
