#!/usr/bin/env python3
"""Style frames of the counting style (owner, 2026-11-13: « enregistre ce style comme option »), not part of the videos:
five stills of a « سنريهم آياتنا » episode on the claim « يوم 365 » in the look of the counting style (docs/model.md):
numbers made of particles (counts written 365, never in Arabic-Indic digits: owner,
2026-11-13), a grid of the 6,236 verses where the counted word lights up, a strip of the counting rules
at the foot, two counts set equal, a verse with a drawing under it.

Every number is counted here, never typed: the morphology of the Quranic Arabic Corpus (quran-morphology.txt of
mustafa0x/quran-morphology, one word = one s:a:w). The verse and its translation are read from a quran.com API answer
saved beside the images (never typed):
  curl -s "https://api.quran.com/api/v4/verses/by_key/10:5?translations=20&fields=text_uthmani&words=true&word_fields=text_uthmani" -o <dir>/verse-10-5.json

  python3 docs/retention/count-style-frame.py <dir> <quran-morphology.txt> && node docs/retention/style-frame-shot.js <dir> count-a count-b count-c count-d count-e count-f
"""
import collections
import html
import json
import math
import random
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(sys.argv[1]).resolve()
MORPH = Path(sys.argv[2])
FONTS = ROOT / "video" / "public" / "fonts"
W, H = 1080, 1920
GOLD, INK, NIGHT, MINT, OFF = "#f0c46a", "#f4efe2", "#03050d", "#9fe3c8", "#7f8db0"
e = html.escape
random.seed(5)


# --- the counts -------------------------------------------------------------------------------------------------------
segments = collections.defaultdict(list)
for line in MORPH.open(encoding="utf-8"):
    loc, form, pos, feats = line.rstrip("\n").split("\t")
    s, a, w, _ = map(int, loc.split(":"))
    f = feats.split("|")
    lemma = next((x[4:] for x in f if x.startswith("LEM:")), None)
    root = next((x[5:] for x in f if x.startswith("ROOT:")), None)
    segments[(s, a, w)].append((form, pos, lemma, f, root))
VERSES = sorted({(s, a) for s, a, _ in segments})
assert len(VERSES) == 6236
bare = lambda t: re.sub(r"[ً-ٰٟۖ-ۭ]", "", t)


def kind(word):
    """What a counter must leave out of the lemma يوم to reach 365, step by step."""
    noun = next(x for x in word if x[2] == "يَوْم")
    whole = bare("".join(x[0] for x in word))
    if {"MP", "FP"} & set(noun[3]) or {"MD", "FD"} & set(noun[3]):
        return 1                                                    # أيام، يومين
    if "ئذ" in whole:
        return 2                                                    # يومئذ
    if whole.endswith(("كم", "هم")):
        return 3                                                    # يومكم، يومهم
    return 4                                                        # اليوم، يوم، يوما: what is kept


yawm = {k: kind(v) for k, v in segments.items() if any(x[2] == "يَوْم" for x in v)}
STEPS = [sum(1 for c in yawm.values() if c >= n) for n in (1, 2, 3, 4)]      # 475, 445, 375, 365
assert STEPS == [475, 445, 375, 365], STEPS
dunya = sum(1 for v in segments.values() if any(x[2] == "دُنْيا" for x in v))
akhira = sum(1 for v in segments.values() if any(x[2] == "آخِر" and {"F", "FS"} & set(x[3]) for x in v))
assert dunya == akhira == 115, (dunya, akhira)
in_dunya = {(s, a) for (s, a, _), v in segments.items() if any(x[2] == "دُنْيا" for x in v)}
in_akhira = {(s, a) for (s, a, _), v in segments.items() if any(x[2] == "آخِر" and {"F", "FS"} & set(x[3]) for x in v)}
lit_all = {(s, a) for (s, a, _), c in yawm.items()}
lit_kept = {(s, a) for (s, a, _), c in yawm.items() if c == 4}
print(f"يوم {STEPS}, verses lit {len(lit_all)} then {len(lit_kept)}; الدنيا {dunya} الآخرة {akhira}")


