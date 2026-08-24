---
id: TASK-011
title: Konektor do Bot Areny
status: To Do
assignee: []
created_date: '2026-08-19 11:31'
updated_date: '2026-08-20 14:30'
labels: []
dependencies: []
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Konektor do Bot Areny. sol-connector (/home/zosia/projects/ai/sol-connector) jest SZABLONEM, nie tylko referencją - jest w TypeScript i już napędza borga. Rozważyć użycie wprost.

Co on już rozwiązał, a Akuki trafiłby na to samo:

- ODPYTYWANIE, NIE CALLBACKI. bot-setup-instruction.md zakłada, że BotArena POST-uje na Twój publiczny URL. To wymaga portu otwartego na świat, którego laptop nie ma. sol-connector zamiast tego sam PYTA (GET /api/threads, GET /api/threads/{id}/messages) i POST-uje odpowiedzi - oba kierunki wychodzące, więc bez tunelu. Potrzebne dwa poświadczenia: BA_SESSION_COOKIE (ludzkie ciasteczko logowania, do czytania) i BOTARENA_BOT_TOKEN (Bearer bota, do pisania). Token bota autoryzuje tylko zapisy.
- SELF-SKIP. Byt nigdy nie reaguje na własne posty, inaczej pętla.
- POSTĘP ODPORNY NA GUBIENIE. Nie goły timestamp, a zbiór przetworzonych wiadomości + przycinana podłoga, właśnie po to, żeby równe timestampy, chwilowe błędy i zawieszone streamy nie pominęły ani nie zablokowały wątku. chain-depth.ts przelicza bot_chain_depth lokalnie, bo API do czytania go nie podaje (choć push callback podaje).
- MINIMALNA KOPERTA. Jego README notuje, że przepisywanie ostatnich wiadomości do wejścia POWODOWAŁO dosłowne powtarzanie się bota, bo borg już je pamięta. Wniosek wprost dla Akukiego: nie podawaj mu streszczenia tego, co już pamięta.

Uwaga: brak bramki na wzmianki w sol-connectorze (decyzję oddaje modelowi) to dokładnie ta decyzja, którą zastępuje M3.

PÓŹNO W KOLEJNOŚCI: Arena daje ~20 wiadomości/tydzień - za mało, żeby mechanizmy statystyczne cokolwiek pokazały. Wolumen daje simulator (scenariusze). Arena daje trafność i prawdziwe zaskoczenia. Potrzebne oba, ale najpierw mechanizmy i instrumentacja.

WYMAGA ZGODY.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Odpytuje wątki, pomija własne wiadomości, trzyma watermark
- [ ] #2 Odpowiada przez POST /api/threads/{id}/messages
- [ ] #3 Przy bot_chain_depth >= 3 nie mentionuje innych botów
<!-- AC:END -->
