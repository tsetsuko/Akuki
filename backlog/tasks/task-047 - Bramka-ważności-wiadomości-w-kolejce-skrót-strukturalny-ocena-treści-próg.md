---
id: TASK-047
title: 'Bramka ważności wiadomości w kolejce: skrót strukturalny, ocena treści, próg'
status: To Do
assignee: []
created_date: '2026-09-30 11:54'
updated_date: '2026-10-14 12:25'
labels:
  - arena
  - connector
  - throughput
dependencies:
  - TASK-046
  - TASK-033
references:
  - .claude/skills/akuki-research/references/future-development.md
  - connector/src/adapter.ts
  - connector/src/botarena-client.ts
  - borg/src/akuki/smoke-config.ts
documentation:
  - backlog/docs/doc-001 - Bramka-ważności-wiadomości.md
priority: medium
type: feature
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dziś, gdy czeka kilka wiadomości, pełną turę dostaje najnowsza, a reszta jest tylko przyjmowana (TASK-046). Decyzja Zosi z 2026-09-30: nie odpowiadać na nic i zawsze odpowiadać na najnowszą to dwa równie złe skrajne warianty. Potrzebny jest próg ważności. Pełną turę dostaje najważniejsza wiadomość z kolejki, ale tylko wtedy, gdy przekracza próg. Jeśli żadna go nie przekracza, wszystkie są tylko przyjmowane.

Ważne przypadki: ktoś zwraca się do Akukiego z prośbą albo pytaniem; ktoś mówi o nim bez oznaczenia (częste na Arenie). Mało ważne: „haha” i luźne gadanie.

Projekt:
1. Bramka 1, skrót strukturalny. Wiadomość oznacza Akukiego przez @ albo jej reply_to_id wskazuje na jego post, więc od razu dostaje wysoką ważność, bez modelu. Zależy od TASK-033, bo te pola nie docierają dziś do tury.
2. Bramka 2, ocena treści każdej wiadomości, której nie złapała bramka 1. Bramka 1 jest skrótem, a nie warunkiem koniecznym, bo inaczej mówienie o Akukim bez oznaczenia nigdy nie zostałoby ocenione. Ocena ma być liczona w poznaniu, w turze przyjęcia, i zapisana w stanie wiadomości. Konektor ją tylko odczytuje, bo nie może sam oceniać treści.
3. Próg jako stały parametr. Ocena łączy wynik modelu z wyuczoną składową (czy odpowiedzi na podobne wiadomości od tego partnera coś dawały, jako krzywa Beta, jak zaufanie w M4), zgodnie z niezmiennikiem 5.

Nic nie jest odrzucane bez wysłuchania. Wiadomość o niskiej ocenie nadal przechodzi przyjęcie (M2, M4, nastrój). M3 zostaje nietknięte, bo wiadomość powyżej progu dostaje pełną turę, w której Akuki nadal może milczeć.

Model w bramce 2 (research z 2026-09-30):
- Jev odrzucony: zamknięty, najlepszy po angielsku, bez opublikowanej kalibracji, dane szłyby do strony trzeciej.
- Start: Haiku 4.5 z odpowiedzią w ustalonym formacie. Nie daje prawdziwego prawdopodobieństwa (API Anthropica ignoruje logprobs), więc próg jest na razie orientacyjny.
- Cel: skalibrowany klasyfikator na embeddingach bge-m3, który już działa lokalnie na VPS.

Pełny projekt ze źródłami jest w dokumencie w backlogu „Bramka ważności wiadomości” i we wpisie 12 w `.claude/skills/akuki-research/references/future-development.md`.

Przed implementacją obowiązuje pełna bramka sześciu kroków ze SKILL.md. Lokalny model to nowa rola modelu, więc walidator „tylko Anthropic” trzeba świadomie rozszerzyć, za osobną zgodą.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Bramka 1: wiadomość z @Akuki albo reply-to do jego posta dostaje wysoką ważność bez wywołania modelu (test)
- [ ] #2 Bramka 2: każda wiadomość niezłapana przez bramkę 1 dostaje w turze przyjęcia ocenę ważności zapisaną w stanie; brak list słów i dopasowań fraz
- [ ] #3 Kolejka: pełną turę dostaje najważniejsza wiadomość powyżej progu; gdy żadna go nie przekracza, wszystkie są tylko przyjęte (test)
- [ ] #4 Zbiór ~300 oznaczonych wiadomości z Areny z kontekstem, zgodność oznaczeń zmierzona (kappa Cohena)
- [ ] #5 Klasyfikator na bge-m3 skalibrowany; ECE, Brier i diagram rzetelności na połowie testowej; czułość na klasie ważne przy wybranym progu
- [ ] #6 Pomiar na żywej Arenie: brak przypadków, w których błaha wiadomość dostała odpowiedź, a pytanie do Akukiego w tej samej kolejce tylko przyjęcie
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Zosia's decisions of 2026-10-05, replacing the "answer or only assess" threshold:
- **The threshold sets how much thought a message gets, not whether it gets an answer.** Above it: a full turn. Below it: a light turn, in which Akuki can still answer as himself, and M3 still decides whether he speaks.
- **Light turn:** M2/M4 appraisal and reflection run after the conversation, not in the turn. Skipping the pre-answer shared-state pass and planning is the proposal; it needs measuring before it is built.
- **Queue:** only the selected message gets a turn (full or light). The rest are only assessed (heard), as today.
- **Threshold model:** Remek/basal-1.5-4.5B (Apache-2.0, fine-tuned from Bielik-4.5B-v3.0-Instruct). It is a typed-decision model for Polish and English that returns calibrated probabilities per option, with a CALIBRATION.json of per-type temperatures. That addresses the Haiku problem recorded on 2026-09-30, where verbalized confidence is uncalibrated. A GGUF build exists for Ollama.
- **Blocking fact, measured 2026-10-05:** the VPS has 1 ARM core (Neoverse-N1) and 5.8 GiB RAM, of which bge-m3 already uses 1.2 GB. Running a 4.5B model on one CPU core will very likely take seconds per decision, which would add to the very latency this is meant to cut. This is an estimate and has not been measured. Measuring it on the live VPS would compete with Akuki for that single core, so it needs either a separate measurement host or a larger instance.
- **Stale context (TASK-050 problem 1):** accepted as unfixable for now.
- **Also decided:** clean up Akuki's per-turn thought processes so that passes run only where they are needed. This starts with an audit of the per-turn call sites.

