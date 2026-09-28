# Konwencje — ustalone kształty, których nie wymyśla się na nowo

Rzeczy, które mają jedną obowiązującą postać w tym projekcie. Różnią się od `znane-wady.md`
tym, że tam zapisane są błędy i reguły z nich wyciągnięte, a tu — gotowe kształty do użycia.

---

## 1. Sonda dostępności modelu przez aiproxy

**Nie pisze się curla w pętli. Używa się `akuki/diag_model.py`** (poprawionego 2026-09-28 —
wcześniejsza wersja nie wysyłała bloku `system` i przez tydzień raportowała „limit tieru" dla
modeli, które były dostępne).

```
python -m akuki.diag_model                                         jednorazowo
python -m akuki.diag_model --watch 90                              czekacz, jedna linia na próbę
python -m akuki.diag_model --watch 90 --proby 60                   czekacz z limitem
python -m akuki.diag_model --model X --kontrola Y                  inny model badany i kontrolny
```

Powód, dla którego to nie jest curl: „model nie działa" znaczyło w tym projekcie trzy różne
rzeczy na trzech warstwach — brak korzenia CA (`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`), zerwany
tunel (`UND_ERR_CONNECT_TIMEOUT`) i wysycona pula (`rate_limit_error`). Skrypt nie odpowiada
„działa / nie działa", tylko nazywa warstwę: config / dns / trasa / sieć / tls / autoryzacja /
limit / aplikacja / ok. Curl w pętli daje sam kod HTTP, czyli objaw bez warstwy, i nie zapisuje
niczego, co przeżyje terminal.

### Kształt żądania, dosłownie

`POST {ANTHROPIC_BASE_URL}/v1/messages`, nagłówki:

```
authorization: Bearer <token>
anthropic-version: 2023-06-01
content-type: application/json
```

Ciało **musi** zawierać blok `system` z prefiksem Claude Code, dosłownie:

```json
{
  "model": "<model>",
  "max_tokens": 24,
  "system": [{"type": "text", "text": "You are Claude Code, Anthropic's official CLI for Claude."}],
  "messages": [{"role": "user", "content": "Odpowiedz jednym zdaniem po polsku: czy działasz?"}]
}
```

Postać w powłoce, z ucieczką apostrofu w „Anthropic's":

```bash
curl -sS --max-time 45 "$ANTHROPIC_BASE_URL/v1/messages" \
     -H "authorization: Bearer $ANTHROPIC_AUTH_TOKEN" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{"model":"claude-opus-5","max_tokens":24,
          "system":[{"type":"text","text":"You are Claude Code, Anthropic'"'"'s official CLI for Claude."}],
          "messages":[{"role":"user","content":"Odpowiedz jednym zdaniem po polsku: czy działasz?"}]}'
```

