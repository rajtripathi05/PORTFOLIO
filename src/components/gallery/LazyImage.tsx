interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  color?: string;
  contain?: boolean;
  className?: string;
}

/** Lazy-loaded image with a skeleton + dominant-colour placeholder (no layout shift). */
export default function LazyImage({ src, alt, width, height, color, contain, className = "" }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <span
      className={`relative block overflow-hidden ${className}`}
      style={{ backgroundColor: color ?? "var(--panel-3)" }}
    >
      {!loaded && <span className="skeleton absolute inset-0 rounded-none opacity-50" aria-hidden="true" />}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`size-full transition-opacity duration-300 ${contain ? "object-contain" : "object-cover"} ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </span>
  );
}
