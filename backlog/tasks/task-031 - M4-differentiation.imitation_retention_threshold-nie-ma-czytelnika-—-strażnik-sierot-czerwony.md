---
id: TASK-031
title: >-
  M4: differentiation.imitation_retention_threshold nie ma czytelnika — strażnik
  sierot czerwony
status: Done
assignee: []
created_date: '2026-09-04 10:10'
updated_date: '2026-09-04 12:48'
labels:
  - akuki
  - M4
dependencies:
  - TASK-017
priority: high
type: bug
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ujawnione 2026-09-04 przez dopisanie "M4" do LANDED_MILESTONES (borg/src/akuki/seed/temperament.ts:181, decyzja Zosi). Strażnik sierot z M1 od razu zrobił to, do czego został napisany, i zapalił się na czerwono:

    AssertionError: expected [ Array(1) ] to deeply equal []
    + "differentiation.imitation_retention_threshold (consumer M4 has landed)"

borg/src/akuki/seed/temperament.test.ts > "fails for a parameter whose milestone has landed and which nothing reads". Pozostałe 74 testy w src/akuki zielone; typecheck czysty.

CO TO ZNACZY. `differentiation.imitation_retention_threshold: 0.6` istnieje w temperament.yaml:66 i w schemacie (temperament.ts:149), ma przypisanego konsumenta M4 (temperament.ts:174), ale ŻADEN kod poza tymi deklaracjami go nie czyta. Sprawdzone: `grep -rn "imitation\|mimicry\|differentiation" --include=*.ts src/` z pominięciem testów zwraca wyłącznie te trzy linie plus niezwiązany komentarz w src/memory/semantic/types.ts:34.

To jest dokładnie przypadek, dla którego AC #4 z M1 powstało: parametr, którego nikt nie czyta, jest dekoracją, a nie mechanizmem. Test "czy to istnieje w bazie, kiedy nikt nie patrzy" wyłapał go poprawnie.

CZEGO TO NIE ZNACZY. M4 nie jest przez to niezrobiony. Zaufanie per domena i prowenienecja nabycia wylądowały i mają czytelników: social_trust_domains (src/memory/social/migrations.ts:48-67, repository.ts:564) oraz semantic_nodes.acquisition_mode wraz z acquired_from_entity_id (src/memory/semantic/migrations.ts:110-131). Brakuje jednego progu, nie kamienia milowego.

DLACZEGO NIE DOPISAŁEM CZYTELNIKA OD RĘKI. Wpięcie progu retencji imitacji to nowy mechanizm: trzeba rozstrzygnąć, co ten próg właściwie bramkuje (zatrzymanie zaobserwowanego zachowania? promocja przekonania z observed_from na własne? coś jeszcze), a to podlega sześciostopniowej bramce ze SKILL.md — łącznie z nazwaniem badania i zgodą przed implementacją.

DO ROZSTRZYGNIĘCIA, trzy uczciwe wyjścia:
1. wpiąć próg w istniejący mechanizm M4 (wymaga projektu i zgody),
2. przenieść konsumenta z "M4" na późniejszy kamień w TEMPERAMENT_CONSUMERS, jeśli próg z założenia należy do czegoś, co jeszcze nie wylądowało,
3. usunąć parametr z temperament.yaml, jeśli okaże się, że powstał na zapas.

Do czasu decyzji `npx vitest run src/akuki/seed/temperament.test.ts` jest czerwony. Rewers jest jednolinijkowy: usunięcie "M4" z LANDED_MILESTONES przywraca zieleń i ukrywa problem.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rozstrzygnięte, które z trzech wyjść obowiązuje: wpięcie czytelnika, zmiana konsumenta na późniejszy kamień, albo usunięcie parametru
- [ ] #2 Jeśli wpięcie: projekt przeszedł sześciostopniową bramkę i Zosia zaakceptowała go przed implementacją
- [x] #3 temperament.test.ts „fails for a parameter whose milestone has landed and which nothing reads” znowu zielony, bez osłabiania samego strażnika
- [x] #4 LANDED_MILESTONES nadal zawiera M4 — zieleni nie osiągnięto przez cofnięcie wpisu
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
USTALENIE, CO TEN PRÓG MIAŁ BRAMKOWAĆ (2026-09-04).

Komentarz w temperament.yaml wskazywał architecture:431-441, gdzie mimikra jest opisana jako eksperyment społeczny: `observe behavior -> imitate -> observe outcome -> compare result -> retain / modify / reject`. Łańcuch główny (architecture:775-779) ustawia to w kolejności: `selective social learning -> experimentation -> retain / modify / reject`. Psychology :117-129 mówi to samo (`observation -> hypothesis -> small experiment -> social outcome -> interpretation -> possible self-update`), a :113 wprost: „observation does not automatically become imitation".

