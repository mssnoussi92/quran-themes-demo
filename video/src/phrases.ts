// Phrases of a narration line, cut after « ، … . ؟ ! : » exactly as tools/audio/build.py does
// (PHRASE_CUT): the manifest times each one, title cards reveal them, episode cuts drop the last ones.
export const splitPhrases = (text: string): string[] =>
  text.trim().split(/(?<=[،,….!?؟:])\s+/).filter(Boolean);
