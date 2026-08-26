"""Diagnostyka dostępu do modelu cognition: czy Sonnet 5 odpowiada, a jeśli nie — na której warstwie stoi.

Dlaczego to nie jest jednolinijkowy curl w pętli: w tym tygodniu "sonnet nie działa"
znaczyło TRZY różne rzeczy, na trzech różnych warstwach:

  brak korzenia CA        -> UNABLE_TO_GET_ISSUER_CERT_LOCALLY   (warstwa TLS)
  zerwany tunel VPN       -> UND_ERR_CONNECT_TIMEOUT             (warstwa sieci)
  wysycona pula proxy     -> rate_limit_error, HTTP 200 po drodze (warstwa aplikacji)

Objaw nie jest diagnozą, więc ten skrypt nie odpowiada "działa / nie działa", tylko
mówi, KTÓRA warstwa stoi. Kolejność sprawdzeń jest od najtańszej do najdroższej.

Dwie rzeczy, które ten skrypt robi celowo, a curl nie:

1. Wypisuje `model` ZWRÓCONY przez API, nie ten wysłany w żądaniu. "claude-sonnet-5"
   nie ma daty w nazwie, więc może z czasem wskazywać na inny snapshot — a wtedy
   odczyt t0 i odczyt za trzy miesiące zmierzyłyby PODMIANĘ MODELU i nikt by tego
   nie zauważył (TASK-022 AC #4).
2. Wypisuje `cache_creation_input_tokens` i `cache_read_input_tokens` z `usage`,
   bo przez aiproxy nie było wiadomo, czy licznik cache'u w ogóle do nas dociera
   (TASK-013 AC #1). Dociera — ten skrypt to pokazuje przy każdym biegu.

Sprawdzenie kosztuje kilkadziesiąt tokenów wyjścia i NIE DOTYKA tenanta Akukiego:
to samo zapytanie HTTP, żadnego borga, żadnego zapisu do pamięci.

Kody wyjścia (żeby dało się tego użyć w pętli i w CI):
  0  model docelowy odpowiedział
  1  model docelowy zablokowany, ale model kontrolny odpowiada  -> to limit tieru, nie awaria
  2  nic nie odpowiada                                          -> sieć albo autoryzacja
  3  problem z konfiguracją (brak zmiennych środowiskowych)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

DATA_ROOT = Path("/home/zosia/projects/ai/akuki/data")
LOG_DEFAULT = DATA_ROOT / "diag" / "cognition-probe.jsonl"

MODEL_DOCELOWY = "claude-sonnet-5"
# Model kontrolny MUSI być z tej samej rodziny i za tym samym proxy, ale z INNEGO tieru.
# Bez niego nie da się odróżnić "zablokowany sonnet" od "zablokowane wszystko".
MODEL_KONTROLNY = "claude-haiku-4-5-20251001"

# 64, nie 16: na Sonnecie 5 myślenie adaptacyjne jest jedynym trybem włączonym, więc przy
# bardzo niskim limicie odpowiedź może skończyć się na `max_tokens` jeszcze w fazie myślenia
# i wrócić bez tekstu. Dla testu osiągalności to nadal sukces, ale czytałoby się jak awaria.
MAX_TOKENS = 64

TIMEOUT_S = 30


# --------------------------------------------------------------------------- wynik

@dataclass
class Wynik:
    """Jedno sprawdzenie jednego modelu, rozłożone na warstwy."""

    model_zadany: str
    warstwa: str  # config | dns | siec | tls | autoryzacja | limit | aplikacja | ok
    ok: bool
    szczegol: str
    model_zwrocony: str | None = None
    http: int | None = None
    typ_bledu: str | None = None
    stop_reason: str | None = None
    usage: dict[str, Any] = field(default_factory=dict)
    ms: int | None = None

    def linia(self) -> str:
        znak = "OK  " if self.ok else "STOP"
        return f"{znak} [{self.warstwa}] {self.model_zadany}: {self.szczegol}"


# --------------------------------------------------------------------------- warstwy tanie

def sprawdz_konfiguracje() -> tuple[str | None, str | None, list[str]]:
    """Zwraca (base_url, token, komunikaty). Token NIGDY nie jest wypisywany w całości."""
    linie: list[str] = []
    base = os.environ.get("ANTHROPIC_BASE_URL")
    token = os.environ.get("ANTHROPIC_AUTH_TOKEN") or os.environ.get("ANTHROPIC_API_KEY")

    if base:
        linie.append(f"OK   [config] ANTHROPIC_BASE_URL = {base}")
    else:
        linie.append("STOP [config] ANTHROPIC_BASE_URL nie jest ustawione")

    if token:
        # Konwencja z backlogu: token identyfikujemy przez skrót sha256, nigdy przez treść.
        odcisk = hashlib.sha256(token.encode()).hexdigest()[:8]
        zrodlo = "ANTHROPIC_AUTH_TOKEN" if os.environ.get("ANTHROPIC_AUTH_TOKEN") else "ANTHROPIC_API_KEY"
        linie.append(f"OK   [config] {zrodlo}: {len(token)} znaków, sha256 {odcisk}")
    else:
        linie.append("STOP [config] brak ANTHROPIC_AUTH_TOKEN i ANTHROPIC_API_KEY")

    return base, token, linie


def sprawdz_dns_i_trase(base_url: str) -> list[str]:
    """DNS plus informacja, czy tunel VPN leży na tej ścieżce.

    Ma znaczenie, bo aiproxy jest hostem PUBLICZNYM: zerwany VPN nie może być
    przyczyną błędu z tego endpointu, a kratos jest odwrotnie — bez tunelu nie żyje.
    """
    linie: list[str] = []
    host = urlparse(base_url).hostname or base_url
    try:
        ip = socket.gethostbyname(host)
        linie.append(f"OK   [dns] {host} -> {ip}")
    except OSError as e:
        linie.append(f"STOP [dns] {host}: {e}")
        return linie

    try:
        out = subprocess.run(
            ["ip", "route", "get", ip], capture_output=True, text=True, timeout=5
        ).stdout.strip().splitlines()
        if out:
            trasa = out[0].strip()
            przez_tunel = " dev ppp" in trasa or " dev fctvpn" in trasa
            gdzie = "przez tunel VPN" if przez_tunel else "POZA tunelem (host publiczny)"
            linie.append(f"OK   [trasa] {gdzie}: {trasa}")
    except (OSError, subprocess.SubprocessError):
        linie.append("     [trasa] pominięte (brak polecenia `ip`)")

    return linie


# --------------------------------------------------------------------------- zapytanie

def sprobuj_model(base_url: str, token: str, model: str, max_tokens: int = MAX_TOKENS) -> Wynik:
    """Jedno zapytanie do /v1/messages. Klasyfikuje odpowiedź na warstwy."""
    url = base_url.rstrip("/") + "/v1/messages"
    body = json.dumps(
        {
            "model": model,
            "max_tokens": max_tokens,
            "messages": [{"role": "user", "content": "odpowiedz jednym slowem: dziala"}],
        }
    ).encode()

    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            # Bearer, a nie x-api-key: to działa przez aiproxy. Nagłówki sprawdzone
            # i NIE zmieniają wyniku (TASK-022, obserwacja 3) — zmieniają tylko treść
            # komunikatu błędu, więc nie ma sensu ich tu przełączać.
            "authorization": f"Bearer {token}",
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
    )

    start = time.monotonic()
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
            ms = int((time.monotonic() - start) * 1000)
            dane = json.loads(resp.read().decode())
            zwrocony = dane.get("model")
            usage = dane.get("usage") or {}
            tekst = "".join(
                b.get("text", "") for b in dane.get("content", []) if b.get("type") == "text"
            ).strip()
            szczegol = f"HTTP 200 w {ms} ms, model zwrócony: {zwrocony}"
            if zwrocony and zwrocony != model:
                szczegol += "  <- UWAGA: inny niż żądany"
            if tekst:
                szczegol += f', treść: "{tekst[:60]}"'
            else:
                szczegol += f" (bez tekstu, stop_reason={dane.get('stop_reason')})"
            return Wynik(
                model_zadany=model,
                warstwa="ok",
                ok=True,
                szczegol=szczegol,
                model_zwrocony=zwrocony,
                http=200,
                stop_reason=dane.get("stop_reason"),
                usage=usage,
                ms=ms,
            )

    except urllib.error.HTTPError as e:
        ms = int((time.monotonic() - start) * 1000)
        surowe = e.read().decode(errors="replace")
        typ = None
        komunikat = surowe[:200]
        try:
            blad = json.loads(surowe).get("error") or {}
            typ = blad.get("type")
            komunikat = blad.get("message", komunikat)
        except (ValueError, AttributeError):
            pass

        if e.code in (401, 403):
            warstwa = "autoryzacja"
        elif e.code == 429 or typ in ("rate_limit_error", "proxy_error"):
            # To NIE jest awaria: proxy odpowiedziało, więc sieć i klucz są sprawne.
            warstwa = "limit"
        else:
            warstwa = "aplikacja"

        return Wynik(
            model_zadany=model,
            warstwa=warstwa,
            ok=False,
            szczegol=f"HTTP {e.code} w {ms} ms, {typ or 'bez typu'}: {komunikat}",
            http=e.code,
            typ_bledu=typ,
            ms=ms,
        )

    except (urllib.error.URLError, OSError, TimeoutError) as e:
        ms = int((time.monotonic() - start) * 1000)
        powod = getattr(e, "reason", e)
        warstwa = "tls" if "CERTIFICATE" in str(powod).upper() else "siec"
        return Wynik(
            model_zadany=model,
            warstwa=warstwa,
            ok=False,
            szczegol=f"brak odpowiedzi po {ms} ms: {powod}",
            ms=ms,
        )


# --------------------------------------------------------------------------- jeden przebieg

def przebieg(
    base_url: str, token: str, model: str, kontrola: str, max_tokens: int, cicho: bool = False
) -> tuple[int, Wynik]:
    """Zwraca (kod wyjścia, wynik modelu docelowego)."""
    def pokaz(wy: Wynik, wciecie: str = "") -> None:
        print(wciecie + wy.linia())
        if not wy.usage:
            return
        u = wy.usage
        # Wypisywane TAKŻE dla modelu kontrolnego, i to celowo: dopóki sonnet stoi, kontrola
        # jest jedynym miejscem, w którym widać, czy proxy w ogóle odsyła liczniki cache'u
        # (TASK-013 AC #1). Zera przy krótkim zapytaniu są poprawne — prefiks nie dobija progu.
        print(
            wciecie
            + "     [usage] wejście={} zapis_cache={} odczyt_cache={} wyjście={}".format(
                u.get("input_tokens"),
                u.get("cache_creation_input_tokens"),
                u.get("cache_read_input_tokens"),
                u.get("output_tokens"),
            )
        )

    w = sprobuj_model(base_url, token, model, max_tokens)
    if not cicho:
        pokaz(w)

    if w.ok:
        return 0, w

    # Model docelowy padł. Kontrola oddziela "zablokowany tier" od "zablokowane wszystko".
    k = sprobuj_model(base_url, token, kontrola, max_tokens)
    if not cicho:
        print("     kontrola ->")
        pokaz(k, "     ")
    if k.ok:
        if not cicho:
            print(
                f"\nWNIOSEK: {kontrola} odpowiada, {model} nie. Sieć, TLS i klucz są sprawne —\n"
                f"         stoi wyłącznie tier modelu {model}, po stronie puli proxy.\n"
                f"         To warunek przejściowy i nie ma go po naszej stronie do naprawienia."
            )
        return 1, w

    if not cicho:
        print(
            f"\nWNIOSEK: żaden model nie odpowiada — warstwa '{w.warstwa}'. To NIE jest limit tieru.\n"
            f"         Sprawdź w tej kolejności: tunel (ip -brief link show), klucz, adres proxy."
        )
    return 2, w


def zapisz_log(sciezka: Path, w: Wynik, kod: int) -> None:
    sciezka.parent.mkdir(parents=True, exist_ok=True)
    wpis = {
        "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "model_zadany": w.model_zadany,
        "model_zwrocony": w.model_zwrocony,
        "warstwa": w.warstwa,
        "ok": w.ok,
        "http": w.http,
        "typ_bledu": w.typ_bledu,
        "ms": w.ms,
        "usage": w.usage,
        "kod": kod,
        "szczegol": w.szczegol,
    }
    with sciezka.open("a", encoding="utf-8") as f:
        f.write(json.dumps(wpis, ensure_ascii=False) + "\n")


# --------------------------------------------------------------------------- CLI

def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        description="Czy model cognition odpowiada, a jeśli nie — na której warstwie stoi.",
    )
    p.add_argument("--model", default=MODEL_DOCELOWY, help=f"model badany (domyślnie {MODEL_DOCELOWY})")
    p.add_argument(
        "--kontrola",
        default=MODEL_KONTROLNY,
        help=f"model kontrolny z innego tieru (domyślnie {MODEL_KONTROLNY})",
    )
    p.add_argument("--max-tokens", type=int, default=MAX_TOKENS, help=f"domyślnie {MAX_TOKENS}")
    p.add_argument(
        "--watch",
        type=int,
        metavar="SEK",
        help="pytaj co SEK sekund, aż model odpowie (jedna linia na próbę)",
    )
    p.add_argument(
        "--proby", type=int, default=0, metavar="N", help="limit prób w trybie --watch (0 = bez limitu)"
    )
    p.add_argument("--log", default=str(LOG_DEFAULT), help=f"dopisuj JSONL (domyślnie {LOG_DEFAULT})")
    p.add_argument("--bez-logu", action="store_true", help="nie zapisuj nic na dysk")
    a = p.parse_args(argv)

    base, token, linie = sprawdz_konfiguracje()
    for l in linie:
        print(l)
    if not base or not token:
        print("\nWNIOSEK: brak konfiguracji — nie było czego sprawdzać.")
        return 3

    for l in sprawdz_dns_i_trase(base):
        print(l)
    print()

    log = None if a.bez_logu else Path(a.log)

    if a.watch is None:
        kod, w = przebieg(base, token, a.model, a.kontrola, a.max_tokens)
        if log:
            zapisz_log(log, w, kod)
        return kod

    # Tryb czekacza. Pytanie brzmi "KIEDY wróciło", więc każda próba dostaje znacznik czasu,
    # a log JSONL zostaje — inaczej odpowiedź na to pytanie znika razem z terminalem.
    print(f"czekam na {a.model}, próba co {a.watch} s (Ctrl-C przerywa)")
    nr = 0
    try:
        while True:
            nr += 1
            w = sprobuj_model(base, token, a.model, a.max_tokens)
            kod = 0 if w.ok else 1
            teraz = datetime.now().strftime("%H:%M:%S")
            print(f"{teraz}  proba {nr:>4}  {w.linia()}", flush=True)
            if log:
                zapisz_log(log, w, kod)
            if w.ok:
                print(f"\nODPOWIEDZIAL po {nr} probach.")
                return 0
            if a.proby and nr >= a.proby:
                print(f"\nLimit {a.proby} prob wyczerpany, nadal nie odpowiada.")
                return 1
            time.sleep(a.watch)
    except KeyboardInterrupt:
        print(f"\nPrzerwane po {nr} probach.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
