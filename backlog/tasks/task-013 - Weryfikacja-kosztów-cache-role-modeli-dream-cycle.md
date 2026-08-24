---
id: TASK-013
title: 'Weryfikacja kosztów: cache, role modeli, dream cycle'
status: To Do
assignee: []
created_date: '2026-08-20 14:28'
labels: []
dependencies: []
priority: high
ordinal: 1500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Budżet tokenów jest wspólny z zespołem, więc to twardy warunek, nie ozdoba. Żadna z tych rzeczy to nie nowy kod.

1. CACHE JUŻ JEST. finalizer.ts:377-381 ma dwa poziomy: statyczny prefiks ttl 1h, dynamiczny ttl 5m. Planner ma swój. request-fingerprint.ts:67 liczy breakpointy. ZADANIE: nie zepsuć. Cache działa na dokładne dopasowanie prefiksu, więc wyjście mechanizmów idzie na KONIEC promptu, nigdy wklejane na początek. Sprawdzaj usage.cache_read_input_tokens - zero przy powtarzanych turach znaczy, że coś unieważnia cache.

2. TANIE MODELE NA ROLE WOLUMENOWE. Pięć niezależnych ról (src/config/index.ts:1128-1150): cognition, background, extraction, recallExpansion, creatorDirective. Tylko cognition musi być doskonałe. extraction i recallExpansion chodzą bez przerwy i są mechaniczne.

3. ŚCIEŻKA NIE-ANTHROPIC. borg eksportuje OpenAICompatibleLLMClient (src/llm/index.ts:436), llmClient jest wstrzykiwalny -> P4/kratos osiągalne (sidecar już wspomina kratos + NODE_EXTRA_CA_CERTS). UWAGA: openai-compatible.ts:105 mówi, że cache_control nie ma odpowiednika w OpenAI, więc ta ścieżka NIE MA cache. Cachowane wywołanie Anthropic może być tańsze niż niecachowane darmowe. Mierzyć, nie zgadywać.

4. DREAM CYCLE to cichy koszt - dwanaście procesów offline, każdy woła LLM. maintenance.lightProcesses / heavyProcesses je bramkują; usunięcie z obu wyłącza. Na czas rozwoju mechanizmów włączone tylko to, co badane.

O AGENTACH: borg już robi wiele wywołań LLM o różnych rolach na turę. Dodanie agentów (krytyk, sędzia, panel) podnosi jakość I koszt razem - to nie optymalizacja. Sędzia do oceny rozwoju: offline nad snapshotami, tanim modelem, poza ścieżką tury.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 cache_read_input_tokens niezerowe przy powtarzanych turach
- [ ] #2 Role wolumenowe zmierzone: Anthropic z cache vs P4 bez cache
- [ ] #3 Wyłączone procesy dream, które nie są badane
<!-- AC:END -->
