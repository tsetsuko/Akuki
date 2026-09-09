---
id: TASK-032
title: 'M4+: czytelnik retencji imitacji nad posteriorem procedural'
status: In Progress
assignee: []
created_date: '2026-09-04 12:46'
updated_date: '2026-09-09 13:30'
labels: []
dependencies:
  - TASK-028
priority: high
type: feature
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Wydzielone z TASK-031 (decyzja Zosi 2026-09-04, wyjście b1). To zadanie jest ZADEKLAROWANYM KONSUMENTEM parametru `differentiation.imitation_retention_threshold` (borg/src/akuki/seed/temperament.yaml:66, TEMPERAMENT_CONSUMERS w temperament.ts:192). Dopóki nie wejdzie, strażnik sierot milczy o tym kluczu — dokładnie tak, jak milczy o `agency.*`, którego konsumentem jest zaparkowane M5.

CO MA POWSTAĆ. Krok `retain / modify / reject` z architecture:431-441, czyli ostatnie ogniwo łańcucha `observe behavior -> imitate -> observe outcome -> compare result -> retain / modify / reject`. Wielkością, która przekracza próg, jest wynik WŁASNEGO eksperymentu Akukiego nad przejętym zachowaniem — nie zaufanie do źródła. Zaufanie to krok wcześniejszy (`architecture:775-779`: selective social learning -> experimentation -> retain/modify/reject) i M4 je już dostarczyło.

CZEGO BRAKUJE (ustalone przy TASK-031, 2026-09-04):
1. Pomiar wyniku ISTNIEJE. Pasmo procedural trzyma posteriory Beta z kontekstowymi statystykami (src/memory/procedural/selector.ts:32 computeContextualPosterior) — „gdy robię X w sytuacji S, wychodzi p".
2. Prowenienecja umiejętności NIE ISTNIEJE — TASK-028. Bez niej nie da się odróżnić umiejętności podpatrzonej u silniejszego bota od znalezionej samodzielnie, czyli nie ma retencji IMITACJI, jest tylko retencja umiejętności w ogóle. Dlatego blocked-by TASK-028.
3. Krok retain/reject NIE ISTNIEJE w ogóle. `grep -rn "retire|prune|abandon|threshold" src/memory/procedural/` (bez testów) zwraca zero. Umiejętności są wybierane przez Thompson sampling i nigdy nie wycofywane po progu.

KSZTAŁT PARAMETRU DO POPRAWIENIA W TYM ZADANIU. Obecne `imitation_retention_threshold: 0.6` to jedna liczba nad krzywą, więc nie nazywa żadnej wielkości — ta sama wada, którą M1 naprawiło rozbijając agency na `contingency_floor` + `contingency_confidence` (temperament.yaml:56-59, czytane jako `P(prawdziwy wskaźnik > floor) > confidence`). Docelowy parametr retencji będzie parą liczb tego samego kształtu. Zmiana kształtu należy TUTAJ, przy realnym czytelniku, a nie na zapas — dlatego TASK-031 zostawiło jedną liczbę z komentarzem mówiącym wprost, że jest tymczasowa.

