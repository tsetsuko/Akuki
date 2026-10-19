---
id: doc-002
title: 'Projekt: lekka i pełna tura z bramką basal'
type: specification
created_date: '2026-10-14 09:44'
updated_date: '2026-10-14 13:24'
tags:
  - akuki
  - arena
  - latency
  - TASK-047
  - TASK-051
---
# Light and full turns with a Haiku gate and basal in the shadow

Status: approved on 2026-10-14. The hybrid variant was chosen by Zosia the same day. Implementation is starting.
Related: TASK-047 (gate), TASK-051 (pass cleanup), TASK-050 (latency).

## Decisions (2026-10-05..14)

- The threshold decides how much thought a message gets, not whether it gets an answer. M3 still decides speak or silence in both turn types.
- In the light turn, M2/M4 run after the conversation, one message at a time, each with its own history. The light turn uses S1 only. The light turn skips reflection.
- The conversation ends after 10 minutes of quiet in the thread.
- Starting thresholds: Q1 0.5, Q2 0.2, Q3 0.35.
- Only the selected queued message gets a turn. The rest are assess-only.
- Directives to Akuki go through the full turn, and only there does the commitment extractor run.
- Action-state extractor and pending-action judge: off for Akuki. Goal promotion: full turn only.
- **Hybrid (2026-10-14).** In the turn, Haiku answers the gate questions. basal-1.5-4.5B answers the same questions in the shadow, after the conversation, purely for measurement. It never decides a turn.
  - Why: on 2 OCPU, basal costs 15–25 s per message whatever the format, and basal 2.0 Q5 is not faster.
- **Episodic ingestion moves to the after-conversation pass (2026-10-14).**
  - Why: the extract stalls of up to 92 s were the new turn's tiny embedding waiting behind the previous turn's episode embedding on the single-request Ollama. A second Ollama slot does not help, as measured.
  - Already applied: `embedding.maxBatchSize = 1`, which cuts the wait from about 32 s to about 9 s in a test.
- Bots superseding the creator's commitments is a separate decision, out of scope here.

## 1. The gate in the turn: Haiku

Gate 1, structural, no model: @Akuki in the message, or reply_to pointing at Akuki's post. This sets "to Akuki" to true. The connector passes these as structural facts in the turn input (TASK-033).

Gate 2: Haiku 4.5 through the existing Anthropic client, with a new budget label `turn-depth-gate`. It uses a schema-constrained tool answer with three numbers in [0,1], over the same short state as basal: the new message plus 1 previous message, each capped at 300 characters.
- Q1 `to_akuki`: "Is the NEW MESSAGE addressed to Akuki or about Akuki?"
- Q2 `directive`: "Is the author asking or telling Akuki to change his behaviour permanently in the future?"
- Q3 `closing`: "Does the NEW MESSAGE close or wind the conversation down, so that it needs no thoughtful answer?"

Decision:
- Q2 ≥ 0.2 means **full**.
- Otherwise, (gate 1 or Q1 ≥ 0.5) and Q3 < 0.35 means **full**.
- Everything else means **light**.

Haiku's numbers are verbalised confidence, which is uncalibrated, so the thresholds are provisional. The shadow comparison with basal is what tells us how far off they are.

Placement:
- The gate starts in parallel with the turn start (perception and frame).
- The extract phase awaits it. It should already be done, at about 1–2 s.

Failure: if the call errors or times out (10 s), the turn is full, and the failure is logged.

## 1b. basal in the shadow

- **When:** in the after-conversation pass, after 10 minutes of quiet. At that point Akuki is idle, so basal does not compete for the CPU.
- **What:** for every message the gate decided on during that conversation, the same three questions are asked over the same short state (`--orders 1`, model basal-1.5-4.5B Q4_K_M, as config). The model and engine version are config, so moving to basal 2.0 is a config change.
- **Process:** `basal-serve` starts for the pass and is stopped afterwards, with the model unloaded, so that its ~3 GB of RAM is held only while it is needed.
- **Failure:** if basal is not available, the pass logs that and skips the shadow scores. Nothing else depends on them.

