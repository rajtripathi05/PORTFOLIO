/**
 * Shared contracts for the whole site.
 *
 * The data layer (src/data), the three device shells (src/shells), the sensory
 * engine (src/sensory) and the features (src/features) are built independently
 * and meet only through the types and signatures in this file.
 */

/* ======================================================================== apps */

/** Every app. Each is one component in src/apps, shared by all three shells. */
export type AppId =
  | "about"
  | "projects"
  | "achievements"
  | "experience"
  | "research"
  | "leadership"
  | "certifications"
  | "skills"
  | "resume"
  | "contact"
  | "safari"
  | "assistant"
  | "terminal"
  | "settings";

/**
 * Optional parameters for opening an app. Deep links (`/?open=projects&id=nsu`),
 * Spotlight results, AI actions and the tour all use this shape.
 */
export interface AppParams {
  /** Item to select or scroll to: a project, achievement, role or certification id. */
  id?: string;
  /** Pre-filled text: the Skills filter, or a question for the AI. */
  q?: string;
  /** Safari: page to load, and the label shown for it. */
  url?: string;
  label?: string;
}

/** Opens (or brings forward) an app in whichever shell is active. */
export type OpenApp = (id: AppId, params?: AppParams) => void;

/* ====================================================================== shells */

export type ShellKind = "desktop" | "tablet" | "phone";

/** The "View as" override (View menu / Settings), saved in localStorage. */
export type ViewAs = "auto" | ShellKind;

/** An in-app back step (detail → list) on the phone and tablet shells. */
export interface BackStep {
  /** Shown in the shell's back button: "Projects" → "‹ Projects". */
  label: string;
  onBack: () => void;
}

/** What every shell gives the app it hosts (desktop window, tablet page or phone sheet). */
export interface AppHost {
  id: AppId;
  shell: ShellKind;
  /** Current content width in px. */
  width: number;
  params?: AppParams;
  /** Changes on every openApp call, so apps can re-apply `params`. */
  nonce: number;
  /** Closes this app. */
  close: () => void;
  /**
   * Phone and tablet only: registers an in-app back step. While it is registered, the
   * shell's back button and the browser/Android back button call `onBack` instead of
   * closing the app. Returns an unregister function. Apps use `useAppBack` (src/shells/host.tsx).
   */
  pushBack?: (step: BackStep) => () => void;
}

/* ===================================================================== sensory */

/** Synthesized UI sounds (Web Audio API, no audio files). */
export type SoundName =
  | "boot"
  | "tap"
  | "open"
  | "close"
  | "minimize"
  | "dockHover"
  | "toggle"
  | "notify"
  | "error"
  | "swipe"
  | "spotlight"
  | "success"
  | "typing";

/** navigator.vibrate patterns. */
export type HapticName = "light" | "medium" | "heavy" | "success" | "warning" | "selection";

/**
 * Names passed to `feedback()`. Each fires its sound, haptic and visual response
 * together; sound and haptics are never the only feedback.
 */
export type FeedbackName = SoundName | "selection";

export interface FeedbackOptions {
  /** Element that shows the visual part (press settle, success glow, error shake). */
  el?: Element | null;
}

/** `feedback(name, opts?)` lives in src/sensory/feedback.ts. */
export type Feedback = (name: FeedbackName, opts?: FeedbackOptions) => void;

/** Visitor sound and haptics preferences (src/sensory/settings.ts). */
export interface SensoryPrefs {
  /** Master mute: the speaker toggle in the menu bar, status bar and welcome card. */
  muted: boolean;
  /** Master volume 0–1 (default 0.3). */
  volume: number;
  /** UI sounds (default on; off under reduced motion). */
  ui: boolean;
  /** Generative ambient pad: off on every load, opt-in, never remembered. */
  ambient: boolean;
  /** Ambient volume 0–1. */
  ambientVolume: number;
  /** Keyboard typing ticks (default off). */
  typing: boolean;
  /** Vibration feedback (default on for touch devices). */
  haptics: boolean;
}

/* ===================================================================== content */

/** A phrase inside a sentence that becomes a link (rendered by RichText). */
export interface InlineLink {
  text: string;
  url: string;
}

/** A standalone link button. URLs starting with "TODO_" render as "coming soon". */
export interface NamedLink {
  label: string;
  url: string;
}

