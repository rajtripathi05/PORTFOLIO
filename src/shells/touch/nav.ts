import type React from "react";
import { create } from "zustand";
import type { AppId, AppParams, BackStep } from "~/types";
import type { WindowState } from "~/stores/slices/windows";
import { hasEscapeHandlers } from "~/hooks/useEscape";
import { feedback } from "~/sensory/feedback";

/* ------------------------------------------------------------ in-app back steps */

/** Per-app stacks of in-app back steps (detail → list), registered through AppHost.pushBack. */
export const useBackStacks = create<{ stacks: Partial<Record<AppId, BackStep[]>> }>(() => ({ stacks: {} }));

const setStack = (id: AppId, fn: (s: BackStep[]) => BackStep[]) =>
  useBackStacks.setState((st) => ({ stacks: { ...st.stacks, [id]: fn(st.stacks[id] ?? []) } }));

const pushers = new Map<AppId, (step: BackStep) => () => void>();

/** Stable `pushBack` for an app (stable identity keeps useAppBack effects from looping). */
export const pushBackFor = (id: AppId): ((step: BackStep) => () => void) => {
  let fn = pushers.get(id);
  if (!fn) {
    fn = (step) => {
      setStack(id, (s) => [...s, step]);
      return () => setStack(id, (s) => s.filter((x) => x !== step));
    };
    pushers.set(id, fn);
  }
  return fn;
};

const topStep = (id: AppId): BackStep | undefined => {
  const s = useBackStacks.getState().stacks[id];
  return s?.[s.length - 1];
};

/** The step the shell's back button currently represents (undefined → "‹ Home"). */
export const useTopStep = (id: AppId): BackStep | undefined =>
  useBackStacks((st) => {
    const s = st.stacks[id];
    return s?.[s.length - 1];
  });

/* ------------------------------------------------------------ zoom origins */

const origins = new Map<AppId, { x: number; y: number }>();

/** Where an app's zoom-open starts (centre of the tapped icon/widget). */
export const getOrigin = (id: AppId) => origins.get(id);

/** Opens an app, zooming from `el` (the tapped launcher). */
export const openFrom = (id: AppId, el: Element | null, params?: AppParams): void => {
  if (el) {
    const r = el.getBoundingClientRect();
    origins.set(id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  } else origins.delete(id);
  useStore.getState().openApp(id, params);
};

/* ------------------------------------------------------------ open / close / back */

type Wins = Partial<Record<AppId, WindowState>>;

/** Open apps, bottom → top. */
export const openStack = (w: Wins): AppId[] =>
  (Object.keys(w) as AppId[])
    .filter((id) => w[id]?.open && !w[id]?.min)
    .sort((a, b) => w[a]!.z - w[b]!.z);

export const closeTouchApp = (id: AppId): void => {
  setStack(id, () => []);
  useStore.getState().closeApp(id);
};

/** Shell back button / Escape / browser back: pop the in-app step, else close the app. */
export const goBack = (id: AppId): void => {
  const step = topStep(id);
  if (step) {
    setStack(id, (s) => s.filter((x) => x !== step));
    feedback("tap");
    step.onBack();
  } else closeTouchApp(id);
};

const pushGuard = () => {
  // Deep links (/?open=…): the entry under the app becomes Home, so back never leaves the site.
  if (/[?&]open=/.test(window.location.search)) {
    window.history.replaceState(window.history.state, "", window.location.pathname);
  }
  window.history.pushState({ touchApp: true }, "", window.location.href);
};

/**
 * History + keyboard wiring shared by the phone and tablet shells. While any app is open
 * one history entry guards it: browser/Android back pops the top in-app step, else closes
 * the top app. Closing through the UI calls history.back() once (guarded, no double close).
 * Returns the open apps, bottom → top.
 */
export function useTouchNav(): AppId[] {
  const windows = useStore((s) => s.windows);
  const stack = useMemo(() => openStack(windows), [windows]);
  const anyOpen = stack.length > 0;
  const guarded = useRef(false);
  const ignorePops = useRef(0);

  useEffect(() => {
    if (anyOpen && !guarded.current) {
      pushGuard();
      guarded.current = true;
    } else if (!anyOpen && guarded.current) {
      guarded.current = false;
      ignorePops.current += 1;
      window.history.back();
    }
  }, [anyOpen]);

  useEffect(() => {
    const onPop = () => {
      if (ignorePops.current > 0) {
        ignorePops.current -= 1;
        return;
      }
      if (!guarded.current) return;
      guarded.current = false;
      const st = useStore.getState();
      if (st.overlay) st.setOverlay(null);
      else {
        const top = openStack(st.windows).pop();
        if (top) goBack(top);
      }
      if (openStack(useStore.getState().windows).length > 0) {
        pushGuard();
        guarded.current = true;
      }
    };
    const onKey = (e: KeyboardEvent) => {
      const st = useStore.getState();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        feedback("spotlight");
        st.toggleOverlay("spotlight");
        return;
      }
      if (e.key !== "Escape" || e.defaultPrevented || hasEscapeHandlers()) return;
      const top = openStack(st.windows).pop();
      if (top) goBack(top);
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return stack;
}

/* ------------------------------------------------------------ helpers */

/** Sizes surfaces from the visual viewport so inputs stay above the on-screen keyboard. */
export function useVisualViewport(): { height: number; top: number } {
  const read = () => {
    const vv = window.visualViewport;
    return { height: vv ? vv.height : window.innerHeight, top: vv ? vv.offsetTop : 0 };
  };
  const [vp, setVp] = useState(read);
  useEffect(() => {
    const vv = window.visualViewport;
    const on = () => setVp(read());
    vv?.addEventListener("resize", on);
    vv?.addEventListener("scroll", on);
    window.addEventListener("resize", on);
    return () => {
      vv?.removeEventListener("resize", on);
      vv?.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);
  return vp;
}

/** Makes content behind an open app unreachable by keyboard and screen readers. */
export function useInert(ref: React.RefObject<HTMLElement>, inert: boolean): void {
  useEffect(() => {
    const el = ref.current as (HTMLElement & { inert?: boolean }) | null;
    if (el) el.inert = inert;
  }, [inert]);
}
