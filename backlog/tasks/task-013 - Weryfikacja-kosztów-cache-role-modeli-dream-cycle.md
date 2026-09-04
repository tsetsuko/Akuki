---
id: TASK-013
title: 'Weryfikacja kosztów: cache, role modeli, dream cycle'
status: In Progress
assignee: []
created_date: '2026-08-20 14:28'
updated_date: '2026-09-01 12:24'
labels: []
dependencies: []
priority: high
ordinal: 1500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Budżet tokenów jest wspólny z zespołem, więc to twardy warunek, nie ozdoba. Żadna z tych rzeczy to nie nowy kod.

1. CACHE JUŻ JEST. finalizer.ts:377-381 ma dwa poziomy: statyczny prefiks ttl 1h, dynamiczny ttl 5m. Planner ma swój. request-fingerprint.ts:67 liczy breakpointy. ZADANIE: nie zepsuć. Cache działa na dokładne dopasowanie prefiksu, więc wyjście mechanizmów idzie na KONIEC promptu, nigdy wklejane na początek. Sprawdzaj usage.cache_read_input_tokens - zero przy powtarzanych turach znaczy, że coś unieważnia cache.

2. TANIE MODELE NA ROLE WOLUMENOWE. Pięć niezależnych ról (src/config/index.ts:1128-1150): cognition, background, extraction, recallExpansion, creatorDirective. Tylko cognition musi być doskonałe. extraction i recallExpansion chodzą bez przerwy i są mechaniczne.

3. ŚCIEŻKA NIE-ANTHROPIC. borg eksportuje OpenAICompatibleLLMClient (src/llm/index.ts:436), llmClient jest wstrzykiwalny -> P4/kratos osiągalne (sidecar już wspomina kratos + NODE_EXTRA_CA_CERTS). UWAGA: openai-compatible.ts:105 mówi, że cache_control nie ma odpowiednika w OpenAI, więc ta ścieżka NIE MA cache. Cachowane wywołanie Anthropic może być tańsze niż niecachowane darmowe. Mierzyć, nie zgadywać.

4. DREAM CYCLE to cichy koszt - dwanaście procesów offline, każdy woła LLM. maintenance.lightProcesses / heavyProcesses je bramkują; usunięcie z obu wyłącza. Na czas rozwoju mechanizmów włączone tylko to, co badane.

O AGENTACH: borg już robi wiele wywołań LLM o różnych rolach na turę. Dodanie agentów (krytyk, sędzia, panel) podnosi jakość I koszt razem - to nie optymalizacja. Sędzia do oceny rozwoju: offline nad snapshotami, tanim modelem, poza ścieżką tury.

### Aktualizacja po rozmowie z Tomkiem — wariant Anthropic-only

Tomek rekomenduje rozważyć rezygnację z Kratosa na VPS-ie i skierowanie wszystkich ról do
Anthropica na firmowej subskrypcji. Usuwa to problem prywatnego DNS, Fortinetu i gatewaya do P4,
ale przed decyzją trzeba ustalić wpływ na limity organizacji.

### Zgoda na kontrolowany eksperyment

Tomek wyraził zgodę na uruchomienie testu Anthropic-only na swoją odpowiedzialność. Ocenił, że
najgorszym oczekiwanym skutkiem jest szybsze wyczerpanie bieżących limitów, które wkrótce się
resetują. Jeśli zużycie okaże się za duże, test ma zostać natychmiast wyłączony.

Zakres tej zgody:

- obejmuje czasowy eksperyment i pomiar;
- obejmuje świadome ryzyko szybszego zużycia obecnego limitu;
- nie jest zgodą na pozostawienie niezmierzonego runtime'u 24/7;
- nie jest zgodą na włączenie wszystkich procesów maintenance bez limitów;
- nie zmienia wymagania, aby nie ujawniać sekretów i mieć prosty kill switch.

Potwierdzone w aktualnym kodzie Borga:

- maintenance jest domyślnie włączony;
- lekki cykl działa domyślnie co 4 godziny, ciężki co 24 godziny;
- domyślne `lightBudget` i `heavyBudget` są `null`, czyli nie stanowią globalnego limitu cyklu;
- light uruchamia consolidator, semantic-extractor i curator;
- heavy uruchamia jedenaście procesów;
- przykładowe limity per przebieg: consolidator 60k, semantic-extractor 60k, reflector 800k,
  ruminator 150k, self-narrator 500k i lived-experience-day-summarizer 160k tokenów;
- autonomia jest domyślnie włączona, ale jej scheduler startuje tylko wtedy, gdy runtime jawnie go
  uruchomi; ma limit 6 wake'ów na 24 h.

Te wartości są bezpiecznikami przed runaway, a nie prognozą codziennego zużycia. Część procesów
może nie wykonać żadnego kosztownego wywołania, jeśli nie ma pracy. Nie wolno jednak uruchamiać
domyślnego pełnego cyklu 24/7 na wspólnym dostępie bez pomiaru.

Najpierw ustalić z Tomkiem/administratorem:

1. czy dostęp Akukiego będzie Claude Team/Enterprise seat, OAuth Claude Code, API key czy firmowy
   proxy i który limit faktycznie jest obciążany;
2. czy limit jest per użytkownik, per credential, per workspace czy wspólny dla organizacji;
3. czy dodatkowe użycie jest włączone i jakie są twarde limity wydatków;
4. czy można utworzyć osobne poświadczenie/projekt dla Akukiego z własnym limitem i raportowaniem.

