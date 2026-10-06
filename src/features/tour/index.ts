import { create } from "zustand";

/** The 30-second guided tour (Projects → Achievements → Ask my AI → Resume). */
export const useTour = create<{ active: boolean }>(() => ({ active: false }));

export const startTour = (): void => useTour.setState({ active: true });
export const stopTour = (): void => useTour.setState({ active: false });

export { default as TourLayer } from "./TourLayer";
