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
