#!/usr/bin/env python3
"""Style frames of the series « سنريهم آياتنا » (owner, 2026-11-12), not part of the videos: three stills of an episode
on 51:47 (the old certainty, the date that broke it, the verse) in the series' own look: sky photographs, diagrams
drawn by code, a timeline of dates in gold, the source and the image credit written on the picture.

The verse and its translation are read from a quran.com API answer saved beside the images (never typed):
  curl -s "https://api.quran.com/api/v4/verses/by_key/51:47?translations=20&fields=text_uthmani&words=true&word_fields=text_uthmani" -o <dir>/verse-51-47.json
The photographs (ESA/Webb and ESA/Hubble, CC BY 4.0: the credit is burned in, as their terms ask):
  <dir>/img/webb-deep-field.jpg   https://cdn.esawebb.org/archives/images/large/weic2209a.jpg (NASA, ESA, CSA, STScI)
  <dir>/img/hubble-udf.jpg        https://cdn.esahubble.org/archives/images/screen/heic0406a.jpg (NASA, ESA, S. Beckwith (STScI), HUDF Team)

  python3 docs/retention/signs-style-frame.py <dir> && node docs/retention/style-frame-shot.js <dir> signs-a signs-b signs-c
"""
import html
import json
import math
import random
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(sys.argv[1]).resolve()
FONTS = ROOT / "video" / "public" / "fonts"
W, H = 1080, 1920
GOLD, INK, NIGHT = "#f0c46a", "#f4efe2", "#03050d"
random.seed(11)

verse = json.loads((OUT / "verse-51-47.json").read_text(encoding="utf-8"))["verse"]
words = [w["text_uthmani"] for w in verse["words"] if w.get("char_type_name", "word") == "word"]
words = [w for w in words if not re.fullmatch(r"[٠-٩]+", w)]       # the ayah number is drawn apart
translation = re.sub(r"<sup[^>]*>.*?</sup>", "", verse["translations"][0]["text"]).strip()
e = html.escape


def stars(n, top=H, bottom=0):
    out = []
    for _ in range(n):
        x, y = random.uniform(0, W), random.uniform(bottom, top)
        r = random.uniform(0.6, 2.2)
        out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" fill="#fff" opacity="{random.uniform(.15, .85):.2f}"/>')
    return "".join(out)


TIMELINE = [(-350, "٣٥٠ ق.م", "أرسطو"), (150, "١٥٠", "بطليموس"), (610, "٦١٠", "القرآن"), (1917, "١٩١٧", "أينشتاين"), (1929, "١٩٢٩", "هابل")]


def timeline(lit):
    """The series' signature: a gold line of dates at the foot of the frame; `lit` is the date being told."""
    y, x0, x1 = 1672, 90, 990
    out = [f'<line x1="{x0}" y1="{y}" x2="{x1}" y2="{y}" stroke="{GOLD}" stroke-width="2" opacity=".55"/>']
    for k, (year, label, who) in enumerate(TIMELINE):
        x = x1 - k * (x1 - x0) / (len(TIMELINE) - 1)          # right to left, as Arabic reads
        on = year == lit
        quran = year == 610
        colour = "#9fe3c8" if quran else GOLD
        r = 13 if on else 7
        glow = f'<circle cx="{x:.0f}" cy="{y}" r="30" fill="{colour}" opacity=".22"/>' if on else ""
        out.append(f'{glow}<circle cx="{x:.0f}" cy="{y}" r="{r}" fill="{colour if (on or quran) else NIGHT}" stroke="{colour}" stroke-width="3"/>'
                   f'<text x="{x:.0f}" y="{y - 30}" text-anchor="middle" font-family="Amiri" font-weight="700" font-size="{40 if on else 30}" '
                   f'fill="{colour}" opacity="{1 if on or quran else .7}">{label}</text>'
                   f'<text x="{x:.0f}" y="{y + 52}" text-anchor="middle" font-family="Amiri" font-size="28" fill="{INK}" opacity="{.95 if on or quran else .55}">{who}</text>')
    return "".join(out)


