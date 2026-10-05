interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  color?: string;
  /** Tiny blurred data-URL shown until the real image has loaded. */
  blur?: string;
  contain?: boolean;
  className?: string;
}

/** Lazy image with blur-up: dominant colour → blurred preview → sharp image (no layout shift). */
export default function LazyImage({ src, alt, width, height, color, blur, contain, className = "" }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const fit = contain ? "object-contain" : "object-cover";
  return (
    <span className={`relative block overflow-hidden ${className}`} style={{ backgroundColor: color ?? "var(--surface-3)" }}>
      {blur ? (
        <img
          src={blur}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 size-full scale-110 blur-lg ${fit} transition-opacity duration-emphasis ${
            loaded ? "opacity-0" : "opacity-100"
          }`}
        />
      ) : (
        !loaded && <span className="skeleton absolute inset-0 rounded-none opacity-50" aria-hidden="true" />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`relative size-full ${fit} transition-opacity duration-emphasis ease-standard ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </span>
  );
}
