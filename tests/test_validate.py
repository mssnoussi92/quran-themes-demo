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
    """A style in reserve (watercolor) draws no place yet: an episode cannot be set in it."""
    ep = copy.episode(EPISODE)
    ep["style"] = "watercolor"
    copy.save_episode(ep)
    refused(copy.validate(), "has no drawing in the style 'watercolor'")


def test_a_place_not_drawn_in_the_style_is_refused(copy):
    """Chalk draws the places of the misconceptions episodes (2026-11-10), not those of the stories
    of al-Kahf, drawn in the flat style only."""
    ep = copy.episode("khidr")
    ep["style"] = "chalk"
    copy.save_episode(ep)
    refused(copy.validate(), "background 'confluence' has no drawing in the style 'chalk'")


def test_the_misconceptions_episodes_can_be_set_in_chalk(copy):
    """Every place and pose of khushu is drawn in chalk: it validates in that style."""
    ep = copy.episode(EPISODE)
    ep["style"] = "chalk"
    copy.save_episode(ep)
    done = copy.validate()
    assert done.returncode == 0 and " 0 error(s)" in done.stdout, done.stdout[-2000:]


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


def warned(done, message: str) -> None:
    assert done.returncode == 0, done.stdout[-2000:] + done.stderr[-2000:]
    assert any(line.startswith("warning ") and message in line for line in done.stdout.splitlines()), done.stdout[-2000:]


def test_a_reel_being_written_must_give_something_to_look_at(copy):
    """Audit of 2026-11-09: 27 % of the scenes drawn, the picture a card of text the rest of the time.
    A reel the owner validated stays as is; one being written is told."""
    ep = copy.episode(EPISODE)
    of = lambda r: [s for s in ep["scenes"] if s.get("reel") == r["id"]]
    drawn = lambda r: sum(1 for s in of(r) if s["visual"]["template"] == "scene")
    reel = next(r for r in ep["reels"] if 3 * drawn(r) < len(of(r)))      # a reel of cards, as published
    assert " 0 warning(s)" in copy.validate().stdout             # validated: nothing said
    del reel["validated_by"]
    copy.save_episode(ep)
    done = copy.validate()
    warned(done, f"[{reel['id']}]")
    assert "scenes are drawn (template: scene): at least a third" in done.stdout


def test_three_cards_of_narration_in_a_row_are_told(copy):
    ep = copy.episode(EPISODE)
    reel = ep["reels"][0]
    del reel["validated_by"]
    cards = [s for s in ep["scenes"] if s.get("reel") == reel["id"] and s["visual"]["template"] == "title-card"]
    others = [s for s in ep["scenes"] if s not in cards]
    at = next(i for i, s in enumerate(others) if s.get("reel") == reel["id"])
    ep["scenes"] = others[:at] + cards + others[at:]              # the reel's title cards one after the other
    copy.save_episode(ep)
    warned(copy.validate(), f"{len(cards)} cards of narration in a row ({cards[0]['id']} … {cards[-1]['id']})")


def test_a_manuscript_page_draws_silhouettes(copy):
    """Illumination has no faces: a pose only the Open Peeps figures have is refused there."""
    ep = copy.episode(EPISODE)
    ep["style"] = "illumination"
    copy.save_episode(ep)
    done = copy.validate()
    refused(done, "in the style 'illumination'")
    assert "pose 'open-hands' not in catalog for 'narrator' in the style 'illumination'" in done.stdout
