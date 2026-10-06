import type React from "react";

/** Small uppercase section heading used across the content apps. */
export default function SectionHeading({
  id,
  children,
  className = ""
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 id={id} className={`app-h2 ${className}`}>
      {children}
    </h2>
  );
}
