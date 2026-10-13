import type React from "react";
import { portfolio } from "~/data/portfolio";
import { getEvidence, HIRE_PRESETS, MAX_JD_CHARS, MAX_ROLE_CHARS } from "~/data/hire";
import { askHire, type HireMatch } from "~/features/hire/askHire";
import { downloadVCard } from "~/features/vcard";
import { share } from "~/features/share";
import { feedback } from "~/sensory/feedback";
import { useAppHost } from "~/shells/host";
import { copyText, deepLinkUrl } from "~/utils";

/**
 * Hire Raj: type a role, get a short pitch and 3–5 pieces of evidence from the portfolio
 * (.claude/skills/grounded-ai). Evidence rows are rendered from portfolio.ts by id,
 * verbatim; the pitch is the only generated text.
 */
export default function Hire() {
  const { shell, params, nonce } = useAppHost();
  const openApp = useStore((s) => s.openApp);
  const showToast = useStore((s) => s.showToast);
  const touch = shell !== "desktop";
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  const [busy, setBusy] = useState(false);
  const [match, setMatch] = useState<(HireMatch & { role: string }) | null>(null);

  const run = async (r = role, j = jd) => {
    const text = r.trim();
    if (!text || busy) return;
    setBusy(true);
    const m = await askHire(text, j);
    setMatch({ ...m, role: text });
    setBusy(false);
    feedback("success");
  };

  // `hire <role>` (Terminal) and deep links arrive as { q }: fill in and match.
  useEffect(() => {
    if (typeof params?.q === "string" && params.q.trim()) {
      const q = params.q.slice(0, MAX_ROLE_CHARS);
      setRole(q);
      void run(q, "");
    }
  }, [nonce]);

  const rows = (match?.picks ?? []).map(getEvidence).filter((e) => !!e);
  const asText = () =>
    match
      ? [`Hire Raj: ${match.role}`, "", match.pitch, "", ...rows.map((e) => `• ${e.text} (${e.source})`), "", deepLinkUrl("about")].join("\n")
      : "";
  const mailto = () =>
    `mailto:${portfolio.identity.email}?subject=${encodeURIComponent(`Opportunity: ${match?.role ?? ""}`)}&body=${encodeURIComponent(
      `Hi Raj,\n\n${match?.pitch ?? ""}\n\n`
    )}`;

  const btn = touch ? "btn-lg" : "btn-sm";
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void run();
  };

  return (
    <div className="app-scroll hire-app h-full">
      <div className="mx-auto max-w-[680px] px-5 py-6 sm:px-7">
        <h1 className="app-h1">Hire Raj</h1>
        <p className="mt-1 text-callout text-ink-2">Describe the role. You'll get a short pitch and the matching evidence from Raj's work.</p>

        <form onSubmit={onSubmit} className="glass glass-thick mt-5 rounded-card p-4">
          <label htmlFor="hire-role" className="text-footnote font-semibold text-ink-2">
            Role or company
          </label>
          <input
            id="hire-role"
            value={role}
            onChange={(e) => setRole(e.target.value.slice(0, MAX_ROLE_CHARS))}
            maxLength={MAX_ROLE_CHARS}
            placeholder="e.g. Business Technology Analyst at a consulting firm"
            className="mt-1.5 h-11 w-full rounded-button border border-hairline bg-panel-2 px-3 text-body text-ink-1 outline-none focus:border-accent"
          />
          <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Presets">
            {HIRE_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={role === p}
                className={`glass glass-flat glass-press rounded-chip px-3 ${touch ? "py-2" : "py-1"} text-footnote font-semibold ${
                  role === p ? "text-accent-text" : "text-ink-1"
                }`}
                onClick={(e) => {
                  feedback("selection", { el: e.currentTarget });
                  setRole(p);
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <label htmlFor="hire-jd" className="mt-4 block text-footnote font-semibold text-ink-2">
            Job description <span className="font-normal text-ink-3">(optional)</span>
          </label>
          <textarea
            id="hire-jd"
            value={jd}
            onChange={(e) => setJd(e.target.value.slice(0, MAX_JD_CHARS))}
            maxLength={MAX_JD_CHARS}
            rows={3}
            placeholder="Paste a few lines from the job post"
            className="mt-1.5 w-full resize-y rounded-card border border-hairline bg-panel-2 px-3 py-2 text-body text-ink-1 outline-none focus:border-accent"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-caption text-ink-3 tabular-nums">
              {jd.length}/{MAX_JD_CHARS}
            </span>
            <button type="submit" className={`btn-primary ${touch ? "btn-lg" : ""}`} disabled={!role.trim() || busy}>
              <span className="i-ph:sparkle-fill" aria-hidden="true" />
              {busy ? "Matching…" : "Match"}
            </button>
          </div>
        </form>

        <div aria-live="polite">
          {match && (
            <section className="glass glass-thick mt-5 rounded-card p-4" aria-labelledby="hire-result">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="hire-result" className="app-h2">
                  For {match.role}
                </h2>
                <span className="rounded-chip bg-panel-3 px-2.5 py-0.5 text-caption font-semibold text-ink-2">
                  {match.offline ? "Offline match" : "AI match"}
                </span>
              </div>
              <p className="mt-2 text-callout leading-relaxed">{match.pitch}</p>

              <h3 className="mt-4 text-footnote font-bold uppercase tracking-wide text-ink-2">Evidence</h3>
              <ul className="mt-2 grid gap-2">
                {rows.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 rounded-card border border-hairline bg-panel p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-caption font-semibold text-ink-2">{e.source}</p>
                      <p className="mt-0.5 text-footnote leading-relaxed text-ink-1">{e.text}</p>
                    </div>
                    <button
                      type="button"
                      className={`btn-ghost ${btn} flex-none`}
                      aria-label={`Open ${e.source}`}
                      onClick={() => openApp(e.app, { id: e.appId })}
                    >
                      Open
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`btn-secondary ${btn}`}
                  onClick={async () => showToast((await copyText(asText())) ? "Copied" : "Couldn't copy")}
                >
                  <span className="i-ph:copy-bold" aria-hidden="true" />
                  Copy text
                </button>
                <button
                  type="button"
                  className={`btn-secondary ${btn}`}
                  onClick={async () => {
                    const r = await share({ title: "Hire Raj", text: match.pitch, url: deepLinkUrl("hire", undefined, match.role) });
                    if (r === "copied") showToast("Link copied");
                  }}
                >
                  <span className="i-ph:share-network-bold" aria-hidden="true" />
                  Share
                </button>
                <button
                  type="button"
                  className={`btn-secondary ${btn}`}
                  onClick={() => {
                    downloadVCard();
                    showToast("Contact card downloaded");
                  }}
                >
                  <span className="i-ph:address-book-bold" aria-hidden="true" />
                  Download contact
                </button>
                <a className={`btn-primary ${btn}`} href={mailto()}>
                  <span className="i-ph:envelope-simple-bold" aria-hidden="true" />
                  Email Raj
                </a>
              </div>
              <p className="mt-3 text-caption text-ink-3">Matched from Raj's portfolio; check the facts yourself.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
