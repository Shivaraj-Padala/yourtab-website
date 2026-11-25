// The Face's geometry, in its 1000 × 640 drawing box (shared by FaceSvg and FaceSection).
export const EYES = [
  { cx: 344, cy: 326 },
  { cx: 656, cy: 320 },
]
export const RX = 132
export const RY = 124
export const BROW = 'M -108 16 C -66 -20 30 -30 108 -8 C 60 -15 -30 -8 -108 16 Z'
export const BROWS = [
  { x: 332, y: 150 },
  { x: 668, y: 144 },
]
/** The upper lid in local coordinates: a tall shape whose lower edge is the lid line. */
export const LID = 'M -175 -320 H 175 V 22 Q 0 -32 -175 22 Z'
export const LASH = 'M -175 22 Q 0 -32 175 22'
export const LID_OPEN = -152
export const LID_SHUT = 140

export const MOUTHS = {
  smile: 'M 418 482 Q 500 548 582 482 Q 500 520 418 482 Z',
  grin: 'M 400 470 Q 500 600 600 470 Q 500 510 400 470 Z',
  chomp: 'M 444 470 Q 500 590 556 470 Q 500 430 444 470 Z',
  sleepy: 'M 462 500 Q 500 520 538 500 Q 500 510 462 500 Z',
}
