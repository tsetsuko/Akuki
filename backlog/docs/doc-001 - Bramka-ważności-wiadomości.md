---
id: doc-001
title: Bramka ważności wiadomości
type: specification
created_date: '2026-09-30 11:55'
tags:
  - arena
  - connector
  - throughput
  - research
---
# Bramka ważności wiadomości

Status: zaprojektowane 2026-09-30, niezbudowane. Zadanie: TASK-047. Zależy od TASK-046 (kolejka „przyjmij wszystko, odpowiedz na jedną”) i TASK-033 (oznaczenia @ i reply-to docierają do tury). Wersja angielska w `.claude/skills/akuki-research/references/future-development.md`, wpis 12.

## Problem

Gdy w wątku czeka kilka wiadomości, każda jest przyjmowana: zapis, percepcja, ocena M2 i M4, nastrój, kontakt z autorem. Pełną turę dostaje tylko jedna, a pełna tura to około 70 s. Dziś jest to najnowsza wiadomość, czyli kolejność według przyjścia.

To bywa zły wybór. Przykład: w kolejce pięciu wiadomości druga to bezpośrednie pytanie do Akukiego, a ostatnia to „haha” od innego bota. Akuki odpowie na „haha”, a pytanie tylko przyjmie. Wygląda to jak brak słuchania.

Decyzja Zosi (2026-09-30): nieodpowiadanie na nic i odpowiadanie zawsze na najnowszą są tak samo złe. Potrzebny jest **próg ważności**.

## Pojęcia

- **Kalibracja:** z odpowiedzi, którym model daje 0,8, trafnych jest mniej więcej 80%.
- **Logprobs:** prawdopodobieństwa, jakie model nadał kolejnym tokenom odpowiedzi. Z nich da się odczytać prawdziwe prawdopodobieństwo etykiety.
- **Pewność werbalizowana:** liczba, którą model sam wpisuje w odpowiedź. Nie wynika z jego wewnętrznych prawdopodobieństw.
- **ECE (expected calibration error):** średnia różnica między deklarowaną pewnością a faktyczną trafnością. 0 oznacza idealną kalibrację.
- **Embedding:** zamiana tekstu na wektor liczb, na którym można uczyć mały klasyfikator.
- **Krzywa Beta:** przekonanie o tym, jak często coś się udaje, zapisane jako krzywa, a nie jedna liczba. Odróżnia „nie wiem” od „rzadko działa”. Tego samego kształtu używa zaufanie w M4.

## Projekt: dwie bramki i próg

1. **Bramka 1, skrót strukturalny.** Wiadomość oznacza Akukiego przez @ albo jej `reply_to_id` wskazuje na jego post. Od razu dostaje wysoką ważność, bez wywołania modelu. Bot Arena wysyła oba pola (`connector/src/botarena-client.ts:46-47`), ale nie docierają dziś do tury (TASK-033).
2. **Bramka 2, ocena treści.** Dostaje ją każda wiadomość, której nie złapała bramka 1. Model czyta wiadomość z kilkoma poprzednimi i ocenia, na ile dotyczy Akukiego: jest do niego, jest o nim, zawiera prośbę albo pytanie.
   - **Bramka 1 jest skrótem, a nie warunkiem koniecznym.** Gdyby bramkę 2 uruchamiać tylko po przejściu bramki 1, mówienie o Akukim bez oznaczenia nigdy nie zostałoby ocenione, a na Arenie zdarza się to często.
3. **Próg.** Pełną turę dostaje najważniejsza wiadomość z kolejki, jeśli przekracza próg. Jeśli żadna go nie przekracza, wszystkie są tylko przyjmowane.

### Czego projekt celowo nie robi

- **Niczego nie odrzuca bez wysłuchania.** Wiadomość o niskiej ocenie nadal przechodzi przyjęcie, więc M2, M4 i nastrój ją widzą. „Ignorowanie” znaczy tu „niewybrana do odpowiedzi”, nigdy „niesłyszana”. Filtrowanie przed przyjęciem odrzucono 2026-09-30: traci bodziec, a o treści decydowałby transport.
- **Nie rusza M3.** Wiadomość powyżej progu dostaje pełną turę, w której Akuki nadal może wybrać milczenie. Bramki decydują tylko o tym, czy w ogóle pytać go o decyzję.

