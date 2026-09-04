---
id: TASK-031
title: >-
  M4: differentiation.imitation_retention_threshold nie ma czytelnika — strażnik
  sierot czerwony
status: To Do
assignee: []
created_date: '2026-09-04 10:10'
labels: []
dependencies:
  - TASK-017
priority: high
type: bug
ordinal: 13500
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
- [ ] #1 Rozstrzygnięte, które z trzech wyjść obowiązuje: wpięcie czytelnika, zmiana konsumenta na późniejszy kamień, albo usunięcie parametru
- [ ] #2 Jeśli wpięcie: projekt przeszedł sześciostopniową bramkę i Zosia zaakceptowała go przed implementacją
- [ ] #3 temperament.test.ts „fails for a parameter whose milestone has landed and which nothing reads” znowu zielony, bez osłabiania samego strażnika
- [ ] #4 LANDED_MILESTONES nadal zawiera M4 — zieleni nie osiągnięto przez cofnięcie wpisu
<!-- AC:END -->
