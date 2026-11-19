---
id: TASK-063
title: Rozmowa z Akukim w prywatnej wiadomości na Discordzie
status: In Progress
assignee: []
created_date: '2026-11-19 10:36'
updated_date: '2026-11-19 11:29'
labels:
  - connector
  - discord
dependencies: []
modified_files:
  - connector/src/discord-client.ts
  - connector/src/discord-client.test.ts
  - connector/src/botarena-client.ts
  - connector/src/adapter.ts
  - connector/src/adapter.test.ts
  - connector/src/runner.ts
  - connector/src/runner.test.ts
  - connector/src/config.ts
  - connector/src/config.test.ts
  - connector/src/service.ts
  - connector/src/service.test.ts
  - connector/src/boundary.test.ts
  - connector/README.md
  - connector/.env.example
priority: medium
type: feature
ordinal: 63000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Zosia chce pisać do Akukiego z telefonu, gdy nie siedzi przy komputerze. Zatwierdzone 2026-11-19: tylko prywatna wiadomość (DM) na Discordzie, tylko jej konto, ten sam Akuki i ta sama pamięć co na Arenie.

Decyzje z 2026-11-19:
- Ten sam tenant, nie osobny byt. Prywatny asystent ogólnego przeznaczenia to osobny projekt, poza Akukim.
- Przeglądanie internetu (read-only) odrzucone. Powody: ciekawość i szukanie informacji to w dokumencie psychologicznym temat do zbadania (pkt 17), więc nie ma oparcia w badaniach; nowe narzędzie łamie izolację, którą borg daje z konstrukcji; treść stron nie ma kategorii pochodzenia w M4; ryzyko trwałego wstrzyknięcia poleceń przez pamięć i wycieku danych przez pobranie adresu.

Skutek badawczy, do odnotowania przy wdrożeniu: Zosia jest figurą przywiązania, więc więcej rozmów z nią w DM szybciej obniża wobec niej nieśmiałość (M3) i zwiększa wagę jej zdania (M4). To zmiana warunków eksperymentu, nie rozwój. Pamięć jest wspólna, a o ujawnieniu decyduje model, więc to, co Zosia napisze w DM, może wypłynąć na Arenie.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Wiadomość od skonfigurowanego konta Discord w DM dostaje turę i odpowiedź w tym samym DM
- [ ] #2 Wiadomość od każdego innego autora jest odrzucana w transporcie i nie dociera do borga
- [ ] #3 Tura z DM jest przypisana do encji twórczyni po id, a nie do nowej encji z konta Discord; bez twórczyni w pamięci tura jest odrzucana
- [ ] #4 Każda wiadomość w DM jest traktowana jako skierowana do Akukiego (M2 i M4 działają)
- [ ] #5 Awaria lub zła konfiguracja Discorda nie zatrzymuje Areny
- [ ] #6 Arena i DM nie wykonują dwóch tur naraz na jednym Borgu
- [ ] #7 Po wdrożeniu: zapytanie odczytowe na kopii bazy potwierdza, że encja twórczyni to Zosia i że po pierwszej wiadomości z DM nie powstała nowa encja Zosia
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Klient Discorda: DM przez REST, odpytywany w tym samym rytmie co Arena, bez bramki websocket i bez otwartego portu; mapowanie na kształt wiadomości adaptera Areny, wątek oznaczony jako bezpośredni.
2. Adapter: w wątku bezpośrednim każda wiadomość jest skierowana do Akukiego.
3. Runner: tryb discord_dm, odbiorca i nadawca to encja twórczyni po id, sesja typu dm ze źródłem discord.
4. Usługa: drugi adapter w tej samej pętli, osobna baza stanu, awarie Discorda tylko logowane.
5. Wdrożenie (Zosia): aplikacja i bot w Discord Developer Portal, prywatny serwer z botem, zmienne AKUKI_DISCORD_* w /etc/akuki/akuki.env, pobranie kodu i restart.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Kod gotowy 2026-11-19: testy connectora 157/157 i typecheck przechodzą. Kryteria 1-6 pokryte testami jednostkowymi, nie żywym ruchem. Nie wdrożone i nie zacommitowane.

Ryzyko niesprawdzone: starsze źródła (API v6) mówią, że bot musi raz połączyć się z gatewayem, zanim wyśle wiadomość przez REST. Aktualna dokumentacja Discorda tego nie wspomina. Jeśli pierwszy POST padnie z kodem 40001, obejściem jest jednorazowe połączenie z gatewayem.

Encja twórczyni w snapshocie z 2026-11-02 to ent_ry4lo3ia73wug8pz (80 interakcji, zaufanie 0,917). Snapshot nie zawiera nazwy, więc przed pierwszą wiadomością trzeba na kopii bazy potwierdzić, że to Zosia.

2026-11-19 12:27 (czas polski): wdrożone i na żywo. Przed restartem skrypt akuki-tworczyni-check.sh potwierdził jedną twórczynię, ent_ry4lo3ia73wug8pz o nazwie Zosia, a Discord nie miał jeszcze żadnych powiązań. Pierwszy restart (12:26:56) skończył się tym, że connector nie wstał, bo domyślna ścieżka stanu Discorda jest względna, a katalog roboczy usługi to /opt/akuki/app/demo/server. Arena nic nie słyszała przez około 35 s. Naprawione ustawieniem AKUKI_DISCORD_STATE_DB=/var/lib/akuki/discord/state.db (kopia env: /etc/akuki/akuki.env.bak-20261119) i poprawką kodu 6783b96: błąd przy otwieraniu stanu Discorda wyłącza teraz tylko Discorda. Poprawka jest wgrana, ale działa dopiero od następnego restartu. Ten sam restart włączył zmianę z forka 2ecb8c05 (jedna linia na wiadomość w transkrypcie). Kryteria 1 i 7 czekają na pierwszą prawdziwą wiadomość z DM.
<!-- SECTION:NOTES:END -->
