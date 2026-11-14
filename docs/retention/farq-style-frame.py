#!/usr/bin/env python3
"""Style frames of the series « لاحظت الفرق؟ » (owner's idea, 2026-11-13: verses that look alike and differ in meaning;
docs/themes.md), not part of the videos: four 9:16 stills in the counting style (docs/model.md), on the night and the
gold of the page: two verses one above the other, the words they share dimmed, the words that differ in gold, an arrow
from a word to where it went.

The verses and their words are read from quran.com API answers saved beside the images (never typed); what differs is
found by comparing the words without their vowels, not chosen by hand:
  for k in 6:151 17:31 18:79 18:81 18:82 4:135 5:8; do
    curl -s "https://api.quran.com/api/v4/verses/by_key/$k?translations=20&fields=text_uthmani&words=true&word_fields=text_uthmani" -o <dir>/verse-${k/:/-}.json
  done
  python3 docs/retention/farq-style-frame.py <dir> && node docs/retention/style-frame-shot.js <dir> farq-a farq-b farq-c farq-d

The narration lines on these frames are proposals of the session, to be validated with the script.
"""
import difflib
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(sys.argv[1]).resolve()
FONTS = ROOT / "video" / "public" / "fonts"
W, H = 1080, 1920
GOLD, INK, NIGHT, MINT, DIM = "#f0c46a", "#f4efe2", "#03050d", "#9fe3c8", "rgba(244,239,226,.42)"
e = html.escape
MARKS = re.compile(r"[ؐ-ًؚ-ٰٟۖ-ۭـ]")
AR = str.maketrans("0123456789", "٠١٢٣٤٥٦٧٨٩")


def bare(word: str) -> str:
    """A word without its vowels, signs of pause and the forms of alif, to compare two verses."""
    w = MARKS.sub("", word).replace("ٱ", "ا").replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    return re.sub(r"[^ء-ي]", "", w)


def words(key: str) -> list[str]:
    verse = json.loads((OUT / f"verse-{key.replace(':', '-')}.json").read_text(encoding="utf-8"))["verse"]
    return [w["text_uthmani"] for w in verse["words"] if w.get("char_type_name", "word") == "word"]


def piece(key: str, first: str, last: str) -> list[str]:
    """The words of a verse from the first one whose bare form is `first` to the next one whose bare form is `last`."""
    ws = words(key)
    i = next(k for k, w in enumerate(ws) if bare(w) == first)
    j = next(k for k in range(i, len(ws)) if bare(ws[k]) == last)
    return ws[i:j + 1]


def differ(a: list[str], b: list[str]) -> tuple[set[int], set[int]]:
    """The positions of the words of `a` and of `b` that the other verse does not have at the same place."""
    match = difflib.SequenceMatcher(a=[bare(w) for w in a], b=[bare(w) for w in b], autojunk=False)
    same_a, same_b = set(), set()
    for block in match.get_matching_blocks():
        same_a |= set(range(block.a, block.a + block.size))
        same_b |= set(range(block.b, block.b + block.size))
    return set(range(len(a))) - same_a, set(range(len(b))) - same_b


def moved(a: list[str], b: list[str]) -> tuple[set[int], set[int]]:
    """For two verses with the same words in another order: the words that are not at the same place in both."""
    ba, bb = [bare(w) for w in a], [bare(w) for w in b]
    assert sorted(ba) == sorted(bb), (ba, bb)
    return {k for k, w in enumerate(ba) if bb.index(w) != k}, {k for k, w in enumerate(bb) if ba.index(w) != k}


def line(ws: list[str], gold: set[int], tag: str, colours: dict[str, str] | None = None) -> str:
    colours = colours or {}
    out = []
    for k, w in enumerate(ws):
        colour = colours.get(bare(w), GOLD) if k in gold else DIM
        out.append(f'<span id="{tag}-{bare(w)}" style="color:{colour}">{e(w)}</span>')
    return " ".join(out)


SCRIPT = """
window.drawn = false;
document.fonts.ready.then(() => {
  const svg = document.querySelector('svg.arrows');
  for (const a of JSON.parse(svg.dataset.pairs)) {
    const from = document.getElementById(a[0]), to = document.getElementById(a[1]);
    const p = from.getBoundingClientRect(), q = to.getBoundingClientRect();
    const y1 = from.closest('.card').getBoundingClientRect().bottom + 6, y2 = to.closest('.card').getBoundingClientRect().top - 8;
    const x1 = p.left + p.width / 2, x2 = q.left + q.width / 2, my = (y1 + y2) / 2;
    svg.insertAdjacentHTML('beforeend', `<path d="M ${x1} ${y1} C ${x1} ${my} ${x2} ${my} ${x2} ${y2}" fill="none" stroke="${a[2]}" stroke-width="4" stroke-linecap="round" marker-end="url(#head-${a[3]})" opacity=".9"/>`);
  }
  window.drawn = true;
});
"""

