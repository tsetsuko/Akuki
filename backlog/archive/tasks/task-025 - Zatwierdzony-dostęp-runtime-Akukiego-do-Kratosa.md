---
id: TASK-025
title: Zatwierdzony dostęp runtime’u Akukiego do Kratosa
status: To Do
assignee: []
created_date: '2026-08-28'
updated_date: '2026-09-04 09:23'
labels: []
dependencies: []
priority: high
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Oracle VPS nie rozwiązuje `inference.kratos.omc.hdp.it.p4` ani `inference.kratos.p4.int` i nie ma
potwierdzonego routingu do prywatnej sieci Play. Bez rozwiązania tego problemu Akuki-aware runtime
nie może użyć Kratosa do modeli wolumenowych ani embeddingów.

Preferowana kolejność rozwiązań:

1. Akuki-aware runtime na zarządzanym hoście wewnątrz Play; sposób uruchamiania Borga wynika z
   kodu Akukiego, nie z architektury Sola;
2. zatwierdzony, wąski gateway/proxy do Kratosa dla Oracle VPS;
3. zarządzany VPN na VPS z prywatnym DNS, split routingiem i ścisłymi ACL;
4. reverse SSH przez laptop wyłącznie jako zatwierdzony development.

### Aktualizacja po rozmowie z Tomkiem

Tomek opisał warunkowo następujący wariant infrastrukturalny:

1. zainstalować i skonfigurować klienta Fortinet na VPS-ie;
2. potwierdzić, że Kratos odpowiada z VPS-a;
3. jeśli VPS ma służyć również jako gateway dla innych hostów, skonfigurować `ip_forward` oraz
   odpowiednie reguły NAT/mangle;
4. wystawić osobny port proxy, np. TCP 2222, ograniczony w OCI tak samo jak SSH — wyłącznie do
   publicznego IP Zosi;
5. skierować ruch laptopa do P4 przez ten gateway po wyłączeniu lokalnego Fortinetu.

To jest opis wysokopoziomowy. Sam Tomek zaznaczył, że nie jest to gotowa instrukcja do wykonania.
W szczególności `ip route` nie przyjmuje gatewaya w formie `IP:port`; potrzebny byłby dodatkowy,
konkretnie wybrany mechanizm tunelowania lub proxy. NAT/mangle nie zamienia samodzielnie portu TCP
w router całej podsieci.

Dla zakresu Akukiego należy rozdzielić dwa przypadki:

- **tylko runtime na VPS-ie potrzebuje Kratosa** — klient Fortinet na VPS-ie może zapewnić ruch
  wychodzący bez publicznego portu proxy, `ip_forward` i udostępniania P4 laptopowi;
- **VPS ma być współdzielonym gatewayem do P4** — to osobny, znacznie szerszy projekt bezpieczeństwa
  i sieci, nie wymaganie Akukiego. Potrzebuje uwierzytelnienia, szyfrowania, ACL, host firewalla,
  monitoringu, rotacji poświadczeń i formalnej zgody właściciela sieci.

Tomek wskazał też wariant preferowany operacyjnie: zrezygnować z Kratosa na VPS-ie i użyć
Anthropica dla wszystkich ról. Ten wariant jest śledzony kosztowo w TASK-013; nie można go wdrożyć
bez pomiaru. Tomek zatwierdził ograniczony czasowo eksperyment Anthropic-only i zaakceptował ryzyko
szybszego wyczerpania bieżących limitów; produkcja 24/7 nadal wymaga osobnej decyzji po teście.

Reverse SSH musi nasłuchiwać tylko na `127.0.0.1` VPS-a i kierować ruch wyłącznie do Kratosa:443.
Nie wolno ustawić base URL na adres IP i wyłączyć TLS. Klient musi zachować właściwą domenę dla SNI
i weryfikacji certyfikatu oraz załadować zatwierdzony Play Root CA przed startem Node.

Nie instalować VPN-u i nie zmieniać DNS, `/etc/hosts`, SSH, firewalla ani systemd bez osobnej zgody.
Logika VPN, proxy i tunelu nie należy do `BotArenaAdapter` ani `AkukiRunner`; jest własnością
środowiska deploymentowego.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tomek potwierdził kanoniczną domenę Kratosa i środowisko, w którym działa Sol
- [ ] #2 Zespół sieciowy zatwierdził docelową ścieżkę dostępu oraz jej zakres
- [ ] #3 DNS, routing, SNI i pełna walidacja certyfikatu działają bez wyłączania TLS
- [ ] #4 Sekrety i Play Root CA są dostarczane poza repozytorium, z właściwymi uprawnieniami
- [ ] #5 Smoke test modeli i embeddingów działa z użytkownika usługi, bez ujawnienia sekretów
- [ ] #6 Rozwiązanie produkcyjne nie zależy od laptopa Zosi
- [ ] #7 Ustalono, czy wymagany jest tylko outbound VPS→Kratos, czy osobny gateway dla innych hostów
- [ ] #8 Jeśli gateway nie jest wymagany, żaden dodatkowy publiczny port proxy nie jest otwarty
- [ ] #9 Opis Fortinet/NAT został zweryfikowany i zatwierdzony przez administratora sieci przed wdrożeniem
<!-- AC:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: claude
created: 2026-09-04 09:23
---
ZAMKNIĘTE JAKO NIEAKTUALNE 2026-09-04 — nie jako zrobione. Żadne z dziewięciu kryteriów akceptacji nie zostało spełnione i nie zostanie: decyzją z 2026-09-02 cognition Akukiego działa wyłącznie na modelach Anthropic (claude-opus-4-8), a droga przez Kratosa — prywatny DNS, klient Fortinet na VPS-ie, Play Root CA, wewnętrzny endpoint inference — jest porzucona. To decyzja, nie rozwiązanie techniczne: DNS z VPS-a do sieci Play nadal nie działa i nikt go nie naprawił.

Dowód, że droga jest zamknięta także w kodzie: borg/src/akuki/smoke-config.ts:17-19 definiuje FORBIDDEN_KRATOS_HOSTS z inference.kratos.p4.int oraz inference.kratos.omc.hdp.it.p4, a smoke-config.ts:103 odrzuca je w trybie AKUKI_ANTHROPIC_ONLY=1. Domyślny model cognition to claude-opus-4-8 (borg/src/config/index.ts:322).

Dowód, że dostęp do modeli nie jest już blokerem: smoke test na VPS-ie 2026-09-01 przeszedł — dwie tury z /opt/akuki/app jako użytkownik akuki, wszystkie wywołania claude-opus-4-8 przez aiproxy, response.model zgodny, cache czytany między turami (cache_read_input_tokens 16578 → 23645). Zapis w TASK-022 i TASK-013.

Co z tego zadania żyje dalej i gdzie: pozostałą bramą do uruchomienia Akukiego na Arenie jest kod connectora (TASK-011); przygotowanie VPS-a jako usługi — TASK-024; koszty i limity firmowego dostępu do Anthropica — TASK-013. Zasada „VPN, proxy i tunel nie należą do BotArenaAdapter ani AkukiRunner” obowiązuje dalej i jest zapisana w TASK-011 oraz w KNOWN-ISSUES.md.

Jeśli Kratos kiedykolwiek wróci do zakresu, to nowe zadanie po decyzji, nie odgrzanie tego.
---
<!-- COMMENTS:END -->
