#!/usr/bin/env python3
"""Style frames of the brainstorm of 2026-11-11 (docs/retention.md), not part of the videos: the boat at dusk as
backlit silhouettes, in the colours of the page's recitation reels. Verse text comes from the registry, never typed.
  uv run --with pyyaml python3 docs/retention/style-frame.py <out dir> && node docs/retention/style-frame-shot.js <out dir> a b c"""
import math, random, sys, yaml, html
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(sys.argv[1])
reg = {e['id']: e for e in yaml.safe_load(open(ROOT / 'content/sources/quran.yaml'))}
random.seed(7)

def stars(W, top):
    out = []
    for _ in range(int(120 * W / 1080)):
        x, y = random.uniform(0, W), random.uniform(0, top)
        r = random.uniform(0.8, 2.3); o = random.uniform(0.15, 0.9) * (1 - y / (top * 1.2))
        out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" fill="#fff" opacity="{o:.2f}"/>')
    return ''.join(out)

def wave(W, H, y, amp, length, phase, fill, hi):
    pts = [f"{x},{y + amp * math.sin(x / length * 2 * math.pi + phase):.1f}" for x in range(-20, W + 40, 20)]
    d = "M " + " L ".join(pts)
    return (f'<path d="{d} L {W + 40},{H} L -20,{H} Z" fill="{fill}"/>'
            f'<path d="{d}" fill="none" stroke="{hi}" stroke-width="3"/>')

def reflection(cx, HZ, n=18, k=1.0):
    out = []
    for i in range(n):
        y = HZ + 14 + i * 30 * k
        rx = max(18, 170 - i * 7 + random.uniform(-22, 22))
        out.append(f'<ellipse cx="{cx + random.uniform(-16, 16):.0f}" cy="{y}" rx="{rx:.0f}" ry="{3.2 + i * 0.12:.1f}" fill="#ffdca6" opacity="{max(0.06, 0.62 - i * 0.034):.2f}"/>')
    return ''.join(out)

BOAT = f'''
<g transform="translate(0 14) rotate(-3.5 470 1340) translate(470 1340) scale(0.88) translate(-470 -1340)">
  <!-- yard and lateen sail, lit from behind -->
  <path d="M 292 1016 Q 520 986 702 690 Q 640 1010 548 1262 Q 410 1160 292 1016 Z" fill="url(#sail)"/>
  <path d="M 292 1016 Q 520 986 702 690" fill="none" stroke="#05060f" stroke-width="10" stroke-linecap="round"/>
  <path d="M 702 690 Q 640 1010 548 1262" fill="none" stroke="#ffc98a" stroke-width="3" opacity=".55"/>
  <line x1="478" y1="1300" x2="506" y2="772" stroke="#05060f" stroke-width="13" stroke-linecap="round"/>
  <line x1="506" y1="772" x2="780" y2="1262" stroke="#05060f" stroke-width="3" opacity=".8"/>
  <line x1="506" y1="772" x2="196" y2="1240" stroke="#05060f" stroke-width="3" opacity=".8"/>
  <!-- hull -->
  <path d="M 150 1214 C 214 1300 300 1352 410 1356 L 650 1356 C 736 1352 792 1300 826 1226
           L 790 1252 C 720 1292 610 1300 482 1300 C 350 1300 244 1278 150 1214 Z" fill="#05060f"/>
  <path d="M 826 1226 L 790 1252 C 720 1292 610 1300 482 1300" fill="none" stroke="#ffbe7a" stroke-width="3.5" opacity=".7"/>
  <!-- the gap torn in the hull: the light of the sea shows through it -->
  <g filter="url(#glow)">
    <polygon points="330,1312 362,1300 386,1316 420,1302 448,1322 438,1352 404,1346 372,1356 336,1344" fill="#ffd9a0"/>
  </g>
  <polygon points="330,1312 362,1300 386,1316 420,1302 448,1322 438,1352 404,1346 372,1356 336,1344" fill="#ffe9c4"/>
  <path d="M 362 1300 l 10 22 M 420 1302 l -8 20 M 372 1356 l 8 -18" stroke="#05060f" stroke-width="5" stroke-linecap="round"/>
</g>
<!-- water thrown up at the gap, rings, the torn plank -->
<g fill="#ffe6bd">
  <circle cx="318" cy="1262" r="9"/><circle cx="352" cy="1222" r="7"/><circle cx="398" cy="1196" r="10"/>
  <circle cx="436" cy="1236" r="6"/><circle cx="286" cy="1300" r="6"/><circle cx="470" cy="1272" r="8"/><circle cx="376" cy="1158" r="5"/>
</g>
<g fill="none" stroke="#ffdca6">
  <ellipse cx="392" cy="1388" rx="96" ry="15" stroke-width="3" opacity=".7"/>
  <ellipse cx="392" cy="1392" rx="176" ry="26" stroke-width="2.5" opacity=".4"/>
  <ellipse cx="392" cy="1396" rx="262" ry="38" stroke-width="2" opacity=".2"/>
</g>
<g transform="rotate(-16 170 1436)"><rect x="110" y="1426" width="124" height="20" rx="4" fill="#05060f"/><rect x="110" y="1426" width="124" height="4" fill="#ffbe7a" opacity=".6"/></g>
'''

