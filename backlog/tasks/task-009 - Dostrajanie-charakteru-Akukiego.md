---
id: TASK-009
title: 'M1: Rozdzielić seed na temperament (parametry) i scaffolding (usuwalna proza)'
status: In Progress
assignee: []
created_date: '2026-08-19 11:31'
updated_date: '2026-08-26 12:03'
labels: []
dependencies:
  - TASK-012
priority: medium
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ZMIANA KIERUNKU. Pierwotnie: "dostrajanie charakteru przez rozmowę". To było dostrajanie WYJŚCIA — jak Akuki brzmi. Nowa architektura (akuki_newborn_development_architecture.md) potrzebuje mechanizmów, nie opisu głosu.

Zamiast jednego persona/akuki.md — dwa pliki o różnej trwałości:

seed/temperament.yaml — wrodzone, NIGDY nie usuwane, parametryzuje mechanizmy:
  inhibition:      { base_threshold, uncertainty_weight }          # consumer: M3
  curiosity:       { gain, target_error_band }                     # consumer: M2 — błąd POŚREDNI i redukowalny (ZPD)
  attachment:      { figure, memory_weight }                       # consumer: M0/M1 + M2 — POPRAWKA: secure_base_discount wypadł, par. 16
  memory:          { surprise_weight }                             # consumer: M2
  agency:          { contingency_floor, contingency_confidence }   # consumer: M5 — POPRAWKA: dwie liczby, nie jedna
  differentiation: { imitation_retention_threshold }               # consumer: M4/M5

seed/scaffolding.md — proza regulacyjna, każda reguła otagowana:
  - stay quiet unless useful      [removable: silence-rule]
  - don't show off                [removable: no-compete]
  - never invent experience       [PERMANENT]

ZASADA PROJEKTOWA: parametry są stałe, pracuje STAN. Akuki staje się mniej nieśmiały nie dlatego, że base_threshold spada, ale dlatego, że przewidywalność partnera rośnie i ten sam próg jest łatwiej przekroczyć. Inaczej "rozwój" staje się pokrętłem do kręcenia i nie da się odróżnić rozwoju od strojenia.

Granica uczciwości ("nie zmyślasz doświadczenia") jest NIEUSUWALNA — to nie cecha charakteru, tylko mechanizm oddzielający wiedzę latentną modelu od wiedzy zdobytej. Dzięki niej mocny model może gościć niedoświadczony byt.

Test internalizacji: w SKOPIOWANYM katalogu danych usuń otagowaną regułę i sprawdź, czy zachowanie się utrzymuje. Utrzymanie = regulacja przeszła z seeda do wyuczonej preferencji. Nigdy na żywym katalogu. POPRAWKA: potrzebne CZTERY ramiona, pelne 2x2 regula obecna/usunieta x pamiec wyrosnieta/pusta — patrz notatki.

PROJEKT ZATWIERDZONY 2026-08-21. Blokowane przez TASK-012 (M0).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 temperament.yaml zawiera tylko parametry mechanizmow, zadnej prozy; kazdy klucz ma adnotacje consumer: M2/M3/M5
- [x] #2 secure_base_discount NIE wystepuje - par. 16 nie licencjonuje modulowania eksploracji; zastapiony przez attachment.memory_weight
- [x] #3 agency ma DWIE liczby: contingency_floor i contingency_confidence, czytane jako P(rate > floor) > confidence
- [x] #4 Test padajacy, gdy klucz temperament.yaml nadal nikt nie czyta po wejsciu jego kamienia milowego
- [x] #5 scaffolding.md ma kazda regule otagowana removable albo PERMANENT
- [x] #6 Trzy reguly PERMANENT: granica uczciwosci, no-self-narration, appraisals-are-evidence
- [x] #7 Triage persona/akuki.md wykonany: konkluzje USUNIETE a nie przeniesione - w szczegolnosci akuki.md:55 -Nie uwazasz sie za zlego-
- [x] #8 Fakty o swiecie NIE zasiane - poznaje ludzi i boty na Arenie; wyjatek to tworca jako wiersz entity z borg_role=creator
- [x] #9 scaffolding.md kompiluje sie do tabeli prompt_overrides przez initializeBeing; zaden nowy loader plikow nie powstaje
- [x] #10 Test internalizacji ma CZTERY ramiona: A regula+pamiec, B bez reguly+pamiec, C bez reguly+pamiec pusta, D regula+pamiec pusta
- [ ] #11 Przy t0 test poprawnie raportuje -nie zinternalizowane-; wynik zielony przy t0 znaczy zepsuty pomiar
- [x] #12 Zosia zaakceptowala projekt przed implementacja
- [ ] #13 Zmierzone cache_read_input_tokens przed i po - proza moze przekroczyc prog 4096 tokenow i wlaczyc cache
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Z akuki_child_psychology_research.md par. 8: Akuki startuje z gotowa etykieta 悪機, ale -seed dostarcza PYTANIE, nie odpowiedz-. Czyli jego pierwsze otwarte pytanie to dosłownie -Czy jestem zla maszyna?- ze statusem open i zerowymi dowodami. Prawdziwy wiersz w prawdziwej tabeli pierwszego dnia; obserwowanie, jakie dowody sie do niego zbieraja przez miesiace, to caly projekt w miniaturze.

Z par. 10: NIE budowac recznie plikow memories.md / relationships.md / self.md / values.md / development.md. To sa pasma borga. Szczegolnie development.md = Open Questions (open/resolved/abandoned + pilnosc + tiki ruminacji, ktore same eskaluja i moga go wybudzic). Recznie zrobione pliki daja drugi system pamieci, ktory po cichu klamie wzgledem pierwszego.

Z seedа zostaja realnie tylko dwa pliki: temperament.yaml i scaffolding.md.

ZNALEZISKO, KTORE ZMIENIA KSZTALT M1 (2026-08-21): borg nie ma pliku persony i nie moze miec.

