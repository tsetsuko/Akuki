---
id: TASK-034
title: >-
  Panel M2/M3/M4 w interfejsie demo — wielkości rozwojowe Akukiego widoczne w
  przeglądarce
status: To Do
assignee: []
created_date: '2026-09-07 14:02'
labels:
  - instrumentacja
  - M2
  - M3
  - M4
dependencies:
  - TASK-011
priority: medium
type: feature
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pokazać w interfejsie demo (borg/demo/web) wielkości, którymi mierzy się rozwój Akukiego, żeby dały się czytać bez konsoli i bez czytania jego odpowiedzi.

Zosia poprosiła o cztery: error_magnitude, zaufanie, przewidywalność partnera i ciekawość. Trzy z nich są policzone i czytane już dziś, jedna jest czymś innym, niż wygląda.

## Co istnieje jako dane

- M2 error_magnitude — AkukiInspectReport.predictions.reconciliations[].errorMagnitude, czytane przez runAkukiInspect (borg/src/akuki/inspect.ts:35-43), razem z otwartymi oczekiwaniami.
- M3 przewidywalność partnera — AkukiInspectReport.inhibition.partnerPredictability, a obok cały rozkład sygnału inhibicji na składniki: interactionCount, recentPartnerErrors, cautionBump, currentValence, attachmentFigurePresent, signal (inspect.ts:44-56).
- M4 zaufanie — trwałe i czytelne, ale NIE ma go w raporcie inspect. Leży w borg/src/memory/social/repository.ts jako parametry rozkładu Beta na domenę (domainTrustReading(domain, alpha, beta), linie 47 i 570-584), z priorem SOCIAL_TRUST_DOMAIN_PRIOR. Do panelu trzeba dołożyć odczyt.

## Czego NIE wolno pokazać jako liczby, która się rusza

Ciekawość nie jest stanem, jest parametrem. W borg/src/akuki/seed/temperament.yaml:30-36 to gain: 0.7 i target_error_band: [0.25, 0.6] — wartości stałe, wpisane w seed. Zasada projektu mówi, że parametry zostają stałe, a pracę wykonuje stan wyuczony; gdyby panel pokazywał "ciekawość" jako wskaźnik, kłamałby o rozwoju, bo ta liczba nigdy się nie zmienia.

Uczciwie pokazać da się rzecz pochodną i to ona jest mechanizmem: gdzie bieżący błąd predykcji leży wobec pasma docelowego — pod nim, w nim, czy nad nim. To się rusza i to znaczy coś rozwojowego.

## Główna praca: rozdzielić czytanie od otwierania

runAkukiInspect sam otwiera tenant (inspect.ts:135-142, openBorgDependencies({dataDir})). Wywołanie go z wnętrza serwera demo otworzyłoby DRUGĄ instancję na katalogu, który host już trzyma — dwa writery na jednym tenancie rozdwajają pamięć. To jest właściwa robota tego zadania, nie rysowanie wykresów.

Odczyty, które robi, to zwykłe wywołania repozytoriów (deps.identityEventRepository.list(...)), więc rozdzielenie jest mechaniczne: wyciągnąć funkcję czytającą, przyjmującą już otwarte zależności, i wołać ją z dwóch stron — runAkukiInspect (który otwiera) oraz endpoint panelu (który pożycza Borga od hosta przez getBorg()).

## Gdzie ma mieszkać endpoint

Serwer demo Tomka trzyma zasadę "stays agnostic to what the plugin does — it never references any specific platform". Dwa ogólne punkty zaczepienia już tam dodaliśmy w tym duchu (prepareEnv oraz klienci modeli). Trzeci, w tym samym kształcie: plugin może dostarczyć trasy HTTP. Wtedy cały kod akukowy zostaje w pakiecie akuki-connector, a w kodzie Tomka jest jedna generyczna zmiana.

Front to już jego aplikacja React. Dwie drogi, do wyboru przy realizacji:
- panel jako strona w demo/web, spójny wizualnie z /mind (Zosia zgodziła się na dotykanie tego kodu);
- albo osobna mała strona serwowana przez plugin, a w interfejsie demo tylko odnośnik. Mniej zmian u Tomka, ale dwa interfejsy.

## Dlaczego to ma wartość, a nie jest ozdobą

Instrumentacja przed mechanizmami jest w tym projekcie świadoma: zdolny model zachowuje się sensownie niezależnie od tego, czy machineria działa, więc każdy mechanizm potrzebuje pomiaru niezależnego od czytania odpowiedzi Akukiego. Dziś ten pomiar wymaga zatrzymania procesu i uruchomienia CLI, co w praktyce znaczy, że nie jest robiony.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Panel pokazuje M2 error_magnitude z rozliczeń oraz otwarte oczekiwania
- [ ] #2 Panel pokazuje rozkład sygnału inhibicji M3 na składniki, w tym przewidywalność partnera
- [ ] #3 Panel pokazuje zaufanie M4 na domenę jako parametry Beta wraz z priorem
- [ ] #4 Ciekawość jest pokazana jako parametr stały plus pochodne położenie błędu wobec pasma docelowego, nigdy jako ruchomy wskaźnik
- [ ] #5 Odczyt idzie przez Borga pożyczonego od hosta; żaden nowy proces nie otwiera tenanta drugi raz
- [ ] #6 Zmiana w kodzie Tomka jest generyczna i nie nazywa Akukiego ani BotAreny
- [ ] #7 Panel działa jednocześnie z Akukim odpowiadającym na Arenie, na jednym writerze
<!-- AC:END -->
