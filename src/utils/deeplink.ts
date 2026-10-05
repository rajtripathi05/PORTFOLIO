import { apps, type AppId } from "~/configs/apps";

/** Reads `?open=projects&id=nsu` style deep links. */
export const readDeepLink = (): { app: AppId; payload?: Record<string, unknown> } | null => {
  try {
    const params = new URLSearchParams(window.location.search);
    const open = params.get("open");
    if (!open || !apps.some((a) => a.id === open)) return null;
    const id = params.get("id");
    return { app: open as AppId, payload: id ? { id } : undefined };
  } catch {
    return null;
  }
};

/** Shareable link that opens an app (and optionally an item) directly. */
export const deepLinkUrl = (app: AppId, id?: string): string => {
  const url = new URL(window.location.origin + "/");
  url.searchParams.set("open", app);
  if (id) url.searchParams.set("id", id);
  return url.toString();
};