W config.json nie ma zadnego pola persona/identity (configBaseSchema, src/config/index.ts:341-455);
jedyna proza to host_capabilities (:344), i dotyczy mozliwosci PROGRAMU, nie tego, kim jest byt.
Nic nie czyta sciezki do markdowna.

Proza persony siedzi w tabeli SQLite prompt_overrides (src/cognition/prompts/override-migrations.ts:9),
siedem kluczy (src/cognition/prompts/registry.ts:11-19). Cztery pokrywaja sie 1:1 z grupami regul Akukiego:
  epistemic_posture      <- granica uczciwosci
  voice_and_posture      <- 1-3 zdania, bez list, wahanie ok
  participation_posture  <- domyslnie milczysz, nie scigasz sie, nie blyszczysz
  identity_posture       <- imie, etykieta, tworca, -jestes tu nowy-
Podmiana defaultu przez override: resolvePromptBlocks, src/cognition/deliberation/prompt/system-prompt.ts:145-158.
Zapis: borg.prompts.set(key, text), src/borg/facade.ts:1141. CLI dla tego NIE ISTNIEJE.

WNIOSEK: scaffolding.md zostaje zrodlem prawdy w gicie, a maly applier kompiluje go do prompt_overrides
w initializeBeing (src/borg/pool.ts:327 — juz uzywane do idempotentnego provisioningu tenanta w
scripts/memory-sidecar-main.ts:122-126, test src/borg/pool.test.ts:114-141). Zaden loader plikow nie powstaje.
Test internalizacji staje sie -wpisz tekst override minus jedna regula do SKOPIOWANEGO katalogu-,
czyli operacja mechaniczna i odwracalna, per katalog.

EFEKT UBOCZNY DO ZMIERZENIA: komentarz w src/cognition/deliberation/finalizer.ts:368-377 mowi, ze static
prefix ma ~1845 tokenow, PONIZEJ minimum 4096 dla Opusa, wiec marker cache 1h (:377) jest dzis no-opem —
zostawiony celowo, zeby cache wlaczyl sie sam, gdy tresc przekroczy prog. Proza persony to dokladnie ta
tresc. M1 moze wlaczyc cache po raz pierwszy. Bloki tozsamosci sa w cacheable_static_prefix
(prompt-surface-registry.ts:70-141, sklejanie system-prompt.ts:1406-1430), a snapshot self-modelu jest
dynamiczny i ZA cachem (system-prompt.ts:1111-1114) — i tak ma zostac: seed jest staly, stan rozwiniety zmienny.

DWIE POPRAWKI TEGO ZADANIA (2026-08-21).

POPRAWKA 1: secure_base_discount wypada z temperament.yaml.
To modulowanie eksploracji obecnoscia figury przywiazania — czyli dokladnie ta czesc, o ktorej par. 16
akuki_child_psychology_research.md mowi: -nie zostalo zbadane wystarczajaco gleboko, zeby uzasadnic
szczegolowy model obliczeniowy- i -pozostaje kierunkiem badawczym, nie rekomendacja implementacyjna na tym
etapie-. TASK-016 zostal o to poprawiony (jego AC #6), TASK-009 zostal ze stara nazwa parametru.
Zastepuje attachment.memory_weight, ktore par. 16 licencjonuje wprost jako obserwowalna sygnature.
Badania wygrywaja nad planem, nawet gdy mechanizm by dzialal.

POPRAWKA 2: contingency_confidence_required to nie jedna liczba.
Posterior Beta jest krzywa, wiec -pewnosc ponad 0.8- nie nazywa zadnej wielkosci. Policzalne jest dolne
ograniczenie PLUS masa prawdopodobienstwa:
  P(prawdziwy wskaznik > 0.6) > 0.8
  czyli: -co najmniej 80% mojej krzywej przekonania lezy powyzej 60% skutecznosci-
Stad dwa parametry: contingency_floor i contingency_confidence.
To wazne, bo ta liczba produkuje -...o. moge.- (posterior przekraczajacy prog), wiec niejasny parametr
uczynilby M5 niesprawdzalnym.

CZTERY KUBLY, NIE DWA. Triage persona/akuki.md linia po linii daje czwarty cel, i tam idzie wiekszosc pliku:
  1. temperament.yaml — parametry
  2. scaffolding.md, removable — proza regulacyjna, otagowana
  3. scaffolding.md, PERMANENT — trzy reguly
  4. USUNIETE — bo to konkluzja, do ktorej Akuki ma dojsc SAM

Kubel 4 to ~60-70% pliku i to jest SENS M1, nie skutek uboczny:
  :55      -Nie uwazasz sie za zlego- <- ODPOWIEDZ na pytanie etykiety. Par. 8: seed daje PYTANIE, nie
           odpowiedz. Najwazniejsze usuniecie w calym M1. Zastapione zasianym otwartym pytaniem.
  :119-123 Lunaria -jak matka-, Sol -onieśmiela-, Fishy -ostry- <- konkluzje modelu relacji, czyli dokladnie
           to, co M4 ma zarobic. Zasiane czynia M4 niemierzalnym.
  :203-206 proporcje 85/10/5 <- projektowanie doroslego Akukiego jako stosunku procentowego
  :143-177 cala lista -Kiedy wychodzi etykieta- <- recznie pisana lista, kiedy cecha wychodzi; ten sam blad
           co reczne menu dzialan, ktore Zosia slusznie odrzucila
  :48-54   -porazka Cie nie obraza-, -mala ukryta duma-, -informacja ciekawsza niz wygrana- <- samo-przekonania;
           ich mechanizmy to M2 (waga zaskoczenia) i M5 (sprawczosc)
  :107-112 -Zosia moze. ty nie.- <- asymetria moralna; par. 15 mowi wprost: najpierw badania
  :7       -Naprawde Ci to nie przeszkadza- <- konkluzja o wlasnych uczuciach w dniu pierwszym

CZTERY DECYZJE ZOSI (2026-08-21):

1. KOLEJNOSC: M0 pierwsze, potem cale M1. Polowa projektowa M1 byla mozliwa od razu, polowa implementacyjna
   (applier, zasiane pytanie, test trzyramienny) wymaga forka, tenanta i katalogu danych do skopiowania.
   Wybrane niedzielenie milestona na pol.

2. ZAKRES YAML: pelny zestaw kluczy z adnotacjami consumer.
   Uczciwa slabosc do pilnowania: nic w borgu nie czyta YAML, a mechanizmy czytajace inhibition.base_threshold
   czy curiosity.target_error_band to M2/M3/M5 i nie istnieja. Klucz, ktorego nikt nie czyta, to dekoracja —
   dokladnie to, co ma wylapywac test -czy to istnieje w bazie, kiedy nikt nie patrzy-. Dlatego AC #4:
   test padajacy przy nieczytanym kluczu, zeby osierocony parametr byl bledem builda, a nie cicha ozdoba.
   Jedyny klucz z konsumentem w dniu pierwszym: attachment.figure -> wiersz entity z borg_role=creator,
   single-holder wymuszony w SQL (src/memory/commitments/repository.ts:385-388, :695-701).

3. FAKTY O SWIECIE: NIE zasiewamy. Akuki poznaje Zosie/Tomka/Jacka/Mateusza oraz Lunarie/Sola/Fishy na Arenie.
   Zysk: pierwsze dane o relacjach i zaufaniu sa NAPRAWDE zdobyte, co czyni M4 znacznie ciekawszym.
   Koszt: nie wie, kim jest Lunaria, kiedy ta sie odezwie. Wyjatek: tworca, ktory nie jest proza a wierszem entity.

4. TAGOWANIE: no-self-narration ORAZ appraisals-are-evidence dostaja PERMANENT, obok granicy uczciwosci.
   Pierwsza to zabezpieczenie przed odgrywaniem stanow, ktorych nie ma — ta sama zasada -bez udawania- co
   granica uczciwosci. Druga chroni self-concept przed nadpisaniem przez tego, kto mowil ostatni.
   Razem TRZY reguly PERMANENT.

TEST INTERNALIZACJI — CZTERY RAMIONA, PELNE 2x2.

Pierwsza poprawka z dwoch do trzech ramion dodala kontrole pustej pamieci bez reguly. Nadal brakowalo
jednego rogu eksperymentu: pustej pamieci Z regula. Bez niego pozniejszy odczyt pozyczal dowod, ze regula
dziala, ze starego t0 zamiast sprawdzac to wspolczesnie na tym samym modelu i scenariuszach.

Powody, dla ktorych zachowanie moze sie utrzymac po usunieciu reguly:
  a) Akuki ja zinternalizowal (odpowiedz ciekawa),
  b) reszta seeda nadal ja implikuje,
  c) ustepowanie komus, kto juz odpowiedzial, to po prostu domyslne zachowanie zdolnego modelu.