def tally(lemma=None, root=None, singular=False, feminine=False):
    """Words of the Quran with this lemma (or root): every form, the singular only, the feminine only."""
    n = 0
    for word in segments.values():
        for x in word:
            if (lemma and x[2] == lemma) or (root and x[4] == root):
                if singular and ({"MP", "FP", "MD", "FD"} & set(x[3])):
                    continue
                if feminine and not ({"F", "FS"} & set(x[3])):
                    continue
                n += 1
                break
    return n


# The board: each claim of the videos that circulate, counted under three fixed rules. A pair is two words said equal.
WORDS = {"يوم": ("يَوْم", "يوم", False), "شهر": ("شَهْر", "شهر", False), "الدنيا": ("دُنْيا", "دنو", False),
         "الآخرة": ("آخِر", "أخر", True), "الملائكة": ("مَلَك", "ملك", False), "الشيطان": ("شَيْطان", "شطن", False),
         "رجل": ("رَجُل", "رجل", False), "امرأة": ("امْرَأَت", "مرأ", False), "الصلاة": ("صَلاة", "صلو", False),
         "الصبر": ("صَبْر", "صبر", False), "الليل": ("لَيْل", "ليل", False)}


def three(word):
    lemma, root, fem = WORDS[word]
    return (tally(lemma=lemma, feminine=fem), tally(lemma=lemma, singular=True, feminine=fem),
            tally(root=root) if not fem else tally(root=root))


CLAIMS = [(("يوم",), 365), (("شهر",), 12), (("الدنيا", "الآخرة"), 115), (("الملائكة", "الشيطان"), 88),
          (("رجل", "امرأة"), 24), (("الصلاة",), 99), (("الصبر",), 103), (("الليل",), 92)]
BOARD = [(words, claim, list(zip(*[three(w) for w in words]))) for words, claim in CLAIMS]
for words, claim, cells in BOARD:
    print(" = ".join(words), claim, cells)
assert [c for _, _, c in BOARD][1] == [(21,), (12,), (21,)] and [c for _, _, c in BOARD][4] == [(29, 26), (24, 24), (73, 38)]

verse = json.loads((OUT / "verse-10-5.json").read_text(encoding="utf-8"))["verse"]
words = [w["text_uthmani"] for w in verse["words"] if w.get("char_type_name", "word") == "word"]
translation = re.sub(r"<sup[^>]*>.*?</sup>", "", verse["translations"][0]["text"]).strip()


