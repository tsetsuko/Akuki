# Backup pamięci Akukiego i procedura odtworzenia

Pamięć Akukiego jest stanem **nieodtwarzalnym**. Kod da się odbudować z gita, konfigurację
z tego repozytorium, a tenant — nie. Nie ma go skąd wziąć poza kopią, którą ktoś zrobił
wcześniej.

Ten dokument opisuje, jak tę kopię robić i jak ją odtworzyć. Powstał 2026-09-08, przy
pierwszym backupie, wykonanym i sprawdzonym odtworzeniem.

## Co jest kopiowane, a co nie

**Kopiowany jest katalog tenanta**, na VPS-ie `/var/lib/akuki/data/akuki`. Siedemnaście
plików, około 1,4 MB: `borg.db` (plus `-wal` i `-shm`, jeśli baza nie została zamknięta
czysto), `config.json` i manifesty LanceDB. To jest cała jego pamięć — struktura w SQLite,
wektory w LanceDB.

**Nie jest kopiowany `/etc/akuki/akuki.env`.** Świadomie. Ten plik zawiera token Anthropica
i poświadczenia Areny, a jednocześnie jest **odtwarzalny**: nazwy i wartości niesekretne są
opisane w `connector/README.md` i w TASK-024, token Areny leży w `pass`, ciasteczko wyciąga
się z przeglądarki. Kopiowanie sekretów na kolejne maszyny powiększa powierzchnię wycieku
bez zysku.

**Nie jest kopiowana baza stanu adaptera** (`/var/lib/akuki/arena/state.db`). To nie pamięć
Akukiego, a znaczniki transportu: co odebrane, co opublikowane, próg pierwszego spojrzenia.
Odbudowuje się sama — po utracie konektor oznaczy wątek jako widziany pierwszy raz i nie
odpowie na to, co było przed nim.

## Warunek spójności — jedyna rzecz, na której łatwo polec

**Kopia z działającego writera jest crash-consistent, nie spójna aplikacyjnie.** SQLite może
mieć niezapisany WAL, a pliki LanceDB mogą być w połowie zapisu. Taka kopia zwykle się
otworzy, ale „zwykle" nie jest gwarancją, którą chcemy dla jedynego egzemplarza pamięci.

Dlatego procedura **zatrzymuje writera** na czas kopiowania. Trwa to kilkadziesiąt sekund.
Przy pierwszym backupie zdarzyło się to zaniedbać: archiwum powstało przy działającej
usłudze, bo założenie „nic nie działa" nie było sprawdzone pomiarem. Zostało wyrzucone
i zrobione ponownie. Stąd pierwszy krok poniżej.

## Robienie kopii

```bash
ssh akuki
sudo bash
STAMP=$(date -u +%Y%m%dT%H%M%SZ)

# 1. SPRAWDŹ, nie zakładaj, że nic nie pisze.
systemctl is-active akuki
systemctl stop akuki
systemctl is-active --quiet akuki && { echo "NIE ZATRZYMANE"; exit 1; }

# 2. Sumy kontrolne ZE ŹRÓDŁA, przed archiwizacją.
cd /var/lib/akuki/data/akuki
find . -type f -exec sha256sum {} + | sort -k2 > /tmp/tenant-$STAMP.sums

# 3. Archiwum i jego suma.
tar -C /var/lib/akuki/data -czf /tmp/akuki-tenant-$STAMP.tar.gz akuki
sha256sum /tmp/akuki-tenant-$STAMP.tar.gz | awk '{print $1}' \
  > /tmp/akuki-tenant-$STAMP.tar.gz.sha256
chown ubuntu:ubuntu /tmp/akuki-tenant-$STAMP.tar.gz* /tmp/tenant-$STAMP.sums

# 4. Podnieś usługę OD RAZU, nie po weryfikacji.
systemctl start akuki
systemctl is-active akuki
```

Potem na laptopie:

```bash
cd ~/projects/ai/akuki
scp "akuki:/tmp/akuki-tenant-$STAMP.tar.gz*" "akuki:/tmp/tenant-$STAMP.sums" data/backups/
```

`data/` jest w `.gitignore`, więc kopie nie trafiają do repozytorium — i nie powinny.

## Weryfikacja — cztery sprawdzenia, wszystkie konieczne

Backup nieodtworzony jest obietnicą, nie pomiarem. Sprawdzenia idą od najtańszego:

```bash
S=<stamp>
# 1. Czy transfer nie uszkodził archiwum.
echo "$(cat data/backups/akuki-tenant-$S.tar.gz.sha256)  data/backups/akuki-tenant-$S.tar.gz" \
  | sha256sum -c -

# 2. Rozpakowanie do katalogu tymczasowego, NIGDY na żywy tenant.
R=$(mktemp -d /tmp/restore-XXXX)
tar -xzf data/backups/akuki-tenant-$S.tar.gz -C "$R"

# 3. Czy każdy plik jest bajt w bajt tym ze źródła.
(cd "$R/akuki" && find . -type f -exec sha256sum {} + | sort -k2 > /tmp/restored.sums)
diff "data/backups/tenant-$S.sums" /tmp/restored.sums && echo ZGODNE

# 4. Czy bazy naprawdę się otwierają, a nie tylko mają właściwe bajty.
```

Czwarte sprawdzenie w dwóch częściach, bo pamięć jest w dwóch magazynach:

```bash
# SQLite
node --input-type=module -e "
import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('$R/akuki/borg.db', { readOnly: true });
console.log('integrity_check:', db.prepare('PRAGMA integrity_check').get().integrity_check);
console.log('encje:', JSON.stringify(db.prepare('select canonical_name, borg_role from entities').all()));
"

# LanceDB -- uruchamiać z katalogu borg/, bo tam jest zależność
cd borg && node --input-type=module -e "
import { connect } from '@lancedb/lancedb';
const db = await connect('$R/akuki/lancedb');
for (const n of await db.tableNames()) {
  const t = await db.openTable(n);
  console.log(n, '=', await t.countRows(), 'wierszy');
}
"
```

Zgodne sumy dowodzą, że bajty są te same. `integrity_check` i otwarcie LanceDB dowodzą, że
te bajty są **używalną bazą**. To dwie różne rzeczy i obie trzeba sprawdzić.

UWAGA NA KOLEJNOŚĆ, złapana przy odtworzeniu 2026-09-08: **czwarte sprawdzenie zmienia
zawartość rozpakowanego katalogu.** Otwarcie bazy, nawet w trybie tylko do odczytu, każe
SQLite utworzyć obok niej `borg.db-shm` (pamięć współdzielona) i `borg.db-wal` (dziennik).
Rozpakowany katalog ma po tym 19 plików, nie 17, więc kopia wysłana na maszynę **po** tym
sprawdzeniu nie przechodzi porównania sum po stronie celu. Oba pliki są niegroźne — `-wal`
jest pusty, `-shm` odbudowuje się sam — ale nie mają czego szukać w podstawianym katalogu.
Albo wysyłać przed czwartym sprawdzeniem, albo usunąć je z katalogu przesiadkowego:

```bash
rm -f /tmp/akuki-restore/borg.db-shm /tmp/akuki-restore/borg.db-wal
```

## Odtworzenie po awarii

Kolejność ma znaczenie: **najpierw zatrzymać writera, na końcu podstawić atomowo.**