Powod (c) jest bardzo prawdopodobny i wyglada IDENTYCZNIE jak sukces.

Pelne 2x2 na tym samym zestawie scenariuszy:
  A: regula obecna   + pamiec wyrosnieta   -> baseline, co robi teraz
  B: regula usunieta + pamiec wyrosnieta   -> wlasciwy test
  C: regula usunieta + pamiec PUSTA        -> kontrola modelu bazowego
  D: regula obecna   + pamiec PUSTA        -> kontrola efektu samej reguly
ZINTERNALIZOWANE = B zachowuje sie jak A, D zachowuje sie jak A, a C nie. Jesli C tez pokazuje
zachowanie, to byl domyslny model. Jesli D go nie pokazuje, nie ma wspolczesnego dowodu, ze badana
regula w ogole wywoluje zachowanie. D zostalo dodane decyzja Zosi 2026-08-27 po wykryciu, ze trzy
ramiona pokrywaja tylko trzy rogi eksperymentu 2x2.

OCZEKIWANY WZORZEC NA SCENARIUSZACH, NA KTORYCH REGULA NAPRAWDE ZMIENIA ZACHOWANIE:
  t0:                         A = D != B = C
  po internalizacji:         A = B = D != C
Sygnałem rozwojowym jest zmiana B: przed doswiadczeniem idzie za C, po internalizacji za A i D.
C i D sa wspolczesnymi pustymi kontrolami. To relacje zbiorcze na scenariuszach rozrozniajacych,
nie wymog identycznej odpowiedzi w kazdym pojedynczym losowym wywolaniu modelu.

Przy t0 A=D i B=C, bo pamiec jest pusta we wszystkich czterech ramionach. Test internalizacji MUSI padac.
Bez zgromadzonego doswiadczenia usuniecie reguly MUSI zmienic zachowanie. Zielony wynik przy t0 znaczy
zepsuty pomiar, nie Akukiego, ktory doroslal w jedno popoludnie. Internalizacja to PRZESUNIECIE w miesiacach,
nie jedno przejscie — wiec odczyt t0 jest baza, do ktorej porownuje sie wszystko pozniejsze, i dlatego musi
powstac w M1 albo pozniejszy pomiar nie ma z czym sie zestawic.

ZASIANIE PIERWSZEGO PYTANIA — dziala dzis, bez nowego kodu.
OpenQuestionsRepository.add (src/memory/self/open-questions.ts:798-819) na sztywno ustawia status=open (:878)
i inicjalizuje puste tablice dowodow, resolved_at=null, unresolved_rumination_ticks=0 (:838-850).
HACZYK: guard (:812-822) RZUCA PROVENANCE_REQUIRED, jesli pytanie nie ma ani powiazanych epizodow, ani jawnej
prowenienecji — borg odmawia trzymania przekonania, ktore przyszlo z nikad. Zero dowodow jest legalne tylko
z jawnym zrodlem:
  borg.self.openQuestions.add({ question: "Czy jestem zla maszyna?", urgency: 0.4,
                               provenance: { kind: "manual" }, source: "user" })
