/**
 * Single source of truth for all portfolio content.
 *
 * Every app in all three shells, Quick View, the Terminal, Spotlight and the AI
 * assistant's system prompt read from this file. To update the site, edit only
 * this file. The shapes are defined in src/types.ts.
 *
 * Links: any URL that starts with "TODO_" renders as a disabled "coming soon"
 * state (or is hidden) instead of a broken link. Link labels never include "↗";
 * the UI adds it to links that open in a new tab.
 */
import type {
  Achievement,
  Certification,
  Copyright,
  PortfolioData,
  Project,
  ResearchRole,
  Role
} from "~/types";

export type {
  Achievement,
  Certification,
  Copyright,
  Education,
  Identity,
  InlineLink,
  NamedLink,
  PortfolioData,
  Project,
  ResearchRole,
  Role,
  SkillGroup,
  Stat,
  TeamSize
} from "~/types";

/* ------------------------------------------------------------- experience */

const experience: Role[] = [
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
    taglines: [
      "3D asset & AI tooling startup serving India's gaming and real-time development ecosystem — Closed in 2026.",
      "Supported indie developers and game studios with 3D assets, level design and technical guidance, with an emphasis on bringing Indian culture, stories and aesthetics into games."
    ],
    bullets: [
      "Secured pre-seed funding to build out the company's engineering and AI tooling roadmap.",
      "Developed data-driven business cases and ROI models — revenue forecasting, commission structures and unit-economics models to support funding and strategic decisions.",
      "Closed 12 paid client projects in Year 1 across 3D assets, ML-assisted workflows and product engineering.",
      "Built and managed a growing team, establishing delivery tracking, engineering/asset review processes and quality workflows as the company evolved.",
      "Partnered with Pashu.ai ($3M raised; 6 Lakh+ farmer reach) on its AI-driven cattle health platform, contributing to its product website and engineering/product specifications.",
      "Evaluated the changing economics of AI-driven 3D asset generation and subsequently concluded active venture operations."
    ],
    inlineLinks: [{ text: "Pashu.ai", url: "https://pashu.ai/" }]
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
    role: "Project Manager – Sales & Marketing (Head of Operations)",
    org: "The Stallion Project",
    dates: "Oct 2023 – Aug 2024",
    location: "Mumbai",
    bullets: [
      "Led cross-functional teams and drove ₹5+ Lakhs in campaign revenue through structured planning, execution and analytics-driven performance tracking.",
      "Managed a 5-member sales team selling Social Media Marketing and Management (SM3) services to clients.",
      "Supervised a 7-member marketing team, including illustrators and video editors, creating content for The Stallion Project's media channels and its clients.",
      "Directed illustrations and video production, ensuring consistency and quality across campaigns, and used analytical insights to optimize sales efforts."
    ]
  },
  {
    id: "team-vision",
    role: "Team Vision Captain",
    org: "KJ Somaiya College of Engineering",
    dates: "Feb 2024 – Aug 2024",
    location: "Mumbai",
    bullets: [
      "Founded Team Vision from scratch and led a 12-member college team focused on AR/VR applications and immersive technology for real-world use cases.",
      "Led a 15-person team on a VR game development project, working with Unreal Engine, Unity, Blender and Maya to create immersive VR environments.",
      "Directed the creation of 3,000+ assets and four immersive maps within the VR world, completed in two weeks.",
      "Directed exploration of AR/VR concepts including immersive exposure experiences for real-world fears such as heights and darkness.",
      "Delivered the project despite logistical constraints that limited participation to 45 individuals; well received by students, faculty and industry professionals.",
      "Managed end-to-end VR environment development, coordinated milestones and optimized asset-creation workflows across multiple software platforms."
    ],
    links: [
      {
        label: "View VR project gallery",
        url: "https://drive.google.com/drive/folders/1OOen89OP_7IjSS1tkVXiL2IDllA6wTX8?usp=sharing"
      }
    ]
  }
];

const internships: Role[] = [
  {
    id: "orion-racing",
    role: "Marketing, Event Handling & Social Media Intern",
    org: "Orion Racing India",
    dates: "Jan – Apr 2024",
    location: "Mumbai",
    bullets: [
      "Designed and executed marketing campaigns to enhance brand visibility.",
      "Coordinated event planning and execution for smooth operations and positive attendee experiences.",
      "Managed and grew social media presence, engaging motorsports enthusiasts.",
      "Collaborated with cross-functional teams to align marketing strategies with organizational goals."
    ]
  },
  {
    id: "vr-ar-intern",
    role: "VR & AR Development Intern",
    dates: "Jan – Feb 2024",
    bullets: []
  },
  {
    id: "stallion-intern",
    role: "Marketing, Sales & Social Media Marketing Intern",
    org: "The Stallion Project",
    dates: "Aug – Oct 2023",
    location: "Hybrid",
    bullets: []
  }
];