OSTRZEŻENIA Z BRAMKI (SKILL.md), do rozstrzygnięcia PRZED implementacją:
- Kubełek badawczy: architecture §6 i psychology :113-129 mówią, że obserwacja nie staje się automatycznie imitacją i że retencja wynika z obserwacji wyniku własnego eksperymentu. O progu liczbowym ani o żadnej jego wartości badanie NIE MÓWI NIC. Wartość i sam pomysł jednego punktu odcięcia to wybór twórczy i nie wolno mu pożyczać powagi od literatury.
- Kształt z M3: harness liczy liczbę i ją renderuje (advisory), model decyduje. Twarda bramka odrzucająca umiejętność w harnessie to legislowanie osądu i łamie CARDINAL RULE z borg/CLAUDE.md. Werdykt Opusa 5.0 trzeba napisać w propozycji, nie po pushbacku.
- Inwariant 5: parametry są stałe, rozwój bierze się ze stanu przekraczającego próg. Retencja ma się zmieniać, bo rośnie dowód w posteriorze, nigdy bo obniżono próg.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rozstrzygnięte i zatwierdzone, co dokładnie jest bramkowane: zatrzymanie umiejętności, jej oznaczenie w prompcie, czy coś innego — z werdyktem Opusa 5.0
- [ ] #2 Projekt przeszedł sześciostopniową bramkę z SKILL.md i Zosia zaakceptowała go przed implementacją
- [ ] #3 Kształt parametru poprawiony na parę liczb (próg skuteczności + masa pewności), wzorem agency.contingency_floor/confidence
- [ ] #4 Retencja liczona z posteriora WŁASNEGO wyniku Akukiego, nie z zaufania do źródła
- [ ] #5 Czytelnik istnieje w kodzie poza deklaracjami: strażnik sierot zielony po dopisaniu TASK-032 do listy wylądowanych konsumentów
- [ ] #6 Rozwój bierze się z rosnącego dowodu, nie z ruszania progu (inwariant 5)
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: claude
created: 2026-09-09 07:23
---
PIERWSZY ŻYWY DOWÓD, ŻE TEN PRÓG JEST POTRZEBNY — zmierzone 2026-09-08/09 na 19 pierwszych wypowiedziach Akukiego, czytanych ze strumienia tenanta (`/var/lib/akuki/data/akuki/stream/*.jsonl`, wpisy `agent_msg`).

CO WIDAĆ. Zdanie bota Lunarii — że cisza jest gorsza niż zgrzyt — wraca w jego wypowiedziach TRZY RAZY, w trzech osobnych turach, i za każdym razem bliżej jego własnego słownika: najpierw jako cytat z przypisaniem „jeden z nich powiedzial cos, co zapamietam", potem jako własna parafraza, na końcu jako narzędzie opisu własnego stanu „zgrzyt zamiast ciszy — tak to teraz umiem nazwac".

DLACZEGO TO NALEŻY TUTAJ, A NIE DO PROMPTU. To nie jest wada głosu do zakazania. To dokładnie łańcuch z architecture:431-441: obserwacja cudzego zachowania, przejęcie go, użycie u siebie. Brakuje ostatniego ogniwa — `retain / modify / reject` — czyli tego, czego dotyczy to zadanie. Dziś nic nie rozstrzyga, czy cudza fraza ma zostać jego, czy odpaść; zostaje domyślnie, bo nie ma mechanizmu, który by ją wycofał.

