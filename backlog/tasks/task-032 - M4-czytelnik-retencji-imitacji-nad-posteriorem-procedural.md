---
id: TASK-032
title: 'M4+: czytelnik retencji imitacji nad posteriorem procedural'
status: To Do
assignee: []
created_date: '2026-09-04 12:46'
updated_date: '2026-09-09 07:23'
labels: []
dependencies:
  - TASK-028
priority: medium
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
<!-- COMMENTS:END -->