CSS = f"""
@font-face {{ font-family: Amiri; src: url('file://{FONTS}/Amiri-Regular.ttf'); }}
@font-face {{ font-family: Amiri; font-weight: 700; src: url('file://{FONTS}/Amiri-Bold.ttf'); }}
@font-face {{ font-family: 'Amiri Quran'; src: url('file://{FONTS}/AmiriQuran-Regular.ttf'); }}
@font-face {{ font-family: Lora; src: url('file://{FONTS}/Lora.ttf'); }}
* {{ margin: 0; box-sizing: border-box; }}
body {{ background: #222; }}
.f {{ position: relative; width: {W}px; height: {H}px; overflow: hidden; color: {INK};
  background: radial-gradient(ellipse at 50% 38%, #0b1430 0%, {NIGHT} 75%); }}
svg {{ position: absolute; inset: 0; }}
.tag, .handle {{ position: absolute; top: 120px; font: 700 34px Amiri; color: {GOLD}; }}
.tag {{ left: 70px; display: flex; align-items: center; gap: 14px; }}
.ep {{ display: inline-flex; width: 46px; height: 46px; border: 2px solid {GOLD}; border-radius: 50%; align-items: center;
  justify-content: center; font-size: 30px; line-height: 1; padding-top: 6px; }}
.handle {{ right: 70px; font: 600 30px Lora; letter-spacing: .02em; }}
.line {{ position: absolute; top: 230px; left: 60px; right: 60px; direction: rtl; text-align: center;
  font: 700 60px/1.45 Amiri; text-shadow: 0 3px 18px rgba(0,0,0,.8); }}
.gold {{ color: {GOLD}; }}
.card {{ position: absolute; left: 60px; right: 60px; border-radius: 26px; padding: 26px 34px 30px; direction: rtl;
  text-align: center; background: rgba(6,10,24,.82); border: 2px solid rgba(240,196,106,.35); }}
.ref {{ font: 700 32px Amiri; color: {GOLD}; opacity: .85; margin-bottom: 6px; }}
.verse {{ font: 62px/1.9 'Amiri Quran'; }}
.big {{ font: 84px/1.8 'Amiri Quran'; }}
.mid {{ font: 66px/1.8 'Amiri Quran'; white-space: nowrap; }}
.meaning {{ font: 700 38px Amiri; color: {MINT}; margin-top: 4px; }}
.en {{ position: absolute; left: 90px; right: 90px; top: 1530px; text-align: center; font: italic 34px/1.4 Lora; color: {INK};
  text-shadow: 0 2px 12px rgba(0,0,0,.9); }}
.source {{ position: absolute; left: 70px; right: 70px; top: 1720px; text-align: center; font: 26px/1.4 Lora; color: {INK}; opacity: .7; }}
"""


def page(name: str, ep: str, body: str, pairs: list | None = None) -> None:
    arrows = json.dumps(pairs or [])
    heads = "".join(f'<marker id="head-{k}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">'
                    f'<path d="M 0 0 L 10 5 L 0 10 z" fill="{c}"/></marker>' for k, c in (("g", GOLD), ("m", MINT)))
    (OUT / f"{name}.html").write_text(f'''<!DOCTYPE html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body><div class="f">
<div class="tag">لاحظت الفرق؟ <span class="ep">{ep}</span></div><div class="handle">@quran_words_daily</div>
{body}
<svg class="arrows" width="{W}" height="{H}" data-pairs='{arrows}'><defs>{heads}</defs></svg>
</div><script>{SCRIPT}</script></body></html>''', encoding="utf-8")


def ref(name: str, key: str) -> str:
    return f"{name} · {key.split(':')[1].translate(AR)}"


