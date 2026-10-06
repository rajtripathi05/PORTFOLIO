import { isTodoLink, portfolio } from "~/data/portfolio";

const FILE_NAME = "Raj_Tripathi.vcf";

/** Escapes a vCard 3.0 text value (RFC 2426 §4). */
const esc = (s: string): string =>
  s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => `\\${c}`);

/** vCard line folding: lines over 75 characters continue on the next line after CRLF + space. */
const fold = (line: string): string => {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = " " + rest.slice(74);
  }
  out.push(rest);
  return out.join("\r\n");
};

const siteOrigin = (): string => {
  const { siteUrl } = portfolio.identity;
  if (!isTodoLink(siteUrl)) return siteUrl.replace(/\/$/, "");
  return typeof window !== "undefined" ? window.location.origin : "";
};

/** The contact card as vCard 3.0 text, built only from portfolio.ts. */
export function buildVCard(): string {
  const { identity } = portfolio;
  const parts = identity.name.trim().split(/\s+/);
  const family = parts.length > 1 ? parts[parts.length - 1] : "";
  const given = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0];
  const site = siteOrigin();

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(family)};${esc(given)};;;`,
    `FN:${esc(identity.name)}`,
    `TITLE:${esc(identity.headline)}`,
    `NOTE:${esc(identity.headline)}`,
    `EMAIL;TYPE=INTERNET,PREF:${identity.email}`,
    `TEL;TYPE=CELL,VOICE:${identity.phone.replace(/\s+/g, "")}`,
    `URL;TYPE=LinkedIn:${identity.linkedin}`,
    `URL;TYPE=GitHub:${identity.github}`,
    site && `URL;TYPE=Portfolio:${site}/`,
    `X-SOCIALPROFILE;TYPE=linkedin:${identity.linkedin}`,
    `X-SOCIALPROFILE;TYPE=github:${identity.github}`,
    "END:VCARD"
  ].filter(Boolean) as string[];
  return lines.map(fold).join("\r\n") + "\r\n";
}

const isIOS = (): boolean =>
  typeof navigator !== "undefined" &&
  (/iP(hone|od|ad)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

const openAsDataUrl = (text: string): void => {
  window.location.href = "data:text/vcard;charset=utf-8," + encodeURIComponent(text);
};

/** Downloads Raj's contact card (.vcf) built from portfolio.ts. */
export function downloadVCard(): void {
  if (typeof document === "undefined") return;
  const text = buildVCard();

  // iOS Safari can't save downloaded .vcf files: hand the file to the share sheet
  // ("Save to Contacts"), or open it as a data: URL, which shows the contact card.
  if (isIOS()) {
    try {
      const file = new File([text], FILE_NAME, { type: "text/vcard" });
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: portfolio.identity.name }).catch((e: Error) => {
          if (e?.name !== "AbortError") openAsDataUrl(text);
        });
        return;
      }
    } catch {
      /* fall through to the data: URL */
    }
    openAsDataUrl(text);
    return;
  }

  const blob = new Blob([text], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = FILE_NAME;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
