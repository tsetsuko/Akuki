---
id: TASK-017
title: 'M4: Model źródeł - zaufanie per domena + prowenienecja nabycia'
status: Done
assignee: []
created_date: '2026-08-20 14:30'
updated_date: '2026-09-04 08:25'
labels: []
dependencies: []
ordinal: 36000
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
- [x] #1 Zaufanie kluczowane domeną, nie jednym skalarem
- [x] #2 Nieznane odróżnialne od średniego (szerokość krzywej, nie wartość)
- [x] #3 Prowenienecja nabycia zapisywana i odczytywalna
- [x] #4 Migracje przechodzą, testy borga zielone
- [x] #5 Zosia zaakceptowała projekt przed implementacją
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

PROJEKT IMPLEMENTACJI M4 (2026-09-03) — CZEKA NA FINALNA ZGODE ZOSI (AC#5). Nic nie zaimplementowane. Bazuje na projekcie Zosi z 2026-08-24 powyzej.

WERDYKT OPUS 5.0: in-scope. Harness naprawde nie ma (a) reprezentacji zaufania PER DOMENA — trust to jeden skalar, nie da sie 'ufam Solowi w kodzie, nieznane w poradach'; ani (b) prowenienecji NABYCIA — nie odroznia 'uslyszalem' od 'sprawdzilem sam', a to podloze glownej metryki (roznicowanie vs mimikra). Oba to luki STRUKTURY pamieci (posterior Beta + pole prowenienecji), nie osad modelu. Dowod napedza zaufanie (zdarzenia responsywnosci juz rejestrowane); model KLASYFIKUJE (domena, sposob nabycia) przez ekstrakcje = DOZWOLONE.

PODZIAL PAR.16 (potwierdzenie): ZAUFANIE = in (licencjonowane, par.4 epistemic trust). PRZYWIAZANIE = out do TASK-021 (adjustAttachment NIE powstaje, brak S-krzywej na attachment). M1/attachment.memory_weight zostaje.

--- CZESC 1: ZAUFANIE PER DOMENA (AC#1, #2) ---
RDZEN MATEMATYKI: REUSE src/memory/procedural/bayes.ts (computeBetaStats -> mean+mode+przedzial ufnosci, betaInverseCdf, regularizedIncompleteBeta). NIE wymyslamy Beta od nowa.
MODEL DANYCH: nowa tabela social_trust_domains, klucz (entity_id, domain): alpha REAL, beta REAL, updated_at, created_at. domain = OTWARTY string nadawany przez model (jak procedural context_key 'code_debugging:typescript:self'), NIE enum (CLAUDE.md: bez stalych zbiorow wartosci).
  wartosc zaufania per domena = srednia Beta; PEWNOSC = szerokosc przedzialu (wariancja). NIEZNANE = slaby prior (alpha=beta~1 -> plaska/szeroka) ODROZNIALNE od SREDNIEGO (alpha=beta duze -> waskie przy 0.5) po SZEROKOSCI, nie wartosci -> literalne AC#2.
SCIEZKA AKTUALIZACJI: wejscie przez istniejace adjustTrust (repository.ts:478), ale domenowo: zdarzenie responsywnosci o domenie inkrementuje alpha (pozytywne: odpowiedzial/pomogl/wrocil) lub beta (zignorowal/zawiodl) dla (entity, domain). Zrodlo = RESPONSYWNOSC nie KONTAKT (teza (a) Zosi; architecture:358-368).
STARY SKALAR trust: patrz D2.

--- CZESC 2: PROWENIENCJA NABYCIA (AC#3) ---
Nowy wymiar acquisition_mode IN ('told_by','observed_from','inferred','tested_independently') — CHECK constraint, migracja. To NIE provenance_kind (potokowe pochodzenie); to SPOSOB nabycia.
GDZIE: przekonania/zachowania, ktore Akuki przejmuje. Semantic beliefs juz maja source_kind (semantic/types.ts:76) — dokladamy acquisition_mode (+ opcjonalnie acquired_from_entity_id: od kogo). To podloze mimikra-vs-roznicowanie: przekonanie 'observed_from Sol' vs 'tested_independently'. Patrz D3 (czy tez procedural skills).
PRODUCENT: poturowa ekstrakcja klasyfikuje sposob nabycia nowo-przyjetego przekonania (uslyszane/podpatrzene/wywnioskowane/sprawdzone) = LLM czyta ture -> structured, jak M2.

--- WPIECIE / RYZYKO ---
Najglebsza operacja (jak zaznacza task): migracje social + semantic, nowe repo-metody, ekstraktor. Plasterki jak M2/M3: 1) Beta trust store + migracja + repo (reuse bayes) + testy; 2) domenowy adjustTrust + producent responsywnosci (ekstrakcja); 3) acquisition_mode migracja + pole + producent; 4) render do promptu (jak attachment idzie do planner-context-capture.ts:129) — zaufanie per-domena widoczne dla modelu z etykieta pewnosci.

