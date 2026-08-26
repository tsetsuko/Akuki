---
id: TASK-022
title: >-
  Dostęp do modelu cognition — dwie zablokowane drogi (proxy Anthropic / kratos
  CA)
status: To Do
assignee: []
created_date: '2026-08-25 11:40'
updated_date: '2026-08-26 08:13'
labels: []
dependencies:
  - TASK-008
priority: high
type: spike
ordinal: 1500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Akuki nie ma dzis modelu, na ktorym wolno prowadzic pomiar. To blokuje odczyt t0 z M1 (TASK-009 AC #11) i AC #4 z M0 (TASK-012).

ZASADA, KTORA TO WYMUSZA: ograniczenie rozwojowe ma pochodzic ze STANU PAMIECI, nigdy ze slabszego modelu. Haiku dziala, ale na stale lamaloby te zasade - nie daloby sie odroznic "nie rozwinal sie" od "nie umial pomyslec". Zasada zakazuje modelu SLABEGO, nie zakazuje nie-maksymalnego ani spoza Anthropica.

Sa DWIE drogi i kazda blokuje kto inny.

=== DROGA A: opus/sonnet przez aiproxy Tomka ===

Zmierzone 2026-08-25, tym samym tokenem i endpointem, ktorego uzywa Claude Code
(sha256 tokenu 7c8545eb; ~/.claude/settings.json NIE nadpisuje env, brak pliku poswiadczen):

  claude-opus-5              HTTP 503  "No tokens available in pool"   0/6 prob
  claude-sonnet-5            HTTP 503  to samo                         0/6 prob
  claude-haiku-4-5-20251001  HTTP 200  dziala
  GET /v1/models             "Endpoint not supported by this proxy"

503 przychodzi BEZ Retry-After i bez naglowkow limitu, wiec nie da sie tego zaplanowac.
Pojedyncze zapytanie po kilku minutach ciszy tez pada - to NIE jest efekt zbyt czestego pytania.
Dwa rozne komunikaty na ten sam warunek, zaleznie od naglowka:
  authorization: Bearer  -> proxy_error "No tokens available in pool"
  x-api-key              -> rate_limit_error "All pool tokens are ..."

WNIOSEK (wnioskowanie, nie pomiar): "pula" to zbior poswiadczen nad proxy. Limity subskrypcji
Claude sa per tier, a limit Opusa jest znacznie ciasniejszy niz Haiku - stad konta w puli maja
wyczerpany Opus, ale nadal maja Haiku. Najprawdopodobniejszym konsumentem tej pojemnosci sa
dlugie sesje Claude Code na Opusie, czyli praca nad tym wlasnie projektem. Nie da sie tego
rozstrzygnac z zewnatrz: nie widac, czy proxy priorytetyzuje sesje interaktywne.

ZAMIANA sonnet -> opus (decyzja Zosi 2026-08-25) NIE odblokowuje niczego: oba tiery sa
zablokowane jednakowo.

=== DROGA B: qwen3 przez kratosa ===

kratos ZYJE: HTTP 200 w 60 ms, 22 modele, w tym generative-apis/qwen3-235b-a22b-instruct-2507,
generative-apis/qwen3.5-397b-a17b oraz generative-apis/glm-5.2. Modele skali czolowej, zasady
"nie slaby model" nie lamia. Juz oplacone przez zespol.

BLOKUJE WYLACZNIE TLS: Node pada na UNABLE_TO_GET_ISSUER_CERT_LOCALLY.

ODPOWIEDZ NA PYTANIE ZOSI "jak w takim razie moglam uzywac GLM-a do evali Cortexa":
Cortex NIE PRZECHODZI przez ten certyfikat - on go NIE SPRAWDZA. Trzy miejsca, wprost:
  evals/promptfoo/promptfooconfig.real.yaml:9   NODE_TLS_REJECT_UNAUTHORIZED=0
                                               komentarz: "kratos: cert z wewn. CA (jak -k)"
  evals/promptfoo/gateway.py:101               context.verify_mode = ssl.CERT_NONE
                                               docstring: "BEZ weryfikacji"
  evals/promptfoo/grader_proxy.py:312          to samo; --ca-bundle wlacza weryfikacje
Zadnej sprzecznosci nie ma. Ta sama droga stoi otworem dla Akukiego - pytanie tylko, czy powinna
zostac uzyta, bo Akuki rozni sie od evala czasem zycia procesu.

  promptfoo: minuty, wola tylko kratosa
  Akuki:     MIESIACE, wola tez Anthropica i Arene
NODE_TLS_REJECT_UNAUTHORIZED=0 wylacza weryfikacje dla CALEGO procesu. Dla evala to kontrolowane
ryzyko; dla bytu chodzacego miesiacami to stala dziura, o ktorej za pol roku nikt nie pamieta.

=== LANCUCH CERTYFIKATOW, zmierzony ===

  lisc (kratos)          Aug 23 2026 -> Sep 22 2026    30 DNI
                         sha256 D0:36:41:2C:58:63:0A:7D:F5:54:5A:DC:27:59:59:CE:...
  posrednik cloud.p4.int Oct 13 2022 -> Oct 13 2032    10 LAT
                         CA:TRUE, Key Usage: Certificate Sign, CRL Sign
                         sha256 C5:A1:28:B5:3D:8A:70:CD:68:C4:9F:3B:7B:FA:01:AC:...
                         wystawca: CN = Play Root Certificate Authority
  korzen                 NIE JEST SERWOWANY i nie ma go lokalnie (sprawdzone w M0:
                         /etc/ssl/certs, Firefox NSS, .p12 Zosi - .p12 to INNA hierarchia)

POTWIERDZONE POMIAREM: NODE_EXTRA_CA_CERTS wskazujacy SAM POSREDNIK daje
UNABLE_TO_GET_ISSUER_CERT. OpenSSL wymaga, zeby lancuch konczyl sie na certyfikacie
samopodpisanym, a posrednik nim nie jest. Czyli droga "jeden plik i gotowe" dziala TYLKO
z korzeniem.

=== DLACZEGO SCHEDULER DO PRZEPINANIA CERTYFIKATU NIE ZADZIALA ===

Pomysl Zosi: skoro lisc rotuje co 30 dni, przepinac go automatycznie.
Powod odrzucenia jest LOGICZNY, nie techniczny: scheduler, ktory co miesiac przypina to, co
serwer akurat pokazuje, znaczy "ufamy temu, co przyszlo" - czyli dokladnie rejectUnauthorized:
false, tylko z dodatkowa maszyneria i nowa awaria, gdy scheduler nie wstanie. Przypiecie, ktore
samo sie odnawia z tego, co przyszlo, NIE JEST przypieciem; jest wylaczeniem weryfikacji, ktore
WYGLADA jak zabezpieczenie - a to gorzej niz jawne wylaczenie, bo nikt go nie zakwestionuje.

Intuicja "zautomatyzujmy" byla dobra, wskazala tylko zla warstwe. ROTUJE SIE TYLKO LISC.
Posrednik jest wazny do 2032, wiec przypiecie POSREDNIKA nie potrzebuje schedulera w ogole.

=== WARIANTY, pelny obraz ===

  scheduler + przypiecie liscia    dziala | kod+cron | psuje sie co 30 dni | BEZPIECZENSTWO ZADNE
  NODE_EXTRA_CA_CERTS = posrednik  NIE DZIALA (UNABLE_TO_GET_ISSUER_CERT)
  wlasny fetch + odcisk posrednika dziala | ~40 linii | stabilne do 2032   | dobre, waskie
  NODE_TLS_REJECT_UNAUTHORIZED=0   dziala | brak kodu | zawsze             | ZADNE, caly proces
  korzen od IT                     po prosbie | BRAK KODU | lata           | standardowe

WARIANT Z WLASNYM FETCH JEST MOZLIWY: borg przyjmuje gotowego klienta
(src/llm/openai-compatible.ts:84-86 "Inject a pre-built client"), a SDK openai 6.44.0 przyjmuje
wlasny fetch (client.d.ts:97). Czyli wyjatek DA SIE zawezic do jednego polaczenia - weryfikacja
zostaje wlaczona dla Anthropica i reszty procesu.
UCZCIWY KOSZT: pomijajac weryfikacje OpenSSL tracimy trzy rzeczy robione dotad za darmo -
sprawdzenie wygasniecia liscia, sprawdzenie nazwy hosta, sprawdzenie uniewaznien. Kazda trzeba
dopisac recznie, a to jest ten rodzaj kodu, w ktorym blad nie objawia sie awaria, tylko cichym
brakiem ochrony.

=== REKOMENDACJA ===

Poprosic IT o Play Root Certificate Authority. Jeden plik, zero kodu, potem
NODE_EXTRA_CA_CERTS=/sciezka/do/pliku.crt i wszystko dziala standardowo.
Argument, ktory dalo pytanie o scheduler: "bez korzenia mam do wyboru przypiecie psujace sie
co 30 dni albo wylaczenie weryfikacji na stale w procesie chodzacym miesiacami".

Rownolegle zapytac Tomka o pojemnosc na opus/sonnet - i o to, czy on ma ten korzen, skoro jego
wlasny kod ma juz flage --ca-bundle przygotowana wlasnie na ten wypadek (grader_proxy.py:305).

Wariant tymczasowy z przypieciem posrednika TYLKO jesli obie prosby beda sie ciagnac, i wtedy
z jawnym komentarzem "tymczasowe" plus zadaniem w backlogu na jego usuniecie.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rozstrzygniete z Tomkiem: czy jest przewidywalna pojemnosc na opus/sonnet (osobny token, dzienny limit) - odpowiedz zapisana w tym tasku
- [x] #2 Rozstrzygniete: czy da sie dostac Play Root Certificate Authority i od kogo
- [ ] #3 Model cognition wybrany, OSIAGALNY i zweryfikowany realnym wywolaniem, nie zalozeniem
- [ ] #4 Kazdy odczyt zapisuje response.model zwrocony przez API, nie ten wyslany w zadaniu
- [ ] #5 Jesli uzyty wariant tymczasowy z przypieciem posrednika: ma jawny komentarz -tymczasowe- i osobne zadanie na usuniecie
- [ ] #6 TASK-012 AC #4 zamkniete
- [ ] #7 TASK-009 AC #11 odblokowane - odczyt t0 mozliwy na modelu docelowym
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
SZKIC 1 - DO TOMKA (pula opusa + czy ma korzen)

  Czesc, robie Akukiego na forku borga (galaz akuki-dev). Potrzebuje modelu do roli cognition
  i utknelam na dostepnosci.

  Zmierzone dzisiaj przez aiproxy, tym samym tokenem i endpointem co Claude Code:
    claude-opus-5              -> HTTP 503, "No tokens available in pool"
    claude-sonnet-5            -> HTTP 503, to samo
    claude-haiku-4-5-20251001  -> HTTP 200, dziala
  503 przychodzi BEZ Retry-After, wiec nie wiem, kiedy pojemnosc wraca, i nie umiem tego
  zaplanowac. Pojedyncze zapytanie po kilku minutach ciszy tez pada, wiec to nie jest kwestia
  zbyt czestego pytania.

  Haiku wolalabym nie brac na stale: caly projekt stoi na tym, ze ograniczenie rozwojowe ma
  pochodzic ze stanu pamieci, a nie ze slabszego modelu - inaczej nie odroznie "nie rozwinal sie"
  od "nie umial pomyslec".

  Trzy pytania:
  1. Da sie dostac przewidywalna pojemnosc na Opusa albo Sonnet? Osobny token, dzienny limit,
     cokolwiek, na czym da sie oprzec pomiar?
  2. Jesli nie - czy sensowniej pojsc na kratosa, qwen3-235b albo qwen3.5-397b? Tam blokuje mnie
     tylko to, ze Node nie ma Play Root Certificate Authority w magazynie zaufania. curl -k
     dziala, Node pada na UNABLE_TO_GET_ISSUER_CERT_LOCALLY.
  3. Masz moze ten korzen albo wiesz, kto go wydaje? Pytam, bo grader_proxy.py ma flage
     --ca-bundle przygotowana wlasnie na ten wypadek, wiec chyba juz sie z tym mierzyles.

  To eksperyment na miesiace, wiec zanim zacznę cokolwiek mierzyc, wolę wiedziec, na czym stoi.

  Zosia

OSTATNIE ZDANIE JEST TAM CELOWO: zuzycie Akukiego przez miesiace to inna prosba niz kilka tur
testowych, i lepiej, zeby Tomek uslyszal to od Zosi niz zobaczyl w rachunku.

SZKIC 2 - DO IT (korzen)

  Dzien dobry,
  potrzebuje certyfikatu glownego "Play Root Certificate Authority" w postaci pliku (PEM albo
  CRT), zeby aplikacja w Node.js mogla nawiazac zweryfikowane polaczenie TLS z
  inference.kratos.p4.int.

  Stan obecny: serwer serwuje swoj certyfikat i posrednika cloud.p4.int, ale nie serwuje
  korzenia. Node odrzuca polaczenie z UNABLE_TO_GET_ISSUER_CERT_LOCALLY, bo lancuch musi konczyc
  sie na certyfikacie samopodpisanym obecnym w magazynie zaufania. Samego posrednika nie da sie
  uzyc jako kotwicy - sprawdzilam, daje UNABLE_TO_GET_ISSUER_CERT.

  Sprawdzilam i wykluczylam jako zrodla: /etc/ssl/certs, magazyn Firefoksa (ma tylko P4 Personal
  CA i P4 Personal File with OTP CA) oraz moj plik .p12, ktory nalezy do innej hierarchii
  (P4 Root CA, OU=IT Division).

  Po otrzymaniu pliku wystarczy mi NODE_EXTRA_CA_CERTS - nie potrzebuje zadnych zmian po Waszej
  stronie.

  Zosia Gorzeba

ARGUMENT, KTOREGO WARTO UZYC, JESLI KTORAS PROSBA UTKNIE:
"Bez korzenia mam do wyboru: przypiecie certyfikatu, ktore psuje sie co 30 dni razem z jego
rotacja, albo wylaczenie weryfikacji TLS na stale w procesie chodzacym miesiacami. Korzen to
jeden plik i wtedy wszystko dziala standardowo."
To brzmi jak prosba inzynierska, a nie jak niewygoda.

DROGA B ODBLOKOWANA (2026-08-25). Korzen znaleziony, TLS dziala, model odpowiada.

ODPOWIEDZ TOMKA, ktora to rozstrzygnela: "ten cert mozesz uzyskac z dowolnego repo wlacznie
z cortex". Mial racje, a moje ustalenie z M0 bylo NIEPELNE - sprawdzilem magazyn systemowy,
Firefox NSS i plik .p12 Zosi, ale NIE PRZESZUKALEM JEJ WLASNYCH REPOZYTORIOW.

KORZEN LEZY W: /home/zosia/projects/ai/efman-classifier/certs/play-root-ca.crt
  subject = issuer = CN = Play Root Certificate Authority   <- samopodpisany, czyli korzen
  notBefore Aug 24 2016, notAfter Aug 24 2036
(w cortexie go nie ma; jest w efman-classifier)

TEST ROZSTRZYGAJACY, przebieg warstwa po warstwie:
  Node BEZ korzenia                    UNABLE_TO_GET_ISSUER_CERT_LOCALLY
  Node Z korzeniem, bez klucza         HTTP 401     <- TLS PRZESZEDL, stanelo na autoryzacji
  curl --cacert, bez -k, bez klucza    HTTP 401 w 0.078s
  Node Z korzeniem + klucz, /v1/models 22 modele
  Node Z korzeniem + klucz, chat       model=qwen3-235b-a22b-instruct-2507
                                       tresc="Tak, dzialam." (po polsku)
                                       usage={prompt:28, completion:7}

Czyli: NODE_EXTRA_CA_CERTS=<ten plik> i weryfikacja dziala normalnie. Zero wlasnego kodu TLS,
zero NODE_TLS_REJECT_UNAUTHORIZED=0, zero przypinania odciskow. Wszystkie warianty obejsciowe
z tabeli wariantow SA JUZ NIEPOTRZEBNE.

borg obsluguje ten model poprawnie: max-tokens.ts:17 dopasowuje wzorcem
/^(?:[^/]+\/)?qwen3(?:[-._].+)?$/, wiec generative-apis/qwen3-235b-a22b-instruct-2507 dostaje
16384 tokenow wyjscia zamiast cichego fallbacku 8192.

PULAPKA PO DRODZE, warta zapamietania: miedzy jednym sprawdzeniem a drugim ZERWAL SIE VPN.
Objaw wygladal jak problem z certyfikatem, ale nim nie byl:
  bez korzenia:  UNABLE_TO_GET_ISSUER_CERT_LOCALLY   (blad certyfikatu)
  z korzeniem:   UND_ERR_CONNECT_TIMEOUT             (blad sieci)
ZMIANA WARSTWY BLEDU byla sygnalem, ze certyfikat juz dziala. Diagnoza: ip -brief link show
nie pokazywalo ZADNEGO interfejsu tunelu, a ip route get 172.18.43.220 szlo przez domowy
router (192.168.1.1 dev wlp2s0). Procesy FortiClienta zyly (fctsched, confighandler, firewall),
ale procesu vpn nie bylo. Po podniesieniu tunelu: trasa przez ppp0, HTTP 401 w 78 ms.

CO MOWI TOMEK O DRODZE A: Sonnet 5 powinien dzialac niezaleznie od modelu subskrypcji, czy przez
proxy, czy bezposrednio przez claude.ai; poprosil o konkretne bledy. Wazny szczegol dla niego:
OBA komunikaty pochodza z WARSTWY PROXY, nie od Anthropica - "proxy_error" to jego typ bledu,
a GET /v1/models zwraca "Endpoint not supported by this proxy".

JEGO ZASTRZEZENIE DO DROGI B: male okno kontekstowe ich modeli. Do sprawdzenia z liczbami -
prefiks statyczny promptu Akukiego zmierzony na ~2000 tokenow po zasianiu seeda, a qwen3-235b
ma wg notatek M0 250k wejscia. Warto dopytac, czy chodzi mu o wejscie czy o wyjscie.

JEGO WSKAZOWKA: na kratosie mozna utworzyc WLASNY klucz i zaznaczyc aif app access.
Dzis uzywany jest klucz z pass cortex/llm-api-key (prefiks ai_3). Wlasny klucz dla Akukiego
odseparowalby jego zuzycie od Cortexa - warte zrobienia niezaleznie od wyboru drogi.

KOREKTA MOJEGO WNIOSKU O PRZYCZYNIE (2026-08-26). Bylem w bledzie.

CO NAPISALEM 2026-08-25, jawnie oznaczajac jako wnioskowanie a nie pomiar:
  "limity subskrypcji Claude sa per tier (...) najprawdopodobniejszym konsumentem tej pojemnosci
  sa dlugie sesje Claude Code na Opusie, czyli praca nad tym wlasnie projektem"

CO MOWI TOMEK PO ZAJRZENIU W LOGI:
  przyczyna byla po stronie ANTHROPICA - Overloaded. Proxy probowalo przejsc przez wszystkie
  tokeny w puli, kazdy zwracal blad, wiec kazdy zostal oznaczony jako Cooldown, i dlatego
  zwracalo "No tokens available in pool".

Czyli: pomiary byly poprawne, WYJASNIENIE nie. Nie chodzilo o zjadanie puli przez sesje CLI,
tylko o kaskade z gory. Lekcja: przy pomiarze z zewnatrz widac SKUTEK, a przyczyne widac
w logach po stronie uslugi - i wniosek o przyczynie nalezalo zostawic jako pytanie do Tomka,
a nie jako najprawdopodobniejsza hipoteze.

STAN PO POPRAWCE TOMKA - SPRAWDZONY 2026-08-26 09:21 i 10:12, NADAL NIE DZIALA:
  claude-sonnet-5  "All pool tokens are currently rate-limited for sonnet models.
                    Please try again later or switch models."
  claude-opus-5    "All pool tokens are currently rate-limited for opus models. ..."
  claude-haiku-4-5-20251001  DZIALA

TRZY NOWE OBSERWACJE, ktorych 25.08 nie mialem:

1. PELNY KOMUNIKAT MOWI "for <tier> models" - proxy trzyma stan limitu PER TIER, a sonnet jest
   zablokowany tak samo jak opus. Wczesniej widzialem tylko uciety wariant.

2. DWA KOMUNIKATY UKLADAJA SIE WE WZORZEC, nie losowo:
   pierwsze zapytanie po przerwie -> "No tokens available in pool"
   kazde kolejne                  -> szczegolowy per-tier
   Powtorzone w czterech seriach z rzedu.

3. NAGLOWKI NIE ROBIA ROZNICY. Sprawdzone: x-api-key, authorization: Bearer,
   +anthropic-beta: oauth-2025-04-20, +User-Agent: claude-cli/..., oraz oba naraz.
   Wszystkie daja identyczny wynik, wiec to nie jest kwestia routingu po naglowku.

ASYMETRIA DO WYJASNIENIA PRZEZ TOMKA (obserwacja, NIE hipoteza - nie powtarzam bledu):
  sesja Claude Code jest OPUSEM 5 i dziala w tej chwili
  ten sam token (sha256 7c8545eb), ten sam ANTHROPIC_BASE_URL
  ~/.claude/settings.json nie ma zadnego nadpisania env, nie znalazlem pliku poswiadczen
  a surowe API na tym samym tokenie dostaje "all pool tokens rate-limited for opus"
Czego NIE WIEM: czy sesja na pewno idzie przez to proxy. Nie znalazlem nadpisania, ale moze
istniec magazyn poswiadczen, ktorego nie zobaczylem (np. keyring).

URUCHOMIONY CZEKACZ: petla probujaca sonneta co 90 s, do 60 prob (~90 min), konczaca sie
w momencie, gdy model odpowie.
<!-- SECTION:NOTES:END -->