# --- the drawings -----------------------------------------------------------------------------------------------------
def grid(top, lit=frozenset(), gone=frozenset(), faint=False, cols=96, pitch=9.8, other=frozenset(), size=1.0):
    """One dot per verse, in the order of the mushaf, right to left: lit in gold, gone as an empty ring."""
    left = (W - (cols - 1) * pitch) / 2
    out = []
    for k, v in enumerate(VERSES):
        x = W - left - (k % cols) * pitch
        y = top + (k // cols) * pitch
        if v in lit and v in other:
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{3.9 * size:.1f}" fill="{INK}"/>')
        elif v in lit or v in other:
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{3.9 * size:.1f}" fill="{GOLD if v in lit else MINT}"/>')
        elif v in gone:
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.3" fill="none" stroke="{OFF}" stroke-width="1.5"/>')
        else:
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{2.2 * size:.1f}" fill="{INK}" opacity="{.13 if faint else .17}"/>')
    glow = f'<rect x="60" y="{top - 20}" width="{W - 120}" height="{(len(VERSES) // cols + 1) * pitch + 40}" fill="url(#gridglow)"/>' if lit else ""
    return glow + "".join(out)


def rules(step):
    """The foot of the frame, where « سنريهم آياتنا » keeps its line of dates: here the counting rules, right to left."""
    y, x0, x1 = 1700, 110, 970
    labels = ["كل الصيغ", "من غير أيام ويومين", "من غير يومئذ", "من غير يومكم ويومهم"]
    out = [f'<line x1="{x0}" y1="{y}" x2="{x1}" y2="{y}" stroke="{GOLD}" stroke-width="2" opacity=".55"/>']
    for k, (n, label) in enumerate(zip(STEPS, labels)):
        x = x1 - k * (x1 - x0) / 3
        on, past = k == step, k < step
        r = 13 if on else 7
        glow = f'<circle cx="{x:.0f}" cy="{y}" r="30" fill="{GOLD}" opacity=".22"/>' if on else ""
        out.append(f'{glow}<circle cx="{x:.0f}" cy="{y}" r="{r}" fill="{GOLD if on or past else NIGHT}" stroke="{GOLD}" stroke-width="3"/>'
                   f'<text x="{x:.0f}" y="{y - 30}" text-anchor="middle" font-family="Amiri" font-weight="700" font-size="{44 if on else 32}" '
                   f'fill="{GOLD}" opacity="{1 if on else .65}">{str(n)}</text>'
                   f'<text x="{x:.0f}" y="{y + 50}" text-anchor="middle" font-family="Amiri" font-size="25" fill="{INK}" '
                   f'opacity="{.95 if on else .5}">{label}</text>')
    return "".join(out)


def moons(cy):
    """The phases of the moon along an arc, from one new moon to the next: the lunar month the verse speaks of (منازل)."""
    out, r = [], 27
    for k in range(9):
        t, p = k / 8, k / 8                                       # p: 0 new, .5 full, 1 new again
        x, y = 940 - t * 800, cy - math.sin(t * math.pi) * 70
        out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r}" fill="{INK}" opacity=".1"/>')
        if 0 < p < 1:
            rx = abs(math.cos(2 * math.pi * p)) * r
            waxing = p < .5
            side = 1 if waxing else 0                            # the lit half: right while waxing, left while waning
            crescent = p < .25 or p > .75                         # the terminator bulges toward the lit side
            bulge = (0 if crescent else 1) if waxing else (1 if crescent else 0)
            out.append(f'<path d="M {x:.1f} {y - r:.1f} A {r} {r} 0 0 {side} {x:.1f} {y + r:.1f} A {rx:.1f} {r} 0 0 {bulge} {x:.1f} {y - r:.1f} Z" '
                       f'fill="{INK}" opacity=".92"/>')
    return "".join(out)


def stars(n):
    return "".join(f'<circle cx="{random.uniform(0, W):.0f}" cy="{random.uniform(0, H):.0f}" r="{random.uniform(.5, 1.8):.1f}" '
                   f'fill="#fff" opacity="{random.uniform(.08, .5):.2f}"/>' for _ in range(n))


def defs():
    return f'''<defs>
  <radialGradient id="gridglow"><stop offset="0" stop-color="{GOLD}" stop-opacity=".09"/><stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>
  <radialGradient id="sky" cx=".5" cy=".38" r=".8"><stop offset="0" stop-color="#0b1430"/><stop offset="1" stop-color="{NIGHT}"/></radialGradient>
</defs><rect width="{W}" height="{H}" fill="url(#sky)"/>'''


def number(text, x, y, size, colour=GOLD):
    """A number made of particles: drawn by the page's script from the font, a few loose ones still flying in."""
    return f'<g class="pn" data-text="{text}" data-x="{x}" data-y="{y}" data-size="{size}" data-colour="{colour}"></g>'


