import { prefersReducedMotion } from "~/utils";

export function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion());

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}
