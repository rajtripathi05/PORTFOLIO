const coarsePointer =
  typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches;

/** Menu bar height: 44px on touch screens (full-size tap targets), 32px otherwise. */
export const MENU_BAR_HEIGHT = coarsePointer ? 44 : 32;
/** Space kept free at the bottom of the screen for the dock and its labels. */
export const DOCK_RESERVE = 96;
export const TITLE_BAR_HEIGHT = 36;
/** Below this width the site shows the mobile home screen instead of the desktop. */
export const MOBILE_BREAKPOINT = 768;
