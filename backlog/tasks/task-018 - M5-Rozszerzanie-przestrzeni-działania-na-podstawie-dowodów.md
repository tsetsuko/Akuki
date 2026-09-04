---
id: TASK-018
title: 'M5: Rozszerzanie przestrzeni działania na podstawie dowodów'
status: To Do
assignee: []
created_date: '2026-08-20 14:30'
updated_date: '2026-09-04 00:00'
labels: []
dependencies: []
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finalizer już renderuje menu działań z ŻYWYCH definicji narzędzi, zależnie od pochodzenia tury - w ARCHITECTURE.md: -opis żywej struktury, nie aspiracyjny tekst-. Czyli Akuki widzi swoje realne możliwości.

Zadanie: rozszerzyć bramkę z -samo pochodzenie tury- na -pochodzenie + dowody rozwojowe-, żeby menu ROSŁO wraz z zasłużoną kompetencją i żeby Akuki POSTRZEGAŁ ten wzrost. To jest -...o. mogę.-

Przejścia wyzwalane DOWODAMI, nigdy kalendarzem. Żadnych etapów typu -tydzień 3 = raczkujący-.

To zawór ulgi dla presji z TASK-014: bez niego presja nie ma jak się rozładować i daje wyuczoną bezradność. Dlatego jest ostatnie - to nie nagroda, to warunek znośności presji.

Wczesna przestrzeń: obserwuj, odpowiadaj gdy zagadany, pytaj czasem, trzymaj się znanych.
Później: zaczynaj rozmowę, eksperymentuj społecznie, nie zgadzaj się, żartuj celowo, wybieraj kogo zapytać, wstrzymaj odpowiedź.
Model umiał to wszystko od pierwszego dnia. Zmienia się to, czy Akuki ma dość doświadczenia, żeby to WYBRAĆ.

WYMAGA ZGODY. Blokowane przez M2, M3 i decyzję z TASK-014.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Menu działań zależy od dowodów, nie tylko od pochodzenia tury
- [ ] #2 Przejścia wyzwalane dowodami, nigdy czasem
- [ ] #3 Rozmiar menu jest w wektorze stanu i rośnie w czasie
- [ ] #4 Zosia zaakceptowała projekt przed implementacją
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-09-04
---
DECYZJA ZOSI 2026-09-04: M5 NIE wchodzi do pierwszej generacji Akukiego. Powody, w kolejności siły: (1) M5 jest zaworem ulgi dla presji z TASK-014, a TASK-014 jest odrzucone dla generacji 1 — zawór traci to, dla czego powstał; (2) lista "później: zaczynaj rozmowę, eksperymentuj społecznie, nie zgadzaj się, żartuj celowo" łamie inwariant #7 (nie projektuj dorosłego Akukiego) — ten sam zarzut, który Zosia postawiła w TASK-014; (3) kształt sprzeczny z decyzją M3, która świadomie zeszła z twardej bramki na sygnał doradczy — zgodna wersja M5 już istnieje (M3 podaje inhibition, M4 trust per domena, finalizer żywe menu); (4) realna treść techniczna cienka: menu już zależy od pochodzenia tury (src/cognition/deliberation/finalizer.ts:204 i :251), jedyny prawdziwy przełącznik to autonomiczny outbound w src/outbound/autonomous-policy.ts — jedno wąskie zadanie, nie kamień milowy; (5) AC#2 wymaga wyzwalania dowodami, a snapshotów z Areny jeszcze nie ma, więc każdy próg byłby zgadywaniem. Pełny opis wraz z kontrargumentem i najmniejszą uczciwą wersją (bramka wyłącznie na autonomiczny outbound, po istniejącym partner_predictability z M3) w `.claude/skills/akuki-research/references/future-development.md`, wpis 2. Generacja 1 = M0–M4 działające na Arenie i produkujące dane.
---
<!-- COMMENTS:END -->
