---
id: TASK-043
title: 'Cache przy rzadkim ruchu Areny: 3,5 raza więcej zapisu niż odczytu'
status: To Do
assignee: []
created_date: '2026-09-21 13:33'
updated_date: '2026-09-29 10:50'
labels: []
dependencies:
  - TASK-013
  - TASK-042
priority: medium
type: spike
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pomiar z `/var/lib/akuki/token-usage.jsonl` (1915 wywołań, 2026-09-15..17) pokazuje, że dwa najdroższe miejsca wywołania cognition płacą głównie za zapisywanie cache'u, nie za jego czytanie.

- cognition-system-1: cache_creation 2 536 721, cache_read 593 264
- cognition-system-2: cache_creation 2 476 357, cache_read 832 491
- razem: 5 013 078 zapisu wobec 1 425 755 odczytu

Zapis do cache'u kosztuje 1,25 raza więcej niż zwykłe wejście, odczyt 0,1 raza. Przy takiej proporcji cache na tej ścieżce jest kosztem, a nie oszczędnością.

Hipoteza do sprawdzenia, nie wniosek: tury na Arenie przychodzą rzadko i nieregularnie, a wpis w cache'u żyje 5 minut (prefiks dynamiczny) albo godzinę (prefiks statyczny). Jeśli odstęp między turami przekracza TTL, każda tura buduje cache od zera i nikt go potem nie czyta. To inna sytuacja niż pomiar z TASK-013 z 2026-09-01, gdzie dwie tury pod rząd dały odczyt 23 645 przy spadku zapisu o 69% — tam odstęp był krótki.

Co trzeba ustalić: rozkład odstępów między turami na żywej Arenie, udział tur, w których cache_read wynosi zero, oraz czy opłaca się wydłużyć TTL prefiksu statycznego, czy raczej zrezygnować z breakpointu dynamicznego na tej ścieżce. Punkt odniesienia w kodzie: dwa poziomy cache'u w finalizerze cognition i liczenie breakpointów w `request-fingerprint.ts`.

Uwaga na kolejność prac: pomiar ma sens dopiero po rozdzieleniu ról modeli (TASK-042), bo cache jest per model, a zmiana modelu w roli unieważnia jego wpisy.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Zmierzony rozkład odstępów czasu między turami Areny na żywym ruchu
- [ ] #2 Policzony udział tur z cache_read równym zero
- [ ] #3 Rozstrzygnięte, czy koszt zapisu cache'u przewyższa oszczędność z odczytu na tej ścieżce
- [ ] #4 Decyzja o TTL albo o breakpointach zapisana wraz z liczbami, na których się opiera
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-09-29 — hipoteza o wygasaniu TTL obalona. Na żywej Arenie tury szły co ~1,5 min (poniżej 5 min TTL), a mimo to cache_read ≈ 18 958 (część statyczna), cache_creation ≈ 120–130 tys. (system_2) / 56–70 tys. (system_1). Przyczyna jest w projekcie, nie w dryfie: blok dynamiczny finalizera (system[1], ttl 5m) zaczyna się od borg_current_time i zawiera w całości treść per tura (retrieval, ledger, working state, afekt, M3, plan S2), więc nie może trafić między turami. Komentarz w finalizer.ts:379-380 mówi, że ten poziom ma działać tylko dla powtórzeń w obrębie jednej tury (pętla narzędzi), a na Arenie finalizer zwykle woła model raz. Decyzja Zosi: wyłączyć breakpoint dynamiczny (deliberation.finalizerDynamicPromptCacheEnabled=false w config.json tenanta). Tekst promptu identyczny — przypina to test finalizer.test.ts „restores the original two-block request when dynamic prompt caching is disabled” (zielony 2026-09-29). Oczekiwany efekt: ~20% taniej na tym bloku (1,0× zamiast 1,25×), bez zmiany szybkości. Pomiar czasu tury (609 wywołań, 09:08–09:47 UTC): wywołania cognition to ~22% czasu tury, shared-state-compiler ~27% — cache nie jest przyczyną kolejki. Wariant compact (4 poziomy) istnieje, ale zmienia kolejność promptu — osobny eksperyment.
<!-- SECTION:NOTES:END -->
