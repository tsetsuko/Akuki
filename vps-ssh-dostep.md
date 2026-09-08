# Dostęp SSH do VPS-a z sieci komórkowej

Notatka operacyjna: jak się łączyć z serwerem w Oracle Cloud, kiedy adres IP telefonu
ciągle się zmienia.

## Słowniczek

Kilka pojęć, które pojawiają się niżej:

- **IP publiczny** — adres, pod którym widzi Cię reszta internetu. Serwer widzi właśnie
  ten adres, a nie adres Twojego telefonu w sieci lokalnej.
- **NSG (Network Security Group)** — lista reguł w Oracle Cloud mówiąca, z jakich adresów
  wolno się łączyć na dany port. Działa jak filtr przed serwerem: ruch spoza listy jest
  odrzucany, zanim dotrze do maszyny.
- **Allowlist** — lista dozwolonych adresów. Tutaj: te IP, które wpisujesz do NSG.
- **CIDR / maska (np. `46.112.0.0/13`)** — zapis oznaczający cały zakres adresów, a nie
  jeden adres. Im mniejsza liczba po ukośniku, tym większy zakres.
- **sshd** — program działający na serwerze, który obsługuje połączenia SSH. Jego
  konfiguracja leży w `/etc/ssh/sshd_config`.
- **Klucz SSH** — para plików (prywatny u Ciebie, publiczny na serwerze), która zastępuje
  hasło przy logowaniu. Jest nieporównanie trudniejsza do złamania niż hasło.
- **fail2ban** — usługa, która czyta logi i blokuje adresy IP po serii nieudanych prób
  logowania.

## Dlaczego IP się zmienia

Operator komórkowy nie przydziela Ci adresu na stałe. Dostajesz go z puli na czas trwania
sesji transmisji danych. Adres zmienia się między innymi przy:

- ponownym połączeniu z siecią (tryb samolotowy, restart telefonu),
- przełączeniu między nadajnikami,
- wygaśnięciu przydziału po stronie operatora.

Nie da się tego przewidzieć ani wymusić stałego adresu na zwykłej ofercie. Zmiana może
nastąpić raz na kilka dni albo kilka razy dziennie.

## Czy dopisać nowy adres do NSG

Można, ale to rozwiązanie na jeden dzień. Wpisywanie pojedynczych adresów z sieci
komórkowej ma dwa problemy:

1. Będziesz to powtarzać po każdej zmianie adresu.
2. Stare reguły zostają otwarte dla kogoś innego. Kiedy zwolnisz adres `46.113.8.171`,
   dostanie go inny abonent tego samego operatora — a Twoja reguła NSG dalej ten adres
   przepuszcza. Wniosek: allowlist nigdy nie był tu prawdziwym zabezpieczeniem.
   Prawdziwym zabezpieczeniem jest klucz SSH.

Jeśli dopisujesz drugi adres jako doraźne obejście, usuń przy okazji poprzedni.

## Rozwiązania, od najlepszego

### 1. Tailscale albo WireGuard (zalecane)

Obie to sieci VPN typu mesh: instalujesz klienta na serwerze i na telefonie/laptopie,
a urządzenia dostają własne, stałe adresy wewnętrzne, niezależne od operatora.

Wtedy:

- łączysz się na adres serwera w tej sieci, a nie na jego adres publiczny,
- port SSH w NSG zamykasz całkowicie — żadnego `0.0.0.0/0`, żadnego zakresu operatora,
- zmiany IP przestają mieć znaczenie, bo klient sam sobie radzi z roamingiem.

Tailscale ma darmowy plan, który w zupełności wystarcza do tego zastosowania.

### 2. Allowlist całego zakresu operatora

Zamiast zgadywać zakres, sprawdź, jaki blok adresów faktycznie należy do operatora:

```bash
whois 46.112.4.85  | grep -i -E 'inetnum|netname|route|descr'
whois 46.113.8.171 | grep -i -E 'inetnum|netname|route|descr'
```

Oba adresy wyglądają na mieszczące się w `46.112.0.0/13`, ale wpisz do NSG to, co pokaże
pole `route` / `inetnum`, a nie moje przypuszczenie.

