import { portfolio } from "~/data/portfolio";
import { useAppHost } from "~/shells/host";
import RoleCard, { roleDomId } from "~/components/content/RoleCard";
import { useScrollTarget } from "~/components/content/useScrollTarget";

export default function Leadership() {
  const { shell } = useAppHost();
  const rootRef = useRef<HTMLDivElement>(null);
  const highlight = useScrollTarget(rootRef, roleDomId);

  return (
    <div ref={rootRef} className="app-scroll">
      <div className={`mx-auto max-w-[800px] py-7 ${shell === "phone" ? "px-4" : "px-6 sm:px-9"}`}>
        <h1 className="app-h1">Leadership</h1>
        <div className="mt-6 grid gap-4">
          {portfolio.leadership.map((r) => (
            <RoleCard key={r.id} role={r} app="leadership" highlight={highlight === r.id} />
          ))}
        </div>
      </div>
    </div>
  );
}