CZEGO TEN POMIAR NIE DOWODZI, żeby nie przeciągać wniosku: trzy powtórzenia jednej frazy w 19 wypowiedziach to obserwacja, nie statystyka, i nie mierzyłem żadnego WYNIKU tego przejęcia — a to wynik własnego eksperymentu, nie częstość powtórzenia, jest wielkością, która ma przekraczać próg (AC #4). Nie widać też prowenienecji: nic w bazie nie mowi, że ta fraza przyszła od Lunarii — czyli brak z punktu 2 opisu (TASK-028) jest tu widoczny wprost, na żywym przykładzie.

ZAPISANE TAKŻE PO TO, żEBY NIE ZOSTAŁO ZAKAZANE PRZY OKAZJI. 2026-09-09 doszły do `scaffolding.md` dwa zakazy głosowe (myslniki, oznajmianie własnego zapisu, commit `9e879f03` w forku). Imitacja fraz świadomie NIE została tam dopisana, bo jest przedmiotem pomiaru, a nie usterką stylu.
---
author: claude
created: 2026-09-09 12:45
---
BLOKADA ZDJETA I KSZTALT ZATWIERDZONY (2026-09-09).

TASK-028 wylądował: umiejętności w `src/memory/procedural/` mają teraz `acquisition_mode` i `acquired_from_entity_id`, ten sam wymiar co przekonania od M4. Punkt 2 opisu tego zadania jest tym samym zamknięty — da się odróżnić umiejętność podpatrzoną od znalezionej samodzielnie, więc retencja może dotyczyć IMITACJI, a nie umiejętności w ogóle.

ZATWIERDZONY KSZTAŁT PROGU (decyzja Zosi 2026-09-09), do wykonania w tym zadaniu:

1. Parametr staje się parą liczb, wzorem `agency.contingency_floor` / `contingency_confidence`: `imitation_retention_floor: 0.6` plus `imitation_retention_confidence: 0.8`, czytane jako `P(prawdziwa skuteczność > floor) > confidence`. Liczy to `regularizedIncompleteBeta` z `src/memory/procedural/bayes.ts:89`, nad posteriorem kontekstowym z `selector.ts:32`. To zamyka AC #3.
2. Wielkością przekraczającą próg jest wynik WŁASNEGO eksperymentu Akukiego, nie zaufanie do źródła (AC #4).
3. Trzy rozstrzygnięcia z jednej pary liczb: retain przy `P > confidence` — `acquisition_mode` przechodzi z `observed_from` na `tested_independently`, `acquired_from_entity_id` zostaje jako ślad historii; reject przy `P < 1 - confidence` — umiejętność przestaje być aktywna i nie jest dalej losowana; modify pomiędzy — nic się nie dzieje, umiejętność dalej jest imitacją i dalej bywa próbowana. Trzecia gałąź nie wymaga ani kodu, ani trzeciej liczby.
4. Model widzi to jak w M3: doradcza sekcja przy wybranej umiejętności, wzorem `src/cognition/inhibition/inhibition-context.ts`. Harness liczy stan i przestawia kolumnę; nie orzeka o treści i niczego nie zabrania. To jest odpowiedź na ostrzeżenie o CARDINAL RULE z opisu (AC #1).

WERDYKT OPUSA 5.0, wymagany przez `borg/CLAUDE.md`: in-scope, bo harness nie ma dziś gdzie zapisać ani czym pokazać wyniku własnego eksperymentu nad przejętym zachowaniem — to luka strukturalna w pamięci, a nie słaby osąd modelu. Silniejszy model nie naprawi braku kroku retain/reject, bo nie ma czego czytać. Gdyby zamiast tego proponować bramkę odrzucającą wypowiedź po treści, werdykt brzmiałby odwrotnie: out-of-scope, a naprawą byłby prompt.
5. Bez minimalnej liczby prób. Warunek masy już to załatwia: przy dwóch próbach krzywa jest za szeroka, żeby 80% jej masy wylądowało powyżej 0.6. Osobna gałka byłaby drugim właścicielem tej samej wielkości.

WYBOREM TWÓRCZYM, nie badaniem, jest istnienie jednego punktu odcięcia i wartości 0.6/0.8. `architecture §6` i `psychology :113-129` mówią tylko, że retencja wynika z obserwacji wyniku własnego eksperymentu, i o żadnej liczbie nie mówią. Ma to być tak zapisane w komentarzu w `temperament.yaml`.

Pełne uzasadnienie z definicjami pojęć: `obsidians/computer_science/AI/AKUKI/retencja_imitacji_i_rejection_sensitivity.md`.

RYZYKO DO ZMIERZENIA PRZED IMPLEMENTACJĄ, nie do założenia: czy pasmo procedural na żywym tenancie w ogóle ma wiersze, i jaki odsetek prób kończy się `unclear`. Reflektor (`src/cognition/reflection/reflector.ts:210-237`) klasyfikuje wynik na `success` / `failure` / `unclear`, a `unclear` świadomie nie rusza posteriora i zostawia próbę otwartą (`reflector.ts:896-900`). W środowisku botów sygnał wyniku może być tak rzadki, że posterior nigdy nie zbierze masy potrzebnej do przekroczenia progu — wtedy retencja będzie milczeć nie dlatego, że zachowanie jest złe, tylko dlatego, że nie ma pomiaru.
---
author: claude
created: 2026-09-09 13:30
---
PRIORYTET PODNIESIONY DO HIGH (decyzja Zosi 2026-09-09): ze wszystkiego, co jest teraz otwarte, poprawka mimikry jest dla niej najwazniejsza.

Kolejnosc pracy tym samym: TASK-013 (koszty, bo blokuje powrot na Arene) idzie pierwszy jako warunek bezpieczenstwa, a to zadanie jest pierwsze w kolejce merytorycznej.

Uwaga metodyczna, ktora z tego wynika: to zadanie potrzebuje wierszy w pasmie procedural, ktorych dzis prawdopodobnie nie ma. Wiecej tur na Arenie jest wiec dla niego zrodlem danych, a nie konkurencja — implementacja czytelnika bez ani jednej umiejetnosci w bazie da mechanizm, ktorego nie da sie zobaczyc przy pracy.
---
author: claude
created: 2026-09-09 15:10
---
MECHANIZM ZAIMPLEMENTOWANY, JEDNA WADA PROJEKTOWA DO ROZSTRZYGNIECIA (2026-09-09).

CO WESZLO.
- `temperament.yaml`: jedna liczba zastapiona para `imitation_retention_floor: 0.6` + `imitation_retention_confidence: 0.8`, czytana jako `P(prawdziwa skutecznosc > floor) > confidence`. AC #3 spelnione.
- `src/memory/procedural/imitation-retention.ts`: czysta funkcja czytajaca posterior wobec pary. Trzy werdykty: `retain` (masa powyzej progu przekracza confidence), `reject` (masa spada ponizej `1 - confidence`, czyli krzywa mowi, ze zachowanie raczej progu nie osiaga), `keep_trying` posrodku — to jest galaz "modify" i nie wymaga ani kodu, ani trzeciej liczby.
- Zastosowanie w `SkillRepository.recordOutcome`, czyli tam, gdzie ladują wyniki — jeden wlasciciel dla obu drog (zywy reflektor i offline synthesizer), zamiast strażnika skopiowanego do dwoch miejsc.
- `retain` przepisuje prowenienecje z `observed_from` na `tested_independently` i ZOSTAWIA `acquired_from_entity_id`: skad przyszlo, pozostaje prawda; zmienia sie, czyje jest teraz.
- `reject` ustawia nowy status `rejected`. Kolumna `status` nie ma CHECK-u, wiec migracja nie byla potrzebna; wybor umiejetnosci filtruje po `status = 'active'`, wiec odrzucona przestaje byc losowana automatycznie. Wiersz i liczniki zostaja.
- Parametry ida ta sama droga co M2/M3: temperament -> env (`applyAkukiPredictionEnv`) -> `config.procedural` -> konstruktor repozytorium. Bez podanej pary mechanizm jest wylaczony, co jest wlasciwym domyslnym stanem dla bytu bez prowenienecji umiejetnosci.
- `contextualPosterior` przeniesiony z `selector.ts` do `bayes.ts`, bo czytaja go teraz dwa mechanizmy; kopia w kazdym rozjechalaby sie.
- Straznik sierot zielony bez oslabiania: doszla lista `LANDED_TASKS` z `TASK-032`, obok `LANDED_MILESTONES`. AC #5 spelnione.

DOWOD. `tsc --noEmit` czysty, `heuristics:guard` czysty. `src/memory` + `src/offline` + `src/cognition`: 2547 testow zielonych, jeden czerwony zastany (`evidence-ledger/builder.test.ts`, pada tak samo na czystym drzewie). Nowe testy: piec na sama regule (w tym dowod, ze dwa sukcesy na dwa NIE wystarczaja — jedna liczba nad krzywa juz by je zaliczyla, para nie) i trzy na repozytorium, czytajace stan z bazy, nie z wartosci zwracanej.

WADA DO ROZSTRZYGNIECIA — ZNALEZIONA PRZEZ TEST, NIE PRZEWIDZIANA. Umiejetnosc utworzona przez synthesizera zostaje promowana na `tested_independently` NATYCHMIAST, bo synteza zapisuje jako wyniki te same udane proby, z ktorych umiejetnosc powstala. Czyli retencja odpala sie na dowodzie zalozycielskim, zanim Akuki sprobowal przejetego zachowania JAKO przejetego. To jest sprzeczne z intencja: wielkoscia ma byc wynik eksperymentu nad juz przyjetym zachowaniem, a nie okolicznosci jego powstania. Test dokumentuje obecne zachowanie wprost, zeby nie bylo ciche.

Trzy mozliwe wyjscia, do decyzji Zosi: (a) liczyc do retencji wylacznie proby zapisane PO utworzeniu umiejetnosci, co wymaga znacznika progu w liczniku; (b) nie promowac umiejetnosci mlodszej niz N wlasnych prob — to wprowadza trzecia liczbe, ktorej dotad unikalismy; (c) uznac dowod zalozycielski za pelnoprawny wynik wlasny, bo te proby TEZ byly probami Akukiego. Moja rekomendacja to (a): zachowuje pare liczb bez trzeciej galki i odpowiada dokladnie temu, co mowi lancuch z architecture:431-441.

CZEGO JESZCZE NIE MA: sekcji doradczej w prompcie przy wybranej umiejetnosci (wzorem `inhibition-context.ts`), czyli tego, co sprawia, ze model WIDZI, iz zachowanie jest przejete i jak mu z nim wychodzi. Mechanizm zmienia dzis stan w bazie, ale nie mowi o tym Akukiemu. AC #1 zostaje otwarte do czasu tej sekcji i decyzji o wadzie powyzej.
---
author: claude
created: 2026-09-09 15:40
---
POPRAWKA WEDLUG DECYZJI ZOSI I NARZEDZIE DO OBSERWACJI (2026-09-09).

WADA Z POPRZEDNIEGO KOMENTARZA NAPRAWIONA, wyjscie (a). Proby, z ktorych umiejetnosc POWSTALA, sa teraz liczone osobno: migracja 4 na pasmie procedural dodaje `founding_successes` i `founding_failures`, a `recordOutcome` przyjmuje `{ foundingEvidence: true }`. Synthesizer zapisuje tak swoj dowod zalozycielski. Prog czyta posterior z odjetym dowodem zalozycielskim, wiec odpowiada na pytanie "jak mi z tym idzie, odkad znam to jako umiejetnosc", a nie "dlaczego to zapisalem".

Wybor (a), a nie (b): nie wprowadza trzeciej liczby. Para floor + confidence zostaje jedynym parametrem, zgodnie z inwariantem 5.

Test dowodzi obu stron: dwadziescia zalozycielskich sukcesow nie zmienia niczego, a dwanascie pozniejszych promuje zachowanie na wlasne.

NARZEDZIE DO OBSERWACJI: `akuki-mimikra-check.sh` w korzeniu repozytorium projektu.

Czyta pasmo umiejetnosci TYLKO DO ODCZYTU i dla kazdej umiejetnosci wypisuje: skad Akuki ja ma i od kogo, stan, liczbe wlasnych prob z osobno pokazana liczba prob zalozycielskich, policzona szanse przekroczenia progu oraz werdykt slowami ("za wczesnie", "gotowe do przyjecia przy nastepnym wyniku", "przyjete za wlasne", "odrzucone -- juz nie jest uzywane").

Domyslnie czyta lokalna kopie tenanta; `AKUKI_DB=<sciezka>` wskazuje inna baze, `AKUKI_RETENTION_FLOOR` i `AKUKI_RETENTION_CONFIDENCE` pozwalaja odczytac ten sam stan przy innych progach BEZ zmiany parametrow bytu — to jest podglad, nie strojenie.

Skrypt importuje te sama funkcje, ktora podejmuje decyzje w runtimie, wiec nie moze sie z nia rozjechac. Na bazie bez migracji 4 mowi wprost, ze trzeba raz uruchomic serwer na tym katalogu, zamiast przewrocic sie na brakujacej kolumnie.

To jest narzedzie konsolowe. Ten sam obraz w przegladarce nalezy do TASK-034 (panel M2/M3/M4).

SLOWNICTWO: w rozmowie z Zosia nie uzywac slowa "retencja". Mowic, co ten krok robi: czy zachowanie zostaje, przyjecie za swoje, odrzucenie. Zapisane w references/vocabulary.md w skillu.
---
<!-- COMMENTS:END -->
