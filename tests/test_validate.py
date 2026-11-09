"""scripts/validate.py refuses what the non-negotiable rules of CLAUDE.md forbid."""

from __future__ import annotations

from conftest import scene

EPISODE = "khushu"


def refused(done, message: str) -> None:
    assert done.returncode == 1, done.stdout[-2000:] + done.stderr[-2000:]
    assert message in done.stdout, done.stdout[-2000:]


def test_the_real_content_passes(copy):
    done = copy.validate()
    assert done.returncode == 0, done.stdout[-3000:] + done.stderr[-2000:]
    assert " 0 error(s)" in done.stdout


def test_no_character_beside_a_prophet_or_a_companion(copy):
    ep = copy.episode(EPISODE)
    named = scene(ep, lambda s: s.get("mentions"))["mentions"]
    drawn = scene(ep, lambda s: (s.get("visual") or {}).get("characters"))
    drawn["mentions"] = named
    copy.save_episode(ep)
    refused(copy.validate(), f"[{drawn['id']}]: no character in a scene that mentions a real person")


def test_a_verse_is_never_read_by_the_synthetic_voice(copy):
    ep = copy.episode(EPISODE)
    verse = scene(ep, lambda s: s.get("audio") == "recitation")
    verse["audio"] = "tts"
    copy.save_episode(ep)
    refused(copy.validate(), f"[{verse['id']}]: a verse must use audio: recitation (never TTS)")


def test_a_quotation_exists_only_by_its_id(copy):
    ep = copy.episode(EPISODE)
    quoted = scene(ep, lambda s: s.get("source"))
    quoted["source"] = "quran.2.9999"
    copy.save_episode(ep)
    refused(copy.validate(), "source 'quran.2.9999' is not in content/sources/")


def test_a_text_typed_by_hand_has_no_origin(copy):
    registry = copy.load("content/sources/quran.yaml")
    del registry[0]["origin"]
    copy.dump("content/sources/quran.yaml", registry)
    refused(copy.validate(), "text without origin: fill it with tools/sources/fetch.py, never by hand")


def test_a_tirmidhi_hadith_needs_al_albani_to_accept_it(copy):
    registry = copy.load("content/sources/hadith.yaml")
    hadith = next(e for e in registry if e["id"].startswith("hadith.tirmidhi") and e["status"] != "excluded")
    for grade in hadith["origin"]["grades"]:
        if grade["name"] == "Al-Albani":
            grade["grade"] = "Daif"
    copy.dump("content/sources/hadith.yaml", registry)
    refused(copy.validate(), "grades it 'Daif', outside content/policy.yaml; status must be excluded")


def test_a_collection_outside_the_policy_cannot_be_quoted(copy):
    registry = copy.load("content/sources/hadith.yaml")
    hadith = next(e for e in registry if e["id"].startswith("hadith.bukhari"))
    hadith["id"] = hadith["id"].replace("bukhari", "ahmad")
    hadith["ref"]["collection"] = "ahmad"
    copy.dump("content/sources/hadith.yaml", registry)
    refused(copy.validate(), "collection 'ahmad' is outside content/policy.yaml; status must be excluded")


def test_backgrounds_and_characters_come_from_the_closed_catalogs(copy):
    ep = copy.episode(EPISODE)
    drawn = scene(ep, lambda s: (s.get("visual") or {}).get("characters"))
    drawn["visual"]["background"] = "moon"
    drawn["visual"]["characters"][0]["id"] = "stranger"
    copy.save_episode(ep)
    done = copy.validate()
    refused(done, "background 'moon' is not in content/backgrounds.yaml")
    refused(done, "character 'stranger' is not in content/characters.yaml")


def test_a_style_that_is_not_drawn_is_refused(copy):
    """docs/styles.md gives chalk to the misconceptions and illumination to the collections: until
    they are built, an episode cannot be set in them (2026-11-09: only flat and paper are drawn)."""
    ep = copy.episode(EPISODE)
    ep["style"] = "chalk"
    copy.save_episode(ep)
    refused(copy.validate(), "has no drawing in the style 'chalk'")


def test_the_voice_says_the_words_on_screen(copy):
    ep = copy.episode(EPISODE)
    respelled = scene(ep, lambda s: s.get("say_ar"))
    respelled["say_ar"] = respelled["say_ar"] + " كلمة زيادة"
    copy.save_episode(ep)
    refused(copy.validate(), "say_ar must say the words of narration.ar, word for word")


def test_a_final_render_needs_the_owners_validation(copy):
    assert copy.validate("--release", "--reel", f"{EPISODE}-01").returncode == 0
    ep = copy.episode(EPISODE)
    del ep["reels"][0]["validated_by"]
    copy.save_episode(ep)
    refused(copy.validate("--release", "--reel", f"{EPISODE}-01"),
            f"reel '{EPISODE}-01': script not validated by the owner (validated_by)")
    assert copy.validate().returncode == 0            # a candidate may still be rendered


def test_a_final_render_needs_validated_sources(copy):
    ep = copy.episode(EPISODE)
    quoted = scene(ep, lambda s: s.get("source"))["source"]
    kind = "quran" if quoted.startswith("quran.") else "hadith"
    registry = copy.load(f"content/sources/{kind}.yaml")
    source = next(e for e in registry if e["id"] == quoted)
    source["status"] = "proposed"
    source.pop("validated_by", None)
    copy.dump(f"content/sources/{kind}.yaml", registry)
    done = copy.validate("--release")
    refused(done, f"source '{quoted}' is not validated yet")
    plain = copy.validate()
    assert plain.returncode == 0 and "warning" in plain.stdout    # a warning without --release
