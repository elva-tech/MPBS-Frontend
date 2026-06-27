const MILK_TYPES = ["Buffalo", "Cow"];

export default function MilkCollectionTable({
  sessionLabel,
  enabled,
  rows = [],
  onClearRow,
  onChange,
}) {
  const isActive = enabled;
  const badgeClass = isActive
    ? "bg-white text-[#1E4B6B] border border-[#9BB6DA]"
    : "bg-[#F5EBD1] text-[#5F4C24] border border-[#CDBB8C]";
  const cardClass = isActive
    ? "border-[#EFE6D0] bg-[#FFFDF8]"
    : "border-[#E1ECFB] bg-[#F9FCFF]";
  const rowBg = isActive ? "bg-[#FAF5E8]" : "bg-[#EEF4FC]";
  const inputClass = isActive
    ? "bg-[#FAF4E4] border-[#EADFC6] text-[#3B2F1E]"
    : "bg-[#EEF4FC] border-[#DEE7F4] text-[#74859A]";

  return (
    <div className={`rounded border px-4 py-3 shadow-sm ${cardClass}`}>
      <div className="flex items-center gap-3">
        <div className="text-[15px] font-semibold text-[#23324A]">
          {sessionLabel}
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeClass}`}
        >
          {isActive ? "Active" : "Locked"}
          {!isActive && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="5"
                y="10"
                width="14"
                height="10"
                rx="2"
                stroke="#6F5A29"
                strokeWidth="2"
              />
              <path
                d="M8 10V7a4 4 0 1 1 8 0v3"
                stroke="#6F5A29"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </span>
      </div>

      <div
        className={`mt-3 grid items-center gap-2 rounded border border-[#E6EAF2] bg-white px-3 py-2 text-[11px] font-semibold text-[#6A7C92] ${
          isActive ? "grid-cols-7" : "grid-cols-6"
        }`}
      >
        <div>Type</div>
        <div>Fat %</div>
        <div>SNF %</div>
        <div>Quantity (L)</div>
        <div>Rate (?/L)</div>
        <div>Amount (?)</div>
        {isActive && <div>Actions</div>}
      </div>

      <div className="mt-2 space-y-2">
        {rows.map((row, index) => {
          const otherSelectedTypes = rows
            .filter((_, i) => i !== index)
            .map((r) => r.milkType);

          return (
            <div
              key={index}
              className={`grid items-center gap-2 rounded border border-transparent px-3 py-2 text-sm ${
                isActive ? "grid-cols-7" : "grid-cols-6"
              } ${rowBg}`}
            >
              <select
                value={row.milkType}
                disabled={!enabled}
                onChange={(e) =>
                  onChange(index, "milkType", e.target.value)
                }
                className={`h-9 rounded border px-2 text-sm select-text ${inputClass}`}
              >
                <option value="">Select Milk Type</option>
                {MILK_TYPES.map((type) => (
                  <option
                    key={type}
                    value={type}
                    disabled={otherSelectedTypes.includes(type)}
                  >
                    {type}
                  </option>
                ))}
              </select>

              <input
                value={enabled ? row.fat : row.fat || "0.0"}
                disabled={!enabled}
                onChange={(e) =>
                  onChange(index, "fat", e.target.value)
                }
                className={`h-9 rounded border px-2 text-sm select-text ${inputClass}`}
              />

              <input
                value={enabled ? row.snf : row.snf || "0.0"}
                disabled={!enabled}
                onChange={(e) =>
                  onChange(index, "snf", e.target.value)
                }
                className={`h-9 rounded border px-2 text-sm select-text ${inputClass}`}
              />

              <input
                value={enabled ? row.qty : row.qty || "0.00"}
                disabled={!enabled}
                onChange={(e) =>
                  onChange(index, "qty", e.target.value)
                }
                className={`h-9 rounded border px-2 text-sm select-text ${inputClass}`}
              />

              <input
                value={row.rate || "45.00"}
                disabled
                className={`h-9 rounded border px-2 text-sm font-semibold select-text ${inputClass}`}
              />

              <input
                value={row.amount || ""}
                disabled
                className={`h-9 rounded border px-2 text-sm font-semibold select-text ${inputClass}`}
              />

              {isActive && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="grid h-8 w-8 place-items-center rounded border border-[#C9D6E8] bg-white text-[#1E4B6B]"
                    title="Edit"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 20h4l10-10-4-4L4 16v4Z"
                        stroke="#1E4B6B"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onClearRow(index)}
                    className="grid h-8 w-8 place-items-center rounded border border-[#F1C6C6] bg-white text-[#E15A5A]"
                    title="Delete"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 6h18"
                        stroke="#E15A5A"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M8 6V4h8v2"
                        stroke="#E15A5A"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <rect
                        x="6"
                        y="6"
                        width="12"
                        height="14"
                        rx="2"
                        stroke="#E15A5A"
                        strokeWidth="2"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}




