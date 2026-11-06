// A catalog character drawn with Open Peeps (react-peeps). Its mouth opens with the voice when the
// scene says it is talking (`talking: true`): the scene's audio level picks the open-mouth face.
import { useAudioData } from "@remotion/media-utils";
import type { AudioData } from "@remotion/media-utils";
import Peep from "react-peeps";
import type { AccessoryType, FaceType, FacialHairType, HairType } from "react-peeps";
import { staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Character } from "../types";

export const INK = "#1d1d1d";
const MARGIN = 40; // units around the measured box, for the stroke

type Body = React.ComponentProps<typeof Peep>["body"];

/** Pixel placement of a figure whose feet (or bust bottom) stand on `floorY`, centred on `x`
 * (on the hips for a sitting figure). */
export function placement(c: Character, x: number, floorY: number, scale: number) {
  const [bx, by, bw, bh] = c.box;
  const anchorX = c.seat ? c.seat[0] : bx + bw / 2;
  return {
    left: x - (anchorX - (bx - MARGIN)) * scale,
    top: floorY - (bh + MARGIN) * scale,
    width: (bw + 2 * MARGIN) * scale,
    height: (bh + 2 * MARGIN) * scale,
    /** Height of the hips above the floor, for the seat. */
    seatHeight: c.seat ? (by + bh - c.seat[1]) * scale : 0,
  };
}

const Figure: React.FC<{ c: Character; face: string; width: number; height: number }> = ({ c, face, width, height }) => {
  const [bx, by, bw, bh] = c.box;
  return (
    <Peep
      body={c.body as Body}
      face={face as FaceType}
      hair={c.hair as HairType}
      facialHair={c.facial_hair as FacialHairType}
      accessory={c.accessory as AccessoryType}
      viewBox={{ x: String(bx - MARGIN), y: String(by - MARGIN), width: String(bw + 2 * MARGIN), height: String(bh + 2 * MARGIN) }}
      style={{ width, height, display: "block" }}
      strokeColor={INK}
      backgroundColor="#ffffff"
    />
  );
};

// Mouth: loudness (RMS) of the voice over 0.1 s windows. Measured on the VoiceTut lines: 0.03 to 0.26
// while speaking, under 0.003 in silences; above 0.08 the mouth opens on the loud syllables and closes
// in between, about ten changes per second.
const MOUTH_WINDOW = 0.1;
const MOUTH_OPEN_RMS = 0.08;

function loudness(data: AudioData, start: number): number {
  const wave = data.channelWaveforms[0];
  const from = Math.max(0, Math.floor(start * data.sampleRate));
  const to = Math.min(wave.length, from + Math.floor(MOUTH_WINDOW * data.sampleRate));
  let sum = 0;
  for (let i = from; i < to; i++) sum += wave[i] * wave[i];
  return to > from ? Math.sqrt(sum / (to - from)) : 0;
}

/** Voice level of the scene's audio at this frame picks the closed- or open-mouth face. */
const TalkingFigure: React.FC<{ c: Character; audio: string; width: number; height: number }> = ({ c, audio, width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const data = useAudioData(staticFile(audio));
  const step = Math.max(1, Math.round(fps * MOUTH_WINDOW));
  const open = data !== null && loudness(data, (frame - (frame % step)) / fps) > MOUTH_OPEN_RMS;
  return <Figure c={c} face={open ? c.face_open : c.face} width={width} height={height} />;
};

/** The character, with a slow breathing motion so a still pose does not look frozen. */
export const CharacterView: React.FC<{
  c: Character;
  x: number;
  floorY: number;
  scale: number;
  audio: string | null;
}> = ({ c, x, floorY, scale, audio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = placement(c, x, floorY, scale);
  const breath = Math.sin((frame / fps) * Math.PI * 0.5);
  return (
    <div
      style={{
        position: "absolute",
        left: p.left,
        top: p.top,
        width: p.width,
        height: p.height,
        transformOrigin: "50% 100%",
        transform: `scaleY(${1 + 0.006 * breath})`,
      }}
    >
      {c.talking && audio ? (
        <TalkingFigure c={c} audio={audio} width={p.width} height={p.height} />
      ) : (
        <Figure c={c} face={c.face} width={p.width} height={p.height} />
      )}
    </div>
  );
};
