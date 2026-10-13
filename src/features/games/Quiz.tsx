import type React from "react";
import type { AppId, AppParams } from "~/types";
import { portfolio } from "~/data/portfolio";
import { feedback } from "~/sensory/feedback";
import type { GameProps } from "./types";
import { shuffle } from "./input";
import { Stats } from "./ui";

interface Question {
  prompt: string;
  answer: string;
  /** Wrong options: Raj's own other entries, or clearly-wrong numbers. */
  others: string[];
  fact: string;
  learn: { app: AppId; params?: AppParams; label: string };
}

const ROUND = 8;
const { achievements, experience, projects, education, certifications, stats } = portfolio;
const byId = <T extends { id: string }>(list: T[], id: string) => list.find((x) => x.id === id);
const pick3 = (list: string[], not: string) => shuffle(list.filter((x) => x && x !== not)).slice(0, 3);

/** Questions are built from src/data/portfolio.ts, so answers always match the content. */
const bank = (): Question[] => {
  const q: (Question | null)[] = [];
  const names = achievements.map((a) => a.name);

  const solo = achievements.find((a) => a.teamSize === "Solo" && a.result === "Winner" && a.prize);
  if (solo)
    q.push({
      prompt: `Which competition did Raj win solo, taking home ${solo.prize}?`,
      answer: solo.name,
      others: pick3(names, solo.name),
      fact: solo.description,
      learn: { app: "achievements", params: { id: solo.id }, label: "See the photos" }
    });

  const trio = achievements.find((a) => a.teamSize === "Team of 3" && a.result === "Winner");
  if (trio)
    q.push({
      prompt: `Which ${/hackathon/i.test(trio.name) ? "hackathon" : "competition"} did Raj win as a team of three?`,
      answer: trio.name,
      others: pick3(names, trio.name),
      fact: trio.description,
      learn: { app: "achievements", params: { id: trio.id }, label: "See the photos" }
    });

  const telescope = achievements.find((a) => /telescope/i.test(a.description));
  if (telescope)
    q.push({
      prompt: "Where did Raj's team build an ML radio-signal classifier on real telescope data?",
      answer: telescope.name,
      others: pick3(names, telescope.name),
      fact: telescope.description,
      learn: { app: "achievements", params: { id: telescope.id }, label: "See the photos" }
    });

  const founder = experience.find((e) => /co-founder/i.test(e.role) && e.org);
  if (founder?.org)
    q.push({
      prompt: `Which company did Raj co-found and lead as ${founder.role.replace(/^Co-Founder & /, "")}?`,
      answer: founder.org,
      others: pick3(
        experience.map((e) => e.org ?? ""),
        founder.org
      ),
      fact: founder.taglines?.[0] ?? founder.bullets[0],
      learn: { app: "experience", params: { id: founder.id }, label: "Read the role" }
    });

  const igl = byId(experience, "india-glycols");
  if (igl?.org)
    q.push({
      prompt: `What was Raj's role at ${igl.org}?`,
      answer: igl.role,
      others: pick3(
        experience.map((e) => e.role),
        igl.role
      ),
      fact: igl.bullets[0],
      learn: { app: "experience", params: { id: igl.id }, label: "Read the role" }
    });

  const flagship = projects[0];
  if (flagship?.descriptor)
    q.push({
      prompt: `Which of Raj's projects is a "${flagship.descriptor}"?`,
      answer: flagship.title,
      others: pick3(
        projects.map((p) => p.title),
        flagship.title
      ),
      fact: flagship.bullets[0],
      learn: { app: "projects", params: { id: flagship.id }, label: "Open the project" }
    });

  const hours = stats.find((s) => /operating hours/.test(s.label));
  const tbdos = byId(projects, "tbdos");
  if (hours && tbdos)
    q.push({
      prompt: "Over how many real operating hours was Raj's turbine & boiler dispatch system tested?",
      answer: hours.value,
      others: ["137+", "370+", "13,700+"],
      fact: tbdos.bullets[0],
      learn: { app: "projects", params: { id: tbdos.id }, label: "Open the project" }
    });

  const vr = stats.find((s) => /VR assets/.test(s.label));
  const vision = byId(experience, "team-vision");
  if (vr && vision)
    q.push({
      prompt: "How many 3D assets did Raj's Team Vision create for its VR world?",
      answer: vr.value,
      others: ["300+", "1,000+", "30,000+"],
      fact: vision.bullets.find((b) => b.includes(vr.value.replace("+", ""))) ?? vision.bullets[0],
      learn: { app: "experience", params: { id: vision.id }, label: "Read the role" }
    });

  const clients = stats.find((s) => /client projects/.test(s.label));
  if (clients && founder)
    q.push({
      prompt: `How many paid client projects did ${founder.org ?? "Raj's startup"} close in its first year?`,
      answer: clients.value,
      others: ["4", "20", "36"],
      fact: founder.bullets.find((b) => b.includes(clients.value)) ?? founder.bullets[0],
      learn: { app: "experience", params: { id: founder.id }, label: "Read the role" }
    });

  const cgpa = education.scores.find((s) => s.label === "CGPA");
  if (cgpa) {
    const value = cgpa.value.replace(/\s*\(.*\)$/, "");
    q.push({
      prompt: `What's Raj's CGPA in ${education.degree.replace(/^B\.Tech — /, "")}?`,
      answer: value,
      others: ["8.06/10", "8.60/10", "9.60/10"].filter((x) => x !== value),
      fact: `${education.degree} (${education.honours}), ${education.school}.`,
      learn: { app: "about", label: "Open About Me" }
    });
  }

  q.push({
    prompt: "How many certifications has Raj completed?",
    answer: String(certifications.length),
    others: ["4", "7", "15"].filter((x) => x !== String(certifications.length)),
    fact: portfolio.certificationsSummary,
    learn: { app: "certifications", label: "See them all" }
  });

  return q.filter((x): x is Question => !!x && x.others.length >= 3);
};