/* -------------------------------------------------------- research and IP */

const research: ResearchRole[] = [
  {
    id: "zno-research",
    role: "Research Analyst (Part-time) — Research Project Lead",
    dates: "Jan – Jul 2024",
    topic: "Synthesis of Zinc Oxide Nanoparticles & Oil Synthesis from Renewable Feedstock",
    bullets: [
      "Led a group of 5 researchers to conduct experiments in multiple laboratories.",
      "Published a research paper showcasing innovative use of rice husk as a bio-template for synthesizing zinc oxide nanoparticles and exploring oil synthesis from renewable feedstock.",
      "Coordinated multidisciplinary experiments and ensured adherence to timelines.",
      "Analyzed and interpreted data from tests across various labs.",
      "Documented findings and collaborated with team members to draft and publish the paper."
    ],
    paperTitle: "TODO_PAPER_TITLE",
    venue: "TODO_PAPER_VENUE",
    paperUrl: "TODO_PAPER_URL"
  }
];

const copyrights: Copyright[] = [
  {
    id: "bagasse-copyright",
    title: "Charcoal Production and Value Added Reclamation of Chemicals from Bagasse Torrefaction",
    office: "Copyright Office, Government of India",
    workClass: "Literary/Dramatic Work — creating value-added products by pyrolysis of bagasse",
    regNo: "L-154057/2024",
    dated: "20/09/2024",
    diaryNo: "21622/2024-CO/L",
    applicant: "K J Somaiya College of Engineering, Vidyavihar, Mumbai",
    role: "Co-author",
    coAuthors: "with 12 co-authors from K J Somaiya College of Engineering and Vasantdada Sugar Institute",
    certificatePdf: "/ip/RAJ_Copyright_Certificate.pdf",
    certificateThumb: "/ip/RAJ_Copyright_Certificate.webp"
  }
];

/* ------------------------------------------------------------- leadership */

const leadership: Role[] = [
  {
    id: "sig-gamedev",
    role: "Co-Founder & Lead",
    org: "SIG Game Development (Specialized Game Development Interest Group)",
    dates: "Jan – Jul 2024",
    location: "Mumbai",
    bullets: [
      "Built and led a 15-member council from the ground up, driving the creation and execution of game development projects.",
      "Organized and led a Blender workshop with 25 participants, building 3D modeling and animation skills and strengthening community engagement.",
      "Fostered collaboration and knowledge sharing to build a strong game-development community.",
      "Led development of the council's inaugural project, a mobile endless runner game built using Unreal Engine."
    ],
    tags: ["Workshop conducted — Blender (25 participants)"],
    links: [
      { label: "View workshop", url: "https://drive.google.com/file/d/1ouWEYNCHkqRQRHv-3gI0flhgduFDuMPJ/view" }
    ]
  },
  {
    id: "enactus",
    role: "Marketing & Alumni Relations Intern",
    org: "Enactus Somaiya Social Cell",
    dates: "Mar – Jul 2024",
    location: "Mumbai",
    bullets: [
      "Managed social media campaigns to increase awareness and participation.",
      "Organized events to showcase and support Enactus projects.",
      "Built and maintained alumni networks, leveraging their support for ongoing and future initiatives."
    ],
    highlights: {
      heading: "Projects supported",
      items: [
        { name: "Kruti", description: "women's stitching-skills entrepreneurship" },
        { name: "Finlit", description: "financial literacy" },
        { name: "Riwayat", description: "marketing for traditional artisans" },
        { name: "Parivartan", description: "waste management in Mumbai" },
        { name: "Swagat", description: "affordable liquid handwash for hygiene in Mumbai slums" }
      ]
    }
  },
  {
    id: "somaiya-voices",
    role: "PR Specialist",
    org: "Somaiya Voices (Official Media Body of Somaiya Vidyavihar University)",
    dates: "Mar – Jun 2024",
    location: "Mumbai",
    bullets: [
      "Crafted press releases communicating the committee's activities and achievements.",
      "Coordinated media outreach for coverage across platforms.",
      "Managed and curated social media content for the university community.",
      "Built relationships with media outlets and influencers to enhance visibility."
    ]
  }
];

/* --------------------------------------------------------------- projects */

