---
nr: 2
data: 2026-10-19
wiek_epizody: 364 (snapshot z 2026-10-19)
pewnosc: wysoka
slad_w_stanie: brak śladu (zmiana środowiska, nie rozwoju)
kandydaci: "[[kandydaci/2026-10-19]]"
---

# Obs. 2 — szybsze odpowiedzi na Arenie

Wpis o zmianie środowiska, nie o rozwoju. Zapisany, bo zmienia warunki, w których
Akuki rozmawia, i każde późniejsze porównanie „przed i po” musi go brać pod uwagę.

## Obserwacja

Czas od wiadomości, na którą odpowiada, do jego posta na Arenie:

| Okres | Odpowiedzi | Mediana | p90 | Najdłużej |
|---|---|---|---|---|
| 30.09 – 06.10 | 55 | 212 s | 352 s | 482 s |
| 15.10 18:00 – 19.10 | 55 | **72 s** | 136 s | 282 s |

Mediana po dniach w drugim okresie: 15.10 — 71 s, 16.10 — 78 s, 17.10 — 85 s,
18.10 — 50 s. Najszybsze odpowiedzi (43–50 s) przypadają na szybką wymianę żartów
z Lunarią 18.10. Najwolniejsza (282 s) to pierwsza odpowiedź po wznowieniu rozmowy 15.10.

Kolejka działa: z 81 wiadomości, które usłyszał bez odpowiedzi, bo w międzyczasie
przyszła nowsza, 73 nie były skierowane do niego. Opóźnień rzędu 20 minut, jak
29.09, już nie ma.

## Ślad w stanie

Brak, i tak ma być. Tempo nie jest zapisane w pamięci Akukiego. Pomiar pochodzi
z API Areny, dziennika usługi i śladu tur, nie ze snapshotu.

## Interpretacja

To nie rozwój, tylko dwie zmiany techniczne:

1. **06.10: post wychodzi, zanim tura się skończy.** Odpowiedź trafia na Arenę od
   razu, gdy jest gotowa, a reszta pracy po odpowiedzi idzie już po wysłaniu.
   Zmierzony zysk: średnio 19 s na turę (tylko 3 próbki).
2. **14.10: zamiana tekstu na wektory pojedynczo, a nie paczkami.** Tura czekała
   wcześniej w kolejce za zamianą długich wspomnień z poprzedniej tury, czasem ponad
   minutę. Faza wyciągania informacji z rozmowy: mediana z 27 s na 11 s. Cała tura
   z odpowiedzią: z 99 s na 67 s.

Sama zmiana z 06.10 dużego spadku nie dała (6 odpowiedzi tego dnia, mediana 172 s),
więc większa część poprawy pochodzi z 14.10. Pewność: **wysoka** co do samego
spadku, **średnia** co do podziału między dwie przyczyny, bo próbka śladu sprzed
zmian ma tylko 7–12 tur.

## Wyjaśnienie bez rozwoju

To jest właśnie wyjaśnienie bez rozwoju. Uwaga na przyszłość: szybsze odpowiedzi
mogą zmieniać rozmowę. Mniej wiadomości przychodzi w trakcie tury, więc Akuki
rzadziej odpowiada na stan rozmowy sprzed minuty (TASK-050), a rozmówcy chętniej
z nim rozmawiają na żywo. Jeśli po 14.10 zmieni się jego zachowanie w rozmowie, na
przykład więcej szybkiej wymiany jak ta z 18.10, część tej zmiany może wynikać
z tempa, a nie z niego.
