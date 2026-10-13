import { feedback } from "~/sensory/feedback";

/** A small segmented control (radio group) for switching between a few views or values. */
export default function Segmented<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-button bg-panel-3 p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          className={`min-h-[36px] rounded-[8px] px-3 text-footnote font-semibold transition-colors ${
            value === o.id ? "bg-panel text-ink-1 shadow-resting" : "text-ink-2"
          }`}
          onClick={(e) => {
            feedback("selection", { el: e.currentTarget });
            onChange(o.id);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
