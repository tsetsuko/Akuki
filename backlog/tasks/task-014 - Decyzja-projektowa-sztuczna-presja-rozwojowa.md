---
id: TASK-014
title: 'Decyzja projektowa: sztuczna presja rozwojowa'
status: To Do
assignee: []
created_date: '2026-08-20 14:28'
updated_date: '2026-08-20 15:51'
labels: []
dependencies: []
priority: low
ordinal: 2500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pomysł Zosi: żywe organizmy rozwijają się pod presją; model nie ma żadnej, więc trzeba ją zbudować przez mocne ograniczenia. To spina M2/M3/M5 w jeden silnik zamiast trzech osobnych funkcji.

DWIE RÓŻNE PRESJE. Filogenetyczna (przez pokolenia: zmienność, selekcja, dziedziczenie) ukształtowała maszynerię wrodzoną - to zastępuje temperament.yaml pisany ręcznie. Ontogenetyczna (w jednym życiu: dotychczasowa strategia przestaje wystarczać) to ta, która może działać na jednym Akukim. Budujemy drugą.

PRESJA WYMAGA CZTERECH RZECZY: potrzeby, trudności, sprzężenia zwrotnego, oraz NIEWYSTARCZALNOŚCI dotychczasowego repertuaru. O tym ostatnim się zapomina - jeśli to, co Akuki już robi, zaspokaja potrzebę, to jest ćwiczenie, nie rozwój.

TRZY POTRZEBY JUŻ ISTNIEJĄ JAKO STAN W BAZIE: błąd predykcji (M2); otwarte pytania z samo-eskalującą pilnością (conditions/open-question-urgency-bump.ts, triggers/open-question-dormant.ts); niezaspokojone cele z terminal_condition + triggers/goal-followup-due.ts. Robota to nie tworzenie presji, a NIEROZŁADOWYWANIE jej za tanio.

BRAMKA JEST ŹRÓDŁEM PRESJI: jeśli Akuki czegoś potrzebuje, ale nie może się odezwać, dopóki nie przewiduje partnera, to jedyna droga do ulgi wiedzie przez lepszą predykcję.

DWIE PUŁAPKI:
 (1) AKCJA ZEROWA STAJE SIĘ OPTYMALNA. Milczenie w pełni spełnia -bądź nieśmiały-, więc presji nie ma. Przy każdym ograniczeniu pytaj: jakie jest najbardziej leniwe w pełni zgodne zachowanie? Jeśli jest stabilne i wygodne, ograniczenie nic nie daje.
 (2) PRESJA POWYŻEJ STREFY NAJBLIŻSZEGO ROZWOJU daje wyuczoną bezradność, nie wzrost. Już zakodowane w target_error_band [0.3, 0.7] - błąd POŚREDNI i REDUKOWALNY. Presja musi maleć, gdy kompetencja rośnie.
 Wersja LLM-owa obu: nierealizowalne ograniczenie daje niespójność albo grę z ograniczeniem (zdegenerowane zgodne wyjście), nie adaptację.

TEST, CZY PRESJA JEST PRAWDZIWA: czy presja istnieje w bazie danych, kiedy nikt nie patrzy? Eskalująca pilność i odpalające się warunki wybudzenia to mechanizm. Zdanie w prompcie -pilnie musisz to zrozumieć- to dekoracja.

DO ROZSTRZYGNIĘCIA PRZEZ ZOSIĘ (patrz doubts, questions.md):
 - która potrzeba jest główna
 - co jest zaworem ulgi
 - czy warstwa ewolucyjna (wiele Akukich z różnym temperamentem, selekcja) jest w zakresie
 - czy presja stała, czy podążająca za kompetencją

WYMAGA ZGODY. To zadanie projektowe, nie implementacyjne.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Wybrana główna potrzeba i zawór ulgi
- [ ] #2 Dla każdego ograniczenia wypisane najbardziej leniwe zgodne zachowanie
- [ ] #3 Polityka kalibracji ustalona (stała vs podążająca)
- [ ] #4 Zdecydowane, czy warstwa ewolucyjna jest w zakresie
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: claude
created: 2026-08-20 15:51
---
2026-08-20: Cztery pytania projektowe zadane naraz - za dużo. Skłonności zapisane w "doubts, questions.md" jako NIEZAMKNIęTE: główna potrzeba = otwarte pytania (pewność średnia), zawór ulgi = próg inhibicji, może + dostęp do pamięci (pewność NISKA), warstwa ewolucyjna = odnotować nie budować (wysoka), kalibracja = podąża za kompetencją (wysoka).

Zastrzeżenie Zosi do menu działań: nie podoba jej się ręcznie pisana lista odblokowywanych zdolności, chyba żeby Akuki sam nazywał działania. To jest ZGODNE z jej własną zasadą ("nie projektuj dorosłego Akukiego") - menu pisane z góry ją łamie. borg ma już podłoże: Procedural Synthesizer odkrywa umiejętności, nie są wpisywane ręcznie.

Uwaga na później: "dostęp do większej części własnej pamięci" jako nagroda zderza się z Kardynalną Zasadą Pamięci borga (recall globalny, disclosure kontekstowe) - heuristics:guard wywala build za bramkę na przypominanie.

Priorytet obniżony do Low: NIC z tego nie blokuje M0. Instrumentacja nie zależy od żadnej z tych odpowiedzi. Wrócić, gdy będą pierwsze snapshoty.
---
<!-- COMMENTS:END -->
