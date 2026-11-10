// The YouTube thumbnail of an episode in chalk (1280x720, read at about 170 px wide on a phone): the
// board in its frame, the episode's character in chalk on the left, cut at the chest, and the words
// on the right. The subject is the largest thing on the board, in yellow (the key word), underlined
// by hand: the kicker (« عن التوبة »); the headline (« ٣ أفكار غلط ») is above it, smaller, in
// white. Nothing in the bottom-right corner (YouTube's duration badge).
import React, { useEffect, useRef, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { FONT, loadFonts } from "../../fonts";
import type { Character, ThumbnailData } from "../../types";
import { BOARD, CHALK, CHALK_SOFT, Defs, Dust, Frame, RoughFilter, seedOf, wipesOf } from "./board";
import { ChalkFigure, PeepFilters, PeepStyles, type Placed } from "./figure";

const W = 1280;
const H = 720;
const RUQAA = `"${FONT.ruqaa}", "${FONT.arabic}"`;
/** Width of a ruqaa letter, in em: a first guess, wide enough for any word (a final ع or ص is twice
 * a ل); the words are then measured and set to the size that fills their column. */
const LETTER = 0.42;

const letters = (text: string) => text.replace(/[\u064B-\u0652\u0670]/g, "").length;
const guess = (text: string, max: number, width: number) => Math.round(Math.min(max, width / (LETTER * Math.max(1, letters(text)))));

export const ChalkThumb: React.FC<{ t: ThumbnailData; c: Character | null }> = ({ t, c }) => {
  const seed = seedOf(t.headline.ar + (t.kicker?.ar ?? ""));
  const prefix = "ckth";
  // The figure as in the flat close-up: its head under the top of the frame, cut by the bottom.
  const scale = 0.62;
  const figure: Placed | null = c ? { c, x: 300, floorY: 36 + (c.box[3] + 80) * scale, scale } : null;
  // The words' column: beside the figure, clear of the frame.
  const width = c ? 650 : 1080;
  const subject = t.kicker?.ar ?? t.headline.ar;
  const maxBig = c ? 220 : 280;
  /** The headline, as a part of the subject's size. */
  const SMALL = 0.5;
  // Sizes: guessed from the number of letters, then, once the fonts are there, from the width the
  // words really take (the same result at every render: nothing here depends on time).
  const [sizes, setSizes] = useState(() => {
    const big = guess(subject, maxBig, width);
    return { big, small: t.kicker ? guess(t.headline.ar, Math.round(big * SMALL), width) : 0 };
  });
  const bigRef = useRef<HTMLDivElement>(null);
  const smallRef = useRef<HTMLDivElement>(null);
  const [handle] = useState(() => delayRender("chalk thumbnail: measuring the words"));
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (!done) continueRender(handle);
      done = true;
    };
    loadFonts()
      .then(() => {
        const measured = (el: HTMLDivElement | null, size: number, max: number) =>
          el && el.scrollWidth > 0 ? Math.floor(Math.min(max, (size * width) / el.scrollWidth)) : size;
        setSizes((now) => {
          const big = measured(bigRef.current, now.big, maxBig);
          return { big, small: t.kicker ? measured(smallRef.current, now.small, Math.round(big * SMALL)) : 0 };
        });
      })
      .finally(() => requestAnimationFrame(finish));
    return finish;
    // Once: the thumbnail is a still.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: BOARD }}>
      <PeepStyles />
      <Defs>
        {figure ? <PeepFilters prefix={prefix} seed={seed} figures={[figure]} /> : null}
        <RoughFilter id={`${prefix}-text`} seed={8} scale={3.5} />
      </Defs>
      <Dust w={W} h={H} seed={seed} id={`${prefix}-dust`} wipes={wipesOf(W, H, seed, 2, { x: c ? 880 : 640, y: 330 })} />
      {figure ? <ChalkFigure p={figure} audio={null} prefix={prefix} clip={{ w: W, h: H }} /> : null}
      <div
        dir="rtl"
        lang="ar"
        style={{
          position: "absolute", top: 0, bottom: c ? 90 : 60, right: c ? 74 : 100, width,
          display: "flex", flexDirection: "column", justifyContent: "center", alignItems: c ? "flex-start" : "center",
          fontFamily: RUQAA, fontWeight: 700, whiteSpace: "nowrap",
        }}
      >
        {t.kicker ? (
          // Ruqaa stacks its letters (« الخشوع » rises above the line): room between the two rows.
          <div ref={smallRef} style={{ fontSize: sizes.small, lineHeight: 1.3, marginBottom: sizes.big * 0.14, color: CHALK.white, filter: `url(#${prefix}-text)` }}>
            {t.headline.ar}
          </div>
        ) : null}
        <div style={{ position: "relative", fontSize: sizes.big, lineHeight: 1.42, color: CHALK.yellow }}>
          <div ref={bigRef} style={{ filter: `url(#${prefix}-text)` }}>
            {subject}
          </div>
          <svg viewBox="0 0 1000 44" preserveAspectRatio="none" style={{ position: "absolute", left: "-1%", width: "102%", top: "calc(100% - 0.12em)", height: 44, overflow: "visible" }}>
            <path d="M992 20 Q760 36 520 22 Q270 8 8 26" fill="none" stroke={CHALK.yellow} strokeWidth={11} strokeLinecap="round" filter={`url(#${prefix}-text)`} />
          </svg>
        </div>
        <div dir="ltr" lang="en" style={{ marginTop: 44, fontFamily: `"${FONT.latin}"`, fontWeight: 400, fontSize: 38, letterSpacing: 0.5, color: CHALK_SOFT }}>
          {t.headline.en}
          {t.kicker ? ` ${t.kicker.en}` : ""}
        </div>
      </div>
      <Frame w={W} h={H} />
    </div>
  );
};