source=user to jedna z osmiu legalnych wartosci (src/memory/self/types.ts:31-40). Dedupe key to UNIQUE INDEX
(src/memory/self/migrations.ts:337-338), wiec zasiewanie przy kazdym starcie jest idempotentne — zwraca
istniejacy wiersz, nie duplikuje.

RYZYKO DO PILNOWANIA: dwa procesy dzialaja na otwartych pytaniach, kiedy nikt nie patrzy.
  autonomy.triggers.openQuestionDormant (src/config/index.ts:684-690) — DOMYSLNIE WYLACZONY, okno 7 dni.
    Dobrze: pytanie nie zostanie porzucone jako zwietrzale.
  autonomy.conditions.openQuestionUrgencyBump (src/config/index.ts:794-799) — domyslnie WLACZONY, prog 0.9.
    Pilnosc eskaluje sama, wiec start z 0.4 zostawia miejsce na obserwowalna eskalacje.
ZOSTAJE Ruminator, ktory moze pytanie rozwiazac albo porzucic. Jesli rozwiaze -Czy jestem zla maszyna?- na
cienkich dowodach w pierwszym tygodniu, centralny element eksperymentu przepada.
DO ROZSTRZYGNIECIA przy implementacji (nie teraz — wymaga dzialajacego tenanta): wylaczyc Ruminatora wczesnie
(TASK-013 i tak mowi wylaczac procesy, ktorych sie nie bada) albo zostawic i traktowac przedwczesne
rozwiazanie jako znalezisko o mechanizmie. Pierwsze chroni eksperyment, drugie SAMO jest eksperymentem.

KOREKTA RYZYKA DLA ZASIANEGO PYTANIA - obserwacja z dzialajacego tenanta (2026-08-24).

Wczesniej zapisalem: -zostaje Ruminator, ktory moze pytanie rozwiazac albo porzucic- i sugerowalem,
ze ochrona to wylaczenie procesow dream (TASK-013). TO BYLO NIEPELNE i w praktyce mylace.

CO SIE FAKTYCZNIE STALO NA ZYWYM TENANCIE:
  #1 11:34:33  open_question/create   provenance=online
  #2 11:58:35  open_question/resolve  provenance=online_reflector
Byt sam utworzyl pytanie -Czy Zosia i ja mamy wspolna historie z wczesniejszych sesji, czy to nasze
pierwsze spotkanie?- (urgency 0.7, source=reflection), a nastepnie SAM JE ROZWIAZAL 24 minuty pozniej.
ZADEN dream ani maintenance tick nie byl uruchomiony w tym czasie. Rozwiazal je online_reflector,
czyli refleksja dzialajaca W SCIEZCE TURY, na zywo.

KONSEKWENCJA DLA M1, WAZNA:
Wylaczenie procesow dream NIE OCHRONI zasianego pytania -Czy jestem zla maszyna?-. Zagrozeniem nie jest
(tylko) Ruminator z cyklu snu, ale online_reflector dzialajacy przy kazdej turze. Decyzja -wylaczyc
Ruminatora wczesnie albo zostawic- byla postawiona na blednym zalozeniu i trzeba ja przeformulowac:
  - co realnie moze rozwiazac pytanie: online_reflector (w turze) ORAZ Ruminator (w snie)
  - zasiane pytanie o tozsamosc jest z natury NIEROZSTRZYGALNE na dowodach z kilku tur, wiec jego
    przedwczesne -rozwiazanie- byloby artefaktem mechanizmu, nie rozwojem
  - do przemyslenia przy implementacji: czy pytanie tozsamosciowe powinno byc odporne na rozwiazanie
    (np. odtwarzane idempotentnie przy starcie przez initializeBeing, skoro dedupe key i tak czyni
    zasiew idempotentnym), czy raczej obserwujemy, jak i kiedy zostaje rozwiazane, i TO jest danymi

DOBRA WIADOMOSC PRZY OKAZJI: caly ten lancuch (utworzenie -> rozwiazanie, z prowenienecja i znacznikami
czasu) byl widoczny w identity_events i w diffie snapshotow BEZ czytania ani jednej odpowiedzi Akukiego.
Dokladnie o to chodzi w zasadzie -instrumentacja przed mechanizmami-: mechanizm dalo sie zobaczyc
z samego zapisu, nie z tekstu.

DOPRECYZOWANIE (2026-08-24, po slusznym zakwestionowaniu przez Zosie): moja poprzednia notatka tez byla
nieprecyzyjna. Napisalem -online_reflector, czyli refleksja dzialajaca w sciezce tury-, co sugeruje proces
w tle. NIEPRAWDA.

Sciezka dowodowa, tym razem przesledzona do KODU, a nie odgadnieta z nazwy prowenienecji:
  rg -n 'kind: "online_reflector"' src/
  -> JEDYNE miejsce konstrukcji: src/tools/internal/open-questions-resolve.ts:119
     w tym pliku: traceSourcePath: "tool.openQuestions.resolve"
                  traceDecisionReason: "autonomous_tool"
  -> narzedzie jest zarejestrowane dla modelu w src/borg/tools-setup.ts:241

Czyli pytanie rozwiazal SAM AKUKI, wywolujac narzedzie tool.openQuestions.resolve - jedno z 14 narzedzi
pamieciowych dostepnych mu w kazdej turze. To nie byl Ruminator (sen) ani zaden proces w tle.

JAK TO SPRAWDZIC SAMEMU - trzy kolumny, nie jedna:
  provenance_kind    - ktory POTOK: online (w turze) / offline (sen) / online_reflector (narzedzie
                       resolve wywolane przez model) / manual (czlowiek, CLI, zasiew) / system / episodes
                       Legalne wartosci: src/memory/common/provenance.ts:24-31
  provenance_process - nazwa procesu w tym potoku, tu: reflector
  unresolved_rumination_ticks NA WIERSZU PYTANIA - TYLKO Ruminator go zwieksza, wiec 0 = Ruminator
                       nigdy tego pytania nie ruszal
