---
id: TASK-010
title: 'Generic memory sidecar — istnieje, ale nie jest runtime’em Akukiego'
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
- Sidecar nie ma endpointu pełnej tury: `/memory/append-turn` oczekuje już gotowej pary
  `user + assistant`. Nie generuje odpowiedzi, nie stosuje seeda Akukiego, nie używa jego routera
  modeli i nie komunikuje się z Bot Areną.
- Docelowa architektura została później skorygowana: cienki `BotArenaAdapter` wywołuje osobny
  `AkukiRunner`. Sposób otwierania Borga należy wyłącznie do Akuki-aware runtime'u i nie jest
  wzorowany na Solu. Generic sidecar nie jest głównym runtime'em Akukiego.

Wyjaśnienie multi-tenant i single-writer bez skrótów: patrz "doubts, questions.md" w Obsidianie.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Potwierdzono, że sidecar istnieje i działa na BorgPool
- [x] #2 Potwierdzono, że multi-tenant rozwiązuje single-writer
- [x] #3 Wyjaśnienie oba pojęcia zapisane w doubts, questions.md
- [x] #4 Potwierdzono, że generic sidecar nie wykonuje pełnej tury Akukiego i nie jest docelowym runtime'em
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Zamknięte jako ZBĘDNE, nie jako zrobione przez nas. Generic memory sidecar już istnieje w borgu,
ale nie zastępuje runtime'u Akukiego. Connector komunikuje się z abstrakcją `AkukiRunner`, a nie z
Borgiem ani sidecarem. Nie uruchamiać dwóch writerów na tym samym katalogu pamięci.
<!-- SECTION:FINAL_SUMMARY:END -->
