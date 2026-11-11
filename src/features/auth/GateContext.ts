import { createContext, useContext } from "react";

/**
 * Where the entrance gate is right now.
 * checking  - asking the server if the visitor is already signed in
 * locked    - gate closed, waiting for the password
 * unlocking - correct password: the camera walks up to the door and it opens
 * opening   - the screen is full of light and the site behind it has started running
 * open      - the entrance has faded away completely
 */
export type GatePhase = "checking" | "locked" | "unlocking" | "opening" | "open";

export const GateContext = createContext<GatePhase>("open");

export function useGatePhase(): GatePhase {
  return useContext(GateContext);
}