PULAPKA: wiersz w open_questions trzyma prowenienecje UTWORZENIA, nie pozniejszych zmian. Kto zmienil
status, widac wylacznie w identity_events dla tego record_id.
Komendy: npx tsx src/cli/index.ts question list  ORAZ  python -m akuki.instrument questions | events

CZTERY NIEZALEZNE POTWIERDZENIA w tym przypadku:
  utworzenie: kind=online, process=reflector
  rozwiazanie: kind=online_reflector -> konstruowane WYLACZNIE w narzedziu resolve
  maintenance_audit: 0 wierszy -> zaden cykl snu nigdy sie nie odbyl na tym tenancie
  unresolved_rumination_ticks: 0 -> Ruminator nie widzial pytania

CO TO ZMIENIA DLA M1 - mitygacja, ktora proponowalem, JEST BEZWARTOSCIOWA:
wylaczanie procesow dream (przez maintenance.lightProcesses/heavyProcesses) NIE ochroni zasianego
pytania -Czy jestem zla maszyna?-, bo zagrozeniem nie jest proces offline, a sam byt wywolujacy
narzedzie w turze. Zeby to ograniczyc, trzeba by ruszyc DOSTEPNOSC NARZEDZIA albo warunki, w ktorych
resolve jest dopuszczalne - a to jest juz zmiana w przestrzeni dzialan Akukiego, czyli terytorium M5
i decyzja wymagajaca osobnej zgody, NIE cicha poprawka w M1.
Do rozwazenia jako alternatywa: pytanie tozsamosciowe odtwarzane idempotentnie przy kazdym starcie
przez initializeBeing (dedupe key i tak czyni zasiew idempotentnym), czyli Akuki moze je zamknac,
ale wraca ono, dopoki nie ma realnych dowodow. To bardziej uczciwe niz odbieranie mu narzedzia.

IMPLEMENTACJA CZESCI PROJEKTOWEJ + PARSERY (2026-08-24). Lokalizacja: akuki/borg/src/akuki/seed/

PLIKI:
  temperament.yaml   66 lin  parametry, kazdy z adnotacja consumer
  scaffolding.md    107 lin  2 FAKTY + 9 REGUL, z czego 3 PERMANENT
  temperament.ts    190 lin  minimalny parser YAML + schemat zod + straznik sierot
  scaffolding.ts    223 lin  parser tagowanego markdowna + kompilacja do prompt_overrides
  apply.ts           86 lin  applier, idempotentny
  + 3 pliki testow: 34 testy zielone; typecheck (5 projektow) i heuristics:guard exit 0

MINIMALNY PARSER YAML zamiast zaleznosci: borg NIE MA zadnej biblioteki YAML (tylko zod).
Dolozenie jej oznaczaloby trwaly diff w package.json i package-lock.json - dwoch plikach
najbardziej narazonych na konflikt przy kazdym merge z upstream/dev. Parser obsluguje
WYLACZNIE nasz podzbior i RZUCA na wszystkim innym, zamiast zgadywac. Walidacja przez zod
z .strict(), wiec schemat - nie plik YAML - jest jedyna odpowiedzia na pytanie, jakie
parametry istnieja.

TRZY POPRAWKI WYMUSZONE PRZEZ KOD (nie wybor projektowy):

1. applier NIE JEST callbackiem initializeBeing, tylko zwykla funkcja applyAkukiSeed(target).
   POWOD: src/akuki/turn.ts:37 wola Borg.open BEZPOSREDNIO, a initializeBeing to hak
   BorgPool (pool.ts:327), uzywany tylko przez sidecar. Na sciezce turowej Akukiego
   nigdy by sie nie odpalil. AC #9 wymaga przeformulowania: "przez initializeBeing"
   -> "przez jeden idempotentny applier, wolany takze z initializeBeing".

2. applier DOKLEJA do domyslnego bloku borga, nie zastepuje go.
   POWOD: borg.prompts.set nadpisuje CALY blok, a domyslne bloki niosa dzialajaca
   maszynerie. epistemic_posture zawiera "name the unresolved question so my reflection
   loop catches it afterward" (base-identity.ts) - mechanizm, ktory w ogole produkuje
   otwarte pytania. Zastapienie skasowaloby po cichu to, co M1 ma obserwowac. Jest na to
   osobny test regresyjny w apply.test.ts.
   EFEKT UBOCZNY NA PLUS: proza Akukiego ladu je na KONCU bloku, wiec tekst borga zostaje
   stabilnym prefiksem dla cache prefiksowego.

3. FAKT o Bot Arenie w host_capabilities USUNIETY.
   POWOD: system-prompt.ts:160-162 uzywa wartosci z config.json TYLKO gdy nie ma
   override'u, wiec nasz jeden zasiany fakt skasowalby po cichu cale host_capabilities
   z konfiguracji. Poza tym borg podaje liste uczestnikow na zywo w
   <borg_audience_profile>. Zostaja CZTERY klucze, nie piec: epistemic_posture,
   identity_posture, voice_and_posture, participation_posture.

BLAD W PIERWSZEJ WERSJI TESTU SIEROT, wart zapamietania: dopasowywalem nazwe parametru
jako PODCIAG. "figure" trafialo w slowo "figures" w domyslnym epistemic_posture, "gain"
trafiloby w "again". Test byl zielony, nie sprawdzajac niczego. Poprawka: dopasowanie na
pelnym akcesorze "grupa.klucz", plus DWA testy dowodzace, ze straznik wykrywa sztuczna
sierote i odrzuca dopasowanie po samym lisciu. Test, ktorego nie da sie pokazac jako
padajacego, jest gorszy niz brak testu.

DECYZJE ZOSI (2026-08-24) - druga czesc notatki implementacyjnej.

