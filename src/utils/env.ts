export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const isTouchDevice = (): boolean =>
  typeof window !== "undefined" && !!window.matchMedia?.("(hover: none)").matches;

export const isMac = (): boolean =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);

/** Shortcut label showing both styles, e.g. "⌘K / Ctrl+K". */
export const shortcutLabel = (key: string): string => `⌘${key} / Ctrl+${key}`;

export const openInNewTab = (url: string): void => {
  window.open(url, "_blank", "noopener,noreferrer");
};

export const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers/contexts without the async clipboard API.
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      el.remove();
      return ok;
    } catch {
      return false;
    }
  }
};