Wada: wpuszczasz w ten sposób wszystkich abonentów tego operatora.

### 3. Usługa Bastion w Oracle Cloud

Jest dostępna w ramach tenancy. Sesje są ograniczone czasowo i nie wymagają otwierania
portu SSH na samej maszynie.

## Zabezpieczenie serwera

Niezależnie od wybranego wariantu, lista adresów to tylko dodatkowa warstwa, a nie
właściwy zamek. Zanim cokolwiek otworzysz szerzej, sprawdź konfigurację `sshd` w pliku
`/etc/ssh/sshd_config`:

```
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
```

Do tego logowanie wyłącznie kluczem i zainstalowany `fail2ban`. Obrazy systemu w Oracle
Cloud domyślnie mają logowanie kluczem, ale to trzeba zweryfikować, a nie zakładać.

## Zanim zmienisz reguły NSG

Przygotuj drogę powrotu na wypadek zablokowania sobie dostępu. Oracle udostępnia
**Instance Console Connection** (konsola szeregowa) z poziomu panelu w przeglądarce.
Skonfiguruj ją i upewnij się, że działa, *zanim* zaczniesz edytować reguły. Edytowanie
reguły, która obsługuje Twoją jedyną sesję, to najczęstszy sposób na utratę dostępu do
maszyny.

---

# Wybrany wariant: Tailscale — rozpisane krok po kroku

Stan wyjściowy: łączysz się z laptopa poleceniem `ssh`, a laptop ma internet z telefonu
służbowego przez hotspot. Telefon pełni rolę modemu i nic poza tym.

## Klucz SSH a RSA — czym to się różni

To nie są dwie konkurencyjne rzeczy i łatwo się tu pomylić.

**Klucz SSH** to ogólna nazwa mechanizmu: para plików, prywatny i publiczny, którą
logujesz się zamiast hasłem. **RSA** to nazwa jednego z algorytmów, według którego taka
para może zostać wygenerowana. Innym algorytmem jest **ed25519**. Oba dają klucz SSH —
różnią się matematyką w środku.

Praktyczne różnice:

- **ed25519** jest nowszy, krótszy i szybszy. Plik publiczny ma około 90 bajtów. To
  domyślny wybór, gdy nic nie stoi na przeszkodzie.
- **RSA** jest starszy i dłuższy (przy 4096 bitach plik publiczny ma około 750 bajtów),
  ale obsługują go wszystkie systemy, także te, które nie nadążyły za ed25519.

Typ posiadanego klucza sprawdzisz poleceniem:

```bash
ssh-keygen -l -f ~/.ssh/nazwa_klucza.pub
```

Wypisze on długość, odcisk palca i typ w nawiasie, na przykład `(ED25519)` albo `(RSA)`.

To rozróżnienie ma tu konkretny skutek: **Instance Console Connection w Oracle Cloud
przyjmuje wyłącznie klucze RSA**. Przy próbie wklejenia klucza ed25519 pojawia się błąd:

```
invalid ssh public key type "ssh-ed25519"
```

Nie ma to związku z tym, czy ten klucz był już wcześniej gdzieś w Oracle użyty. Zwykłe
logowanie SSH na instancję akceptuje ed25519 bez problemu — ograniczenie dotyczy tylko
konsoli awaryjnej.

