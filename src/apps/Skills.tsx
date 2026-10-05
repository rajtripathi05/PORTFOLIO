import { portfolio } from "~/data/portfolio";
import { useWindow } from "~/components/window/WindowContext";

const groupIcons: Record<string, string> = {
  Programming: "i-ph:code-bold",
  "Data & Analytics": "i-ph:chart-bar-bold",
  "AI / ML": "i-ph:brain-bold",
  "Business Technology": "i-ph:flow-arrow-bold",
  Databases: "i-ph:database-bold",
  Tools: "i-ph:wrench-bold"
};

export default function Skills() {
  const { width } = useWindow();

  return (
    <div className="app-scroll">
      <div className="mx-auto max-w-[820px] px-6 py-7 sm:px-9">
        <h1 className="app-h1">Technical Skills</h1>
        <div className={`mt-6 grid gap-3 ${width < 640 ? "grid-cols-1" : "grid-cols-2"}`}>
          {portfolio.skills.map((group) => (
            <section key={group.name} className="app-card p-4" aria-labelledby={`skills-${group.name}`}>
              <h2 id={`skills-${group.name}`} className="hstack gap-2 text-[15px] font-bold">
                <span
                  className={`${groupIcons[group.name] ?? "i-ph:circle-bold"} text-accent-text`}
                  aria-hidden="true"
                />
                {group.name}
              </h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <li key={item} className="chip">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
