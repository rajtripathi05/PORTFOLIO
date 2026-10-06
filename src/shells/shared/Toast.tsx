/** One-line status toast (store: showToast). Shell-agnostic. */
export default function Toast() {
  const toast = useStore((s) => s.toast);
  return (
    <div aria-live="polite" role="status">
      {toast && (
        <div key={toast.id} className="toast">
          {toast.text}
        </div>
      )}
    </div>
  );
}
