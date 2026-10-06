/**
 * Scripted fallback for "Ask Raj's AI": used when the Netlify Function is
 * unavailable, the API key is missing, or a request fails. Every answer is
 * assembled from portfolio.ts — nothing is invented.
 */
import type { AppId, AssistantAction, Role } from "~/types";
import { achievementTitle, isTodoLink, portfolio, roleTitle } from "./portfolio";

export interface OfflineAnswer {
  text: string;
  actions: AssistantAction[];
}

const p = portfolio;
const open = (app: AppId, id?: string): AssistantAction => ({
  action: "open_app",
  app,
  ...(id && { id })
});

const list = (items: string[]) => items.map((b) => `- ${b}`).join("\n");
const heading = (r: Role) => `**${roleTitle(r)}** — ${r.dates}${r.location ? ` | ${r.location}` : ""}`;

const projectAnswer = (id: string): OfflineAnswer => {
  const pr = p.projects.find((x) => x.id === id)!;
  const links = (pr.subLinks ?? []).map((l) => `${l.label}: ${isTodoLink(l.url) ? "link coming soon" : l.url}`);
  return {
    text:
      `**${pr.title}**${pr.descriptor ? ` — ${pr.descriptor}` : ""}${pr.team ? ` (${pr.team})` : ""}\n\n` +
      list(pr.bullets) +
      (pr.url && !isTodoLink(pr.url) ? `\n\nLive site: ${pr.url}` : "") +
      (links.length ? `\n\n${list(links)}` : ""),
    actions: [open("projects", id)]
  };
};

const roleAnswer = (app: "experience" | "leadership", r: Role, extra = ""): OfflineAnswer => ({
  text:
    heading(r) +
    "\n" +
    (r.taglines?.length ? `${r.taglines.join(" ")}\n` : "") +
    "\n" +
    (r.bullets.length ? list(r.bullets) : "No further details are listed in the portfolio for this role.") +
    (r.highlights
      ? `\n\n**${r.highlights.heading}:** ${r.highlights.items.map((i) => `${i.name} (${i.description})`).join(", ")}`
      : "") +
    (r.tags?.length ? `\n\n${r.tags.join(" · ")}` : "") +
    extra,
  actions: [open(app, r.id)]
});

const role = (id: string) => [...p.experience, ...p.internships].find((r) => r.id === id)!;
const lead = (id: string) => p.leadership.find((r) => r.id === id)!;

const meshcraftAnswer = (): OfflineAnswer => {
  const site = p.projects.find((x) => x.id === "meshcraft");
  const a = roleAnswer(
    "experience",
    role("meshcraft"),
    site?.url ? `\n\nThe **${site.title}** is a team project: ${site.url}` : ""
  );
  return { ...a, actions: [open("experience", "meshcraft"), open("projects", "meshcraft")] };
};

const achievementLine = (a: (typeof p.achievements)[number]) =>
  `**${achievementTitle(a)}${a.prize ? ` | ${a.prize}` : ""}** (${a.teamSize}) — ${a.description}`;

const achievementAnswer = (id: string): OfflineAnswer => {
  const a = p.achievements.find((x) => x.id === id)!;
  return { text: achievementLine(a), actions: [open("achievements", id)] };
};

const research = p.research[0];
const copyright = p.copyrights[0];

const notInPortfolio = (): OfflineAnswer => ({
  text: `That isn't covered in Raj's portfolio. The best way to ask is to email him at ${p.identity.email}.`,
  actions: [open("contact")]
});

interface Rule {
  test: RegExp;
  answer: () => OfflineAnswer;
}