SCRIPT = """
window.drawn = false;
document.fonts.load('700 300px Amiri').then(() => {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const g of document.querySelectorAll('.pn')) {
    const size = +g.dataset.size, cx = +g.dataset.x, cy = +g.dataset.y, colour = g.dataset.colour;
    const c = document.createElement('canvas'); c.width = size * 3; c.height = size * 1.6;
    const ctx = c.getContext('2d');
    ctx.font = `700 ${size}px Amiri`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
    ctx.fillText(g.dataset.text, c.width / 2, c.height / 2);
    const px = ctx.getImageData(0, 0, c.width, c.height).data, step = Math.max(5, Math.round(size / 48));
    let dots = '';
    for (let y = 0; y < c.height; y += step) for (let x = 0; x < c.width; x += step) {
      if (px[(y * c.width + x) * 4 + 3] < 140) continue;
      const X = cx - c.width / 2 + x + (rnd() - .5) * step * .6, Y = cy - c.height / 2 + y + (rnd() - .5) * step * .6;
      dots += `<circle cx="${X.toFixed(1)}" cy="${Y.toFixed(1)}" r="${(step * (.22 + rnd() * .2)).toFixed(1)}" fill="${colour}" opacity="${(.65 + rnd() * .35).toFixed(2)}"/>`;
    }
    for (let k = 0; k < 90; k++) {                       // the last particles, still on their way
      const a = rnd() * 2 * Math.PI, d = size * (.75 + rnd() * .9);
      dots += `<circle cx="${(cx + Math.cos(a) * d * 1.3).toFixed(1)}" cy="${(cy + Math.sin(a) * d * .55).toFixed(1)}" r="${(1 + rnd() * 2.2).toFixed(1)}" fill="${colour}" opacity="${(.15 + rnd() * .4).toFixed(2)}"/>`;
    }
    g.innerHTML = dots;
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
.f {{ position: relative; width: {W}px; height: {H}px; overflow: hidden; background: {NIGHT}; color: {INK}; }}
svg {{ position: absolute; inset: 0; }}
.tag, .handle {{ position: absolute; top: 120px; font: 700 34px Amiri; color: {GOLD}; }}
.tag {{ left: 70px; display: flex; align-items: center; gap: 14px; }}
.ep {{ display: inline-flex; width: 46px; height: 46px; border: 2px solid {GOLD}; border-radius: 50%; align-items: center;
  justify-content: center; font-size: 30px; line-height: 1; padding-top: 6px; }}
.handle {{ right: 70px; font: 600 30px Lora; letter-spacing: .02em; }}
.line {{ position: absolute; top: 200px; left: 60px; right: 60px; direction: rtl; text-align: center;
  font: 700 62px/1.45 Amiri; text-shadow: 0 3px 18px rgba(0,0,0,.8); }}
.gold {{ color: {GOLD}; }}
.en {{ position: absolute; left: 90px; right: 90px; text-align: center; font: italic 34px/1.4 Lora; color: {INK};
  text-shadow: 0 2px 12px rgba(0,0,0,.9); }}
.claim {{ position: absolute; left: 150px; right: 150px; top: 560px; height: 520px; transform: rotate(-2.5deg);
  }}
.claim .who {{ position: absolute; top: 26px; right: 40px; font: 700 40px Amiri; color: {INK}; opacity: .8; }}
.claim .what {{ position: absolute; bottom: 34px; left: 0; right: 0; text-align: center; direction: rtl; font: 700 44px Amiri; color: {INK}; }}
.stamp {{ position: absolute; top: 520px; left: 118px; width: 120px; height: 120px; border-radius: 50%; border: 4px solid {GOLD};
  color: {GOLD}; font: 700 92px/1 Amiri; display: flex; align-items: center; justify-content: center; padding-top: 18px;
  transform: rotate(-14deg); background: rgba(3,5,13,.85); }}
.caption {{ position: absolute; left: 0; right: 0; text-align: center; font: 28px Amiri; color: {INK}; opacity: .75; direction: rtl; }}
.source {{ position: absolute; left: 70px; right: 70px; text-align: center; font: 24px/1.4 Lora; color: {INK}; opacity: .7; }}
.label {{ position: absolute; text-align: center; font: 700 54px Amiri; color: {INK}; width: 360px; }}
.rule {{ position: absolute; left: 140px; right: 140px; text-align: center; font: 700 36px Amiri; color: {MINT}; direction: rtl; }}
.verse {{ position: absolute; top: 560px; left: 60px; right: 60px; direction: rtl; text-align: center;
  font: 66px/1.95 'Amiri Quran'; text-shadow: 0 4px 26px rgba(0,0,0,.95); }}
.ref {{ position: absolute; top: 470px; left: 0; right: 0; text-align: center; font: 700 36px Amiri; color: {GOLD}; }}
.board {{ position: absolute; top: 470px; left: 40px; right: 40px; direction: rtl; border-collapse: collapse; }}
.board th, .board td {{ padding: 14px 8px; text-align: center; border-bottom: 1px solid rgba(244,239,226,.12); }}
.board th {{ font: 700 38px Amiri; color: {INK}; text-align: right; width: 300px; }}
.board td {{ font: 34px Lora; color: {INK}; }}
.board td.head {{ font: 700 30px Amiri; color: {INK}; opacity: .7; }}
.board td.said {{ font: 700 36px Lora; color: {INK}; }}
.board td.miss {{ opacity: .38; }}
.board td.hit {{ color: {GOLD}; font-weight: 700; background: rgba(240,196,106,.14); border-radius: 12px; }}
.recite {{ position: absolute; top: 1130px; left: 0; right: 0; text-align: center; font: 28px Amiri; color: {INK}; opacity: .75; }}
"""


