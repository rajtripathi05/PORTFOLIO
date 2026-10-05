import type React from "react";
import { portfolio } from "~/data/portfolio";

const { identity } = portfolio;

interface RowProps {
  icon: string;
  label: string;
  value: string;
  children: React.ReactNode;
}

const Row = ({ icon, label, value, children }: RowProps) => (
  <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5">
    <span className={`${icon} text-[22px] text-accent-text`} aria-hidden="true" />
    <div className="min-w-0 flex-1">
      <p className="app-h2">{label}</p>
      <p className="break-all text-body font-medium">{value}</p>
    </div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </li>
);

const field =
  "w-full rounded-button border border-hairline bg-panel px-3 py-2 text-body text-ink-1 outline-none transition-colors duration-micro focus:border-accent";

/** Mock "compose" that opens the visitor's own mail app with subject + body filled in. No backend. */
function Compose() {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const href = () => {
    const body = [message.trim(), name.trim() && `\n— ${name.trim()}`].filter(Boolean).join("\n");
    const params = new URLSearchParams();
    if (subject.trim()) params.set("subject", subject.trim());
    if (body) params.set("body", body);
    const q = params.toString().replace(/\+/g, "%20");
    return `mailto:${identity.email}${q ? `?${q}` : ""}`;
  };

  return (
    <form
      className="app-card overflow-hidden"
      onSubmit={(e) => {
        e.preventDefault();
        window.location.href = href();
      }}
      aria-labelledby="compose-title"
    >
      <div className="flex items-center justify-between gap-3 border-b border-hairline bg-panel px-4 py-2.5">
        <h2 id="compose-title" className="text-body font-semibold">
          Write me a message
        </h2>
        <span className="text-caption text-ink-3">Opens in your email app</span>
      </div>
      <div className="grid gap-3 p-4">
        <p className="text-footnote text-ink-2">
          <span className="text-ink-3">To:</span> {identity.name} &lt;{identity.email}&gt;
        </p>
        <label className="grid gap-1 text-footnote font-semibold text-ink-2">
          Your name
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <label className="grid gap-1 text-footnote font-semibold text-ink-2">
          Subject
          <input className={field} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </label>
        <label className="grid gap-1 text-footnote font-semibold text-ink-2">
          Message
          <textarea
            className={`${field} min-h-28 resize-y`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className="btn-primary">
            <span className="i-ph:paper-plane-tilt-bold" aria-hidden="true" />
            Open in my email app
          </button>
          <CopyButton
            text={identity.email}
            label="Copy email"
            copiedLabel="Email address copied"
            icon="i-ph:copy-bold"
            className="btn-secondary"
          />
        </div>
      </div>
    </form>
  );
}

export default function Contact() {
  return (
    <div className="app-scroll">
      <div className="mx-auto max-w-[640px] px-6 py-7">
        <h1 className="app-h1">Get in touch</h1>
        <p className="mt-1 text-ink-2">Pick whichever way is easiest for you.</p>

        <ul className="app-card mt-5 divide-y divide-[var(--hairline)] overflow-hidden" aria-label="Contact details">
          <Row icon="i-ph:envelope-simple-bold" label="Email" value={identity.email}>
            <a className="btn-secondary btn-sm" href={`mailto:${identity.email}`}>
              Email
            </a>
            <CopyButton
              text={identity.email}
              label="Copy"
              copiedLabel="Email address copied"
              icon="i-ph:copy-bold"
            />
          </Row>
          <Row icon="i-ph:phone-bold" label="Phone" value={identity.phone}>
            <a className="btn-secondary btn-sm" href={`tel:${identity.phone.replace(/\s+/g, "")}`}>
              Call
            </a>
            <CopyButton text={identity.phone} label="Copy" copiedLabel="Phone number copied" icon="i-ph:copy-bold" />
          </Row>
          <Row icon="i-ph:linkedin-logo-bold" label="LinkedIn" value={identity.linkedin.replace("https://", "")}>
            <ExternalLink href={identity.linkedin} className="btn-secondary btn-sm">
              Open
            </ExternalLink>
          </Row>
          <Row icon="i-ph:github-logo-bold" label="GitHub" value={identity.github.replace("https://", "")}>
            <ExternalLink href={identity.github} className="btn-secondary btn-sm">
              Open
            </ExternalLink>
          </Row>
          <Row icon="i-ph:file-text-bold" label="Resume" value="Raj_Tripathi_Resume.pdf">
            <a className="btn-secondary btn-sm" href={identity.resumePdf} download="Raj_Tripathi_Resume.pdf">
              Download
            </a>
          </Row>
        </ul>

        <div className="mt-5">
          <Compose />
        </div>
      </div>
    </div>
  );
}
