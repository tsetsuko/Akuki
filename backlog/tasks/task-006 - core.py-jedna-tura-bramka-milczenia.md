---
id: TASK-006
title: core.py - jedna tura + bramka milczenia
status: Done
assignee: []
created_date: '2026-08-19 11:31'
labels: []
dependencies: []
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
respond() to jedyne miejsce, gdzie dzieje się tura. Sentinel <silent> -> None. Mapowanie transkryptu na wiadomości API (scalanie kolejnych tych samych ról).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Milcząca tura nie zapisuje jego własnej wiadomości
- [ ] #2 Usłyszana wiadomość zapisuje się zawsze
<!-- AC:END -->