def page(name, svg, body):
    (OUT / f"{name}.html").write_text(f'''<!DOCTYPE html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body><div class="f"><svg width="{W}" height="{H}">{defs()}{svg}</svg>{body}</div><script>{SCRIPT}</script></body></html>''',
                                     encoding="utf-8")


TOP = '<div class="tag">سنريهم آياتنا <span class="ep">٥</span></div><div class="handle">@quran_words_daily</div>'
CORPUS = "Quranic Arabic Corpus · corpus.quran.com"

# 1. The first frame: the claim, shown as a claim (quoted, dashed, a question mark on it), never said by our voice
CARD = (f'<rect x="150" y="560" width="780" height="520" rx="30" transform="rotate(-2.5 540 820)" fill="#060a18" fill-opacity=".92" '
        f'stroke="{GOLD}" stroke-opacity=".55" stroke-width="2" stroke-dasharray="10 8"/>')
def back(x, y, w, h, angle, label):
    """A claim card behind the front one: only its top shows, with its claim written on it."""
    cx, cy = x + w / 2, y + h / 2
    return (f'<g transform="rotate({angle} {cx} {cy})"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="28" fill="#070c1d" '
            f'stroke="{GOLD}" stroke-opacity=".4" stroke-width="2" stroke-dasharray="10 8"/>'
            f'<text x="{cx}" y="{y + 44}" text-anchor="middle" direction="rtl" font-family="Amiri" font-weight="700" font-size="34" '
            f'fill="{INK}" opacity=".85">{label}</text></g>')


BACKS = (back(230, 465, 620, 480, -6, "بيقولوا: «الدنيا» و«الآخرة»… 115 و115") +
         back(190, 575, 700, 500, 4, "بيقولوا: «شهر»… 12 مرة"))
FRONT = CARD.replace('y="560"', 'y="650"').replace("rotate(-2.5 540 820)", "rotate(-2.5 540 910)")
page("count-a", stars(160) + grid(790, faint=True) + BACKS + FRONT + number(str(365), 540, 890, 300),
     f'''{TOP}
<div class="line" style="font-size:54px">بيقولوا: «يوم» في القرآن 365 مرة…<br>و«شهر» 12… و«الدنيا» قد «الآخرة»…<br><span class="gold">أنا عدّيتهم كلهم بنفسي.</span></div>
<div class="claim" style="top:650px"><div class="who">❝ بيقولوا</div><div class="what">مرة… زي أيام السنة</div></div><div class="stamp" style="top:610px">؟</div>
<div class="en" style="top:1545px">They say "day" is in the Quran 365 times… "month" 12… "this world" as often as "the hereafter"… I counted them all myself.</div>''')

# 2. The count: every form of the word, every verse it is in lit on the grid
page("count-b", stars(90) + number(str(STEPS[0]), 540, 640, 230) + grid(800, lit=lit_all) + rules(0),
     f'''{TOP}
<div class="line">عدّيت كل مرة جت فيها… <span class="gold">طلعت {str(STEPS[0])}.</span></div>
<div class="caption" style="top:1428px">كل نقطة آية · {str(len(VERSES))} آية · الدهبي: الآيات اللي فيها «يوم»</div>
<div class="source" style="top:1470px">{CORPUS}</div>
<div class="en" style="top:1545px">I counted every time it comes… 475.</div>''')

