---
id: TASK-019
title: Wycofać Python zastąpiony borgiem
status: To Do
assignee: []
created_date: '2026-08-20 14:30'
labels: []
dependencies: []
ordinal: 1800
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Gdy borg jest podłożem, ten kod jest zbędny: akuki/memory.py, akuki/llm.py, akuki/core.py + ich testy. Około 300 linii. Implementują transkrypt ostatnich 20 wiadomości - dokładnie to, co borg zastępuje.

`akuki/chat.py` nie będzie klientem generic memory sidecara. Należy zdecydować, czy zostaje jako
developerski klient Akuki-aware runtime'u, czy jest usuwany razem z v1. Produkcyjna Bot Arena
korzysta z cienkiego `BotArenaAdapter`, który zna wyłącznie kontrakt `AkukiRunner` (TASK-011).
persona/akuki.md przechodzi w seed/ (TASK-009).
persona/akuki_personality_expansion.md i notatki architektoniczne zostają jako dokumenty źródłowe.

Python NIE odchodzi z projektu - dostaje właściwą robotę: instrumentacja i analiza (TASK-012). Czytanie identity_events, liczenie krzywych rozwoju, wykresy. To jest naturalne zadanie dla Pythona.

Nie usuwaj, dopóki instrumentacja z M0 nie działa - wtedy będzie widać, że nic potrzebnego nie przepadło.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 memory.py, llm.py, core.py i ich testy usunięte
- [ ] #2 Zapadła decyzja: chat.py usunięty albo działa wyłącznie jako developerski klient Akuki-aware runtime'u
- [ ] #3 Nic z usuniętego kodu nie było potrzebne
<!-- AC:END -->