--- PUNKTY DECYZYJNE DLA ZOSI ---
D1 domena: OTWARTY string nadawany przez model (rekom., bez enuma) vs stala taksonomia.
D2 stary skalar trust: ZOSTAJE jako pochodna zagregowana (rekom.: back-compat — planner context, seed attachment.figure, istniejacy czytelnicy dalej dzialaja; overall = Beta/srednia wazona domen) vs zastapic.
D3 acquisition_mode gdzie: TYLKO semantic beliefs na start (rekom.) vs tez procedural skills.
D4 ksztalt zaufania: posterior Beta WPROST (srednia+szerokosc; 'na poczatku ciezko' = sila prioru = theta) — rekom.; vs dodatkowa jawna S-krzywa na wierzchu (ryzyko podwojnego ksztaltowania). Uwaga: teza (b)=(d) Zosi mowia ze theta i 'ile dowodow' to ten sam parametr — prior Beta go realizuje bez osobnej sigmoidy.
D5 producent responsywnosci: poturowa ekstrakcja klasyfikuje (domena + czy partner byl responsywny/pomocny/zawiodl) -> adjustTrust(entity,domain,+/-). Potwierdzenie wzorca (jak M2).
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-09-03 14:06
---
Zosia zaakceptowala projekt M4 (2026-09-03, AC#5). Decyzje: D1 domena = otwarty string nadawany przez model (para osoba x temat); D2 stary skalar trust ZOSTAJE jako pochodna agregat Bet domenowych; D3 acquisition_mode tylko semantic beliefs teraz (procedural skills -> TASK-028); D4 posterior Beta wprost (bez osobnej S-krzywej); D5 producent = poturowa ekstrakcja (domena + responsywnosc partnera) -> adjustTrust(osoba,domena,+/-). Start plasterkami: 1) Beta trust-store per (encja,domena) + migracja + repo (reuse procedural/bayes.ts) + testy; 2) domenowy update + producent responsywnosci; 3) acquisition_mode semantic + producent; 4) render do promptu.
---

created: 2026-09-03 14:12
---
IMPL plasterek 1/4 GOTOWY (2026-09-03): store zaufania per domena. Migracja social id:2 social_trust_domains (entity_id, domain, alpha, beta, created/updated_at; PK (entity_id,domain)) - nowa tabela w istniejacej grupie, bez band-shiftu. types.ts: socialTrustDomainSchema + SOCIAL_TRUST_DOMAIN_PRIOR=1 (Beta(1,1)=nieznane). repository.ts: DomainTrustReading {domain,alpha,beta,mean,ci95,observations}; getDomainTrust (prior gdy brak wierszy - nigdy null), listDomainTrust, adjustDomainTrust (upsert ON CONFLICT, positive->alpha+=w else beta+=w, weight>0, evidence-only), overallDomainTrust (agregat evidence-weighted = zrodlo pochodnego skalara D2). Reuse procedural/bayes.ts computeBetaStats. Eksport z index. Dowod: typecheck czysty (5 tsconfig); vitest social 9/9 (nowe 4: prior=unknown szeroki ci95; unknown vs medium po szerokosci=AC#2; +evidence rosnie/-evidence spada; niezaleznosc domen + agregat). AC#1+AC#2 w warstwie danych. POZOSTALO: 2) domenowy producent (poturowa ekstrakcja: domena + responsywnosc partnera -> adjustDomainTrust) + wpiecie pochodnego skalara trust; 3) acquisition_mode na semantic beliefs + producent; 4) render zaufania per-domena do promptu.
---

created: 2026-09-03 14:28
---
RESUME (nowa sesja): M4 zatwierdzony (AC#5), decyzje D1-D5 w komentarzu #1. Slice 1/4 GOTOWY i ZACOMMITOWANY (b31cf037, niewypchniety) - store zaufania per domena, testy social 9/9. NASTEPNY = slice 2/4: PRODUCENT. Poturowa ekstrakcja (wzor: M2 src/cognition/predictions/prediction-extractor.ts + wpiecie w extraction-phase.ts Promise.all jako kolejny element, gated frameAnomaly, opcja opcjonalna w TurnPhaseCoordinatorOptions). Ekstraktor klasyfikuje dla partnera (audienceEntityId): {domain: OTWARTY string, positive|negative} 0..n -> socialRepository.adjustDomainTrust(entity, domain, {positive}). PLUS wpiecie POCHODNEGO skalara: po adjustDomainTrust odswiez social_profiles.trust = overallDomainTrust(entity) (D2). socialRepository juz jest w TurnPhaseCoordinatorOptions. Potem slice 3 (acquisition_mode na semantic beliefs: migracja + pole + producent ekstrakcji; NIE procedural=TASK-028) i slice 4 (render zaufania per-domena do promptu, wzor planner-context-capture.ts:129 gdzie idzie attachment). Git: commit per krok. Niewypchniete: e29f446f + b31cf037. Model kognitywny opus-4-8. CLAUDE.md: cala semantyka w modelu przez ekstrakcje, recall globalny, bez enumow/list slow, bez policingu wyjscia.
---

created: 2026-09-03 15:35
---
IMPL slices 2-4 DONE (2026-09-03). Commits: 5911e181 (slice 2), 6f21785e (slice 3), 5140253d (slice 4), all on akuki-dev, unpushed (together with e29f446f + b31cf037).

SLICE 2 -- per-domain trust producer. New src/cognition/social-trust/{domain-trust-extractor,domain-trust-turn-service,index}.ts plus src/cognition/prompts/domain-trust-extraction.ts. Pattern copied from M2 (callStructuredTool, tool EmitDomainTrustEvidence, degraded reasons, thin turn service). The model classifies {domain: open string, positive: boolean}[] for the partner; the prompt surfaces that person's already-known domains (cap 24) so labels stay stable and evidence accumulates. Responsiveness is the signal, not contact. Wired into extraction-phase Promise.all, gated isUserTurn + frameAnomaly === null; partner = actionSpeaker.entityId ?? audienceEntityId (reuses the existing currentMessageSpeaker resolution). D2 derived scalar: adjustDomainTrust now refreshes social_profiles.trust = overallDomainTrust in the same transaction (no social_events row -- social_trust_domains is itself the ledger and the scalar is a projection).

SLICE 3 -- acquisition provenance. Semantic migration id 2 (band-local, no id shift): ALTER TABLE semantic_nodes ADD acquisition_mode TEXT NULL CHECK (told_by|observed_from|inferred|tested_independently) + acquired_from_entity_id TEXT NULL + partial index. Chose entity id over a name string so a belief joins to that person's per-domain trust. Producer is the EXISTING semantic extractor (two more tool fields + prompt guidance), not a new pass. Null is a first-class answer. An acquisition source is kept only when it matches a supplied identity anchor; an invented id drops to null while the mode stands. On update the last stated mode wins (told_by -> tested_independently is a real change of standing). Both columns are SQL-only like the lifecycle columns; the merge helper was renamed withSqlLifecycle -> withSqlOnlyFields since acquisition is not lifecycle.

SLICE 4 -- render. New DeliberationContext.domainTrustByEntityId, built in turn-phase-coordinator via new resolveDomainTrustByEntityId (participants.ts) for audience + participants, threaded through deliberation-phase. borg_audience_profile now renders trust_by_domain=[domain mean (lo-hi, n=N); ...] with the hint 'wider interval = less settled, not less trusted', in both the single-audience and Participants branches, inside the existing disclosure-labelled line; a person with no domain evidence renders nothing. Cap 6 domains. Acquisition provenance surfaced via semanticNodeStateMetadata (evidence ledger) and verification-candidate structuralFields (deliberation/prompt/retrieval.ts).

PROOF: 5 tsconfigs clean; heuristics:guard shows only the pre-existing HEAD failure (prediction-extractor.ts:113 content in buildMessages, left from M2 -- verified identical with changes stashed); social 10/10, social-trust 4/4, semantic 89/89, memory+retrieval+tools 871/871, lifecycle 99/99, deliberation prompt + evidence-ledger + participants 419/419. turn-orchestrator.test.ts has 70 pre-existing failures on HEAD (FakeLLMClient has no scripted response available) -- unchanged by this work.

AC#1-#3 done. AC#4 done modulo the two pre-existing HEAD failures above, which are separate defects. Attachment untouched as planned: adjustAttachment still does not exist (TASK-021). Remaining M4-adjacent follow-ups: acquisition_mode on procedural skills (TASK-028) and the two pre-existing HEAD failures.
---

created: 2026-09-03 16:22
---
FULL-SUITE PROOF + TEST-SUPPORT FIX (2026-09-03). Two more commits: db2e037d, e561b00d.

The full `vitest run src` was red at 134-135 failures. Root cause found and fixed, and most of it predated M4: every user turn runs the prediction extractor (M2) and now the domain-trust extractor (M4), and neither had a FakeLLMClient fallback. In any test that did not explicitly script them, each consumed a scripted response meant for the reply and the turn died further down with 'FakeLLMClient has no scripted response available' -- about 130 failures across turn-orchestrator, borg/__tests__ and stop-primitive. db2e037d gives both an empty-result fallback like the other post-turn extractors (shared tool-recognition helper instead of a tenth copy), registers both in the extractor max-token label registry (same gap), and updates the two expectations that count a turn's LLM calls: tracer event sequence (four concurrent extraction calls, not three) and the model-routing filter in borg/__tests__/turn-orchestrator.test.ts.

e561b00d exempts borg_speech_inhibition from prompt-surface fixture pinning -- an M3 leftover (registry entry from a2b9671e was never pinned or exempted); the section needs live social + prediction repositories that the deterministic fixtures do not wire.

FINAL STATE: 3685-3692 passed. Everything still red is a 15s-timeout flake under full-suite parallel load -- the set changes run to run (episodic lexical paging, evidence-ledger reverse-scan, belief-reviser drains, review-resolver matrix, retrieval pipeline-sprint2, reflector, autonomy scheduler, participant scan caps) and every one passes when its file is run alone. Plus demo/server/src/__tests__/server.test.ts, which cannot collect at all: Cannot find package '@hono/node-server' (environment, not code).

STILL RED, NOT FIXED, NOT MINE: heuristics:guard reports src/cognition/predictions/prediction-extractor.ts:113 -- the open_expectations rows surfaced to the model carry `content` with no disclosure label. That is a real M2 design gap (which label do the entity's own private predictions carry?), not a mechanical fix, so it is left for the M2 owner rather than papered over with a guard allowlist entry. AC#4 checked on that basis.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
M4 (model źródeł) zaimplementowany w 4 plasterkach; commity b31cf037, 5911e181, 6f21785e, 5140253d na akuki-dev (wypchnięte). Plus dwie naprawy testowe: db2e037d, e561b00d.

1. Store zaufania per domena — migracja social id 2, tabela `social_trust_domains` z kluczem `(entity_id, domain)`. Zaufanie jako posterior Beta: `alpha` to dowody potwierdzające, `beta` to zawody; wartością jest średnia, pewnością szerokość przedziału. Dzięki temu „nieznane" (słaby prior, krzywa szeroka) jest odróżnialne od „średniego" (dużo dowodów, krzywa wąska wokół 0.5) po SZEROKOŚCI, nie po wartości — literalne AC#2. Matematyka reużyta z `src/memory/procedural/bayes.ts` (`computeBetaStats`), nic nie wymyślane od nowa. `domain` to otwarta etykieta modelu, nie enum (D1).

2. Producent — `src/cognition/social-trust/` (ekstraktor + cienki serwis turowy) i `prompts/domain-trust-extraction.ts`, wzorzec z M2: `callStructuredTool`, narzędzie `EmitDomainTrustEvidence`, ścieżki degraded. Model klasyfikuje `{domain, positive}[]` dla partnera; prompt pokazuje już znane domeny tej osoby (cap 24), żeby etykiety były stabilne i dowody się kumulowały. Sygnałem jest RESPONSYWNOŚĆ, nie kontakt (teza (a) Zosi) — sama tura nie jest dowodem. Wpięty w `extraction-phase` `Promise.all`, bramkowany `isUserTurn` + brak anomalii ramy; dowód przypisany do rozpoznanego mówcy, a przy jego braku do rozmówcy sesji (reuse istniejącego `currentMessageSpeaker`), przy braku obu nie zapisuje nic zamiast zgadywać. D2: `adjustDomainTrust` odświeża pochodny skalar `social_profiles.trust = overallDomainTrust` w tej samej transakcji, bez wiersza `social_events` — `social_trust_domains` sama jest rejestrem tego dowodu, a skalar to rzut, nie osobne zdarzenie.

3. Prowenienecja nabycia (AC#3) — migracja semantic id 2 (band-local, bez przesunięcia id): `acquisition_mode TEXT NULL CHECK (told_by|observed_from|inferred|tested_independently)` + `acquired_from_entity_id`. Id encji zamiast nazwy, żeby przekonanie łączyło się z zaufaniem per domena tej osoby, a nie z pisownią. Producentem jest ISTNIEJĄCY ekstraktor semantyczny (dwa pola w narzędziu + copy promptu), nie nowy przebieg. `null` to pełnoprawna odpowiedź — zgadywanie trybu jest gorsze niż zostawienie otwartego. Źródło zapisywane tylko gdy trafia w podaną kotwicę tożsamości; wymyślone id spada do null, tryb zostaje. Przy aktualizacji wygrywa ostatni podany tryb (told_by → tested_independently to realna zmiana statusu). Obie kolumny SQL-only jak kolumny cyklu życia, dołączane przy odczycie z mirrora wektorowego; helper przemianowany `withSqlLifecycle` → `withSqlOnlyFields`, bo nabycie to nie cykl życia.

4. Render — `DeliberationContext.domainTrustByEntityId` budowane w `turn-phase-coordinator` (nowy `resolveDomainTrustByEntityId`) dla audiencji i uczestników. `borg_audience_profile` pokazuje `trust_by_domain=[domena średnia (lo-hi, n=N); ...]` z podpowiedzią „wider interval = less settled, not less trusted", w obu gałęziach renderu, wewnątrz istniejącej linii z etykietą disclosure; osoba bez dowodów domenowych nie renderuje nic zamiast rzędu płaskich priorów. Prowenienecja nabycia wystawiona przez `semanticNodeStateMetadata` (evidence ledger) i `structuralFields` kandydatów weryfikacji.

Zgodne z CLAUDE.md: cała semantyka (jaka domena, czy partner był responsywny, jak nabyto przekonanie) w modelu przez ekstrakcję — dozwolone; harness robi wyłącznie księgowanie i arytmetykę Beta; zero policingu wyjścia; recall globalny (`listDomainTrust` bez bramki audiencji, dane per domena to ranking i etykieta, nie predykat recall); działa w każdym języku (brak enumów domen i list słów).

Przywiązanie NIETKNIĘTE zgodnie z par. 16: `adjustAttachment` nadal nie istnieje, brak S-krzywej na attachment — czeka na TASK-021. `attachment.memory_weight` z M1 bez zmian.

ZNALEZISKO PO DRODZE (ważniejsze niż samo M4): pełny `vitest run src` był czerwony na 134 testach i większość tego była starsza niż M4. Każda tura użytkownika odpala ekstraktor predykcji (M2), a teraz też domenowy, i żaden nie miał fallbacku w `FakeLLMClient`. W testach, które ich jawnie nie skryptowały, każdy zjadał skryptowaną odpowiedź przeznaczoną dla repliki, a tura umierała niżej na „FakeLLMClient has no scripted response available" — ~130 czerwonych w turn-orchestrator, borg/__tests__ i stop-primitive. db2e037d daje obu pusty fallback jak pozostałym poekstraktorom (jeden wspólny helper rozpoznawania narzędzia zamiast dziesiątej kopii), rejestruje oba w rejestrze etykiet max-token (ta sama luka) i poprawia dwie asercje liczące wywołania LLM tury. e561b00d wyłącza `borg_speech_inhibition` z pinowania fixture'ami prompt-surface — zaległość po M3.

DOWÓD: 5 tsconfigów czystych; 3685–3692 testów zielonych. Czerwone zostają tylko: timeouty 15 s pod pełnym obciążeniem (zbiór zmienia się z przebiegu na przebieg, każdy plik osobno przechodzi) oraz `demo/server/src/__tests__/server.test.ts`, który nie zbiera się przez brak pakietu `@hono/node-server` (środowisko, nie kod).

ZOSTAWIONE ŚWIADOMIE: `heuristics:guard` zgłasza `prediction-extractor.ts:113` — wiersze `open_expectations` idą do modelu bez etykiety disclosure. To luka projektowa M2, nie mechaniczna łatka; otwarta jako TASK-029 (wpis w allowliście guardu zamiótłby ją pod dywan). Prowenienecja nabycia na umiejętnościach proceduralnych pozostaje w TASK-028 zgodnie z D3.
<!-- SECTION:FINAL_SUMMARY:END -->
