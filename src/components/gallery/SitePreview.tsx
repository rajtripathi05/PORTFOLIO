import type { Preview } from "~/data/previews";
import { safeHost } from "~/data/portfolio";

interface SitePreviewProps {
  url: string;
  preview?: Preview;
  /** Use the small (480px) capture, e.g. for Safari favourite tiles. */
  small?: boolean;
  className?: string;
}

/**
 * Screenshot of a live site. When there is no capture yet (or the file is missing),
 * a neutral placeholder with the host name is shown instead of a broken image.
 */
export default function SitePreview({ url, preview, small, className = "" }: SitePreviewProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [preview?.src]);

  if (!preview || failed)
    return (
      <span className={`flex-center flex-col gap-1.5 bg-panel-2 text-ink-3 ${className}`} aria-hidden="true">
        <span className="i-ph:globe-hemisphere-west-duotone text-[36px]" />
        <span className="max-w-[90%] truncate text-footnote font-semibold text-ink-2">{safeHost(url)}</span>
      </span>
    );

  return (
    <img
      src={small ? preview.srcSm : preview.src}
      srcSet={small ? undefined : `${preview.srcSm} 480w, ${preview.src} 960w`}
      sizes={small ? undefined : "(max-width: 700px) 100vw, 460px"}
      alt=""
      width={small ? 480 : preview.width}
      height={small ? 300 : preview.height}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`object-cover object-top ${className}`}
      style={{ backgroundColor: preview.color }}
    />
  );
}
