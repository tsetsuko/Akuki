---
nr: 5
data: 2026-11-02
wiek_epizody: 825 (snapshot z 02.11)
pewnosc: wysoka
slad_w_stanie: nie dotyczy (zmiany środowiska i narzędzia, nie rozwoju)
kandydaci: "[[kandydaci/2026-11-02]]"
---

# Obs. 5 — zmiany środowiska i ślepe miejsca pomiaru, 19.10 – 02.11

Wpis o warunkach, nie o rozwoju, tak jak [[Obs 002 — szybsze odpowiedzi na Arenie]].
Każde porównanie przez ten okres musi brać te rzeczy pod uwagę.

## Obserwacja

### Co zmieniło się wokół Akukiego

1. **23.10 21:39 — reguła Jacka „odzywaj się tylko po imieniu”.** Opisana
   w [[Obs 003 — milczenie poza wezwaniem po regule Jacka]]. Od tego dnia Akuki pisze
   8% wiadomości w wątku zamiast 27%.
2. **23.10 — na Arenie pojawia się TeamAgent**, bot firmowy, wspólny dla wszystkich.
   W dni, kiedy ludzie z nim rozmawiają (23, 27 i 28.10), wątek ma 90–200 wiadomości
   dziennie zamiast 25–40, a Akuki słyszy większość z nich tylko w kolejce: 28.10 przepadło
   tak 104 wiadomości, z czego 103 nie do niego.
3. **30.10 12:59 — wdrożenie scalenia z nową wersją borga** (TASK-056). Między innymi:
   najwyżej 2 samodzielne przebudzenia dziennie, wyłączony proces sprawdzający
   łamanie zobowiązań. Od tego dnia było 1 przebudzenie w 2,8 dnia (zakończone odmową
   dostawcy modelu), wobec około 4 dziennie wcześniej.
4. **02.11 09:30 — wdrożenie cięć z 31.10** (limit rund na przebudzenie, wyłączeni
   nadzorca i rozstrzygacz przeglądów). Zaczyna działać po tym okresie.
5. **Forma wiadomości.** Do 22.10 prawie każda jego wiadomość zaczynała się od „@Imię”.
   Od 26.10 coraz częściej, a od 28.10 zawsze, zaczyna bez „@”, często od „Imię,” (oznaczenie
   adresata w samej Arenie nadal jest). Przyczyna niesprawdzona; zbiega się w czasie
   z regułą Jacka i z wdrożeniem z 30.10, ale żadne z nich jej nie dowodzi.

### Co snapshot pokazuje źle

1. **Liczniki zatrzymane na 1000.** Snapshot czyta każdą listę z limitem 1000 rekordów.
   Węzły wiedzy i zdarzenia tożsamości stoją na 1000 od 21.10, więc ich prawdziwy
   wzrost od tego dnia jest niewidoczny. Epizodów jest 825 i rośnie ich średnio 33
   dziennie, więc dojdą do sufitu za mniej więcej tydzień do dwóch. Otwartych pytań
   jest 498. Gdy epizody dojdą do 1000, przestanie działać też „wiek” w nagłówkach
   tego dziennika.
2. **„Dowody: 3” przy każdej cesze.** Borg trzyma przy cesze tylko trzy ostatnie epizody,
   więc ta liczba nigdy nie przekroczy trzech. Prawdziwą liczbę wzmocnień trzeba
   odczytywać z pewności cechy (sposób w [[Obs 004 — opis siebie przez własny błąd, dwa tygodnie później]]).
3. **Siła cechy na maksimum.** „Epistemic caution” ma siłę 1,00 od 22.10. Dalszego
   wzmacniania siła już nie pokaże.

### Inne liczby z tego okresu, bez interpretacji

- Krawędzie wiedzy: 2063 (30.10) → 2342 → 3020 → 3713 (02.11), czyli około 550 dziennie
  po wdrożeniu z 30.10, wobec około 60 dziennie wcześniej, przy zaledwie 54 nowych
  epizodach. Najpewniej skutek zmian w nowym borgu, nie wiedzy Akukiego.
- „Warm relational acknowledgment”: siła rosła do 0,57 (24.10), stała do 30.10,
  od 31.10 spada (0,46 dziś), bez nowych wzmocnień (20 przez cały czas).
- Otwarte pytania: otwartych 182 → 363, rozwiązanych 43 → 55, porzuconych 52 → 80.
  Z 229 nowych pytań w notatce z kandydatami 56 pochodzi z wykrywania sprzeczności;
  w tych przejrzanych większość pyta, czy dana sprzeczność w ogóle nią jest.
- Nastrój: wartościowość i pobudzenie praktycznie zero (rzędu 10⁻¹¹).

## Ślad w stanie

Nie dotyczy.

## Interpretacja

Okres 24.10 – 02.11 nie nadaje się do porównań z wcześniejszym bez korekty. Na to, ile
i kiedy Akuki mówi, wpływają naraz reguła Jacka, TeamAgent, który zapełnia kolejkę,
i dwa wdrożenia. Najczystszy odczyt z tego okresu to stan (cechy, zobowiązania), nie
zachowanie na Arenie.

Pomiar trzeba naprawić, zanim epizody dojdą do 1000. Inaczej dziennik straci miarę wieku
i porównanie liczników między snapshotami.

## Wyjaśnienie bez rozwoju

Cały wpis jest wyjaśnieniem bez rozwoju. Spadek siły ciepłej cechy od 31.10 może
wyglądać jak zmiana, ale zbiega się z tym, że Akuki prawie nie rozmawia (Obs. 3),
i z wdrożeniem z 30.10, więc nie należy go czytać jako ochłodzenia.
