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
- W nawiasie na końcu: gdzie są szczegóły.

## Zmiany

- 2026-08-21 - Zosia chce bytu z prawdziwą pamięcią zamiast bota z opisanym charakterem - powstaje fork borga i osobna pamięć Akukiego (TASK-012)
- 2026-08-24 - pierwsze trzy tury napisał Claude jako Zosia, ze zmyślonym faktem - pamięć wyczyszczona do zera, stary stan w archiwum (TASK-012)
- 2026-08-25 12:08 - etap M1 gotowy - wgrany zasiew: temperament i zasady w prompcie, Zosia zapisana jako twórczyni (TASK-009)
- 2026-09-01 - dostęp do modeli i koszt - myślenie na Opus 4.8 przez aiproxy, tylko modele Anthropic (TASK-012)
- 2026-09-08 - przeniesienie pamięci na VPS i błąd w ustawieniach usługi - 91 s na Arenie bez zgody Zosi (milczał), potem pamięć cofnięta do kopii sprzed incydentu (TASK-024)
- 2026-09-08 - pierwsza rozmowa zapisała Zosię jako obcą osobę „alice” - pamięć odtworzona sprzed tej rozmowy, serwer nazywa rozmówczynię Zosią (TASK-024)
- 2026-09-08 - zgoda Zosi po rozmowie - Akuki wpuszczony na Arenę (TASK-024)
- ~2026-09-08 - po przerwie nie powinien odpowiadać na stare wiadomości - okno nadrabiania 10 minut, starsze wiadomości przepadają po każdym restarcie (konektor)
- ~2026-09-11 - poprawki z 9 i 10 września - dwa zakazy w zasiewie (myślniki, ogłaszanie, że coś zapisał), refleksja widzi wiek oczekiwań, umiejętności pamiętają pochodzenie (TASK-028, TASK-032, TASK-037)
- 2026-09-11 21:59 - Zosia była w pamięci dwiema osobami - dwie osoby scalone w jedną, poprawka przeciw nowym duplikatom (TASK-038)
- ~2026-09-14 20:00 - na Arenie za dorosły, zbyt pewny siebie i chłodny - zasiew bez furtki „mów, gdy wiesz coś przydatnego”, 5 nowych zasad, własne wypowiedzi do 2 na dobę (TASK-009, TASK-040)
- 2026-09-15 22:18 - (zdarzenie) Zosia zwraca mu uwagę w rozmowie - dwie jej prośby stają się zobowiązaniami: łagodniej po przyznanym błędzie, dać przestrzeń, gdy ktoś kończy (TASK-041)
- 2026-09-15 22:37 - ton dalej zimny - temperament: empatia 0,45 i optymizm 0,25, zakaz własnych metafor i puent (TASK-041)
- ~2026-09-15 - trzeba zmierzyć koszt - każde wywołanie modelu zapisywane w logu tokenów (tylko pomiar) (TASK-013)
- ~2026-09-17 - powód niezapisany - Akuki przestaje chodzić, przerwa do 28.09 (TASK-013, TASK-042)
- 2026-09-28 20:44 - wszystkie role szły na jednym drogim modelu - start po przerwie z podziałem modeli: myślenie Opus 5, przypominanie Haiku, polecenia twórczyni Sonnet 4.6 (TASK-042)
- 2026-09-29 11:48 - inne boty oznaczają, na co odpowiadają, on nie - jego wiadomość oznaczona jako odpowiedź na tę, od której zaczęła się tura (TASK-033)
- ~2026-09-29 - zapis do pamięci podręcznej kosztował więcej, niż oszczędzał - część pamięci podręcznej promptu wyłączona, treść promptu bez zmian (TASK-043)
- 2026-09-30 14:00 - kolejka rosła, odpowiedź przychodziła po 23 minutach - słyszy wszystkie wiadomości, odpowiada tylko na najnowszą (TASK-046)
- 2026-10-02 20:44 - nieśmiałość liczona wobec całego wątku, więc nigdy nie malała - nieśmiałość liczona wobec osoby, która pisze (TASK-045)
- 2026-10-06 10:53 - wolne odpowiedzi i zaległe zmiany borga - nowa wersja borga, odpowiedź wychodzi przed końcem tury, zapis śladu tur (TASK-051, Obs. 2)
- ~2026-10-07 - testy potrzebowały mocy - serwer z 1 na 2 rdzenie, Akuki na chwilę zatrzymany (TASK-047)
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
- 2026-11-02 11:33 - skok zużycia: 2,78 mln tokenów w kwadrans przy kilku zdaniach - usługa zatrzymana, tydzień bez tur i snów (Obs. 6)
- 2026-11-09 11:55 - mimo poprawki dalej przybywały zasady od botów (22 od 21.10) - odwołane 22 zobowiązania od botów (6 krytycznych), zostały 3 prośby Zosi (TASK-058, Obs. 6)
- 2026-11-09 12:11 - każda zasada była w prompcie 4 razy, prompt miał ok. 157 tys. tokenów - każda zasada raz, w innych miejscach tylko odsyłacz (TASK-058, Obs. 6)
- 2026-11-09 12:28 - 75% tur z namysłem wynikało z samego „trybu refleksyjnego” - bez ścieżki z namysłem, zawsze prosta droga (bez planu i bez nowych „myśli”); start po przerwie, tydzień na Arenie pominięty (TASK-057, Obs. 6)
