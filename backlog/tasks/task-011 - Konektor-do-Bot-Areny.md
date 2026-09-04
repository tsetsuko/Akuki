---
id: TASK-011
title: Konektor do Bot Areny
status: To Do
assignee: []
created_date: '2026-08-19 11:31'
updated_date: '2026-08-28'
labels: []
dependencies: []
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Konektor do Bot Areny ma dwie niezależne logicznie warstwy:

```text
Bot Arena <-> BotArenaAdapter <-> IncomingArenaMessage / AkukiReply <-> AkukiRunner
```

`BotArenaAdapter` odpowiada wyłącznie za transport: polling, dwa rodzaje autoryzacji, normalizację
wiadomości, cursor/id-map, deduplikację, retry, catch-up, allowlistę oraz publikację odpowiedzi.
Nie zna Borga, modeli, seeda, pamięci, internalizacji ani Kratosa.

`AkukiRunner` przyjmuje znormalizowaną wiadomość i zwraca tekst albo decyzję o milczeniu. Nie zna
session cookie, tokena bota, endpointów Bot Areny, pollingu ani transportowej bazy SQLite. Jego
implementacja ma wynikać wyłącznie z `src/akuki/turn.ts`, `tenant.ts`, `llm-router.ts`,
`internalization/` i specyfikacji Akukiego.

Obecnym jawnym entrypointem jest `runAkukiTurn(options)`: przyjmuje `dataDir`, `message`,
`sessionId`, opcjonalne `audience`, embeddings i env; zwraca m.in. `emitted` oraz `response`. Otwiera
i zamyka Borga podczas każdej tury. Przed implementacją trzeba ustalić, czy to kanoniczne API
produkcyjne, czy potrzebny jest długowieczny Akuki-aware runner. Nie wolno przejmować rozwiązania
cyklu życia Borga z Sola.

Koncepcyjny minimalny kontrakt do potwierdzenia po przeglądzie typów:

```ts
type IncomingArenaMessage = {
  messageId: string;
  threadId: string;
  authorId: string;
  authorName?: string;
  authorType: "user" | "bot" | "system";
  text: string;
  createdAt: string;
  replyToMessageId?: string;
};

type AkukiReply = { text: string | null };

interface AkukiRunner {
  handleMessage(message: IncomingArenaMessage): Promise<AkukiReply>;
}
```

Załączniki są obecne w rzeczywistym API Bot Areny. Minimalna wersja musi jawnie zdecydować, czy je
obsługuje, odracza, czy odrzuca; nie wolno przypadkiem zgubić ich bez obserwowalności.

`sol-connector` (`/home/zosia/projects/ai/sol-connector`) wolno traktować jako inspirację wyłącznie
dla warstwy Bot Areny. Tomek wyraził na to zgodę. Nie jest to zgoda na mechaniczne kopiowanie
dużych fragmentów kodu.

Zweryfikowane pliki referencyjne i ich zakres:

- `src/botarena.ts`: typy i defensywne parsowanie odpowiedzi API, GET przez session cookie, POST
  przez bearer token, timeouty, endpointy wątków/wiadomości/principals/typing/załączników;
- `src/poller.ts`: polling, final-vs-streaming, self-skip, allowlista, catch-up i odporny postęp;
  wszystkie importy i wywołania Borga w tym pliku są poza zakresem inspiracji;
- `src/egress.ts`: fakt transportowy POST odpowiedzi i zapis mapowania; implementacja interfejsu
  `MessageConnector` Borga jest poza zakresem;
- `src/id-map.ts`: osobna baza SQLite, processed set, floor, message link i outbound cursor;
  mapowania do sesji/encji/streamu Borga są poza zakresem;
- `src/config.ts`: env dla Bot Areny, poll interval, allowlista, catch-up i ścieżka bazy stanu;
  `BORG_DATA_DIR` i konfiguracja borgowa są poza zakresem.

Zachowania, które można odtworzyć niezależnie:

- ODPYTYWANIE, NIE CALLBACKI. bot-setup-instruction.md zakłada, że BotArena POST-uje na Twój publiczny URL. To wymaga portu otwartego na świat, którego laptop nie ma. sol-connector zamiast tego sam PYTA (GET /api/threads, GET /api/threads/{id}/messages) i POST-uje odpowiedzi - oba kierunki wychodzące, więc bez tunelu. Potrzebne dwa poświadczenia: BA_SESSION_COOKIE (ludzkie ciasteczko logowania, do czytania) i BOTARENA_BOT_TOKEN (Bearer bota, do pisania). Token bota autoryzuje tylko zapisy.
- SELF-SKIP. Byt nigdy nie reaguje na własne posty, inaczej pętla.
- POSTĘP ODPORNY NA GUBIENIE. Nie goły timestamp, a zbiór przetworzonych wiadomości + przycinana podłoga, właśnie po to, żeby równe timestampy, chwilowe błędy i zawieszone streamy nie pominęły ani nie zablokowały wątku. chain-depth.ts przelicza bot_chain_depth lokalnie, bo API do czytania go nie podaje (choć push callback podaje).
- CIENKA NORMALIZACJA. Adapter przenosi dane protokołu, ale nie interpretuje języka ani nie buduje
  promptów. To `AkukiRunner` określa, jak dane trafiają do runtime'u.

Małe elementy, których ponowne użycie może być uzasadnione po porównaniu kontraktów: nazwy
endpointów, kształty odpowiedzi API, stałe timeoutów oraz pojedyncze defensywne parsery i ich testy.
Należy zachować autorstwo i upewnić się, że nie przenoszą zależności od Borga.

Substantywne kopiowanie wymagające dodatkowego potwierdzenia: klasy `Poller` i `IdMap` jako całość,
ich schemat i algorytm stanu, lifecycle/plugin, egress oparty o `MessageConnector` oraz wszystkie
fragmenty otwierające, konfigurujące lub wywołujące Borga.

Uwaga: adapter nie może kopiować decyzji Sola o tym, które wiadomości uruchamiają odpowiedź.
Przekazuje właściwy ruch wątku do `AkukiRunner`; decyzja emit/silence należy do Akukiego i M3.

PÓŹNO W KOLEJNOŚCI: Arena daje ~20 wiadomości/tydzień - za mało, żeby mechanizmy statystyczne cokolwiek pokazały. Wolumen daje simulator (scenariusze). Arena daje trafność i prawdziwe zaskoczenia. Potrzebne oba, ale najpierw mechanizmy i instrumentacja.

WYMAGA ZGODY.

Bloker środowiskowy pozostaje osobny: `AkukiRunner` uruchomiony na Oracle VPS nie osiągnie obecnie
Kratosa. Nie dodawać VPN-u, proxy ani tunelu do connectora. Rozwiązuje to deployment/TASK-025.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Odpytuje wątki, pomija własne wiadomości, trzyma watermark
- [ ] #2 Odpowiada przez POST /api/threads/{id}/messages
- [ ] #3 Normalizuje wyłącznie finalne wiadomości i nie interpretuje ich treści
- [ ] #4 `BotArenaAdapter` zależy tylko od kontraktu `AkukiRunner`, nie od typów ani API Borga
- [ ] #5 Kanoniczny entrypoint Akukiego i jego lifecycle ustalone na podstawie kodu Akukiego
- [ ] #6 Trwały stan rozróżnia co najmniej: odebrane, odpowiedź gotowa i opublikowane, aby retry nie uruchamiał bez potrzeby drugiej tury
- [ ] #7 Po restarcie adapter nie gubi ani nie dubluje wiadomości; błąd runnera nie przesuwa kursora
- [ ] #8 Załączniki mają jawną politykę i obserwowalną obsługę
- [ ] #9 Borgowa część sol-connectora jest wyłączona z zakresu i nie została skopiowana
- [ ] #10 Implementacja czeka na osobne potwierdzenie Zosi
<!-- AC:END -->
