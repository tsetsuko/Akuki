---
id: TASK-038
title: >-
  Dwie encje o imieniu Zosia w żywej pamięci — znajomość rozdzielona na dwie
  osoby
status: Done
assignee: []
created_date: '2026-09-09 16:10'
updated_date: '2026-09-12 19:19'
labels:
  - akuki
  - M3
  - M4
dependencies: []
modified_files:
  - akuki-zosia-duplikat-check.sh
  - akuki-zosia-slad-check.sh
  - akuki-zosia-scalenie.sh
  - akuki-serwis.sh
  - borg/src/memory/commitments/repository.ts
  - borg/src/memory/commitments/repository.test.ts
priority: high
type: bug
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Zmierzone 2026-09-09 na zywej pamieci na VPS-ie, odczytem tylko do odczytu przez
`akuki-niesmialosc-check.sh`. Tabela `social_profiles` ma CZTERY wiersze, a wsrod nich DWA
osobne wiersze o nazwie `Zosia`:

    Zosia    | interakcji: 9 | zaufanie: 0,778
    Sol      | interakcji: 5 | zaufanie: 0,760
    Lunaria  | interakcji: 3 | zaufanie: 0,667
    Zosia    | interakcji: 3 | zaufanie: 0,667

To sa dwie rozne encje, nie jeden wiersz policzony dwa razy: profil spoleczny jest kluczowany
identyfikatorem encji.

DLACZEGO TO NIE JEST KOSMETYKA. Powsciagliwosc Akukiego (M3) maleje wraz z liczba interakcji
z danym partnerem. Rozdzielenie Zosi na dwie osoby po 9 i 3 interakcje daje inna liczbe niz
jedna osoba z 12 — a wiec jego zachowanie wobec niej jest liczone z zanizonej znajomosci.
Zaufanie per dziedzina (M4) i prowenienecja nabycia wskazuja identyfikator encji, wiec ta sama
rozbieznosc dotyczy tego, komu wierzy i od kogo sie uczy.

TO JEST TEN SAM RODZAJ AWARII CO `alice`, TYLKO CICHSZY. Tamta byla widoczna, bo Akuki
zwrocil uwage na obce imie. Tutaj obie encje nazywaja sie tak samo, wiec w rozmowie nic tego
nie zdradzi — objawem jest wylacznie liczba w bazie.

DO USTALENIA PRZED NAPRAWA (kolejnosc ma znaczenie):
1. Skad wzial sie drugi wiersz: czy powstal przy naprawie etykiety rozmowcy 2026-09-08, przy
   pierwszym kontakcie przez konektor, czy jeszcze inaczej. Rozstrzyga to porownanie
   `created_at` obu encji z data naprawy i z pierwsza tura na Arenie.
2. Ktora encja jest ta z seeda (`user_declared`, rola `creator`, identyfikator
   `ent_ry4lo3ia73wug8pz`), a ktora powstala pozniej i z jaka prowenienecja nazwy.
3. Czy scalenie jest bezpieczne, czyli co jeszcze wskazuje na te druga encje — epizody, wiersze
   spoleczne, wydarzenia tozsamosciowe, wpisy strumienia. Scalanie encji rusza pamiec i wymaga
   osobnej zgody Zosi oraz kopii zapasowej przed wykonaniem.

Uwaga: naprawa etykiety rozmowcy z 2026-09-08 stemplowala sesje domyslna przy KAZDYM starcie
wlasnie po to, zeby nie tworzyc drugiej osoby o tym samym imieniu, i wtedy zadzialala
(dowodem byla rownosc identyfikatorow). Ten wiersz jest wiec albo starszy od naprawy, albo
powstal inna droga niz sesja demo — najpewniej przez konektor Areny.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ustalone i zapisane, skad wzial sie drugi wiersz Zosi, z porownaniem dat i prowenienecji nazwy
- [x] #2 Rozstrzygniete, ktore wiersze w calej bazie wskazuja na kazda z dwoch encji
- [x] #3 Decyzja o scaleniu albo pozostawieniu podjeta przez Zosie, po kopii zapasowej
- [x] #4 Jesli scalenie: znajomosc i zaufanie po scaleniu porownane z wartosciami sprzed, zeby bylo widac, co sie zmienilo
- [x] #5 Zamkniete zrodlo powstawania drugiej encji, a nie tylko skutek
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
USTALONE 2026-09-09, odczytem `akuki-zosia-duplikat-check.sh` (tylko odczyt zywej pamieci
na VPS-ie, zero zapisu) plus lektura kodu na galezi `akuki-dev`.

