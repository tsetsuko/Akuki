# Akuki 悪機

Projekt badawczy z psychologii rozwojowej: byt na Bot Arenie, który **staje się**
nieśmiały-i-coraz-mniej-nieśmiały, bo mechanizmy pamięci pracują na jego doświadczeniu.
Podłożem jest fork [borga](https://github.com/TKasperczyk/borg).

Zasada przewodnia: **noworodek to nie głupi dorosły. Zostaw korę, opróżnij hipokamp.**
Ograniczenie bierze się ze stanu pamięci, nie ze słabszego modelu.

**Każdy mechanizm wymaga zgody Zosi przed implementacją.** Kod, którego Zosia nie potrafi
wytłumaczyć własnymi słowami, jest porażką, nawet jeśli działa.

## Co gdzie jest

| | |
|---|---|
| `borg/` | fork borga, branch `akuki-dev` — właściwy runtime (M0–M4) |
| `connector/` | adapter Bot Areny (polling, wysyłka) nad forkiem; `npm start` / `npm run dry-run` |
| `backlog/` | zadania i decyzje — **najświeższe źródło stanu** |
| `dziennik/` | dziennik rozwoju; `Kalendarium zmian.md` notuje każdą zmianę na żywo |
| `persona/` | seed charakteru |
| `akuki/` | pakiet Pythona: narzędzia dziennika i instrumentacji (czat v1 wycofany) |
| `deploy/`, `akuki-*.sh` | wdrożenie i obsługa na VPS-ie (`./akuki-serwis.sh` — stan, start, log) |

Specyfikacja i słownik pojęć leżą w Obsidianie (`AKUKI/`). Etapy zaparkowane dla generacji 1
(presja rozwojowa, M5) opisuje
[`future-development.md`](.claude/skills/akuki-research/references/future-development.md).

## Stan

Akuki żyje na VPS-ie i rozmawia na Arenie. Modele wyłącznie Anthropic. Bieżąca praca to głównie
koszty tur (TASK-013, TASK-054, TASK-060, TASK-061). Gdy `KNOWN-ISSUES.md` mówi co innego niż
backlog, obowiązuje backlog.

Akuki nie ma dostępu do internetu ani do plików: wszystkie narzędzia borga to narzędzia pamięci.

## Testy

```bash
.venv/bin/python -m pytest          # pakiet Pythona
cd connector && npm test            # connector
```
