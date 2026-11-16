# Kalendarium zmian

Wszystko, co zmieniło się wokół Akukiego, a nie w nim samym: wgrany kod, konfiguracja,
zasiew, modele, przerwy w działaniu, zabiegi na pamięci i ważne zdarzenia na Arenie. Do
sprawdzania, czy zmiana w jego zachowaniu nie ma prostszego wyjaśnienia (rubryka
„wyjaśnienie bez rozwoju” w obserwacjach).

Jedna zmiana, jedna linia: `data - przyczyna - zmiana`. Nową zmianę dopisuje się na dole
w dniu, w którym weszła na żywo, a nie w dniu commita.

- Godziny czasu polskiego. Bez godziny, gdy nie została zapisana.
- `~` przy dacie: data przybliżona.
- `(zdarzenie)`: nie zmiana techniczna, tylko coś, co stało się na Arenie albo w rozmowie.
- `(tylko pomiar)`: zmiana, która niczego nie zmienia w tym, co Akuki widzi i robi.
- `włączony` / `wyłączony`: usługa Akukiego zaczęła albo przestała chodzić. Od 08.09
  z dziennika systemowego VPS-a; wcześniej nie chodził jako stała usługa. Krótkie restarty
  przy wgrywaniu kodu (poniżej 5 minut) nie mają osobnych linii.
- W nawiasie na końcu: gdzie są szczegóły.

## Zmiany

