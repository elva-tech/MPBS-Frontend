import { useState } from "react";
import { isDemoUnlockEnabled, setDemoUnlockEnabled } from "../../utils/demoMode";

export default function DemoUnlockToggle({ onChange }) {
  const [on, setOn] = useState(isDemoUnlockEnabled());

  const toggle = () => {
    const next = !on;
    setDemoUnlockEnabled(next);
    setOn(next);
    onChange?.(next);
  };

  return (
    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6A7C92]">
        Demo unlock
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={toggle}
        className={`relative h-4 w-7 rounded-full transition-colors ${
          on ? "bg-[#1E4B6B]" : "bg-[#C5CED8]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-3" : ""
          }`}
        />
      </button>
    </label>
  );
}
