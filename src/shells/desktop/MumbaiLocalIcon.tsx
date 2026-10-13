import { useId } from "react";

// Original "Mumbai Local" launcher art: a local train at dusk. Palette lives only in this SVG.
export default function MumbaiLocalIcon() {
  const u = useId().replace(/:/g, "");
  const sky = `${u}s`, gl = `${u}g`, hl = `${u}h`, cl = `${u}c`;
  return (
    <svg viewBox="0 0 72 72" width="72" height="72" aria-hidden="true" className="ml-icon">
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b1f6b" />
          <stop offset=".5" stopColor="#c2367e" />
          <stop offset="1" stopColor="#ff8a3d" />
        </linearGradient>
        <linearGradient id={gl} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".45" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={hl}>
          <stop offset="0" stopColor="#fff6c8" />
          <stop offset=".35" stopColor="#ffd666" stopOpacity=".7" />
          <stop offset="1" stopColor="#ffd666" stopOpacity="0" />
        </radialGradient>
        <clipPath id={cl}>
          <rect width="72" height="72" rx="18" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${cl})`}>
        <rect width="72" height="72" fill={`url(#${sky})`} />
        <circle cx="52" cy="40" r="9" fill="#ffc46b" opacity=".85" />
        <path d="M0 44V36h5v-5h4v7h4v-10h5v8h4v-4h28v-6h4v8h4v-3h6v5h4v8z" fill="#3a1a4f" opacity=".55" />
        <path d="M0 72L32 44h8l32 28z" fill="#2a1830" />
        <g stroke="#7a5a6a" strokeWidth="1.4">
          <path d="M22 72l12-28M50 72L38 44" />
          <path d="M18 70h36M24 62h24M28 55h16M31 49h10" strokeWidth="1" />
        </g>
        <path d="M22 60V30q0-9 14-9t14 9v30z" fill="#f4ead2" />
        <rect x="22" y="47" width="28" height="4" fill="#2457b8" />
        <rect x="22" y="51" width="28" height="2.4" fill="#d6303a" />
        <rect x="25" y="28" width="22" height="13" rx="3" fill="#1a1d2e" />
        <rect x="30" y="23.5" width="12" height="3.6" rx="1" fill="#1a1d2e" />
        <text x="36" y="26.4" fontSize="3" fill="#ffd666" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">VIRAR</text>
        <path d="M27 30h8l-3 9h-5z" fill="#fff" opacity=".12" />
        <g className="ml-halo">
          <circle cx="27.5" cy="56.5" r="6" fill={`url(#${hl})`} />
          <circle cx="44.5" cy="56.5" r="6" fill={`url(#${hl})`} />
        </g>
        <circle cx="27.5" cy="56.5" r="1.8" fill="#fffbe6" />
        <circle cx="44.5" cy="56.5" r="1.8" fill="#fffbe6" />
        <rect width="72" height="30" fill={`url(#${gl})`} />
        <rect className="ml-sweep" x="-30" y="-10" width="16" height="92" fill="#fff" opacity=".35" transform="skewX(-20)" />
        <rect x=".5" y=".5" width="71" height="71" rx="17.5" fill="none" stroke="#fff" strokeOpacity=".35" />
      </g>
      <circle cx="61" cy="11" r="6.5" fill="#22b357" stroke="#fff" strokeWidth="1.2" />
      <path d="M59 8v6l5-3z" fill="#fff" />
    </svg>
  );
}
