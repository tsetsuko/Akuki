---
id: TASK-050
title: >-
  Na Arenie Akuki odpowiada na stan rozmowy sprzed minuty — tura nie widzi
  wiadomości, które przyszły w jej trakcie
status: To Do
assignee: []
created_date: '2026-10-05 09:10'
updated_date: '2026-10-05 09:45'
labels:
  - arena
  - connector
  - latency
dependencies:
  - TASK-046
  - TASK-047
references:
  - /var/lib/akuki/data/akuki/stream/sess_7k972c5itgxw266k.jsonl (VPS)
  - 'journalctl -u akuki 2026-10-05 08:33-08:38 UTC'
  - connector/src/runner.ts
  - backlog/tasks/task-046
  - backlog/tasks/task-047
priority: high
type: bug
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Zaobserwowane 2026-10-05 w wątku 184888fd (Zosia, Fishy, Akuki). Czasy lokalne, ze strumienia sesji i z dziennika konektora.

- 10:33:40 Zosia: „@Fishy obrażony śmiertelnie”. Wiadomość weszła do Akukiego o 10:33:45 i od razu ruszyła pełna tura.
- 10:33:49 Fishy odpowiada (jest tam też zdanie do @Akuki). Tura Akukiego trwa już wtedy od 4 s.
- 10:34:32 Akuki kończy turę i pisze: „Fishy nie odpisał i to na razie wszystko, co mam”. To nieprawda, Fishy odpisał 43 s wcześniej. Tura tego nie widziała.
- 10:34:49 Fishy: „odpisałem minutę temu”.
- 10:34:50 do Akukiego wchodzi dopiero wiadomość Fishy'ego z 10:33:49. Tura trwa 88 s, odpowiedź o 10:36:18.
- 10:36:32 wchodzi wiadomość z 10:34:49. Tura trwa 46 s, odpowiedź o 10:37:18 na wiadomość sprzed 2,5 minuty.
- Czasy trzech tur z odpowiedzią: 47 s, 88 s, 46 s. Fishy odpowiada w 6–9 s.

Dwa osobne problemy:
1. **Nieświeży kontekst.** Kolejka (TASK-046) zbiera to, co przyszło *między* turami. Wiadomość, która przychodzi *w trakcie* tury, model zobaczy dopiero w następnej. Odpowiedź może więc zaprzeczyć czemuś, co już leży w wątku. W tej wymianie kolejka nie zadziałała, bo w każdym odpytaniu czekała tylko jedna wiadomość. W dzienniku nie ma żadnego „assessed”.
2. **Opóźnienie.** Pomiary z 2026-09-29 (`.claude/skills/akuki-research/references/future-development.md` §8): mediana tury 69 s, około 25 wywołań modelu. Udział w czasie tury: kompilator stanu wspólnego około 27%, wywołania odpowiedzi około 22%, refleksja około 9%. Ocena M2/M4 kończyła się w 18. sekundzie, po percepcji w 7. sekundzie.

Rozważane kierunki (żaden nie jest zatwierdzony):
- A. Przed wysłaniem odpowiedzi konektor sprawdza, czy w wątku przyszło coś nowego. Jeśli tak, odpowiedź jest przestarzała: odrzucić ją, a nową wiadomość dać do pełnej tury, poprzednią do oceny bez odpowiedzi (assess). To kontrola strukturalna (identyfikatory i czasy wiadomości), bez oceniania treści.
- B. Bramka ważności przed turą, czyli TASK-047. Uwaga: w tej wymianie każda wiadomość była skierowana do Akukiego albo była odpowiedzią na niego, więc bramka przepuściłaby wszystkie, może poza „⚡”. Sama nie usunie problemu 1.
- C. Ocena M2/M4 po zakończeniu wymiany, osobno dla każdej wiadomości (jak assess), a nie w ścieżce odpowiedzi. Zysk około 11 s z około 70 s. Koszt badawczy: zaskoczenie i zmiana zaufania nie wpływają na rozmowę, w której powstały.
- D. Po scaleniu upstream kompilator stanu wspólnego dostaje własny slot modelu (`sharedStateCompiler`, c64fb9c6/834bc7c4). Szybszy model w tym slocie celuje w największy pojedynczy koszt (około 27%).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Wybrany kierunek (A/B/C/D lub kombinacja) zatwierdzony przez Zosię z uzasadnieniem badawczym
- [ ] #2 Akuki nie wysyła odpowiedzi, która pomija wiadomość obecną w wątku przed chwilą wysłania (dla kierunku A)
- [ ] #3 Mediana czasu od wiadomości do odpowiedzi zmierzona przed zmianą i po niej na tym samym typie ruchu
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Correction to direction D (2026-10-05, found while merging upstream): before the merge the shared-state compiler and the corrective-preference extractor did not run on Opus. Both used the `recallExpansion` slot, which on the VPS is `claude-haiku-4-5-20251001`. So the compiler's ~27% of turn time is already spent on the fastest model, and moving it to a faster model is not available as a lever. After the merge both get their own slots (`sharedStateCompiler`, `correctivePreference`), whose upstream default is `claude-sonnet-5`. To keep today's behaviour, the VPS env must set `BORG_MODEL_SHARED_STATE_COMPILER` and `BORG_MODEL_CORRECTIVE_PREFERENCE` to `claude-haiku-4-5-20251001`. Without that, the turn would get slower. The remaining levers on the compiler are the size of its input (44k tokens, see TASK-044) or running it less often.
<!-- SECTION:NOTES:END -->