export interface Identity {
  name: string;
  firstName: string;
  headline: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  photo: string;
  resumePdf: string;
  /** Public site URL; "TODO_SITE_URL" until known (use window.location.origin at runtime). */
  siteUrl: string;
}

export interface Education {
  degree: string;
  honours: string;
  school: string;
  scores: { label: string; value: string }[];
}

/**
 * One role. Experience, internships, research and leadership all use this shape,
 * so one row/card/detail component renders every kind of role.
 */
export interface Role {
  id: string;
  role: string;
  org?: string;
  orgUrl?: string;
  dates: string;
  location?: string;
  /** Italic context lines under the heading. */
  taglines?: string[];
  bullets: string[];
  /** Phrases inside bullets that become links. */
  inlineLinks?: InlineLink[];
  /** Link buttons, e.g. "View VR project gallery ↗". */
  links?: NamedLink[];
  /** Tag chips, e.g. "Workshop conducted — Blender (25 participants)". */
  tags?: string[];
  /** A named sub-list, e.g. the Enactus "Projects supported". */
  highlights?: { heading: string; items: { name: string; description: string }[] };
}

export interface ResearchRole extends Role {
  /** Research topic, shown as an italic subtitle. */
  topic: string;
  /** "TODO_…" until known: hidden in the UI and never mentioned by the AI. */
  paperTitle: string;
  venue: string;
  paperUrl: string;
}

export interface Copyright {
  id: string;
  title: string;
  office: string;
  workClass: string;
  regNo: string;
  dated: string;
  diaryNo: string;
  applicant: string;
  /** Always "Co-author": never imply sole authorship, never list other names. */
  role: string;
  coAuthors: string;
  certificatePdf: string;
  /** Page-1 WebP thumbnail generated by scripts/build-achievements.mjs. */
  certificateThumb: string;
}

export interface Project {
  id: string;
  title: string;
  descriptor?: string;
  /** Main live site. Omit when there is no live link. */
  url?: string;
  /** Separately clickable sub-links (e.g. the safety ecosystem portals). */
  subLinks?: NamedLink[];
  bullets: string[];
  /** Tag chips; each must be a phrase from this project's own text (scripts/check-content.mjs). */
  tags?: string[];
  /** Shown as a tag next to the chips, e.g. "Team project". */
  team?: string;
}

export type TeamSize = "Solo" | "Team of 2" | "Team of 3" | "Team of 4";

export interface Achievement {
  id: string;
  name: string;
  result?: string;
  prize?: string;
  description: string;
  teamSize: TeamSize;
  links?: NamedLink[];
  /** Folder name under media-src/achievements/ (and public/achievements/). */
  mediaFolder?: string;
}

export interface Certification {
  id: string;
  course: string;
  issuer: string;
  issued: string;
  credentialId: string;
  /** https://www.coursera.org/account/accomplishments/records/<credentialId> */
  verifyUrl: string;
  /** Shown in the card detail only. */
  expires?: string;
}

export interface SkillGroup {
  name: string;
  items: string[];
}

/** A headline number for the About Me stats row; `value` must come from the content. */
export interface Stat {
  value: string;
  label: string;
}

export interface PortfolioData {
  identity: Identity;
  summary: string;
  education: Education;
  /** Most recent first. */
  experience: Role[];
  /** Shown in a collapsed section below Experience. */
  internships: Role[];
  research: ResearchRole[];
  copyrights: Copyright[];
  leadership: Role[];
  /** Featured order. */
  projects: Project[];
  achievements: Achievement[];
  /** Heading for media folders that don't match any achievement. */
  otherHighlightsTitle: string;
  certifications: Certification[];
  /** "10 certifications · UX/Design · Project Management · AI Ethics" */
  certificationsSummary: string;
  skills: SkillGroup[];
  stats: Stat[];
  driveArchiveUrl: string;
}

/* ==================================================================== features */

/** A structured action returned by the AI; the chat UI renders it as a button. */
export interface AssistantAction {
  action: "open_app";
  app: AppId;
  id?: string;
}

export interface ShareTarget {
  title: string;
  text?: string;
  url: string;
}

/** Web Share API on mobile, copy-link fallback elsewhere (src/features/share.ts). */
export type ShareResult = "shared" | "copied" | "cancelled" | "failed";