Rozwiązaniem jest wygenerowanie drugiego klucza, w formacie RSA, przeznaczonego wyłącznie
dla konsoli:

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/akuki_oci_console -C "oracle console connection"
```

Polecenie zapyta o hasło do klucza (passphrase) — warto je ustawić. Powstaną dwa pliki:
`akuki_oci_console` (prywatny, zostaje na laptopie, nigdzie go nie wklejasz) oraz
`akuki_oci_console.pub` (publiczny, ten wkleja się w panelu Oracle).

Dotychczasowy klucz `akuki_oci` zostaje bez zmian i dalej służy do normalnego logowania.

## Dlaczego Tailscale musi stać na laptopie

Aplikacja Tailscale na Androidzie działa jako VPN dla samego telefonu i obejmuje wyłącznie
aplikacje uruchomione na telefonie. Ruch, który laptop wysyła przez hotspot, nie wchodzi
do tego tunelu. Laptop nie zobaczy więc adresu tailscale'owego serwera.

Tailscale musi być zainstalowany na urządzeniu, z którego wywołujesz `ssh` — czyli na
laptopie. Instalacja na telefonie nie szkodzi i przyda się, gdybyś kiedyś chciała logować
się bezpośrednio z telefonu aplikacją typu Termius.

## Krok 1 — Tailscale na serwerze

Na VPS-ie:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Drugie polecenie wypisuje link. Otwórz go w przeglądarce i zaloguj się.

## Krok 2 — Tailscale na laptopie

Na laptopie, dokładnie te same dwa polecenia. Przy logowaniu użyj **tego samego konta** co
na serwerze — inaczej urządzenia trafią do osobnych sieci i nie zobaczą się nawzajem.

Weryfikacja:

```bash
tailscale status
```

Na liście powinny pojawić się wszystkie urządzenia, każde z własnym adresem `100.x.y.z`.

Uwaga dotycząca laptopa z FortiClientem, sprawdzona 2026-09-07: Tailscale używa adresów
z puli `100.64.0.0/10`, a firmowe trasy obejmują `100.124.0.0/16`, czyli fragment tej samej
puli. Kolizji jednak nie ma. Tailscale trzyma trasy w osobnej tablicy routingu 52
(reguła `5270: from all lookup 52`, wcześniejsza niż główna tablica) i wpisuje tam
wyłącznie pojedyncze adresy hostów, nie cały blok:

```
$ ip route show table 52
100.69.4.80      dev tailscale0
100.100.100.100  dev tailscale0
100.124.237.35   dev tailscale0
```

Firmowe `100.124.0.0/16` zostaje więc obsługiwane przez FortiClient bez zmian. Gdyby mimo
to hosty firmowe przestały odpowiadać po włączeniu Tailscale, pierwsze sprawdzenie to
`ip route get <adres firmowy>` — pokaże, przez który interfejs faktycznie idzie ruch.

## Krok 3 — sprawdź nowe wejście, zanim zamkniesz stare

Adres tailscale'owy serwera odczytasz na samym serwerze (wejdź tam jeszcze po staremu, po
adresie publicznym):

```bash
tailscale ip -4
```

Wypisze jeden adres, na przykład `100.124.237.35`.

Teraz z laptopa, w **nowym** oknie terminala — poprzednie połączenie zostaw otwarte:

```bash
ssh -i ~/.ssh/akuki_oci ubuntu@100.124.237.35
```

To ta sama maszyna, ten sam użytkownik i ten sam klucz. Zmienia się wyłącznie adres.

Że połączenie faktycznie idzie przez Tailscale, a nie po staremu, potwierdzisz na
laptopie:

```bash
ss -tnp | grep ':22'
```

Adres docelowy powinien być tym z zakresu `100.x.y.z`, a nie publicznym `129.159.24.178`.

Jeżeli to nie zadziała, zatrzymaj się w tym miejscu i nie zmieniaj jeszcze reguł NSG.

## Krok 4 — awaryjne wejście przez panel Oracle

W panelu: **Compute → Instances → instancja → Resources → Console connection → Create
local connection**. Wklej zawartość `~/.ssh/akuki_oci_console.pub` (klucz RSA z sekcji
wyżej). Po utworzeniu użyj „Launch Cloud Shell connection", żeby sprawdzić, że konsola
faktycznie wpuszcza. Niesprawdzone wejście awaryjne nie jest wejściem awaryjnym.

Konsola działa przez przeglądarkę i pomija sieć oraz reguły NSG, więc pozostaje dostępna
także wtedy, gdy Tailscale nie wstanie.

## Krok 5 — zamknij port SSH w NSG

Dopiero po potwierdzeniu kroków 3 i 4.

W panelu: **Networking → Virtual Cloud Networks → VCN → Network Security Groups → grupa →
Security Rules**. Usuń **wszystkie** reguły przychodzące z portem docelowym 22 — zarówno
tę z adresem z sieci komórkowej (`46.113.8.171/32`), jak i te dodane kiedyś dla domowego
wifi czy dowolnej innej lokalizacji.

Nie ma powodu zostawiać żadnej z nich. Tailscale działa niezależnie od tego, do jakiej
sieci podłączony jest laptop: w domu, na hotspocie, w biurze czy w kawiarni adres
tailscale'owy serwera pozostaje ten sam. Reguły per-IP nie dają już nic, a każda z nich
przepuszcza ruch od kogokolwiek, kto akurat trzyma dziś ten adres.

Od tej chwili port 22 na adresie publicznym jest zamknięty dla całego internetu, a zmiany
IP telefonu przestają mieć jakiekolwiek znaczenie. Otwarte połączenie po adresie
publicznym może się przy tym rozłączyć — to normalne.

Reguły dla innych portów niż 22 (jeśli jakieś istnieją, na przykład dla usług HTTP) zostaw
bez zmian — ta zmiana dotyczy wyłącznie dostępu SSH.

## Czego nie robić

Nie zawężaj `ListenAddress` w `/etc/ssh/sshd_config` do adresu tailscale'owego. Jeżeli
`sshd` wystartuje przed Tailscale, na przykład po restarcie serwera, nie będzie miał do
czego się podpiąć i usługa nie wstanie. Zamknięcie portu w NSG daje ten sam efekt bez
tego ryzyka.

## Jak się teraz łączyć poleceniem ssh

Dotychczas:

```bash
ssh -i ~/.ssh/akuki_oci ubuntu@129.159.24.178
```

Po przejściu na Tailscale to samo, ale na adres z sieci Tailscale:

```bash
ssh -i ~/.ssh/akuki_oci ubuntu@100.124.237.35
```

Wygodniej jednak poprawić istniejący wpis w `~/.ssh/config`. Obecnie wygląda tak:

```
Host akuki
  HostName 129.159.24.178
  User ubuntu
  IdentityFile ~/.ssh/akuki_oci
