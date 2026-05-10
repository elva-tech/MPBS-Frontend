import { useMemo, useState } from "react";
import { addScheme, loadAccountState, toggleScheme } from "./engine";

function schemeTypeLabel(type) {
  if (type === "DEDUCTION") return "Deduction";
  if (type === "INCENTIVE") return "Incentive";
  if (type === "FIXED") return "Fixed";
  return "Conditional";
}

function formatSchemeValue(scheme) {
  if (scheme.calculationType === "PER_LITRE") return `Rs ${scheme.value}/L`;
  return `Rs ${Number(scheme.value || 0).toLocaleString("en-IN")}`;
}

function appliedLabel(scheme) {
  if (scheme.appliesTo?.includes("ALL")) return "All Societies";
  return `${scheme.appliesTo?.length || 0} Societies`;
}

export default function Schemes() {
  const [state, setState] = useState(() => loadAccountState());
  const [message, setMessage] = useState("");

  const rows = useMemo(() => state.schemes, [state.schemes]);

  const handleToggle = (schemeId) => {
    const res = toggleScheme(schemeId);
    setState(res.state || loadAccountState());
    setMessage(res.message);
  };

  const handleAddScheme = () => {
    const name = window.prompt("Enter scheme name:");
    if (!name) return;
    const typeRaw = (window.prompt("Type: DEDUCTION / INCENTIVE / FIXED / CONDITIONAL", "INCENTIVE") || "INCENTIVE").toUpperCase();
    const valueRaw = window.prompt("Enter numeric value:", "1");
    const value = Number(valueRaw || 0);
    const appliesRaw = (window.prompt("Apply to ALL or comma-separated society codes", "ALL") || "ALL").trim();
    const appliesTo = appliesRaw.toUpperCase() === "ALL" ? ["ALL"] : appliesRaw.split(",").map((item) => item.trim()).filter(Boolean);

    const payload = {
      name,
      type: ["DEDUCTION", "INCENTIVE", "FIXED", "CONDITIONAL"].includes(typeRaw) ? typeRaw : "INCENTIVE",
      calculationType: typeRaw === "FIXED" ? "FIXED" : typeRaw === "CONDITIONAL" ? "CONDITION" : "PER_LITRE",
      value,
      appliesTo,
    };

    if (payload.type === "CONDITIONAL") {
      payload.condition = { metric: "avgFat", op: ">", threshold: 4 };
    }

    const res = addScheme(payload);
    setState(res.state || loadAccountState());
    setMessage(res.message);
  };

  return (
    <div className="p-6 text-[#1F2A44]">
      <div className="rounded-xl border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#1E4B6B]">Schemes Management</h1>
          <button onClick={handleAddScheme} className="rounded-lg bg-[#1E73BE] px-3 py-2 text-sm font-semibold text-white">+ Add Scheme</button>
        </div>
        {message ? <p className="mb-3 rounded-lg bg-[#EEF4FF] px-3 py-2 text-sm text-[#1E4B6B]">{message}</p> : null}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6EDF7] text-left text-[#5B6B7F]">
                <th className="py-2">Scheme Name</th>
                <th className="py-2">Type</th>
                <th className="py-2">Value</th>
                <th className="py-2">Applied To</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[#F2F6FC]">
                  <td className="py-2 font-semibold">{row.name}</td>
                  <td className="py-2">{schemeTypeLabel(row.type)}</td>
                  <td className="py-2">{formatSchemeValue(row)}</td>
                  <td className="py-2">{appliedLabel(row)}</td>
                  <td className="py-2">
                    <button
                      onClick={() => handleToggle(row.id)}
                      className={`h-6 w-10 rounded-full ${row.isActive ? "bg-[#25A772]" : "bg-[#CBD5E1]"}`}
                      aria-label={`Toggle ${row.name}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
