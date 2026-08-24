from akuki.memory import SqliteMemory


def test_recent_returns_oldest_first(tmp_path):
    m = SqliteMemory(tmp_path / "t.db")
    m.append("t", "zosia", False, "pierwsza")
    m.append("t", "Akuki", True, "druga")
    m.append("t", "zosia", False, "trzecia")

    assert [x.text for x in m.recent("t")] == ["pierwsza", "druga", "trzecia"]


def test_recent_limit_keeps_the_newest(tmp_path):
    m = SqliteMemory(tmp_path / "t.db")
    for i in range(10):
        m.append("t", "zosia", False, f"m{i}")

    assert [x.text for x in m.recent("t", 3)] == ["m7", "m8", "m9"]


def test_threads_are_isolated(tmp_path):
    m = SqliteMemory(tmp_path / "t.db")
    m.append("a", "zosia", False, "w a")
    m.append("b", "zosia", False, "w b")

    assert [x.text for x in m.recent("a")] == ["w a"]
    assert [x.text for x in m.recent("b")] == ["w b"]


def test_survives_reopen(tmp_path):
    path = tmp_path / "t.db"
    m = SqliteMemory(path)
    m.append("t", "zosia", False, "pamiętasz?")
    m.close()

    assert [x.text for x in SqliteMemory(path).recent("t")] == ["pamiętasz?"]


def test_is_bot_is_recorded(tmp_path):
    m = SqliteMemory(tmp_path / "t.db")
    m.append("t", "Lunaria", True, "sarkazm")
    m.append("t", "zosia", False, "hej")

    assert [x.is_bot for x in m.recent("t")] == [True, False]
