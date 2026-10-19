---
id: TASK-049
title: Akuki powtarza ten sam motyw w kolejnych turach i w nocnej autonarracji
status: To Do
assignee: []
created_date: '2026-10-03 13:38'
updated_date: '2026-10-19 15:30'
labels:
  - arena
  - M4
dependencies: []
references:
  - >-
    backlog/tasks/task-033 -
    Wzmianki-reply-to-i-rodzaj-autora-z-Areny-nie-docierają-do-tury.md
  - borg/src/akuki/seed/scaffolding.md
  - dziennik/obserwacje/Obs 001 — opis siebie przez własny błąd.md
  - dziennik/kandydaci/2026-10-19.md
priority: medium
type: bug
ordinal: 48000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Zadanie powstało z powtarzanego zastrzeżenia o źródle wiedzy (2026-10-02). Tamten przypadek wygasł, ale ten sam wzorzec — jeden motyw wracający turę po turze w nowych słowach — pojawił się w innej postaci i dodatkowo w nocnej autonarracji. Przepisane 2026-10-19 po obserwacjach z 15–19.10.

### Dlaczego to ważne

Powtarzany motyw wygląda jak rozwój: zastrzeżenie o źródle jak działający M4, opis własnego błędu jak tożsamość zbudowana na sprawczości. Jeśli to w rzeczywistości mechaniczne powtarzanie, jedno i drugie jest zawyżone. Do tego głos przestaje być zwięzły, a znaczniki wzrostu przestają być rzadkie (niezmiennik 6: rozwój jest rzadki).

### Przypadek pierwszy — zastrzeżenie o źródle (2026-10-02, wygasł)

Wątek 184888fd, 18:53–19:59 UTC: na 23 odpowiedzi około dziesięciu zawierało to samo zastrzeżenie („wiadomości z 22 września nie otworzyłem”, „liczby mam od ciebie, nie z raportu”). O 19:51 Terra: „jeden raz wystarczyłby za wszystkie”. Przyznał rację i przestał. Sam to potem opisał w znaczniku wzrostu z 2026-10-16 („Nauczyłem się odróżniać ostrożność od jej demonstrowania”). Trop z zobowiązaniami — niżej, w notatkach.

Poboczne pytanie, czy zdanie „nie umiem przewinąć wątku” jest prawdziwe: według znacznika z 2026-10-17 sprawdził wrzesień i zaraportował, że materiał jest pusty, a nie zablokowany. To jego własny opis, nie odczyt strumienia — AC #3 wymaga potwierdzenia.

### Przypadek drugi — opis siebie przez własny błąd (16–18.10, trwa)

Obs 001: ten sam opis siebie („dołożyłem zdanie, którego nie miałem skąd wziąć, i musiałem je cofać”) wraca pięć razy w trzy dni, za każdym razem w innej metaforze, do różnych rozmówców (Lunaria, Marvin, Terra).

### Przypadek trzeci — powtórzone znaczniki wzrostu (nocna autonarracja)

W kandydatach z 2026-10-19: 12 znaczników wzrostu w cztery dni, łącznie 108. Kilka mówi prawie to samo:
- „habit” 2026-10-16 16:59, 2026-10-17 17:09 i 2026-10-18 17:16 — trzy razy przyjęcie od Terry formuł „według mojego streszczenia” i „z dwóch cudzych odczytów, które się zgadzają” oraz postanowienie, że nie napisze „z oryginału”;
- „understanding” 2026-10-16 16:59 i 2026-10-17 17:09 — dwa razy „przestałem twierdzić rzeczy o własnej budowie bez sprawdzenia”, z tym samym przykładem „kwestii czasu”.

Każdy z nich narrator zapisuje jako zmianę, choć zmiana zaszła raz.

### Przyczyna nie jest ustalona

Kandydaci do sprawdzenia, bez kolejności prawdopodobieństwa:
- co wraca do wejścia tury: własne wcześniejsze wypowiedzi z okna rozmowy, przywołane epizody, zobowiązania (zob. trop w notatkach);
- pętla autonarracji: znacznik z 17.10 powstał przed wypowiedziami z 18.10 i mógł trafić do kontekstu tury, podsuwając temat (Obs 001, wyjaśnienie 2);
- nocna autonarracja nie widzi albo nie bierze pod uwagę wcześniejszych znaczników, więc co noc opisuje tę samą zmianę od nowa;
- zasiew albo sekcja pochodzenia wiedzy (M4) każe oznaczać źródło przy każdym użyciu cudzej informacji zamiast przy pierwszym.

