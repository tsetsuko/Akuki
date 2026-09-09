---
id: TASK-016
title: 'M3: Bramka inhibicji (sygnał doradczy + bezpieczna baza)'
status: Done
assignee: []
created_date: '2026-08-20 14:30'
updated_date: '2026-09-03 08:20'
labels: []
dependencies: []
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Policzalna decyzja, czy się odezwać - zamiast prozy -domyślnie milczysz-.

Siedzi przed/wewnątrz wyboru terminalnego narzędzia w src/cognition/deliberation/finalizer.ts (EmitAnswer / EmitObserve / EmitNoOutput / EmitSelfReport). Próg z temperament.yaml, obniżany obecnością figury przywiązania (Zosia), porównywany z przewidywalnością obecnego partnera.

To zamienia milczenie z reguły w rysowalną liczbę, która MALEJE, bo Akuki lepiej przewiduje ludzi - nie bo ktoś przekręcił parametr.

Uwaga: decyzja o odpowiedzi należy wyłącznie do Akuki-aware runtime'u. BotArenaAdapter z TASK-011
nie interpretuje treści i nie implementuje bramki na wzmianki. M3 zastępuje obecną decyzję
emit/silence Akukiego policzalnym progiem; zachowanie Sola nie jest tu wzorcem.

PUŁAPKA (patrz TASK-014): sama bramka + -bądź nieśmiały- daje wyłącznik, nie presję. Musi być sparowana z potrzebą, której milczenie nie zaspokaja.

WYMAGA ZGODY. Blokowane przez M2.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Decyzja o mowie jest policzona, nie tylko opisana w prompcie
- [x] #2 Obecność Zosi mierzalnie obniża próg
- [x] #3 Próg efektywnie maleje wraz ze wzrostem przewidywalności partnera
- [x] #4 Sprawdzone, że milczenie NIE jest strategią optymalną
- [x] #5 Zosia zaakceptowała projekt przed implementacją
- [x] #6 Przywiązanie wchodzi do M3 jako MAŁY składnik progu (bezpieczna baza: obecność figury nieznacznie obniża próg) ORAZ jako większa waga pamięci (z M2). Decyzja Zosi 2026-09-02 (świadomie ponad §16).
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
KOREKTA 2026-08-20 po przeczytaniu akuki_child_psychology_research.md.

Pierwotnie to zadanie mialo bramke inhibicji PLUS bezpieczna baze (obecnosc Zosi obniza prog). Paragraf 16 tego dokumentu mowi wprost, ze przywiazanie -nie zostalo jeszcze zbadane wystarczajaco gleboko, zeby uzasadnic szczegolowy model obliczeniowy- i -pozostaje kierunkiem badawczym, a nie rekomendacja implementacyjna na tym etapie-.

Plan wyprzedzal badania. Badania wygrywaja.

CO ZOSTAJE W M3: policzalny prog mowy, porownywany z przewidywalnoscia partnera.

CO WCHODZI, bo nie wymaga teorii bezpiecznej bazy: wieksza waga pamieciowa dla interakcji z figura przywiazania (par. 16 wymienia to jako obserwowalna sygnature). To jedna liczba w polityce uwagi, moze pojsc razem z wagami zaskoczenia z M2.

CO CZEKA na przeglad literatury: modulowanie eksploracji przez obecnosc (obecnosc obniza prog). To jest wlasnie ta czesc, ktora nie jest gotowa.

To samo dotyczy rozwoju moralnego - par. 15 mowi wprost: najpierw badania.