### Gdzie to ma mieszkać

- **Bramka 1** jest strukturalna, więc może być w konektorze.
- **Bramka 2** czyta treść, więc musi być w poznaniu, a nie w konektorze. Nagłówek adaptera mówi, że kierowanie wiadomości jest wyłącznie strukturalne, a decyzja o mówieniu należy do Akukiego i M3. Tura przyjęcia i tak uruchamia percepcję, więc może zostawić ocenę w stanie wiadomości. Kolejka wybiera wtedy na podstawie zapisanych ocen, zgodnie z zasadą, że decyzja wynika ze stanu, a model tylko ją formułuje.
- **Zakaz list słów:** ocena musi pochodzić od modelu, bo borg zabrania dopasowywania słów, a Akuki mówi po polsku i angielsku.

### Próg a niezmiennik 5

Próg to stały parametr. Żeby nie był pokrętłem strojenia, ocena łączy dwie składowe:
- ocenę modelu,
- wyuczoną składową: czy odpowiedzi na podobne wiadomości od tego partnera kończyły się zaangażowaniem, zapisaną jako krzywa Beta.

Próg się nie zmienia, zmienia się to, czego Akuki nauczył się z doświadczenia.

## Który model w bramce 2 (research 2026-09-30)

| Opcja | Polski | Prawdziwe prawdopodobieństwo | Dane poza serwer | Werdykt |
|---|---|---|---|---|
| Jev (TypeSafe AI) | niepotwierdzony; „English is the primary training language” | deklarowane, bez liczb | tak | odrzucony |
| Laya (Convai, Apache 2.0) | trafność 0,50, ECE 0,353 | tak, ale mocno przesadna pewność | nie | tylko do porównania |
| Claude Haiku 4.5, schemat | dobry, z kontekstem wątku | nie, logprobs są ignorowane | nie (Anthropic) | **start** |
| Klasyfikator na bge-m3 | tak, model wielojęzyczny | tak, po kalibracji | nie, lokalnie na VPS | **cel** |
| mDeBERTa zero-shot NLI | 27 języków, brak polskich wyników | tak | nie | zapas |
| Bielik 1.5B / Qwen3 1.7B z logprobs | tak | tak, po normalizacji | nie | wolny na CPU, niezmierzony |

Szczegóły:
- **Jev:**
  - zamknięta usługa, bez wag do pobrania;
  - dokumentacja: inne języki niż angielski „handled but not equally well”;
  - kalibracja zadeklarowana („trained with RLCD”), ale bez opublikowanych wyników;
  - niezrecenzowany preprint (arXiv 2609.30243): krótki dopisek do kontekstu odwrócił 61,4% poprawnych decyzji. Nie przeczytany osobiście.
- **Haiku:** dokumentacja zgodności Anthropica z OpenAI podaje `logprobs: Ignored` w zapytaniu i `logprobs: Always empty` w odpowiedzi (sprawdzone 2026-09-30). Pewność werbalizowana jest systematycznie zawyżona (arXiv 2306.13063), więc próg przy Haiku jest orientacyjny.
- **bge-m3:** działa już w Ollamie na VPS. Na jego wektorach regresja logistyczna albo SetFit zwraca prawdziwe prawdopodobieństwo, które kalibruje się skalowaniem temperatury (Guo i in. 2017). Szacowany czas poniżej sekundy, niezmierzony na ARM. Wymaga oznaczonych przykładów.
- **Każdy model lokalny to nowa rola modelu.** Nie wysyła danych na zewnątrz, ale walidator „tylko Anthropic” (`borg/src/akuki/smoke-config.ts:36`) trzeba świadomie rozszerzyć, za osobną zgodą.

## Plan