```

Wystarczy podmienić `HostName` na adres tailscale'owy serwera:

```
Host akuki
  HostName 100.124.237.35
  User ubuntu
  IdentityFile ~/.ssh/akuki_oci
```

Wtedy logowanie to po prostu:

```bash
ssh akuki
```

Stary adres publiczny warto zostawić w pliku jako zakomentowaną linię
(`# HostName 129.159.24.178`), na wypadek gdyby kiedyś trzeba było go szybko przywrócić
— na przykład po tymczasowym otwarciu portu 22 z poziomu konsoli awaryjnej.

---

## Stan końcowy, 2026-09-07

Migracja zakończona i sprawdzona pomiarem, nie założeniem.

Sieć Tailscale:

```
100.73.191.40   zosia-latitude-7490   linux    laptop
100.124.237.35  akuki-vcn             linux    VPS, direct 129.159.24.178:41641
100.69.4.80     oppo-a6-pro-5g        android  telefon
```

Weryfikacja nowej drogi wejścia:

```
$ ssh -i ~/.ssh/akuki_oci ubuntu@100.124.237.35 'hostname'
akuki-vcn
```

Weryfikacja, że stara droga jest zamknięta:

```
$ ssh -i ~/.ssh/akuki_oci ubuntu@129.159.24.178
ssh: connect to host 129.159.24.178 port 22: Connection timed out
```

Timeout, a nie „connection refused", jest tu pożądanym wynikiem: oznacza, że pakiet został
odrzucony przez NSG, zanim dotarł do maszyny.

Zrobione: wszystkie reguły ingress dla portu 22 usunięte z NSG (także stare wpisy dla
domowego wifi), Instance Console Connection utworzone i sprawdzone, klucz RSA dla konsoli
wygenerowany.

Codzienne użycie sprowadza się do jednego polecenia, po podmianie `HostName` w
`~/.ssh/config` na `100.124.237.35`:

```bash
ssh akuki
```

Jeśli kiedykolwiek Tailscale nie wstanie, drogą wejścia jest Instance Console Connection
w panelu Oracle — działa niezależnie od sieci i od reguł NSG.

---

# Polityka tailnetu (ACL) — dlaczego jest potrzebna i gdzie się ją wkleja