def spheres():
    """Ptolemy's universe, drawn: the earth at the centre, a sphere for each wandering star, the fixed stars outside."""
    cx, cy = 540, 900
    radii = [70, 110, 150, 195, 245, 295, 345, 400]
    bodies = [("القمر", "#d9d6cc", 9), ("عطارد", "#c9b48a", 7), ("الزهرة", "#f3e2b8", 9), ("الشمس", GOLD, 20),
              ("المريخ", "#e0835a", 8), ("المشتري", "#e9c99a", 13), ("زحل", "#d8c08a", 11)]
    out = [f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{GOLD}" stroke-width="{1.6 if k < 7 else 2.4}" '
           f'opacity="{.38 if k < 7 else .7}" {"stroke-dasharray=" + chr(34) + "3 9" + chr(34) if k == 7 else ""}/>' for k, r in enumerate(radii)]
    for k, (name, colour, size) in enumerate(bodies):
        a = math.radians(-60 + k * 47)
        x, y = cx + radii[k] * math.cos(a), cy + radii[k] * math.sin(a)
        if name == "الشمس":
            out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="44" fill="url(#sunglow)"/>')
        out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{size}" fill="{colour}"/>')
    for k in range(46):                                         # the sphere of the fixed stars
        a = k / 46 * 2 * math.pi
        out.append(f'<circle cx="{cx + 400 * math.cos(a):.0f}" cy="{cy + 400 * math.sin(a):.0f}" r="2.4" fill="#fff" opacity=".8"/>')
    out.append(f'<circle cx="{cx}" cy="{cy}" r="30" fill="url(#earth)"/>')
    out.append(f'<text x="{cx}" y="{cy + 462}" text-anchor="middle" font-family="Amiri" font-size="30" fill="{GOLD}" opacity=".85">'
               'الكون عند بطليموس · القرن التاني: كل حاجة بتلف… ومفيش حاجة بتكبر</text>')
    return "".join(out)


def dome():
    """A mountain observatory against the sky, as a backlit silhouette: its dome open on the night. No one is drawn."""
    ridge = "M 0 1410 L 0 1252 Q 140 1190 300 1228 Q 420 1160 560 1176 Q 720 1126 860 1196 Q 980 1236 1080 1214 L 1080 1410 Z"
    pines = "".join(f'<path d="M {x} {y} l -{s * .4:.0f} {s} l {s * .8:.0f} 0 Z" fill="{NIGHT}"/>'
                    for x, y, s in [(130, 1170, 70), (176, 1186, 56), (920, 1150, 74), (968, 1170, 58), (1020, 1160, 66)])
    return f'''<path d="{ridge}" fill="{NIGHT}"/>
<path d="M 300 1228 Q 420 1160 560 1176 Q 720 1126 860 1196" fill="none" stroke="#9db7ff" stroke-width="3" opacity=".45"/>
{pines}
<rect x="478" y="1092" width="124" height="96" fill="{NIGHT}"/>
<path d="M 462 1096 A 78 78 0 0 1 618 1096 Z" fill="{NIGHT}"/>
<path d="M 462 1096 A 78 78 0 0 1 618 1096" fill="none" stroke="#b9cdff" stroke-width="3" opacity=".6"/>
<path d="M 529 1019 Q 540 1017 551 1019 L 553 1096 L 527 1096 Z" fill="#14234d"/>
<circle cx="536" cy="1040" r="1.6" fill="#fff"/><circle cx="545" cy="1062" r="1.2" fill="#fff" opacity=".8"/>
<line x1="540" y1="1094" x2="548" y2="1030" stroke="{NIGHT}" stroke-width="7" stroke-linecap="round"/>
<rect x="470" y="1096" width="140" height="6" fill="#b9cdff" opacity=".18"/>'''


def defs():
    return f'''<defs>
  <radialGradient id="sunglow"><stop offset="0" stop-color="{GOLD}" stop-opacity=".7"/><stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>
  <radialGradient id="earth" cx=".35" cy=".35"><stop offset="0" stop-color="#7fb2ff"/><stop offset=".6" stop-color="#2b5aa8"/><stop offset="1" stop-color="#0c1e44"/></radialGradient>
  <linearGradient id="veil" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="{NIGHT}" stop-opacity=".92"/><stop offset=".22" stop-color="{NIGHT}" stop-opacity=".25"/>
    <stop offset=".62" stop-color="{NIGHT}" stop-opacity=".1"/><stop offset=".8" stop-color="{NIGHT}" stop-opacity=".85"/><stop offset="1" stop-color="{NIGHT}" stop-opacity="1"/>
  </linearGradient>
</defs>'''


