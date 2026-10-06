import { apps, type AppId } from "~/configs/apps";
import type { AppParams } from "~/types";
import { achievementTitle, portfolio } from "~/data/portfolio";

export type SearchGroup = "Apps" | "Projects" | "Achievements" | "Experience" | "Research & IP" | "Leadership" | "Certifications" | "Skills";

export interface SearchItem {
  key: string;
  group: SearchGroup;
  title: string;
  subtitle?: string;
  /** Extra text matched with lower weight (bullets, descriptions). */
  body?: string;
  app: AppId;
  params?: AppParams;
  icon: string;
}

const skillGroups = new Map<string, string[]>();
portfolio.skills.forEach((g) =>
  g.items.forEach((item) => skillGroups.set(item, [...(skillGroups.get(item) ?? []), g.name]))
);

export const searchIndex: SearchItem[] = [
  ...apps.map((a) => ({
    key: `app-${a.id}`,
    group: "Apps" as const,
    title: a.title,
    subtitle: a.description,
    app: a.id,
    icon: a.icon.glyph
  })),
  ...portfolio.projects.map((p) => ({
    key: `project-${p.id}`,
    group: "Projects" as const,
    title: p.title,
    subtitle: p.descriptor,
    body: p.bullets.join(" "),
    app: "projects" as const,
    params: { id: p.id },
    icon: "i-ph:folder-simple-fill"
  })),
  ...portfolio.achievements.map((a) => ({
    key: `achievement-${a.id}`,
    group: "Achievements" as const,
    title: achievementTitle(a),
    subtitle: [a.prize, a.teamSize].filter(Boolean).join(" · "),
    body: a.description,
    app: "achievements" as const,
    params: { id: a.id },
    icon: "i-ph:trophy-fill"
  })),
  ...portfolio.experience.map((e) => ({
    key: `experience-${e.id}`,
    group: "Experience" as const,
    title: `${e.role} — ${e.org}`,
    subtitle: e.dates,
    body: [...(e.taglines ?? []), ...e.bullets].filter(Boolean).join(" "),
    app: "experience" as const,
    params: { id: e.id },
    icon: "i-ph:briefcase-fill"
  })),
  ...portfolio.internships.map((e) => ({
    key: `internship-${e.id}`,
    group: "Experience" as const,
    title: `${e.role} — ${e.org}`,
    subtitle: e.dates,
    body: [...(e.taglines ?? []), ...e.bullets].join(" "),
    app: "experience" as const,
    params: { id: e.id },
    icon: "i-ph:briefcase-fill"
  })),
  ...portfolio.research.map((r) => ({
    key: `research-${r.id}`,
    group: "Research & IP" as const,
    title: r.role + (r.org ? ` — ${r.org}` : ""),
    subtitle: r.topic,
    body: r.bullets.join(" "),
    app: "research" as const,
    params: { id: r.id },
    icon: "i-ph:flask-fill"
  })),
  ...portfolio.copyrights.map((c) => ({
    key: `copyright-${c.id}`,
    group: "Research & IP" as const,
    title: c.title,
    subtitle: `Copyright · ${c.regNo}`,
    body: [c.workClass, c.office].join(" "),
    app: "research" as const,
    params: { id: c.id },
    icon: "i-ph:certificate-fill"
  })),
  ...portfolio.leadership.map((r) => ({
    key: `leadership-${r.id}`,
    group: "Leadership" as const,
    title: r.role + (r.org ? ` — ${r.org}` : ""),
    subtitle: r.dates,
    body: [...(r.taglines ?? []), ...r.bullets].join(" "),
    app: "leadership" as const,
    params: { id: r.id },
    icon: "i-ph:users-three-fill"
  })),
  ...portfolio.certifications.map((c) => ({
    key: `certification-${c.id}`,
    group: "Certifications" as const,
    title: c.course,
    subtitle: `${c.issuer} · ${c.issued}`,
    app: "certifications" as const,
    params: { id: c.id },
    icon: "i-ph:seal-check-fill"
  })),
  ...[...skillGroups.entries()].map(([skill, groups]) => ({
    key: `skill-${skill}`,
    group: "Skills" as const,
    title: skill.charAt(0).toUpperCase() + skill.slice(1),
    subtitle: groups.join(", "),
    app: "skills" as const,
    params: { q: skill },
    icon: "i-ph:stack-fill"
  }))
];

export const suggestedKeys = [
  "project-nsu",
  "app-projects",
  "app-achievements",
  "app-resume",
  "app-contact",
  "app-assistant"
];

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s]/gu, " ");

/** Subsequence match with bonuses for word starts and contiguous runs. 0 = no match. */
const fuzzy = (query: string, text: string): number => {
  let score = 0;
  let ti = 0;
  let run = 0;
  for (const ch of query) {
    if (ch === " ") continue;
    const at = text.indexOf(ch, ti);
    if (at === -1) return 0;
    run = at === ti ? run + 1 : 0;
    score += 1 + run * 2 + (at === 0 || text[at - 1] === " " ? 3 : 0);
    ti = at + 1;
  }
  return score / (1 + (text.length - query.length) * 0.01);
};

export const search = (raw: string): SearchItem[] => {
  const q = norm(raw).trim();
  if (!q) return [];
  const words = q.split(/\s+/);
  const scored = searchIndex
    .map((item) => {
      const title = norm(item.title);
      const sub = norm(item.subtitle ?? "");
      const body = norm(item.body ?? "");
      let s = 0;
      // Exact substring hits rank highest; then fuzzy on the title; body words last.
      if (title.includes(q)) s += 100 - title.indexOf(q);
      else s += fuzzy(q, title) * 3;
      if (sub.includes(q)) s += 30;
      if (words.every((w) => body.includes(w))) s += 20;
      if (item.group === "Apps") s *= 1.2;
      return { item, s };
    })
    .filter((x) => x.s > 8);
  return scored.sort((a, b) => b.s - a.s).map((x) => x.item);
};

export const groupOrder: SearchGroup[] = ["Apps", "Projects", "Achievements", "Experience", "Research & IP", "Leadership", "Certifications", "Skills"];
