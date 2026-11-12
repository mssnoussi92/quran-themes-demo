#!/usr/bin/env python3
"""A page where the owner watches the films and their shorts and copies their publication texts, without a session.

For each film given: a light preview of the film and of each short (the delivered videos encoded small: a page
serves files of 20 MiB at most), the thumbnail and the covers, and every text to paste (tools/trial/publish.py,
`publish.out` of the film) with a Copy button, one tab per platform. It says what the owner has validated
(`validated` of the files: the videos, the texts) and where the full files are. Nothing is published by this tool:
it writes a folder, which a session publishes as a private page (skill release-render).

  uv run --with pyyaml python3 tools/trial/gallery.py --film film=video/out/essai-2 --film dua=video/out/dua/ci-2 \\
      [--release dua=<url of its draft release>] [--out build/gallery]

--film ID=DIR: a film, or a series (shorts that stand alone: no 16:9 card). DIR holds the delivered videos and stills, named as tools/trial/videos.py names them
(the TikTok twins are not previewed: the same video, signed with the TikTok name). Films are shown in the order
given, the last one first. Encoding is skipped for a preview newer than its video.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import subprocess
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
import videos  # noqa: E402  (the names of a film's videos and stills, read from its files)

ROOT = Path(__file__).resolve().parents[2]
TRIAL = ROOT / "content" / "trial"
MOST = 20 * 1024 * 1024 - 400_000        # bytes: a file of the page, under the 20 MiB a page may serve
PLATFORMS = (("facebook", "Facebook"), ("instagram", "Instagram"), ("tiktok", "TikTok"), ("youtube", "YouTube"))


def run(cmd: list[str]) -> str:
    done = subprocess.run(cmd, capture_output=True, text=True)
    if done.returncode != 0:
        sys.exit(f"error: {' '.join(cmd[:4])} …\n{done.stderr[-1200:]}")
    return done.stdout


def seconds(path: Path) -> float:
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)]).strip())


def stamp(t: float) -> str:
    return f"{int(t // 60)}:{int(t % 60):02d}"


def preview(src: Path, dest: Path, wide: bool) -> None:
    """`src` encoded small into `dest`: 480p for a film, 540 px wide for a short; again at a set bitrate if too big."""
    if dest.exists() and dest.stat().st_mtime >= src.stat().st_mtime and dest.stat().st_size <= MOST:
        return
    scale = "scale=854:480" if wide else "scale=540:960"
    base = ["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(src), "-vf", scale, "-c:v", "libx264", "-preset", "medium",
            "-pix_fmt", "yuv420p", "-g", "60", "-c:a", "aac", "-b:a", "80k", "-ac", "2", "-movflags", "+faststart"]
    run(base + ["-crf", "27", str(dest)])
    if dest.stat().st_size > MOST:
        rate = int(MOST * 8 / seconds(src) / 1000) - 90          # kbit/s left for the picture
        run(base + ["-b:v", f"{rate}k", "-maxrate", f"{rate}k", "-bufsize", f"{2 * rate}k", str(dest)])
    if dest.stat().st_size > MOST:
        sys.exit(f"error: {dest.name}: {dest.stat().st_size} bytes, over what a page serves")


def still(src: Path, dest: Path, width: int) -> None:
    if not (dest.exists() and dest.stat().st_mtime >= src.stat().st_mtime):
        run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(src), "-vf", f"scale={width}:-2", "-q:v", "4", str(dest)])


def texts(path: Path) -> list[dict]:
    """The publication texts publish.py wrote, one entry per « ## » section: its heading, its file line, its texts
    to paste (label, platform, text) and the notes between them."""
    sections, current, label = [], None, None
    lines = path.read_text(encoding="utf-8").splitlines()
    i = 0
    while i < len(lines):
        row = lines[i]
        if row.startswith("## "):
            current = {"heading": row[3:].strip(), "files": "", "blocks": [], "notes": []}
            sections.append(current)
        elif current is not None:
            bold = re.fullmatch(r"\*\*(.+)\*\*", row.strip())
            if bold:
                label = bold.group(1)
            elif row.startswith("```"):
                body = []
                i += 1
                while i < len(lines) and not lines[i].startswith("```"):
                    body.append(lines[i])
                    i += 1
                name = (label or "").lower()
                platform = next((key for key, _ in PLATFORMS if key in name), "youtube")
                current["blocks"].append({"label": re.sub(r"`", "", label or ""), "platform": platform, "text": "\n".join(body)})
                label = None
            elif row.strip():
                if not current["files"] and row.startswith("`"):
                    current["files"] = row.strip()
                else:
                    current["notes"].append(row.strip())
        i += 1
    return sections


def covers(what: list[dict], key: str) -> bool:
    return all(key in ((s.get("validated") or {}).get("what") or []) for s in what)


def film_data(film_id: str, folder: Path, out: Path, release: str | None) -> dict:
    film = yaml.safe_load((TRIAL / f"{film_id}.yaml").read_text(encoding="utf-8"))
    series = "chapters" not in film             # a series: shorts that stand alone, no film and no thumbnail
    shorts = [yaml.safe_load((TRIAL / f"{name}.yaml").read_text(encoding="utf-8")) for name in film.get("shorts") or film["thumbnail"]["panels"]]
    listed, stills = videos.listing(film_id, "D", "all")
    written = ROOT / film["publish"].get("out", "")
    if not film["publish"].get("out") or not written.is_file():
        sys.exit(f"error: {film_id}: no publication texts (`publish.out` of content/trial/{film_id}.yaml, tools/trial/publish.py)")
    sections = texts(written)
    media = out / "media"
    media.mkdir(parents=True, exist_ok=True)
    cards = []
    order = [v for v in listed if v["kind"] == "film"] + [v for v in listed if v["kind"] == "short"]
    twins = [v["name"] for v in listed if v["kind"] == "tiktok"]
    pictures = [s for s in stills if s["kind"] == "thumbnail"] + [s for s in stills if s["kind"] == "cover"]
    if len(sections) != len(order) or len(pictures) != len(order):
        sys.exit(f"error: {film_id}: {len(order)} videos, {len(sections)} sections of texts, {len(pictures)} stills")
    for n, (video, picture, section) in enumerate(zip(order, pictures, sections)):
        src, image = folder / f"{video['name']}.mp4", folder / picture["name"]
        for needed in (src, image):
            if not needed.is_file():
                sys.exit(f"error: {film_id}: {needed} is missing")
        wide = video["kind"] == "film"
        k = n if series else n - 1              # which short this is (the film, when there is one, comes first)
        slug = f"{film.get('files', film_id)}-{'film' if wide else 'short-' + str(k + 1)}"
        preview(src, media / f"{slug}.mp4", wide)
        still(image, media / f"{slug}.jpg", 960 if wide else 540)
        spec = film if wide else shorts[k]
        title = spec["publish"]["title"]
        cards.append({"wide": wide, "slug": slug, "file": f"{video['name']}.mp4", "twin": None if wide else f"{twins[k]}.mp4",
                      "image": picture["name"], "length": stamp(seconds(src)), "ar": title["ar"], "en": title["en"],
                      "blocks": section["blocks"], "notes": section["notes"]})
        print(f"  {slug}: {(media / (slug + '.mp4')).stat().st_size / 1e6:.1f} MB", flush=True)
    everyone = shorts if series else [film, *shorts]
    return {"id": film_id, "series": series, "anchor": re.sub(r"[^a-z0-9]+", "-", film["publish"]["series"]["en"].lower()).strip("-"),
            "ar": film["publish"]["series"]["ar"], "en": film["publish"]["series"]["en"], "cards": cards, "release": release,
            "videos_ok": all(s.get("validated") for s in everyone) and covers(everyone, "voice") and covers(everyone, "montage"),
            "texts_ok": covers(everyone, "publish"), "date": str((everyone[0].get("validated") or {}).get("on", (everyone[0].get("validated") or {}).get(True, "")))}


# ---- the page ---------------------------------------------------------------------------------------------------

CSS = """
:root {
  /* One column of films, the newest first. In a film: its 16:9 card, then its shorts side by side (stacked on a phone). */
  --paper: #f2f4f8; --card: #ffffff; --ink: #141a2e; --muted: #5b637a; --line: #d5dae6; --accent: #8a5a00;
  --good: #1f6b45; --wait: #9a4f00; --well: #eef1f7;
  --display: "Amiri", "Noto Naskh Arabic", "Times New Roman", serif;
  --body: "IBM Plex Sans", "IBM Plex Sans Arabic", "Segoe UI", system-ui, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --paper: #0a0d19; --card: #121728; --ink: #ebe6d6; --muted: #9ba2b8; --line: #262d44; --accent: #f0c46a;
    --good: #7fcf9f; --wait: #f2b25c; --well: #0d1120; color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --paper: #0a0d19; --card: #121728; --ink: #ebe6d6; --muted: #9ba2b8; --line: #262d44; --accent: #f0c46a;
  --good: #7fcf9f; --wait: #f2b25c; --well: #0d1120; color-scheme: dark;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
body { margin: 0; background: var(--paper); color: var(--ink); font: 16px/1.55 var(--body); }
main { max-width: 1180px; margin: 0 auto; padding: 28px 16px 80px; display: flex; flex-direction: column; gap: 44px; }
h1, h2, h3 { margin: 0; text-wrap: balance; }
h1 { font: 700 2rem/1.2 var(--body); letter-spacing: -0.01em; }
.lede { color: var(--muted); max-width: 65ch; margin: 8px 0 0; }
.summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; margin-top: 22px; }
.summary a { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; border: 1px solid var(--line); border-radius: 10px;
  background: var(--card); color: inherit; text-decoration: none; }
