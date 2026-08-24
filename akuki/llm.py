"""The Anthropic call. Thin on purpose -- all of Akuki's character lives in persona/.

Non-streaming by design in v1: his replies are one to three sentences, and a complete
response makes the `<silent>` sentinel trivial to detect. (Streaming would mean holding
the first tokens back until the sentinel is ruled out -- worth it later for BotArena's
Phase API, not for a terminal.)
"""

from __future__ import annotations

import os

import anthropic

DEFAULT_MODEL = "claude-opus-5"


class LlmError(RuntimeError):
    """Something went wrong talking to the API. Carries a line fit to show a human."""


class Llm:
    def __init__(self, model: str | None = None) -> None:
        # No api_key argument: the SDK resolves ANTHROPIC_API_KEY (or an `ant auth login`
        # profile) from the environment, so the key never has to be written down here.
        self._client = anthropic.Anthropic()
        self.model = model or os.environ.get("AKUKI_MODEL") or DEFAULT_MODEL

    def reply(self, system: str, messages: list[dict[str, str]]) -> str:
        try:
            response = self._client.messages.create(
                model=self.model,
                # Deliberately small: he writes a couple of sentences. A big ceiling here
                # would only ever pay for a rambling answer we don't want.
                max_tokens=1024,
                # Short, plain answers -- low effort is the right shape and the cheap one.
                # Thinking stays adaptive by default on this model.
                output_config={"effort": "low"},
                system=system,
                messages=messages,
            )
        except anthropic.RateLimitError:
            raise LlmError("(limit zapytań - poczekaj chwilę)") from None
        except anthropic.AuthenticationError:
            raise LlmError(
                "(brak/zły klucz API - uruchom z "
                'ANTHROPIC_API_KEY="$(pass show akuki/anthropic-key)")'
            ) from None
        except anthropic.APIStatusError as err:
            raise LlmError(f"(API zwróciło {err.status_code})") from None
        except anthropic.APIConnectionError:
            raise LlmError("(nie mogę się połączyć z API)") from None

        return "".join(b.text for b in response.content if b.type == "text").strip()
