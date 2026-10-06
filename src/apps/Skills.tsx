import { portfolio } from "~/data/portfolio";
import { useAppHost } from "~/shells/host";

const groupIcons: Record<string, string> = {
  Programming: "i-ph:code-bold",
  "Data & Analytics": "i-ph:chart-bar-bold",
  "AI / ML": "i-ph:brain-bold",
  "Business Technology": "i-ph:flow-arrow-bold",
  Databases: "i-ph:database-bold",
  Tools: "i-ph:wrench-bold"
};

// Subtle category colour coding (tokens --cat-1…6, contrast-checked).
const catStyle = (i: number) => ({
  color: `var(--cat-${(i % 6) + 1})`,
  background: `var(--cat-${(i % 6) + 1}-subtle)`
});

export default function Skills() {
  const { width, params, nonce } = useAppHost();
  const [filter, setFilter] = useState("");

  // Spotlight opens Skills with { q: "Power BI" } to pre-fill the filter.
  useEffect(() => {
    if (typeof params?.q === "string") setFilter(params.q);
  }, [nonce]);

  const q = filter.trim().toLowerCase();
  const groups = portfolio.skills
    .map((g, i) => ({
      ...g,
      cat: i,
      matches: q ? g.items.filter((i) => i.toLowerCase().includes(q) || g.name.toLowerCase().includes(q)) : g.items
    }))
    .filter((g) => g.matches.length > 0);

  return (
    <div className="app-scroll">
      <div className="mx-auto max-w-[820px] px-6 py-7 sm:px-9">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="app-h1">Technical Skills</h1>
          <div className="relative w-full max-w-[260px]">
            <span
              className="i-ph:magnifying-glass-bold pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
              aria-hidden="true"
            />
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter skills"
              aria-label="Filter skills"
              className="h-9 w-full rounded-button border border-hairline bg-panel-2 pl-9 pr-3 text-body text-ink-1 outline-none focus:border-accent"
            />
          </div>
        </div>

        {groups.length === 0 ? (
          <p className="app-card mt-6 p-6 text-center text-ink-2">
            No skills match “{filter}”.{" "}
            <button type="button" className="text-link font-semibold" onClick={() => setFilter("")}>
              Show all
            </button>
          </p>
        ) : (
          <div className={`mt-6 grid gap-3 ${width < 640 ? "grid-cols-1" : "grid-cols-2"}`}>
            {groups.map((group) => (
              <section key={group.name} className="app-card p-4" aria-labelledby={`skills-${group.name}`}>
                <h2 id={`skills-${group.name}`} className="hstack gap-2 text-body font-bold">
                  <span
                    className="grid size-7 place-items-center rounded-button"
                    style={catStyle(group.cat)}
                    aria-hidden="true"
                  >
                    <span className={`${groupIcons[group.name] ?? "i-ph:circle-bold"} text-[15px]`} />
                  </span>
                  {group.name}
                </h2>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {group.matches.map((item) => (
                    <li
                      key={item}
                      className={`chip !border-transparent font-medium ${
                        q && item.toLowerCase().includes(q) ? "ring-2 ring-[var(--ring)]" : ""
                      }`}
                      style={catStyle(group.cat)}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
