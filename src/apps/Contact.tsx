import type React from "react";
import { portfolio } from "~/data/portfolio";
import { copyText } from "~/utils";

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
      <p className="text-[12.5px] font-semibold uppercase tracking-wide text-ink-3">{label}</p>
      <p className="break-all text-[15px] font-medium">{value}</p>
    </div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </li>
);

export default function Contact() {
  const showToast = useStore((s) => s.showToast);

  const copy = async (text: string, what: string) => {
    const ok = await copyText(text);
    showToast(ok ? `${what} copied` : `Couldn't copy — ${text}`);
  };

  return (
    <div className="app-scroll">
      <div className="mx-auto max-w-[620px] px-6 py-7">
        <div className="app-card overflow-hidden">
          <div className="border-b border-hairline bg-panel px-4 py-3 text-[14px]">
            <p>
              <span className="text-ink-3">To: </span>
              <span className="font-semibold">{identity.name}</span>{" "}
              <span className="text-ink-2">&lt;{identity.email}&gt;</span>
            </p>
          </div>
          <div className="px-4 py-5">
            <h1 className="text-[20px] font-bold">Get in touch</h1>
            <p className="mt-1 text-ink-2">Pick whichever way is easiest for you.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a className="btn-primary" href={`mailto:${identity.email}`}>
                <span className="i-ph:paper-plane-tilt-bold" aria-hidden="true" />
                Write an email
              </a>
              <button type="button" className="btn-secondary" onClick={() => copy(identity.email, "Email")}>
                <span className="i-ph:copy-bold" aria-hidden="true" />
                Copy email
              </button>
            </div>
          </div>
        </div>

        <ul className="app-card mt-4 divide-y divide-[var(--hairline)] overflow-hidden" aria-label="Contact details">
          <Row icon="i-ph:envelope-simple-bold" label="Email" value={identity.email}>
            <a className="btn-secondary btn-sm" href={`mailto:${identity.email}`}>
              Email
            </a>
          </Row>
          <Row icon="i-ph:phone-bold" label="Phone" value={identity.phone}>
            <a className="btn-secondary btn-sm" href={`tel:${identity.phone.replace(/\s+/g, "")}`}>
              Call
            </a>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => copy(identity.phone, "Phone number")}
              aria-label="Copy phone number"
            >
              Copy
            </button>
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
      </div>
    </div>
  );
}
