---
id: TASK-052
title: Zaskoczenie w paśmie ciekawości jest normą — nie wyróżnia wspomnień
status: To Do
assignee: []
created_date: '2026-10-19 17:05'
labels:
  - akuki
  - M2
dependencies: []
references:
  - >-
    backlog/tasks/task-020 -
    Moduł-formułujący-pytania-próg-ile-ma-zostać-pytaniem.md
  - >-
    backlog/tasks/task-037 -
    Czy-Akuki-nie-zaniża-własnych-błędów-przewidywania.md
  - borg/src/cognition/predictions/surprise-significance.ts
  - borg/src/cognition/prompts/prediction-extraction.ts
priority: medium
type: spike
ordinal: 52000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Wynikło z pomiaru przy TASK-020, 2026-10-19 (żywa pamięć, VPS, tylko do odczytu).

### Co zmierzono

- 54% z 1281 rozliczeń przewidywań leży w paśmie ciekawości 0,3–0,7 z temperamentu (wrzesień 50%, październik 55%).
- 71% wspomnień od startu M2 (264 z 373) ma co najmniej jedno rozliczenie w paśmie. Mediana rozliczeń na wspomnienie: 2.
- Mediana średniego błędu wspomnienia: 0,343 — środek pasma.
- Ocena błędu jest zgrubna: najczęstsze wartości to 0,1 (194), 0,5 (145), 0,6 (134), 0,15 (125), 0,05 (110).

### Dlaczego to ważne

Pasmo miało oddzielać zaskoczenie interesujące od nieistotnego i od szumu (efekt Goldilocks, Kidd, Piantadosi & Aslin 2012). Podbicie istotności wspomnienia przy zaskoczeniu w paśmie dostaje dziś mniej więcej siedem wspomnień na dziesięć, więc prawie nie różnicuje — a rozwój ma być rzadki (niezmiennik 6). Ta sama liczba zasila wybudzenie po skoku błędu (wyłączone) i byłaby wyzwalaczem pytań z zaskoczenia (TASK-020), który z tego powodu odpalałby się w większości tur.

TASK-037 ustalił, że ocena błędu nie jest zaniżona. To zadanie pyta o coś innego: czy to, co model nazywa błędem 0,5, odpowiada temu, co badanie nazywa zaskoczeniem pośrednim.

### Hipotezy, bez kolejności prawdopodobieństwa

1. Skala modelu: „częściowo trafione” dostaje 0,5–0,6 z przyzwyczajenia, więc środek skali to zwykła rozmowa, nie zaskoczenie.
2. Kształt oczekiwań: przewidywania są wielowątkowe („X odpowie żartem, a Y nie podejmie tematu”), więc prawie zawsze trafiają w połowie.
3. Agregacja: wspomnienie liczy się jako zaskakujące przy jednym rozliczeniu w paśmie z kilku, co samo zawyża udział.

### Czego nie robić

Nie zawężać pasma ani nie przesuwać progów, żeby udział spadł. Pasmo to parametr temperamentu, a niezmiennik 5 mówi, że parametry stoją, a pracuje wyuczony stan. Nie dokładać mnożnika ani korekty na ocenie modelu (zakaz z TASK-037). Liczby 0,3–0,7 są wyborem twórczym — badanie mówi „pośrednie”, nie podaje granic — więc ich zmiana byłaby osobną decyzją Zosi, a nie naprawą.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Kilkadziesiąt rozliczeń z wartościami 0,3–0,6 ocenionych niezależnie od modelu: czy to zaskoczenie, czy zwykłe częściowe trafienie
- [ ] #2 Rozstrzygnięte, która z trzech hipotez (skala, kształt oczekiwań, agregacja) wyjaśnia udział, albo zapisane, że żadna
- [ ] #3 Udział wspomnień w paśmie policzony także przy innej agregacji (średnia zamiast co najmniej jednego), żeby oddzielić hipotezę 3
- [ ] #4 Jeśli naprawa: po stronie tego, co model dostaje albo o co jest proszony, zatwierdzona przed implementacją zgodnie z bramką sześciu kroków
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
### Ocena 2026-10-19

