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
