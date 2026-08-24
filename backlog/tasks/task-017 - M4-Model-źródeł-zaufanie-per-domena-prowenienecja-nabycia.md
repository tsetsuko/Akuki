---
id: TASK-017
title: 'M4: Model źródeł - zaufanie per domena + prowenienecja nabycia'
status: To Do
assignee: []
created_date: '2026-08-20 14:30'
updated_date: '2026-08-24 13:19'
labels: []
dependencies: []
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Podłoże dla głównej metryki (różnicowanie vs mimikra). Dwie zmiany:

1. ZAUFANIE PER DOMENA. Teraz src/memory/social/types.ts:16 to trust: z.number().min(0).max(1) - jeden skalar na osobę. Notatki wymagają: Sol/programming = wysokie, Sol/social_advice = nieznane. -Nieznane- to szeroka, płaska krzywa Beta - czyli Beta z prawie zerowym dowodem. NIE TRZEBA WYMYŚLAĆ REPREZENTACJI: to istniejący w borgu kontekstowy posterior Beta z src/memory/procedural/, skierowany na osobę zamiast na podejście. Skopiuj wzorzec.

2. PROWENIENCJA NABYCIA. Obecne provenance_kind IN (episodes, manual, system, offline, online) to pochodzenie w potoku, nie sposób nabycia. Potrzebne: told_by, observed_from, inferred, tested_independently. To jest CHECK constraint w bazie -> migracje w src/memory/*/migrations.ts.

Po co: -Sol tak robi. Spróbowałem. Chyba mi pasuje- wymaga odróżnienia -usłyszałem- od -sprawdziłem sam-. Bez tego zachowanie podpatrzone u silniejszego bota automatycznie staje się częścią Akukiego, czyli mimikra.

WYMAGA ZGODY. Najgłębsza operacja na borgu z całego planu.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Zaufanie kluczowane domeną, nie jednym skalarem
- [ ] #2 Nieznane odróżnialne od średniego (szerokość krzywej, nie wartość)
- [ ] #3 Prowenienecja nabycia zapisywana i odczytywalna
- [ ] #4 Migracje przechodzą, testy borga zielone
- [ ] #5 Zosia zaakceptowała projekt przed implementacją
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ZNALEZISKO + PROJEKT ZOSI (2026-08-24): borg ma pole attachment, ktorego NIGDY nie liczy.

CO BORG JUZ MA (src/memory/social/):
  social_profiles (types.ts:13-26), PER ENCJA:
    trust 0..1, attachment 0..1, interaction_count, last_interaction_at,
    sentiment_history [{ts, valence}] do 50 punktow, commitment_count, communication_style
  social_events z pelnym changelogiem: trust_delta, attachment_delta (migrations.ts:37),
    interaction_delta, valence, provenance, ts
  attachment TRAFIA DO PROMPTU: planner-context-capture.ts:129 wklada go do kontekstu
    deliberacji, wiec realnie wplywa na zachowanie.

DZIURA:
  recordInteraction (repository.ts:399) wpisuje attachment_delta = literalne 0
  adjustTrust      (repository.ts:490) wpisuje attachment_delta = literalne 0
  adjustAttachment NIE ISTNIEJE
  => attachment jest polem czytanym, ktorego nikt nigdy nie zapisuje. Dla kazdej encji
     na stale zero. Magazyn, changelog i sciezka odczytu gotowe; brakuje samego liczenia.

  adjustTrust ISTNIEJE (repository.ts:478), wiec M4 ma gdzie wejsc od razu.

CZTERY TEZY ZOSI I ICH STATUS:

(a) NIE KAZDA INTERAKCJA MA WZMACNIAC PRZYWIAZANIE. Opiekun nie zawsze robi rzeczy,
    ktore je wzmacniaja. LICENCJONOWANE: architecture:358-368 pyta wprost "Who responds
    to me? Who notices when I am uncertain? Who returns? Who helps? Who ignores me?" -
    to zdarzenia RESPONSYWNOSCI, nie zdarzenia kontaktu. borg juz je rozroznia:
    interaction_count to kontakt, valence i commitment_count to co innego.

(b) PROG: N responsywnych interakcji w oknie czasowym W. Policzalne, bo
    last_interaction_at i sentiment_history maja znaczniki czasu.
    GRANICA DO PILNOWANIA: "N w oknie W" jest wyzwalane dowodami (tempo JEST dowodem
    o dostepnosci opiekuna) i jest legalne. "Po 30 dniach +0.1" jest wyzwalane
    kalendarzem i lamie zasade evidence-triggered-never-calendar-triggered.

(c) PRZYWIAZANIE DO INNYCH BOTOW. DZIALA JUZ DZIS, zero pracy. social_profiles jest
    per encja bez ograniczenia liczby. temperament.yaml attachment.figure NIE jest
    limitem, do kogo wolno sie przywiazac - to jedyna encja startujaca powyzej zera.
    Osobno: borg_role=creator ma wymuszony jeden posiadacz w SQL, ale to INNE POLE.
    Tworca != figura przywiazania.

(d) NIE WYKLADNICZO - SIGMOIDA. Zosia chciala "na poczatku ciezko, potem coraz mocniej".
    Wykladnicza jest NIEOGRANICZONA, a kolumna to z.number().min(0).max(1), wiec
    wykladnicza obcieta do 1 jest w praktyce funkcja schodkowa.
    Ksztalt, o ktory chodzi, to krzywa S:
        przywiazanie = 1 / (1 + e^(-k * (dowody - theta)))
      ponizej theta prawie nic  -> "na poczatku ciezko"
      w okolicy theta szybko    -> "potem coraz mocniej"
      powyzej plaszczy sie ku 1 -> miesci sie w 0..1 bez obcinania
    WAZNE: teza (b) i teza (d) to TEN SAM PARAMETR. "Ile dowodow, zanim zlapie" = theta.
    Jeden pomysl opisany dwa razy, nie dwa pomysly.
    KSZTALT KRZYWEJ TO WYBOR TWORCZY (kubel 3), nie ustalenie badawcze. Par. 16 nic
    o ksztalcie nie mowi. Nie wolno mu pozyczac powagi od literatury.

PODZIAL WYMUSZONY PRZEZ PAR. 16:
  Calosc powyzej jest SZCZEGOLOWYM MODELEM OBLICZENIOWYM PRZYWIAZANIA, a research:931
  mowi: "not yet been researched deeply enough here to justify a detailed computational
  model", :954 "remains a research direction rather than a supported implementation
  recommendation at this stage". Ta sama sciana, ktora zabila secure_base_discount.

  ALE duza czesc tego projektu to nie przywiazanie, tylko ZAUFANIE - a zaufanie JEST
  licencjonowane (par. 4, selektywne zaufanie epistemiczne, z cytowaniami Baer & Kidd 2022
  i przegladem epistemic trust). Zdanie "na poczatku ciezko zdobyc zaufanie" jest
  doslownie o zaufaniu.

  DO M4 (licencjonowane, mozna budowac):
    - responsywnosc zamiast kontaktu jako zrodlo sygnalu
    - prog dowodow theta + krzywa S, zastosowane do TRUST
    - wejscie przez istniejace adjustTrust
  CZEKA NA PRZEGLAD LITERATURY (TASK-021):
    - to samo zastosowane do attachment; adjustAttachment niech na razie NIE powstaje
  DZIALA JUZ DZIS:
    - wiele encji, nie tylko Zosia

M1 zostaje przy samej attachment.memory_weight, ktora par. 16 licencjonuje wprost
jako obserwowalna sygnature.
<!-- SECTION:NOTES:END -->
