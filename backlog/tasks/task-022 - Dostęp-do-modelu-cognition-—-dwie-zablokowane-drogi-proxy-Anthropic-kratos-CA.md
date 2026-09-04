---
id: TASK-022
title: >-
  Dostęp do modelu cognition — dwie zablokowane drogi (proxy Anthropic / kratos
  CA)
status: To Do
assignee: []
created_date: '2026-08-25 11:40'
updated_date: '2026-09-01 12:24'
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
- [x] #3 Model cognition wybrany, OSIAGALNY i zweryfikowany realnym wywolaniem, nie zalozeniem
- [x] #4 Kazdy odczyt zapisuje response.model zwrocony przez API, nie ten wyslany w zadaniu
- [ ] #5 Jesli uzyty wariant tymczasowy z przypieciem posrednika: ma jawny komentarz -tymczasowe- i osobne zadanie na usuniecie
- [x] #6 TASK-012 AC #4 zamkniete
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

DECYZJA ZOSI (2026-08-26): model cognition = claude-sonnet-5.

Wybor zamkniety. Pozostale role bez zmian (generative-apis/qwen3-235b-a22b-instruct-2507 na kratosie).
AC #3 nadal otwarte, bo wymaga POTWIERDZENIA REALNYM WYWOLANIEM, a sonnet przez aiproxy dzisiaj
zwracal "All pool tokens are currently rate-limited for sonnet models". Decyzja jest podjeta, dostepnosc
nie jest jeszcze potwierdzona - to dwie rozne rzeczy i nie wolno ich zlaczyc.

KOREKTA PROGU CACHE - moja wczesniejsza analiza byla BLEDNA i przemawiala przeciw tej decyzji.

CO TWIERDZILEM: "prefiks cacheowalny ma 2006 tokenow, prog Opusa to 4096, wiec cache jest no-opem,
czyli koszt nie przemawia dzis za Anthropikiem". Zrodlem tej liczby byl komentarz w borgu:
  src/cognition/deliberation/finalizer.ts:369-370
  "the static prefix is currently ~1,845 estimated tokens, below Opus's 4,096-token cache minimum"

CO JEST PRAWDA: minimalna dlugosc prefiksu cacheowalnego jest ROZNA DLA ROZNYCH MODELI i NIE JEST
monotoniczna miedzy generacjami:
  Claude Opus 5                      512 tokenow
  Claude Sonnet 5, Opus 4.8          1024
  Opus 4.7                           2048
  Opus 4.6, Opus 4.5, Haiku 4.5      4096
Komentarz w borgu mowi "Opus's" bez wersji i pochodzi ze Sprintu 9.9, czyli z czasow Opusa 4.6/4.5.
Dla NICH 4096 jest poprawne. Dla Sonneta 5 prog to 1024.

KONSEKWENCJA, ktora odwraca wniosek:
  prefiks PRZED seedem M1  1684 tokenow  >  1024  -> cache dzialal JUZ WTEDY
  prefiks PO   seedzie M1  2006 tokenow  >  1024  -> dziala nadal, z wieksza rezerwa
Czyli na Sonnecie 5 cache prefiksowy NIE JEST no-opem i nigdy nim nie byl. Marker ttl:"1h"
(finalizer.ts:377) jest ZYWY. Argument kosztowy przemawia ZA Anthropikiem, nie neutralnie.

TO WZMACNIA DECYZJE ZOSI Z INNEGO POWODU, NIZ PODAWALEM. Ekonomia cache'u: odczyt kosztuje ~0.1x
ceny wejscia, zapis 1.25x przy TTL 5 minut i 2x przy TTL 1 godziny. Progi oplacalnosci to odpowiednio
dwa i trzy odczyty tego samego prefiksu. Byt chodzacy miesiacami przekracza je natychmiast. Sciezka
OpenAI-compatible (kratos) nie ma cache W OGOLE - flattenSystem w src/llm/openai-compatible.ts:98-107
wyrzuca cache_control przy sklejaniu blokow system, z komentarzem, ze nie ma odpowiednika w OpenAI.

CZEGO NADAL NIE WIEM I CO TRZEBA ZMIERZYC, NIE ZALOZYC: czy aiproxy Tomka przepuszcza cache_control
do Anthropica i czy odsyla usage.cache_read_input_tokens. Proxy jest w tej sciezce, wiec sam fakt,
ze borg wysyla marker, nie dowodzi, ze cache powstaje. To jest dokladnie AC #1 z TASK-013.
PRZEPOWIEDNIA DO SPRAWDZENIA: na claude-sonnet-5 przy dwoch turach pod rzad drugi odczyt pokaze
cache_read_input_tokens > 0, w okolicy 2000. Zero znaczy albo proxy gubi marker, albo cos unieważnia
prefiks miedzy turami.

