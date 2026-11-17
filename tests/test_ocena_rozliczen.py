import json

from akuki.ocena_rozliczen import compare, parse_ratings, render_sheet, sample


def row(pid, error):
    return {"prediction_id": pid, "error_magnitude": error, "model_says": "…", "about": "x",
            "expectation": f"oczekiwanie {pid}", "context": [{"who": "Sol", "text": "hej"}]}


def test_sample_takes_the_band_plus_controls_from_both_ends():
    rows = [row(f"b{i}", 0.5) for i in range(40)] + [row(f"l{i}", 0.1) for i in range(10)] \
        + [row(f"h{i}", 0.8) for i in range(10)]
    picked = sample(rows, n=30, control=5, seed=1)
    errors = [r["error_magnitude"] for r in picked]
    assert (errors.count(0.5), errors.count(0.1), errors.count(0.8)) == (30, 5, 5)
    assert picked == sample(rows, n=30, control=5, seed=1)


def test_sheet_never_shows_the_models_score():
    sheet = render_sheet([row("p1", 0.55)], seed=1)
    assert "0.55" not in sheet and "0,55" not in sheet
    assert "Ocena: " in sheet


def test_ratings_are_read_per_item_and_blank_stays_blank():
    text = "## 01\n\nOcena: 2\nWielowątkowe: T\n\n## 02\n\nOcena: \nWielowątkowe: \n"
    assert parse_ratings(text) == {1: ("2", "t"), 2: ("", "")}


def test_compare_crosses_model_buckets_with_human_scores(tmp_path):
    sheet = tmp_path / "2026-10-19-arkusz.md"
    sheet.write_text("## 01\nOcena: 2\nWielowątkowe: t\n## 02\nOcena: 1\nWielowątkowe: n\n"
                     "## 03\nOcena: ?\nWielowątkowe: n\n", encoding="utf-8")
    (tmp_path / "2026-10-19-klucz.json").write_text(json.dumps([
        {"nr": 1, "prediction_id": "a", "error_magnitude": 0.5, "model_says": ""},
        {"nr": 2, "prediction_id": "b", "error_magnitude": 0.4, "model_says": ""},
        {"nr": 3, "prediction_id": "c", "error_magnitude": 0.1, "model_says": ""},
    ]), encoding="utf-8")
    report = compare(sheet)
    assert "ocenione: 2 z 3" in report
    assert "zaskoczenie pośrednie (2) w 1 z 2" in report
