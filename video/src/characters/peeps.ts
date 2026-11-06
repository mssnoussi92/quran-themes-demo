// Character kit data, shared by scripts/prepare.ts (Node) and the compositions (browser): no React here.
// Drawings: Open Peeps by Pablo Stanley (CC0), assembled by react-peeps (MIT).

/** Catalog mood -> Open Peeps face: mouth closed, and mouth open for a talking character. */
export const MOOD_FACES: Record<string, { closed: string; open: string }> = {
  calm: { closed: "Calm", open: "Explaining" },
  worried: { closed: "Concerned", open: "ConcernedFear" },
  smiling: { closed: "Smile", open: "SmileBig" },
};

/** Extent of each body used by the catalog, in Open Peeps units [x, y, width, height]: the
 * bounding box of the drawn figure (body, head, hair), measured with getBBox() in Chromium.
 * A body that is not here cannot be framed: measure it before adding it to content/characters.yaml. */
export const BODY_BOX: Record<string, [number, number, number, number]> = {
  ShirtPantsWB: [44, 65, 894, 2931],
  ShirtPantsBW: [44, 65, 894, 2931],
  BlazerPantsWB: [-75, 65, 1046, 2824],
  PointingFingerWB: [-16, 65, 1300, 2604],
  PointingFingerBW: [-15, 65, 1300, 2604],
  MediumWB: [-285, 65, 1322, 1830],
  MediumBW: [-285, 65, 1322, 1830],
  ClosedLegWB: [-2, 65, 1347, 1963],
  ClosedLegBW: [-2, 65, 1347, 1963],
  Explaining: [46, 65, 722, 1092],
};

/** How a body stands in the scene: on the floor, on a seat, or cut at the chest. */
export type BodyKind = "standing" | "sitting" | "bust";

/** Where a sitting body rests, in Open Peeps units: centre of the hips [x, y], read on a grid.
 * The scene draws a seat there, so the figure sits on something. */
export const SEAT: Record<string, [number, number]> = {
  MediumWB: [250, 1400],
  MediumBW: [250, 1400],
  ClosedLegWB: [230, 1730],
  ClosedLegBW: [230, 1730],
};
