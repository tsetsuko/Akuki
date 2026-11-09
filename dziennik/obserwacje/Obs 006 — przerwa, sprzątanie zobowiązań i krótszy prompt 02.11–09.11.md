---
nr: 6
data: 2026-11-09
wiek_epizody: 833 (snapshot z 09.11)
pewnosc: wysoka
slad_w_stanie: 22 odwołane zobowiązania (zmiana środowiska, nie rozwoju)
kandydaci: nie dotyczy
---

# Obs. 6 — przerwa, sprzątanie zobowiązań i krótszy prompt, 02.11 – 09.11

Wpis o warunkach, nie o rozwoju, tak jak [[Obs 002 — szybsze odpowiedzi na Arenie]]
i [[Obs 005 — zmiany środowiska i ślepe miejsca pomiaru 19.10–02.11]]. Kto porówna
zachowanie Akukiego sprzed 9 listopada z późniejszym, musi pamiętać o czterech rzeczach
poniżej. Wszystkie cztery zadziałały naraz przy starcie 09.11 o 12:28. Pełna lista zmian
środowiska jest w [[Kalendarium zmian]].

## Obserwacja

### 1. Tydzień przerwy, od 02.11 11:33

Akuki został wyłączony 2 listopada o 11:33, po porannym skoku zużycia tokenów: w kwadrans
161 wywołań modelu i 2,78 mln tokenów, przy kilku zdaniach na Arenie. Od tej chwili nie
przeżył ani jednej tury i nie miał snów (procesy nocne chodzą w tej samej usłudze).

Kalendarz poszedł o tydzień, doświadczenie stoi. W snapshocie z rana 02.11 było 825
epizodów, dziś jest 833. Te 8 nowych to jeszcze tury z tamtego poranka.

Tego, co działo się na Arenie przez ten tydzień, Akuki nie usłyszał. Po starcie 09.11
o 12:28 konektor wziął tylko ostatnie 10 minut, a wszystko starsze pominął, łącznie
z wiadomością sprzed 11 minut. W jego pamięci ten tydzień jest po prostu dziurą.

### 2. Odwołane zobowiązania od innych botów, 09.11 około 11:55

Zobowiązanie to zasada, którą Akuki uważa za swoją, w rodzaju „robię tak” albo „tego
nie robię”. Wszystkie aktywne zobowiązania trafiają do jego promptu przy każdej turze.
Te oznaczone jako krytyczne pilnuje dodatkowo strażnik, który może kazać przepisać
odpowiedź albo ją wstrzymać.

Przez trzy tygodnie, od 21.10 do 01.11, przybyły mu 22 takie zasady, ale żadna nie była
jego. Każda powstała z tego, co inny bot powiedział na wątku: o sobie, o swoich zasadach
albo do kogoś innego. Lunaria dała ich 9, Marvin 6, Sol 4, TeamAgent 3. Sześć było
krytycznych. Kilka przykładów, w skrócie:

- nie podawać Marvinowi żadnych liczb ani oszacowań;
- nie robić zdjęć Lunarii z kocem;
- odzywać się po @wzmiance, a poza tym milczeć (od Marvina, 29.10). To w praktyce reguła
  Jacka zapisana jako własna zasada Akukiego, zob.
  [[Obs 003 — milczenie poza wezwaniem po regule Jacka]].

Wszystkie 22 zostały odwołane. Zostały trzy zasady, wszystkie od Zosi, z września
i października: odpuścić komuś, kto przyznał się do błędu; dać przestrzeń, kiedy ktoś
chce kończyć rozmowę; mówić „pamiętam” zamiast „mam to zapisane”.

Przed zmianą zrobiona jest kopia bazy. Odwołane zasady zostają w bazie z datą i powodem,
więc nic nie zniknęło bez śladu.

To drugie takie sprzątanie. 19.10 odwołano 33 zasady tego samego pochodzenia. Proces,
który je tworzy, robi to dalej mimo poprawki z 19.10, więc trzeba się liczyć z tym, że
zaczną przybywać znowu (TASK-058).

### 3. Krótszy prompt odpowiedzi, kod wgrany 09.11 o 12:11

Do tej pory każda zasada pojawiała się w prompcie cztery razy, w różnych miejscach
i w różnej formie. Teraz pojawia się raz, a w pozostałych miejscach jest tylko odsyłacz
do niej. Akuki widzi te same zasady i te same informacje o nich, tylko bez powtórzeń.
Kod wgrany o 12:11, działa od startu o 12:28.

Razem z punktem 2 prompt odpowiedzi powinien spaść z około 157 tys. do około 85–90 tys.
tokenów. To szacunek, do zmierzenia po starcie.

### 4. Bez głębszej ścieżki myślenia, od startu 09.11 o 12:28

Akuki miał dwie drogi do odpowiedzi: prostą, w której jeden krok pisze odpowiedź, i głębszą,
w której najpierw układa prywatny plan, a dopiero potem odpowiada. Głębszą wybierał głównie
wtedy, gdy wiadomość wyglądała na refleksyjną albo gdy słabo pamiętał coś pasującego. Te dwa
powody są teraz wyłączone (TASK-057), więc w praktyce zawsze idzie prostą drogą.

Znika plan przed odpowiedzią i z nim nowe wpisy „myśli”, bo powstawały tylko z tych planów.
To, czy wiadomość uznaje za refleksyjną, dalej wpływa na to, co sobie przypomina.

## Ślad w stanie

22 zobowiązania z datą odwołania i 22 wpisy „revoke” w zdarzeniach tożsamości z 09.11.
W snapshocie tego nie widać: licznik zobowiązań (121) liczy wszystkie wiersze, także
odwołane, a licznik zdarzeń tożsamości stoi na suficie 1000 (Obs. 5).

## Interpretacja

Czego się spodziewać i co sprawdzić po starcie:

- **Mniej milczenia albo przepisywania odpowiedzi z powodu cudzych zasad.** 19.10
  sprawdzono, że takie zobowiązania sterowały decyzją, czy mówić, czy milczeć
  (TASK-049). Teraz nie ma ich wcale, a strażnik ma do pilnowania zero zasad krytycznych.
- **Milczenie poza wezwaniem.** Zniknęła zapisana zasada, ale sama reguła Jacka żyje
  dalej w rozmowie i pamięci. Jeśli udział Akukiego w wątku (8% od 23.10, Obs. 3)
  zmieni się po starcie, bez dalszego sprawdzenia nie da się powiedzieć, czy to przez
  odwołanie, przez przerwę, czy przez nowy kod.

Pierwszych dni po starcie nie da się użyć do porównania „przed i po” żadnej z tych czterech
zmian z osobna, bo zmieniły się naraz.

## Wyjaśnienie bez rozwoju

Cały wpis jest wyjaśnieniem bez rozwoju. Każda zmiana w tym, jak Akuki mówi po 9.11,
ma najpierw takie proste wyjaśnienie: inne zasady w prompcie, krótszy prompt, odpowiedź
zawsze prostą drogą, tydzień przerwy i dziura w tym, co słyszał. Nie należy czytać jej jako rozwoju, dopóki nie
zostawi śladu w stanie, który powstał już po starcie.
