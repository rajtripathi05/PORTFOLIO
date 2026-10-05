/**
 * Scripted fallback for "Ask Raj's AI": used when the Netlify Function is
 * unavailable, the API key is missing, or a request fails. Every answer is
 * assembled from portfolio.ts — nothing is invented.
 */
import { achievementTitle, portfolio } from "./portfolio";
import type { AssistantAction } from "./assistant";

export interface OfflineAnswer {
  text: string;
  actions: AssistantAction[];
}

const p = portfolio;
const open = (app: AssistantAction["app"], id?: string): AssistantAction => ({
  action: "open_app",
  app,
  ...(id && { id })
});

const projectAnswer = (id: string): OfflineAnswer => {
  const pr = p.projects.find((x) => x.id === id)!;
  return {
    text:
      `**${pr.title}**${pr.descriptor ? ` — ${pr.descriptor}` : ""}\n\n` +
      pr.bullets.map((b) => `- ${b}`).join("\n") +
      (pr.url ? `\n\nLive site: ${pr.url}` : ""),
    actions: [open("projects", id)]
  };
};

const experienceAnswer = (id: string): OfflineAnswer => {
  const e = p.experience.find((x) => x.id === id)!;
  return {
    text:
      `**${e.role} | ${e.org}** — ${e.dates}${e.location ? ` | ${e.location}` : ""}\n` +
      (e.tagline ? `${e.tagline}\n` : "") +
      "\n" +
      e.bullets.map((b) => `- ${b}`).join("\n"),
    actions: [open("experience")]
  };
};

interface Rule {
  test: RegExp;
  answer: () => OfflineAnswer;
}

const rules: Rule[] = [
  { test: /\bnsu\b|plant cockpit/i, answer: () => projectAnswer("nsu") },
  { test: /tbdos|turbine|boiler|dispatch|steam/i, answer: () => projectAnswer("tbdos") },
  { test: /safety|hse|rca|bbs|compliance|training portal/i, answer: () => projectAnswer("igl-safety") },
  { test: /acg|pharma/i, answer: () => projectAnswer("acg") },
  { test: /fmcg|blueprint|use cases?/i, answer: () => projectAnswer("fmcg") },
  { test: /sentiment|stock|roberta|lstm|financ/i, answer: () => projectAnswer("financial") },
  { test: /india glycols|\bigl\b|evangelist|kashipur|recent(ly)? (role|job|work)|current/i, answer: () => experienceAnswer("india-glycols") },
  { test: /meshcraft|startup|founder|ceo|fund(ing|ed)?|pre-seed|pashu/i, answer: () => experienceAnswer("meshcraft") },
  { test: /godavari|computer vision|impurity/i, answer: () => experienceAnswer("godavari") },
  { test: /stallion|campaign/i, answer: () => experienceAnswer("stallion") },
  { test: /team vision|ar\/?vr|immersive/i, answer: () => experienceAnswer("team-vision") },
  {
    test: /won|win|award|prize|hackathon|achievement|competition/i,
    answer: () => ({
      text:
        "Raj's achievements:\n\n" +
        p.achievements
          .map((a) => `- **${achievementTitle(a)}${a.prize ? ` | ${a.prize}` : ""}** — ${a.description}`)
          .join("\n"),
      actions: [open("achievements")]
    })
  },
  {
    test: /project|built|portfolio work|best|show me/i,
    answer: () => ({
      text:
        "Here are Raj's featured projects:\n\n" +
        p.projects
          .map((pr) => `- **${pr.title}**${pr.descriptor ? ` — ${pr.descriptor}` : ""}`)
          .join("\n"),
      actions: [open("projects", "nsu"), open("projects", "tbdos"), open("projects")]
    })
  },
  {
    test: /skill|tech|stack|tools?|python|sql|power bi|language/i,
    answer: () => ({
      text:
        "Raj's technical skills:\n\n" + p.skills.map((s) => `- **${s.name}:** ${s.items.join(", ")}`).join("\n"),
      actions: [open("skills")]
    })
  },
  {
    test: /educat|college|degree|cgpa|gpa|b\.?tech|university|somaiya|study|studied/i,
    answer: () => ({
      text:
        `**${p.education.degree}** (${p.education.honours})\n${p.education.school}\n\n` +
        p.education.scores.map((s) => `- ${s.label}: ${s.value}`).join("\n"),
      actions: [open("about")]
    })
  },
  {
    test: /contact|email|e-mail|phone|call|reach|linkedin|github|hire|connect/i,
    answer: () => ({
      text:
        `You can reach Raj at:\n\n- Email: ${p.identity.email}\n- Phone: ${p.identity.phone}\n` +
        `- LinkedIn: ${p.identity.linkedin}\n- GitHub: ${p.identity.github}`,
      actions: [open("contact")]
    })
  },
  {
    test: /resume|cv|pdf/i,
    answer: () => ({
      text: "Raj's resume is available as a PDF in the Resume app, where you can view or download it.",
      actions: [open("resume")]
    })
  },
  {
    test: /experience|work(ed)?|job|role|career|background/i,
    answer: () => ({
      text:
        "Raj's experience, most recent first:\n\n" +
        p.experience.map((e) => `- **${e.role} | ${e.org}** — ${e.dates}`).join("\n"),
      actions: [open("experience")]
    })
  },
  {
    test: /who is|about raj|tell me about|summary|introduce|hello|hi\b|hey/i,
    answer: () => ({ text: p.summary, actions: [open("about")] })
  }
];

export const offlineAnswer = (question: string): OfflineAnswer => {
  const rule = rules.find((r) => r.test.test(question));
  if (rule) return rule.answer();
  return {
    text:
      "I can only answer questions about Raj's experience, projects, achievements, skills, education and contact details — " +
      `and that doesn't seem to be covered in his portfolio. For anything else, you can email him at ${p.identity.email}.`,
    actions: [open("contact")]
  };
};