def scene(W=1080, H=1920, HZ=1090, SUNX=790, boat='', waves=(1500, 1640, 1790), land='left'):
    hill = (f'<path d="M 0 {HZ} L 0 {HZ - 46} Q 120 {HZ - 86} 250 {HZ - 40} Q 330 {HZ - 16} 420 {HZ} Z" fill="#2a1c46"/>' if land == 'left' else
            f'<path d="M {W} {HZ} L {W} {HZ - 60} Q {W - 160} {HZ - 104} {W - 330} {HZ - 44} Q {W - 430} {HZ - 14} {W - 540} {HZ} Z" fill="#2a1c46"/>')
    return f'''<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#040714"/><stop offset=".3" stop-color="#0d1740"/><stop offset=".56" stop-color="#2a2862"/>
    <stop offset=".74" stop-color="#6b3f6e"/><stop offset=".88" stop-color="#c8694a"/><stop offset=".97" stop-color="#f3ad62"/><stop offset="1" stop-color="#ffe0a8"/>
  </linearGradient>
  <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#a55f58"/><stop offset=".1" stop-color="#5a3b68"/><stop offset=".32" stop-color="#1c2358"/><stop offset="1" stop-color="#060a22"/>
  </linearGradient>
  <radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff3d0" stop-opacity=".95"/><stop offset=".22" stop-color="#ffd08a" stop-opacity=".6"/><stop offset="1" stop-color="#ffb060" stop-opacity="0"/></radialGradient>
  <linearGradient id="sail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0b0d22"/><stop offset=".7" stop-color="#3a2548"/><stop offset="1" stop-color="#8a4a50"/></linearGradient>
  <radialGradient id="vig" cx=".5" cy=".55" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>
  <filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="16"/></filter>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 -.18"/></filter>
</defs>
<rect width="{W}" height="{HZ}" fill="url(#sky)"/>
{stars(W, HZ * 0.7)}
<circle cx="{SUNX}" cy="{HZ}" r="560" fill="url(#sun)"/>
<circle cx="{SUNX}" cy="{HZ + 6}" r="92" fill="#fff4d6"/>
{hill}
<rect y="{HZ}" width="{W}" height="{H - HZ}" fill="url(#sea)"/>
{reflection(SUNX, HZ, 18 if H > W else 13, 1.0 if H > W else 0.8)}
<g transform="{boat}">{BOAT}</g>
{wave(W, H, waves[0], 12, 420, 0.6, "#0b1032", "rgba(255,196,140,.22)")}
{wave(W, H, waves[1], 15, 520, 2.1, "#080c26", "rgba(255,196,140,.16)")}
{wave(W, H, waves[2], 18, 640, 4.0, "#05081a", "rgba(255,196,140,.10)")}
<rect width="{W}" height="{H}" fill="url(#vig)"/>
<rect width="{W}" height="{H}" filter="url(#grain)" opacity=".5"/>
</svg>'''