# 1. The first frame of episode 1: the two verses, what differs in gold
a = piece("6:151", "ولا", "واياهم")
b = piece("17:31", "ولا", "واياكم")
da, db = differ(a, b)
print("6:151 / 17:31 differ:", [bare(a[k]) for k in sorted(da)], [bare(b[k]) for k in sorted(db)])
page("farq-a", "١", f'''
<div class="line">آيتين في القرآن… نفس الكلام تقريبًا…<br><span class="gold">بس فيه كلمتين بدّلوا مكانهم.</span></div>
<div class="card" style="top:640px"><div class="ref">{ref("الأنعام", "6:151")}</div><div class="verse">{line(a, da, "a")}</div></div>
<div class="card" style="top:1060px"><div class="ref">{ref("الإسراء", "17:31")}</div><div class="verse">{line(b, db, "b")}</div></div>
<div class="en">Two verses of the Quran… almost the same words… but two words swapped places.</div>''')

# 2. Episode 1, the swap: « you » and « them » change places, and the meaning with them (Ibn Kathir)
a2 = piece("6:151", "نحن", "واياهم")
b2 = piece("17:31", "نحن", "واياكم")
da2, db2 = differ(a2, b2)
colours = {"نرزقكم": GOLD, "واياكم": GOLD, "نرزقهم": MINT, "واياهم": MINT}
page("farq-b", "١", f'''
<div class="line">الأولى: الفقر موجود… فبدأ برزقك.<br><span class="gold">والتانية: الخوف من فقر جاي… فبدأ برزقهم.</span></div>
<div class="card" style="top:660px"><div class="ref">{ref("الأنعام", "6:151")}</div><div class="big">{line(a2, da2, "a", colours)}</div>
<div class="meaning">«مِّنْ إِمْلَاقٍ»: الفقر موجود</div></div>
<div class="card" style="top:1110px"><div class="ref">{ref("الإسراء", "17:31")}</div><div class="big">{line(b2, db2, "b", colours)}</div>
<div class="meaning">«خَشْيَةَ إِمْلَاقٍ»: الخوف من الفقر</div></div>
<div class="en">The first: poverty is already there… so He begins with your provision. The second: the fear of poverty to come… so He begins with theirs.</div>
<div class="source">Meaning after Tafsir Ibn Kathir (6:151, 17:31)</div>''',
     [["a-نرزقكم", "b-واياكم", GOLD, "g"], ["a-واياهم", "b-نرزقهم", MINT, "m"]])

# 3. Episode 2: three verbs of the same story, one man
r79 = piece("18:79", "فاردت", "اعيبها")
r81 = piece("18:81", "فاردنا", "خيرا")
r82 = piece("18:82", "فاراد", "اشدهما")
verbs = {0}
page("farq-c", "٢", f'''
<div class="line">نفس الراجل… نفس الحكاية…<br><span class="gold">وتلات كلمات مختلفة.</span></div>
<div class="card" style="top:590px"><div class="ref">{ref("الكهف", "18:79")}</div><div class="verse">{line(r79, verbs, "c")}</div><div class="meaning">العيب… نسبه لنفسه</div></div>
<div class="card" style="top:925px"><div class="ref">{ref("الكهف", "18:81")}</div><div class="verse">{line(r81, verbs, "d")}</div></div>
<div class="card" style="top:1200px"><div class="ref">{ref("الكهف", "18:82")}</div><div class="verse">{line(r82, {0, 1}, "e")}</div><div class="meaning">الخير… نسبه لربنا</div></div>
<div class="en">The same man… the same story… and three different words.</div>
<div class="source">Meaning after Tafsir as-Sa'di (18:79-82)</div>''')

# 4. Episode 3: the same words in the other order, two directions of justice (as-Sa'di)
j1 = piece("4:135", "كونوا", "لله")
j2 = piece("5:8", "كونوا", "بالقسط")
dj1, dj2 = moved(j1, j2)
colours = {"بالقسط": GOLD, "لله": MINT}
page("farq-d", "٣", f'''
<div class="line">نفس الكلمات بالظبط…<br><span class="gold">بس الترتيب اتقلب.</span></div>
<div class="card" style="top:640px"><div class="ref">{ref("النساء", "4:135")}</div><div class="mid">{line(j1, dj1, "f", colours)}</div>
<div class="meaning">حتى على نفسك… واللي بتحبهم</div></div>
<div class="card" style="top:1060px"><div class="ref">{ref("المائدة", "5:8")}</div><div class="mid">{line(j2, dj2, "g", colours)}</div>
<div class="meaning">حتى مع اللي بتكرهه</div></div>
<div class="en">Exactly the same words… but the order is turned around.</div>
<div class="source">Meaning after Tafsir as-Sa'di (4:135, 5:8)</div>''',
     [["f-بالقسط", "g-بالقسط", GOLD, "g"], ["f-لله", "g-لله", MINT, "m"]])
print(OUT)
