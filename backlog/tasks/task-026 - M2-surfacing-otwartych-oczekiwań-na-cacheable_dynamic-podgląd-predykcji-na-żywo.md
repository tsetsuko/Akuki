---
id: TASK-026
title: >-
  M2+: surfacing otwartych oczekiwań na cacheable_dynamic (podgląd predykcji na
  żywo)
status: To Do
assignee: []
created_date: '2026-09-02 16:25'
labels:
  - akuki
  - M2
  - cognition
  - deferred
dependencies:
  - TASK-015
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Odłożony (świadomie) kawałek M2/TASK-015. Sprawić, by Akuki WIDZIAŁ swoje otwarte oczekiwania (predictionRepository.listOpen, recall globalny) w trakcie tury i mógł nad nimi rozumować na żywo.

Wpięcie: DeliberationContext -> buildBaseSystemPromptSections -> nowy blok w prompt-surface-registry na powierzchni cacheableDynamic (ZA granicą cache, order po istniejących dynamicznych blokach), zasilany z listOpen w fazie retrieval/deliberation. NIGDY na cacheable_static_prefix.

Powód odłożenia: jedyny kawałek M2 dotykający gorącej ścieżki promptu; nie jest wymagany przez żaden AC M2 (producent/pamięć/cache spełnione bez niego). Ryzyko: regresja cache_read. Zosia zdecydowała nie utrudniać wymagającego projektu i domknąć M2 na slice 1-4.

Blocked-by: TASK-015 (M2 rdzeń) - GOTOWE. Wymaga weryfikacji cache_read niezerowy po dodaniu bloku (żywy smoke Anthropic-only lub deterministyczny test niezmienności static prefix).
<!-- SECTION:DESCRIPTION:END -->