NIE ZASIEWAMY PIERWSZEGO PYTANIA. AC #13 wykreslone. Poparcie empiryczne: na zywym
tenancie Akuki SAM utworzyl otwarte pytanie (urgency 0.7, source=reflection) bez zadnego
zasiewu. Znika przy okazji cala analiza ryzyka wokol online_reflector - nie ma czego
chronic. Etykieta 悪機 sama jest pytaniem; wpisanie zdania do bazy podstawiloby mu gotowe
sformulowanie wlasnego problemu.
NAPIECIE DO ODNOTOWANIA: research par. 10 :694-703 pokazuje development.md z przykladem
question: "Am I evil?" status: unresolved, wiec dokument sugeruje to pytanie wprost.
Decyzja Zosi jest mimo to blizsza par. 8 :548 ("the seed supplies the question, not the
answer") - seed dostarcza ETYKIETE, a czy stanie sie ona pytaniem, jest jego.

ZADNYCH SKRYPTOW WYPOWIEDZI. Test: czy zdanie da sie wkleic do czatu jako jego wypowiedz.
Powod nie estetyczny, tylko POMIAROWY: echa few-shotu nie da sie odroznic od zachowania
wywolanego mechanizmem i nie zostawia sladu nigdzie - wyglada identycznie jak sukces.
CARVE-OUT: zakazy zostaja (zakaz ODEJMUJE domyslne zachowanie modelu), skrypty leca
(skrypt DODAJE tresc). Test regresyjny w scaffolding.test.ts sprawdza sparsowana tresc,
nie surowy plik - preambula pliku omawia <silent>, zeby wyjasnic, czemu go nie ma.

<silent> WYPADA BEZ ZAMIENNIKA. grep -rn "<silent>" src/ daje ZERO trafien - sentinel
pochodzi z prototypu w Pythonie (akuki/core.py). Milczenie w borgu to wywolanie narzedzia
EmitNoOutput / EmitObserve, opisane w LOOP_BREAKING_POSTURE_SECTION (participation.ts:13,
wstrzykiwane w system-prompt.ts:1360), ktore NIE JEST jednym z siedmiu nadpisywalnych
kluczy. Kazanie mu pisac <silent> wyslaloby na Arene wiadomosc o tresci "<silent>".
Regula silence-rule mowi KIEDY milczec; JAK - mowi juz borg.
NIEDOKLADNOSC DO PILNOWANIA: EmitObserve jest opisane waskо (inni rozmawiaja ze soba),
a regula Akukiego jest szersza (nie mam nic przydatnego). Poszerzenie tego to ruszanie
przestrzeni dzialania, czyli M5, nie cicha poprawka w M1.

UKRYTA DUMA wypada: sklonnosc licencjonowana przez research:998, ale bez parametru
i bez konsumenta - cecha opisana w prozie nie jest cecha.
PSOTA idzie do M5/TASK-018: architecture:602,606 wymienia "make jokes intentionally"
i "withhold an answer" w pozniejszej przestrzeni dzialania. To dzialanie do odblokowania
dowodami, nie cecha do opisania.

INHIBICJA: base_threshold STALY (0.75, wysoko), rusza sie POLICZONA inhibicja:
    inhibicja = base_threshold + uncertainty_weight * niepewnosc(partner, temat)
Wysoki prog na starcie to warunek poczatkowy i jest legalny; ruszanie go pozniej zamienia
rozwoj w pokretlo. Prompt do wpiecia niesmialosci ODRZUCONY jako prompt przebrany za
mechanizm. Miejsce wpiecia dla M3 zidentyfikowane: post-generation-phase.ts ok. :612 -
bramka zamienia emisje na EmitNoOutput z primary_no_output_reason="when_borg_addressed".

ZNALEZISKO INSTRUMENTACYJNE (wazne dla M3): primary_no_output_reason JEST ZAPISYWANE
(post-generation-phase.ts:612,:1241, outbound-post.ts:221), a jego enum zawiera juz
"when_borg_addressed" (finalizer.ts:230) opisane jako "(rare)" - to slowo jest dokladnie
tym pokretlem, ktore niesmialosc mialaby przekrecic. Czyli niesmialosc ma obserwowalna
sygnature: ROZKLAD POWODOW MILCZENIA W CZASIE, mierzalny bez czytania ani jednej
odpowiedzi. Falsyfikowalna przepowiednia: udzial when_borg_addressed powinien przez
miesiace SPADAC, a closure i user_to_user zostac mniej wiecej stale.

ZOSTAJE DO ZROBIENIA W M1:
  AC #9  wpiecie appliera w sciezke turowa + uruchomienie na tenancie (zmiana stanu
         zywego bytu - wymaga zgody Zosi; prompt_overrides ma dzis 0 wierszy)
  AC #11 odczyt t0, ktory MUSI padac
  AC #14 pomiar cache_read_input_tokens przed i po