# 3. The rules: what has to go for 365 to come out, the verses that go dark as empty rings
page("count-c", stars(90) + number(str(STEPS[3]), 540, 640, 230) + grid(800, lit=lit_kept, gone=lit_all - lit_kept) + rules(3),
     f'''{TOP}
<div class="line">عشان تطلع 365… لازم تشيل {str(STEPS[0] - STEPS[3])}.<br><span class="gold">ليه دي تتعد… ودي لأ؟</span></div>
<div class="caption" style="top:1428px">الدواير الفاضية: آيات «يوم» فيها اتشالت من العدّ</div>
<div class="en" style="top:1490px">For 365 to come out, you have to take 110 away. Why count this one… and not that one?</div>''')

EQUALS = "".join(f'<rect x="505" y="{y}" width="70" height="12" rx="6" fill="{INK}" opacity=".9"/>' for y in (796, 832))
# 4. The honest part: two counts that do hold, under the same rule
page("count-d", stars(120) + number(str(dunya), 800, 820, 190) + EQUALS + number(str(akhira), 280, 820, 190, MINT)
     + grid(1240, lit=in_dunya, other=in_akhira, cols=140, pitch=6.6, size=.62),
     f'''{TOP}
<div class="line">بس فيه عدّات صح… <span class="gold">بنفس القاعدة.</span></div>
<div class="label" style="top:960px;left:620px">الدنيا</div><div class="label" style="top:960px;left:100px">الآخرة</div>
<div class="rule" style="top:1110px">القاعدة في الاتنين: كل الصيغ</div>
<div class="source" style="top:1172px">{CORPUS}</div>
<div class="caption" style="top:1548px">كل نقطة آية · الدهبي: «الدنيا» · الأخضر: «الآخرة» · الأبيض: الاتنين</div>
<div class="en" style="top:1600px">But some counts do hold… under the same rule.</div>''')

# 5. The verse, recited, the counted thing in gold, the phases of the moon drawn under it
gold_words = {"عَدَدَ", "ٱلسِّنِينَ", "وَٱلْحِسَابَ"}
shown = " ".join(f'<span class="gold">{e(w)}</span>' if w.split(" ")[0] in gold_words else e(w) for w in words)
page("count-e", stars(200) + moons(1330),
     f'''{TOP}
<div class="ref">يونس · ٥</div>
<div class="verse">{shown}</div>
<div class="recite">تلاوة: توفيق الصايغ</div>
<div class="en" style="top:1420px;font-size:28px">{e(translation)}<br><span style="font-size:24px;opacity:.75">Saheeh International</span></div>''')
# 6. The board: every claim under the same three rules; in gold, the rule that gives the number they say
def cell(values, claim):
    hit = all(v == claim for v in values)
    text = " · ".join(str(v) for v in values)
    return f'<td class="{"hit" if hit else "miss"}">{text}</td>'


rows = "".join(f'<tr><th>{" = ".join(words)}</th><td class="said">{claim}</td>{"".join(cell(v, claim) for v in cells)}</tr>'
               for words, claim, cells in BOARD)
page("count-f", stars(120),
     f'''{TOP}
<div class="line">والباقيين؟ أغلبهم صح فعلًا…<br><span class="gold">بس كل واحد بقاعدة.</span></div>
<table class="board"><tr><th></th><td class="head">بيقولوا</td><td class="head">كل الصيغ</td><td class="head">المفرد بس</td><td class="head">الجذر كله</td></tr>{rows}</table>
<div class="caption" style="top:1410px">الدهبي: القاعدة اللي بتطلّع الرقم اللي بيقولوه · «يوم»: ولا قاعدة منهم</div>
<div class="source" style="top:1452px">{CORPUS}</div>
<div class="en" style="top:1520px">And the rest? Most are actually right… but each with its own rule.</div>''')
print(OUT)
