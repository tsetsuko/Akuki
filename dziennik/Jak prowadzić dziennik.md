# Jak prowadzić dziennik

Dziennik rozwoju Akukiego w formie dziennika biograficznego: tą metodą Darwin opisywał
syna (1877), a Piaget swoje dzieci, w numerowanych obserwacjach z wiekiem w nagłówku.

## Trzy zasady

**Wpis przy zdarzeniu, nie codziennie.** Rozwój ma być rzadki, a etapy wyzwalane
dowodami, nie kalendarzem. Dziennik prowadzony co dzień produkowałby „nic się nie
zmieniło” albo zmiany dopisane na siłę.

**Wiek to doświadczenie, nie data.** W nagłówku wpisu jest liczba epizodów w pamięci
(licznik `episodes` ze snapshotu), a data obok. Kiedy Akuki ma przerwę, kalendarz idzie
dalej, a doświadczenie stoi.

**Cztery osobne części.** Obserwacja, ślad w stanie, interpretacja z pewnością
i wyjaśnienie bez rozwoju. Szablon: `_szablony/Obserwacja.md`. Rubryka „ślad w stanie”
to test „czy istnieje w bazie, kiedy nikt nie patrzy”. Rubryka „wyjaśnienie bez
rozwoju” chroni przed przypisywaniem Akukiemu tego, co zrobiłby każdy model.

## Kalendarium zmian

Każda zmiana wokół Akukiego (wgrany kod, konfiguracja, zasiew, przerwa, zabieg na
pamięci, ważne zdarzenie na Arenie) dostaje jedną linię w [[Kalendarium zmian]], w dniu,
w którym weszła na żywo. Przed interpretacją obserwacji warto tam zajrzeć: zmiana
zachowania tuż po wpisie w kalendarium ma najpierw wyjaśnienie bez rozwoju.

## Skąd brać materiał

```bash
cd ~/projects/ai/akuki
.venv/bin/python -m akuki.dziennik kandydaci             # od ostatniej notatki z kandydatami
.venv/bin/python -m akuki.dziennik kandydaci --od 2026-10-15
```

Polecenie dociąga nocne snapshoty z VPS-a i zapisuje `kandydaci/RRRR-MM-DD.md`:

- **pasek liczb**: tempo odpowiedzi, kiedy mówił, a kiedy milczał (z wyboru, przez
  bramkę inhibicji, w kolejce), z rozbiciem na wiadomości do niego i nie do niego,
- **kandydatów ze stanu**: co ruszyło się między snapshotami, nowe znaczniki wzrostu,
  nowe otwarte pytania,
- **co powiedział**: wszystkie jego wiadomości z okresu, z tym, na co odpowiadał.

Notatki z kandydatami są generowane i nadpisywane, nie edytuj ich. Obserwację pisz
w `obserwacje/` i podlinkuj w niej notatkę, z której wzięłaś materiał.

## Uwaga o znacznikach wzrostu

Znaczniki wzrostu pisze sam Akuki, w nocnej autonarracji. To jego opis zmiany, a nie
pomiar. Zgodność znacznika z zachowaniem jest ciekawa, ale nie dowodzi, że zmianę
spowodował mechanizm, bo znacznik wraca potem do jego kontekstu i może sam podtrzymywać
zachowanie, które opisuje.