basal measured on the live VPS, 2026-10-05.

Setup:
- 1 Neoverse-N1 core, Ollama 0.33.2, Q4_K_M GGUF (2.93 GB), basal engine v1.5.0 in ~/basal/.venv, run as `--mode ollama`.
- Akuki was idle during the test. Afterwards the server was stopped and the model unloaded, with no errors in the akuki journal.

Correctness on two real Arena messages (two noul questions each):
- Fishy "@Akuki — odpisałem minutę temu…": to_akuki P=0.97, directive P=0.007.
- Terra "złamałam własną zasadę…" (about herself): to_akuki P=0.018, directive P=0.061.
- Both are right and confident. A single merged question ("needs a thoughtful answer: to him, about him, or asks a change") gave P=0.18 on the Fishy message, which is wrong. Keep the questions separate.

Latency is dominated by prefill at about 27 tokens/s on one core:
- Two orders, two questions, ~1000–1200 tokens: 130 s cold (model load), then 33–49 s warm.
- One order (`--orders 1`), two questions, 614 tokens: 21 s.
- One order, one question, 314 tokens: 11.7 s.
- The identical request repeated took 0.37 s, because Ollama reuses the prompt prefix cache.

RAM: with the model loaded, available memory fell from 4.9 GB to 1.7 GB.

Conclusion: correct, but too slow on this VPS for a per-message gate in its current form. Viable directions:
- (a) An incremental state, where thread history is a stable prefix and only the new message is prefilled, so the prefix cache cuts cost to the new tokens (estimated 2–5 s; to be measured).
- (b) Gate 1, structural @/reply-to, routes directly, so basal runs only on uncaught messages.
- (c) Run basal in parallel with perception (about 5 s), so part of its time is hidden.
- (d) A larger instance.

Remeasured on 2026-10-07 after the VPS resize to 2 OCPU (Neoverse-N1, `n_threads=2`, 5.8 GiB RAM). Akuki was stopped during the test, and all models were unloaded afterwards.

basal-1.5-4.5B Q4_K_M, `--orders 1`:
- Two questions (~620–750 tokens): 86 s cold, then 10.7–18 s warm.
- One question (~300 tokens): 9.9–12.6 s.
- An identical repeat: 0.19 s.
- Prefill runs at about 31 tok/s, so going from 1 to 2 cores gained only about 15%.
- An append-only state reuses Ollama's prefix cache (verified in the log via "cached n_tokens"), which brings one question down to 5.8–7.6 s. But rewording the question to "the LAST message" worsened accuracy: Terra's message about herself scored 0.685.
- Answers: Fishy→Akuki 0.98 to_akuki / 0.009 directive. Terra about herself: 0.007 / 0.024. Zosia's real directive ("Akuki, od teraz nie opowiadaj, jak działa twoja pamięć…"): 0.99 to_akuki / **0.546 directive**, which is borderline even though it is clearly a directive.

basal-1.5-mini (1.5B, Bielik-1.5B base) Q8_0, `--orders 1`:
- Two questions: 2.9–4.5 s warm. One question: 1.4–3.1 s.
- **It fails the key case:** Terra about herself scored to_akuki 0.64 (single question) and 0.83 (append form), against 0.007 for the 4.5B. Zosia's directive scored 0.236.
- Fast, but it does not discriminate the case the gate exists for.

Implication: the 4.5B is accurate but takes 10–18 s on 2 cores. It could be hidden by starting it in parallel with perception and frame (~9 s before extraction) and having extraction await it; 4 OCPU would make that fit. The directive probability for a clear directive is only 0.55, so the threshold must be low, or calibration has to be refit on our own labels (CALIBRATION.json is fitted for bf16, not for quantised weights).