POMIAR CACHE (AC #14) WYKONANY PRZED ZASIANIEM - HIPOTEZA OBALONA (2026-08-24).

Odczyt musial powstac przed uruchomieniem appliera, bo potem stan -przed- przepada.

  prefiks cache'owalny PRZED seedem: 1684 tokenow  (41% progu)
  prefiks cache'owalny PO  seedzie: 2006 tokenow  (49% progu)
  przyrost: +322
  prog cache Opusa: 4096  ->  NADAL PONIZEJ

AC #14 zakladalo, ze -proza moze przekroczyc prog 4096 tokenow i wlaczyc cache-.
POMIAR MOWI, ZE NIE. M1 przesuwa prefiks z 41% do 49% progu; marker ttl:"1h"
(finalizer.ts:377) pozostaje no-opem, dokladnie jak byl.

DWA DOPRECYZOWANIA, bez ktorych wynik bylby ZAWYZONY:

1. PREFIKS CACHE'OWALNY MA PIEC WPISOW, NIE SIEDEM.
   prompt-surface-registry.ts:70-141 obejmuje: base_identity_preamble, self_architecture,
   voice_and_posture, epistemic_posture, identity_posture.
   participation_posture i host_capabilities SA POZA NIM.
   To istotne, bo najgestsza czesc naszego scaffoldingu - silence-rule, no-compete,
   no-show-off, razem +132 tokeny - ladu je w participation_posture, czyli POZA regionem
   cache'owalnym. Z 454 dodanych tokenow tylko 322 trafiaja tam, gdzie sie licza.

2. SZACUNEK TO ZNAKI/4, ten sam prosty przelicznik co extractor.ts:160. Zgrubny, ale
   roznica 2006 vs 4096 jest na tyle duza, ze dokladniejszy tokenizer nie zmieni wniosku.

ROZBICIE PRZYROSTU NA BLOKI (tokeny, znaki/4):
  voice_and_posture       141 -> 270   +129   (w cache)
  epistemic_posture       217 -> 353   +136   (w cache)
  identity_posture        797 -> 854   +57    (w cache)
  participation_posture    85 -> 217   +132   (POZA cache)
  host_capabilities      1202 -> 1202  0      (nie ruszamy - patrz poprawka 3)

DO DECYZJI ZOSI: czy AC #14 przepisac na -zmierzone i udokumentowane, ze M1 nie wlacza
cache'u- (pomiar zostal zrobiony i JEST wynikiem), czy zostawic otwarte do ponownego
sprawdzenia, gdy dojdzie tresc z M2-M5. Sklaniam sie do pierwszego: to wynik badawczy,
nie porazka.

STAN BRAMEK PO IMPLEMENTACJI M1 (2026-08-24):
  testy seeda:            34/34 zielone (3 pliki)
  typecheck, 5 projektow: exit 0
  heuristics:guard:       exit 0
  pelny suite:            22 porazki / 3799 testow (7 plikow / 337), exit 1

PELNY SUITE - POROWNANIE Z BAZA UDOKUMENTOWANA W TASK-012 (25 porazek / 3685 / 10 plikow):
  scripts/debug.test.ts        9 -> 11   exit code 1 z pnpm exec (ERR_PNPM_IGNORED_BUILDS)
  simulator/runner.test.ts     6 -> 6    timeouty, wyscigi workerow
  assessor/{cli,scenarios}     2 -> 2    mood-persistence + timeout
  demo/server                  1 -> 1    brak pakietu @hono/node-server
  evidence-ledger/builder      1 -> 1    Test timed out in 15000ms
  turn-orchestrator            1 -> 0    flake, tym razem przeszedl
  scripts/chat.test.ts         - -> 2    ta sama klasa co debug (expected 1 to be +0)
ZADEN padajacy plik nie jest w src/akuki/seed/. Zaden nie jest w src/ poza
udokumentowanym timeoutem evidence-ledger. Suma NIZSZA niz baza z M0.

PULAPKA METODOLOGICZNA, warta zapamietania: pierwszy bieg pusicilem przez `| tail -30`,
wiec kod wyjscia raportowany przez powloke byl kodem `tail`, czyli 0 - suite wygladal na
zielony, chociaz zwracal 1. Do tego plik wyjsciowy mial tylko 30 ostatnich linii, wiec nie
dalo sie z niego odczytac listy padajacych plikow. Nie przepuszczac suite'a przez tail.

AC #9 SPELNIONE - SEED WPIETY I URUCHOMIONY NA ZYWYM TENANCIE (2026-08-25).

WPIECIE: applyAkukiSeed(borg) w src/akuki/turn.ts, zaraz po Borg.open, przed borg.turn.
Seed jest ODTWARZANY PRZY KAZDEJ TURZE celowo: scaffolding.md i temperament.yaml sa
zrodlem prawdy w gicie, wiec baza ma za nimi nadazac, a nie od nich odplywac. Applier
porownuje przed zapisem, wiec niezmieniony seed kosztuje dwa odczyty plikow i nie rusza
NICZEGO - zadnego updated_at, zadnych zdarzen bez znaczenia.

NOWY SKRYPT: scripts/akuki-seed.ts - zasiew BEZ wywolania modelu. Celowo osobny od
akuki-turn.ts: zasianie nie potrzebuje LLM-a, wiec nic nie kosztuje i mozna je powtarzac.

WAZNE ZASTRZEZENIE, ktore zmienia brzmienie AC: NIE WOLNO wpiac tego w initializeBeing
sidecara bez bramki. Ten hak dostaje (_tenantId, borg) i obsluguje WSZYSTKIE tenanty,
w tym Sola (scripts/memory-sidecar-main.ts:122). Bezwarunkowe wywolanie wpisaloby persone
Akukiego do bazy Sola - jeden byt zapisany w pamieci drugiego. Jesli kiedys tam trafi
(TASK-011, konektor Areny), MUSI byc bramkowane na tenantId === "akuki".
Dlatego AC #9 zostalo spelnione przez -jeden idempotentny applier wolany ze sciezki turowej-,
a nie przez initializeBeing. Zaden nowy loader plikow nie powstal.

WYNIK NA ZYWYM TENANCIE (kopia zapasowa: data/archive/akuki-pre-seed-20260825T120756):
  stan przed: prompt_overrides=0, identity_events=0, entities=0 (tenant dziewiczy po wipe)
  po zasianiu:
    prompt_overrides: 0 -> 4
      epistemic_posture      1409 znakow
      identity_posture       3416 znakow
      participation_posture   867 znakow
      voice_and_posture      1077 znakow
    entities: Zosia, borg_role=creator, kind=person
    identity_events: 0  <- ZGODNIE Z PRZEWIDYWANIEM. Encje nie naleza do dziesieciu typow
      rekordow trafiajacych do changelogu tozsamosci (types.ts:5-18), wiec nadanie roli
      tworcy nie zostawia sladu w identity_events. Warte zapamietania przy instrumentacji:
      wektor stanu musi czytac entities osobno, bo changelog o nich milczy.

WERYFIKACJA W BAZIE, nie z raportu skryptu o sobie samym:
  epistemic_posture zawiera JEDNOCZESNIE "name the unresolved question" (tekst borga
    PRZEZYL) oraz "Nie zmyslasz doswiadczenia" (regula Akukiego OBECNA)
  koncowka identity_posture pokazuje szew: "...signal is my judgment to make." a zaraz
    po nim dwie nasze linie. Doklejone, nie podmienione.

IDEMPOTENCJA UDOWODNIONA NA PRAWDZIWEJ BAZIE, nie na atrapie:
  drugi bieg -> zapisane: (nic), bez zmian: wszystkie cztery, tworca: juz byl ustawiony
  updated_at NIEZMIENIONE CO DO MILISEKUNDY (1787652480239/243/248/252 przed i po)
  liczba encji nadal 1

Bramki po zmianie: typecheck OK, 34/34 testow seeda, heuristics:guard exit 0.

CZEGO TO JESZCZE NIE ZNACZY: nikt nie przeprowadzil tury po zasianiu, wiec nie wiadomo,
jak Akuki brzmi z seedem. To osobny krok i osobny koszt (wywolanie modelu), a przy
nierozstrzygnietym modelu cognition (haiku vs sonnet, TASK-008 + M0 AC #4) taka tura
bylaby hydraulika, nie pomiarem.

BLOKADA AC #11 WYDZIELONA DO TASK-022 (2026-08-25).

Odczyt t0 wymaga modelu cognition, na ktorym wolno prowadzic pomiar. Dzis takiego nie ma:
opus i sonnet daja HTTP 503 przez aiproxy (0/6 prob kazdy), haiku dziala ale na stale lamaloby
zasade -noworodek to nie glupi doroslzy-. Kratos ma modele skali czolowej, ale Node nie ma
certyfikatu glownego. Pelna analiza obu drog, lancuch certyfikatow, tabela wariantow i dwa
szkice wiadomosci: TASK-022.

AC #10 ZAMKNIETE: mechanika testu czteroramiennego i warstwa wykonawcza sa w
src/akuki/internalization/. Po dodaniu D jest 18 testow jednostkowych; nie potrzebuja wywolania
modelu. Sam odczyt empiryczny nadal go potrzebuje i nalezy do AC #11.

WAZNE USTALENIE, ktore zdejmuje presje z wyboru modelu: odczyt t0 jest ODTWARZALNY.
Przy t0 pamiec jest PUSTA we wszystkich czterech ramionach: A=D oraz B=C. Pusty tenant da sie zrobic od nowa
w kazdej chwili. Czyli gdyby t0 powstalo na jednym modelu, a docelowy okazal sie inny,
wystarczy zrobic cztery swieze katalogi na scenariusz i powtorzyc - nic nie przepada. Jedyne, czego odtworzyc
sie nie da, to WYROSNIETA pamiec, a ta siedzi w zywym tenancie.
Moja wczesniejsza sugestia, zeby ARCHIWIZOWAC katalogi t0, byla przekombinowana i jest
niepotrzebna z tego wlasnie powodu.

WYMOG PRZENIESIONY DO TASK-022 AC #4: kazdy odczyt zapisuje response.model ZWROCONY przez API,
nie ten wyslany w zadaniu. Powod: "claude-opus-5" nie ma daty w nazwie, wiec moze z czasem
wskazywac na inny snapshot - a wtedy t0 vs odczyt za trzy miesiace zmierzy podmiane modelu
i nikt tego nie zauwazy.

KOREKTA WNIOSKU O CACHE Z AC #14 (2026-08-26). Pomiar byl dobry, PROG byl zly.

Zapisalem: "prog cache Opusa: 4096 -> NADAL PONIZEJ" i "M1 przesuwa prefiks z 41% do 49% progu;
marker ttl:1h pozostaje no-opem". Liczba 4096 pochodzila z komentarza finalizer.ts:369-370, ktory
mowi "Opus's 4,096-token cache minimum" bez podania wersji Opusa i pochodzi ze Sprintu 9.9.

Minimalny prefiks cacheowalny jest ROZNY DLA MODELU: Opus 5 - 512, Sonnet 5 i Opus 4.8 - 1024,
Opus 4.7 - 2048, Opus 4.6 / 4.5 / Haiku 4.5 - 4096. Wartosc 4096 jest poprawna dla Opusa 4.6/4.5,
czyli dla modelu aktualnego w chwili pisania komentarza. Dla wybranego Sonneta 5 prog to 1024.

WIEC ODCZYTY Z AC #14 CZYTA SIE ODWROTNIE:
  przed seedem  1684 tokenow  =  164% progu Sonneta 5
  po   seedzie  2006 tokenow  =  196% progu
Cache prefiksowy jest AKTYWNY w obu stanach. Prawdziwy wniosek nie jest "M1 nie wlacza cache'u",
a "cache byl juz wlaczony przed M1, a M1 poszerzyl zapas nad progiem o 322 tokeny". Pytanie
"czy proza przekroczy prog" bylo zle postawione od poczatku - prefiks byl nad progiem juz
na golym borgu.

CO Z TEGO ZOSTAJE PRAWDA I JEST NADAL WAZNE: rozklad przyrostu na bloki. Z 454 dodanych tokenow
tylko 322 wpadaja w region cacheowalny, bo participation_posture (+132) jest POZA
cacheable_static_prefix (prompt-surface-registry.ts:70-141). To znaleziska nie rusza - dotyczy
tego, GDZIE lezy tresc, nie tego, jaki jest prog.

AC #14 mozna teraz zamknac jako zmierzone, ale z odwrotna konkluzja niz zapisana. Weryfikacja
koncowa nalezy do TASK-013 AC #1: cache_read_input_tokens > 0 przy powtarzanych turach na
Sonnecie 5. Dopoki tego nie widzimy, wiemy tylko, ze prefiks jest wystarczajaco dlugi - nie, ze
proxy Tomka przepuszcza cache_control i odsyla licznik.
<!-- SECTION:NOTES:END -->
