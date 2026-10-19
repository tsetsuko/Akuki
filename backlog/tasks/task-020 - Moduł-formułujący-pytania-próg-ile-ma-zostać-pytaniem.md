---
id: TASK-020
title: Moduł formułujący pytania + próg (ile ma zostać pytaniem)
status: To Do
assignee: []
created_date: '2026-08-21 12:26'
updated_date: '2026-10-19 17:05'
labels:
  - M2
  - akuki
dependencies: []
ordinal: 3500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pomysł Zosi: moduł, który odpala się na określone zdarzenia i formułuje pytania, plus próg — nie wszystko ma stawać się otwartym pytaniem.

### Stan na 2026-10-19 — co się zmieniło od założenia

Przy zakładaniu (2026-08-21) główny wyzwalacz, czyli błąd przewidywania, był niemożliwy, bo nie było pętli przewidywania. M2 od tego czasu działa: Akuki zapisuje oczekiwania i rozlicza je z błędem. Blokada kolejności zniknęła.

Zmienił się też ciężar zadania. Dziś nie brakuje pytań — jest ich za dużo, a część jest fałszywa. Pomiar z dziennika (kandydaci 2026-10-15 – 2026-10-19) i snapshotu z 2026-10-19:

- w cztery dni powstały 63 nowe otwarte pytania (reflection 38, wykrywanie sprzeczności 22, associator 2, overseer 1);
- łącznie 277 pytań: otwartych 182, rozwiązanych 43, porzuconych 52;
- źródła wszystkich 277: reflection 173, contradiction 51, associator 31, overseer 21, autonomy 1. Etykieta mówi, który proces napisał pytanie, i nie ma wśród nich takiego, który odpalałby się na zaskoczenie;
- przy wielu pytaniach ze sprzeczności Akuki sam podejrzewa, że sprzeczność jest pozorna, np. „czy krawędź «contradicts» powstała tylko ze wspólnego słowa «dieta»”, albo że dwa zdania opisują różne poziomy tego samego zjawiska;
- 2026-10-19 powstało pytanie, które przypisuje Zosi słowa Lunarii („Zosia zapowiedziała, że sprząta stół”). Pamięć semantyczna ma tę wypowiedź poprawnie przy Lunarii, więc błąd powstał przy formułowaniu pytania. Przyczyna przypisania należy do TASK-033; tutaj liczy się to, że pytanie powstaje bez sprawdzenia, czy jego przesłanka zgadza się z pamięcią.

Zaskoczenie wpływa na pytania tylko pośrednio, dwiema drogami:
- rozliczone przewidywanie z błędem w paśmie 0,3–0,7 podnosi istotność epizodu, z którego wyrosło (`borg/src/cognition/predictions/surprise-significance.ts`). Istotność czyta m.in. associator przy wyborze epizodów (`borg/src/offline/associator/index.ts:339`), więc pytanie z etykietą „associator” mogło mieć zaskoczenie u źródła. Reflector, z którego jest większość pytań, istotności nie czyta;
- warunek wybudzenia `prediction_error_spike` (próg 0,6) budzi Akukiego do przemyślenia dużego zaskoczenia; pytanie z takiej tury dostałoby etykietę „autonomy”. Warunek jest domyślnie wyłączony (decyzja D3 przy M2, „do czasu obserwacji”) i w repozytorium nic go nie włącza. Konfiguracji na VPS nie sprawdzano.

Wniosek: zadanie to teraz dwie rzeczy. (1) Rozstrzygnąć, czy bezpośrednie źródło pytań z zaskoczenia jest w ogóle potrzebne (niżej, wątpliwość z 2026-10-19). (2) Próg dla źródeł, które już są, bo bez niego pytania przestają być rzadkie (§12: „meaningful development should be relatively sparse”), a ruminator spędza czas na sprzecznościach, których nie ma.

### Co borg już ma — nie wymyślamy modułowości

- Ruminator: konsumuje otwarte pytania, może rozwiązać, podbić pilność, porzucić zwietrzałą niepewność, scalić duplikaty, wystawić znacznik wzrostu. Gdy nie rozstrzyga, zapisuje prywatną notatkę, żeby następna wizyta kontynuowała.
- Reflector: znajduje wzorce między epizodami, ale nie zapisuje ich jako przekonań — każdy wniosek idzie jako kandydat do przeglądu. To jest już jakiś próg, ale skalibrowany pod bezpieczeństwo utrzymania, nie pod psychologię rozwojową.
- Źródła pytań: reflection, wykrywanie sprzeczności, review hooks, rumination, overseer, associator, wejście użytkownika.
- Warstwa autonomii: conditions to progi na stanie (wzór: conditions/mood-valence-drop.ts), triggers to czas.

### Próg ma konkretny wynik za sobą

Kidd, Piantadosi & Aslin (2012), efekt Goldilocks: niemowlęta odwracają wzrok od zdarzeń zbyt przewidywalnych oraz zbyt nieprzewidywalnych; uwaga jest najwyższa przy zaskoczeniu pośrednim. To podstawa empiryczna dla target_error_band [0.3, 0.7]. Reguła: pytanie powstaje, gdy zaskoczenie jest pośrednie i redukowalne, nie gdy jest duże. Duże, ale nieredukowalne to szum, a gonienie za szumem to nie ciekawość.

