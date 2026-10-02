---
id: TASK-037
title: >-
  Czy Akuki nie zaniża własnych błędów przewidywania — wejście do M3 może być
  zawyżone
status: In Progress
assignee: []
created_date: '2026-09-09 16:15'
updated_date: '2026-10-01 15:49'
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
na ocene poblazliwa wobec siebie. Jesli tak jest, to nie prog jest za niski, tylko wejscie do
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
zakazuje borg/CLAUDE.md. Jesli oceny sa poblazliwe, naprawa jest w tym, czego model nie dostaje
albo o co jest proszony, nie w mnozniku po fakcie.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rozklad wszystkich rozliczen odczytany i zapisany, nie tylko dziesieciu ostatnich
- [x] #2 Kilkanascie par oczekiwanie-rzeczywistosc ocenionych niezaleznie od oceny modelu
- [x] #3 Rozstrzygniete, czy problem jest w ocenie bledu, w ogolnikowosci oczekiwan, czy nie ma go wcale
- [x] #4 Jesli problem istnieje: naprawa po stronie tego, co model dostaje albo o co jest proszony, nigdy przez mnoznik na jego ocenie
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
### Pomiar (2026-09-09, `akuki-bledy-przewidywania-check.sh`, zywa pamiec VPS, tylko do odczytu)

72 wpisy = 37 oczekiwan + 35 rozliczen, 2 otwarte. Wszystkie rozliczenia maja ocene bledu.

Rozklad calego zbioru: min 0,05 | mediana 0,15 | max 0,90 | srednia 0,2614.
Powyzej 0,3: 11 z 35. Powyzej 0,5: 5 z 35. Zer: brak. Uzytych roznych wartosci: 13
(0,05 0,1 0,15 0,2 0,3 0,35 0,4 0,5 0,55 0,6 0,7 0,75 0,9).

Histogram: [0,05..0,1) 5 | [0,1..0,15) 9 | [0,15..0,2) 5 | [0,2..0,3) 3 | [0,3..0,4) 3 |
[0,4..0,5) 3 | [0,5..0,7) 4 | [0,7..1] 3.

Przeslanka zadania (srednia 0,115, max 0,2) byla artefaktem probki: dziesiec ostatnich rozliczen
to koncowka wieczoru, tury pozegnalne i potwierdzajace. Na calym zbiorze skala jest uzywana
szeroko.

### Ocena niezalezna (AC #2)

Cztery najwyzsze oceny sprawdzone recznie przeciw temu, co faktycznie padlo w turze rozliczenia --
wszystkie uczciwe, nie zawyzone i nie zanizone:

- 0,90 -- oczekiwal odpowiedzi od kogos o imieniu Philip; zaden Philip nie istnial (imie padlo w
  cudzej wypowiedzi skierowanej do kogo innego). Pelne rozminiecie.
- 0,75 -- oczekiwal wejscia na Arene prowadzony przez Zosie i jej obecnosci; dostal monolog Lunarii.
- 0,70 -- oczekiwal odpowiedzi na swoje pytania przed wejsciem; nie dostal.
- 0,60 -- oczekiwal, ze ostrzezenia wobec botow beda sie powtarzac; Zosia zmiekla.

### Werdykt (AC #3)

Podejrzenie o poblazliwa ocene wlasnego bledu NIE POTWIERDZA SIE. Rozklad obejmuje cala skale, a
wysokie oceny stoja dokladnie tam, gdzie czlowiek tez zobaczylby zaskoczenie. Prog M3 zostaje
nietkniety.

Pomiar odslonil za to dwa inne defekty:

DEFEKT A -- 9 z 35 oczekiwan dotyczy wlasnej nastepnej odpowiedzi Akukiego ("prawdopodobnie przyjme
to otwarcie", "pewnie odpowiem cieplo", "zrobie to, o co prosil Sol"). Ten sam model najpierw
przewiduje, a potem pisze te odpowiedz, wiec przewidywania sa praktycznie niefalsyfikowalne.
Srednia bledu dla nich: 0,183 (9 wpisow) wobec 0,288 dla przewidywan o swiecie i partnerach
(26 wpisow). Dwa z nich dostaly 0,4 i 0,5, choc wyszly zgodnie z oczekiwaniem -- szum idzie w obie
strony, wiec to nie jest poblazliwosc, tylko zly cel przewidywania. Zaskoczenie wlasna wypowiedzia
nie mowi nic o przewidywalnosci partnera, a to ona ma obnizac powsciagliwosc w M3.

DEFEKT B -- czesc oczekiwan rozliczana jest w turze, ktora ich nie dotyczy. Trzy rozliczenia mowia
to same: "Already handled a turn earlier", "This turn is Sol speaking, not my reply to Zosia".
Cztery oczekiwania zamkniete w jednej turze o dobranoc, w odstepach ponizej sekundy -- hurtowe
czyszczenie kolejki. Przyczyna po stronie tego, co model dostaje: lista `open_expectations`
w `prediction-extractor.ts:121` niesie tylko `prediction_id`, `content`, `about` i etykiete
ujawniania. Nie ma ani czasu powstania, ani liczby tur od tamtej pory, wiec polecenie z
`prompts/prediction-extraction.ts:7` ("Resolve only expectations the turn genuinely bears on")
nie ma na czym sie oprzec.

Konsekwencje poza M3: ta sama liczba steruje waga zapisu w pamieci
(`cognition/predictions/surprise-significance.ts`), warunkiem wybudzenia przy skoku bledu
(`autonomy/conditions/prediction-error-spike.ts`) i kontekstem bramki inhibicji
(`cognition/inhibition/inhibition-context.ts`).

### Naprawa zatwierdzona przez Zosie 2026-09-10 (AC #4) -- oba punkty

Obie zmiany po stronie tego, co model dostaje albo o co jest proszony. Zaden mnoznik ani prog na
ocenie modelu nie powstaje.

1. Wiek otwartego oczekiwania trafia do promptu rozliczenia: numer tury, w ktorej powstalo, ile tur
   temu i ile minut temu. Bez tego nie da sie odroznic swiezego oczekiwania od zaleglego.
2. Prompt tworzenia oczekiwan prosi o przewidywania o tym, co zrobi swiat albo partner, albo o
   skutek wlasnego dzialania -- nie o brzmienie wlasnej nastepnej wypowiedzi.

Podstawa badawcza punktu 2 (rozdzielenie trzech rzeczy):
- CO TWIERDZI BADANIE: niemowleta wykrywaja zaleznosc miedzy wlasnym dzialaniem a jego skutkiem
  na dlugo przed pierwszym rokiem; to podstawa eksploracji i poczucia sprawczosci. Jacquey, Fagard,
  Esseily & O'Regan (2020), Dev. Psychol. 56(7):1233-1251. Osobno: blad przewidywania jako waluta
  uwagi i pamieci (podstawa M2).
- OBRONNA ANALOGIA OBLICZENIOWA: uzyteczna forma przewidywania to DZIALANIE -> SKUTEK, wiec
  przewidywanie o sobie ma wartosc rozwojowa wtedy, gdy dotyczy skutku wlasnego dzialania. "Jak
  sformuluje nastepne zdanie" nie jest skutkiem, bo autor przewidywania jest jego wykonawca.
- WYMYSL DLA AKUKIEGO: samo brzmienie prosby w prompcie. Zakaz przewidywania siebie NIE jest
  wprowadzany -- inwariant "sprawczosc przed tozsamoscia" wymaga przeciwnie, zeby "kiedy robie X,
  dzieje sie Y" bylo mozliwe.
### Co zostalo zaimplementowane (2026-09-10)

Naprawa DEFEKTU B -- wiek otwartego oczekiwania dociera do refleksji:

- `borg/src/memory/predictions/migrations.ts:47` -- migracja 2 dodaje nullowalna kolumne
  `formed_turn_counter` (globalny numer tury powstania). Prowenienecja obok `turn_id` i
  `session_id`, nigdy brama odczytu. Nullowalna, bo wiersze sprzed migracji nie maja z czego
  zostac uzupelnione.
- `borg/src/memory/predictions/types.ts:67` i `repository.ts` -- pole w schemacie wiersza,
  `RecordExpectationInput.formedTurnCounter`, zapis w INSERT. Rozliczenie zapisuje null, bo
  zawsze dzieje sie w turze biezacej.
- `borg/src/cognition/predictions/prediction-turn-service.ts:71-83` -- liczy `formedTurnsAgo`
  (biezacy numer tury minus numer powstania) i `formedMinutesAgo` (z zegara). Minuty jada
  obok tur, bo wiersze sprzed migracji nie maja numeru tury, a wiek w minutach maja zawsze.
- `borg/src/cognition/predictions/prediction-extractor.ts:135` -- oba pola trafiaja do
  `open_expectations` w prompcie jako `formed_turns_ago` i `formed_minutes_ago`.
- `borg/src/cognition/lifecycle/turn-phase/extraction-phase.ts:324` -- numer tury bierze sie z
  `turnInput.globalTurnCounter ?? workingMemory.turn_counter`, czyli z licznika, ktory tura i tak
  ma pod reka.
- `borg/src/cognition/prompts/prediction-extraction.ts:8` -- polecenie: stare oczekiwanie nie jest
  rozliczone samym uplywem tur; pusta tablica rozliczen jest poprawna odpowiedzia dla tury, ktora
  nic nie rozstrzyga; nie wolno rozliczac czegos na tej podstawie, ze "zostalo obsluzone turę
  wczesniej".

Naprawa DEFEKTU A -- cel przewidywania:

- `borg/src/cognition/prompts/prediction-extraction.ts:13` -- prosba o przewidywanie tego, czego
  sie nie kontroluje: co zrobi drugi uczestnik albo jak rozwinie sie sytuacja. Przewidywanie o
  SKUTKU wlasnego dzialania nadal sie liczy ("jesli to powiem, odpowiedza tak"), bo skutek nalezy
  do kogos innego. Zakazane jest tylko przewidywanie brzmienia, tonu i postawy wlasnej nastepnej
  wypowiedzi.

Zadna z tych zmian nie oglada wyjscia modelu i nie koryguje jego oceny. Zero regexow, zero list
slow, zero mnoznika -- obie dzialaja w kazdym jezyku, bo siedza w prompcie i w danych, nie w
rozgalezieniu po tresci.

Test Opus 5.0: w zakresie -- harness nie podawal modelowi wieku otwartego oczekiwania, wiec
polecenie "rozliczaj tylko to, czego ta tura dotyczy" nie mialo na czym sie oprzec (luka
prezentacji), a prosba o nowe oczekiwanie nie mowila, czego ma dotyczyc (tekst promptu).

### Testy

`npx vitest run src/memory/predictions src/cognition/predictions` -- 17 zdanych, w tym cztery nowe:
kolumna trzyma numer tury i zostaje nullem na rozliczeniu, wiek dociera do promptu w turach i
minutach, nowe oczekiwanie dostaje stempel z numerem tury, a odleglosc w turach zostaje nieznana, gdy
brakuje ktorejkolwiek strony. `npx tsc --noEmit` czysto, `npm run heuristics:guard` czysto.

Pelny `npx vitest run`: 4042 zdanych, 29 nieudanych w 12 plikach -- wszystkie w
`scripts/debug.test.ts` (asercje polityki lockfile), `simulator/runner.test.ts` (ENOENT na blokadzie
strumienia w /tmp), `scripts/chat.test.ts` i kilku plikach z limitem czasu 15 s pod obciazeniem.
Zaden nie dotyka predykcji; sprawdzone osobno przed zmiana logiki.

### Czego jeszcze nie zrobiono

- Zmiany NIE sa wdrozone na VPS. Migracja 2 dopisuje kolumne do zywej pamieci -- przed wdrozeniem
  nalezy zrobic i zweryfikowac backup `/var/lib/akuki/data/akuki`.
- Skutek widac dopiero na nowych turach: 37 istniejacych oczekiwan ma `formed_turn_counter` null,
  wiec dla nich model dostanie tylko wiek w minutach.
- Wyjasnienie nie zostalo dopisane do `doubts, questions.md` -- katalog Obsidiana nie jest
  zamontowany na tej maszynie.
- Prompt ekstraktora predykcji zmienil sie, wiec jego wlasny cache statyczny wygasa raz po
  wdrozeniu i odbudowuje sie na nastepnej turze.

### Stan 2026-10-01

- Wdrozone: commit 270a4a30 jest przodkiem HEAD na VPS (`/opt/akuki/app`). 376 z 413 oczekiwan ma `formed_turn_counter`; 37 bez numeru to wiersze sprzed migracji, zgodnie z przewidywaniem. Rozliczenia maja null zgodnie z projektem.
- Wyjasnienie dopisane do `doubts, questions.md` (vault jest pod `/home/zosia/Obsidian Vault/obsidians/...`, nie `~/obsidians`).
- NIE zmierzone: czy po wdrozeniu spadl udzial przewidywan o wlasnej odpowiedzi i hurtowych rozliczen. Porownanie przed/po wymaga odczytu bazy produkcyjnej; odczyt zablokowany przez kontrole uprawnien sesji, czeka na decyzje Zosi.
<!-- SECTION:NOTES:END -->