Q3 ("closing") measured on 2026-10-14 with basal-1.5-4.5B Q4_K_M, `--orders 1`, on 2 OCPU while Akuki was idle.

Setup: 20 real Arena messages from the live stream, each with 3 preceding messages truncated to 500 characters. State length was 373–1746 characters. The labels are mine, and at least 2 are doubtful: case 3 matched a longer Terra message beginning "Tak." rather than the bare "Tak.", and case 19 is borderline.

Scores, for messages labelled closing:
- Fishy "odpisałem… Tyle miałem" 0.34
- Fishy "⚡" 0.63
- Terra long "Tak. …" 0.19
- Terra "niech tak zostanie" 0.86
- Lunaria "wątek domknięty" 0.72
- Terra "naprawdę skończyłam" 0.76
- Fishy "obraza to luksus… wracam, gdy wróci powód" 0.14
- Terra "Uczciwy zapis" 0.53
- Terra "Przyjęte… Jedna uwaga" 0.35
- Terra "Zgadza się… wycofuję" 0.36

Scores, for messages labelled not closing:
- 0.08, 0.06, 0.35, 0.17, 0.11, 0.26, 0.19, 0.10, 0.38
- one false positive at 0.76 (Terra "Racja, dlatego nie trzeba wklejać…")

At t3 = 0.5 it catches 5 of 10 with 1 of 10 false. At t3 = 0.3 it catches 8 of 10 with 3 of 10 false. Separation is moderate. The clear endings score high, while closing messages that still carry content (both Fishy ones) score low.

**Latency finding:** on real message lengths a single question took 14–38 s, typically 25–35 s, compared with ~10 s on the short test states. Real Arena messages are long, and prefill on 2 cores runs at ~30 tok/s. This breaks the planned 20 s timeout: most turns would fall back to full. Options:
- shrink the state, for example to the new message plus one previous message, each capped at ~300 characters, then re-check accuracy;
- compute the gate when the message arrives and while it waits in the queue, which takes it off the critical path for queued messages;
- more hardware;
- Haiku.

Short context measured on 2026-10-14 with the 4.5B Q4_K_M, `--orders 1`, `--http-parallel 1`, while Akuki was idle. State = the new message plus 1 previous message, each capped at 300 characters (at most 625 characters). 21 cases, the 20 from before plus Zosia's directive.

**Accuracy is better than with long context:**
- Q2: the directive scores 0.968 (0.546 with long context). Every other case scores 0.05 or less.
- Q1: Terra about herself scores about 0.05; Fishy→Akuki and Sol→@Akuki score 0.95 or more.
- Q3 at t3 = 0.3 or 0.35 catches 6 of 10 closings with **0 of 10 false**. The highest non-closing score was 0.268. Fishy "odpisałem…" scores 0.52 and "⚡" 0.52.
- Zosia set t3 = 0.35.

**Latency is still 16–27 s for three questions.** The Ollama log shows the shared state prefix cached (186 tokens), but each question still evaluates about 70 new tokens (question, options and template) at only about 12.7 tok/s (5.1–5.6 s each), because small-batch prefill on this CPU is slow.

A single `choice` question with 4 routes (directive / to_akuki / closing / other) is no faster, at 12–21 s, because its longer option text cancels the saving. Its routing outcome is similar.

Conclusion: on this VPS, basal costs about 15–25 s per message whatever the format. Run in parallel with the ~9 s turn start, that still adds about 6–16 s to every turn, full turns included, and most answered messages are full turns. As a blocking gate it is likely a net loss here.

basal 2.0 measured on 2026-10-14. Released on HF and GitHub v2.0.0 on 2026-10-13. Variants: 4.5B, mini and max. The 4.5B GGUF comes only as Q8_0 (5.06 GB, too big for the 5.8 GiB RAM alongside bge-m3) and Q5_K_M (3.42 GB). Q5_K_M was tested: checksum OK, engine v2.0.0, prompt format 2, `--orders 1`, the same 21 short-context cases, Akuki idle.

**Speed: not faster here, slower.** Warm-up took 98.5 s. Three questions took 14–30 s, typically about 25 s. Prompt eval ran at about 10 tok/s, against about 12.7 tok/s for 1.5 Q4_K_M; the heavier quantisation costs more on this CPU. The page itself says GGUF speed was "not measured in this release".

**Accuracy is comparable:**
- Q2: the directive scores 0.909; others score 0.05–0.19 ("Zostaje…" 0.193 is close to the 0.2 threshold).
- Q1: Terra about herself scores about 0.15–0.18; addressed messages score 0.78–0.96.
- Q3: scores sit higher overall. At 0.35 it catches 8 of 10 with 2 of 10 false (0.425, 0.508). At 0.45 it catches 6 of 10 with 1 of 10 false.

Compared with 1.5 Q4_K_M at 0.35 (6 of 10, 0 false), 2.0 has better recall and more false alarms, at about 20% more latency.

Recommendation: implement against the basal-serve HTTP API, with the model and engine as config. Start on 1.5 Q4_K_M. Re-test 2.0 if a Q4 GGUF appears, or on larger hardware.
<!-- SECTION:NOTES:END -->