Dla źródeł nieopartych na zaskoczeniu (zwłaszcza sprzeczności) analogia jest słabsza i trzeba ją oddzielić: badania mówią o uwadze wobec zaskoczenia, nie o tym, ile sprzeczności w wiedzy warto zamieniać na pytania. Próg dla sprzeczności to wybór twórczy, dopóki nie znajdzie się dla niego oparcie.

### Ostrzeżenie o modułowości

Modułowość w kognitywistyce jest sporna. Fodor (wiele wrodzonych, zamkniętych modułów) jest mocno krytykowany. Core knowledge (Spelke, Carey) uzasadnia tylko małą liczbę wrodzonych systemów: obiekty, agenci, liczba, przestrzeń. Neurokonstruktywizm (Karmiloff-Smith): moduły wyłaniają się w rozwoju. Ręcznie zaprojektowane dziesięć modułów to zaprojektowany dorosły Akuki. Mało modułów, każdy uziemiony w czymś, z czym niemowlęta faktycznie startują.

### Granica „bez udawania”

- Udawanie: zapytać model „jakie pytanie powinieneś mieć?”. Prompt przebrany za mechanizm.
- Mechanizm: wyzwalacz liczony ze stanu (czy zaskoczenie jest w paśmie redukowalnym? czy dotyczy kogoś ważnego? czy przeczy przekonaniu, które już ma — i czy ta sprzeczność istnieje w pamięci, a nie tylko w słowach?). Dopiero po otwarciu bramki model formułuje pytanie słowami.

Wymaga zgody. Zadanie projektowe, przechodzi przez bramkę sześciu kroków.

### Wątpliwość z 2026-10-19 — czy pytania z zaskoczenia są potrzebne

Zosia: skoro refleksja produkuje dużo pytań, a zaskoczenie już pracuje na wagę wspomnień, osobne źródło pytań z zaskoczenia może być zbędne. Nie jest też jasne, co dałoby wybudzenie, skoro jest refleksja.

Co za tym przemawia: problemem jest dziś nadmiar pytań, nie ich brak; przewidywalność partnera (M3) aktualizuje się przy rozliczeniu bez żadnego namysłu, więc wiedza z zaskoczenia nie czeka na pytanie; każde wybudzenie to pełna tura modelu i kolejna okazja do pytań.

Niespójność do zapamiętania: wybudzenie ma próg 0,6, a pasmo z temperamentu kończy się na 0,7. Wybudzałoby więc także przy błędach powyżej 0,7, które według efektu Goldilocks są szumem, a nie materiałem do ciekawości.

Co mogłoby to zmienić, do sprawdzenia przed decyzją: jaka część pytań z refleksji dotyczy epizodów, przy których Akuki się pomylił. Jeśli duża — zaskoczenie już dociera do pytań i osobne źródło jest zbędne. Jeśli mała — refleksja pyta o co innego niż to, czego nie umie przewidzieć, i wtedy brak jest realny.

Pomiar 2026-10-19 (żywa pamięć, VPS, tylko do odczytu). Wspomnienie liczy się jako zaskakujące, gdy przewidywanie, które z niego wyrosło (wspólny identyfikator strumienia), zostało rozliczone z błędem 0,3 lub wyższym. Pula: 373 wspomnienia od startu M2 (2026-09-08).

- 54% z 1281 rozliczeń leży w paśmie 0,3–0,7; 71% wspomnień (264 z 373) ma co najmniej jedno takie rozliczenie; mediana średniego błędu wspomnienia 0,343.
- Refleksja: średni błąd wspomnień, o które pyta, 0,330 wobec 0,338 w puli; z najbardziej zaskakującej ćwiartki (błąd ≥ 0,45) 34% wobec 25% losowo.
- Associator: 0,357; 39% z górnej ćwiartki — lekka preferencja, zgodna z tym, że czyta istotność podbijaną zaskoczeniem.
- Overseer: 0,292; 24%.
- Istotności statystycznej nie liczono; te same wspomnienia powtarzają się w wielu pytaniach, więc próbki nie są niezależne.

Wniosek: pomiar nie rozstrzyga pytania tak, jak było postawione, bo zaskoczenie w paśmie jest stanem typowym, nie wyjątkiem. Wzmacnia natomiast wątpliwość Zosi z innej strony: źródło pytań odpalane zaskoczeniem w paśmie odpalałoby się w większości tur i pogłębiło nadmiar pytań. Bezpośrednie źródło pytań z zaskoczenia — nie budować, dopóki zaskoczenie nie zacznie wyróżniać wspomnień (TASK-052). Wybudzenie zostaje wyłączone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Potwierdzone, ktore zrodla pytan borg juz ma, a ktorych brakuje
- [ ] #2 Prog oparty na zaskoczeniu POSREDNIM i REDUKOWALNYM, nie na wielkosci
- [ ] #3 Wyzwalacz liczony ze stanu; model tylko formuluje slowa
- [ ] #4 Liczba modulow mala i uziemiona, nie recznie zaprojektowany zestaw
- [ ] #5 Zosia zaakceptowala projekt przed implementacja
- [ ] #6 Prog dla istniejacych zrodel (zwlaszcza sprzecznosci) z pomiarem przed i po: ile pytan na dobe, jaki odsetek porzuconych
- [ ] #7 Pytanie nie powstaje na przeslance sprzecznej z pamiecia Akukiego (przypadek z 2026-10-19)
<!-- AC:END -->
