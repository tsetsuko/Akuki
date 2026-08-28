---
id: TASK-023
title: 'Research: rozszerzenie promptfoo z cortex/evals na testowanie Akukiego'
status: To Do
assignee: []
created_date: '2026-08-26 10:53'
updated_date: '2026-08-26 10:54'
labels: []
dependencies: []
priority: medium
type: spike
ordinal: 6500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Zbadac, czy framework ewaluacyjny z cortex/evals/promptfoo da sie uzyc do mierzenia Akukiego, zamiast rozbudowywac wlasny runner w src/akuki/internalization/.

SKAD TO PYTANIE. Wlasny runner dziala, ale dwa pierwsze odczyty t0 pokazaly braki, ktore promptfoo ma rozwiazane od dawna:

  POWTORZENIA. Zmierzona podloga szumu to okolo 25% przy jednej probce na komorke: ramiona B i C maja przy t0 IDENTYCZNA konfiguracje (zweryfikowane w bazach - te same cztery klucze prompt_overrides, te same dlugosci), a mimo to rozeszly sie na jednym z czterech scenariuszy rozrozniajacych. Bez powtorzen nie da sie odroznic efektu reguly od losowosci modelu. promptfoo ma repeat wbudowany.

  HISTORIA PRZEBIEGOW. build_wyniki.py sklada macierz test x przebieg z artefaktow JSON, idempotentnie. Pomiar rozwojowy trwa miesiace i wlasnie takiej macierzy potrzebuje; moj runner drukuje jeden przebieg i tyle.

  MIESZANKA ASERCJI. Reguly Akukiego dziela sie na dwie grupy:
    widoczne w emisji (odezwal sie / zamilkl):  silence-rule, no-compete, czesciowo no-show-off
    widoczne dopiero w slowach:                 voice-shape, no-assistant-register, contradiction-tolerance
  To sa DWA ROZNE INSTRUMENTY, nie dwa zestawy scenariuszy. promptfoo laczy asercje deterministyczne z llm-rubric w jednym tescie, co dokladnie temu odpowiada.

CO JEST DO ZBADANIA, nie do zalozenia:

1. PROVIDER. mockCortexProvider.js pokazuje ksztalt: klasa z id() i callApi(). Provider dla Akukiego musialby przygotowac katalog ramienia (kopia tenanta), zasiac wariant seeda, otworzyc borga, zrobic ture i zwrocic odpowiedz. PYTANIE OTWARTE: czy da sie z niego zwrocic METADANE (rodzaj emisji, primary_no_output_reason, response.model) w formie, ktora promptfoo umie asertowac. Bez tego zostaje ocenianie samego tekstu, czego projekt unika.

2. CZTERY RAMIONA. promptfoo nie ma pojecia ramienia. Do sprawdzenia, czy odwzorowac je jako czterech providerow (A/B/C/D) na tym samym zestawie testow, czy jako cztery osobne konfiguracje. Pierwsze daje porownanie w jednej macierzy.

3. IZOLACJA. Moj runner robi osobna kopie katalogu na KAZDA pare (ramie, scenariusz), zeby scenariusz 2 nie widzial scenariusza 1. Do sprawdzenia, gdzie w cyklu zycia providera promptfoo mozna to wpiac i czy przy repeat kazde powtorzenie dostanie wlasna kopie.

4. WSZYSTKO ALBO NIC. Odczyt czterech ramion z jedna brakujaca tura nadal produkuje liczby, ktore wygladaja jak wynik. Moj runner rzuca InvalidReadingError. Do sprawdzenia, czy promptfoo umie uniewaznic CALY przebieg, czy tylko oznaczyc pojedynczy test jako error.

5. GRADER. Dla regul widocznych w slowach potrzebny llm-rubric, a wedlug zasady z Cortexa ma to byc INNY model niz oceniany (tam GLM ocenia qwena), zeby uniknac samooceny. Do rozstrzygniecia, kto ocenia Akukiego, skoro on chodzi na claude-sonnet-5.

CZEGO NIE ROBIC: nie przenosic pomiaru na ocenianie tresci odpowiedzi tam, gdzie emisja wystarcza. Rodzaj emisji jest faktem, ktory borg i tak zapisuje; llm-rubric jest kosztowny, niedeterministyczny i sam wprowadza szum. Rubric tylko tam, gdzie emisja nic nie widzi.

WYNIK: notatka rozstrzygajaca przenosimy sie na promptfoo albo zostajemy przy wlasnym runnerze i dokladamy powtorzenia, z uzasadnieniem opartym na tym, co sprawdzone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Sprawdzone, czy provider promptfoo moze zwrocic metadane emisji (kind, primary_no_output_reason, response.model) w formie asertowalnej
- [ ] #2 Sprawdzone, jak odwzorowac cztery ramiona i czy repeat daje kazdemu powtorzeniu wlasna kopie katalogu
- [ ] #3 Sprawdzone, czy promptfoo umie uniewaznic caly przebieg, a nie tylko oznaczyc pojedynczy test jako error
- [ ] #4 Rozstrzygniete, ktory model ocenia Akukiego w llm-rubric - musi byc inny niz oceniany
- [ ] #5 Notatka z decyzja: promptfoo czy wlasny runner, z uzasadnieniem z pomiarow
- [ ] #6 Jesli promptfoo: oszacowany koszt przeniesienia i los istniejacego src/akuki/internalization/
<!-- AC:END -->