Dopisane 2026-09-08, po pomiarze opisanym w `KNOWN-ISSUES.md`.

## Co zostało zmierzone

Na VPS-ie postawiony serwer na porcie 39999 — porcie, którego nie ma ani w regułach ingress
NSG, ani w regule firewalla hosta:

    przez tunel,     100.124.237.35:39999  ->  HTTP 200 w 65 ms
    przez publiczny, 129.159.24.178:39999  ->  HTTP 000, brak odpowiedzi

Czyli **tunel Tailscale nie podlega regułom NSG**, a domyślna polityka tailnetu przepuszcza
każde urządzenie na każdy port.

Mechanizm: ruch tailscale'owy przylatuje jako WireGuard po UDP 41641, jądro go rozpakowuje
i pakiety pojawiają się na interfejsie `tailscale0` już **wewnątrz** hosta. NSG widzi tylko
ten jeden port UDP i nie ma pojęcia, co jest w środku. A pierwsza reguła łańcucha `INPUT`
to skok do `ts-input`, gdzie stoi `-A ts-input -i tailscale0 -j ACCEPT`, bezwarunkowo,
przed całą lokalną polityką.

Tych reguł nie ustawialiśmy my. `tailscale debug prefs` pokazuje `NetfilterMode: 2`, czyli
`tailscaled` sam nimi zarządza i wstawia je na początek `INPUT` przy każdym starcie. Ręczne
przestawianie ich zostanie nadpisane — **właściwą warstwą kontroli jest polityka tailnetu,
nie `iptables`**.

## Gdzie się to wkleja