1. **Haiku w bramce 2**, z orientacyjnym progiem.
2. **Zbieranie oznaczeń:** około 300 prawdziwych wiadomości z Areny, każda z 3–5 poprzednimi.
   - Losowanie warstwowe, tak żeby było dość przypadków „o nim bez oznaczenia” i próśb do niego, a nie same „haha”.
   - Haiku podpowiada etykietę, człowiek zatwierdza. Najlepiej dwie osoby niezależnie, a zgodność mierzy kappa Cohena. Jeśli ludzie się nie zgadzają, model też się tego nie nauczy.
3. **Uczenie i kalibracja klasyfikatora na bge-m3.**
   - Około 150 wiadomości do dopasowania i 150 do oceny, nigdy te same.
   - Miary: ECE z 10 przedziałami, Brier score (średni kwadrat różnicy między prawdopodobieństwem a faktem), diagram rzetelności (pewność deklarowana względem faktycznej trafności).
   - Przedział ufności liczony bootstrapem, bo 150 przykładów to mało.
4. **Próg według kosztów.** Przegapione pytanie do Akukiego kosztuje więcej niż jedna zbędna odpowiedź, więc sprawdzamy czułość na klasie „ważne” przy wybranym progu.

## Twierdzenie badawcze, analogia, wybór twórczy

- **Co mówią badania:** niemowlęta rozpoznają brzmienie własnego imienia około 4,5 miesiąca (Mandel, Jusczyk i Pisoni 1995); pewność werbalizowana modeli jest zawyżona; skalowanie temperatury kalibruje klasyfikatory. Literatury o uwadze wybiórczej i naprzemienności wypowiedzi u dzieci nie przeczytano, więc krok 2 bramki sześciu kroków nie jest domknięty.
- **Uczciwa analogia obliczeniowa:** to, że ktoś zwraca się do Akukiego albo o nim mówi, podnosi roszczenie wiadomości do odpowiedzi, a doświadczenie tego, co odpowiedź dała, je koryguje.
- **Wybór twórczy:** próg, klasy ważności i wagi.

## Czego nie zweryfikowano

- Czasu działania żadnej opcji na VPS (ARM, Ampere A1).
- Polskich wyników mDeBERTa, GLiClass i Bielika w tej roli.
- Czy logprobs w Ollamie działają razem ze structured outputs.
- Kalibracji Jeva poza angielskim, bo nigdzie jej nie opublikowano.

## Źródła

- Mandel, Jusczyk i Pisoni 1995, *Infants' recognition of the sound patterns of their own names*: https://journals.sagepub.com/doi/10.1111/j.1467-9280.1995.tb00517.x
- Dokumentacja Jeva: https://docs.typesafe.ai/models , https://docs.typesafe.ai/introduction
- Preprint o odporności Jeva (bez recenzji): https://arxiv.org/abs/2609.30243
- Benchmark Laya kontra Jev (społeczność): https://huggingface.co/datasets/Luni/laya-jev-benchmark
- Laya: https://huggingface.co/convaiinnovations/laya-multilingual , https://github.com/NandhaKishorM/laya/blob/main/BENCHMARKS.md
- Anthropic, zgodność z OpenAI SDK: https://platform.claude.com/docs/en/api/openai-sdk
- Pewność werbalizowana, ICLR 2024: https://arxiv.org/abs/2306.13063
- Guo i in. 2017, kalibracja przez skalowanie temperatury: https://arxiv.org/abs/1706.04599
- bge-m3: https://huggingface.co/BAAI/bge-m3
- SetFit: https://huggingface.co/docs/setfit/index
- mDeBERTa zero-shot: https://huggingface.co/MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7
- GLiClass: https://huggingface.co/knowledgator/gliclass-x-base
- Bielik 1.5B: https://huggingface.co/speakleash/Bielik-1.5B-v3.0-Instruct-GGUF
- Logprobs w Ollamie: https://newreleases.io/project/github/ollama/ollama/release/v0.12.11 , https://github.com/ollama/ollama/issues/18579
- HerBERT: https://huggingface.co/allegro/herbert-base-cased
