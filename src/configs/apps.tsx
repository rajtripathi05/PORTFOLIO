import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export type AppId =
  | "about"
  | "experience"
  | "projects"
  | "achievements"
  | "skills"
  | "resume"
  | "contact"
  | "safari"
  | "assistant"
  | "terminal";

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
  /** Short description for Spotlight and Launchpad. */
  description: string;
  icon: IconSpec;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  component: LazyExoticComponent<ComponentType>;
  /** Rendered as a Siri-style floating panel instead of a normal window. */
  floating?: boolean;
}

// Each app is code-split, so the first load only ships the desktop shell.
export const apps: AppDef[] = [
  {
    id: "about",
    title: "About Me",
    description: "Summary, education and contact",
    icon: {
      glyph: "i-ph:user-fill",
      tile: "tile-about"
    },
    width: 780,
    height: 600,
    component: lazy(() => import("~/apps/AboutMe"))
  },
  {
    id: "projects",
    title: "Projects",
    description: "Live sites and case studies",
    icon: {
      glyph: "i-ph:folder-simple-fill",
      tile: "tile-projects"
    },
    width: 960,
    height: 620,
    minWidth: 360,
    component: lazy(() => import("~/apps/Projects"))
  },
  {
    id: "experience",
    title: "Experience",
    description: "Roles, dates and responsibilities",
    icon: {
      glyph: "i-ph:briefcase-fill",
      tile: "tile-experience"
    },
    width: 780,
    height: 640,
    component: lazy(() => import("~/apps/Experience"))
  },
  {
    id: "achievements",
    title: "Achievements",
    description: "Hackathon wins and awards, with photos",
    icon: {
      glyph: "i-ph:trophy-fill",
      tile: "tile-achievements"
    },
    width: 1000,
    height: 700,
    component: lazy(() => import("~/apps/Achievements"))
  },
  {
    id: "skills",
    title: "Skills",
    description: "Technical skills by category",
    icon: {
      glyph: "i-ph:stack-fill",
      tile: "tile-skills"
    },
    width: 760,
    height: 580,
    component: lazy(() => import("~/apps/Skills"))
  },
  {
    id: "resume",
    title: "Resume",
    description: "View or download the PDF",
    icon: {
      glyph: "i-ph:file-text-fill",
      tile: "tile-resume",
      ink: "text-[var(--icon-resume-ink)]"
    },
    width: 840,
    height: 760,
    component: lazy(() => import("~/apps/Resume"))
  },
  {
    id: "contact",
    title: "Contact",
    description: "Email, phone, LinkedIn and GitHub",
    icon: {
      glyph: "i-ph:envelope-simple-fill",
      tile: "tile-contact"
    },
    width: 640,
    height: 680,
    component: lazy(() => import("~/apps/Contact"))
  },
  {
    id: "safari",
    title: "Safari",
    description: "Browse Raj's live project sites",
    icon: {
      glyph: "i-ph:compass-fill",
      tile: "tile-safari",
      ink: "text-[var(--icon-safari-ink)]"
    },
    width: 1120,
    height: 760,
    minWidth: 380,
    component: lazy(() => import("~/apps/Safari"))
  },
  {
    id: "assistant",
    title: "Ask Raj's AI",
    description: "Ask questions about Raj's work",
    icon: {
      glyph: "i-ph:sparkle-fill",
      tile: "tile-ai"
    },
    width: 420,
    height: 640,
    floating: true,
    component: lazy(() => import("~/apps/Assistant"))
  },
  {
    id: "terminal",
    title: "Terminal",
    description: "Explore the portfolio from a command line",
    icon: {
      glyph: "i-ph:terminal-window-fill",
      tile: "tile-terminal"
    },
    width: 760,
    height: 480,
    component: lazy(() => import("~/apps/Terminal"))
  }
];

export const getApp = (id: AppId): AppDef => {
  const app = apps.find((a) => a.id === id);
  if (!app) throw new TypeError(`App ${id} is not registered.`);
  return app;
};

export const launchpadIcon: IconSpec = {
  glyph: "i-ph:squares-four-fill",
  tile: "tile-launchpad"
};
