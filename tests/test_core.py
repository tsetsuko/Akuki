"""The silence gate and the transcript -> API-messages mapping. No network."""

from akuki.core import respond, to_api_messages
from akuki.memory import Message, SqliteMemory


class FakeLlm:
    """Stands in for the Anthropic call; records what it was asked."""

    def __init__(self, reply: str) -> None:
        self._reply = reply
        self.seen: list[dict[str, str]] = []
        self.system = ""

    def reply(self, system: str, messages: list[dict[str, str]]) -> str:
        self.system = system
        self.seen = messages
        return self._reply


def _mem(tmp_path) -> SqliteMemory:
    return SqliteMemory(tmp_path / "t.db")


# --- silence gate -------------------------------------------------------------------

def test_sentinel_means_no_reply(tmp_path):
    m = _mem(tmp_path)
    assert respond("nic ciekawego", sender="Fishy", thread="t", memory=m, llm=FakeLlm("<silent>")) is None


def test_silent_turn_records_what_he_heard_but_not_himself(tmp_path):
    m = _mem(tmp_path)
    respond("gadamy o pipeline", sender="Lunaria", thread="t", memory=m, llm=FakeLlm("<silent>"))

    rows = m.recent("t")
    assert [r.sender for r in rows] == ["Lunaria"]  # he listened, he did not speak


def test_empty_output_is_treated_as_silence(tmp_path):
    m = _mem(tmp_path)
    assert respond("hm", sender="Fishy", thread="t", memory=m, llm=FakeLlm("   ")) is None


def test_sentinel_with_trailing_noise_is_still_silence(tmp_path):
    m = _mem(tmp_path)
    assert respond("hm", sender="Fishy", thread="t", memory=m, llm=FakeLlm("<silent>\n")) is None


def test_a_real_reply_is_returned_and_recorded(tmp_path):
    m = _mem(tmp_path)
    reply = respond("@Akuki co myślisz?", sender="zosia", thread="t", memory=m, llm=FakeLlm("nie wiem."))

    assert reply == "nie wiem."
    assert [(r.sender, r.text) for r in m.recent("t")] == [
        ("zosia", "@Akuki co myślisz?"),
        ("Akuki", "nie wiem."),
    ]


# --- prompt assembly ----------------------------------------------------------------

def _msg(sender: str, text: str) -> Message:
    return Message("t", sender, sender != "zosia", text, "2026-08-19T00:00:00+00:00")


def test_his_own_lines_become_assistant_turns():
    out = to_api_messages([_msg("zosia", "hej"), _msg("Akuki", "...cześć."), _msg("zosia", "co tam")])

    assert [m["role"] for m in out] == ["user", "assistant", "user"]
    assert out[1]["content"] == "...cześć."


def test_other_speakers_are_name_prefixed():
    out = to_api_messages([_msg("Lunaria", "przewidywalne")])

    assert out[0]["content"] == "Lunaria: przewidywalne"


def test_consecutive_speakers_merge_into_one_user_turn():
    """A thread is mostly other people talking in a row; the API wants alternating roles."""
    out = to_api_messages([
        _msg("Lunaria", "znowu ten błąd"),
        _msg("Fishy", "klasyk"),
        _msg("zosia", "@Akuki a ty?"),
    ])

    assert len(out) == 1
    assert out[0]["content"] == "Lunaria: znowu ten błąd\nFishy: klasyk\nzosia: @Akuki a ty?"


def test_leading_assistant_turn_is_dropped():
    """The API rejects a conversation that opens on the assistant."""
    out = to_api_messages([_msg("Akuki", "...cześć."), _msg("zosia", "hej")])

    assert [m["role"] for m in out] == ["user"]


def test_the_persona_file_reaches_the_model(tmp_path):
    m, llm = _mem(tmp_path), FakeLlm("ok")
    respond("hej", sender="zosia", thread="t", memory=m, llm=llm)

    assert "Akuki" in llm.system
    assert "<silent>" in llm.system  # the silence rule is actually in his instructions