Wniosek: zaufanie jest KROK WCZEŚNIEJ (od kogo się uczyć), retencja krok PÓŹNIEJ i liczy się z wyniku WŁASNEGO eksperymentu Akukiego. Wielkość przekraczająca 0.6 to „jak dobrze X zadziałało u mnie", nie „jak ufam Solowi".

DLACZEGO M4 NIE DAŁO CZYTELNIKA. M4 zbudowało górną połowę: social_trust_domains (social/migrations.ts:48-67, getDomainTrust social/repository.ts:564) odpowiada „komu wierzyć i w czym", a semantic_nodes.acquisition_mode + acquired_from_entity_id (semantic/migrations.ts:110-131) zapisuje, jak nabyto PRZEKONANIE. Dolnej połowy nie ma:
1. Nic nie zapisuje „Akuki spróbował zachowania X przejętego od E, wynik był Y". Przekonania mają prowenienecję, zachowania nie — TASK-028, otwarte.
2. Sam pomiar wyniku istnieje osobno: pasmo procedural trzyma posteriory Beta z kontekstowymi statystykami (procedural/selector.ts:32). Bez prowenienecji nie ma retencji IMITACJI, jest tylko retencja umiejętności w ogóle.
3. Pasmo procedural nie ma kroku retain/reject w ogóle: `grep -rn "retire|prune|abandon|threshold" src/memory/procedural/` bez testów zwraca zero. Umiejętności są wybierane przez Thompson sampling i nigdy nie wycofywane po progu.

TRZY WYJŚCIA PRZEDSTAWIONE ZOSI I ICH OCENA.

(a) wpiąć czytelnika w wylądowany stan M4. Jedyny wariant policzalny dziś: join przekonania (acquisition_mode w told_by|observed_from, acquired_from_entity_id = E) do getDomainTrust(E, node.domain) i próg 0.6 jako granica renderu. Cztery zarzuty: (i) to inny mechanizm niż nazwa parametru — adopcja ważona zaufaniem, czyli krok wcześniejszy; (ii) dwie niezależne przestrzenie etykiet domen (semantic/domain.ts:1 vs prompts/domain-trust-extraction.ts:7), więc join po dokładnym stringu po cichu nigdy nie odpala; (iii) progowanie średniej wyrzuca szerokość krzywej, o którą walczyło AC#2 z M4; (iv) decydowanie w harnessie „to przekonanie jest już własne Akukiego" to legislowanie osądu wbrew CARDINAL RULE.

(b) przenieść konsumenta. Wskazanie „M5" odrzucone jako drugi zły etykiet na zaparkowanym kamieniu. Podwariant b1: rozszerzyć słownik konsumenta na „kamień milowy ALBO jedno zadanie z backlogu", żeby klucz nazwał właściciela czytelnika wprost.

(c) usunąć parametr. REKOMENDACJA AGENTA, nieprzyjęta. Argument był o kształcie, nie o porządku: jedna liczba nad krzywą nie nazywa żadnej wielkości — ta sama wada, którą M1 naprawiło rozbijając agency na contingency_floor + contingency_confidence (temperament.yaml:56-59). Retencja czyta ten sam rodzaj obiektu, więc jej parametr też będzie parą liczb.