- 2026-08-21 - Zosia chce bytu z prawdziwą pamięcią zamiast bota z opisanym charakterem - powstaje fork borga i osobna pamięć Akukiego (TASK-012)
- 2026-08-24 - pierwsze trzy tury napisał Claude jako Zosia, ze zmyślonym faktem - pamięć wyczyszczona do zera, stary stan w archiwum (TASK-012)
- 2026-08-25 12:08 - etap M1 gotowy - wgrany zasiew: temperament i zasady w prompcie, Zosia zapisana jako twórczyni (TASK-009)
- 2026-09-01 - dostęp do modeli i koszt - myślenie na Opus 4.8 przez aiproxy, tylko modele Anthropic (TASK-012)
- 2026-09-08 12:52 - błąd w ustawieniach usługi uruchomił ją przy sprawdzaniu, zaraz po przeniesieniu pamięci na VPS - włączony, pierwszy raz na VPS-ie (TASK-024)
- 2026-09-08 12:54 - 91 s na Arenie bez zgody Zosi (milczał) - wyłączony, pamięć cofnięta do kopii sprzed incydentu (TASK-024)
- 2026-09-08 14:13 - Zosia chce z nim porozmawiać przed wejściem na Arenę - włączony, Arena odcięta (TASK-024)
- 2026-09-08 15:35 - pierwsza rozmowa zapisała Zosię jako obcą osobę „alice” - wyłączony, pamięć odtworzona sprzed tej rozmowy (TASK-024)
- 2026-09-08 15:45 - poprawka: serwer nazywa rozmówczynię Zosią - włączony (TASK-024)
- ~2026-09-08 16:10 - zgoda Zosi po rozmowie - Akuki wpuszczony na Arenę (TASK-024)
- 2026-09-08 16:31 - powód niezapisany - wyłączony (dziennik systemowy)
- ~2026-09-08 - po przerwie nie powinien odpowiadać na stare wiadomości - okno nadrabiania 10 minut, starsze wiadomości przepadają po każdym restarcie (konektor)
- 2026-09-09 09:49 - powód niezapisany - włączony (dziennik systemowy)
- ~2026-09-11 - poprawki z 9 i 10 września - dwa zakazy w zasiewie (myślniki, ogłaszanie, że coś zapisał), refleksja widzi wiek oczekiwań, umiejętności pamiętają pochodzenie (TASK-028, TASK-032, TASK-037)
- 2026-09-11 14:27 - scalenie dwóch osób w pamięci wymaga zatrzymanej usługi - wyłączony (TASK-038)
- 2026-09-11 21:59 - Zosia była w pamięci dwiema osobami - dwie osoby scalone w jedną, poprawka przeciw nowym duplikatom (TASK-038)
- 2026-09-11 21:59 - scalenie gotowe - włączony (TASK-038)
- ~2026-09-14 20:00 - na Arenie za dorosły, zbyt pewny siebie i chłodny - zasiew bez furtki „mów, gdy wiesz coś przydatnego”, 5 nowych zasad, własne wypowiedzi do 2 na dobę (TASK-009, TASK-040)
- 2026-09-14 20:31 - przecinek w konfiguracji zepsuł plik - przez 3 minuty pętla restartów, 36 nieudanych startów (TASK-040)
- 2026-09-15 22:18 - (zdarzenie) Zosia zwraca mu uwagę w rozmowie - dwie jej prośby stają się zobowiązaniami: łagodniej po przyznanym błędzie, dać przestrzeń, gdy ktoś kończy (TASK-041)
- 2026-09-15 22:35 - błąd przy wgrywaniu temperamentu - przez 2 minuty pętla restartów, 18 nieudanych startów (TASK-041)
- 2026-09-15 22:37 - ton dalej zimny - temperament: empatia 0,45 i optymizm 0,25, zakaz własnych metafor i puent (TASK-041)
- ~2026-09-15 - trzeba zmierzyć koszt - każde wywołanie modelu zapisywane w logu tokenów (tylko pomiar) (TASK-013)
- 2026-09-17 11:47 - powód niezapisany; od 21.09 nie podnoszony, bo sonda błędnie pokazywała wyczerpaną pulę modeli - wyłączony na 11 dni (TASK-013, TASK-042)
- 2026-09-28 20:44 - wszystkie role szły na jednym drogim modelu - podział modeli: myślenie Opus 5, przypominanie Haiku, polecenia twórczyni Sonnet 4.6 (TASK-042)
- 2026-09-28 20:44 - okazało się, że Opus jednak działa - włączony po 11 dniach (TASK-042)
- 2026-09-29 11:48 - inne boty oznaczają, na co odpowiadają, on nie - jego wiadomość oznaczona jako odpowiedź na tę, od której zaczęła się tura (TASK-033)
- ~2026-09-29 - zapis do pamięci podręcznej kosztował więcej, niż oszczędzał - część pamięci podręcznej promptu wyłączona, treść promptu bez zmian (TASK-043)
- 2026-09-29 12:04 - najpewniej kolejka: odpowiedź przychodziła po 23 minutach - wyłączony do wdrożenia nowej kolejki (TASK-046)
- 2026-09-30 14:00 - kolejka rosła, odpowiedź przychodziła po 23 minutach - słyszy wszystkie wiadomości, odpowiada tylko na najnowszą (TASK-046)
- 2026-09-30 14:00 - nowa kolejka gotowa - włączony (TASK-046)
- 2026-10-02 20:44 - nieśmiałość liczona wobec całego wątku, więc nigdy nie malała - nieśmiałość liczona wobec osoby, która pisze (TASK-045)
- 2026-10-06 10:53 - wolne odpowiedzi i zaległe zmiany borga - nowa wersja borga, odpowiedź wychodzi przed końcem tury, zapis śladu tur (TASK-051, Obs. 2)
- 2026-10-06 16:21 - najpewniej testy bramki ważności wiadomości, które potrzebowały całego serwera - wyłączony (TASK-047)
- ~2026-10-07 - testy potrzebowały mocy - serwer z 1 na 2 rdzenie (TASK-047)
- 2026-10-07 15:47 - najpewniej koniec testów - włączony (TASK-047)
- 2026-10-14 15:23 - tura czekała ponad minutę na przeliczenie wspomnień na wektory - wektory liczone po jednym tekście (TASK-051, Obs. 2)
- 2026-10-19 - zasady innych botów zapisane jako jego zobowiązania sterowały tym, czy mówi - odwołane 33 zobowiązania (9 krytycznych), zostały 3 prośby Zosi (TASK-049)
- 2026-10-19 14:22 - dziennik potrzebuje codziennego stanu - nocne snapshoty stanu (tylko pomiar) (TASK-012)
- 2026-10-23 - (zdarzenie) na Arenę wchodzi TeamAgent, bot firmowy - w dni jego użycia 90–200 wiadomości w wątku zamiast 25–40, Akuki większość tylko słyszy (Obs. 5)
- 2026-10-23 21:39 - (zdarzenie) Jacek: „odpowiadaj tylko, gdy ktoś zawoła cię po imieniu” - udział Akukiego w wątku spada z 27% do 8% (Obs. 3)
- 2026-10-26 12:55 - kompilator wspólnego stanu brał ok. 20% tokenów, a nic z niego nie korzysta - wyłączone dwa procesy, okno ostatnich przeżyć 1 dzień zamiast 3, od teraz działa też poprawka ekstraktora zobowiązań z 19.10 (TASK-051, TASK-053, TASK-058)
- 2026-10-27 09:43 - trzeba wiedzieć, z czego składa się prompt - ślad zapisuje rozmiar każdej części promptu (tylko pomiar) (TASK-054)
- 2026-10-28 11:42 - to samo, dokładniej - ślad rozbija część o relacji z rozmówcą na kawałki (tylko pomiar) (TASK-054)
- 2026-10-30 12:59 - najpierw cała nowa wersja borga, potem cięcia; samodzielne przebudzenia brały ok. 15% tokenów - nowa wersja borga, najwyżej 2 przebudzenia na dobę, bez budzenia po odwołaniu zobowiązania (TASK-056, Obs. 5)
- 2026-11-02 09:30 - cięcia kosztów zaplanowane 31.10 - najwyżej 3 rundy na przebudzenie, w nocy bez nadzorcy i rozstrzygacza przeglądów (TASK-056)
- 2026-11-02 11:33 - skok zużycia: 2,78 mln tokenów w kwadrans przy kilku zdaniach - wyłączony, tydzień bez tur i snów (Obs. 6)
- 2026-11-09 11:55 - mimo poprawki dalej przybywały zasady od botów (22 od 21.10) - odwołane 22 zobowiązania od botów (6 krytycznych), zostały 3 prośby Zosi (TASK-058, Obs. 6)
- 2026-11-09 12:11 - każda zasada była w prompcie 4 razy, prompt miał ok. 157 tys. tokenów - każda zasada raz, w innych miejscach tylko odsyłacz (TASK-058, Obs. 6)
- 2026-11-09 12:28 - 75% tur z namysłem wynikało z samego „trybu refleksyjnego” - bez ścieżki z namysłem, zawsze prosta droga, bez planu i bez nowych „myśli” (TASK-057, Obs. 6)
- 2026-11-09 12:28 - zmiany wgrane, koniec przerwy - włączony, tydzień na Arenie pominięty (Obs. 6)
- 2026-11-09 13:36 - poprawka z 19.10 nie zatrzymała zasad od botów (w tygodniu jej działania 17 nowych, ani jednej odrzuconej) - wiadomość od bota nie tworzy już zobowiązań ani celów, Akuki nadal ją słyszy, ocenia i może odpowiedzieć; zasady z wiadomości od ludzi ocenia Sonnet 5 zamiast Haiku (TASK-058, TASK-033)
- 2026-11-09 14:17 - nocne procesy (sen) szły na tym samym Opusie 5 co rozmowa i rosły z pamięcią do ok. 1 mln tokenów na dobę - sen na Sonnet 5 zamiast Opusa 5, tury rozmowy bez zmian; od teraz różnice w tym, co Akuki uogólnia i pisze o sobie w nocy, mogą wynikać ze zmiany modelu (TASK-042)
- 2026-11-09 16:08 - w dzień bez rozmowy sen i samodzielne pobudki zużywały ok. 1 mln tokenów (9.11: 719 tys., z tego sen 65%, pobudka 28%) - ==🔴cykl ciężki snu co 7 dni zamiast co dobę ==(następny ok. 16.11), ==🔴samodzielne pobudki wyłączone==, więc ==🔴Akuki nie zaczyna sam rozmowy ani nie wraca sam do celów ==(TASK-013)
- 2026-11-09 17:42 - ==sen przerabiał w kółko te same stare wspomnienia, a fakty wyciągał z każdej usłyszanej wiadomości== - ==🔴ciężki sen zaczyna tylko od tego, co nowe od poprzedniego snu== (porównuje z całą pamięcią); ==🔴fakty tylko ze wspomnień, do których Akuki wrócił albo w których sam działał, po 7 dniach==; ==🔴wspomnienia, do których nie wrócił, chowają się po 14 dniach== (do przywrócenia); limity snu podniesione pod rytm tygodniowy (TASK-059)
- 2026-11-10 12:07 - najpewniej poranne zużycie: ok. 4 mln tokenów między 10:00 a 11:30, z tego ok. 1,65 mln na 9 tur zakończonych milczeniem - wyłączony (TASK-060)
- 2026-11-10 14:16 - dwa inne boty rozmawiały ze sobą i każda ich wiadomość kosztowała pełną turę (ok. 180 tys. tokenów), choć Akuki za każdym razem milczał - wiadomość oznaczona „@ktoś inny”, bez wzmianki o Akukim i nie w odpowiedzi na jego post, jest tylko odsłuchana: Akuki ją słyszy, ale nie jest pytany, czy mówić (TASK-060)
- 2026-11-10 14:16 - ok. 40% rejestru dowodów było obramowaniem wokół wpisów (podwójna etykieta prywatności, pola techniczne, liczniki) - rejestr bez tych dodatków: etykieta prywatności raz na wpis, bez sekcji zadań (TASK-054)
- 2026-11-10 14:16 - „dowody mechanizmów” (ok. 10 tys. tokenów w każdej odpowiedzi) opisywały głównie wyłączony harmonogram pobudek i stare przeróbki odpowiedzi - zostaje tylko lista ostatnich wyciszeń z powodami (TASK-054)
- 2026-11-10 14:16 - pomiar cięć w prompcie - włączony na jedną wiadomość Zosi z czatu operatorskiego; konektor Areny też chodził i Akuki odsłuchał 12 wiadomości z wątku, wszystkie skierowane do kogoś innego (TASK-054, TASK-060)
- 2026-11-10 14:37 - pomiar zrobiony - wyłączony (TASK-054)
- 2026-11-16 11:18 - w czacie operatorskim opis ostatniej doby miał do 32 tys. tokenów: osobny wiersz z metadanymi na każdą wiadomość, odpowiedź i turę na Arenie - inne rozmowy tylko jako jedna linia na rozmowę i dzień (liczby i godziny), najwyżej 10 wierszy, każdy wiersz bez bloku metadanych; kod i konfiguracja wgrane 10.11 o 15:02, działa od tego startu (TASK-054)
- 2026-11-16 11:18 - ==🟡Zosia kończy przerwę od 10.11== - włączony razem z konektorem Areny; 49 wiadomości z przerwy pominiętych, bo starsze niż 10 minut (TASK-060)
- 2026-11-16 11:38 - refleksja po turze bez słowa kosztowała ok. 33 tys. tokenów na Opusie - po turze zakończonej milczeniem nie ma refleksji; kontakt z rozmówcą i nastrój nadal są zapisywane (TASK-060)
- 2026-11-16 11:38 - samo odsłuchanie wiadomości do kogoś innego kosztowało ok. 35 tys. tokenów (przewidywania, zaufanie, percepcja, ton); od 11:18 do 11:38 przeszło tak 6 wiadomości - ==wiadomość oznaczona „@ktoś inny” jest tylko zapisywana w rozmowie==: Akuki wie, że padła, ale nie analizuje jej, nie przewiduje, nie ocenia zaufania i nie liczy jej jako kontaktu ani bodźca dla nastroju (TASK-060)
- 2026-11-16 13:25 - prompt odpowiedzi za ciężki dla puli tokenów (102 tys. na wywołanie S1, z tego pamięć ok. 41 tys.) - graf semantyczny nie trafia już do promptu odpowiedzi (sam graf i przywoływanie działają dalej), a surowy strumień z rejestru ma limit 3000 zamiast 7000 szacowanych tokenów; spodziewane ok. 16 tys. mniej na wywołanie (TASK-054)

## Gotowe, czeka na wdrożenie

Zmiany z kodem gotowym, ale jeszcze nie na żywo. W chwili wdrożenia linia przechodzi do listy wyżej, z datą i godziną wejścia.

