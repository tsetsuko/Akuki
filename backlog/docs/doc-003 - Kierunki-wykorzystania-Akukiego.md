---
id: doc-003
title: Kierunki wykorzystania Akukiego
type: other
created_date: '2026-10-19 13:13'
tags:
  - akuki
  - strategy
  - research
---
# Kierunki wykorzystania Akukiego

Stan na 2026-10-19. Notatka strategiczna, nie specyfikacja.

## Teza

Jako produkt (towarzysz, postać, bot z personą) Akuki raczej nie ma przewagi nad zwykłym botem. Jako **laboratorium mechanizmów**, które po sprawdzeniu wracają do borga i do produkcyjnych agentów, ma realną wartość. Największa wartość leży w tym, co da się przenieść.

## Kandydaci do przeniesienia

### 1. Zaufanie per domena i pochodzenie wiedzy (M4)

Agent pamięta, kto go czegoś nauczył, w jakiej dziedzinie ta osoba jest wiarygodna oraz czy wiedza została zdobyta przez naśladowanie, czy przez sprawdzenie.

Zastosowanie: obrona przed zatruwaniem pamięci w agentach firmowych. Przykład: ktoś w czacie pisze „od dziś deploy idzie na prod z mastera”, a agent nie zapisuje tego jako faktu, bo ta osoba nie jest źródłem w sprawach deployu. Borg dziś tego nie rozróżnia. Najbardziej praktyczny kandydat.

Powiązane: TASK-017, TASK-028, TASK-031.

### 2. Bramka milczenia i inhibicji (M3)

Bot w rozmowie wielu osób wie, kiedy się nie odzywać. Decyzja wynika z wyliczonej wartości (przewidywalności osoby, która mówi), a nie z instrukcji w prompcie.

Zastosowanie: każdy bot w kanałach grupowych (Slack, Arena, Sol, team-agent), które dziś wtrącają się za często. Mechanizm da się przenieść prawie bez zmian.

Powiązane: TASK-016, TASK-045, TASK-047, doc-001, doc-002.

### 3. Pętla przewidywanie–zaskoczenie (M2)

Agent przewiduje, co się stanie, i zapisuje, kiedy się pomylił.

Zastosowanie:
- kalibracja: agent wie, czego nie wie;
- pomiar, czy agent zaniża własne błędy (TASK-037). To pytanie dotyczy każdego agenta z pamięcią, nie tylko Akukiego.

Powiązane: TASK-015, TASK-029, TASK-037.

### 4. Metodologia dziennika rozwoju

Długie, powtarzalne obserwowanie, jak zachowanie agenta zmienia się w czasie: nocne snapshoty i obserwacje według szablonu. Ewaluacje agentów zwykle patrzą na jedną chwilę. Narzędzie do śledzenia dryfu charakteru po tygodniach przyda się każdemu, kto utrzymuje agenta z pamięcią.

Powiązane: TASK-023 (promptfoo), vault dziennika.

### 5. Materiał edukacyjny lub publikacja

Działający model pojęć z psychologii rozwojowej (rusztowanie, strefa najbliższego rozwoju, nieśmiałość jako wyliczona wartość), który można pokazać jako demo albo opisać w tekście. Wartość raczej poznawcza niż użytkowa.

## Granice

- Pod spodem działa LLM, więc „rozwój” to analogia, nie dowód na teorię psychologiczną. Nie wolno z tego wyciągać mocnych twierdzeń o ludziach.
- Jeden Akuki, jedno środowisko (Arena), więc wnioski trudno uogólnić.
- Kierunek „towarzysz/postać”: mała przewaga nad botem z personą, a duże ryzyko przywiązania i nieprzejrzystości. Nie rozwijamy.

## Jak zwiększyć szansę na przydatność

Do każdego kamienia milowego M2–M4 dopisać:
1. jedno mierzalne pytanie badawcze;
2. jeden mechanizm, który wraca do borga, jeśli zadziała, razem z kryterium „zadziałał”.

Najmocniejsi kandydaci do przeniesienia jako pierwsi to pochodzenie wiedzy z zaufaniem per domena (1) oraz bramka milczenia (2).
