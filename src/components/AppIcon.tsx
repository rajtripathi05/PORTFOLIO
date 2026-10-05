import type { IconSpec } from "~/configs/apps";

interface AppIconProps {
  icon: IconSpec;
  size?: number | string;
  className?: string;
}

// Rounded-square app icon: gradient tile + glyph, with a soft top highlight.
export default function AppIcon({ icon, size = 48, className = "" }: AppIconProps) {
  const dim = typeof size === "number" ? `${size}px` : size;
  return (
    <span
      aria-hidden="true"
      className={`app-icon ${icon.tile} ${className}`}
      style={{ width: dim, height: dim }}
    >
      <span className={`${icon.glyph} ${icon.ink ?? "text-on-accent"} w-[56%] h-[56%]`} />
    </span>
  );
}
