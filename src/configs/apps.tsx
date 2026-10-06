import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { AppId } from "~/types";

export type { AppId } from "~/types";

export interface IconSpec {
  /** UnoCSS icon class for the glyph (Phosphor set). */
  glyph: string;
  /** Tile background class (gradients are defined from tokens in base.css). */
  tile: string;
  /** Glyph colour classes. */
  ink?: string;
}

export interface AppDef {
  id: AppId;
  /** Dock / window label. */
  title: string;
  /** Shorter label for home-screen grids, when the title is long. */
  shortTitle?: string;
  /** Short description for Spotlight and Launchpad. */
  description: string;
  icon: IconSpec;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  component: LazyExoticComponent<ComponentType>;
  /** Loads the code chunk (used for preloading during boot and prefetch on hover). */
  load: () => Promise<{ default: ComponentType }>;
  /** Desktop: a Siri-style floating panel. Tablet: a side panel. Phone: full screen. */
  floating?: boolean;
}

const lazyApp = (load: () => Promise<{ default: ComponentType }>) => ({ load, component: lazy(load) });

// Every app is code-split, so a shell only downloads the apps a visitor opens.
export const apps: AppDef[] = [
  {
    id: "about",
    title: "About Me",
    description: "Summary, education and quick actions",
    icon: { glyph: "i-ph:user-fill", tile: "tile-about" },
    width: 800,
    height: 720,
    ...lazyApp(() => import("~/apps/AboutMe"))
  },
  {
    id: "projects",
    title: "Projects",
    description: "Live sites and case studies",
    icon: { glyph: "i-ph:folder-simple-fill", tile: "tile-projects" },
    width: 960,
    height: 620,
    minWidth: 360,
    ...lazyApp(() => import("~/apps/Projects"))
  },
  {
    id: "achievements",
    title: "Achievements",
    description: "Hackathon wins and awards, with photos",
    icon: { glyph: "i-ph:trophy-fill", tile: "tile-achievements" },
    width: 1000,
    height: 700,
    ...lazyApp(() => import("~/apps/Achievements"))
  },
  {
    id: "experience",
    title: "Experience",
    description: "Roles, dates and internships",
    icon: { glyph: "i-ph:briefcase-fill", tile: "tile-experience" },
    width: 780,
    height: 640,
    ...lazyApp(() => import("~/apps/Experience"))
  },
  {
    id: "safari",
    title: "Safari",
    description: "Browse Raj's live project sites",
    icon: { glyph: "i-ph:compass-fill", tile: "tile-safari", ink: "text-[var(--icon-safari-ink)]" },
    width: 1120,
    height: 760,
    minWidth: 380,
    ...lazyApp(() => import("~/apps/Safari"))
  },
  {
    id: "assistant",
    title: "Ask Raj's AI",
    shortTitle: "Ask AI",
    description: "Ask questions about Raj's work",
    icon: { glyph: "i-ph:sparkle-fill", tile: "tile-ai" },
    width: 420,
    height: 640,
    floating: true,
    ...lazyApp(() => import("~/apps/Assistant"))
  },
  {
    id: "resume",
    title: "Resume",
    description: "View or download the PDF",
    icon: { glyph: "i-ph:file-text-fill", tile: "tile-resume", ink: "text-[var(--icon-resume-ink)]" },
    width: 840,
    height: 760,
    ...lazyApp(() => import("~/apps/Resume"))
  },
  {
    id: "contact",
    title: "Contact",
    description: "Email, phone, LinkedIn and GitHub",
    icon: { glyph: "i-ph:envelope-simple-fill", tile: "tile-contact" },
    width: 640,
    height: 680,
    ...lazyApp(() => import("~/apps/Contact"))
  },
  {
    id: "research",
    title: "Research",
    description: "Research role and copyright registration",
    icon: { glyph: "i-ph:microscope-fill", tile: "tile-research" },
    width: 780,
    height: 660,
    ...lazyApp(() => import("~/apps/Research"))
  },
  {
    id: "leadership",
    title: "Leadership",
    description: "Campus leadership roles",
    icon: { glyph: "i-ph:users-three-fill", tile: "tile-leadership" },
    width: 780,
    height: 660,
    ...lazyApp(() => import("~/apps/Leadership"))
  },
  {
    id: "certifications",
    title: "Certifications",
    description: "10 certifications with verify links",
    icon: { glyph: "i-ph:certificate-fill", tile: "tile-certifications" },
    width: 820,
    height: 660,
    ...lazyApp(() => import("~/apps/Certifications"))
  },
  {
    id: "skills",
    title: "Skills",
    description: "Technical skills by category",
    icon: { glyph: "i-ph:stack-fill", tile: "tile-skills" },
    width: 760,
    height: 580,
    ...lazyApp(() => import("~/apps/Skills"))
  },
  {
    id: "terminal",
    title: "Terminal",
    description: "Explore the portfolio from a command line",
    icon: { glyph: "i-ph:terminal-window-fill", tile: "tile-terminal" },
    width: 760,
    height: 480,
    ...lazyApp(() => import("~/apps/Terminal"))
  },
  {
    id: "settings",
    title: "Settings",
    description: "Theme, wallpaper, view mode, sound and haptics",
    icon: { glyph: "i-ph:gear-six-fill", tile: "tile-settings" },
    width: 680,
    height: 620,
    ...lazyApp(() => import("~/apps/Settings"))
  }
];

export const isAppId = (id: unknown): id is AppId => typeof id === "string" && apps.some((a) => a.id === id);

export const getApp = (id: AppId): AppDef => {
  const app = apps.find((a) => a.id === id);
  if (!app) throw new TypeError(`App ${id} is not registered.`);
  return app;
};

export const launchpadIcon: IconSpec = {
  glyph: "i-ph:squares-four-fill",
  tile: "tile-launchpad"
};

/** Preloads the given app chunks (default: all); reports progress 0–1. */
export const preloadApps = (onProgress?: (p: number) => void, list: AppDef[] = apps): Promise<void> => {
  let done = 0;
  return Promise.all(
    list.map((a) =>
      a.load().then(
        () => onProgress?.(++done / list.length),
        () => onProgress?.(++done / list.length)
      )
    )
  ).then(() => undefined);
};
