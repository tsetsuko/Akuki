# Pliki wdrożeniowe na VPS-ie

## Nocny snapshot (`akuki-snapshot.service` + `.timer`)

Co noc o 03:17 czasu polskiego zapisuje stan Akukiego do
`/var/lib/akuki/snapshots/akuki-<czas>.json` (ok. 220 KB). Z tych plików korzysta
dziennik rozwoju: `python -m akuki.dziennik kandydaci` dociąga je na laptopa.

Instalacja, na VPS-ie, po `akuki-wgraj.sh` (który dociąga to repozytorium do
`/opt/akuki/spec`):

```bash
sudo install -m 644 /opt/akuki/spec/deploy/akuki-snapshot.service /opt/akuki/spec/deploy/akuki-snapshot.timer /etc/systemd/system/
sudo install -d -o akuki -g akuki -m 750 /var/lib/akuki/snapshots
sudo systemctl daemon-reload
sudo systemctl start akuki-snapshot.service      # pierwszy snapshot od razu, jako próba
sudo systemctl enable --now akuki-snapshot.timer
```

Sprawdzenie:

```bash
systemctl status akuki-snapshot.service --no-pager   # ostatni przebieg: status=0/SUCCESS
systemctl list-timers akuki-snapshot.timer --no-pager
sudo ls -la /var/lib/akuki/snapshots
```

Wyłączenie: `sudo systemctl disable --now akuki-snapshot.timer`. Snapshoty zostają.

Usługa Akukiego nie jest restartowana i nie wie o snapshotach. Snapshot trwa
około 8 sekund.