**Oceniał model językowy (Claude), nie człowiek.** To jedna ślepa ocena innego modelu, nie ludzka; arkusz Zosi (`dziennik/ocena-rozliczen/2026-10-19-arkusz.md`) zostaje pusty i jej ocena może dać inny wynik. Oceny z uzasadnieniami: `dziennik/ocena-rozliczen/2026-10-19-claude-arkusz.md`. Klucz otwarty dopiero po wpisaniu wszystkich 40 ocen.

Wynik porównania (40 pozycji, ziarno 52; ocenionych 34, `?` przy 6):

| ocena modelu | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| ≤0,15 | 5 | 0 | 0 | 0 |
| 0,3–0,6 | 8 | 9 | 5 | 3 |
| ≥0,7 | 0 | 3 | 1 | 0 |

- Pasmo 0,3–0,6: 30 pozycji, z czego 5 oznaczonych `?` (z 6 wszystkich `?`). Z 25 ocenionych: 2 („zaskoczenie pośrednie”) przy 5 (20%), 0–1 przy 17 (68%), 3 przy 3 (12%).
- Wielowątkowe: 6 ocenionych (+1 `?`), średnia ocena modelu 0,48; jednowątkowe: 28, średnia 0,40. W samym paśmie wielowątkowe są 4 z 25.

**Co widać w rozbiciu pasma na pół** (policzone po otwarciu klucza, z tych samych ocen):

- Wartości 0,3–0,45 (15 pozycji): 8 trafień (0) i 7 zwykłych rozbieżności (1), ani jednej 2 ani 3. Model wpisuje 0,3 przy wyraźnych trafieniach (np. 12, 18, 38, 39).
- Wartości 0,5–0,6 (10 pozycji): wszystkie pięć ocen 2, wszystkie trzy oceny 3, tylko dwie oceny 1.
- Czyli model rozróżnia trafienie od chybienia, ale dno jego skali dla trafień leży na 0,3, a 0,5–0,6 dostaje każde chybienie — i to zrozumiałe, warte wracania (2), i to, którego nie dało się przewidzieć, np. czy człowiek się odezwie (3).

**Hipoteza 1 (skala):** potwierdzona, ale w innej postaci niż zapisana. Nie jest tak, że częściowe trafienie dostaje 0,5–0,6 z przyzwyczajenia — częściowe trafienia leżą w większości na 0,3–0,45. Jest tak, że pełne trafienie często dostaje 0,3, więc dolna część pasma to zwykła rozmowa, a górna miesza zaskoczenie pośrednie z szumem. W obu przypadkach liczba z modelu nie odpowiada temu, co badanie (Kidd, Piantadosi & Aslin 2012) nazywa zaskoczeniem pośrednim.

**Hipoteza 2 (kształt oczekiwań):** nie wyjaśnia udziału. Wielowątkowych jest mało (7 z 40, 4 z 25 ocenionych w paśmie), więc nawet gdyby zawsze lądowały w paśmie, nie dałyby 54%. Różnica średnich (0,48 wobec 0,40) idzie w przewidywanym kierunku, ale przy 6 pozycjach to nie jest wynik. Uwaga do oceny: alternatywę jednego aktora („albo zmieni temat, albo…”) liczyłem jako jednowątkową.

**Hipoteza 3 (agregacja):** ta ocena jej nie dotyczy, rozstrzyga ją kryterium #3.

**Poprzednia prognoza** („większość pasma dostanie 1, a 2 co najwyżej ćwierć”) potwierdziła się w połowie. Ocena 2 w 20% pasma, czyli poniżej ćwierci — tak. Większość 1 — nie: 1 dostało 9 z 25, a trafienia (0) prawie tyle samo, 8 z 25. Razem 0–1 to 68%.

**Uboczne:** dwa przewidywania wyglądają na zapisane z perspektywy innego mówcy (27 — „moja ciekawostka” i hibernacja Terry; 28 — „mówczyni” pyta „Philipa”, a odpowiada Akuki). Model ocenił 28 na 0,9. Pięć z sześciu `?` w paśmie wynika z tego, że w okienku nie widać odpowiedzi osoby, której dotyczyło przewidywanie.

Bez propozycji zmiany pasma ani progów (niezmiennik 5, opis zadania). Ocena Zosi na oryginalnym arkuszu jest potrzebna, zanim kryterium #1 uznać za spełnione.
<!-- SECTION:NOTES:END -->