// Featured order: NSU, MeshCraft, TBDOS, IGL Safety, ACG, FMCG, Financial.
const projects: Project[] = [
  {
    id: "nsu",
    title: "NSU Plant Cockpit",
    descriptor: "Plant Planning & Decision-Support Platform",
    url: "https://datadrivenplant.netlify.app/",
    tags: ["Decision Support", "Scheduling", "3D", "AI-assisted"],
    bullets: [
      "Converted batch chemical manufacturing constraints into a master-workbook-driven planning platform covering demand, production, capacity, BOM/raw materials, packaging materials, scheduling, KPI views, economics and scenario/risk analysis.",
      "Structured deterministic/custom scheduling logic with a 3D plant representation and AI-assisted replanning layer for natural-language exploration, stakeholder interpretation and operational decision support."
    ]
  },
  {
    id: "meshcraft",
    title: "MeshCraft Website",
    descriptor: "Company Website — 3D Asset & AI Tooling Startup",
    url: "https://www.meshcraftassets.com/",
    team: "Team project",
    tags: ["3D assets", "Level design", "Game studios"],
    bullets: [
      "Company website for MeshCraft Pvt. Ltd., the 3D asset & AI tooling startup serving India's gaming and real-time development ecosystem (Co-Founder & CEO, May 2024 – Jun 2026).",
      "Showcases premium 3D assets for developers, artists and creators; the company supported indie developers and game studios with 3D assets, level design and technical guidance, with an emphasis on bringing Indian culture, stories and aesthetics into games."
    ]
  },
  {
    id: "tbdos",
    title: "Turbine & Boiler Dispatch Optimisation System (TBDOS)",
    descriptor: "Utility Dispatch Decision Support",
    url: "https://iglturbine.netlify.app/",
    tags: ["Decision Support", "Optimization", "Day-ahead Planning"],
    bullets: [
      "Built an advisory decision-support platform using historical operating data for LP/MP steam requirements, turbine allocation, HP steam requirement, day-ahead planning, what-if/outage scenarios, optimization logic and business/economic trade-offs; tested over 1,370 real operating hours."
    ]
  },
  {
    id: "igl-safety",
    title: "IGL Digital Safety & Compliance Ecosystem",
    descriptor: "HSE, RCA, BBS & Training",
    subLinks: [
      { label: "HSE Portal", url: "TODO_HSE_URL" },
      { label: "RCA Studio", url: "TODO_RCA_URL" },
      { label: "BBS", url: "TODO_BBS_URL" },
      { label: "Training", url: "https://igltraining.netlify.app/" }
    ],
    tags: ["Workflow Digitization", "RCA/CAPA", "Dashboards", "AI-assisted"],
    bullets: [
      "Combined safety reporting, incident workflows, observations/near misses, RCA/CAPA, risk management, training compliance, dashboards, structured records and audit evidence into a compact workflow digitization ecosystem with AI-assisted support."
    ]
  },
  {
    id: "acg",
    title: "ACG Pharma",
    descriptor: "Pharma-Oriented Technology Exploration",
    url: "https://rajpharma.netlify.app/",
    tags: ["Life Sciences", "Workflow Design", "Process Understanding"],
    bullets: [
      "Self-initiated pharma/life-sciences project exploration focused on process understanding, workflow design, structured information and stakeholder-facing digital solution presentation."
    ]
  },
  {
    id: "fmcg",
    title: "FMCG AI Transformation Blueprint",
    url: "https://fmcgai.netlify.app/",
    tags: ["AI/Analytics", "Forecasting", "RAG", "Text-to-SQL"],
    bullets: [
      "Prioritized 30 AI/analytics use cases across sales, supply chain, finance and HR by business value, feasibility, data readiness, risk and implementation roadmap; included forecasting, scenario analysis, governed RAG/text-to-SQL and invoice-validation automation concepts."
    ]
  },
  {
    id: "financial",
    title: "Financial Sentiment & Stock Prediction",
    tags: ["Sentiment", "RoBERTa", "LSTM"],
    bullets: [
      "Combined financial-text sentiment with historical market data using RoBERTa and LSTM to study sentiment-driven stock movement."
    ]
  }
];

/* ----------------------------------------------------------- achievements */

const achievements: Achievement[] = [
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
    links: [{ label: "GitHub", url: "TODO_PERISCOPE_REPO" }],
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
    description: "Recognized for entrepreneurial impact and innovation within the university ecosystem.",
    teamSize: "Solo",
    mediaFolder: "Somaiya Innovator SOLO"
  }
];

/* --------------------------------------------------------- certifications */

const COURSERA_RECORD = "https://www.coursera.org/account/accomplishments/records/";

const cert = (course: string, issuer: string, issued: string, credentialId: string): Certification => ({
  id: credentialId.toLowerCase(),
  course,
  issuer,
  issued,
  credentialId,
  verifyUrl: COURSERA_RECORD + credentialId,
  expires: "Apr 2036"
});