CSS = f"""
@font-face {{ font-family: Amiri; src: url('file://{FONTS}/Amiri-Regular.ttf'); }}
@font-face {{ font-family: Amiri; font-weight: 700; src: url('file://{FONTS}/Amiri-Bold.ttf'); }}
@font-face {{ font-family: 'Amiri Quran'; src: url('file://{FONTS}/AmiriQuran-Regular.ttf'); }}
@font-face {{ font-family: Lora; src: url('file://{FONTS}/Lora.ttf'); }}
* {{ margin: 0; box-sizing: border-box; }}
body {{ background: #222; }}
.f {{ position: relative; width: {W}px; height: {H}px; overflow: hidden; background: {NIGHT}; color: {INK}; }}
.photo {{ position: absolute; inset: 0; background-size: cover; background-position: center; }}
.tag, .handle {{ position: absolute; top: 120px; font: 700 34px Amiri; color: {GOLD}; }}
.tag {{ left: 70px; display: flex; align-items: center; gap: 14px; }}
.ep {{ display: inline-flex; width: 46px; height: 46px; border: 2px solid {GOLD}; border-radius: 50%; align-items: center; justify-content: center; font-size: 30px; line-height: 1; padding-top: 6px; }} .handle {{ right: 70px; font: 600 30px Lora; letter-spacing: .02em; }}
.line {{ position: absolute; top: 200px; left: 60px; right: 60px; direction: rtl; text-align: center;
  font: 700 66px/1.45 Amiri; text-shadow: 0 3px 18px rgba(0,0,0,.8); }}
.line .gold {{ color: {GOLD}; }}
.en {{ position: absolute; left: 90px; right: 90px; top: 1430px; text-align: center; font: italic 38px/1.4 Lora;
  color: {INK}; text-shadow: 0 2px 12px rgba(0,0,0,.9); }}
.year {{ position: absolute; top: 470px; left: 0; right: 0; text-align: center; font: 700 230px/1 Amiri; color: {GOLD};
  text-shadow: 0 0 60px rgba(240,196,106,.45); }}
.source {{ position: absolute; left: 70px; right: 70px; top: 1300px; text-align: center; font: 26px/1.4 Lora; color: {INK}; opacity: .8; }}
.credit {{ position: absolute; right: 40px; bottom: 26px; font: 21px Lora; color: {INK}; opacity: .7; }}
.verse {{ position: absolute; top: 560px; left: 70px; right: 70px; direction: rtl; text-align: center;
  font: 92px/1.9 'Amiri Quran'; text-shadow: 0 4px 26px rgba(0,0,0,.95); }}
.verse .gold {{ color: {GOLD}; }}
.ref {{ position: absolute; top: 470px; left: 0; right: 0; text-align: center; font: 700 36px Amiri; color: {GOLD}; }}
.recite {{ position: absolute; top: 1010px; left: 0; right: 0; text-align: center; font: 28px Amiri; color: {INK}; opacity: .75; }}
"""


def page(name, body):
    (OUT / f"{name}.html").write_text(f'''<!DOCTYPE html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body><div class="f">{body}</div></body></html>''', encoding="utf-8")


TOP = '<div class="tag">سنريهم آياتنا <span class="ep">١</span></div><div class="handle">@quran_words_daily</div>'
WEBB = f"file://{OUT}/img/webb-deep-field.jpg"
HUBBLE = f"file://{OUT}/img/hubble-udf.jpg"

# 1. The old certainty, on the first frame
page("signs-a", f'''<svg width="{W}" height="{H}" style="position:absolute;inset:0">{defs()}{stars(260)}{spheres()}{timeline(150)}</svg>
{TOP}
<div class="line">أكتر من ألفين سنة… أذكى عقول الدنيا كانت متأكدة: <span class="gold">الكون ثابت.</span></div>
<div class="en">For more than two thousand years, the greatest minds were certain: the universe does not change.</div>''')

# 2. The date that broke it: a real sky, the observatory, the source written like a hadith's reference
page("signs-b", f'''<div class="photo" style="background-image:url('{WEBB}'); bottom: 640px; background-position: 50% 40%;"></div>
<svg width="{W}" height="{H}" style="position:absolute;inset:0">{defs()}<rect width="{W}" height="{H}" fill="url(#veil)"/>{dome()}
<rect y="1410" width="{W}" height="{H - 1410}" fill="{NIGHT}"/>{timeline(1929)}</svg>
{TOP}
<div class="line">لحد سنة ١٩٢٩… تلسكوب فوق جبل في كاليفورنيا شاف المجرات… <span class="gold">بتبعد عننا.</span></div>
<div class="year">١٩٢٩</div>
<div class="source">Edwin Hubble, Proceedings of the National Academy of Sciences, 1929</div>
<div class="en" style="top:1392px">Until 1929… a telescope on a mountain in California saw the galaxies… moving away from us.</div>
<div class="credit">Image: NASA, ESA, CSA, STScI (CC BY 4.0)</div>''')

# 3. The verse, recited over the deep sky; the word in gold
shown = " ".join(f'<span class="gold">{e(w)}</span>' if "مُوسِعُونَ" in w else e(w) for w in words)
page("signs-c", f'''<div class="photo" style="background-image:url('{HUBBLE}'); opacity:.85;"></div>
<svg width="{W}" height="{H}" style="position:absolute;inset:0">{defs()}<rect width="{W}" height="{H}" fill="url(#veil)"/>
<rect y="1560" width="{W}" height="{H - 1560}" fill="{NIGHT}"/>{timeline(610)}</svg>
{TOP}
<div class="ref">الذاريات · ٤٧</div>
<div class="verse">{shown}</div>
<div class="recite">تلاوة: توفيق الصايغ</div>
<div class="en" style="top:1180px">{e(translation)}<br><span style="font-size:26px;opacity:.75">Saheeh International</span></div>
<div class="credit">Image: NASA, ESA, S. Beckwith (STScI), HUDF Team (CC BY 4.0)</div>''')
print(OUT)