.summary a:hover, .summary a:focus-visible { border-color: var(--accent); }
.summary .ar { font: 700 1.5rem/1.3 var(--display); }
.summary .en { color: var(--muted); font-size: 0.92rem; }
.pills { display: flex; flex-wrap: wrap; gap: 6px; }
.pill { font-size: 0.78rem; font-weight: 600; padding: 2px 9px; border-radius: 999px; border: 1px solid currentColor; white-space: nowrap; }
.pill.good { color: var(--good); } .pill.wait { color: var(--wait); }
section.film { display: flex; flex-direction: column; gap: 18px; scroll-margin-top: 12px; }
.film > header { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 16px; border-bottom: 2px solid var(--accent); padding-bottom: 10px; }
.film h2 { font: 700 2.1rem/1.25 var(--display); }
.film h2 span { display: block; font: 500 1rem/1.4 var(--body); color: var(--muted); }
.where { color: var(--muted); font-size: 0.92rem; margin: 0; max-width: 75ch; }
.where a { color: var(--accent); }
.shorts { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; align-items: start; }
article { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 14px; min-width: 0; }
article.wide { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 18px; }
@media (max-width: 860px) { article.wide { display: flex; } }
.look { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
video { width: 100%; background: #000; border-radius: 8px; display: block; }
article:not(.wide) video { aspect-ratio: 9 / 16; max-height: 560px; object-fit: contain; }
article.wide video { aspect-ratio: 16 / 9; }
h3 { font: 700 1.35rem/1.4 var(--display); }
h3 span { display: block; font: 500 0.92rem/1.4 var(--body); color: var(--muted); }
.meta { color: var(--muted); font-size: 0.85rem; margin: 0; overflow-wrap: anywhere; }
.meta code { font: 0.82rem ui-monospace, "SFMono-Regular", Menlo, monospace; color: var(--ink); }
figure { margin: 0; display: flex; gap: 10px; align-items: flex-end; }
figure img { max-width: 100%; border-radius: 6px; border: 1px solid var(--line); display: block; }
article:not(.wide) figure img { width: 96px; }
article.wide figure img { width: 220px; }
figcaption { color: var(--muted); font-size: 0.82rem; overflow-wrap: anywhere; }
.texts { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.tabs { display: flex; flex-wrap: wrap; gap: 6px; }
.tabs button { font: 600 0.85rem var(--body); padding: 6px 12px; border-radius: 999px; border: 1px solid var(--line); background: transparent; color: var(--muted); cursor: pointer; }
.tabs button[aria-pressed="true"] { background: var(--ink); color: var(--paper); border-color: var(--ink); }
.block { border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
.block header { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 6px 8px 6px 12px; background: var(--well); font-size: 0.85rem; font-weight: 600; }
.copy { font: 600 0.82rem var(--body); padding: 6px 14px; border-radius: 6px; border: 1px solid var(--accent); background: var(--accent); color: var(--card); cursor: pointer; white-space: nowrap; }
.copy.done { background: transparent; color: var(--good); border-color: var(--good); }
button:focus-visible, a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
pre { margin: 0; padding: 12px; font: 0.9rem/1.6 var(--body); white-space: pre-wrap; overflow-wrap: anywhere; unicode-bidi: plaintext; text-align: start; max-height: 320px; overflow-y: auto; }
.notes { color: var(--muted); font-size: 0.85rem; margin: 0; }
footer { color: var(--muted); font-size: 0.85rem; border-top: 1px solid var(--line); padding-top: 16px; max-width: 75ch; }
"""

JS = """
document.addEventListener('click', async (event) => {
  const copy = event.target.closest('.copy');
  if (copy) {
    const pre = document.getElementById(copy.dataset.text);
    let done = false;
    try { await navigator.clipboard.writeText(pre.textContent); done = true; } catch (refused) {}
    if (!done) {                       // the frame refused: the text is selected, the keyboard copies it
      const range = document.createRange(); range.selectNodeContents(pre);
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    }
    const label = copy.textContent;
    copy.textContent = done ? 'Copié ✓' : 'Sélectionné : Ctrl/Cmd + C';
    copy.classList.toggle('done', done);
    setTimeout(() => { copy.textContent = label; copy.classList.remove('done'); }, 1800);
    return;
  }
  const tab = event.target.closest('.tabs button');
  if (tab) {
    const card = tab.closest('article');
    card.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-pressed', String(b === tab)));
    card.querySelectorAll('.block').forEach((b) => { b.hidden = b.dataset.platform !== tab.dataset.platform; });
  }
});
document.addEventListener('play', (event) => {      // one video at a time
  document.querySelectorAll('video').forEach((v) => { if (v !== event.target) v.pause(); });
}, true);
"""


def pills(film: dict) -> str:
    one = ('<span class="pill good">Vidéos validées</span>' if film["videos_ok"] else '<span class="pill wait">Vidéos à valider</span>')
    two = ('<span class="pill good">Textes validés</span>' if film["texts_ok"] else '<span class="pill wait">Textes à valider</span>')
    return f'<div class="pills">{one}{two}</div>'


def card(c: dict) -> str:
    e = html.escape
    platforms = [key for key, _ in PLATFORMS if any(b["platform"] == key for b in c["blocks"])]
    tabs = ""
    if len(platforms) > 1:
        tabs = '<div class="tabs" role="group" aria-label="Plateforme">' + "".join(
            f'<button type="button" data-platform="{key}" aria-pressed="{str(key == platforms[0]).lower()}">{name}</button>'
            for key, name in PLATFORMS if key in platforms) + "</div>"
    blocks = ""
    for k, b in enumerate(c["blocks"]):
        ident = f"{c['slug']}-text-{k}"
        hidden = " hidden" if len(platforms) > 1 and b["platform"] != platforms[0] else ""
        blocks += (f'<div class="block" data-platform="{b["platform"]}"{hidden}><header><span>{e(b["label"])}</span>'
                   f'<button type="button" class="copy" data-text="{ident}">Copier</button></header>'
                   f'<pre id="{ident}" dir="auto">{e(b["text"])}</pre></div>')
    notes = "".join(f'<p class="notes">{e(re.sub("`", "", n))}</p>' for n in c["notes"])
    twin = f' · version TikTok : <code>{e(c["twin"])}</code>' if c["twin"] else ""
    kind = "Film 16:9" if c["wide"] else "Short 9:16"
    picture = "Vignette" if c["wide"] else "Couverture"
    return f'''<article class="{'wide' if c['wide'] else 'short'}">
  <div class="look">
    <h3 dir="rtl" lang="ar">{e(c["ar"])}<span dir="ltr" lang="en">{e(c["en"])}</span></h3>
    <video controls playsinline preload="none" poster="media/{c["slug"]}.jpg"><source src="media/{c["slug"]}.mp4" type="video/mp4"></video>
    <p class="meta">{kind} · {c["length"]} · aperçu allégé · fichier à publier : <code>{e(c["file"])}</code>{twin}</p>
    <figure><img src="media/{c["slug"]}.jpg" alt="{picture} : {e(c["en"])}" loading="lazy"><figcaption>{picture} : <code>{e(c["image"])}</code></figcaption></figure>
  </div>
  <div class="texts">{tabs}{blocks}{notes}</div>
</article>'''


def page(films: list[dict], made: str) -> str:
    e = html.escape
    summary = "".join(
        f'<a href="#{f["anchor"]}"><span class="ar" dir="rtl" lang="ar">{e(f["ar"])}</span><span class="en">{e(f["en"])} · {f"une série, {len(f['cards'])} shorts" if f["series"] else f"un film et {len(f['cards']) - 1} shorts"}</span>{pills(f)}</a>'
        for f in films)
    sections = ""
    for f in films:
        where = (f'Fichiers à publier (pleine qualité, versions TikTok comprises) : <a href="{e(f["release"])}">la release brouillon sur GitHub</a>, visible de vous seul une fois connecté.'
                 if f["release"] else "Fichiers à publier (pleine qualité, versions TikTok comprises) : ceux envoyés dans la conversation ; ils ne sont dans aucune release.")
        wide = "".join(card(c) for c in f["cards"] if c["wide"])
        shorts = "".join(card(c) for c in f["cards"] if not c["wide"])
        sections += f'''<section class="film" id="{f["anchor"]}">
  <header><h2 dir="rtl" lang="ar">{e(f["ar"])}<span dir="ltr" lang="en">{e(f["en"])}</span></h2>{pills(f)}</header>
  <p class="where">{where}</p>
  {wide}
  <div class="shorts">{shorts}</div>
</section>'''
    return f'''<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Films et shorts à publier</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;600&display=swap" rel="stylesheet">
<style>{CSS}</style>
</head>
<body>
<main>
  <div>
    <h1>Films et shorts à publier</h1>
    <p class="lede">Chaque film et ses shorts : l'aperçu, la vignette ou la couverture, et les textes à coller sur chaque plateforme. L'aperçu est allégé pour cette page ; ce qui se publie, ce sont les fichiers nommés sous chaque vidéo.</p>
    <nav class="summary" aria-label="Films">{summary}</nav>
  </div>
  {sections}
  <footer>Page refaite le {e(made)} par <code>tools/trial/gallery.py</code>. Les textes viennent de <code>tools/trial/publish.py</code> ; la voix de la narration est générée par IA et chaque description le dit. Une vidéo ou un texte marqué « à valider » attend votre mot.</footer>
</main>
<script>{JS}</script>
</body>
</html>
'''


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--film", action="append", required=True, metavar="ID=DIR")
    p.add_argument("--release", action="append", default=[], metavar="ID=URL")
    p.add_argument("--out", type=Path, default=ROOT / "build" / "gallery")
    p.add_argument("--date", help="the date written at the foot of the page (default: today)")
    args = p.parse_args()
    releases = dict(item.split("=", 1) for item in args.release)
    films = []
    for item in args.film:
        film_id, _, folder = item.partition("=")
        print(f"{film_id}:", flush=True)
        films.append(film_data(film_id, Path(folder), args.out, releases.get(film_id)))
    from datetime import date
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "index.html").write_text(page(films[::-1], args.date or date.today().isoformat()), encoding="utf-8")
    files = sorted(args.out.rglob("*"))
    total = sum(f.stat().st_size for f in files if f.is_file())
    (args.out / "files.json").write_text(json.dumps([{"as": str(f.relative_to(args.out)), "bytes": f.stat().st_size} for f in files if f.is_file() and f.name != "files.json"], indent=1), encoding="utf-8")
    print(f"{args.out}: index.html and {sum(1 for f in files if f.is_file()) - 1} media files, {total / 1e6:.0f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
