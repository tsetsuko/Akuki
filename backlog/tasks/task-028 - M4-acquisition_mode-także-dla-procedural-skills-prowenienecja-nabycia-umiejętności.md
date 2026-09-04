---
id: TASK-028
title: >-
  M4+: acquisition_mode także dla procedural skills (prowenienecja nabycia
  umiejętności)
status: To Do
assignee: []
created_date: '2026-09-03 13:35'
labels:
  - akuki
  - M4
  - deferred
  - mimicry
dependencies:
  - TASK-017
type: enhancement
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Odłożone z M4 (decyzja Zosi 2026-09-03, D3): acquisition_mode wchodzi najpierw TYLKO na semantic beliefs. Tu: rozszerzyć ten sam wymiar prowenienecji nabycia (told_by / observed_from / inferred / tested_independently, + acquired_from_entity_id) na PROCEDURAL SKILLS (src/memory/procedural/).

Powod: umiejetnosc podpatrzona u silniejszego bota vs sprawdzona samodzielnie to ta sama os mimikra-vs-roznicowanie co dla przekonan. Skille to drugie naturalne miejsce, gdzie Akuki 'przejmuje' zachowanie.

Wzorzec: identyczny jak M4 czesc 2 na semantic (CHECK constraint + migracja + pole + producent ekstrakcji). Blocked-by TASK-017 (M4 rdzen).
<!-- SECTION:DESCRIPTION:END -->
