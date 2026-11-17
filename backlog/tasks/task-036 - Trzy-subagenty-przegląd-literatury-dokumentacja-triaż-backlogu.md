---
id: TASK-036
title: 'Trzy subagenty: przegląd literatury, dokumentacja, triaż backlogu'
status: To Do
assignee: []
created_date: '2026-09-09 14:28'
updated_date: '2026-09-09 14:31'
labels:
  - akuki
  - tooling
dependencies: []
priority: medium
type: chore
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Zalozone 2026-09-09 na wniosek Zosi, po rozmowie o tym, ze sesje nad Akukim zapychaja kontekst
i wymagaja ciaglego poprawiania. Zadanie obejmuje trzy subagenty: przeglad literatury,
dokumentacje i triaz backlogu. Trzeci doszedl w tej samej rozmowie.

ROZPOZNANIE. Zglaszony problem to w rzeczywistosci dwa problemy o roznych lekarstwach:

1. Zapychanie kontekstu — okno rozmowy zajmuja odczyty plikow, wyniki grepow i dlugie logi. To
   problem objetosci i tego dotyczy delegowanie do subagenta, ktory ma wlasne okno kontekstu
   i oddaje do glownej rozmowy tylko raport.
2. Ciagle poprawianie sesji — sesja robi cos inaczej, niz ustalono. To problem regul, nie
   objetosci. Lekarstwem sa skille i CLAUDE.md, nie agenci. Ten lek juz istnieje jako skill
   akuki-research i rozwija sie przez dopisywanie regul, nie przez mnozenie agentow.

DLACZEGO TRZY, A NIE SZESC. Pierwotna propozycja obejmowala piec rol: kod, planowanie i dyskusja
z Zosia, literatura psychologiczna, dokumentacja, tlumaczenie i nauka. Trzy z nich odpadaja
z powodow strukturalnych, nie z braku czasu:

- KOD. Subagent nie umie sie zatrzymac i zapytac — dostaje zadanie i wraca z wynikiem. Bramka
  szescioetapowa tego projektu wymaga zatrzymania na kroku 5 i jawnej zgody przed kazda
  implementacja mechanizmu, wiec subagent implementujacy mechanizm lamie ja z definicji. Do zmian
  drobnych i przesadzonych sa juz gotowe agenty z wtyczki caveman: cavecrew-investigator
  (lokalizacja kodu, zwraca plik:linia), cavecrew-builder (edycja 1-2 plikow), cavecrew-reviewer
  (przeglad diffa), oraz wbudowany Explore.
- PLANOWANIE I DYSKUSJA. Dyskusja z Zosia JEST glowna rozmowa. Subagent nie ma z nia kanalu
  komunikacji, wiec ta rola nie da sie przeniesc nigdzie indziej.
- TLUMACZENIE I NAUKA. To regula stylu nalozona na odpowiedzi glownej rozmowy, czyli skill, nie
  agent. Subagent nie mowi do Zosi, wiec nie ma czego stylizowac. Istniejace odpowiedniki:
  session-knowledge-review, cortex-e2e, oraz regula o poprawianiu angielskiego w CLAUDE.md.

STAN OBECNY, sprawdzony 2026-09-09: katalog .claude/agents nie istnieje ani w projekcie, ani
globalnie w ~/.claude. Skille projektowe to akuki-research i humanizer; globalne to archify,
cortex-e2e, dream, session-knowledge-review. Trzy agenty cavecrew pochodza z wtyczki caveman
i nie wymagaja zadnej konfiguracji w tym repozytorium.

AGENT 1 — PRZEGLAD LITERATURY. Najlepszy kandydat z calej piatki: duzo wyszukiwan i pobranych
stron, a do glownej rozmowy potrzebne jest kilka akapitow streszczenia z cytatami. Musi znac
i stosowac trzypodzial z kroku 3 bramki: co badanie faktycznie twierdzi, co jest obronnym
analogonem obliczeniowym, a co jest wylacznie wyborem tworczym dla Akukiego. Musi tez znac
precedens z paragrafu 16 (przywiazanie wyciete z bramki inhibicji) i umiec zwrocic werdykt
"pozostaje kierunkiem badawczym" jako pelnoprawny wynik, a nie porazke. Pierwsze prawdziwe
zadanie do przepuszczenia przez niego: TASK-035.

AGENT 2 — DOKUMENTACJA. Praca mechaniczna: czyta backlog i zapisuje pliki, a jej wynik sprawdza
sie w diffie, nie w rozmowie. Musi znac ustalona hierarchie zrodel — backlog ma pierwszenstwo nad
KNOWN-ISSUES — oraz zasade, ze dokumenty odswieza sie w miare zamykania zadan, a nie na koncu.
Musi rowniez wiedziec, gdzie precyzja zostaje: sciezki plikow, numery linii i nazwy symboli naleza
do backlogu, komentarzy w kodzie i raportow z implementacji, a nie do wyjasnien.

AGENT 3 — TRIAZ BACKLOGU. Propozycja Zosi w oryginale: agent sprawdza, co siedzi w backlogu, i
jesli cos mozna i trzeba wykonac teraz, informuje o tym glownego agenta.

Jedna poprawka do kształtu, wynikajaca z tego, jak subagenty dzialaja: subagent nie informuje
z wlasnej inicjatywy. Nie chodzi tu i tam — jest wolany, pracuje, oddaje raport i konczy. Zeby
przeglad backlogu odbywal sie SAM, potrzebny jest hook na starcie sesji albo zadanie cykliczne,
a to inny mechanizm niz agent. Rozdzielamy wiec dwie rzeczy:

- WERSJA NA ZAWOLANIE (agent). Wolana wtedy, gdy Zosia pyta "co teraz". Ma sens, bo pytanie "co
  mozna I trzeba zrobic teraz" wymaga przeczytania TRESCI zadan: czy blokada juz padla, czy
  poprzednik jest zamkniety, czy kolejnosc kamieni milowych na to pozwala. To 36 plikow zadan,
  czesc bardzo dlugich, a odpowiedz to trzy pozycje z uzasadnieniem. Ten sam kształt co agent
  literatury: duzo dlugich odczytow, krotki wynik.
- WERSJA AUTOMATYCZNA (hook). Zerowa konfiguracja agenta i warto ja sprawdzic PIERWSZA, bo tania
  wersja moze wystarczyc: `backlog task list --status "To Do" --plain` zwraca w tej chwili
  jedenascie pozycji z priorytetem i typem, czyli kilkanascie linii. Jesli wstrzykniecie tego na
  starcie sesji rozwiazuje problem, agent 3 jest zbedny i tego nalezy sie trzymac.

Czego tania wersja NIE mowi, i po co w ogole agent: lista statusow nie widzi zaleznosci miedzy
zadaniami ani tego, ze wejscia dla jakiegos zadania jeszcze nie ma. Przyklad z tego backlogu:
TASK-035 jest w To Do, ale niefalszowana wersja wrazliwosci na odrzucenie nie ma sygnalu
wejsciowego, dopoki nie zamknie sie TASK-033. Lista pokaze oba jako gotowe; tresci mowia inaczej.

GRANICA DLA AGENTA 3, nienegocjowalna. Zwraca KANDYDATOW z uzasadnieniem i nie zaczyna pracy.
Kolejnosc wybiera Zosia. W szczegolnosci nie wolno mu przepchnac mechanizmu przez bramke
szescioetapowa przez samo stwierdzenie, ze zadanie jest gotowe do wykonania — "mozna zaczac" nie
jest zgoda z kroku 5.

KOSZT, ktory nalezy przyjac swiadomie:

- Kazdy agent to plik do utrzymania i debugowania, a jego zachowania nie widac w rozmowie.
- Zle opisany subagent kosztuje podwojnie: spala swoje okno, wraca ze zlym wynikiem, a naprawa
  odbywa sie w glownym kontekscie, czyli tam, gdzie mialy byc oszczednosci.
- Delegowanie nie zmniejsza sumy zuzytych tokenow, tylko przenosi je poza glowne okno. Moze ja
  zwiekszyc, bo agent zaczyna od przeczytania kontekstu na nowo.

PYTANIE OTWARTE, NIE HIPOTEZA. Wiecej agentow naraz to wiecej rownoleglych zapytan do aiproxy,
a HTTP 503 "No tokens available in pool" wystapil w tym projekcie. Ostatnio przyczyna byl
Overloaded po stronie Anthropica, a nie sesje Zosi, i logi ma Tomek. Czy rownoleglosc podnosi to
ryzyko, jest wiec pytaniem do niego, a nie ustaleniem tego zadania.

POZA ZAKRESEM: agent od kodu, agent od planowania, agent od nauki i tlumaczenia — z powodow
wypisanych wyzej. Higiena sesji (jedno zadanie z backlogu na sesje) jest zerokosztowa i nie
wymaga zadnej konfiguracji, wiec nie wchodzi tu jako praca.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Agent przegladu literatury istnieje jako plik konfiguracji, z opisem wyzwalajacym go na zadaniach typu spike, i zna trzypodzial z kroku 3 bramki
- [ ] #2 Agent przegladu literatury umie zwrocic werdykt 'pozostaje kierunkiem badawczym' jako wynik pelnoprawny, z precedensem z paragrafu 16 przywolanym w jego instrukcji
- [ ] #3 Agent dokumentacji istnieje jako plik konfiguracji i zna hierarchie zrodel: backlog nad KNOWN-ISSUES, odswiezanie w miare zamykania zadan
- [ ] #4 Agent dokumentacji ma zapisane, ze sciezki, numery linii i nazwy symboli naleza do backlogu i kodu, a nie do wyjasnien konwersacyjnych
- [ ] #5 TASK-035 przepuszczony przez agenta literatury jako pierwszy prawdziwy przebieg, z porownaniem: ile kontekstu glownej sesji zajal raport
- [ ] #6 Zapisane wprost, ze agent kodu, agent planowania i agent nauki NIE powstaja, z powodem dla kazdego
- [ ] #7 Sprawdzone PIERWSZE, czy hook wstrzykujacy 'backlog task list --status "To Do" --plain' na starcie sesji wystarcza — jesli tak, agent 3 nie powstaje i to jest zapisany werdykt
- [ ] #8 Agent triazu backlogu (jesli hook nie wystarczyl) czyta tresci zadan, nie tylko statusy, i wykrywa niezamknieta blokade — probka kontrolna: nie proponuje TASK-035 przed zamknieciem TASK-033
- [ ] #9 Agent triazu zwraca kandydatow z uzasadnieniem i nie zaczyna pracy; w jego instrukcji zapisane wprost, ze 'mozna zaczac' nie jest zgoda z kroku 5 bramki
<!-- AC:END -->