Polityka **nie jest plikiem w tym repozytorium**. Mieszka w chmurze Tailscale'a i edytuje
się ją na stronie `https://console.tailscale.com/admin/acls` w konsoli administracyjnej
(alternatywnie przez API Tailscale'a, Terraform albo GitOps).

Na tej stronie są DWA tryby i to jest miejsce, w którym łatwo się pogubić. Zakładki
*General access rules*, *Tailscale SSH* i *Auto approvers* to **edytor wizualny**, klikający
reguły po jednej. Cała polityka jest natomiast jednym dokumentem, więc wkleja się ją
w **trybie edycji pliku**, przełączanym suwakiem u góry strony. Oba tryby operują na tym
samym pliku i można się między nimi przełączać.

Format to **HuJSON**, czyli „JSON for Humans" — wolno w nim komentarze i przecinki na końcu
list. To dobre miejsce, żeby przy regułach zapisać, dlaczego akurat te porty.

UWAGA PRZED WKLEJENIEM: `tailscale-acl.json` jest **kompletną polityką, nie łatką**.
Wklejenie zastąpi wszystko, co jest w konsoli. Najpierw skopiować obecną treść na boku
i sprawdzić, czy nie ma w niej sekcji `ssh` (Tailscale SSH — osobny mechanizm logowania,
inny niż zwykły `sshd` na porcie 22, którego tu używamy) albo `tagOwners`, które trzeba
zachować.

Plik `tailscale-acl.json` w katalogu głównym repozytorium to **kopia do wglądu i do
odtworzenia**, nie źródło prawdy. Po każdej zmianie w konsoli warto go zaktualizować, bo
inaczej się rozjedzie. Dokumentacja Tailscale'a, którą przeczytałem, nie mówi, czy konsola
trzyma historię wersji polityki — to dodatkowy powód, żeby ta kopia była aktualna.

## Składnia: `grants`, nie `acls`

Ten tailnet używa NOWSZEJ składni. Domyślna polityka, którą Tailscale tam wstawił, ma sekcję
`grants` z regułą `{"src": ["*"], "dst": ["*"], "ip": ["*"]}`, czyli „każdy do każdego na
każdy port" — i to jest źródło zachowania zmierzonego wyżej.

Różnica wobec starszego `acls` jest jedna i łatwo się na niej pomylić: **porty idą do pola
`ip`, a nie doklejone do `dst`**.

    acls    "dst": ["akuki-vcn:22,5173"]
    grants  "dst": ["akuki-vcn"], "ip": ["tcp:22", "tcp:5173"]

Dozwolone wartości `ip` z dokumentacji: `"*"` (wszystkie porty, w tym TCP, UDP i ICMP),
`"443"`, `"80-443"`, `"tcp:443"`, `"tcp:80-443"`, `"icmp:*"`. Aliasy z `hosts` są dozwolone
zarówno w `src`, jak i w `dst`.

## Jak czytać tę politykę

Sekcja `hosts` przypisuje **własne aliasy** do adresów tailscale'owych. To nie są nazwy
urządzeń pobierane z Tailscale'a — nazwy maszyn NIE są dozwolonym selektorem. Lista
dozwolonych to: Any, Tailscale IP, Subnet CIDR Range, Autogroups, Groups, Users, Tags,
Hosts, IP sets. Dlatego urządzenie adresuje się przez alias z `hosts`, przez tag, przez
adres IP albo przez użytkownika. Aliasy nazwane są tak jak prawdziwe urządzenia wyłącznie
dla czytelności.

Sekcja `grants` ma dwie reguły, rozdzielone celowo: **laptop** dostaje port 22 (SSH)
i 5173 (interfejs demo), **telefon** tylko 5173. Z telefonu nie logujesz się po SSH, więc
nie ma powodu mu tego dawać.

Sekcja `ssh` jest zachowana z domyślnej polityki bez zmian. Dotyczy Tailscale SSH — osobnego
mechanizmu, którego tu nie używamy, bo logowanie idzie zwykłym `sshd` i kluczem
`akuki_oci`. Zostawiona, bo jej usunięcie nic nie daje, a mogłoby zabrać coś, czego nie
przewidzieliśmy.

**Reguła `{"src": ["*"], "dst": ["*"], "ip": ["*"]}` musi zniknąć**, inaczej cała reszta jest
bez znaczenia — ona przepuszcza wszystko. Po podmianie przestanie odpowiadać port 39999
z pomiaru, port 7740 przestanie być osiągalny z tailnetu, a laptop przestanie widzieć telefon
i odwrotnie. Jeśli to przeszkadza, dopisujemy trzecią regułę.

Sekcja `tests` jest zabezpieczeniem przed odcięciem się. Tailscale sprawdza ją przy zapisie,
więc polityka, która nie przepuszczałaby laptopa na port 22, nie zostanie przyjęta. Wpisane
są tam także `deny`, żeby test pilnował nie tylko dostępu, ale i jego braku.

CZEGO NIE POTWIERDZIŁEM: czy `tests` ocenia reguły `grants` tak samo jak dawne `acls`.
Składnia sekcji `tests` jest udokumentowana, ale jej współpraca z `grants` nie była przeze
mnie sprawdzona. Zachowanie konsoli jest tu na naszą korzyść — jeśli `tests` w tej formie
jest nie do przyjęcia, zapis zostanie ODRZUCONY, a nie cicho zaakceptowany. Wtedy usunąć
sekcję `tests` i wkleić resztę, tracąc tylko siatkę bezpieczeństwa, nie politykę.

## Czego ta polityka nie dotyczy

Ruchu wychodzącego z VPS-a do internetu. Akuki dobija się do Bot Areny i do dostawcy modeli
zwykłym interfejsem publicznym, a ACL rządzą wyłącznie ruchem wewnątrz tailnetu. Dlatego
w polityce nie ma żadnej reguły dla `akuki-vcn` jako źródła.

## Ryzyko i jak je odkręcić

Źle napisana polityka może odciąć SSH. Ważna własność: politykę edytuje się w przeglądarce,
więc naprawa **nie wymaga tunelu**. W ostateczności zostaje Instance Console Connection
w OCI, opisane wyżej w tym dokumencie.

Drugie, mniejsze ryzyko: `hosts` wiąże alias z **adresem IP**. Adresy tailscale'owe są
trwałe, ale urządzenie usunięte i dodane ponownie może dostać inny. Objaw byłby głośny —
odmowa dostępu — a nie cichy. Trwalszą alternatywą są tagi, ale wymagają ponownego
uwierzytelnienia urządzenia z `--advertise-tags`, co przy trzech urządzeniach jest większym
kosztem niż zyskiem.
