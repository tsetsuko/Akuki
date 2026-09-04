---
id: TASK-008
title: Wgrać klucz Anthropic do pass
status: To Do
assignee: []
created_date: '2026-08-19 11:31'
updated_date: '2026-09-04 10:11'
labels: []
dependencies: []
priority: low
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
pass insert akuki/anthropic-key. Bez tego Akuki nie odpowie - cała reszta v1 jest gotowa.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 pass show akuki/anthropic-key zwraca klucz
- [ ] #2 python -m akuki.chat odpowiada na 'hej'
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: claude
created: 2026-09-04 09:31
---
WERYFIKACJA 2026-09-04: zadanie NIE jest wykonane, ale też nie blokuje niczego — dotyczy innego miejsca przechowywania niż to, którego naprawdę użyto. Priorytet obniżony z high na low; status zostaje To Do.

Co sprawdzone: `pass ls` pokazuje w katalogu akuki dwa wpisy, botarena-token i ssh-key. Wpisu akuki/anthropic-key nie ma, więc AC #1 („pass show akuki/anthropic-key zwraca klucz”) jest niespełnione dosłownie. Sprawdzone przez wylistowanie nazw, bez odczytywania wartości.

Skąd wziął się działający smoke test skoro klucza w pass nie ma: uwierzytelnienie szło zupełnie inną drogą. Na VPS-ie sekret leży w chronionym pliku środowiskowym /etc/akuki/akuki-smoke.env (root:akuki, 0640, wpisywany przez sudoedit) jako ANTHROPIC_AUTH_TOKEN razem z ANTHROPIC_BASE_URL i AKUKI_ANTHROPIC_PROXY=1 — procedura opisana w borg/AKUKI_ORACLE_SMOKE_TEST.md. Lokalnie używany był token, którym posługuje się Claude Code (sha256 7c8545eb, zapis w TASK-022). Żadna z tych dróg nie czyta pass.

Dlaczego to zadanie nie jest już pilne: AC #2 brzmi „python -m akuki.chat odpowiada na 'hej'”, czyli dotyczy wycofywanej wersji Pythonowej v1 (TASK-019). Runtime Akukiego to fork Borga i konfiguruje się plikiem środowiskowym, nie przez pass.

Do decyzji Zosi: czy TASK-008 zamknąć razem z wycofaniem Pythona (TASK-019), czy zostawić jako życzenie „trzymać sekrety Akukiego w pass także lokalnie”. Nie zgadywałem.
---

author: claude
created: 2026-09-04 10:11
---
ZAMKNIĘTE JAKO NIEAKTUALNE 2026-09-04 (decyzja Zosi) — nie jako zrobione. Oba kryteria pozostają niespełnione i takie zostaną.

AC #1 („pass show akuki/anthropic-key zwraca klucz”): wpisu nie ma. `pass ls` pokazuje w katalogu akuki tylko botarena-token i ssh-key.

AC #2 („python -m akuki.chat odpowiada na 'hej'”): dotyczy wycofywanej wersji Pythonowej v1. Zadanie zamknięte razem z nią — patrz TASK-019.

Dlaczego to niczego nie blokuje: uwierzytelnienie runtime'u Akukiego idzie zupełnie inną drogą. Na VPS-ie to chroniony plik środowiskowy /etc/akuki/akuki-smoke.env (root:akuki, 0640, wpisywany przez sudoedit) z ANTHROPIC_AUTH_TOKEN, ANTHROPIC_BASE_URL i AKUKI_ANTHROPIC_PROXY=1; procedura w borg/AKUKI_ORACLE_SMOKE_TEST.md. Lokalnie używany był token Claude Code (sha256 7c8545eb, zapis w TASK-022). Żadna z tych dróg nie czyta pass, a smoke test przeszedł 2026-09-01 bez tego wpisu.

Jeśli kiedyś padnie decyzja, żeby trzymać sekrety Akukiego w pass także lokalnie, to nowe zadanie o właściwym brzmieniu — nie odgrzanie tego.
---
<!-- COMMENTS:END -->
