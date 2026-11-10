// How wide a line of Amiri bold is, without a browser to measure it: a cartouche must be given its
// size before anything is drawn, and every frame is drawn alone (no state, no measuring pass).
// Advances in em, read from public/fonts/Amiri-Bold.ttf (shaped with HarfBuzz) for each letter in
// each of its four forms; a word's width is the sum of its letters in the form their neighbours give
// them. Checked against the real width of the 852 phrases and thumbnail lines of the nine first
// episodes: 3 % off on average, never more than 3.5 % too narrow (too wide by up to 22 % where
// Amiri draws a ligature: the text is then a little smaller than it could be, never cut).
// Used to choose a size and to break lines only: the text itself is never touched.

/** [isolated, initial, medial, final]. */
const LETTERS: Record<string, [number, number, number, number]> = {
  "ء": [0.381, 0.381, 0.381, 0.381], "آ": [0.217, 0.217, 0.327, 0.327], "أ": [0.234, 0.234, 0.289, 0.289],
  "ؤ": [0.4, 0.4, 0.345, 0.345], "إ": [0.217, 0.217, 0.229, 0.229], "ئ": [0.764, 0.19, 0.244, 0.585],
  "ا": [0.217, 0.217, 0.229, 0.229], "ب": [0.926, 0.19, 0.244, 0.883], "ة": [0.369, 0.369, 0.379, 0.379],
  "ت": [0.926, 0.19, 0.244, 0.883], "ث": [0.926, 0.19, 0.244, 0.883], "ج": [0.661, 0.655, 0.61, 0.639],
  "ح": [0.661, 0.655, 0.61, 0.639], "خ": [0.661, 0.655, 0.61, 0.639], "د": [0.45, 0.45, 0.471, 0.471],
  "ذ": [0.45, 0.45, 0.471, 0.471], "ر": [0.399, 0.399, 0.343, 0.343], "ز": [0.399, 0.399, 0.343, 0.343],
  "س": [0.992, 0.568, 0.568, 1.079], "ش": [0.992, 0.568, 0.568, 1.079], "ص": [1.212, 0.698, 0.722, 1.181],
  "ض": [1.212, 0.698, 0.722, 1.181], "ط": [0.792, 0.567, 0.551, 0.751], "ظ": [0.792, 0.567, 0.551, 0.751],
  "ع": [0.54, 0.477, 0.366, 0.493], "غ": [0.54, 0.477, 0.366, 0.493], "ف": [0.983, 0.295, 0.378, 1.005],
  "ق": [0.687, 0.295, 0.378, 0.607], "ك": [0.657, 0.659, 0.588, 0.822], "ل": [0.603, 0.175, 0.197, 0.644],
  "م": [0.452, 0.389, 0.463, 0.522], "ن": [0.572, 0.19, 0.244, 0.615], "ه": [0.369, 0.452, 0.39, 0.379],
  "و": [0.4, 0.4, 0.345, 0.345], "ى": [0.764, 0.19, 0.244, 0.585], "ي": [0.764, 0.19, 0.244, 0.585],
  "پ": [0.926, 0.19, 0.244, 0.883], "چ": [0.661, 0.655, 0.61, 0.639], "ڤ": [0.983, 0.295, 0.378, 1.005],
  "گ": [1.202, 0.659, 0.588, 1.132],
};

/** Signs that do not join: space, punctuation, digits. */
const SIGNS: Record<string, number> = {
  " ": 0.292, ".": 0.317, ",": 0.218, ":": 0.255, ";": 0.248, "!": 0.263, "?": 0.389, "…": 0.771,
  "،": 0.369, "؛": 0.369, "؟": 0.413, "«": 0.415, "»": 0.415, "\"": 0.323, "'": 0.176, "-": 0.366,
  "(": 0.458, ")": 0.458, "٠": 0.585, "١": 0.585, "٢": 0.585, "٣": 0.585, "٤": 0.585, "٥": 0.585,
  "٦": 0.585, "٧": 0.585, "٨": 0.585, "٩": 0.585, "0": 0.532, "1": 0.532, "2": 0.532, "3": 0.532,
  "4": 0.532, "5": 0.532, "6": 0.532, "7": 0.532, "8": 0.532, "9": 0.532, "ﷺ": 1.055,
};

/** Lam with an alef after it is one sign: [isolated, final]. */
const LAM_ALEF: Record<string, [number, number]> = {
  "ا": [0.642, 0.691], "أ": [0.642, 0.691], "إ": [0.642, 0.691], "آ": [0.642, 0.691],
};

/** Letters that join only the letter before them, and the one that joins nothing. */
const RIGHT = new Set([..."آأؤإاةدذرزو"]);
const ALONE = new Set(["ء"]);

/** Marks: no width of their own. */
const MARKS = /[\u064b-\u065f\u0670\u0640]/g;

/** A margin over the estimate: it is at most 3.5 % too narrow. */
export const SAFE = 1.04;

/** Width of a line of Amiri bold, in em (an estimate: see above). */
export const widthOf = (text: string): number => {
  const chars = [...text.replace(MARKS, "")];
  let total = 0;
  let joined = false; // the letter before joins this one
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const forms = LETTERS[c];
    if (!forms) {
      total += SIGNS[c] ?? 0.5;
      joined = false;
      continue;
    }
    const next = chars[i + 1];
    const dual = !RIGHT.has(c) && !ALONE.has(c);
    if (c === "ل" && next !== undefined && LAM_ALEF[next]) {
      total += LAM_ALEF[next][joined ? 1 : 0];
      joined = false;
      i++;
      continue;
    }
    const joins = dual && next !== undefined && LETTERS[next] !== undefined && !ALONE.has(next);
    total += forms[joined && joins ? 2 : joined ? 3 : joins ? 1 : 0];
    joined = joins;
  }
  return total;
};