LEKCJA METODOLOGICZNA, ta sama co przy puli proxy dwa dni temu: wzialem komentarz w kodzie za dane
o swiecie. Komentarz mowil prawde o modelu, ktory byl aktualny, kiedy go pisano, i nie mial powodu
sie zaktualizowac. Liczby o cudzym API nalezy sprawdzac u zrodla, a nie czytac z komentarza we
wlasnym repo - nawet gdy komentarz jest dobrze napisany i wyglada na swiezy.

SPRAWDZENIE PONOWNE 2026-08-26, po decyzji o sonnecie. NADAL NIE DZIALA.

  claude-sonnet-5             3/3 prob -> rate_limit_error "All pool tokens are currently
                                        rate-limited for sonnet models."
  claude-haiku-4-5-20251001   HTTP 200, tresc "dziala"
Ten sam token i endpoint w obu przypadkach, wiec autoryzacja i siec sa sprawne - blokada jest
na tierze sonneta.

KOREKTA MOJEJ WCZESNIEJSZEJ OBSERWACJI NR 2 - wzorzec komunikatow NIE JEST stabilny.
Zapisalem: "pierwsze zapytanie po przerwie -> No tokens available in pool, kazde kolejne ->
szczegolowy per-tier. Powtorzone w czterech seriach z rzedu."
Dzis pierwsza proba po ponad godzinie ciszy od razu dala wariant PER-TIER, i trzy nastepne tez.
Czyli "cztery serie z rzedu" wystarczylo, zebym uznal wzorzec za regule, a piata seria go lamie.
Do TASK-023 pasuje to jeden do jednego: cztery zgodne obserwacje to nie dowod wzorca, jesli
nie ma zadnej proby falsyfikacji. Ta sama arytmetyka, ktora kaze robic powtorzenia w odczycie
trzyramiennym, obowiazuje przy czytaniu bledow proxy.

UBOCZNY POMIAR, WARTOSCIOWY DLA TASK-013 AC #1: odpowiedz haiku PRZESZLA przez proxy z pelnym
obiektem usage, zawierajacym cache_creation_input_tokens ORAZ cache_read_input_tokens (oba 0 przy
13 tokenach wejscia, czyli zgodnie z oczekiwaniem). Czyli aiproxy NIE obcina usage i licznik
cache'u do nas dociera. To polowa AC #1: wiemy, ze zobaczymy wynik. Nadal NIE wiemy, czy proxy
przepuszcza cache_control W ZADANIU - to sprawdzalne bez sonneta, prefiksem >= 4096 tokenow
na haiku (jego prog to 4096), dwa razy pod rzad.

NARZEDZIE: akuki/diag_model.py - diagnostyka dostepu do modelu cognition (2026-08-26).

  python -m akuki.diag_model                      jednorazowo
  python -m akuki.diag_model --watch 90            czekacz, jedna linia na probe
  python -m akuki.diag_model --watch 90 --proby 60 czekacz z limitem
  python -m akuki.diag_model --model X --kontrola Y

POWOD, DLA KTOREGO TO NIE JEST CURL W PETLI: w tym tygodniu "sonnet nie dziala" znaczylo TRZY
rozne rzeczy na trzech warstwach - brak korzenia CA (UNABLE_TO_GET_ISSUER_CERT_LOCALLY), zerwany
tunel (UND_ERR_CONNECT_TIMEOUT) i wysycona pula (rate_limit_error). Skrypt nie odpowiada
"dziala / nie dziala", tylko nazywa WARSTWE: config / dns / trasa / siec / tls / autoryzacja /
limit / aplikacja / ok.

MODEL KONTROLNY JEST CZESCIA POMIARU, nie ozdoba: bez niego nie da sie odroznic "zablokowany tier
sonneta" od "zablokowane wszystko". Skrypt wola kontrole TYLKO wtedy, gdy model docelowy padl.

KODY WYJSCIA (zeby dalo sie tego uzyc w petli i w CI):
  0 model docelowy odpowiedzial
  1 docelowy zablokowany, kontrolny odpowiada -> limit tieru, nie awaria
  2 nic nie odpowiada -> siec albo autoryzacja
  3 brak konfiguracji

