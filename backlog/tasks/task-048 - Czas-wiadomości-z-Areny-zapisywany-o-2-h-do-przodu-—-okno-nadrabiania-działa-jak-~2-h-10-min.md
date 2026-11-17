---
id: TASK-048
title: >-
  Czas wiadomości z Areny zapisywany o 2 h do przodu — okno nadrabiania działa
  jak ~2 h 10 min
status: To Do
assignee: []
created_date: '2026-09-30 12:52'
updated_date: '2026-11-16 11:22'
labels:
  - arena
  - connector
dependencies: []
references:
  - connector/src/adapter.ts
  - connector/src/botarena-client.ts
  - connector/src/state.ts
priority: medium
type: bug
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Odkryte 2026-09-30 przy pomiarze kolejki (TASK-046). Znacznik czasu wiadomości z Bot Areny zapisany w `state.db` konektora (`message_state.ts_ms`) wypada o 2 godziny później niż ten sam moment w UTC.

Dowody (odczyt z VPS):
- 2026-09-29: wiadomość 5b30381e ma w state.db godzinę 11:24:06 (odczytaną jako UTC). Zosia napisała ją o 11:24 czasu lokalnego (CEST, UTC+2), czyli o 09:24 UTC. Odpowiedź w logu systemd: 09:47 UTC.
- 2026-09-30: wiadomość f125eb8c ma w state.db 14:43:35 (jako UTC), a odpowiedź na nią poszła o 12:46:37 UTC.

Hipoteza, niesprawdzona: Arena zwraca `created_at` w czasie lokalnym bez strefy albo z błędnym oznaczeniem `Z`, a `Date.parse` w adapterze (`connector/src/adapter.ts`, `tsOf`) czyta to jako UTC. Druga możliwość: zegar lub strefa po stronie Areny.

Skutek, jeśli hipoteza się potwierdzi:
- `AKUKI_ARENA_MAX_CATCH_UP_AGE_MS` (600 000 ms) liczy wiek jako `now() - tsMs`. Przy tsMs przesuniętym o +2 h świeże wiadomości mają wiek ujemny, więc po restarcie odpowiada się na wiadomości starsze nawet o ~2 h 10 min zamiast 10 min.
- Czasy w state.db i w logach konektora nie zgadzają się z czasem w logach systemd, co utrudnia każdy pomiar opóźnienia.
- Kolejność wiadomości i próg wątku działają poprawnie, bo przesunięcie jest takie samo dla wszystkich wiadomości.

Do sprawdzenia najpierw: surowe pole `created_at` z `GET /api/threads/{id}/messages` (czy ma strefę, a jeśli ma, to jaką) i porównanie z czasem serwera.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Sprawdzony surowy format created_at z API Areny (obecność i wartość strefy) i zapisany w zadaniu
- [ ] #2 Ustalona przyczyna przesunięcia: strefa w danych Areny, parser czy zegar
- [ ] #3 Jeśli przyczyna jest po naszej stronie: ts_ms w state.db zgodny z UTC, z testem na formacie, jaki Arena faktycznie wysyła
- [ ] #4 Okno nadrabiania sprawdzone testem: wiadomość sprzed 11 min pominięta, sprzed 9 min obsłużona, przy prawdziwym formacie czasu z Areny
- [ ] #5 Jeśli przyczyna jest po stronie Areny: zgłoszenie do opiekuna Areny i obejście opisane w README konektora
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
POMIAR 2026-10-02 18:45 UTC (AC #1). Odczyt GET /api/threads/{id}/messages z VPS-a, cookie ba_session, wątek 184888fd, HTTP 200. Sześć ostatnich created_at, dosłownie:
  50a21298 '2026-10-02T11:46:49.876687'
  a5f163ee '2026-10-02T11:47:20.714267'
  42c7adcc '2026-10-02T11:49:06.735127'
  42c38f49 '2026-10-02T11:49:16.980567'
  c93d0f05 '2026-10-02T11:52:31.983052'
  8ed5b311 '2026-10-02T11:52:43.120235'
Format: ISO 8601, mikrosekundy, BEZ strefy (ani Z, ani offsetu). Nagłówek Date odpowiedzi: Fri, 02 Oct 2026 18:45:10 GMT, zgodny co do sekundy z `date -u` na VPS-ie. Zegar VPS-a: Etc/UTC, zsynchronizowany. Zegar HTTP Areny poprawny.

WNIOSEK O MECHANIZMIE (po naszej stronie, sprawdzony na kodzie): Date.parse czyta ISO bez strefy jako czas lokalny maszyny. Na VPS-ie to UTC, więc wartość trafia do ts_ms dosłownie. Z dwóch punktów w opisie (state.db 14:43:35 przy odpowiedzi 12:46:37 UTC) wartość created_at jest o +2 h przed UTC, czyli to czas warszawski letni (CEST). Czy Arena pisze Europe/Warsaw ze zmianą czasu, czy stałe +2, z tych danych NIE da się odróżnić; rozstrzygnie dopiero odczyt po 2026-10-25 (koniec czasu letniego). Pytanie do opiekuna Areny, nie hipoteza.

RYZYKO PRZY NAPRAWIE: thread_floor.ts_ms i message_state.ts_ms w state.db są zapisane z przesunięciem +2 h. Po zmianie parsera nowe wiadomości dostaną ts o 2 h mniejszy niż zapisana podłoga i przez ~2 h byłyby po cichu odrzucane jako poniżej podłogi. Naprawa parsera musi iść razem z jednorazową korektą state.db.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-11-16 11:22
---
2026-11-16, new data point after the switch to winter time (CET, UTC+1 since 25.10). The offset now looks like 1 h, not 2 h. Six Arena messages addressed to someone else were processed one after another between 11:22:03 and 11:24:15 Polish time; the stored ts_ms of the last one (e9206a86) reads 12:21:32 Polish time, about 57 minutes after it was processed. If the six were said at about 11:21:32, the offset is exactly 1 h. This answers the question left open in the 2026-10-02 notes (Europe/Warsaw with DST, or a fixed +2): the offset followed the DST change, so Arena writes created_at in Europe/Warsaw time, without a zone, and Date.parse on the VPS (Etc/UTC) reads it as UTC. The catch-up window therefore behaves like about 1 h 10 min in winter instead of about 2 h 10 min, and any fix must convert from Europe/Warsaw rather than subtract a constant. Not yet confirmed against a raw created_at read after 25.10.
---
<!-- COMMENTS:END -->