const certifications: Certification[] = [
  cert("AI Ethics, Responsible Use, and Creativity", "University of Michigan", "Oct 2025", "0WNAF0ZVNDC5"),
  cert("Web Design: Wireframes to Prototypes", "California Institute of the Arts", "Oct 2025", "UX5YNL1Q1NMG"),
  cert("UX Design Fundamentals", "California Institute of the Arts", "Oct 2025", "GVE56IS1UBEW"),
  cert("Web Design: Strategy and Information Architecture", "California Institute of the Arts", "Oct 2025", "D6EBM0PGUS83"),
  cert("Fundamentals of Graphic Design", "California Institute of the Arts", "Oct 2025", "ZW9KXSXWJJPO"),
  cert("Project Initiation: Starting a Successful Project", "Google", "Apr 2026", "4OO44OD8GMII"),
  cert("Project Planning: Putting It All Together", "Google", "Apr 2026", "J2SI9TCHK3VA"),
  cert("Project Execution: Running the Project", "Google", "Apr 2026", "1XDYP82E9D2Q"),
  cert("Capstone: Applying Project Management in the Real World", "Google", "Apr 2026", "TR8KSO2R9F0Y"),
  cert("Foundations of Project Management", "Packt", "Apr 2026", "UCBZWDZEW2HZ")
];

/* ---------------------------------------------------------------- portfolio */

export const portfolio: PortfolioData = {
  identity: {
    name: "Raj Tripathi",
    firstName: "Raj",
    headline: "B.Tech — Artificial Intelligence & Data Science | KJ Somaiya College of Engineering, Mumbai",
    email: "rajtripathi0305@gmail.com",
    phone: "+91 91122 99195",
    linkedin: "https://linkedin.com/in/rajtripathi05",
    github: "https://github.com/rajtripathi05",
    photo: "/img/raj.jpg",
    resumePdf: "/resume/Raj_Tripathi_Resume.pdf",
    siteUrl: "TODO_SITE_URL"
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

  experience,
  internships,
  research,
  copyrights,
  leadership,
  projects,
  achievements,
  otherHighlightsTitle: "Other highlights",
  certifications,
  certificationsSummary: "10 certifications · UX/Design · Project Management · AI Ethics",

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
    { name: "Databases", items: ["Relational database concepts", "PostgreSQL concepts", "SQL"] },
    { name: "Tools", items: ["Excel", "Power BI", "REST APIs", "Git", "Canva", "Gamma"] }
  ],

  // Only numbers that already exist in the content (counts are taken from the lists above).
  stats: [
    { value: "12", label: "client projects" },
    { value: String(achievements.length), label: "awards" },
    { value: String(certifications.length), label: "certifications" },
    { value: "1,370+", label: "operating hours tested" },
    { value: "30", label: "use cases" },
    { value: "3,000+", label: "VR assets" },
    { value: String(copyrights.length), label: "copyright (co-author)" }
  ],

  driveArchiveUrl: "https://drive.google.com/drive/u/1/folders/1ZLQGr7Orvfs_AkKx6zgbWS4Wwvx9KpuV"
};

/**
 * Your own sites that currently refuse to be shown inside another page
 * (they send `X-Frame-Options: SAMEORIGIN` / `frame-ancestors 'self'`).
 * They always open in a new tab. Once you allow this portfolio's domain in their
 * headers, delete the host here and they'll open inside Safari again.
 */
export const noEmbedHosts: string[] = ["igltraining.netlify.app", "fmcgai.netlify.app"];

/* ---------------------------------------------------------------- helpers */

/** True for missing or placeholder values like "TODO_HSE_URL". */
export const isTodoLink = (url?: string): boolean => !url || url.startsWith("TODO_");

export const safeHost = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
};

/**
 * Sites that must always open in a new tab, never in the Safari iframe:
 * LinkedIn, GitHub and Google Drive refuse embedding, Pashu.ai isn't Raj's project,
 * and noEmbedHosts block framing.
 */
export const mustOpenInNewTab = (url: string): boolean => {
  const host = safeHost(url);
  return (
    noEmbedHosts.includes(host) ||
    /(^|\.)(linkedin\.com|github\.com|google\.com|coursera\.org|pashu\.ai)$/i.test(host)
  );
};

/** "Allianz Tech Championship — Winner" */
export const achievementTitle = (a: Achievement): string => [a.name, a.result].filter(Boolean).join(" — ");

/** "Team Lead — Computer Vision | Godavari Biorefineries Ltd" */
export const roleTitle = (r: Role): string => [r.role, r.org].filter(Boolean).join(" | ");

/** Projects that have at least one live link (for Safari favorites). */
export const liveProjectLinks = (): { project: Project; label: string; url: string }[] =>
  portfolio.projects.flatMap((p) => {
    const links: { project: Project; label: string; url: string }[] = [];
    if (p.url && !isTodoLink(p.url)) links.push({ project: p, label: p.title, url: p.url });
    p.subLinks?.forEach((l) => {
      if (!isTodoLink(l.url)) links.push({ project: p, label: `${p.title} — ${l.label}`, url: l.url });
    });
    return links;
  });