CSS = f'''
@font-face {{ font-family: "Amiri Quran"; src: url("file://{ROOT}/video/public/fonts/AmiriQuran-Regular.ttf"); }}
@font-face {{ font-family: "Amiri"; src: url("file://{ROOT}/video/public/fonts/Amiri-Bold.ttf"); font-weight: 700; }}
@font-face {{ font-family: "Amiri"; src: url("file://{ROOT}/video/public/fonts/Amiri-Regular.ttf"); font-weight: 400; }}
@font-face {{ font-family: "Lora"; src: url("file://{ROOT}/video/public/fonts/Lora.ttf"); }}
html, body {{ margin: 0; background: #000; }}
.f {{ position: relative; overflow: hidden; }}
.t {{ position: absolute; left: 80px; right: 80px; text-align: center; color: #fff; text-shadow: 0 2px 24px rgba(4,7,20,.9), 0 0 60px rgba(4,7,20,.7); }}
.handle {{ position: absolute; top: 250px; right: 90px; font: 600 30px Lora; color: #ffd27a; opacity: .9; }}
.gold {{ color: #ffcf6a; }}
.credit {{ position: absolute; left: 0; right: 0; top: 1716px; text-align: center; font: 400 30px Lora; color: rgba(255,255,255,.62); }}
'''

def page(body, W=1080, H=1920, **kw):
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body><div class="f" style="width:{W}px;height:{H}px">{scene(W, H, **kw)}{body}</div></body></html>'

# Frame A: the opening of a short (our narration line, as in khidr-solo-01).
a = '''<div class="handle">@quran_words_daily</div>
<div class="t" dir="rtl" lang="ar" style="top:330px;font:700 104px/1.5 Amiri">سفينة شالتهم ببلاش…<br>وواحد منهم خرقها!<br><span class="gold" style="font-size:132px">ليه؟</span></div>
<div class="t" lang="en" style="top:1490px;font:italic 400 46px/1.4 Lora;color:rgba(255,255,255,.92)">A boat carried them for free…<br>and one of them tore a hole in it. Why?</div>'''

# Frame B: the verse recited over the scene (text from the registry; one word lit as it is recited).
v = reg['quran.18.71']
words = v['text_ar'].split()
lit = next(i for i, w in enumerate(words) if 'خَرَقَهَا' in w)
verse = ' '.join(f'<span class="gold">{html.escape(w)}</span>' if i == lit else html.escape(w) for i, w in enumerate(words))
en = v['text_en'].split('[Moses]')[0].strip()
b = f'''<div class="handle">@quran_words_daily</div>
<div class="t" dir="rtl" lang="ar" style="top:316px;font:400 34px Amiri;color:rgba(255,255,255,.7)">سورة {v['origin']['surah_ar']} · ٧١</div>
<div class="t" dir="rtl" lang="ar" style="top:366px;left:64px;right:64px;font:400 66px/1.95 'Amiri Quran'">{verse}</div>
<div class="t" lang="en" style="top:1490px;font:italic 400 44px/1.4 Lora;color:rgba(255,255,255,.92)">{html.escape(en)}</div>
<div class="credit">Tawfiq As-Sayegh · Sahih International</div>'''

(OUT / 'a.html').write_text(page(a), encoding='utf-8')
(OUT / 'b.html').write_text(page(b), encoding='utf-8')
# Frame C: the same verse in the long film (16:9).
c = f'''<div class="handle" style="top:54px;right:80px">@quran_words_daily</div>
<div class="t" dir="rtl" lang="ar" style="top:22px;left:0;right:0;font:400 30px Amiri;color:rgba(255,255,255,.7)">سورة {v['origin']['surah_ar']} · ٧١</div>
<div class="t" dir="rtl" lang="ar" style="top:92px;left:150px;right:150px;font:400 68px/1.9 'Amiri Quran'">{verse}</div>
<div class="t" lang="en" style="top:936px;left:260px;right:260px;font:italic 400 38px/1.35 Lora;color:rgba(255,255,255,.92)">{html.escape(en)}</div>'''
(OUT / 'c.html').write_text(page(c, 1920, 1080, HZ=640, SUNX=560, boat='translate(1240 716) scale(0.6) translate(-470 -1340)', waves=(880, 960, 1030), land='right'), encoding='utf-8')
print('ok', len(words), 'words; lit:', words[lit])
