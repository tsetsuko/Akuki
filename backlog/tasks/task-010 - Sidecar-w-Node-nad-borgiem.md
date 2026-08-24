---
id: TASK-010
title: 'Sidecar w Node nad borgiem — ZBĘDNE, już istnieje'
status: Done
assignee: []
created_date: '2026-08-19 11:31'
updated_date: '2026-08-20 13:58'
labels: []
dependencies: []
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pierwotny plan: napisać własny mały serwer w Node, który trzyma otwartego borga i wystawia POST /turn na localhoście, żeby Python mógł z nim rozmawiać.

Analiza kodu borga wykazała, że to już istnieje i nie trzeba tego pisać:

- `scripts/memory-sidecar-main.ts` (195 linii) — serwer HTTP nad borgiem.
- Oparty na `BorgPool` (`src/borg/pool.ts`) — multi-tenant: JEDEN proces trzyma WIELE osobnych bytów, każdy z własnym katalogiem `<root>/<tenant>/` i własnym config.json.
- To rozwiązuje też problem single-writer: borg trzyma pamięć w plikach SQLite, a dwa procesy piszące do tych samych plików psują je albo blokują. Jeden proces piszący do wielu osobnych katalogów jest bezpieczny.
- Akuki będzie tenantem `akuki`. Sol zostaje nietknięty. Osobne pamięci, osobne konfiguracje.

Wyjaśnienie multi-tenant i single-writer bez skrótów: patrz "doubts, questions.md" w Obsidianie.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Potwierdzono, że sidecar istnieje i działa na BorgPool
- [x] #2 Potwierdzono, że multi-tenant rozwiązuje single-writer
- [x] #3 Wyjaśnienie oba pojęcia zapisane w doubts, questions.md
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Zamknięte jako ZBĘDNE, nie jako zrobione przez nas. Sidecar już jest w borgu: scripts/memory-sidecar-main.ts na BorgPool (multi-tenant, jeden proces = jeden pisarz na wiele osobnych katalogów pamięci). Akuki wchodzi jako tenant "akuki" obok Sola.
<!-- SECTION:FINAL_SUMMARY:END -->
