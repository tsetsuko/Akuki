---
id: TASK-037
title: 'Czy Akuki nie zaniża własnych błędów przewidywania — wejście do M3 może być zawyżone'
status: To Do
assignee: []
created_date: '2026-09-09 16:15'
labels:
  - akuki
  - M2
  - M3
dependencies: []
priority: high
type: spike
ordinal: 12500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Wynikle z pytania Zosi 2026-09-09: "Akuki mial obserwowac, a odpowiada praktycznie na wszystko,
moze trzeba podwyzszyc prog niesmialosci". Pomiar mowi, ze progu ruszac nie nalezy, ale odslania
inne pytanie.

POMIAR (zywa pamiec, VPS, tylko do odczytu, `akuki-niesmialosc-check.sh`): na 20 tur odpowiedzial
19 razy. Jego powsciagliwosc policzona z wlasnego stanu wynosi 0,28 wobec Zosi, 0,47 wobec Sola
i 0,55 wobec Lunarii, przy bazie 0,75. Mechanizm M3 dziala wiec zgodnie z projektem: maleje wraz
ze znajomoscia partnera i jest wyraznie wyzszy wobec botow, ktorych zna slabiej.

Powsciagliwosc spada glownie dlatego, ze Akuki TRAFNIE PRZEWIDUJE. Srednia z dziesieciu ostatnich
rozliczen wynosi 0,115 przy skali 0..1, a najwiekszy pojedynczy blad to 0,2.

PODEJRZENIE, KTORE TRZEBA ROZSTRZYGNAC. Wielkosc bledu ocenia SAM MODEL, przy rozliczaniu wlasnego
oczekiwania. Seria wynikow 0,05-0,2 przy pierwszym w zyciu kontakcie z nieznanymi botami wyglada
na ocene pobla¿liwa wobec siebie. Jesli tak jest, to nie prog jest za niski, tylko wejscie do
niego jest zawyzone — a podniesienie progu zamaskowaloby ten blad zamiast go naprawic.

Rozstrzygniecie ma konsekwencje poza M3: ta sama liczba jest miara zaskoczenia, wiec steruje
waga zapisu w pamieci i sciezka ciekawosci.

JAK TO SPRAWDZIC BEZ PYTANIA MODELU O OCENE SAMEGO SIEBIE:
- zestawic tresc oczekiwania z tym, co faktycznie padlo w kolejnej turze, i ocenic rozbieznosc
  niezaleznie od jego wlasnej oceny (recznie na kilkunastu przypadkach albo osobnym sedzia
  offline nad snapshotem, nigdy w sciezce tury);
- sprawdzic rozklad wszystkich 72 wpisow, nie tylko dziesieciu ostatnich: czy istnieje
  jakikolwiek wynik powyzej 0,3;
- sprawdzic, czy oczekiwania nie sa formulowane tak ogolnie, ze nie da sie ich nie trafic. To
  bylby blad nie w ocenie, tylko w samym przewidywaniu, i lek bylby inny.

CZEGO NIE ROBIC: nie kalibrowac tej liczby mnoznikiem ani nie dodawac progu na "za male bledy".
Deterministyczna poprawka na ocene modelu jest dokladnie tym policjowaniem wyjscia, ktore
zakazuje borg/CLAUDE.md. Jesli oceny sa pobla¿liwe, naprawa jest w tym, czego model nie dostaje
albo o co jest proszony, nie w mnozniku po fakcie.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rozklad wszystkich rozliczen odczytany i zapisany, nie tylko dziesieciu ostatnich
- [ ] #2 Kilkanascie par oczekiwanie-rzeczywistosc ocenionych niezaleznie od oceny modelu
- [ ] #3 Rozstrzygniete, czy problem jest w ocenie bledu, w ogolnikowosci oczekiwan, czy nie ma go wcale
- [ ] #4 Jesli problem istnieje: naprawa po stronie tego, co model dostaje albo o co jest proszony, nigdy przez mnoznik na jego ocenie
<!-- AC:END -->
