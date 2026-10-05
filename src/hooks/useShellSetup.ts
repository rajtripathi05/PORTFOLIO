import { readDeepLink } from "~/utils/deeplink";

/**
 * Setup shared by the desktop and the mobile home screen:
 * follows the OS theme and opens `?open=…&id=…` deep links.
 * Returns true when the page was opened through a deep link.
 */
export function useShellSetup(): boolean {
  const syncSystemTheme = useStore((s) => s.syncSystemTheme);
  const openApp = useStore((s) => s.openApp);
  const [deepLinked] = useState(() => readDeepLink() !== null);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener("change", syncSystemTheme);
    return () => mq?.removeEventListener("change", syncSystemTheme);
  }, []);

  useEffect(() => {
    const link = readDeepLink();
    if (link) openApp(link.app, link.payload);
  }, []);

  return deepLinked;
}