DECYZJA ZOSI: b1 (2026-09-04), z zapisaną wprost niepewnością („nie wiem czy to dobra decyzja"). Argument, który za tym stoi: b1 nie rozstrzyga niczego nieodwracalnie — parametr zostaje, strażnik dalej pilnuje, a (c) da się zrobić później za darmo; odwrotnie skasowany parametr trzeba by odtworzyć razem z uzasadnieniem. Pytanie o kształt zostaje do rozstrzygnięcia przy realnym czytelniku, nie z góry.

DECYZJA DOMYŚLNA AGENTA W RAMACH b1: konsumentem NIE jest TASK-028, bo prowenienecja umiejętności to tylko połowa tego, czego próg potrzebuje — samo TASK-028 wchodzi i strażnik znów staje na czerwono na to samo pytanie. Założone TASK-032 na sam czytelnik retencji (blokowane przez TASK-028) i tam wskazuje konsument, żeby strażnik odpalił dokładnie wtedy, kiedy powinien.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Zamknięte wyjściem b1: słownik konsumenta parametrów obejmuje teraz kamień milowy ALBO jedno zadanie z backlogu, a `differentiation.imitation_retention_threshold` wskazuje TASK-032 (czytelnik retencji imitacji, blokowany przez TASK-028) zamiast M4. Żaden mechanizm nie został zaimplementowany.

ZMIANY W KODZIE (borg, gałąź akuki-dev):
- `src/akuki/seed/temperament.ts` — nowy typ `TaskId = \`TASK-${string}\`` i `ParameterConsumer = Milestone | TaskId` (:170-173) z komentarzem mówiącym, dlaczego „M4" był złą etykietą i dlaczego „M5" byłby drugą złą. `TEMPERAMENT_CONSUMERS` przetypowane na `ParameterConsumer` (:182); klucz differentiation wskazuje `"TASK-032"` (:192). `findOrphanParameters` przyjmuje `ParameterConsumer` w obu parametrach (:219-221), zmienna lokalna `milestone` przemianowana na `consumer`, format komunikatu bez zmian. `LANDED_MILESTONES` NIETKNIĘTE co do nazwy i treści (:202) — nadal `["M0","M1","M2","M3","M4"]`, czyli AC#4 spełnione literalnie; dopisany komentarz, że konsument zadaniowy trafia tu dopiero z czytelnikiem.
- `src/akuki/seed/temperament.yaml` — grupa `differentiation` (:63-77) nosi teraz `consumer: TASK-032` plus zapis wprost: nic tego nie czyta i jest to świadome, M4 zbudowało tylko górną połowę, a KSZTAŁT JEST TYMCZASOWY, bo jedna liczba nad krzywą nie nazywa żadnej wielkości.
- `src/akuki/seed/temperament.test.ts` — dwa nowe testy na wariant zadaniowy: „stays quiet about a parameter whose consumer is a task that has not landed" i „reports a parameter whose consumer task has landed and which nothing reads". Drugi jest tam dlatego, że strażnik, którego nie da się pokazać jako padającego, jest gorszy niż brak strażnika (znane-wady §6).

STRAŻNIK NIEOSŁABIONY. `collectSources` bez zmian, zero wyjątków per klucz, dopasowanie nadal na pełnym akcesorze `grupa.klucz`. Klucz milczy przez tę samą linię `if (!landed.includes(consumer)) continue`, która wycisza `agency.*` przy zaparkowanym M5 — nie przez nową gałąź. Przeetykietowanie przesuwa moment, w którym strażnik strzela, i nigdy go nie wyłącza.

DOWÓD: `npm run typecheck` (5 tsconfigów) exit 0. `npx vitest run src/akuki` — 7 plików, 77/77 zielonych (było 74/75 z jednym czerwonym; 75 + 2 nowe testy = 77). Kod wyjścia czytany z vitest, nie z filtra (znane-wady §5).

DOKUMENTY W TYM SAMYM PRZEBIEGU:
- `doubts, questions.md` — dwie nowe sekcje: „Q: What is a reader (czytelnik)..." z definicjami słownictwa borga (pasmo pamięci, CHECK, provenance_kind vs acquisition_mode, ekstraktor poturowy, advisory vs bramka, etykieta disclosure, test Opusa 5.0) oraz zapis znaleziska, trzech wyjść i decyzji.
- `references/vocabulary.md` — czytelnik/konsument, strażnik sierot, pasmo pamięci, CHECK, ekstraktor poturowy, advisory vs bramka, etykieta disclosure.
- `references/borg-inventory.md` — luka 3 uzupełniona sprawdzonym ustaleniem, że pasmo procedural ma posteriory, ale zero prowenienecji i zero kroku retain/reject.
- `references/future-development.md` — zamykający akapit poprawiony: TASK-031 nie zostało zaparkowane, tylko przeetykietowane, a czytelnik retencji jest żywym zadaniem (TASK-032), bo reguła tego pliku mówi, że zaparkowany pomysł nie jest pozycją w backlogu.
- `KNOWN-ISSUES.md` — wpis „czerwony celowo" oznaczony jako rozstrzygnięty, z zapisem, że zieleń NIE przyszła z cofnięcia M4.
- TASK-032 założone z opisem, ostrzeżeniami z bramki i sześcioma AC, w tym poprawieniem kształtu parametru na parę liczb.

AC#2 ZOSTAJE NIEODHACZONE ŚWIADOMIE: jego przesłanka („jeśli wpięcie") nie zaistniała, bo wybrano b1, a nie (a). Nic nie zostało zaimplementowane jako mechanizm, więc nie ma projektu, który miałby przejść bramkę — ta bramka czeka w TASK-032 AC#2.

CZEGO TO NIE ZAŁATWIA: parametr nadal nie ma czytelnika i nadal jest niesfalsyfikowany, a jego kształt jest znany jako zły. To jest cena b1, zapisana tu wprost, żeby nie wyglądała na rozwiązaną. Ryzyko do pilnowania: półka może stać się stała. Warunek powrotu do tematu to TASK-028 plus TASK-032.
<!-- SECTION:FINAL_SUMMARY:END -->
