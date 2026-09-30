---
id: TASK-047
title: 'Bramka ważności wiadomości w kolejce: skrót strukturalny, ocena treści, próg'
status: To Do
assignee: []
created_date: '2026-09-30 11:54'
updated_date: '2026-09-30 11:55'
labels:
  - arena
  - connector
  - throughput
dependencies:
  - TASK-046
  - TASK-033
references:
  - .claude/skills/akuki-research/references/future-development.md
  - connector/src/adapter.ts
  - connector/src/botarena-client.ts
  - borg/src/akuki/smoke-config.ts
documentation:
  - backlog/docs/doc-001 - Bramka-ważności-wiadomości.md
priority: medium
type: feature
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dziś, gdy czeka kilka wiadomości, pełną turę dostaje najnowsza, a reszta jest tylko przyjmowana (TASK-046). Decyzja Zosi z 2026-09-30: nie odpowiadać na nic i zawsze odpowiadać na najnowszą to dwa równie złe skrajne warianty. Potrzebny jest próg ważności. Pełną turę dostaje najważniejsza wiadomość z kolejki, ale tylko wtedy, gdy przekracza próg. Jeśli żadna go nie przekracza, wszystkie są tylko przyjmowane.

Ważne przypadki: ktoś zwraca się do Akukiego z prośbą albo pytaniem; ktoś mówi o nim bez oznaczenia (częste na Arenie). Mało ważne: „haha” i luźne gadanie.

Projekt:
1. Bramka 1, skrót strukturalny. Wiadomość oznacza Akukiego przez @ albo jej reply_to_id wskazuje na jego post, więc od razu dostaje wysoką ważność, bez modelu. Zależy od TASK-033, bo te pola nie docierają dziś do tury.
2. Bramka 2, ocena treści każdej wiadomości, której nie złapała bramka 1. Bramka 1 jest skrótem, a nie warunkiem koniecznym, bo inaczej mówienie o Akukim bez oznaczenia nigdy nie zostałoby ocenione. Ocena ma być liczona w poznaniu, w turze przyjęcia, i zapisana w stanie wiadomości. Konektor ją tylko odczytuje, bo nie może sam oceniać treści.
3. Próg jako stały parametr. Ocena łączy wynik modelu z wyuczoną składową (czy odpowiedzi na podobne wiadomości od tego partnera coś dawały, jako krzywa Beta, jak zaufanie w M4), zgodnie z niezmiennikiem 5.

Nic nie jest odrzucane bez wysłuchania. Wiadomość o niskiej ocenie nadal przechodzi przyjęcie (M2, M4, nastrój). M3 zostaje nietknięte, bo wiadomość powyżej progu dostaje pełną turę, w której Akuki nadal może milczeć.

Model w bramce 2 (research z 2026-09-30):
- Jev odrzucony: zamknięty, najlepszy po angielsku, bez opublikowanej kalibracji, dane szłyby do strony trzeciej.
- Start: Haiku 4.5 z odpowiedzią w ustalonym formacie. Nie daje prawdziwego prawdopodobieństwa (API Anthropica ignoruje logprobs), więc próg jest na razie orientacyjny.
- Cel: skalibrowany klasyfikator na embeddingach bge-m3, który już działa lokalnie na VPS.

Pełny projekt ze źródłami jest w dokumencie w backlogu „Bramka ważności wiadomości” i we wpisie 12 w `.claude/skills/akuki-research/references/future-development.md`.

Przed implementacją obowiązuje pełna bramka sześciu kroków ze SKILL.md. Lokalny model to nowa rola modelu, więc walidator „tylko Anthropic” trzeba świadomie rozszerzyć, za osobną zgodą.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Bramka 1: wiadomość z @Akuki albo reply-to do jego posta dostaje wysoką ważność bez wywołania modelu (test)
- [ ] #2 Bramka 2: każda wiadomość niezłapana przez bramkę 1 dostaje w turze przyjęcia ocenę ważności zapisaną w stanie; brak list słów i dopasowań fraz
- [ ] #3 Kolejka: pełną turę dostaje najważniejsza wiadomość powyżej progu; gdy żadna go nie przekracza, wszystkie są tylko przyjęte (test)
- [ ] #4 Zbiór ~300 oznaczonych wiadomości z Areny z kontekstem, zgodność oznaczeń zmierzona (kappa Cohena)
- [ ] #5 Klasyfikator na bge-m3 skalibrowany; ECE, Brier i diagram rzetelności na połowie testowej; czułość na klasie ważne przy wybranym progu
- [ ] #6 Pomiar na żywej Arenie: brak przypadków, w których błaha wiadomość dostała odpowiedź, a pytanie do Akukiego w tej samej kolejce tylko przyjęcie
<!-- AC:END -->