## 1a. What gets logged and where Zosia can see it

- **`/var/lib/akuki/trace/gate.jsonl` on the VPS,** one line per message:
  - time, thread, message id, author, the first ~120 characters;
  - structural flags;
  - **Haiku Q1/Q2/Q3, the Haiku latency and the decision** (full / light / fallback_full and why);
  - the turn duration and the time the reply was posted.
  - The shadow pass appends a second line for the same message id with the **basal Q1/Q2/Q3** and its latency.
- **On the laptop:**
  - `./akuki-serwis.sh bramka [N] [--light]` prints a table: time | author | excerpt | Haiku Q1 Q2 Q3 | basal Q1 Q2 Q3 | decision | gate s | turn s | reply-after s;
  - `./akuki-serwis.sh bramka --rozne` lists only the messages where Haiku and basal would have routed differently. These are the cases to label first.
- **The after-conversation pass** writes one summary line: messages appraised, episodes ingested, messages shadow-scored, and duration.
- **Rotation:** monthly through logrotate, keeping 6 files.

## 2. What each turn type runs

| Pass | Full | Light |
|---|---|---|
| perception (mood feeds M3) | yes | yes |
| frame anomaly (safety) | yes | yes |
| gate (Haiku), in parallel | yes | yes |
| commitment extractor | only if Q2 ≥ 0.2 | no |
| goal promotion | yes | no |
| action-state extractor | **no (off for Akuki)** | no |
| M2 prediction, M4 trust | yes, in the turn | after the conversation |
| closure-loop | yes | yes |
| recall | yes | yes |
| shared state before the answer | yes | no |
| planning (S2) | as today | no, S1 only |
| M3 | yes | yes, on M2 from before the conversation |
| guards (critical commitments, internal ids, safety) | yes | yes |
| reply posted early | yes | yes |
| pending-action judge | **no (off)** | no |
| shared state after the answer | yes (after posting) | no |
| reflection | yes (after posting) | no |
| episodic ingestion | **after the conversation** | **after the conversation** |

## 3. After the conversation

Conversation end: 10 minutes of quiet in the thread. Then, in order:
1. Episodic ingestion of the whole conversation (moved out of the turn).
   - **To verify before building:** that in-conversation recall relies on the stream and recency, not on episodes of the same conversation. If it does rely on episodes, the plan changes.
   - The pre-turn catch-up must then not ingest synchronously during a conversation either.
2. For each light-turn or assess-only message, M2 and M4 run with the history cut at that message. Simplification: open expectations are taken as they are now, not as they were then.
3. basal shadow scores for every gated message.
4. One summary line in the gate log.

## 4. Cleanup after deploy

Revoke the active commitments and goals made from other bots' statements. A backup is taken first. Zosia approves the list.

## 5. Research framing

- **Claim:** dual control. A fast habitual mode and a slow goal-directed mode, arbitrated by uncertainty and stakes (Daw, Niv & Dayan 2005). This is adult neuroscience, and the developmental side is unread.
- **Episodic ingestion after the conversation** is an analogue of consolidation at rest, not during encoding. It is a loose analogy, and its primary justification is engineering.
- **Analogue:** how much thought a message gets is a separate decision from whether to speak.
- **Creative choice:** the questions, the thresholds, the 10-minute end, what the light turn drops, and Haiku in the turn with basal in the shadow.
- The shadow log turns "which model decides better?" into a measurement: two models on the same decision, compared on labelled cases.

## 6. Order of implementation

1. ~~Batch size 1 for embeddings~~ (done 2026-10-14). Switch off action-state and the pending-action judge for Akuki. This means fewer calls and fewer bogus goals; it does not fix the stall.
2. Commitment extractor gated by Q2, plus the Haiku gate itself and its gate.jsonl line.
3. The light turn: S1 only; no pre-answer shared state, extractors, post-response shared state or reflection.
4. The after-conversation pass: episodic ingestion, deferred M2/M4, then the basal shadow.
5. `./akuki-serwis.sh bramka`, and logrotate.
6. Local tests at every step; one deploy at the end, with Zosia's go-ahead; the cleanup after it.
