// Custom "RT" monogram (used instead of any Apple logo): stroked paths, inherits currentColor.
export default function Monogram({
  size = 64,
  framed = false,
  className = ""
}: {
  size?: number | string;
  framed?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {framed && <rect x="3" y="3" width="58" height="58" rx="15" strokeWidth={3} />}
      <path d="M13 46V18h10.5a8 8 0 0 1 0 16H13M23 34l8 12" />
      <path d="M35 18h17M43.5 18v28" />
    </svg>
  );
}
