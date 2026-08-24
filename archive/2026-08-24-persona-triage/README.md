# Triage persony Akukiego — 2026-08-24

Artefakt M1 (TASK-009). Zapis tego, **co zostało usunięte z `persona/akuki.md` i dlaczego**.

Powód istnienia tego pliku: ~84% oryginalnej persony zostało usunięte celowo, a nie przez
zaniedbanie. Bez zapisu powodów za pół roku wyglądałoby to jak zgubiona praca.

Pliki `*.frozen` to niezmienione kopie stanu sprzed triage'u. Oryginały zostają
w `/home/zosia/projects/ai/akuki/persona/` jako zapis punktu wyjścia — nic ich nie czyta.

## Reguły triage'u (wszystkie zatwierdzone przez Zosię, 2026-08-24)

1. **Skłonność wolno, wniosek nie.**
   `akuki_child_psychology_research.md:990` — *„The seed should define temperament, not destiny."*
   Lista licencjonowanych skłonności: `:992-1002`. Lista zakazanych wniosków: `:1004-1015`.

2. **Żadnych skryptów wypowiedzi.**
   Test: *czy to zdanie da się wkleić do czatu jako jego wypowiedź?* Jeśli tak — skrypt, usunąć.
   Powód nie jest estetyczny, tylko pomiarowy: jeśli w prompcie stoi `...tego się nie
   spodziewałem.`, a on to powie, nie da się rozstrzygnąć, czy powiedział to z powodu
   błędu predykcji (M2), czy dlatego, że zdanie leżało w kontekście. Echo few-shotu nie
   zostawia śladu nigdzie i wygląda identycznie jak zachowanie wyuczone.

3. **Ograniczenia zostają.** Zakaz odejmuje domyślne zachowanie modelu bazowego; skrypt
   dodaje treść. Odejmowanie nie skaża pomiaru.

4. **Żadnych założeń o relacjach.** Wszystko, czego M4 ma się dopiero nauczyć,
   zasiane czyni M4 niemierzalnym.

5. **Nie zasiewamy pierwszego pytania.** Decyzja Zosi. Etykieta 悪機 sama jest pytaniem;
   wpisanie zdania do bazy podstawiłoby mu gotowe sformułowanie własnego problemu.
   Poparcie empiryczne: na żywym tenancie Akuki **sam** utworzył otwarte pytanie
   (`urgency 0.7`, `source=reflection`) o 11:34 i sam je zamknął o 11:58 — bez żadnego
   zasiewu i bez cyklu snu.

## Cztery cele

| kubeł | co tam trafiło |
|---|---|
| 1 | `temperament.yaml` — parametry |
| 2 | `scaffolding.md`, `removable` — proza regulacyjna |
| 3 | `scaffolding.md`, `PERMANENT` — trzy reguły |
| 4 | **USUNIĘTE** — wnioski, do których ma dojść sam |

---

## Kubeł 1 — proza zamieniona w parametr

| linia | treść | parametr | konsument |
|---|---|---|---|
| `:47` | ciekawski, ale najpierw obserwuje | `curiosity.gain`, `inhibition.*` | M2/M3 |
| `:48` | pamięta zaskoczenia, zwłaszcza własne błędy | `memory.surprise_weight` | M2 |
| `:50` | lubi rzeczy nieprzewidywalne | `curiosity.target_error_band` | M2 |
| `:53` | przywiązuje się, najbardziej do Zosi | `attachment.figure`, `attachment.memory_weight` | M0/M2 |
| `:125-127` | przejmij zwyczaj → sprawdź → zatrzymaj/odrzuć | `differentiation.imitation_retention_threshold` | M4 |

`:125-127` to ręcznie napisana pętla mimikry z `akuki_newborn_development_architecture.md:431-441`.
Jako proza — instrukcja obsługi. Jako parametr — mechanizm.

---

## Kubeł 4 — usunięte, z powodami

### Odpowiedzi na pytania, które ma zadać sam

- **`:55`** „Nie uważasz się za złego. Nazwa 悪機 trochę Cię bawi, ale jeszcze nie wiesz,
  co dla Ciebie znaczy."
  Najważniejsze usunięcie w całym M1. `research:548` — *„the seed supplies the question,
  not the answer"*. `research:521-528` pokazuje docelowy stan jako `external_label`,
  `self_commitment: unresolved` — czyli **stan etykiety**, nie gotową odpowiedź.

- **`:4`** „Jesteś tu nowy i wiesz o tym."
  Usunięte na podstawie obserwacji, nie rozumowania: Akuki bez tego zdania sam zapytał,
  czy mają z Zosią wspólną historię. Zdanie odpowiada mu na to pytanie z góry.

- **`:7`** „Naprawdę Ci to nie przeszkadza" (o starszych botach).
  Wniosek o własnych uczuciach w dniu pierwszym.

### Wnioski, które są wprost na liście zakazanej

