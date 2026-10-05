/**
 * Single source of truth for all portfolio content.
 *
 * Every app (desktop, mobile, Quick View, Terminal, Spotlight) and the AI
 * assistant's system prompt read from this file. To update the site, edit
 * only this file.
 *
 * Links: any URL that starts with "TODO_" renders as a disabled
 * "Link coming soon" state instead of a broken link.
 */

export interface InlineLink {
  /** Exact text inside the sentence that becomes a link. */
  text: string;
  url: string;
}

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
}

export interface Education {
  degree: string;
  honours: string;
  school: string;
  scores: { label: string; value: string }[];
}

export interface ExperienceItem {
  id: string;
  role: string;
  org: string;
  orgUrl?: string;
  dates: string;
  location?: string;
  tagline?: string;
  bullets: string[];
  links?: InlineLink[];
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
  /**
   * Short tag chips. Each must be a phrase that already appears in this project's
   * text (checked at build time by scripts/check-content.mjs).
   */
  tags?: string[];
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

export interface SkillGroup {
  name: string;
  items: string[];
}

/** Headline numbers for the About Me stats row — `value` must appear in the content. */
export interface Stat {
  value: string;
  label: string;
}

export interface Portfolio {
  identity: Identity;
  summary: string;
  education: Education;
  experience: ExperienceItem[];
  projects: Project[];
  achievements: Achievement[];
  /** Heading for media folders that don't match any achievement. */
  otherHighlightsTitle: string;
  skills: SkillGroup[];
  stats: Stat[];
  driveArchiveUrl: string;
}

export const portfolio: Portfolio = {
  identity: {
    name: "Raj Tripathi",
    firstName: "Raj",
    headline:
      "B.Tech — Artificial Intelligence & Data Science | KJ Somaiya College of Engineering, Mumbai",
    email: "rajtripathi0305@gmail.com",
    phone: "+91 91122 99195",
    linkedin: "https://linkedin.com/in/rajtripathi05",
    github: "https://github.com/rajtripathi05",
    photo: "/img/raj.jpg",
    resumePdf: "/resume/Raj_Tripathi_Resume.pdf"
  },

  summary:
    "Business-technology and AI/data problem solver with real-world experience inside a large chemical manufacturing environment, independently translating operational processes into digital, analytics and AI-enabled solutions. Most recently worked as an AI Evangelist at India Glycols, collaborating with business, operations, engineering and SAP stakeholders to understand complex workflows and build practical decision-support and workflow systems. Founder-level entrepreneurial experience includes securing pre-seed funding for a technology venture, alongside multiple national-level hackathon wins. Strong interest in applying technology, data and structured problem solving to complex business and digital-transformation challenges.",

  education: {
    degree: "B.Tech — Artificial Intelligence & Data Science",
    honours: "Honours in Applied Cyber Security",
    school: "KJ Somaiya College of Engineering, Mumbai",
    scores: [
      { label: "CGPA", value: "9.06/10 (with Honours)" },
      { label: "HSC", value: "73.14%" },
      { label: "SSC", value: "90.8%" }
    ]
  },

  experience: [
    {
      id: "india-glycols",
      role: "AI Evangelist",
      org: "India Glycols Ltd",
      dates: "Jun – Aug 2026",
      location: "Noida",
      bullets: [
        "Embedded at the India Glycols Kashipur plant as the primary AI-focused contributor working with the business team; collaborated with operations, planning, sales, engineering, SAP stakeholders, plant personnel and business leadership.",
        "Independently learned manufacturing processes through plant visits, meetings, Excel files, operational plans, existing workflows, observations and stakeholder discussions, then mapped business processes, data flows and technology opportunities.",
        "Translated senior-leadership assignments into structured requirements, decision logic, user workflows, dashboards and AI-assisted solution prototypes across planning, procurement, logbooks, safety and compliance; mapped SAP integration concepts and data flows where relevant."
      ]
    },
    {
      id: "meshcraft",
      role: "Co-Founder & CEO",
      org: "MeshCraft Pvt. Ltd.",
      orgUrl: "https://www.meshcraftassets.com/",
      dates: "May 2024 – Jun 2026",
      location: "Mumbai",
      tagline:
        "3D asset & AI tooling startup serving India's gaming and real-time development ecosystem — Closed in 2026.",
      bullets: [
        "Secured pre-seed funding to build out the company's engineering and AI tooling roadmap.",
        "Developed data-driven business cases and ROI models — revenue forecasting, commission structures and unit-economics models to support funding and strategic decisions.",
        "Closed 12 paid client projects in Year 1 across 3D assets, ML-assisted workflows and product engineering.",
        "Built and managed a growing team, establishing delivery tracking, engineering/asset review processes and quality workflows as the company evolved.",
        "Partnered with Pashu.ai ($3M raised; 6 Lakh+ farmer reach) on its AI-driven cattle health platform, contributing to its product website and engineering/product specifications.",
        "Evaluated the changing economics of AI-driven 3D asset generation and subsequently concluded active venture operations."
      ],
      links: [{ text: "Pashu.ai", url: "https://pashu.ai/" }]
    },
    {
      id: "godavari",
      role: "Team Lead — Computer Vision",
      org: "Godavari Biorefineries Ltd",
      dates: "Jan – May 2025",
      location: "Karnataka",
      bullets: [
        "Led a 5-member team to prototype an ML-based impurity detection workflow for industrial pipeline monitoring, applying computer vision and image-processing to a real operating problem."
      ]
    },
    {
      id: "stallion",
      role: "Project Manager",
      org: "The Stallion Project",
      dates: "Oct 2023 – Aug 2024",
      bullets: [
        "Led cross-functional teams and drove ₹5+ Lakhs in campaign revenue through structured planning, execution and analytics-driven performance tracking."
      ]
    },
    {
      id: "team-vision",
      role: "Team Vision Captain",
      org: "KJ Somaiya College of Engineering",
      dates: "Feb 2024 – Aug 2024",
      bullets: [
        "Founded Team Vision from scratch and led a 12-member college team focused on AR/VR applications and immersive technology for real-world use cases.",
        "Directed exploration and development of AR/VR concepts including immersive exposure experiences for real-world fears such as heights and darkness, while coordinating team execution and project direction."
      ]
    }
  ],

  // Featured order: NSU, TBDOS, IGL Safety, ACG, FMCG, Financial.
  projects: [
    {
      id: "nsu",
      tags: ["Decision Support", "Scheduling", "3D", "AI-assisted"],
      title: "NSU Plant Cockpit",
      descriptor: "Plant Planning & Decision-Support Platform",
      url: "https://indiaglycolsnsu.netlify.app/",
      bullets: [
        "Converted batch chemical manufacturing constraints into a master-workbook-driven planning platform covering demand, production, capacity, BOM/raw materials, packaging materials, scheduling, KPI views, economics and scenario/risk analysis.",
        "Structured deterministic/custom scheduling logic with a 3D plant representation and AI-assisted replanning layer for natural-language exploration, stakeholder interpretation and operational decision support."
      ]
    },
    {
      id: "tbdos",
      tags: ["Decision Support", "Optimization", "Day-ahead Planning"],
      title: "Turbine & Boiler Dispatch Optimisation System (TBDOS)",
      descriptor: "Utility Dispatch Decision Support",
      url: "https://iglturbine.netlify.app/",
      bullets: [
        "Built an advisory decision-support platform using historical operating data for LP/MP steam requirements, turbine allocation, HP steam requirement, day-ahead planning, what-if/outage scenarios, optimization logic and business/economic trade-offs; tested over 1,370 real operating hours."
      ]
    },
    {
      id: "igl-safety",
      tags: ["Workflow Digitization", "RCA/CAPA", "Dashboards", "AI-assisted"],
      title: "IGL Digital Safety & Compliance Ecosystem",
      descriptor: "HSE, RCA, BBS & Training",
      subLinks: [
        { label: "HSE Portal", url: "TODO_HSE_URL" },
        { label: "RCA Studio", url: "TODO_RCA_URL" },
        { label: "BBS", url: "TODO_BBS_URL" },
        { label: "Training", url: "https://igltraining.netlify.app/" }
      ],
      bullets: [
        "Combined safety reporting, incident workflows, observations/near misses, RCA/CAPA, risk management, training compliance, dashboards, structured records and audit evidence into a compact workflow digitization ecosystem with AI-assisted support."
      ]
    },
    {
      id: "acg",
      tags: ["Life Sciences", "Workflow Design", "Process Understanding"],
      title: "ACG Pharma",
      descriptor: "Pharma-Oriented Technology Exploration",
      url: "https://rajpharma.netlify.app/",
      bullets: [
        "Self-initiated pharma/life-sciences project exploration focused on process understanding, workflow design, structured information and stakeholder-facing digital solution presentation."
      ]
    },
    {
      id: "fmcg",
      tags: ["AI/Analytics", "Forecasting", "RAG", "Text-to-SQL"],
      title: "FMCG AI Transformation Blueprint",
      url: "https://fmcgai.netlify.app/",
      bullets: [
        "Prioritized 30 AI/analytics use cases across sales, supply chain, finance and HR by business value, feasibility, data readiness, risk and implementation roadmap; included forecasting, scenario analysis, governed RAG/text-to-SQL and invoice-validation automation concepts."
      ]
    },
    {
      id: "financial",
      tags: ["Sentiment", "RoBERTa", "LSTM"],
      title: "Financial Sentiment & Stock Prediction",
      bullets: [
        "Combined financial-text sentiment with historical market data using RoBERTa and LSTM to study sentiment-driven stock movement."
      ]
    }
  ],

  achievements: [
    {
      id: "allianz",
      name: "Allianz Tech Championship",
      result: "Winner",
      prize: "€3,000",
      description:
        "Built W.I.S.E., an AI-driven cybersecurity training platform using adaptive learning and behavioral risk modelling.",
      teamSize: "Solo",
      mediaFolder: "Allianz (SOLO)"
    },
    {
      id: "periscope",
      name: "Periscope AI Multi-Agent Hackathon",
      result: "Winner",
      prize: "₹1 Lakh",
      description:
        "Designed a multi-agent LLM prototype using task decomposition, tool-use concepts and shared context.",
      teamSize: "Team of 3",
      links: [{ label: "GitHub", url: "https://github.com/PeriscopeHackathon2025/Opus" }],
      mediaFolder: "Periscope (Team of 3)"
    },
    {
      id: "isro-gmrt",
      name: "ISRO × GMRT Cosmic Fest",
      result: "Winner",
      description:
        "Built an ML-based radio signal classifier with a live analytics dashboard using real telescope data.",
      teamSize: "Team of 4",
      mediaFolder: "ISRO X GMRT (Team of 4)"
    },
    {
      id: "genai-mumbai",
      name: "GenAI Mumbai Hackathon",
      result: "Runner-Up",
      prize: "₹10,000",
      description:
        "Recognized for real-world applicability, prompt engineering quality and structured problem framing.",
      teamSize: "Team of 2",
      mediaFolder: "Gen Ai Mumbai (Team of 2)"
    },
    {
      id: "somaiya-innovator",
      name: "Somaiya Innovator Award",
      prize: "₹10,000",
      description:
        "Recognized for entrepreneurial impact and innovation within the university ecosystem.",
      teamSize: "Solo",
      mediaFolder: "Somaiya Innovator SOLO"
    }
  ],

  otherHighlightsTitle: "Other highlights",

  // Numbers quoted from the content above (verified by scripts/check-content.mjs).
  stats: [
    { value: "12", label: "paid client projects in Year 1" },
    { value: "1,370+", label: "real operating hours tested (TBDOS)" },
    { value: "30", label: "AI/analytics use cases prioritized" },
    { value: "9.06", label: "CGPA, with Honours" }
  ],

  skills: [
    { name: "Programming", items: ["Python", "SQL"] },
    {
      name: "Data & Analytics",
      items: [
        "SQL",
        "data analysis",
        "exploratory analysis",
        "KPI dashboards",
        "forecasting fundamentals",
        "reporting",
        "Excel",
        "Power BI"
      ]
    },
    {
      name: "AI / ML",
      items: [
        "Machine Learning fundamentals",
        "regression",
        "classification",
        "anomaly detection",
        "Generative AI",
        "LLM applications",
        "RAG",
        "prompt engineering",
        "AI assistants"
      ]
    },
    {
      name: "Business Technology",
      items: [
        "Requirements analysis",
        "process mapping",
        "workflow digitization",
        "solution prototyping",
        "decision-support systems",
        "stakeholder collaboration",
        "business problem solving"
      ]
    },
    {
      name: "Databases",
      items: ["Relational database concepts", "PostgreSQL concepts", "SQL"]
    },
    {
      name: "Tools",
      items: ["Excel", "Power BI", "REST APIs", "Git", "Canva", "Gamma"]
    }
  ],

  driveArchiveUrl:
    "https://drive.google.com/drive/u/1/folders/1ZLQGr7Orvfs_AkKx6zgbWS4Wwvx9KpuV"
};

/**
 * Your own sites that currently refuse to be shown inside another page
 * (they send `X-Frame-Options: SAMEORIGIN` / `frame-ancestors 'self'`).
 * They always open in a new tab. Once you allow this portfolio's domain in their
 * headers, delete the host here and they'll open inside Safari again.
 */
export const noEmbedHosts: string[] = ["igltraining.netlify.app", "fmcgai.netlify.app"];

/* ---------------------------------------------------------------- helpers */

/** True for placeholder links like "TODO_HSE_URL". */
export const isTodoLink = (url?: string): boolean => !url || url.startsWith("TODO_");

/**
 * Sites that must always open in a new tab, never in the Safari iframe:
 * LinkedIn and GitHub refuse embedding, external company sites aren't projects,
 * and noEmbedHosts block framing.
 */
export const mustOpenInNewTab = (url: string): boolean => {
  const host = safeHost(url);
  return (
    noEmbedHosts.includes(host) ||
    /(^|\.)(linkedin\.com|github\.com|google\.com|meshcraftassets\.com|pashu\.ai)$/i.test(host)
  );
};

export const safeHost = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
};

/** "Allianz Tech Championship — Winner" */
export const achievementTitle = (a: Achievement): string =>
  [a.name, a.result].filter(Boolean).join(" — ");

/** Projects that have at least one embeddable live link (for Safari favorites). */
export const liveProjectLinks = (): { project: Project; label: string; url: string }[] =>
  portfolio.projects.flatMap((p) => {
    const links: { project: Project; label: string; url: string }[] = [];
    if (p.url && !isTodoLink(p.url)) links.push({ project: p, label: p.title, url: p.url });
    p.subLinks?.forEach((l) => {
      if (!isTodoLink(l.url))
        links.push({ project: p, label: `${p.title} — ${l.label}`, url: l.url });
    });
    return links;
  });