const deal = () =>
  shuffle(bank())
    .slice(0, ROUND)
    .map((q) => ({ ...q, options: shuffle([q.answer, ...q.others.slice(0, 3)]) }));

const verdict = (n: number, total: number) =>
  n === total
    ? "Perfect! You know Raj's work inside out."
    : n >= total - 2
      ? "Impressive. You've clearly been exploring."
      : n >= total / 2 - 1
        ? "Not bad! The Projects and Achievements apps have the rest."
        : "A fresh start: explore the apps, then try again.";

export default function Quiz({ onFinish, best }: GameProps) {
  const [round, setRound] = useState(deal);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [newBest, setNewBest] = useState(false);
  const openApp = useStore((s) => s.openApp);
  const nextRef = useRef<HTMLButtonElement>(null);
  const total = round.length;
  const q = round[index];

  const answer = (option: string, el: HTMLElement) => {
    if (chosen) return;
    setChosen(option);
    const right = option === q.answer;
    if (right) setCorrect((c) => c + 1);
    feedback(right ? "success" : "error", { el });
    requestAnimationFrame(() => nextRef.current?.focus());
  };

  const next = () => {
    if (index + 1 < total) {
      setIndex((i) => i + 1);
      setChosen(null);
      return;
    }
    setDone(true);
    const isBest = onFinish(correct);
    setNewBest(isBest);
    if (isBest) feedback("success");
  };

  const restart = () => {
    setRound(deal());
    setIndex(0);
    setChosen(null);
    setCorrect(0);
    setDone(false);
    setNewBest(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const n = Number(e.key);
    if (!chosen && n >= 1 && n <= q.options.length) {
      e.preventDefault();
      const el = e.currentTarget.querySelectorAll<HTMLButtonElement>(".game-quiz-option")[n - 1];
      if (el) answer(q.options[n - 1], el);
    }
  };

  if (done)
    return (
      <div className="game-stage">
        <div className="game-quiz glass glass-flat text-center">
          {newBest && <span className="game-badge">New best!</span>}
          <p className="font-rounded text-[56px] font-bold leading-none tabular-nums">
            {correct}
            <span className="text-[28px] text-ink-3">/{total}</span>
          </p>
          <p className="mt-3 text-callout font-semibold">{verdict(correct, total)}</p>
          {best !== undefined && !newBest && <p className="mt-1 text-footnote text-ink-2">Your best is {best}/{total}.</p>}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn-primary !rounded-full" onClick={restart} autoFocus>
              Play again
            </button>
            <a className="btn-secondary !rounded-full" href="/quick">
              Read the Quick View
            </a>
          </div>
        </div>
      </div>
    );

  return (
    <div className="game-stage">
      <Stats
        items={[
          { label: "Question", value: `${index + 1}/${total}` },
          { label: "Score", value: correct },
          { label: "Best", value: best !== undefined ? `${best}/${total}` : "—" }
        ]}
      />
      <div className="game-quiz glass glass-flat" onKeyDown={onKeyDown}>
        <div className="game-quiz-progress" aria-hidden="true">
          <span style={{ width: `${((index + (chosen ? 1 : 0)) / total) * 100}%` }} />
        </div>
        <p className="text-headline font-bold leading-snug" id="quiz-prompt">
          {q.prompt}
        </p>
        <div className="mt-4 grid gap-2" role="group" aria-labelledby="quiz-prompt">
          {q.options.map((o, i) => {
            const state = !chosen ? "" : o === q.answer ? " is-right" : o === chosen ? " is-wrong" : " is-dim";
            return (
              <button
                key={o}
                type="button"
                className={`game-quiz-option${state}`}
                onClick={(e) => answer(o, e.currentTarget)}
                aria-disabled={!!chosen}
                autoFocus={i === 0}
              >
                <span className="game-quiz-key" aria-hidden="true">
                  {chosen && o === q.answer ? "✓" : chosen && o === chosen ? "✕" : i + 1}
                </span>
                <span className="min-w-0 flex-1 text-left">{o}</span>
              </button>
            );
          })}
        </div>
        {chosen && (
          <div className="game-quiz-fact" aria-live="polite">
            <p>
              <strong>{chosen === q.answer ? "Correct. " : `It's ${q.answer}. `}</strong>
              {q.fact}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button ref={nextRef} type="button" className="btn-primary btn-sm !rounded-full" onClick={next}>
                {index + 1 < total ? "Next question" : "See my score"}
              </button>
              <button type="button" className="btn-ghost btn-sm" onClick={() => openApp(q.learn.app, q.learn.params)}>
                {q.learn.label} →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