const rules: Rule[] = [
  {
    test: /availab|notice period|salary|\bctc\b|compensation|\bvisa\b|relocat|start date|open to (work|opportunit|offers?)|when can he (start|join)|expected pay/i,
    answer: notInPortfolio
  },
  {
    test: /copyright|bagasse|torrefaction|charcoal|intellectual property|\bip\b/i,
    answer: () => ({
      text:
        `Raj is a **co-author** of a registered copyright: **${copyright.title}**.\n\n` +
        list([
          `Registered with the ${copyright.office}`,
          `Class of work: ${copyright.workClass}`,
          `Registration No. ${copyright.regNo}, dated ${copyright.dated}`,
          `Diary No. ${copyright.diaryNo}`,
          `Applicant: ${copyright.applicant}`,
          `${copyright.role}, ${copyright.coAuthors}`
        ]),
      actions: [open("research", copyright.id)]
    })
  },
  {
    test: /research|paper|publication|publish|zinc|\bzno\b|nanoparticle|rice husk/i,
    answer: () => ({
      text:
        `${heading(research)}\n*${research.topic}*\n\n${list(research.bullets)}\n\n` +
        "The paper's title and venue aren't listed in the portfolio.",
      actions: [open("research", research.id), open("research", copyright.id)]
    })
  },
  { test: /\bnsu\b|plant cockpit|datadrivenplant/i, answer: () => projectAnswer("nsu") },
  { test: /tbdos|turbine|boiler|dispatch|steam/i, answer: () => projectAnswer("tbdos") },
  { test: /safety|\bhse\b|\brca\b|\bbbs\b|compliance|training portal/i, answer: () => projectAnswer("igl-safety") },
  { test: /\bacg\b|pharma/i, answer: () => projectAnswer("acg") },
  { test: /fmcg|blueprint|use cases?/i, answer: () => projectAnswer("fmcg") },
  { test: /sentiment|stock|roberta|lstm|financial/i, answer: () => projectAnswer("financial") },
  { test: /meshcraft|startup|founder|\bceo\b|pre-?seed|\bfund(ing|ed|raising)?\b|investor|pashu/i, answer: meshcraftAnswer },
  {
    test: /india glycols|\bigl\b|evangelist|kashipur|latest|most recent|current(ly)?|recent (role|job|work|position)/i,
    answer: () => roleAnswer("experience", role("india-glycols"))
  },
  { test: /godavari|computer vision|impurity/i, answer: () => roleAnswer("experience", role("godavari")) },
  { test: /stallion|campaign/i, answer: () => roleAnswer("experience", role("stallion")) },
  { test: /team vision|ar\/?vr|\bvr\b|immersive/i, answer: () => roleAnswer("experience", role("team-vision")) },
  { test: /orion|racing|motorsport/i, answer: () => roleAnswer("experience", role("orion-racing")) },
  {
    test: /\bintern(ship)?s?\b/i,
    answer: () => ({
      text: "Raj's internships:\n\n" + list(p.internships.map((r) => `${heading(r)}`)),
      actions: [open("experience", p.internships[0]?.id)]
    })
  },
  { test: /\bsig\b|game dev|blender|workshop|endless runner/i, answer: () => roleAnswer("leadership", lead("sig-gamedev")) },
  { test: /enactus|kruti|finlit|riwayat|parivartan|swagat/i, answer: () => roleAnswer("leadership", lead("enactus")) },
  { test: /somaiya voices|press release|\bpr\b/i, answer: () => roleAnswer("leadership", lead("somaiya-voices")) },
  {
    test: /leadership|leader|\bclubs?\b|council|extracurricular|campus|community/i,
    answer: () => ({
      text: "Raj's leadership roles:\n\n" + list(p.leadership.map((r) => heading(r))),
      actions: [open("leadership")]
    })
  },
  { test: /allianz|w\.?i\.?s\.?e\b|cybersecurity training/i, answer: () => achievementAnswer("allianz") },
  { test: /periscope|multi-?agent/i, answer: () => achievementAnswer("periscope") },
  { test: /isro|gmrt|cosmic|telescope|radio signal/i, answer: () => achievementAnswer("isro-gmrt") },
  { test: /genai mumbai|gen ai mumbai/i, answer: () => achievementAnswer("genai-mumbai") },
  { test: /innovator award/i, answer: () => achievementAnswer("somaiya-innovator") },
  {
    test: /\bwon\b|\bwins?\b|award|prize|hackathon|achievement|competition|recogni/i,
    answer: () => ({
      text: "Raj's achievements:\n\n" + list(p.achievements.map(achievementLine)),
      actions: [open("achievements")]
    })
  },
  {
    test: /certif|coursera|course|calarts|california institute|google|michigan|packt|\bux\b/i,
    answer: () => ({
      text:
        `${p.certificationsSummary}\n\n` +
        list(p.certifications.map((c) => `**${c.course}** — ${c.issuer}, ${c.issued}`)),
      actions: [open("certifications")]
    })
  },
  {
    test: /project|built|portfolio work|best|show me|live site|demo|case stud/i,
    answer: () => ({
      text:
        "Here are Raj's featured projects:\n\n" +
        list(
          p.projects.map(
            (pr) => `**${pr.title}**${pr.descriptor ? ` — ${pr.descriptor}` : ""}${pr.team ? ` (${pr.team})` : ""}`
          )
        ),
      actions: [open("projects", "nsu"), open("projects", "meshcraft"), open("projects")]
    })
  },
  {
    test: /skill|tech|stack|tools?\b|python|sql|power bi|language|\bml\b|machine learning|\bai\b/i,
    answer: () => ({
      text: "Raj's technical skills:\n\n" + list(p.skills.map((s) => `**${s.name}:** ${s.items.join(", ")}`)),
      actions: [open("skills")]
    })
  },
  {
    test: /educat|college|degree|cgpa|\bgpa\b|b\.?tech|universit|somaiya|study|studied|school|honours/i,
    answer: () => ({
      text:
        `**${p.education.degree}** (${p.education.honours})\n${p.education.school}\n\n` +
        list(p.education.scores.map((s) => `${s.label}: ${s.value}`)),
      actions: [open("about")]
    })
  },
  {
    test: /resume|\bcv\b|pdf/i,
    answer: () => ({
      text: "Raj's resume is available as a PDF in the Resume app, where you can view or download it.",
      actions: [open("resume")]
    })
  },
  {
    test: /contact|e-?mail|phone|call|reach|linkedin|github|hire|connect|get in touch/i,
    answer: () => ({
      text:
        "You can reach Raj at:\n\n" +
        list([
          `Email: ${p.identity.email}`,
          `Phone: ${p.identity.phone}`,
          `LinkedIn: ${p.identity.linkedin}`,
          `GitHub: ${p.identity.github}`
        ]),
      actions: [open("contact"), open("resume")]
    })
  },
  {
    test: /experience|work(ed)?|job|role|career|background|employ/i,
    answer: () => ({
      text:
        "Raj's experience, most recent first:\n\n" +
        list(p.experience.map(heading)) +
        `\n\nHe also has ${p.internships.length} internships, listed in the Experience app.`,
      actions: [open("experience", "india-glycols"), open("experience")]
    })
  },
  {
    test: /who is|about raj|about him|tell me about|summary|introduce|overview|\bhello\b|\bhi\b|\bhey\b/i,
    answer: () => ({
      text: `**${p.identity.name}** — ${p.identity.headline}\n\n${p.summary}`,
      actions: [open("about"), open("resume")]
    })
  }
];

export const offlineAnswer = (question: string): OfflineAnswer => {
  const rule = rules.find((r) => r.test.test(question));
  if (rule) return rule.answer();
  return {
    text:
      "I can answer questions about Raj's experience, projects, achievements, research, leadership, certifications, skills, " +
      `education and contact details, but that doesn't seem to be covered in his portfolio. You can email him at ${p.identity.email}.`,
    actions: [open("contact")]
  };
};
