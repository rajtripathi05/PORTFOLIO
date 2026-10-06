import type React from "react";
import { portfolio } from "~/data/portfolio";
import { useAppHost } from "~/shells/host";
import { feedback } from "~/sensory/feedback";
import { share } from "~/features/share";
import { downloadVCard } from "~/features/vcard";
import { downloadResume } from "~/utils";
import SectionHeading from "~/components/content/SectionHeading";

const { identity, summary, education, stats } = portfolio;

/** Brief success glow on a button (opacity-only, see apps.css). */
export function useGlow(): [boolean, () => void] {
  const [on, setOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  return [
    on,
    () => {
      setOn(false);
      requestAnimationFrame(() => setOn(true));
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setOn(false), 1200);
    }
  ];
}

export default function AboutMe() {
  const { shell, width } = useAppHost();
  const openApp = useStore((s) => s.openApp);
  const showToast = useStore((s) => s.showToast);
  const phone = shell === "phone" || width < 620;
  const touch = shell !== "desktop";
  const [glow, triggerGlow] = useGlow();

  const btn = (kind: "primary" | "secondary" | "ghost") =>
    `btn-${kind} ${touch ? "!h-11 !px-4 active:scale-[.96]" : ""}`;

  const onVCard = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    downloadVCard();
    feedback("success", { el });
    triggerGlow();
    showToast("Contact card downloaded");
  };

  const onShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    feedback("tap", { el });
    const result = await share({ title: "Raj Tripathi — Portfolio", url: location.origin + "/" });
    if (result === "copied") {
      feedback("success", { el });
      showToast("Link copied");
    } else if (result === "failed") {
      feedback("error", { el });
      showToast("Couldn't share the link");
    }
  };

  const ext = (href: string, icon: string, label: string) => (
    <a
      className={btn("secondary")}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => feedback("open", { el: e.currentTarget })}
    >
      <span className={icon} aria-hidden="true" />
      {label}
      <span aria-hidden="true"> ↗</span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );

  return (
    <div className="app-scroll">
      <div className={`mx-auto max-w-[800px] py-7 ${phone ? "px-4" : "px-6 sm:px-9"}`}>
        <header className={`flex gap-6 ${phone ? "flex-col items-center text-center" : "items-center"}`}>
          <img
            src={identity.photo}
            alt={`Photo of ${identity.name}`}
            width={132}
            height={132}
            className="size-[132px] flex-none rounded-full object-cover shadow-raised ring-4 ring-[var(--photo-ring)]"
          />
          <div className="min-w-0">
            <h1 className="text-large font-bold tracking-[var(--ls-large)]">{identity.name}</h1>
            <p className="mt-1.5 text-callout text-ink-2">{identity.headline}</p>
          </div>
        </header>

        <section className="mt-6" aria-label="Quick actions">
          <div className={`flex flex-wrap gap-2 ${phone ? "justify-center" : ""}`}>
            <button
              type="button"
              className={btn("primary")}
              onClick={(e) => {
                feedback("success", { el: e.currentTarget });
                downloadResume();
              }}
            >
              <span className="i-ph:download-simple-bold" aria-hidden="true" />
              Download Resume
            </button>
            <a
              className={btn("secondary")}
              href={`mailto:${identity.email}`}
              onClick={(e) => feedback("open", { el: e.currentTarget })}
            >
              <span className="i-ph:envelope-simple-bold" aria-hidden="true" />
              Email
            </a>
            <button type="button" className={`${btn("secondary")} relative ${glow ? "success-glow" : ""}`} onClick={onVCard}>
              <span className="i-ph:address-book-bold" aria-hidden="true" />
              Add to Contacts
            </button>
            <button type="button" className={btn("secondary")} onClick={onShare}>
              <span className="i-ph:share-network-bold" aria-hidden="true" />
              Share
            </button>
            <button
              type="button"
              className={btn("secondary")}
              onClick={(e) => {
                feedback("open", { el: e.currentTarget });
                openApp("assistant");
              }}
            >
              <span className="i-ph:sparkle-fill text-accent-text" aria-hidden="true" />
              Ask my AI
            </button>
            {ext(identity.linkedin, "i-ph:linkedin-logo-bold", "LinkedIn")}
            {ext(identity.github, "i-ph:github-logo-bold", "GitHub")}
          </div>
        </section>

        <ul
          className={`mt-7 grid gap-2 ${phone ? "grid-cols-2" : width >= 760 ? "grid-cols-4" : "grid-cols-3"}`}
          aria-label="Highlights in numbers"
        >
          {stats.map((s) => (
            <li key={s.label} className="app-card px-3 py-3">
              <p className="text-title font-bold tabular-nums text-accent-text">{s.value}</p>
              <p className="mt-0.5 text-footnote leading-snug text-ink-2">{s.label}</p>
            </li>
          ))}
        </ul>

        <section className="mt-8" aria-labelledby="about-summary">
          <SectionHeading id="about-summary">Profile Summary</SectionHeading>
          <p className="measure mt-2 text-callout leading-relaxed text-ink-1">{summary}</p>
        </section>

        <section className="mt-7" aria-labelledby="about-education">
          <SectionHeading id="about-education">Education</SectionHeading>
          <div className="app-card mt-2 p-4">
            <p className="font-semibold">{education.degree}</p>
            <p className="mt-0.5 italic text-ink-2">{education.honours}</p>
            <p className="mt-0.5 text-ink-2">{education.school}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {education.scores.map((s) => (
                <span key={s.label} className="chip tabular-nums">
                  <span className="mr-1.5 font-semibold">{s.label}:</span>
                  {s.value}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
