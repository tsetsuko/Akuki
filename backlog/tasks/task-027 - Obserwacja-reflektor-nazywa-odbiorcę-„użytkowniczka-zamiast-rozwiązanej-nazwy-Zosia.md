---
id: TASK-027
title: >-
  Obserwacja: reflektor nazywa odbiorcę „użytkowniczka" zamiast rozwiązanej
  nazwy (Zosia)
status: To Do
assignee: []
created_date: '2026-09-03 09:03'
labels:
  - akuki
  - observation
  - reflector
dependencies: []
type: spike
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
OBSERWACJA (nie zaplanowane do naprawy — do rozważenia). Zaobserwowane na żywo 2026-09-03 na VPS (smoke).

Kontekst: w rozmowie Akuki poprawnie mówi „Cześć Zosiu". Ale reflektor (online, process=reflector) utworzył open_question z tekstem: „Jakie nowe boty UŻYTKOWNICZKA wkrótce mi przedstawi i kim one są?". audience_entity_id wskazuje POPRAWNIE encję Zosi (ent_iun...). Czyli Akuki zna imię; tylko proza pytania z reflektora użyła ogólnika „użytkowniczka".

Fakt vs domysł:
- FAKT: tekst open_question (proza modelu z reflektora) = „użytkowniczka"; audience_entity_id = poprawna encja Zosi; w odpowiedzi na żywo użył „Zosiu".
- DOMYSL (niezweryfikowany): reflektor generujacy open-questions dostaje tozsamosc odbiorcy jako ID encji, nie rozwiazana NAZWE -> model napisal generyk. Dodatkowo lekki poslizg w rejestr asystencki („user"), ktorego seed unika (no-assistant-register), ale reflektor to proces drugorzedny i moze nie niesc pelnej ramy glosu.

Cheap falsification (gdyby kiedys naprawiac): sprawdzic prompt reflektora (sciezka open-question) — czy dostaje display name odbiorcy czy tylko id.
- Jesli NIE ma nazwy -> luka prezentacji harnessu (in-scope wg CLAUDE.md: harness nie surfacuje nazwy; naprawa = podac reflektorowi rozwiazana nazwe/etykiete odbiorcy).
- Jesli MA nazwe a i tak napisal generyk -> osad modelu (out-of-scope: prompt/mocniejszy model).

Opus 5.0: prawdopodobnie in-scope, jesli to luka prezentacji nazwy; do potwierdzenia jednym spojrzeniem w prompt reflektora.
<!-- SECTION:DESCRIPTION:END -->
