import type { ShareResult, ShareTarget } from "~/types";
import { copyText } from "~/utils/env";

/** Web Share API where available (mobile), otherwise copies the link. */
export async function share(target: ShareTarget): Promise<ShareResult> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(target);
      return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled";
    }
  }
  return (await copyText(target.url)) ? "copied" : "failed";
}
