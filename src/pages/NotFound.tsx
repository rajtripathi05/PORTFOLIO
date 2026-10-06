// 404, styled as a macOS alert dialog. Served by Netlify (dist/404.html) for unknown URLs.
export default function NotFound() {
  const btnRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    document.title = "Page not found — Raj Tripathi";
    btnRef.current?.focus();
  }, []);

  return (
    <main className="fixed inset-0 flex-center p-4" style={{ background: "var(--wallpaper-dusk)" }}>
      <div
        role="alertdialog"
        aria-labelledby="nf-title"
        aria-describedby="nf-body"
        className="material-popover w-full max-w-[300px] rounded-panel border border-hairline px-5 pb-5 pt-6 text-center shadow-overlay"
      >
        <span className="mx-auto grid size-16 place-items-center rounded-panel tile-about text-on-media shadow-raised">
          <Monogram size={40} />
        </span>
        <h1 id="nf-title" className="mt-4 text-body font-bold">
          This page doesn't exist
        </h1>
        <p id="nf-body" className="mt-1 text-footnote text-ink-2">
          The link may be broken, or the page may have moved.
        </p>
        <div className="mt-5 grid gap-2">
          <a ref={btnRef} href="/" className="btn-primary">
            Go to desktop
          </a>
          <a href="/quick" className="btn-secondary">
            Open Quick View
          </a>
        </div>
      </div>
    </main>
  );
}
