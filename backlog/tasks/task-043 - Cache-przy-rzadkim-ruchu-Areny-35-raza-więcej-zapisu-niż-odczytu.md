---
id: TASK-043
title: 'Cache przy rzadkim ruchu Areny: 3,5 raza więcej zapisu niż odczytu'
status: To Do
assignee: []
created_date: '2026-09-21 13:33'
updated_date: '2026-11-09 13:08'
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

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-09 13:08
---
CACHE NIE JEST ZEPSUTY, SPRAWDZONE 2026-11-09 po skoku zużycia o 12:28–12:45.

Pytanie wyszło z odczytu: 33 wywołania tego dnia, cache_read równe zero w każdym. Wyglądało to na awarię cache'u. Nie jest.

POMIAR, /var/lib/akuki/token-usage.jsonl od 2026-10-01 (34 dni z ruchem, 339,4 mln tokenów):
- cognition-system-2: input 94,2 mln, cache_read 6,2 mln, cache_creation 1,07 mln
- cognition-system-1: input 45,3 mln, cache_read 3,8 mln, cache_creation 0,72 mln
- shared-state-compiler (haiku): cache_read 5,8 mln, cache_creation 1,45 mln
- cognition-plan: cache_read 2,7 mln, cache_creation 1,04 mln
- każde inne miejsce wywołania, w tym wszystkie ekstraktory, reflection i wszystkie procesy offline: cache_read 0 i cache_creation 0

DLACZEGO ZERO 9 LISTOPADA. Była jedna tura. Statyczny prefiks cognition (18 114 tokenów, ttl 1h) został zapisany, ale nie przyszła druga tura w ciągu godziny, więc nikt go nie przeczytał. To zachowanie zgodne z projektem, nie usterka.

DLACZEGO ZERO W PROCESACH OFFLINE I EKSTRAKTORACH. Te wywołania w ogóle nie zamawiają cache'u (brak cache_control), i dodanie go niewiele by dało, bo ich kształt jest inny niż cognition. Sprawdzone w kodzie na trzech przykładach: offline/reflector/index.ts:461 (system to dwa zdania, cała reszta to treść klastra epizodów), offline/review-resolver/index.ts:1974 (jedno zdanie systemu, potem dane jednego elementu przeglądu), memory/self/review-open-question-extractor.ts:166 (to samo; review_item stoi PRZED wspólnym kontekstem, więc prefiks rozjeżdża się od razu). Stała część (system i definicja narzędzia) to na oko kilkaset do tysiąca kilkuset tokenów — oszacowane z długości tekstu w kodzie, nie zmierzone — a zmienna dziesiątki tysięcy (reflector 2026-11-09: 57–59 tys. na wywołanie). Cache może przyspieszyć tylko część stałą, a zapis kosztuje 1,25 raza tyle co zwykłe wejście, więc przy jednym-dwóch wywołaniach procesu na cykl wyszłoby drożej.

GDZIE NAPRAWDĘ IDĄ TOKENY. Nie w cache'u, tylko w rozmiarze części zmiennej promptu odpowiedzi: cognition-system-2 to średnio 184 tys. tokenów nieczytanych z cache'u na wywołanie, cognition-system-1 129 tys. To jest zakres TASK-044, TASK-054 i TASK-058, nie tego zadania.

Czego nie sprawdzono: rozmiaru stałej części promptów ekstraktorów wykonywanych w każdej turze (prediction-extractor, corrective-preference-extractor, goal-promotion-extractor, action-state-extractor, reflection). Gdyby któraś miała kilka tysięcy tokenów stałego tekstu, cache z ttl 1h mógłby się opłacić przy turach co kilka minut. Szacunek z grubsza, nie pomiar: najwyżej kilkanaście procent tych miejsc wywołania, około 1% całości.
---
<!-- COMMENTS:END -->
