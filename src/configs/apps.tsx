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
  /** Tile background classes. */
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
}

// Each app is code-split, so the first load only ships the desktop shell.
export const apps: AppDef[] = [
  {
    id: "about",
    title: "About Me",
    description: "Summary, education and contact",
    icon: {
      glyph: "i-ph:user-fill",
      tile: "bg-gradient-to-b from-[#5b8def] to-[#2f5fd0]"
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
      tile: "bg-gradient-to-b from-[#6cc4f5] to-[#2e8fd8]"
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
      tile: "bg-gradient-to-b from-[#f2b45a] to-[#d27d1e]"
    },
    width: 780,
    height: 640,
    component: lazy(() => import("~/apps/Experience"))
  },
  {
    id: "skills",
    title: "Skills",
    description: "Technical skills by category",
    icon: {
      glyph: "i-ph:stack-fill",
      tile: "bg-gradient-to-b from-[#4fd1b5] to-[#1c9c86]"
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
      tile: "bg-gradient-to-b from-white to-[#e4e6eb]",
      ink: "text-[#2f5fd0]"
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
      tile: "bg-gradient-to-b from-[#59a6ff] to-[#1f6fe5]"
    },
    width: 640,
    height: 680,
    component: lazy(() => import("~/apps/Contact"))
  }
];

export const getApp = (id: AppId): AppDef => {
  const app = apps.find((a) => a.id === id);
  if (!app) throw new TypeError(`App ${id} is not registered.`);
  return app;
};

export const launchpadIcon: IconSpec = {
  glyph: "i-ph:squares-four-fill",
  tile: "bg-gradient-to-b from-[#9aa3b2] to-[#5f6878]"
};