Jeśli jest to zwykły seat Claude Team, oficjalna dokumentacja Anthropica mówi, że wliczone limity
są per członek, więc wyczerpanie limitu Zosi nie zmniejsza limitów innych osób. To nie rozstrzyga
firmowego proxy, Enterprise usage-based ani płatnego additional usage: te warianty mogą mieć limity
i koszty organizacyjne. Administrator musi potwierdzić faktyczną ścieżkę uwierzytelnienia Akukiego.

Plan zatwierdzonego canary bez zmiany mechanizmów Akukiego:

1. maintenance i autonomię pozostawić wyłączone przy pierwszym smoke teście;
2. zmierzyć usage jednej rzeczywistej tury osobno dla każdego slotu modelu;
3. włączać tylko potrzebne procesy maintenance, pojedynczo, z niskim globalnym budżetem;
4. rejestrować input/output/cache-read/cache-creation tokens per rola i per przebieg;
5. po tygodniu oszacować koszt/limit przy realnym ruchu Areny i dopiero wtedy zatwierdzić 24/7.

Warunki przerwania testu należy ustalić przed startem: przekroczenie uzgodnionego zużycia, brak
telemetrii, niespodziewana pętla wywołań, zauważalny wpływ na pracę zespołu albo niemożność szybkiego
zatrzymania procesu.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 cache_read_input_tokens niezerowe przy powtarzanych turach
- [ ] #2 Role wolumenowe zmierzone: Anthropic z cache vs P4 bez cache
- [ ] #3 Wyłączone procesy dream, które nie są badane
- [ ] #4 Typ firmowego dostępu, właściciel limitu i wpływ na innych członków potwierdzone przez administratora
- [ ] #5 Akuki ma osobny mierzalny limit albo udokumentowany bezpieczny udział w limicie
- [ ] #6 Canary zmierzył turę, maintenance i cache przed uruchomieniem 24/7
- [ ] #7 Globalne budżety light/heavy są jawne i nie pozostają `null` w produkcji bez osobnej zgody
- [x] #8 Tomek zatwierdził krótkotrwały eksperyment Anthropic-only i zaakceptował ryzyko szybszego zużycia limitów
- [ ] #9 Przed startem zapisano limit testu, czas trwania, telemetrię i kill switch
- [ ] #10 Wynik eksperymentu udokumentowany; osobna decyzja podjęta przed runtime'em 24/7
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
POMIAR CACHE ZE SMOKE TESTU (2026-09-01) - dotyczy AC #1 i #2, ale zadnego NIE zamyka.

Jedna tura, claude-opus-4-8, wszystkie 5 rol, przez aiproxy (tryb Anthropic-only). 16 wywolan.
  cache_creation_input_tokens = 44133  -> proxy PRZEPUSZCZA cache_control do Anthropica
  cache_read_input_tokens     = 7067   -> odczyty cache W OBREBIE tury (pozniejsze wywolania
                                          trafiaja w prefiks zapisany przez wczesniejsze)
Mechanizm cache DZIALA przez aiproxy: marker dochodzi, oba liczniki wracaja. To rozstrzyga
najwazniejsza niepewnosc z TASK-022 ("czy aiproxy nie gubi cache_control") - NIE gubi.

AC #1 NIE zamkniete: brzmi "przy POWTARZANYCH turach", a to byla JEDNA tura - odczyty sa
intra-turn, nie t1->t2. Czysta demonstracja: dwie identyczne tury pod rzad, druga pokaze
cache_read z prefiksu zapisanego w pierwszej. Tanie, do zrobienia osobno.
AC #2 (Anthropic z cache vs P4 bez cache) tez otwarte - zmierzona tylko strona Anthropic.
Pod decyzja Anthropic-only (2026-09-01) porownanie z kratosem moze byc bezprzedmiotowe;
do potwierdzenia przy zamykaniu AC #2.

Inne wartosci z tej samej tury (jako punkt odniesienia, nie limit): input=45962, output=1786.
Wysoki input bo 16 wywolan, kazde niesie prefiks + kontekst stadium/roli; zimny cache przy
pierwszym biegu (stad duze cache_creation). Druga identyczna tura powinna przesunac czesc
tego z creation do read.

CROSS-TURN CACHE ZMIERZONY NA VPS (2026-09-01) - domyka AC #1.

Dwie identyczne-w-formie tury pod rzad, ta sama sesja (default) i data-dir
(/var/lib/akuki/data/akuki-smoke), user akuki, claude-opus-4-8 przez aiproxy, z VPS-a.

              tura 1     tura 2
  calls        15         12
  cache_read   16578      23645   (^ +43%)
  cache_create 27818       8537   (v -69%)
  read frac    37%        73%

Podpis persystencji: statyczny prefiks zapisany w turze 1 jest CZYTANY, nie odtwarzany,
w turze 2. Spadek creation o ~69% przy wzroscie read wyklucza, ze tura 2 buduje cache od zera.
Cache przetrwal miedzy turami PRZEZ aiproxy - to zamyka najwazniejsza niepewnosc
(czy proxy nie gubi cache_control i czy wpis zyje cross-turn). AC #1: cache_read niezerowe
przy powtarzanych turach - spelnione (23645 != 0 w drugiej, powtorzonej turze).

Ciaglosc pamieci potwierdzona przy okazji: entity w turze 2 pamieta wymiane z tury 1
(data-dir trzyma epizody cross-turn).

UWAGA na AC #6: tura i cache zmierzone, ale MAINTENANCE wciaz nie - AC #6 NIE zamykam.
AC #2 (Anthropic z cache vs P4 bez cache) tez otwarte; pod decyzja Anthropic-only
porownanie z kratosem moze byc bezprzedmiotowe.
<!-- SECTION:NOTES:END -->
