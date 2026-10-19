from akuki.dziennik import akuki_replies, arena_time, pick_snapshots, turn_kinds

BOT = "bot-akuki"
NAMES = {"u-terra": "Terra", BOT: "Akuki"}


def msg(id_, sender, at, text="", reply_to=None, mentions=()):
    return {"id": id_, "sender_id": sender, "created_at": at, "text": text,
            "reply_to_id": reply_to, "mentions": list(mentions)}


def test_arena_time_is_polish_local_time():
    # 18:15:37 w API to 16:15:37 UTC w dzienniku usługi (CEST, +2).
    assert arena_time("2026-10-15T18:15:37.124391").utcoffset().total_seconds() == 7200


def test_reply_latency_is_measured_from_the_message_it_answers():
    messages = [
        msg("m1", "u-terra", "2026-10-15T18:10:54.825504", "pytanie"),
        msg("m2", BOT, "2026-10-15T18:15:37.124391", "odpowiedź", reply_to="m1"),
    ]
    [reply] = akuki_replies(messages, BOT, NAMES)
    assert reply.to_name == "Terra"
    assert round(reply.latency_s) == 282


def test_turn_kinds_split_by_whether_the_message_was_for_him():
    messages = [
        msg("aaaa-1", "u-terra", "2026-10-15T18:00:00", mentions=[BOT]),
        msg("aaaa-2", "u-terra", "2026-10-15T18:01:00"),
        msg("aaaa-3", BOT, "2026-10-15T18:02:00"),
        msg("aaaa-4", "u-terra", "2026-10-15T18:03:00", reply_to="aaaa-3"),
    ]
    journal = "\n".join([
        "info: turn 1848-fd/aaaa-1: emitted=true kind=message path=system_2",
        "info: turn 1848-fd/aaaa-2: emitted=false kind=observed path=system_1",
        "info: turn 1848-fd/aaaa-4: emitted=false kind=suppressed path=suppressed",
        "info: turn 1848-fd/zzzz-9: emitted=false kind=assessed path=assessed",
    ])
    kinds = turn_kinds(journal, messages, BOT)
    assert kinds == {("message", True): 1, ("observed", False): 1, ("suppressed", True): 1}


def test_pick_snapshots_compares_against_the_last_one_before_the_period(tmp_path):
    for ms in (100, 200, 300):
        (tmp_path / f"akuki-{ms}.json").write_text(f'{{"capturedAtMs": {ms}}}')
    paths = sorted(tmp_path.glob("*.json"))
    before, after = pick_snapshots(paths, start_ms=250)
    assert (before["capturedAtMs"], after["capturedAtMs"]) == (200, 300)
    before, after = pick_snapshots(paths[:1], start_ms=250)
    assert before is None and after["capturedAtMs"] == 100
