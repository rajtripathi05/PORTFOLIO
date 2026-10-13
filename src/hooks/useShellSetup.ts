import { readDeepLink } from "~/utils/deeplink";
import { listenForVadaPav } from "~/features/vadapav";

/**
 * Setup shared by every shell: follows the OS theme, opens
 * `/?open=<app>&id=<id>&q=<q>&url=<url>` deep links on load, and listens for a snack.
 * Returns true when the page was opened through a deep link.
 */
export function useShellSetup(): boolean {
  const syncSystemTheme = useStore((s) => s.syncSystemTheme);
  const openApp = useStore((s) => s.openApp);
  const [deepLinked] = useState(() => readDeepLink() !== null);

  useEffect(listenForVadaPav, []);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener("change", syncSystemTheme);
    return () => mq?.removeEventListener("change", syncSystemTheme);
  }, []);

  useEffect(() => {
    const link = readDeepLink();
    if (link) openApp(link.app, link.params);
  }, []);

  return deepLinked;
}
