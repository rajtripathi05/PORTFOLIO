import { portfolio, type Certification } from "~/data/portfolio";
import { useAppHost } from "~/shells/host";
import { feedback } from "~/sensory/feedback";
import SectionHeading from "~/components/content/SectionHeading";

const certDomId = (id: string) => `cert-${id}`;

// Grouped by issuer, in data order.
const groups: { issuer: string; items: Certification[] }[] = [];
for (const c of portfolio.certifications) {
  const g = groups.find((x) => x.issuer === c.issuer);
  if (g) g.items.push(c);
  else groups.push({ issuer: c.issuer, items: [c] });
}

function CertCard({
  c,
  open,
  selected,
  onToggle
}: {
  c: Certification;
  open: boolean;
  selected: boolean;
  onToggle: (el: Element) => void;
}) {
  const { shell } = useAppHost();
  const touch = shell !== "desktop";
  const detailId = `${certDomId(c.id)}-detail`;

  return (
    <li
      id={certDomId(c.id)}
      className={`scroll-mt-4 rounded-card border transition-colors duration-emphasis ${
        selected ? "border-accent bg-accent-soft" : "border-hairline bg-panel-2"
      }`}
    >
      <div className="flex items-start gap-2 p-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={detailId}
          className={`min-w-0 flex-1 rounded-chip text-left ${touch ? "min-h-11 active:scale-[.96]" : ""}`}
          onClick={(e) => onToggle(e.currentTarget)}
        >
          <span className="block font-semibold leading-snug">{c.course}</span>
          <span className="mt-0.5 block text-footnote text-ink-2">{c.issuer}</span>
          <span className="mt-0.5 flex items-center gap-1 text-footnote tabular text-ink-3">
            Issued {c.issued}
            <span
              className={`i-ph:caret-down-bold ml-1 transition-transform duration-micro ${open ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
            <span className="sr-only">{open ? " (hide details)" : " (show details)"}</span>
          </span>
        </button>
        <a
          className={`btn-secondary flex-none ${touch ? "!h-11 !px-4 active:scale-[.96]" : "btn-sm"}`}
          href={c.verifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => feedback("open", { el: e.currentTarget })}
        >
          Verify
          <span aria-hidden="true"> ↗</span>
          <span className="sr-only"> {c.course} certificate (opens in a new tab)</span>
        </a>
      </div>
      {open && (
        <dl id={detailId} className="grid gap-1 border-t border-hairline px-3 py-2.5 text-footnote">
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-ink-3">Credential ID</dt>
            <dd className="font-medium tabular">{c.credentialId}</dd>
          </div>
          {c.expires && (
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-ink-3">Expires</dt>
              <dd className="font-medium tabular">{c.expires}</dd>
            </div>
          )}
        </dl>
      )}
    </li>
  );
}

export default function Certifications() {
  const { shell, width, params, nonce } = useAppHost();
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const cols = shell === "phone" || width < 640 ? "grid-cols-1" : "grid-cols-2";

  // params.id selects and expands a certification.
  useEffect(() => {
    const id = params?.id?.toLowerCase();
    if (!id || !portfolio.certifications.some((c) => c.id === id)) return;
    setOpen((s) => new Set(s).add(id));
    setSelected(id);
    const t = setTimeout(() => {
      rootRef.current
        ?.querySelector(`[id="${certDomId(id)}"]`)
        ?.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    }, 150);
    const t2 = setTimeout(() => setSelected(null), 2400);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  const toggle = (id: string, el: Element) => {
    feedback("toggle", { el });
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div ref={rootRef} className="app-scroll">
      <div className={`mx-auto max-w-[860px] py-7 ${shell === "phone" ? "px-4" : "px-6 sm:px-9"}`}>
        <h1 className="app-h1">Certifications</h1>
        <p className="mt-1 text-ink-2">{portfolio.certificationsSummary}</p>

        {groups.map((g) => {
          const hid = `issuer-${g.issuer.replace(/\W+/g, "-").toLowerCase()}`;
          return (
            <section key={g.issuer} className="mt-6" aria-labelledby={hid}>
              <SectionHeading id={hid} className="mb-2">
                {g.issuer}
              </SectionHeading>
              <ul className={`grid gap-2.5 ${cols}`}>
                {g.items.map((c) => (
                  <CertCard
                    key={c.id}
                    c={c}
                    open={open.has(c.id)}
                    selected={selected === c.id}
                    onToggle={(el) => toggle(c.id, el)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