WYPISUJE model ZWROCONY przez API, nie zadany (AC #4), i oznacza rozbieznosc. Wypisuje tez
usage z licznikami cache'u - TAKZE dla modelu kontrolnego, bo dopoki sonnet stoi, kontrola jest
jedynym miejscem, gdzie widac, czy proxy te liczniki odsyla.
LOG: dopisuje JSONL do data/diag/cognition-probe.jsonl. Pytanie brzmi "KIEDY wrocilo", a bez
logu odpowiedz ginie razem z terminalem.
NIE DOTYKA TENANTA: samo zapytanie HTTP, zaden borg, zaden zapis do pamieci. Koszt to
kilkadziesiat tokenow wyjscia na probe.

ZWERYFIKOWANY BIEGIEM, nie tylko typecheckiem: tryb jednorazowy -> kod 1, tryb --watch --proby 2
-> kod 1, log JSONL zapisany. Token wykryty jako sha256 7c8545eb, czyli ten sam, ktory jest
udokumentowany w tym zadaniu.

NOWA OBSERWACJA Z BIEGU - KOD HTTP SIE ZMIENIL:
  25.08 zapisalem dla sonneta i opusa: HTTP 503
  26.08 skrypt raportuje:              HTTP 429, error.type=rate_limit_error
429 jest kodem WLASCIWYM dla limitu (503 znaczy "usluga niedostepna"), wiec to wyglada na skutek
poprawki Tomka. Warte podania mu wprost, bo prosil o konkretne bledy.
Czas odpowiedzi na 429 waha sie od 604 ms do 3825 ms w tej samej serii. Odnotowane jako
OBSERWACJA, bez wyjasnienia - z zewnatrz nie widac, czemu raz szybciej, raz wolniej.

DECYZJA ZOSI (2026-09-01): model cognition = claude-opus-4-8, nie sonnet-5.

Lancuch wyboru: sonnet-5 (21.08) -> opus-5 (25.08) -> sonnet-5 (26.08) -> opus-4-8 (01.09).
Kod default juz zmieniony (commit 0143af2e: src/config/index.ts:322 cognition=claude-opus-4-8).
Prog cache Opus 4.8 = 1024 (jak Sonnet 5), wiec korekta progu z 26.08 obowiazuje bez zmian.

BEZ WNIOSKU O PRZYCZYNIE wczesniejszych porazek sonneta przez aiproxy: smoke test NIE byl
uruchomiony, wiec nie ma pomiaru. Zgodnie ze znane-wady #2 nie dopisuje wyjasnienia
("formatowanie requestu" ani "wysycona pula") - zostaje otwarte do potwierdzenia realnym
wywolaniem na modelu docelowym. AC #3 nadal wymaga tego potwierdzenia.

AC #3, #4, #6 SPELNIONE realnym wywolaniem (pomiar 2026-09-01, smoke test).

claude-opus-4-8 przez aiproxy: DZIALA. 16 wywolan, exit 0, response.model=claude-opus-4-8
na kazdym (AC #3: model wybrany, osiagalny, ZWERYFIKOWANY realnym wywolaniem; AC #4: odczyt
zapisuje model zwrocony przez API, nie zadany). Pelne usage i kontekst w TASK-012.

CACHE PRZEZ AIPROXY POTWIERDZONY POMIAREM (dotyczy TASK-013 AC #1): cache_read_input_tokens
=7067 i cache_creation_input_tokens=44133, oba > 0. Czyli proxy PRZEPUSZCZA cache_control do
Anthropica I ODSYLA liczniki cache. Wczesniejsza przepowiednia (cache aktywny na Anthropicu,
prog opus-4-8 = 1024 < prefiks) potwierdzona na modelu docelowym.

AC #6: TASK-012 AC #4 zamkniete -> spelnione.

CO ZOSTAJE OTWARTE:
- AC #1 (przewidywalna pojemnosc od Tomka): opus-4-8 dzis odpowiedzial, ale jeden udany call
  to NIE gwarancja pojemnosci na miesiace. Nadal do rozstrzygniecia z Tomkiem.
- AC #7 (odblokowanie t0 w TASK-009 AC #11): technicznie odczyt na modelu docelowym jest
  teraz mozliwy - zostawiam ocene domkniecia TASK-009.
- BEZ WNIOSKU O WCZESNIEJSZE PORAZKI: ten smoke testowal opus-4-8, nie sonnet-5/opus-5.
  Nie mowi nic o przyczynie rate-limitow z 25-26.08. Ta przyczyna zostaje otwarta (znane-wady #2).

POTWIERDZENIE NA DOCELOWYM VPS (2026-09-01).

Smoke przeszedl nie tylko lokalnie, ale na produkcyjnej lokalizacji: /opt/akuki/app
(repo na 4d9cca2c, to samo co lokalne HEAD, drzewo czyste), user akuki,
Ollama+bge-m3 (1024) na localhost, aiproxy osiagalny Z VPS-a.
Dwie tury, wszystkie wywolania claude-opus-4-8, response.model zgodny.
Czyli 'claude-opus-4-8 osiagalny przez aiproxy' potwierdzone z faktycznego srodowiska
wdrozenia, nie tylko z maszyny Zosi.

BEZ WNIOSKU O PRZYCZYNE wczesniejszych porazek sonnet/opus-5 - przyczyna (formatowanie
requestu) ustalona osobno przez Zosie; ten pomiar jej nie dotyczy.

Otwarte ACs (#1 typ firmowego dostepu, #5 osobny limit, #7 jawne budzety) to decyzje
Tomka/admina, nie kod.
<!-- SECTION:NOTES:END -->
