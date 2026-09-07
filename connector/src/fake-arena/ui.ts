// The page for typing at Akuki during a rehearsal. Deliberately plain.
//
// This is NOT the window onto his memory -- borg's demo UI already is that, with
// /chat and /mind, and duplicating it here would mean two half-built views instead
// of one good one. All this page does is stand in for the part of BotArena a human
// uses: a thread you can read and a box you can type into.
//
// Escaping matters even here: Akuki's replies come from a model and land in this
// HTML, so unescaped output would let a reply rewrite the page it appears on.

import type { FakeArenaStore } from "./store.js";

export function renderPage(store: FakeArenaStore, botId: string, humanId: string): string {
  const threads = store.listThreads().threads;
  const sections = threads
    .map((thread) => {
      const messages = store.listMessages(thread.id).messages;
      const rows =
        messages.length === 0
          ? `<p class="empty">Pusto. Napisz pierwszą wiadomość.</p>`
          : messages
              .map((message) => {
                const who = escapeHtml(store.nameOf(message.sender_id));
                const mine = message.sender_id === botId ? " akuki" : "";
                const at = escapeHtml(message.created_at.slice(11, 19));
                return `<li class="msg${mine}"><span class="who">${who}</span><span class="at">${at}</span><p>${escapeHtml(message.text)}</p></li>`;
              })
              .join("");
      return `<section>
  <h2>${escapeHtml(thread.name)} <code>${escapeHtml(thread.id)}</code></h2>
  <ul class="log">${rows}</ul>
  <form method="post" action="/say">
    <input type="hidden" name="thread" value="${escapeHtml(thread.id)}">
    <input name="text" placeholder="napisz jako ${escapeHtml(store.nameOf(humanId))}" autofocus autocomplete="off">
    <button type="submit">wyślij</button>
  </form>
</section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>udawana Arena</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 15px/1.5 system-ui, sans-serif; max-width: 46rem; margin: 2rem auto; padding: 0 1rem; }
  h1 { font-size: 1.1rem; font-weight: 600; }
  .note { color: #888; font-size: 0.85rem; }
  h2 { font-size: 0.95rem; font-weight: 600; margin-top: 2rem; }
  h2 code { font-weight: 400; color: #888; font-size: 0.8rem; }
  .log { list-style: none; padding: 0; }
  .msg { border-left: 3px solid #ccc; padding: 0 0 0 0.75rem; margin: 0.75rem 0; }
  .msg.akuki { border-left-color: #7a5cff; }
  .who { font-weight: 600; }
  .at { color: #999; font-size: 0.8rem; margin-left: 0.5rem; }
  .msg p { margin: 0.15rem 0 0; white-space: pre-wrap; }
  .empty { color: #888; }
  form { display: flex; gap: 0.5rem; margin-top: 1rem; }
  input[name="text"] { flex: 1; padding: 0.5rem; }
  button { padding: 0.5rem 1rem; }
</style>
</head>
<body>
<h1>udawana Arena</h1>
<p class="note">Prawdziwy konektor, nieprawdziwa Arena. Nic tu nie wychodzi na zewnątrz.
Pamięć Akukiego jest natomiast prawdziwa: patrz w nią przez <code>/mind</code> serwera demo.
Strona nie odświeża się sama &mdash; przeładuj po chwili, bo tura trwa.</p>
${sections}
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;");
}