## 1. Zrodlo drugiej encji (AC#5 — przyczyna, jeszcze bez naprawy)

Akuki rozpoznaje rozmowce dwiema niezaleznymi drogami:

- po nazwie: `resolve(name)` w `borg/src/memory/commitments/repository.ts:421` — szuka po
  kanonicznej nazwie i aliasach, zwraca istniejaca encje, tworzy nowa tylko gdy nazwy nie zna;
- po identyfikatorze zewnetrznym: `resolveExternal(...)` tam samo, `:479` — szuka WYLACZNIE po
  parze (`source`, `external_id`) i gdy mapowania nie ma, wola `add()` **bez zadnej kontroli
  nazwy**.

Konektor Areny wola droge druga, kluczujac na identyfikatorze autora z Areny:
`connector/src/runner.ts:142-148`, source `botarena`, prowenienecja `transport_sender`.

Wniosek: pierwsza wiadomosc od Zosi przez Arene **musiala** utworzyc druga encje. To nie wyscig
ani zbieg okolicznosci. Naprawa etykiety rozmowcy z 2026-09-08 nie mogla temu zapobiec, bo
operuje na drodze po nazwie, a nie na mapowaniu zewnetrznym.

## 2. Daty i prowenienecja nazwy (AC#1 — spelnione)

| encja | powstala | prowenienecja nazwy | rola | mapowanie zewnetrzne |
|---|---|---|---|---|
| `ent_ry4lo3ia73wug8pz` | 2026-08-25T10:08:00Z | `user_declared` | `creator` | brak |
| `ent_k789l9ogu43tlbmp` | 2026-09-08T14:13:42Z | `transport_sender` | brak | `botarena / 696dfd3a-1c4d-4eef-99fe-f9f3db31e5d1`, dodane w tej samej sekundzie |

Lunaria zmapowana 2026-09-08T14:10:22Z, Sol 14:15:17Z — cala trojka uczestnikow Areny powstala
w jednej sesji, w ciagu pieciu minut. Data powstania drugiej encji jest identyczna z data
dodania jej mapowania, co potwierdza, ze utworzyl ja pierwszy kontakt przez konektor.

## 3. Co wskazuje na kazda z encji (AC#2 — spelnione)

Skan wszystkich tabel po kolumnach zawierajacych `entity`:

| tabela.kolumna | seed `ent_ry4lo3ia73wug8pz` | Arena `ent_k789l9ogu43tlbmp` |
|---|---|---|
| `social_events.entity_id` | 9 | 3 |
| `stream_entry_index.sender_entity_id` | 9 | 3 |
| `activity_events.speaker_entity_id` | 9 | 3 |
| `activity_events.actor_entity_id` | 9 | 3 |
| `activity_events.audience_entity_id` | 27 | 0 |
| `prediction_events.about_entity_id` | 22 | 4 |
| `social_trust_domains.entity_id` | 3 | 1 |
| `social_profiles.entity_id` | 1 | 1 |
| `episode_index.audience_entity_id` | 6 | 0 |
| `open_questions.audience_entity_id` | 6 | 0 |
| `shared_state_artifacts.audience_entity_id` | 1 | 0 |
| `shared_state_entries.audience_entity_id` | 1 | 0 |
| `sessions.audience_entity_id` | 1 | 0 |
| `semantic_nodes.acquired_from_entity_id` | 1 | 0 |
| `entity_external_ids.entity_id` | 0 | 1 |

Czyli: epizody, otwarte pytania, stan wspoldzielony, sesja i prowenienecja nabycia wiedzy
wskazuja **wylacznie** na encje z seeda. Encja z Areny ma tylko profil spoleczny, wydarzenia
spoleczne, strumien, aktywnosc, jedna dziedzine zaufania, cztery wydarzenia przewidywania
i swoje mapowanie zewnetrzne. Zadna tabela nie wymaga scalania wiersz-w-wiersz poza tymi
siedmioma.

Profile i posteriory w chwili pomiaru:

- seed: 9 interakcji, zaufanie 0,7778, przywiazanie 0, ostatnia interakcja 2026-09-08T14:23:20Z;
  dziedziny `welcoming presence` alpha=5 beta=1, `guiding into the world` alpha=7 beta=2,
  `answering direct questions` alpha=2 beta=1;
- Arena: 3 interakcje, zaufanie 0,6667, przywiazanie 0, ostatnia 2026-09-08T14:30:28Z;
  dziedzina `welcoming newcomers` alpha=2 beta=1.

Obie encje dostawaly interakcje na przemian tego samego popoludnia (ostatnie wpisy 14:23:20
i 14:30:28), wiec rozdzielenie nie jest granica "przed naprawa / po naprawie" — obie drogi
rozpoznania dzialaly rownolegle.

## 4. Skutek nieopisany w pierwotnym opisie zadania

Figura przywiazania rozwiazuje sie **po nazwie**:
`cognition/lifecycle/turn-phase/deliberation-phase.ts:128-132` wola `findByName`, a
`findAllByName` iteruje `listEntities` z `ORDER BY created_at ASC`
(`memory/commitments/repository.ts:313-323`), wiec zwraca zawsze **starsza** encje, czyli seed.
Partnerem tury na Arenie jest encja mlodsza. Zatem `attachmentFigurePresent` jest w turach
z Areny falszywe, mimo ze rozmawia z nim Zosia. Dwa skutki:

- ulga `presenceRelief` (0,1) nie wchodzi do sygnalu powsciagliwosci;
- wzmocnienie wagi pamieci dla zaskoczen dotyczacych figury przywiazania
  (`cognition/predictions/surprise-significance.ts:66-67`) nie wchodzi dla zaskoczen o niej.

To jest jedyny kawalek attachmentu, na ktory badania daja licencje (research §16), i wlasnie on
nie dziala w kanale, w ktorym Akuki faktycznie zyje.

Drugi skutek: ekstraktor zaufania pokazuje modelowi znane dziedziny **tej encji**
(`cognition/social-trust/domain-trust-extractor.ts:135`), wiec encja z Areny startowala z pustym
slownikiem i model wymyslil `welcoming newcomers` obok istniejacego `welcoming presence`.
Rozdzielenie encji rozdzielilo takze slownik dziedzin.

## 5. Co zmieni scalenie (szacunek przed decyzja, AC#4)

- Zazylosc: `1 - exp(-n/5)` idzie z 0,451 (n=3) na 0,909 (n=12), czyli czlon przewidywalnosci
  w sygnale powsciagliwosci podwaja sie niezaleznie od wielkosci zaskoczen.
- Do tego wraca ulga 0,1 za obecnosc figury przywiazania, bo nazwa i partner wskazuja juz
  jedna encje.
- Zaufanie skalarne policzone jako srednia wazona czterech dziedzin (wagi alpha+beta: 6, 9, 3, 3)
  wynosi 16/21 = 0,762. Czyli dla scalonej encji zaufanie **spada** z 0,778 i **rosnie** z 0,667.
  Prog 0,7 w doborze wspomnien (`retrieval/scoring.ts:47`) pozostaje przekroczony.
- Okno ostatnich bledow przewidywania (10 wpisow) czytaloby wtedy mieszanke z 26 wierszy zamiast
  osobno 22 i 4.

## Co pozostaje

AC#3, AC#4 i AC#5 otwarte. Scalenie wymaga kopii zapasowej i osobnej zgody Zosi. Naprawa zrodla
jest mechanizmem, wiec idzie przez szescioetapowa bramke — bez zgody nic nie powstaje.

KOREKTA 2026-09-10, przed scaleniem. Skan z 2026-09-09 dopasowywal identyfikator NA ROWNOSC, wiec byl niepelny na dwa sposoby i AC#2 zostalo odhaczone przedwczesnie:

1. Pomijal listy JSON. `activity_events.participant_entity_ids` (`memory/activity/migrations.ts:20`) trzyma tablice identyfikatorow jako tekst, wiec porownanie `= ?` nigdy jej nie trafi. Tak samo `allowed_entity_ids`, `excluded_entity_ids`, `activation_entity_ids` i `activation_excluded_entity_ids` w dyrektywach tworczyni (`memory/creator-directives/migrations.ts:38-51`).
2. Pomijal caly magazyn wektorowy. Tabela epizodow w LanceDB ma pola `participants`, `audience_entity_id` i `origin_audience_entity_ids` (`memory/episodic/repository.ts:704,715,716`), wiec epizod z tury na Arenie moze wymieniac encje z Areny jako uczestnika, mimo ze `episode_index` pokazuje dla niej zero wierszy (audiencja tury na Arenie to encja grupy watku, nie osoba).

Dlatego przed scaleniem idzie `akuki-zosia-slad-check.sh`: szuka identyfikatora jako PODCIAGU we wszystkich kolumnach kazdej tabeli SQLite i liczy jego wystapienia w plikach LanceDB. Scalenie pisane jest po tym odczycie, nie przed, bo dopiero on mowi, ile miejsc trzeba przeniesc.

Ustalone przy okazji: borg NIE ma zadnego scalania encji. `resolve`, `resolveExternal`, aliasy i zmiana nazwy istnieja, funkcji lozacej dwie encje w jedna nie ma (`memory/commitments/repository.ts`, `borg/public-facade.ts:622-632`). Scalenie jest wiec jednorazowa naprawa danych, nie nowa funkcja borga.

