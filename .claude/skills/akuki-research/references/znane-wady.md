# Znane wady — rzeczy, które już raz zostały powiedziane

Ten plik istnieje, bo instrukcja przekazana w rozmowie ginie razem z sesją. Jeśli pada zdanie
„już to raz mówiłam", to jest właściwe miejsce na zapis, a **nie** notatka w zadaniu w backlogu:
notatki w zadaniach czyta się, gdy się pracuje nad tym zadaniem, a te reguły obowiązują zawsze.

Każdy wpis ma dowód z tego projektu. Nic tu nie jest wymyślone „na wszelki wypadek".

---

## 1. Zapytanie do Tomka — struktura jest ustalona i nie wolno jej zmieniać

**Reguła: struktura nie różni się nawet o jeden przecinek.** Nie przestawiać sekcji, nie
skracać, nie „poprawiać" stylu, nie zamieniać listy pomiarów na prozę, nie dopisywać uprzejmości.
Zmienia się wyłącznie treść pomiarów i pytań.

Wzorzec obowiązujący (TASK-022, „SZKIC 1 - DO TOMKA"), dosłownie:

```
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
```

Siedem elementów, w tej kolejności:

1. **Jedno zdanie kontekstu** — co buduję, na jakiej gałęzi, i na czym utknęłam. Bez wstępu.
2. **Pomiary jako lista**, poprzedzone zdaniem mówiącym, CZYM i JAK zmierzone (tym samym tokenem,
   tym samym endpointem). Surowe kody i cytowane komunikaty błędów. Zero interpretacji.
3. **Czego pomiar NIE mówi** — tu: brak `Retry-After`, więc nie da się tego zaplanować.
4. **Zdanie wykluczające** oczywistą kontrhipotezę, którą odbiorca i tak postawi — tu: pojedyncze
   zapytanie po ciszy też pada, więc to nie kwestia częstotliwości. Bez tego pierwsza odpowiedź
   Tomka będzie brzmiała „nie pytaj tak często".
5. **Dlaczego łatwe wyjście jest nie do przyjęcia**, uzasadnione zasadą projektu, nie preferencją.
6. **Pytania numerowane**, każde samodzielne, każde z nazwanym konkretnym blokerem. Trzy, nie
   siedem.
7. **Zdanie o prawdziwym koszcie** na końcu, i **podpis**.

Punkt 7 jest tam celowo i nie wolno go usunąć jako „zmiękczenia": zużycie Akukiego przez miesiące
to inna prośba niż kilka tur testowych, i lepiej, żeby Tomek usłyszał to od Zosi, niż zobaczył
w rachunku. To samo dotyczy szkicu do IT (TASK-022, „SZKIC 2 - DO IT") — ta sama kolejność:
stan obecny, co już wykluczone, czego dokładnie proszę, co wystarczy po ich stronie.

**Wiadomość podpisuje autorka projektu, więc pisze się ją jej głosem.** Nie wstawiać żargonu,
którego by nie użyła, i nie chować pomiarów w prozie — lista jest po to, żeby Tomek mógł ją
przeczytać w pięć sekund.

---

## 2. Nie podawać wywnioskowanej przyczyny jako najprawdopodobniejszej hipotezy

**Co się stało.** Zmierzyłem „No tokens available in pool" i napisałem, że najprawdopodobniejszym
konsumentem puli są długie sesje Claude Code na Opusie. Oznaczyłem to jako wnioskowanie, nie pomiar
— i to nie wystarczyło. Tomek zajrzał w logi: przyczyną było `Overloaded` po stronie Anthropica,
proxy przeszło całą pulę tokenów, każdy zwrócił błąd, każdy dostał Cooldown.

**Reguła.** Z zewnątrz widać SKUTEK. Przyczyna jest w logach po stronie usługi. Wniosek o przyczynie
zostawia się jako pytanie do osoby, która ma te logi — nie jako hipotezę z oceną
prawdopodobieństwa. Pomiar zapisujemy, wyjaśnienie zostawiamy otwarte.

Zapis w TASK-022: „pomiary byly poprawne, WYJASNIENIE nie".

---

## 3. Komentarz w kodzie nie jest danymi o cudzym API

**Co się stało.** `finalizer.ts:369-370` mówi „below Opus's 4,096-token cache minimum". Wziąłem 4096
za próg cache'u i policzyłem, że prefiks 2006 tokenów się nie cachuje — czyli że argument kosztowy
nie przemawia za Anthropikiem. Nieprawda: próg zależy od modelu (Opus 5 — 512, Sonnet 5 — 1024,
Opus 4.7 — 2048, Opus 4.6/4.5 i Haiku 4.5 — 4096). Komentarz mówił prawdę o modelu aktualnym
w chwili pisania (Sprint 9.9, czyli Opus 4.6) i nie miał powodu się zaktualizować. Dla wybranego
Sonneta 5 cache był aktywny cały czas.

**Reguła.** Liczby o cudzym API — progi, limity, ceny, okna kontekstowe — sprawdza się u źródła,
nawet gdy komentarz w repo jest dobrze napisany i wygląda świeżo. Komentarz datuje się sam z chwili
napisania; API nie.

---

## 4. Objaw nie jest diagnozą

**Co się stało.** Skrypt symulatora kończył się kodem 13 z „Detected unsettled top-level await".
Uznałem to za zakleszczenie. Nic nie trzymało pętli zdarzeń Node otwartej, więc proces poddawał się
przed końcem pierwszej tury — wystarczył `setInterval` jako heartbeat.

**Reguła.** Najtańsza diagnostyka idzie PIERWSZA, nie trzecia: heartbeat,
`process.on('unhandledRejection')`, sprawdzenie czy plik wynikowy rośnie. Nazwa błędu opisuje objaw,
nie mechanizm.

---

## 5. Nie przepuszczać pomiaru przez `tail` ani inny filtr

**Co się stało.** Pełny suite poszedł przez `| tail -30`, więc powłoka zaraportowała kod wyjścia
`tail`, czyli 0. Suite wyglądał na zielony, zwracając 1. Do tego w pliku zostało 30 ostatnich linii,
więc nie dało się odczytać listy padających plików.

**Reguła.** Wynik pomiaru zapisuje się w całości, a kod wyjścia czyta z procesu, który się mierzy.
Ta sama klasa błędu co „przewidziałem, że `npm ci` naprawi porażki w `scripts/*`" — pomyliłem to,
CZYM zainstalowano zależności, z tym, CO wołają testy (wołają `pnpm`, niezależnie od układu
`node_modules`). Wystarczyło przeczytać `scripts/debug.test.ts` PRZED postawieniem przepowiedni.

---

## 6. Test, którego nie da się pokazać jako padającego, jest gorszy niż brak testu

**Co się stało.** Strażnik osieroconych parametrów dopasowywał nazwę jako podciąg. `figure` trafiało
w słowo `figures` w domyślnym `epistemic_posture`, `gain` trafiłoby w `again`. Test był zielony,
nie sprawdzając niczego.

**Reguła.** Do każdego strażnika idzie test dowodzący, że wykrywa sztuczne naruszenie. Zielony
wynik bez dowodu na czerwony jest bez wartości. To ta sama zasada, co „zielony wynik testu
internalizacji przy t0 znaczy zepsuty pomiar".

---

## 7. Nie wpisywać nic w pamięć Akukiego jako Zosia

**Co się stało.** Zrobiłem trzy pierwsze tury, wpisując tekst jako autorka projektu, bez pytania
o zgodę. W pamięci Akukiego wylądował zmyślony przeze mnie fakt z jej życia prywatnego, którego
nikt nie potwierdził. Trzeba było wymazać tenant i zacząć od nowa.

**Reguła.** Tury na żywym tenancie prowadzi ona. Ja uruchamiam wyłącznie biegi na **kopiach**
katalogu, i mówię wprost, że to sprawdzenie hydrauliki, a nie pomiar.

---

## 8. Pomiar bez dowodu, że wejścia doszły do mierzonego procesu

**Co się stało.** Sprawdzałem, jaką konfigurację embeddingów rozwiązuje borg, i wypisałem wynik:
`dataDir: /home/zosia/.borg`, model `text-embedding-qwen3-embedding-8b`, wymiar 4096, endpoint
`localhost:1234`. Przedstawiłem to jako przyczynę awarii u Zosi. Był to pomiar **domyślnej**
konfiguracji borga, bo `set -a; . ../connector/.env; set +a` nie wniosło ani jednej zmiennej —
plik został wcześniej nadpisany szablonem. Zmierzyłem coś prawdziwego o czymś innym.

Ten sam błąd powtórzyłem chwilę później, gdy zdiagnozowałem brak `BORG_EMBEDDING_API_KEY` jako
przyczynę. Tę hipotezę zdążyłem sprawdzić i odrzucić — bez klucza embeddingi działają, bo Ollama go
ignoruje — ale byłem o jedno zdanie od opublikowania jej jako ustalenia.

**Reguła.** Przed odczytaniem wyniku wypisz wejścia i sprawdź, że są niepuste. Jedna linia
`echo "VAR=[$VAR]"` przed pomiarem oddziela „zmierzyłem twoją konfigurację" od „zmierzyłem
domyślną". Bez tego pomiar jest poprawny i nie na temat, a to gorsze niż brak pomiaru, bo brzmi jak
odpowiedź.

Wersja ogólniejsza tej samej zasady, obok reguły 5 o filtrach: **filtr psuje wyjście pomiaru,
brakujące wejście psuje jego temat.** Sprawdzać oba końce.

**Gdy przyczyny nie da się ustalić, mówić to wprost.** Konfiguracji tamtego przebiegu u Zosi nie
odtworzyłem, bo plik już nie istniał. Właściwą odpowiedzią było „nie ustalę przyczyny, oto co jest
teraz sprawdzone", nie najlepsza dostępna hipoteza. To ta sama lekcja co reguła 2, tylko o własnym
pomiarze zamiast o cudzej usłudze.

---

## 9. Dwie encje o tym samym imieniu — tożsamość rozpoznawana dwoma kluczami

**Co się stało.** W żywej pamięci były dwa wiersze o nazwie `Zosia`: jeden z dziewięcioma
interakcjami i zaufaniem 0,778, drugi z trzema i 0,667. Rozpoznanie rozmówcy idzie dwiema
niezależnymi drogami. Po nazwie — `resolve(name)` znajduje istniejącą encję po kanonicznej nazwie
i aliasach. Po identyfikatorze zewnętrznym — `resolveExternal(...)` szukał **wyłącznie** po parze
(`source`, `external_id`), a gdy mapowania nie znalazł, zakładał nową encję bez żadnej kontroli
nazwy. Konektor Areny woła drogę drugą, więc pierwsza wiadomość Zosi przez Arenę **musiała**
utworzyć drugą encję. Naprawa etykiety rozmówcy z 2026-09-08 nie mogła temu zapobiec, bo operuje
na drodze po nazwie.

W rozmowie nic tego nie zdradzało, bo obie encje nazywają się tak samo — objawem była wyłącznie
liczba w bazie. To ta sama awaria co `alice`, tylko cichsza.

Kosztowało to dwie rzeczy naraz. Powściągliwość (M3) maleje z liczbą interakcji z partnerem, więc
9 i 3 dają inną liczbę niż 12. A figura przywiązania rozwiązuje się **po nazwie** i szukanie po
nazwie zwraca pierwsze trafienie po dacie powstania, czyli zawsze starszą encję — podczas gdy
partnerem tury na Arenie jest młodsza. Efekt: obecność figury przywiązania wypadała w turach
z Areny fałszywie, więc nie działała ani ulga w powściągliwości, ani wzmocnienie wagi pamięci dla
zaskoczeń o niej. To jedyny fragment attachmentu, na który badania dają licencję (§16), i wypadał
dokładnie w kanale, w którym Akuki żyje.

**Reguła: tożsamość rozpoznawana dwoma kluczami to dwie tożsamości, dopóki któraś droga nie
zaczyna sprawdzać drugiej.** Przy każdym nowym kanale wejścia pytaj wprost, po czym on kluczuje
osoby i co się stanie z kimś, kogo pamięć już zna pod tym imieniem. Rozdzielenie osoby nie objawia
się w rozmowie — objawia się w liczbie, więc szuka się go pomiarem, nie czytaniem odpowiedzi.

**Reguła odwrotna, ważniejsza przy naprawie.** Dopasowanie po imieniu bez warunku „nikt tej encji
jeszcze nie zajął" zleje dwóch różnych rozmówców o tym samym wyświetlanym imieniu. **Rozdzielenie
jest naprawialne, zlanie nie** — po zlaniu nic w bazie nie mówi, które epizody i które przesłanki
zaufania pochodziły od kogo. Borg broni tego osobnym testem
(`durably resolves distinct external senders without collapsing equal display names`) i ten test
musi przechodzić po każdej zmianie w rozpoznawaniu rozmówcy.

**Przy ustalaniu, co wskazuje na którą encję, skan na równość nie wystarcza.** Pierwszy skan objął
kolumny ze słowem `entity` w nazwie i porównywał identyfikator operatorem `=`; wyglądał kompletnie
i pominął trzy klasy wierszy: tablice identyfikatorów zapisane jako tekst
(`activity_events.participant_entity_ids` i cztery listy w dyrektywach twórczyni), układ „nazwa
cechy plus wartość" (`episode_participants` trzyma identyfikator w kolumnie `value`, a ani `term`,
ani `value` nie zawierają słowa `entity`), oraz cały magazyn wektorowy, gdzie tabela epizodów ma
własne pola na uczestników i audiencję. Liczbę wierszy wskazujących na encję liczy się przez
**podciąg po wszystkich kolumnach** plus przeszukanie plików LanceDB. Scalanie albo usuwanie
oparte na skanie po równości zostawia sieroty w miejscach, których ten skan nie umiał pokazać.

---

## 10. Ogon próbki nie jest rozkładem

**Co się stało.** Odczyt M3 z żywej pamięci wypisywał dziesięć ostatnich rozliczeń predykcji.
Wyszło z nich, że średni błąd przewidywania to 0,115, a największy 0,2 — i na tej podstawie
powstało podejrzenie, że Akuki ocenia własne pomyłki pobłażliwie (TASK-037). Odczyt całych 35
rozliczeń pokazał co innego: wartości od 0,05 do 0,9, jedenaście powyżej 0,3, średnia 0,2614.
Dziesięć ostatnich to była końcówka wieczoru — tury pożegnalne, w których rzeczywiście nic nie
zaskakiwało. Przepowiednia postawiona przed uruchomieniem pełnego odczytu („max 0,2, najwyżej
sześć różnych wartości") była błędna po obu stronach, i to ona pokazała skalę pomyłki.

**Reguła.** Zanim z serii liczb wyciągnie się wniosek o mechanizmie, czyta się **całą** serię,
a przynajmniej jej rozkład: minimum, maksimum, medianę i liczbę wartości powyżej progu, o który
chodzi. `LIMIT 10 ORDER BY created_at DESC` jest domyślnym kształtem każdego podglądu i nie jest
próbką losową — ostatnie wiersze pochodzą z jednego, najświeższego kontekstu, więc mierzą ten
kontekst, nie zjawisko. To trzeci wariant tej samej rodziny co reguła 5 (filtr psuje wyjście
pomiaru) i reguła 8 (brakujące wejście psuje jego temat): **wycinek psuje jego zakres.**

**Druga połowa tej samej lekcji: zanim oskarżysz ocenę modelu, sprawdź, o co go zapytano i co
dostał.** Podejrzenie celowało w liczbę, którą model wystawia sam sobie. Wina leżała gdzie
indziej — w prompcie nie było ani wieku otwartego oczekiwania (więc polecenie „rozliczaj tylko
to, czego ta tura dotyczy" nie miało na czym się oprzeć), ani informacji, czego oczekiwanie ma
dotyczyć (więc co czwarte dotyczyło własnej następnej wypowiedzi Akukiego, czyli rzeczy
niefalsyfikowalnej). Oba defekty wyglądają w liczbach dokładnie jak pobłażliwa samoocena.
Mnożnik nałożony na tę liczbę zamaskowałby je oba, i dlatego borg/CLAUDE.md zakazuje takich
poprawek: naprawa należy do tego, co model dostaje albo o co jest proszony.

---

## 11. Weryfikacja kopii: `diff` list sum kontrolnych bez wspólnego sortowania kłamie

**Co się stało.** Przy kopii zrobionej przed scaleniem encji (2026-09-11) porównanie listy sum
policzonej na VPS-ie z listą policzoną po rozpakowaniu archiwum na laptopie pokazało dziesiątki
różnic. Wyglądało to na uszkodzoną kopię, a było wyłącznie **inną kolejnością linii**: obie
maszyny mają inne ustawienia językowe, więc `sort` układa te same wiersze inaczej. Sumy były
identyczne od początku — porównanie z wymuszonym `LC_ALL=C sort` po obu stronach dało zgodność
143 plików bajt w bajt.

**Reguła.** Porównanie dwóch list generowanych na różnych maszynach robi się po **jednakowym,
niezależnym od ustawień językowych sortowaniu**: `LC_ALL=C sort` na obu plikach przed `diff`.
Dotyczy to także procedury odtwarzania po awarii w `akuki-backup-odtworzenie.md` — tam ten fałszywy
alarm trafiłby w najgorszy moment, bo zatrzymałby odtwarzanie sprawnej kopii.

---

## 12. Parametr zasiewu bez czytelnika, i czytelnik zbudowany w dwoch miejscach

**Co sie stalo.** Zosia poprosila o empatie i optymizm jako cechy Akukiego. Wczesniejsza
notatka o zaparkowanych dzwigniach mowila, ze empatia nie ma kandydata na czytelnika, wiec
parametr by sie nie oplacil. Bylo to za szybkie: borg mial czytelnika od poczatku. Mieszanie
nastroju wazy afektywny odczyt cudzej wypowiedzi liczba `incomingMoodWeight`, a ostroznosc
w sygnale powsciagliwosci podbija sie wylacznie przy ujemnym nastroju. Empatia nie wymagala
zadnego nowego mechanizmu -- wymagala tego, zeby temperament przejal istniejaca stala.
Optymizm wymagal jednej zmiany: nastroj zanikal przez mnozenie, czyli do zera, a teraz zanika
do zadanego punktu spoczynku.

**Regula pierwsza.** Zanim powiesz, ze proponowana cecha nie ma czytelnika, przeszukaj stale
konfiguracyjne borga, a nie tylko liste wlasnych mechanizmow. Wiekszosc cech temperamentu, ktore
brzmia jak nowy podsystem, jest w rzeczywistosci istniejaca waga, ktorej nikt jeszcze nie nazwal.
"Nie ma czytelnika" to wniosek z przeszukania, nie z pamieci.

**Co sie stalo dalej.** Nowy klucz konfiguracji zostal podpiety w `borg/repositories.ts` i test
przeszedl na zielono, bo dotyczyl czegos innego. Test napisany wprost pod nowe zachowanie odczytal
zero: zaplecze testowe (`offline/test-support.ts`) buduje wlasna kopie repozytorium nastroju
i przekazuje jej wylacznie te opcje, ktore ktos kiedys wpisal recznie. Klucz wygladal na
podpiety w calym systemie, a byl podpiety w jednym z dwoch miejsc, ktore go tworza.

**Regula druga.** Po dodaniu opcji do komponentu policz, ile miejsc w repozytorium wola jego
konstruktor, i podepnij ja w kazdym. Jedno `grep -rn "new NazwaRepository("` przed napisaniem
testu oszczedza pomiar, ktory mierzy domyslna wartosc zamiast zadanej. To ta sama rodzina co
regula 8: **brakujace wejscie psuje temat pomiaru**, tylko tutaj wejscie gubi sie w drugiej
sciezce budowania, a nie w pustej zmiennej srodowiskowej.

**Regula trzecia, o powadze.** Empatii ani optymizmu nie ma na liscie sklonnosci, ktore
`akuki_child_psychology_research.md` par. 18 pozwala zasiac. Empatia pada w calym dokumencie
raz, w par. 15, jako pytanie do zbadania. Oba parametry zostaly wiec wpisane z jawna adnotacja,
ze sa **wyborem tworczym bez oparcia w badaniach** -- tak samo jak progi retencji imitacji.
Precedens z par. 16 (przywiazanie wyciete z bramki powsciagliwosci) mowi, zeby w takiej sytuacji
mechanizm ciac. Tutaj nie zostal przyciety, bo autorka projektu podjela swiadoma decyzje. To jest
dopuszczalne wylacznie dopoty, dopoki adnotacja stoi w pliku: wybor tworczy nie moze pozyczac
powagi od literatury.
