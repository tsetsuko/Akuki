---
id: TASK-028
title: >-
  M4+: acquisition_mode także dla procedural skills (prowenienecja nabycia
  umiejętności)
status: Done
assignee: []
created_date: '2026-09-03 13:35'
updated_date: '2026-09-09 12:40'
labels:
  - akuki
  - M4
  - deferred
  - mimicry
dependencies:
  - TASK-017
type: enhancement
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Odłożone z M4 (decyzja Zosi 2026-09-03, D3): acquisition_mode wchodzi najpierw TYLKO na semantic beliefs. Tu: rozszerzyć ten sam wymiar prowenienecji nabycia (told_by / observed_from / inferred / tested_independently, + acquired_from_entity_id) na PROCEDURAL SKILLS (src/memory/procedural/).

Powod: umiejetnosc podpatrzona u silniejszego bota vs sprawdzona samodzielnie to ta sama os mimikra-vs-roznicowanie co dla przekonan. Skille to drugie naturalne miejsce, gdzie Akuki 'przejmuje' zachowanie.

Wzorzec: identyczny jak M4 czesc 2 na semantic (CHECK constraint + migracja + pole + producent ekstrakcji). Blocked-by TASK-017 (M4 rdzen).
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Wykonane 2026-09-09 w forku (borg, branch akuki-dev). Rozszerzono os prowenienecji nabycia z przekonan na umiejetnosci, wzorem M4 czesc 2 na semantic.

WSPOLNY WLASCICIEL SLOWNIKA. Cztery wartosci (told_by / observed_from / inferred / tested_independently) mieszkaly dotad w `src/memory/semantic/types.ts` jako `SEMANTIC_ACQUISITION_MODES`. Poniewaz dwa pasma pamieci niosa teraz te sama os, slownik przeniesiono do nowego `src/memory/common/acquisition-mode.ts` (obok istniejacego `common/disclosure-label.ts`), a nazwy semantyczne zostaly jako aliasy, zeby ekstraktor i repozytorium semantic nie wymagaly przepisania. Doszlo tez `acquisitionModeImpliesSource()`, ktore nazywa te dwa tryby wskazujace druga strone.

MIGRACJA. `src/memory/procedural/migrations.ts`, migracja id 3 "skills_acquisition_mode": dwie kolumny na `skills` (`acquisition_mode` TEXT NULL z CHECK-iem na czterowartosciowy slownik, `acquired_from_entity_id` TEXT NULL) plus czesciowy indeks `idx_skills_acquisition_mode`. Migracja jest idempotentna (`tableHasColumn` + `CREATE INDEX IF NOT EXISTS`), wiec przechodzi na istniejacym tenancie bez resetu.

PERSYSTENCJA. `src/memory/procedural/types.ts`: dwa pola na `skillSchema`, oba z domyslnym null. `src/memory/procedural/repository.ts`: typ wiersza SQL, `rowFromSkill`, `skillFromRow`, kolumny w INSERT/ON CONFLICT oraz dwa nowe opcjonalne wejscia `add()`: `acquisitionMode` i `acquiredFromEntityId`.

PRODUCENT. Wytworca jest offline procedural-synthesizer, czyli miejsce, w ktorym umiejetnosc w ogole powstaje (`src/offline/procedural-synthesizer/index.ts`). Schemat narzedzia `EmitProceduralSkillCandidate` dostal `acquisition_mode` i `acquired_from_entity_id`, prompt dostal dwa zdania instrukcji oraz blok `<identity_anchors_by_entity_id>` zbudowany z uczestnikow epizodow zrodlowych (`identityAnchorsForEpisodes`). Uczestnicy epizodu sa wolnymi stringami, wiec pod uwage brane sa tylko te, ktore sa prawidlowym identyfikatorem encji i rozwiazuja sie w `entityRepository`. `resolveAcquiredFromEntityId` zapisuje identyfikator tylko wtedy, gdy tryb wskazuje osobe I identyfikator jest jedna z podanych kotwic — zmyslony identyfikator jest odrzucany, a nie zapisywany, wiec halucynacja nigdy nie staje sie prowenienecja.

DLACZEGO NULL, A NIE "tested_independently". Brak zapisu znaczy "nie wiadomo", nie "znalazl sam". Odwrotna domyslnosc kasowalaby dokladnie te roznice, dla ktorej to zadanie powstalo.

TESTY DOPISANE (obok istniejacych, ktore zostaly nietkniete):
- `src/memory/procedural/repository.test.ts` — round-trip trybu i zrodla; osobno dowod, ze CHECK odrzuca wartosc spoza slownika (ten sam INSERT z poprawna wartoscia przechodzi, wiec odrzucenie jest CHECK-iem, a nie zlym INSERT-em).
- `src/offline/procedural-synthesizer/index.test.ts` — synteza dwoch umiejetnosci: przy prawdziwej kotwicy zrodlo zostaje zapisane, przy zmyslonym identyfikatorze tryb zostaje, a zrodlo jest null.

DOWOD. `npx tsc --noEmit` czysty. `npm run heuristics:guard` czysty. `npx vitest run src/memory/procedural src/offline/procedural-synthesizer src/memory/semantic src/akuki` — 20 plikow, 236 testow zielonych przed dopisaniem nowych; po dopisaniu procedural 27/27 i synthesizer 33/33.

STAN PELNEGO SUITE, uczciwie: 24 testy w 7 plikach sa czerwone (assessor/cli, assessor/scenarios, scripts/chat, scripts/debug, simulator/runner, cognition/evidence-ledger/builder). Sprawdzone przez `git stash` — dokladnie te same padaja na czystym drzewie, wiec sa zastane i niezwiazane z ta zmiana. Objaw wskazuje na srodowisko: testy porownuja stderr podprocesu z pustym stringiem, a pnpm dokleja tam linie "Lockfile passes supply-chain policies". `demo/server/src/__tests__/server.test.ts` przewrocilo sie raz pod pelnym obciazeniem i przechodzi 90/90 uruchomione osobno, na obu drzewach.

DO SPRZATNIECIA PRZY OKAZJI, nie moje: uruchomienie testow zostawia nieszledzone `demo/server/package-lock.json` i `demo/web/package-lock.json`.

CO TO ODBLOKOWUJE. TASK-032: od teraz da sie odroznic umiejetnosc podpatrzona u kogos od znalezionej samodzielnie, wiec prog retencji moze liczyc retencje IMITACJI, a nie retencje umiejetnosci w ogole.

CZEGO TO JESZCZE NIE DAJE. Zaden zywy wiersz nie ma jeszcze tej kolumny wypelnionej — na tenancie VPS pasmo procedural jest, wedle mojej przewidywanej wartosci, puste. To jest do zmierzenia przed TASK-032, nie do zalozenia.
<!-- SECTION:NOTES:END -->