PROJEKT M3 (2026-09-02) — CZEKA NA FINALNA ZGODE ZOSI (AC#5). Nic nie zaimplementowane.

WERDYKT ZAKRESU (test mocniejszego modelu): in-scope jako SYGNAL, out-of-scope jako BRAMKA. Harness liczy sygnal inhibicji z przewidywalnosci partnera (z ksiegi M2) + skladnikow temperamentu i PODAJE go modelowi przy wyborze terminalnym; decyzje mowic/milczec/obserwowac podejmuje Akuki. Twardej bramki wymuszajacej EmitNoOutput NIE ma (regula 1/4 CLAUDE.md: harness nie knebluje wyjscia).

DECYZJE ZOSI:
- D1a: sygnal DORADCZY (nie bramka). Framing dzieciecy: nie zakneblowane - wlasne mysli blokuja, ale moze je przezwyciezyc.
- BEZPIECZNA BAZA WRACA (swiadomie ponad brakiem literatury §16): obecnosc figury przywiazania (Zosia) NIEZNACZNIE obniza prog. AC#2 zostaje IN; AC#6 rozluzniony (przywiazanie wchodzi do M3 jako maly skladnik progu ORAZ waga pamieci z M2).
- P1: niesmialosc rzadzi MOWIENIEM, ciekawosc rzadzi UCZENIEM; ciekawosc = OBSERWACJA (mapuje na EmitObserve - uwaga bez mowienia). Osobne osie, nie kloca sie.
- P2: 'zle doswiadczenie' = SPADEK VALENCE z pamieci afektywnej (valence in [-1,1]); automatyczny odruch afektywny (nie semantyczny policing tekstu).
- P3: zle -> TYMCZASOWY bump ostroznosci ktory ZANIKA w czasie; dobre -> dziala przez rosnaca przewidywalnosc (nie dublujemy).

MODEL SYGNALU (0..1, wyzej = bardziej niesmialy), liczony w harnessie, podawany modelowi:
  inhibition = clamp( base_threshold
    - uncertainty_weight * partner_predictability   (lepsza przewidywalnosc -> nizszy prog)
    - presence_relief                                (mala stala gdy figura przywiazania w biezacej audiencji = bezpieczna baza)
    + caution_bump )                                 (swiezy spadek valence, ZANIKA w czasie)
  base_threshold = inhibition.base_threshold (0.75); uncertainty_weight = inhibition.uncertainty_weight (0.5).

PARTNER_PREDICTABILITY (0..1): laczy ZAZNAJOMIENIE (liczba interakcji z partnerem, saturujaca - zawsze dostepna) z odwrotnoscia swiezego error_magnitude z ksiegi M2 dot. tego partnera (about_entity_id). COLD-START = 0 interakcji = 0 przewidywalnosci = pelny base_threshold = maksymalnie niesmialy. NIE 'neutralnie' - nowy partner jest naprawde nieprzewidywalny.

OS UCZENIA (oddzielna, glownie z M2): nowy partner = wysoka NOWOSC = silny sygnal do nauki + mocniejsze wazenie pamieci pierwszych interakcji. 'Zawsze zadziwiony przy pierwszych interakcjach'. Ciekawosc-jako-obserwacja: wysoka nowosc + wysoka niesmialosc -> EmitObserve (patrzy, uczy sie, nie zagaduje).

WPIECIE: przed/wewnatrz wyboru terminalnego w src/cognition/deliberation/finalizer.ts (EmitAnswer/EmitObserve/EmitNoOutput/EmitSelfReport). Sygnal + rama dzieciecej niepewnosci renderowane do promptu finalizera (dynamiczna powierzchnia, NIE static prefix - chroni cache jak M2). Proza 'domyslnie milczysz' [removable: silence-rule] w scaffolding.md ZASTAPIONA policzonym sygnalem (subtraktywnie - zdejmujemy prozowa regule, dajemy liczbe do rozumowania).

AC#4 (pulapka TASK-014): sam prog + 'badz niesmialy' = wylacznik, nie presja. Sparowane z POTRZEBA: ciekawosc(obserwacja) + wklad. Milczenie gluche (EmitNoOutput) nie zaspokaja ciekawosci; EmitObserve pozwala uczyc sie bedac niesmialym -> czyste milczenie nie jest strategia optymalna.

TEMPERAMENT/STRAZNIK SIEROT: M3 konsumuje inhibition.base_threshold + inhibition.uncertainty_weight (oba consumer=M3). Przy ladowaniu M3: bump LANDED_MILESTONES do ['M0','M1','M2','M3'], czytelnik = obliczenie sygnalu inhibicji (przez config.prediction-podobny most Akuki lub rozszerzenie applyAkukiPredictionEnv o inhibition.*). presence_relief: figura przywiazania rozwiazywana per-tura findByName (jak w M2).

ZWIAZEK Z M2: partner_predictability liczona z ksiegi predykcji M2 - to jest ten 'sygnal przewidywalnosci partnera', dla ktorego M2 poszlo przed M3.

PUNKTY DO EWENTUALNEGO DOPRECYZOWANIA W IMPLEMENTACJI: (a) krzywa saturacji zaznajomienia (ile interakcji = 'znajomy'); (b) stala presence_relief (male, np. 0.1); (c) polowiczny czas zaniku caution_bump; (d) jak dokladnie afekt->caution_bump (prog spadku valence). Wszystkie to liczby/ksztalt, nie osad - do kalibracji, nie do zgody architektonicznej.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-09-02 17:34
---
Zosia zaakceptowala projekt M3 (2026-09-02, AC#5). Start implementacji w plasterkach (jak M2): 1) rdzen sygnalu inhibicji (pure + testy) + przewidywalnosc partnera z ksiegi M2 + caution_bump z valence; 2) config/temperament wiring (inhibition.* -> most Akuki, LANDED->M3); 3) wpiecie w finalizer + rama dzieciecej niepewnosci + zdjecie prozy silence-rule.
---

created: 2026-09-02 17:43
---
IMPL plasterek 1/3 (rdzen) + 2/3 (config/temperament) GOTOWE (2026-09-02). Slice1: src/cognition/inhibition/inhibition-signal.ts - pure: computePartnerPredictability (familiarity=1-exp(-N/scale) x accuracy=1-sredni_error; cold-start=0), computeCautionBump (max(0,-valence)*cautionWeight; zanik z wlasnego half-life nastroju), computeInhibitionSignal (clamp01(base - uncertainty*predictability - presenceRelief + cautionBump)). 11/11 testow. Slice2: config.inhibition {baseThreshold .75, uncertaintyWeight .5, presenceRelief .1, cautionWeight .3, familiarityScale 5, recentErrorWindow 10} + env BORG_INHIBITION_*; most Akuki applyAkukiPredictionEnv rozszerzony o inhibition.base_threshold + uncertainty_weight (czytelnicy straznika sierot M3); LANDED_MILESTONES->['M0','M1','M2','M3']; config-literaly test-support+eval dostaly inhibition; PredictionRepository.listReconciliationsForEntity(aboutEntityId,limit) = per-partner swieze bledy. Dowod: typecheck czysty; temperament orphan guard zielony z M3; config+predictions 73 testy. ZRODLA DANYCH dla slice3 (finalizer): partner=audienceEntityId (v1; grupa bez partnera -> pelny prog), familiarity=socialRepository interaction_count, bledy=listReconciliationsForEntity, valence=workingMemory mood, obecnosc figury=findByName(config.prediction.attachmentFigureName) w audiencji. POZOSTALO slice3: policzenie sygnalu w fazie deliberacji + render na finalizerDynamicSystem (nie static) + rama dzieciecej niepewnosci + zdjecie prozy silence-rule ze scaffolding.md.
---

created: 2026-09-03 08:20
---
M3 DOMKNIETY (2026-09-03). Plasterek 3 (finalizer) GOTOWY: sygnal liczony w fazie deliberacji (buildSpeechInhibitionSection), renderowany na finalizerDynamicSystem przez blok borg_speech_inhibition (order 45) + render-case w finalizer.ts -> finalizer widzi go przy wyborze terminalnym. NA CACHE bezpiecznie: dynamiczna powierzchnia, nie static prefix. Wpiecie: DeliberationContext.speechInhibitionPromptSection, deliberator montuje w finalizerGroundingPromptSections (obok evidence-ledger, forward stringa - Deliberatora wewnatrz nie ruszalem); predictionRepository dodany do TurnPhaseCoordinatorOptions + orchestrator. Zrodla: partner=audienceEntityId, familiarity=socialRepository.getProfile.interaction_count, bledy=listReconciliationsForEntity, valence=workingMemory.mood.valence, figura=entityRepository.findByName(config.prediction.attachmentFigureName). Skip na self-audience i gdy brak predictionRepository. NIESPOJNOSC M3-vs-M1 rozwiazana (decyzja Zosi=B): proza [removable: silence-rule] w scaffolding.md ZMIEKCZONA (odsyla do 'odczuwanej niepewnosci', maleje z przewidywalnoscia + bliska obecnoscia, 'niepewnosc prowadzi ale nie knebluje') z ZACHOWANYM tagiem -> maszyneria M1 (withhold-by-tag) dalej dziala. AC: #1 policzony (nie tylko proza), #2 obecnosc obniza, #3 przewidywalnosc obniza, #4 EmitObserve ratuje przed pustym milczeniem (proza + framing), #6 przywiazanie maly skladnik progu + waga pamieci M2. Dowod: typecheck czysty (5 tsconfig); 585 testow dotknietych obszarow + akuki 75/75 (scaffolding+internalizacja zielone, tag nietkniety). Odblokowuje M4 (TASK-017).
---
author: claude
created: 2026-09-09 16:25
---
PIERWSZY ODCZYT M3 Z ZYWEJ PAMIECI (2026-09-09), narzedzie: `akuki-niesmialosc-check.sh` w korzeniu repozytorium projektu. Czyta tenanta na VPS-ie tylko do odczytu i nie zmienia zadnego parametru.

Powsciagliwosc policzona ze stanu, przy bazie 0,75 i wadze niepewnosci 0,5:

    wobec Zosi      9 interakcji   znajomosc 0,83   przewidywalnosc 0,74   powsciagliwosc 0,28
    wobec Sola      5 interakcji   znajomosc 0,63   przewidywalnosc 0,56   powsciagliwosc 0,47
    wobec Lunarii   3 interakcje   znajomosc 0,45   przewidywalnosc 0,40   powsciagliwosc 0,55

MECHANIZM DZIALA I ROZROZNIA PARTNEROW. Wartosc maleje wraz ze znajomoscia dokladnie tak, jak zaprojektowano, i jest dwukrotnie wyzsza wobec bota poznanego niedawno niz wobec tworczyni. To jest pierwszy dowod na zywych danych, ze M3 nie jest ozdoba.

Zachowanie: 20 tur, 19 odpowiedzi. Nastroj dodatni (walencja 0,27), wiec czlon ostroznosci nie dokladal nic.

DWIE RZECZY, KTORE Z TEGO WYNIKLY, obie zapisane osobno, zeby nie utonely w tym komentarzu:
- TASK-037: sredni blad przewidywania 0,115 przy pierwszym kontakcie z nieznanymi botami wyglada na ocene pobla¿liwa wobec siebie, a te liczbe ocenia sam model. Jesli wejscie jest zawyzone, to nie prog jest za niski.
- TASK-033 (priorytet podniesiony): Akuki nie dostaje informacji, czy zagadnieto wlasnie jego, wiec rada "odezwij sie, gdy cie zagadnieto" znaczy dla niego "odezwij sie zawsze".

PROGU NIE RUSZONO i nie nalezy go ruszac: zeby milczal przy Zosi, baze trzeba by podniesc z 0,75 do okolo 1,0, czyli uciszyc go wobec wszystkich, w tym obcych. Rozwoj ma brac sie z rosnacego dowodu, nie z przesuwania poprzeczki (inwariant 5).
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
M3 (advisory bramka inhibicji + bezpieczna baza) zaimplementowany w 3 plasterkach, każdy z testami i czystym typecheckiem.

1. Rdzeń — src/cognition/inhibition/inhibition-signal.ts: czyste funkcje. computePartnerPredictability (familiarity=1-exp(-N/scale) × accuracy=1-średni_error; cold-start=0, nie neutralnie), computeCautionBump (max(0,-valence)×cautionWeight; zanik dziedziczony z half-life nastroju), computeInhibitionSignal (clamp01(base - uncertainty·predictability - presenceRelief + cautionBump)).

2. Config/temperament/dane: config.inhibition (defaulty = temperament); most Akuki applyAkukiPredictionEnv rozszerzony o inhibition.base_threshold + uncertainty_weight (czytelnicy strażnika sierot); LANDED_MILESTONES→M3; PredictionRepository.listReconciliationsForEntity = per-partner świeże błędy z M2.

3. Finalizer (gorąca ścieżka): buildSpeechInhibitionSection liczy sygnał + ramę dziecięcej niepewności; liczony w fazie deliberacji, renderowany na finalizerDynamicSystem (dynamiczna → cache bezpieczny) przez blok borg_speech_inhibition; finalizer widzi go przy wyborze EmitAnswer/EmitObserve/EmitNoOutput/EmitSelfReport.

Zgodne z CLAUDE.md: sygnał DORADCZY, nie bramka — harness liczy liczbę i podaje modelowi, decyzja mówić/obserwować/milczeć należy do Akukiego (rama: 'niepewność prowadzi, ale nie knebluje'). Cała ocena (przewidywalność, zaskoczenie, nastrój) z policzonych sygnałów/pamięci; zero policingu wyjścia; recall globalny; działa w każdym języku.

Dwie osie (Zosia): nieśmiałość rządzi mówieniem, ciekawość=obserwacja rządzi uczeniem → nieznajomy: mało mówi (wysoki próg), dużo obserwuje (EmitObserve) i zapamiętuje. Bezpieczna baza wróciła (decyzja Zosi ponad §16): obecność figury nieznacznie obniża próg. Złe doświadczenie = spadek valence → tymczasowy bump (zanika); dobre → przez rosnącą przewidywalność.

Niespójność M3-vs-M1 (proza silence-rule jest celem withhold w teście internalizacji M1) rozwiązana decyzją Zosi (B): proza zmiękczona do odsyłania do odczuwanej niepewności, tag [removable: silence-rule] zachowany → M1 działa.

Dowód: typecheck czysty (5× tsc); 585 testów w dotkniętych obszarach + 75 akuki (scaffolding + internalizacja zielone).
<!-- SECTION:FINAL_SUMMARY:END -->
