/** x, y, width, height — all in % of the stage. */
export type Rect = [number, number, number, number];

export type Enter =
  | "cut" // appears instantly
  | "pop" // collage tile: fades and scales in out of a blur
  | "blurIn" // full photo: arrives with motion blur and a quick zoom
  | "strip" // thin strip: opens from its middle
  | "stripes" // vertical scan-line dissolve
  | "spot"; // soft spotlight that grows out of the dark

export type Layer = {
  /** Index into the montage's `photos`. -1 = plain black (the dark behind a spotlight). */
  photo: number;
  /** Time in seconds (of the music) when it appears. */
  at: number;
  /** Where it sits. Default: the whole stage. */
  rect?: Rect;
  enter?: Enter;
  /** Seconds the entrance takes. */
  dur?: number;
  /** Blur direction for `blurIn`. */
  dir?: "x" | "y";
  /** Scale it starts from for `blurIn`. */
  from?: number;
  /** Extra zoom of the photo inside its frame (> 1 crops closer). */
  zoom?: number;
  /** Overrides the photo's own focus point (% of the photo). */
  focus?: [number, number];
  /** The tile is a window onto a stage-sized photo instead of a crop of its own. */
  win?: boolean;
  /** Colour saturation 0..1 (1 = normal). */
  sat?: number;
  /** [start, end] seconds in which the tile grows to fill the whole stage. */
  grow?: [number, number];
  /** Disappears at this time (default: stays, later layers cover it). */
  until?: number;
  /** Slow zoom per second while it is on screen. */
  drift?: number;
  /** For `spot`: centre and start/end radii (% of the stage). */
  spot?: { cx: number; cy: number; r0: [number, number]; r1: [number, number] };
};

export type PhotoSlot = {
  src: string;
  /** Where the subject is in the photo, in %. Crops stay centred on this point. */
  focus: [number, number];
};

export type MontageSpec = {
  id: string;
  /** Length of the animation in seconds. */
  duration: number;
  /** The music file and the moment it is cut / faded out. */
  audio: string;
  audioEnd: number;
  photos: PhotoSlot[];
  layers: Layer[];
};