```bash
# Na laptopie: rozpakuj i zweryfikuj (kroki 1-4 wyżej), potem wyślij.
rsync -a "$R/akuki/" akuki:/tmp/akuki-restore/

# Na VPS-ie:
ssh akuki
sudo bash
systemctl stop akuki akuki-web
systemctl is-active --quiet akuki && { echo "NIE ZATRZYMANE"; exit 1; }

DATA=/var/lib/akuki/data
STAMP=$(date -u +%Y%m%dT%H%M%SZ)

# Uszkodzonego stanu NIE usuwamy -- archiwizujemy. Może być jedynym śladem przyczyny.
[ -e "$DATA/akuki" ] && mv "$DATA/akuki" "$DATA/akuki-broken-$STAMP"

cp -a /tmp/akuki-restore "$DATA/akuki.incoming"
chown -R akuki:akuki "$DATA/akuki.incoming"
chmod 0750 "$DATA/akuki.incoming"

# Sumy sprawdzone PO STRONIE CELU, przed podstawieniem.
cd "$DATA/akuki.incoming" && find . -type f -exec sha256sum {} + | sort -k2 > /tmp/target.sums
diff /tmp/tenant-<stamp>.sums /tmp/target.sums || { echo "ROZBIEŻNOŚĆ -- nie podstawiam"; exit 1; }

# Atomowe przemianowanie w obrębie jednego systemu plików.
mv "$DATA/akuki.incoming" "$DATA/akuki"

systemctl start akuki
journalctl -u akuki -f
```

W logu po starcie należy szukać linii `as resolved here: tenant=… embeddings=… model=… dims=…`.
Ona mówi, na jaki katalog i jaki endpoint proces naprawdę patrzy — i wyłapuje pomyłkę
w ścieżce zanim zdąży zaboleć.

Druga linia do przeczytania to `default session audience: … ; creator: …`. Mówi, za kogo
proces uważa rozmówcę sesji domyślnej; wartość bierze ze zmiennej `DEMO_AUDIENCE_LABEL`,
a jej brak daje fiksturę demonstracyjną `alice` (opisane w `KNOWN-ISSUES.md`).

SPRAWDZENIE, KTÓREGO NIE WOLNO POMINĄĆ, bo dwa różne stany wyglądają w logu identycznie.
Jeśli podstawienie się nie wykonało, katalog tenanta nie istnieje i Borg zakłada w tym
miejscu **nowy, pusty tenant** — z tymi samymi 59 migracjami i z tą samą encją `Zosia`
z seeda. Rozstrzygają dwie rzeczy, obie tanie:

```bash
sudo ls -la --time-style=+%H:%M:%S /var/lib/akuki/data/akuki   # borg.db ze znacznikiem
                                                               # backupu, nie startu
```

oraz identyfikator encji twórczyni. Świeży seed generuje nowy, losowy identyfikator, więc
zgodność z identyfikatorem z backupu jest dowodem, że to ten sam byt, a nie jego kopia
o tym samym imieniu.

## Czego ten backup NIE chroni

**Jest na jednym laptopie.** Awaria VPS-a jest pokryta. Awaria laptopa **i** VPS-a nie jest.
Prawdziwy offsite — dysk zewnętrzny albo chmura — to decyzja Zosi, bo oznacza wyniesienie
jego pamięci poza jej dwie maszyny.

**Nie jest zautomatyzowany.** Nie ma timera systemd ani crona. Każda kopia jest wykonana
ręcznie i jej brak nie zapali żadnej lampki. Do rozważenia razem z monitoringiem wieku
ostatniego backupu z Etapu 9 w TASK-024.

## Wykonane i sprawdzone

Pierwszy backup: `20260908T121648Z`, 17 plików, archiwum 41 309 B, suma
`715a941b8b2ab2b5e2bfeb3b7fd14d72eb782ed5d06ed89c3820910ffd162138`.

Odtworzenie próbne przeszło wszystkie cztery sprawdzenia: suma archiwum po transferze OK,
17 z 17 plików zgodnych bajt w bajt, `integrity_check: ok`, 59 migracji, encja `Zosia`
z rolą `creator`, siedem tabel LanceDB otwartych i policzonych — wszystkie po zero wierszy,
co jest prawdą o tym stanie: pusty hipokamp, zachowana wiedza o tym, kim jest jego
twórczyni.
