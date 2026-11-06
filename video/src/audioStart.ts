import { createContext } from "react";

/** Frame of the scene at which its audio starts (after the incoming transition). Elements synced to
 * the audio (recited word, talking mouth) count their time from there. */
export const AudioStart = createContext(0);
