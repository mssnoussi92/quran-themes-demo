import { Composition, Still } from "remotion";
import { BACKGROUND_SHEET, BackgroundSheet } from "./BackgroundSheet";
import { CharacterSheet, sheetMetadata } from "./CharacterSheet";
import { calculateMetadata } from "./data";
import type { VideoProps } from "./data";
import { FORMATS, FPS } from "./formats";
import { Thumbnail, THUMBNAIL_SIZE, thumbnailMetadata } from "./Thumbnail";
import type { ThumbnailProps } from "./Thumbnail";
import { StyleLab } from "./styles/StyleLab";
import type { StyleLabProps } from "./styles/StyleLab";
import { EpisodeVideo } from "./Video";
import { TRIAL_FPS, Trial, trialMetadata } from "./trial/Trial";
import type { TrialProps } from "./trial/Trial";
import { THUMB, TrialCover, TrialThumb, coverMetadata, thumbMetadata } from "./trial/Cover";
import type { CoverProps, ThumbProps } from "./trial/Cover";
import { Film, FilmTall, filmMetadata } from "./trial/Film";
import type { FilmProps } from "./trial/Film";

// One composition per format, both fed by the same episode script.
// Pick another episode or reel with --props, e.g. --props='{"episode":"dua","reel":"dua-01"}'.
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Reel916"
      component={EpisodeVideo}
      width={FORMATS.reel.width}
      height={FORMATS.reel.height}
      fps={FPS}
      durationInFrames={1}
      defaultProps={{ episode: "dua", reel: "dua-01", format: "reel", data: null } satisfies VideoProps}
      calculateMetadata={calculateMetadata}
    />
    <Composition
      id="Episode169"
      component={EpisodeVideo}
      width={FORMATS.episode.width}
      height={FORMATS.episode.height}
      fps={FPS}
      durationInFrames={1}
      defaultProps={{ episode: "dua", reel: null, format: "episode", data: null } satisfies VideoProps}
      calculateMetadata={calculateMetadata}
    />
    <Still id="CharacterSheet" component={CharacterSheet} width={1920} height={1080} defaultProps={{ data: null }} calculateMetadata={sheetMetadata} />
    {/* A composition rather than a still: the backgrounds move (waves, the bird's peck), pick a frame. */}
    <Composition id="BackgroundSheet" component={BackgroundSheet} fps={FPS} durationInFrames={90} {...BACKGROUND_SHEET} />
    {/* Style lab (2026-11-09): one shot of the cave in one style, for the owner to compare styles. */}
    <Composition id="StyleLab" component={StyleLab} fps={FPS} durationInFrames={240} width={1080} height={1920}
      defaultProps={{ style: "paper", shot: "office" } satisfies StyleLabProps} />
    {/* Trial short of 2026-11-11 (docs/retention.md): filmed sea, drawn silhouette, the verse over the scene.
        Session only (tools/trial/prepare.py). */}
    <Composition id="Trial916" component={Trial} fps={TRIAL_FPS} durationInFrames={1} width={1080} height={1920}
      defaultProps={{ trial: "boat", voice: "D", data: null } satisfies TrialProps} calculateMetadata={trialMetadata} />
    {/* Covers of the trial videos, proposed: one 9:16 cover per short, the 16:9 thumbnail of the long film. Their
        clip is a video: 60 frames so that the cover is taken a moment into it (--frame=45). */}
    <Composition id="TrialCover916" component={TrialCover} fps={TRIAL_FPS} durationInFrames={60} width={1080} height={1920}
      defaultProps={{ trial: "boat", voice: "X", data: null } satisfies CoverProps} calculateMetadata={coverMetadata} />
    {/* The long film of the trial (content/trial/film.yaml), 16:9, built on the three shorts. */}
    <Composition id="TrialFilm169" component={Film} fps={TRIAL_FPS} durationInFrames={1} width={1920} height={1080}
      defaultProps={{ film: "film", voice: "D", data: null } satisfies FilmProps} calculateMetadata={filmMetadata} />
    {/* The same film in 9:16, laid out as its shorts are: for the platforms whose player is vertical. */}
    <Composition id="TrialFilm916" component={FilmTall} fps={TRIAL_FPS} durationInFrames={1} width={1080} height={1920}
      defaultProps={{ film: "film", voice: "D", data: null } satisfies FilmProps} calculateMetadata={filmMetadata} />
    <Composition id="TrialThumb169" component={TrialThumb} fps={TRIAL_FPS} durationInFrames={60} width={THUMB.width} height={THUMB.height}
      defaultProps={{ film: "film", voice: "X", data: null, panels: null } satisfies ThumbProps} calculateMetadata={thumbMetadata} />
    <Still
      id="Thumbnail169"
      component={Thumbnail}
      width={THUMBNAIL_SIZE.width}
      height={THUMBNAIL_SIZE.height}
      defaultProps={{ episode: "dua", layout: null, data: null } satisfies ThumbnailProps}
      calculateMetadata={thumbnailMetadata}
    />
  </>
);
