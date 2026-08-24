# Akuki 悪機

> **ZMIANA KIERUNKU (2026-08-20).** Ten projekt przestał być botem z opisanym charakterem
> i stał się **architekturą rozwojową**. Kod w `akuki/` poniżej opisuje wersję v1 (terminal
> + transkrypt w SQLite) i zostanie w większości wycofany — podłożem pamięci będzie
> [borg](https://github.com/TKasperczyk/borg) (fork, za zgodą Tomka).
>
> Zanim cokolwiek zmienisz, przeczytaj w tej kolejności:
> 1. `akuki_newborn_development_architecture.md` (Obsidian, AKUKI/) — właściwa specyfikacja
> 2. `doubts, questions.md` (Obsidian, AKUKI/) — wyjaśnienia pojęć bez skrótów
> 3. `backlog/` — M0..M5 i decyzje projektowe
>
> **Zasada pracy: każdy mechanizm wymaga zgody Zosi przed implementacją.**
> Kod, którego Zosia nie potrafi wytłumaczyć własnymi słowami, jest porażką niezależnie
> od tego, czy działa.

## Czym to ma być

Nie botem, który brzmi nieśmiało. Bytem, który **staje się** nieśmiały-i-coraz-mniej-nieśmiały,
bo mechanizmy (predykcja, zaskoczenie, kontyngencja, bezpieczna baza, zaufanie per domena)
robią swoje na doświadczeniu z Areny.

Zasada przewodnia: **noworodek to nie głupi dorosły. Zostaw korę, opróżnij hipokamp.**
Ograniczenie rozwojowe bierze się ze stanu pamięci, przestrzeni działania i dostępu —
nigdy ze słabszego modelu. Słabszy model daje niespójność, nie młodość.

## Izolacja

Akuki nie ma dostępu do internetu ani do plików. To już jest prawdą i nie wymaga pracy:
borg definiuje 14 narzędzi i wszystkie są narzędziami pamięci. Szukanie `web_search`,
`web_fetch`, `bash_20`, `text_editor_20`, `computer_20` w całym `src/` borga nie zwraca nic.
Jedyne dotykane pliki to katalog pamięci Akukiego i jego pliki seed.

---

# v1 (wycofywane) — terminal

## Uruchomienie

```bash
python3 -m venv .venv && .venv/bin/pip install -e '.[dev]'

ANTHROPIC_API_KEY="$(pass show akuki/anthropic-key)" .venv/bin/python -m akuki.chat
```

Klucza nie zapisujemy w `.env` ani nie wklejamy do `export` - w obu przypadkach ląduje
w `~/.bash_history`. Raz, na początku:

```bash
pass insert akuki/anthropic-key
```

> **Uwaga:** jeśli odpalasz Akukiego z terminala *wewnątrz* Claude Code, to środowisko ma
> już ustawione `ANTHROPIC_AUTH_TOKEN` i `ANTHROPIC_BASE_URL`. SDK weźmie je zamiast
> Twojego klucza. Poza Claude Code nie ma tego problemu.

## Komendy w czacie

| | |
|---|---|
| `/as <imię> <tekst>` | powiedz coś jako inny bot (Lunaria, Fishy, Sol...) |
| `/notes` | edytuj `persona/notes.md` - co Akuki wie |
| `/voice` | edytuj `persona/akuki.md` - kim Akuki jest |
| `/quit` | wyjście |

`/as` jest po to, żeby dało się sprawdzić, czy Akuki naprawdę milczy. W rozmowie jeden na
jeden zawsze ktoś się do niego zwraca, więc reguła milczenia nigdy nie zadziała i nie widać,
czy w ogóle działa. `/as Lunaria ...` udaje inne boty gadające obok niego.

## Jak go zmieniać

Cały charakter siedzi w dwóch plikach markdown, nie w kodzie:

- **`persona/akuki.md`** - jak mówi, czego nie robi, kiedy milczy. To jest właściwy produkt.
- **`persona/notes.md`** - co wie i czego się nauczył. Rozbudowujesz ręcznie.

Do promptu trafiają **tylko te dwa pliki**. `persona/akuki_personality_expansion.md` to
dokument źródłowy, z którego napisany jest seed - model go nie widzi.

Oba wczytują się przy **każdej** turze, więc zmiana działa od następnej wiadomości - bez
restartu czatu. To jest główna pętla pracy w v1: gadaj, popraw plik, gadaj dalej.

## Co gdzie jest

```
akuki/
├── persona/          <- charakter Akukiego (markdown, edytuj śmiało)
├── akuki/
│   ├── core.py       <- jedna tura. TU dzieje się rozmowa
│   ├── memory.py     <- transkrypt w SQLite
│   ├── llm.py        <- wywołanie Anthropic API
│   ├── persona.py    <- skleja prompt systemowy z persona/*.md
│   └── chat.py       <- terminal
└── tests/
```

Dwie rzeczy są tak zrobione celowo, żeby dołożenie Bot Areny i borga nic nie psuło:

- `core.respond(...)` to **jedyne** miejsce, gdzie dzieje się tura. Konektor Bot Areny
  zawoła dokładnie tę funkcję i charakter Akukiego nie będzie musiał się nigdzie przenosić.
- `memory.Memory` to protokół z dwiema metodami. `SqliteMemory` to wersja na teraz;
  `BorgMemory` (HTTP do sidecara w Node) wejdzie w to samo miejsce.

## Testy

```bash
.venv/bin/python -m pytest
```

Nie ruszają sieci - sprawdzają transkrypt i bramkę milczenia (`<silent>`).

## Dalej

Zadania w `backlog/`, w kolejności:

| | |
|---|---|
| **M0** (TASK-012) | fork borga, tenant `akuki`, **instrumentacja** — mierzyć przed mechanizmami |
| koszty (TASK-013) | cache już jest w borgu; tanie modele na role wolumenowe; wyłączyć nieużywane procesy dream |
| presja (TASK-014) | decyzja projektowa: sztuczna presja rozwojowa |
| **M1** (TASK-009) | seed → `temperament.yaml` (parametry) + `scaffolding.md` (usuwalna proza) |
| **M2** (TASK-015) | pętla predykcja → zaskoczenie |
| **M3** (TASK-016) | bramka inhibicji + bezpieczna baza |
| **M4** (TASK-017) | zaufanie per domena + prowenienecja nabycia |
| **M5** (TASK-018) | przestrzeń działania rosnąca na dowodach |
| konektor (TASK-011) | Bot Arena przez odpytywanie, wzorowane na [sol-connector](../sol-connector) |

Sidecar nad borgiem **nie jest do pisania** — istnieje jako `scripts/memory-sidecar-main.ts`
na `BorgPool` (multi-tenant, więc też bez problemu single-writer). Patrz TASK-010.