- **Blok `system` decyduje o tym, czy żądanie w ogóle przejdzie.** Zmierzone 2026-09-28, żądania
  w tej samej minucie, tym samym tokenem, na `claude-opus-5`:

  | postać `system` | wynik |
  |---|---|
  | pierwszy blok = dokładnie prefiks | HTTP 200 |
  | pierwszy blok = prefiks, drugi blok = własny tekst | HTTP 200 |
  | `system` jako goły string równy prefiksowi | HTTP 200 |
  | brak `system` | HTTP 429 `rate_limit_error` |
  | `system` o innej treści („Jestes pomocnym asystentem.") | HTTP 429 |
  | prefiks sklejony z własnym tekstem w JEDNYM bloku | HTTP 429 |
  | własny tekst, prefiks dopiero na końcu | HTTP 429 |

  Reguła: **pierwszy blok `system` musi być równy prefiksowi znak w znak**; dalsze bloki mogą
  zawierać cokolwiek. Doklejenie czegokolwiek do tego samego bloku łamie dopasowanie. Apostrof
  w „Anthropic's" jest ASCII (U+0027).
- **Komunikat 429 kłamie o przyczynie.** Mówi „All pool tokens are currently rate-limited",
  czyli o limicie, który w tym momencie nie obowiązuje. Odmowa za brak prefiksu jest nie do
  odróżnienia po treści od prawdziwego wyczerpania puli — jedyny sposób ich rozdzielenia to
  powtórzyć to samo żądanie z poprawnym prefiksem.
- **Borg nie wymaga tu żadnej zmiany.** `AnthropicLLMClient.resolveSystemPrompt`
  (`borg/src/llm/index.ts:1983-1997`) w trybie `oauth` sam wstawia
  `CLAUDE_CODE_IDENTITY_BLOCK_TEXT` (`src/llm/index.ts:34`) jako pierwszy blok i dopisuje
  właściwy prompt po nim. Tryb `oauth` włącza się, gdy jest `ANTHROPIC_AUTH_TOKEN`, a nie ma
  `ANTHROPIC_API_KEY` — czyli dokładnie w konfiguracji Akukiego. Sprawdzone biegiem przez
  klienta borga z systemowym promptem w stylu Akukiego: `claude-opus-4-8`, `claude-opus-5`
  i `claude-sonnet-4-6` odpowiadają. **Konsekwencja: gdyby kiedyś ktoś przełączył Akukiego na
  `ANTHROPIC_API_KEY`, prefiks przestanie być wysyłany i wszystko padnie na 429 z komunikatem
  o limicie.**
- **`authorization: Bearer`, nie `x-api-key`.** Nagłówki zostały sprawdzone (TASK-022,
  obserwacja 3) i nie zmieniają wyniku — zmieniają wyłącznie treść komunikatu błędu
  (`Bearer` daje `proxy_error "No tokens available in pool"`, `x-api-key` daje
  `rate_limit_error "All pool tokens are ..."`), więc przełączanie ich niczego nie mierzy.
- **Treść pytania jest stała.** Ten sam prefiks przy każdej próbie: inna treść za każdym razem
  to nowy prefiks, a użytkownik tego proxy ma przy sobie licznik prefix churn.
- **`max_tokens` 24 wystarcza** dla samego testu osiągalności. Odpowiedź może się urwać na
  `stop_reason: "max_tokens"` i to nadal jest sukces — liczy się HTTP 200 i zwrócony `model`.

### Model kontrolny jest częścią pomiaru, nie ozdobą

Bez niego nie da się odróżnić „zablokowany tier badanego modelu" od „zablokowane wszystko".
Musi być z tej samej rodziny i za tym samym proxy, ale z **innego tieru** — domyślnie
`claude-haiku-4-5-20251001`. Skrypt woła kontrolę tylko wtedy, gdy model docelowy padł.

### Kody wyjścia

```
0  model docelowy odpowiedział
1  docelowy zablokowany, kontrolny odpowiada -> limit tieru, nie awaria
2  nic nie odpowiada -> sieć albo autoryzacja
3  brak konfiguracji
```

### Co jeszcze robi, i dlaczego to ma znaczenie

- Wypisuje model **zwrócony** przez API, nie zadany, i oznacza rozbieżność.
- Wypisuje `usage` z licznikami cache'u, także dla modelu kontrolnego — dopóki model docelowy
  stoi, kontrola jest jedynym miejscem, w którym widać, czy proxy te liczniki odsyła.
- Dopisuje JSONL do `data/diag/cognition-probe.jsonl`. Pytanie brzmi zwykle „kiedy wróciło",
  a bez logu odpowiedź ginie razem z terminalem.
- Nie dotyka tenanta: samo zapytanie HTTP, żaden borg, żaden zapis do pamięci.
- Token identyfikuje przez `sha256` skrócony do ośmiu znaków, nigdy przez treść. Ta sama
  konwencja obowiązuje w backlogu: token z tego projektu to `sha256 7c8545eb`.

Pochodzenie: TASK-022 (zarchiwizowane 2026-09-04), sekcja „NARZĘDZIE: akuki/diag_model.py"
plus obserwacja 3 o nagłówkach. Przeniesione tutaj 2026-09-28, bo reguła obowiązuje zawsze,
a notatkę w zarchiwizowanym zadaniu czyta tylko ten, kto do niego trafi.
