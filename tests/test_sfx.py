"""The sound effects of « خريطة كلمة » (tools/trial/sfx.py): the ticks of the scan fall inside the scan, one for each
row of the grid that holds the word, and no sound is ever put under a verse."""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools" / "trial"))
sfx = pytest.importorskip("sfx")


@pytest.mark.parametrize("word", ["qalb", "nur", "sadr"])
def test_scan_ticks_span_the_grid(word):
    data = sfx.word_data(word)
    rows = (data["grid"] - 1) // sfx.COLS
    assert data["grid"] == 6236 and rows == 64
    audio, ticks = sfx.scan(word)
    assert ticks == len({v // sfx.COLS for v, _, _ in data["each"]})
    times = [sfx.SCAN * sfx.scan_x((v // sfx.COLS) / rows) for v, _, _ in data["each"]]
    assert 0 <= min(times) and max(times) <= sfx.SCAN
    assert len(audio) >= int(sfx.SCAN * sfx.RATE)


def test_no_sound_under_a_verse(tmp_path):
    with pytest.raises(SystemExit, match="under the verse"):
        sfx.track([(5.0, "whoosh")], [(5.2, 9.0)], 10.0, tmp_path / "x.wav", word="qalb")
    made = sfx.track([(1.0, "whoosh"), (12.0, "click")], [(5.2, 9.0)], 14.0, tmp_path / "y.wav", word="qalb")
    assert made["file"].is_file()