NAPRAWA ZRODLA 2026-09-10 (AC#5, kod gotowy, NIEWDROZONY). Zosia wybrala wariant A: przyjmowanie encji o tym samym imieniu, z warunkiem nikt-jej-nie-zajal.

Zmiana w `borg/src/memory/commitments/repository.ts`, w `resolveExternal` -> w galezi pierwszego kontaktu (brak mapowania dla pary source/external_id):

- `findAllByName(canonicalName, { kind })` szuka encji o tej nazwie i TYM SAMYM rodzaju;
- nowy prywatny `hasExternalMapping(entityId)` odrzuca kandydatow, ktorych jakis kanal juz zajal;
- pierwszy niezajety kandydat jest przyjmowany przez nowy prywatny `stampAdopted(entityId, kind, provenance)`: ustawia rodzaj i zostawia SILNIEJSZA prowenienecje nazwy (`strongerNameProvenance`), wiec `user_declared` nie degraduje sie do `transport_sender`; `borg_role` i cala reszta wiersza nietkniete;
- gdy niezajetego kandydata nie ma, zachowanie jest dzisiejsze: nowa encja.

Filtr rodzaju jest tam celowo: bez niego bot o nazwie rownej etykiecie watku wszedlby w encje grupy, a encja `self` byla podatna na przejecie.

DOWOD (`borg`, galaz akuki-dev):

- trzy nowe testy w `repository.test.ts`; dwa z nich PADAJA bez poprawki, sprawdzone odlozeniem zmiany: `adopts an unclaimed entity of the same name on first contact through a channel` i `leaves a claimed entity alone when a second principal shares its name` (2 z 33 na czerwono). Trzeci, o zgodnosci rodzaju, przechodzi w obu wersjach -- to straznik regresji, nie dowod nowego zachowania;
- istniejacy test borga `durably resolves distinct external senders without collapsing equal display names` przechodzi bez zmian. Warunek nikt-jej-nie-zajal jest dokladnie tym, co go chroni, wiec wariant A nie kloci sie z zalozeniem zapisanym w borgu przez Tomka;
- `npm run heuristics:guard`: kod 0;
- `npm run typecheck`: 5 bledow z poprawka i 5 bez niej, wszystkie w fiksturach testowych dotyczacych umiejetnosci i pol M4. Zero nowych;
- testy trzech innych plikow wolajacych te sciezke (ekstraktor semantyczny, ekstraktor epizodow, uchwyt pamieci): 89 z 89;
- pelny suite: 26 padnietych z 4075. Porownanie z przebiegiem bez poprawki: 21 tych samych porazek (w tym `passes the persona display name as the stable Borg audience`, wiec to NIE jest skutek zmiany), 5 pozostalych sprawdzonych pojedynczo -- 4 przechodza w izolacji (padaja tylko przy pelnym obciazeniu: `Failed to acquire stream lock ... ENOENT` i limity 15 s), a `assessor/cli.test.ts > exits non-zero for failing scenarios unless --no-fail is passed` pada identycznie bez poprawki. Zadnej porazki nie da sie przypisac tej zmianie.

Czego poprawka NIE robi: nie scala istniejacej pary encji i nie jest jeszcze na VPS-ie (tam chodzi zbudowany kod). AC#5 zostaje otwarte do wdrozenia.

Swiadomie pominiete: zapis kolizji imienia w bazie, czyli slad po tym, ze druga encja powstala wlasnie dlatego, ze imie bylo juz zajete. Wlasciwa warstwa to konektor, bo ma log i widzi transport; repozytorium encji ma dzis tylko baze i zegar i nie warto wpuszczac tam zaleznosci diagnostycznej. Do zalozenia jako osobne male zadanie.

PELNY SLAD 2026-09-10, `akuki-zosia-slad-check.sh` (AC#2 zamkniete). Skan po podciagu we wszystkich kolumnach kazdej tabeli plus przeszukanie plikow LanceDB.

ENCJA Z ARENY (`ent_k789l9ogu43tlbmp`) wystepuje w dziewieciu miejscach i tylko w SQLite:

| miejsce | wierszy |
|---|---|
| `entities.id` | 1 |
| `entity_external_ids.entity_id` | 1 |
| `social_profiles.entity_id` | 1 |
| `social_events.entity_id` | 3 |
| `social_trust_domains.entity_id` | 1 |
| `stream_entry_index.sender_entity_id` | 3 |
| `activity_events.speaker_entity_id` | 3 |
| `activity_events.actor_entity_id` | 3 |
| `activity_events.participant_entity_ids` | 9 |
| `prediction_events.about_entity_id` | 4 |

W LanceDB: **brak wystapien**. Magazyn wektorowy nie wymaga przy scaleniu niczego.

Dwie rzeczy, ktorych skan na rownosc nie pokazal, a maja znaczenie:

1. `activity_events.participant_entity_ids` ma DZIEWIEC wierszy z encja z Areny (skan na rownosc pokazywal zero), bo to tablica identyfikatorow w tekscie i pojawia sie tam takze w turach, w ktorych mowil kto inny.
2. Encja z seeda siedzi w miejscach, ktorych filtr po nazwie kolumny nie widzi: `episode_participants.term` i `.value` (po 6), `identity_events.new_value_json` (19) i `old_value_json` (6), `review_queue.refs` (5), `maintenance_audit.reversal` (3), oraz w etykietach ujawniania (`disclosure_label` w `open_questions`, `growth_markers`, `autobiographical_periods`, `lived_experience_day_summaries`) -- etykiety koduja audiencje identyfikatorem encji. Te wiersze zostaja nietkniete, bo encja z seeda jest ta, ktora przezywa scalenie. Gdyby kierunek scalania byl odwrotny, trzeba by przepisac takze etykiety ujawniania, a to jest granica Kardynalnej Reguly Pamieci -- kolejny powod, zeby scalac W STRONE seeda.

SCALENIE: `akuki-zosia-scalenie.sh`. Domyslnie proba (czyta, wypisuje plan i stan przed, nic nie zapisuje). Zapis dopiero z `--wykonaj`, odmawia przy dzialajacej usludze, przed zapisem robi wlasna kopie katalogu tenanta w `/var/lib/akuki/przed-scaleniem-<stamp>` (kopia DODATKOWA, nie zastepuje procedury z `akuki-backup-odtworzenie.md`). Caly zapis w jednej transakcji; przed COMMIT-em skrypt ponawia skan po podciagu i przy jakimkolwiek sladzie encji z Areny robi ROLLBACK.

Decyzje w scaleniu:

- kierunek: encja z seeda przezywa (rola `creator`, `user_declared`, epizody, otwarte pytania, sesja, etykiety ujawniania);
- dziedziny zaufania: przy tej samej nazwie dziedziny sumujemy przeslanki, odejmujac plaski prior (1,1) z wiersza z Areny, zeby nie policzyc go dwa razy. `welcoming newcomers` nie koliduje z zadna dziedzina seeda, wiec zostaje przeniesiona bez zmian -- NIE zlewam jej z `welcoming presence`, bo to byloby zmyslanie przeslanki;
- listy uczestnikow przepisywane przez parsowanie JSON z odsiewem powtorzenia (wiersz zawierajacy obie encje po zamianie mialby ten sam identyfikator dwa razy);
- profil scalonej encji liczony z dziennika, nie arytmetyka na dwoch wierszach: `interaction_count` jako COUNT wydarzen interakcji, `last_interaction_at` jako MAX, `sentiment_history` z tego samego zapytania co `refreshSentimentHistory`, `trust` jako srednia wazona dziedzin.

PROBA NA KOPII (2026-09-10). Kod scalenia przecwiczony na kopii tenanta z backupu `20260908T121648Z`, do ktorej dosypano encje z Areny w kształcie zmierzonym wyzej (z jedna lista uczestnikow zawierajaca OBIE encje, zeby sprawdzic odsiew powtorzenia). Wynik: 12 interakcji, zaufanie 0,7619, `integrity_check: ok`, jedna encja o imieniu Zosia, mapowanie `botarena` wskazuje na seed, zero list z powtorzonym identyfikatorem, zero wystapien identyfikatora z Areny w calej bazie. Kopia probna usunieta po probie.

PRZEWIDYWANIE DLA ZYWEJ PAMIECI (AC#4, do porownania z wyjsciem `--wykonaj`): `interaction_count` 12, zaufanie 0,7619 (z 0,7778 dla seeda i 0,6667 dla Areny), zazylosc partnera z Areny 0,451 -> 0,909, plus ulga 0,1 za figure przywiazania, ktora dotad w turach z Areny nie wchodzila. Liczby powsciagliwosci z proby (0,570 -> 0,314) pochodza z fikstury o bledach 0,2 i 0,3 -- zywe wartosci policzy skrypt z prawdziwych `error_magnitude`.

Kolejnosc uruchomienia: kopia procedura z `akuki-backup-odtworzenie.md` -> `systemctl stop akuki` -> proba -> `--wykonaj` -> `systemctl start akuki`.

SCALONE 2026-09-11 na zywej pamieci, `akuki-zosia-scalenie.sh --wykonaj`. Kopia zapasowa `20260911T114906Z` wykonana przy zatrzymanej usludze i zweryfikowana przed zapisem: suma archiwum po transferze OK, 143 pliki bajt w bajt, `integrity_check: ok`, obie encje obecne. Skrypt zrobil wlasna kopie dodatkowa w `/var/lib/akuki/przed-scaleniem-20260911T195223Z` (163 pliki).

Przeniesione dokladnie dziesiec miejsc (moje wczesniejsze "dziewiec" bylo przeliczeniem sie przy wyliczaniu): mapowanie zewnetrzne 1, wydarzenia spoleczne 3, strumien 3, mowca 3, sprawca 3, listy uczestnikow 9, dziedzina zaufania 1, wydarzenia przewidywania 4, plus usuniety profil i wiersz encji. `welcoming newcomers` przeniesiona bez zlewania z `welcoming presence`.

STAN PO (AC#4): 12 interakcji, zaufanie 0,7619 (z 0,7778 i 0,6667), cztery dziedziny, ostatnia interakcja 2026-09-08T14:30:28Z, `integrity_check: ok`. Zgodne z przewidywaniem co do cyfry.

CZEGO NIE PRZEWIDZIALEM. Powsciagliwosc wobec Zosi NA ARENIE spadla 0,626 -> 0,382, ale po stronie sesji demo stanela w miejscu (0,381 -> 0,382). Powod: okno dziesieciu ostatnich zaskoczen miesza teraz wpisy z obu stron i sredni blad urosl z 0,355 na 0,410, co zjadlo wzrost zazylosci (0,835 -> 0,909). Zysk ze scalenia jest wiec realny, ale niesymetryczny -- dotyczy kanalu, w ktorym Akuki zyje, a nie obu naraz.

DRUGI POMIAR, ktorego nie bylo w szacunku: encja z Areny miala tylko DWA wydarzenia przewidywania z wypelniona wielkoscia bledu na cztery wiersze, i jej sredni blad wynosil 0,450 wobec 0,355 u encji z seeda. Przed scaleniem dawalo to przewidywalnosc 0,248 zamiast 0,361 zakladanych na papierze, czyli rozdzielenie kosztowalo wiecej, niz szacowalem.

PULAPKA PRZY WERYFIKACJI KOPII, do zapamietania: `diff` list sum kontrolnych ze zrodla i z rozpakowanego archiwum pokazal dziesiatki roznic, ktore byly wylacznie INNA KOLEJNOSCIA linii -- `sort` na VPS-ie i na laptopie ma inne ustawienia jezykowe. Porownanie z wymuszonym `LC_ALL=C sort` po obu stronach daje zgodnosc. Przy odtwarzaniu po awarii taki `diff` wygladalby jak uszkodzona kopia i moglby niepotrzebnie zatrzymac odtwarzanie.

AC#5 zostaje do zamkniecia po restarcie uslugi: poprawka jest zbudowana na VPS-ie (commit `d8da3922`, zweryfikowana obecnoscia `hasExternalMapping` w `dist/`), ale obowiazuje dopiero od startu procesu.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Dwie encje o imieniu Zosia scalone w jedna, a droga ich powstawania zamknieta w kodzie.

PRZYCZYNA. Rozpoznanie rozmowcy szlo dwiema niezaleznymi drogami, ktore sie nie sprawdzaly. Po nazwie `resolve(name)` znajdowal istniejaca encje; po identyfikatorze zewnetrznym `resolveExternal` szukal wylacznie po parze (source, external_id) i gdy mapowania nie bylo, zakladal nowa encje bez zadnej kontroli nazwy. Konektor Areny wola droge druga, wiec pierwsza wiadomosc Zosi przez Arene 2026-09-08 o 14:13:42 MUSIALA utworzyc druga encje. Naprawa etykiety rozmowcy z tego samego dnia nie mogla temu zapobiec, bo operuje na drodze po nazwie.

KOSZT. Powsciagliwosc liczona z 9 i 3 interakcji zamiast z 12, zaufanie i prowenienecja nabycia rozdzielone na dwa konta. Do tego skutek nieopisany w zadaniu: figura przywiazania rozwiazuje sie po nazwie i trafia zawsze w encje starsza, wiec w turach z Areny jej obecnosc wypadala falszywie -- nie dzialala ani ulga w powsciagliwosci, ani wzmocnienie wagi pamieci dla zaskoczen o niej.

NAPRAWA ZRODLA (wariant A, wybrany przez Zosie). Pierwszy kontakt nowym kanalem przyjmuje encje juz znana pod tym imieniem, ale tylko taka, ktorej zaden kanal nie zajal, i tylko tego samego rodzaju. Warunek nikt-jej-nie-zajal jest tym, co nie pozwala zlac dwoch roznych rozmowcow o tym samym wyswietlanym imieniu -- rozdzielenie da sie scalic, zlania nie. Silniejsza prowenienecja nazwy zostaje, rola `creator` nietknieta. Commit `d8da3922`, dwa z trzech nowych testow padaja bez poprawki, istniejacy test borga broniacy wlasnosci odwrotnej przechodzi bez zmian.

SCALENIE. Kopia `20260911T114906Z` zweryfikowana czterema sprawdzeniami przed zapisem. Przeniesione dziesiec miejsc, w jednej transakcji, z ponownym skanem po podciagu przed zatwierdzeniem. Stan po: 12 interakcji, zaufanie 0,7619, cztery dziedziny, `integrity_check: ok`, zero sladu po starej encji.

CZEGO NIE PRZEWIDZIALEM. Powsciagliwosc wobec Zosi na Arenie spadla 0,626 -> 0,382, ale po stronie sesji demo stanela w miejscu (0,381 -> 0,382): okno dziesieciu ostatnich zaskoczen miesza teraz wpisy z obu stron i sredni blad urosl z 0,355 na 0,410, co zjadlo wzrost zazylosci. Zysk jest realny, ale niesymetryczny.

WDROZENIE. Build na VPS-ie przed przestojem, scalenie przy zatrzymanej usludze, restart 2026-09-11 19:59:29 UTC. Log potwierdza wlasciwy tenant i `default session audience: Zosia; creator: Zosia`; API zwraca jedna encje twórczyni. Od tego restartu poprawka zrodla obowiazuje.

ZOSTAJE OSOBNO. Zapis kolizji imienia (slad po tym, ze encja powstala, bo imie bylo juz zajete) -- wlasciwa warstwa to konektor, nie repozytorium encji.
<!-- SECTION:FINAL_SUMMARY:END -->