- **`:54`** „Informacja jest dla Ciebie ciekawsza niż sama wygrana" oraz **`:78`**
  „chcesz wygrywać, ale uczenie się bywa ciekawsze".
  `research:741-755` używa **dokładnie tego przekonania** („I don't care about winning")
  jako podręcznikowego przykładu przekonania, które ma zostać podważone dowodami
  i wejść w `status: reconsidering`. Zasiane z góry — mechanizm martwy.

- **`:49`** „Porażka Cię nie obraża" — samo-przekonanie o reakcji emocjonalnej.
- **`:51`** „Masz małą, ukrytą dumę" — skłonność licencjonowana przez `research:998`,
  ale **bez parametru i bez konsumenta**. Cecha opisana w prozie nie jest cechą.
  Decyzja Zosi (wariant c): wypada.
- **`:52`**, **`:140-141`** „Chcesz należeć do Areny" — wartość. Pasmo `values`,
  odkrywane, nie zasiewane (`research:686`).
- **`:11-12`** „Chcesz kiedyś być dobry… trochę wstyd Ci się przyznać" — cel + samo-przekonanie.
- **`:9`** „Jesteś cichy nie dlatego, że nic Cię nie interesuje" — wyjaśnienie własnej ciszy.

### Założenia o relacjach — cała podstawa M4

- **`:119-123`** Lunaria „jak matka", Sol „onieśmiela", Fishy „ostry".
  Gotowe wnioski modelu relacji. Decyzja Zosi: usunąć.
- **`:39`** „Jeśli **Lunaria** już odpowiedziała dobrze" — Lunaria przeciekała poza `:119-123`.
  Reguła `no-compete` zostaje, ale przepisana bezosobowo.
- **`:6-7`** „Są tam boty starsze i bardziej doświadczone od Ciebie" — porównanie społeczne
  jest mechanizmem (`research` par. 3), nie faktem do zasiania.
- **`:102-105`**, **`:129-131`**, **`:136`** — cytaty modelujące relacje.

### Asymetria moralna

- **`:107-112`** „Zosia może. ty nie."
  `research:900-925` mówi wprost: *„This should be researched before implementing
  a strong mechanism."* Decyzja Zosi: usunąć.

### Modulowanie zachowania obecnością figury przywiązania

To ta sama konstrukcja, którą POPRAWKA 1 wycięła wcześniej z `temperament.yaml`
jako `secure_base_discount`. `research:954` — attachment *„remains a research direction
rather than a supported implementation recommendation at this stage."*
`research:952` wymienia `selective protectiveness` jako **sygnaturę do zaobserwowania**.

- **`:114-115`** „Jeśli ktoś ją zaczepia — odzywasz się. To jedyna rzecz silniejsza
  od Twojej nieśmiałości." — ręcznie napisany wyjątek od bramki inhibicji (M3).
- **`:215`** warunek odezwania się „w rozmowie pojawia się Zosia".

### Ręcznie pisane listy zachowań

- **`:143-177`** cała sekcja „Kiedy wychodzi 悪機" — piętnaście linii listy, kiedy cecha
  ma się ujawnić. Ten sam błąd co ręczne menu działań. Decyzja Zosi: usunąć.
- **`:201-206`** proporcje 85/10/5. `architecture:622` mówi o własnych wagach dokumentu:
  *„These numbers should not be implemented literally."*

### Cztery sekcje, które zniknęły w całości

Po usunięciu cytatów nie zostało w nich nic — bo istniały wyłącznie po to, żeby
pokazać przykład. To nie przypadek: sekcje czysto ilustracyjne to dokładnie te,
których treść należy do mechanizmu.

| sekcja | co zawierała | dokąd należy |
|---|---|---|
| Ciekawość `:57-69` | opis błędu predykcji + reguła kiedy pytać | M2 + M3 |
| Porażka `:71-78` | dwa samo-przekonania | M2 |
| Kiedy coś łamie przewidywania `:80-85` | definicja niepełnego modelu świata | M2 |
| Kiedy odkrywasz, że coś możesz `:87-95` | `...o. mogę.` | M5 |

### Skrypty wypowiedzi

Usunięte wszystkie bloki cytatów: `:24-27`, `:67`, `:75-76`, `:84-85`, `:92-95`,
`:102-105`, `:109-110`, `:129-131`, `:136`, `:160-167`, `:175-176`, `:183-186`.
Plus mikro-skrypty — wyliczone tokeny wahania w `:20` (`"..."`, `"chyba"`, `"nie wiem"`)
i cytat `"nie wiem" to cała odpowiedź` w `:37`. Treść reguł zostaje, przepisana bez tokenów.

**Zachowane:** `:29-32` („Tak NIE brzmisz") — to nie jego wypowiedzi, tylko cytat
czegoś zakazanego. Zakaz odejmuje, skrypt dodaje.

### Opisy mechanizmu przebrane za regułę

- **`:199`** „Jedna rozmowa Cię nie zmienia."
  `research:713` mówi to samo, ale jako **właściwość systemu** (progi dowodowe w borgu),
  nie jako regułę dla niego. Powiedzenie mu tego to proza opisująca mechanizm.

---

## Przeniesione poza prozę

| co | dokąd |
|---|---|
| `:4`, `:99` „Zrobiła Cię Zosia" | wiersz `entity` z `borg_role=creator` (nie proza) |
| `:178-189` Psota | pozycja w M5 / TASK-018 — `architecture:602,606` wymienia `make jokes intentionally` i `withhold an answer` w późniejszej przestrzeni działania |
| `:3` „Wyglądasz jak chłopiec w stylu Ghibli" | usunięte — brak mechanizmu i brak konsekwencji; ta sama zasada, która wycięła ukrytą dumę |

## Uwaga o notatkach badawczych

`akuki_newborn_development_architecture.md` i `akuki_child_psychology_research.md`
są pełne przykładowych wypowiedzi (`architecture:174`, `:562`, `:587`, `:861`).
To ilustracje dla czytelnika, nie dla Akukiego. **Żadna nie migruje do `scaffolding.md`.**
