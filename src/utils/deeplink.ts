import type { AppId, AppParams } from "~/types";
import { isAppId } from "~/configs/apps";

/** Reads `/?open=projects&id=nsu` deep links (also `q`, `url`, `label` and `view`). */
export const readDeepLink = (): { app: AppId; params?: AppParams } | null => {
  try {
    const search = new URLSearchParams(window.location.search);
    const open = search.get("open");
    if (!isAppId(open)) return null;
    const params: AppParams = {};
    for (const key of ["id", "q", "url", "label", "view"] as const) {
      const value = search.get(key);
      if (value) params[key] = value;
    }
    return { app: open, params: Object.keys(params).length ? params : undefined };
  } catch {
    return null;
  }
};

/** Shareable link that opens an app (and optionally an item) directly. */
export const deepLinkUrl = (app: AppId, id?: string, q?: string, view?: string): string => {
  const url = new URL(window.location.origin + "/");
  url.searchParams.set("open", app);
  if (id) url.searchParams.set("id", id);
  if (q) url.searchParams.set("q", q);
  if (view) url.searchParams.set("view", view);
  return url.toString();
};