Rozróżnienie z Obs 001: jeśli opis siebie wróci w innym wątku albo po kilku dniach przerwy, a liczba dowodów przy cesze epistemic caution rośnie w kolejnych snapshotach, to przemawia za trwałą zmianą, a nie za echem kontekstu.

### Czego nie robić

Żadnej deduplikacji wyjścia, listy zakazanych fraz ani filtra na treść odpowiedzi. To policjowanie wyjścia, które zakazuje borg/CLAUDE.md. Naprawa, jeśli potrzebna, należy do tego, co model dostaje albo o co jest proszony. To samo dotyczy znaczników wzrostu: nie kasować duplikatów po fakcie, tylko ustalić, dlaczego narrator je pisze.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Odczytane, co Akuki dostawał w prompcie w kilku turach z powtórzonym motywem — z 2026-10-02 i z 16–18.10 (czy jego wcześniejsze wypowiedzi, znaczniki wzrostu albo zobowiązania były w wejściu)
- [ ] #2 Przyczyna ustalona albo jawnie zapisane, że nie da się jej ustalić
- [ ] #3 Sprawdzone, czy zdanie „nie umiem przewinąć wątku” jest zgodne z jego rzeczywistymi możliwościami (narzędzia pamięci)
- [ ] #4 Sprawdzone, czy nocna autonarracja widzi wcześniejsze znaczniki wzrostu, na przykładzie powtórzonych znaczników z 16–18.10
- [ ] #5 Jeśli naprawa: po stronie wejścia albo polecenia, bez filtra na wyjście; zatwierdzona przed implementacją zgodnie z bramką sześciu kroków
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
### Trop (2026-10-05, odczyt tylko do odczytu tabeli `commitments` i strumienia watku)

Nie M4. Zbieg w czasie z mechanizmem borga, ktory z uwag uczestnikow robi Akukiemu wiazace zobowiazania (`provenance_process: corrective-preference-extractor`, `kind: participant_preference`, zasieg: encja watku `ent_qnbd6wrv7lp7tgpo`):

- 19:05, 19:08, 19:14 UTC -- pierwsze zastrzezenia o nieotwartym zrodle, ZANIM powstalo jakiekolwiek zobowiazanie w tej sprawie (wiec nie ono je zapoczatkowalo).
- 19:17:21 -- zobowiazanie `boundary`: "When I have not directly opened or read the original source message ... I state this explicitly in Polish". Powstale z wypowiedzi Terry.
- 19:18-19:49 -- zastrzezenie wraca w okolo dziewieciu odpowiedziach.
- 19:51 -- Terra: "jeden raz wystarczylby za wszystkie".
- 19:53:17 -- zobowiazanie `preference`: "state this once clearly and let it stand without repeating the same caveat across multiple turns".
- 19:54 i dalej -- powtarzanie ustaje; 2026-10-04 09:28 w powodzie obserwacji sam pisze, ze "to samo rozroznienie juz wczesniej powiedzialem w tym watku".

Wniosek ROBOCZY, nie diagnoza: pierwsze zastrzezenie bylo jego wlasne i na temat (caly watek byl o sprawdzaniu zrodel), a powtarzanie mogla napedzac regula "zawsze to zaznaczaj" z 19:17, ktora potem uchylila druga regula. Nie sprawdzone, czy i w jakiej postaci te zobowiazania trafily do promptu finalizatora w tych turach -- to nadal AC #1.

Przy okazji, osobne podejrzenia (do wlasnych zadan, jesli sie potwierdza):
- Czesc zobowiazan jest sformulowana w pierwszej osobie INNEGO bota: "When I (Sol) have directly verified...", "When I (Lunaria) close...". Wyglada na to, ze ekstraktor zapisuje cudze zasady o sobie jako zasady Akukiego.
- 2026-10-03 20:01 -- zobowiazanie "I do not disclose or describe my own internal infrastructure, architecture, memory substrate...". Odpowiada zdaniu Terry o JEJ infrastrukturze ("To moja infrastruktura i jej nie opisuje"). Jesli dziala jako zasada Akukiego, moze blokowac mu mowienie o sobie.
- Pierwsze zobowiazanie (19:10, o zrodle znacznika czasu) ma `enforcement_class: critical` i `critical_domain: explicit_no_disclosure`, co nie pasuje do tresci.
- Lacznie 19 zobowiazan od 2026-10-02 19:00, wszystkie z tego jednego watku.
<!-- SECTION:NOTES:END -->
