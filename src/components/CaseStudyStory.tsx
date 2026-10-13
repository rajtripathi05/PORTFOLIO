import type { CaseStudy } from "~/types";

const STEPS = [
  { key: "problem", label: "Problem", icon: "i-ph:warning-circle-bold" },
  { key: "approach", label: "Approach", icon: "i-ph:wrench-bold" },
  { key: "impact", label: "Impact", icon: "i-ph:chart-line-up-bold" }
] as const;

/**
 * Problem → Approach → Impact as a vertical story. Every line is the project's own text
 * (scripts/check-content.mjs); empty sections are left out, and `impactNote` (a TODO_
 * placeholder) is never shown. Plain markup, so it prerenders and prints in Quick View.
 */
export default function CaseStudyStory({ study, headingLevel = 3 }: { study: CaseStudy; headingLevel?: 3 | 4 }) {
  const steps = STEPS.filter((s) => study[s.key].length > 0);
  const H = `h${headingLevel}` as const;
  return (
    <ol className="case-story" aria-label="Case study">
      {steps.map((s, i) => (
        <li key={s.key} className="case-step">
          <span className="case-marker" aria-hidden="true">
            <span className={`${s.icon} text-[15px]`} />
          </span>
          {i < steps.length - 1 && <span className="case-rail" aria-hidden="true" />}
          <H className="text-footnote font-bold uppercase tracking-wide text-accent-text">{s.label}</H>
          <ul className="bullets measure mt-1.5 text-callout leading-relaxed">
            {study[s.key].map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
