import { useMemo, useState } from "react";
import { addAdjustment, loadAccountState, setSelections } from "./engine";

export default function ClaimsRecoverables() {
  const [state, setState] = useState(() => loadAccountState());
  const [tab, setTab] = useState("All");
  const [message, setMessage] = useState("");

  const rows = useMemo(() => {
    const claimRows = state.claims.map((item) => ({
      type: "Claim",
      society: item.societyId,
      amount: `Rs ${Number(item.amount || 0).toLocaleString("en-IN")}`,
      reason: item.reason,
      cycle: item.cycleId,
      status: item.status === "APPLIED" ? "Applied" : "Pending",
    }));

    const recoverableRows = state.recoverables.map((item) => ({
      type: "Recoverable",
      society: item.societyId,
      amount: `Rs ${Number(item.remainingAmount || 0).toLocaleString("en-IN")}`,
      reason: `${item.reason} (Inst: Rs ${Number(item.installmentAmount || 0).toLocaleString("en-IN")})`,
      cycle: state.selectedCycleId,
      status: item.status === "ACTIVE" ? "Pending" : "Applied",
    }));

    return [...claimRows, ...recoverableRows];
  }, [state]);

  const filtered = useMemo(() => {
    if (tab === "All") return rows;
    if (tab === "Claims") return rows.filter((item) => item.type === "Claim");
    return rows.filter((item) => item.type === "Recoverable");
  }, [rows, tab]);

  const handleAdd = () => {
    const kindRaw = (window.prompt("Type: Claim or Recoverable", "Claim") || "Claim").toUpperCase();
    const kind = kindRaw.startsWith("R") ? "RECOVERABLE" : "CLAIM";
    const societyId = window.prompt("Society code (e.g. S001)", state.selectedSocietyId) || state.selectedSocietyId;
    const cycleId = window.prompt("Cycle (e.g. 1-10)", state.selectedCycleId) || state.selectedCycleId;
    const amount = Number(window.prompt("Amount", "1000") || 0);
    const reason = window.prompt("Reason", "Manual adjustment") || "Manual adjustment";
    const installmentAmount =
      kind === "RECOVERABLE"
        ? Number(window.prompt("Installment amount (for recoverable)", String(amount)) || amount)
        : undefined;

    const res = addAdjustment({ kind, societyId, cycleId, amount, reason, installmentAmount });
    const next = setSelections({ cycleId, societyId });
    setState(res.state || next || loadAccountState());
    setMessage(res.message);
  };

  return (
    <div className="p-6 text-[#1F2A44]">
      <div className="rounded-xl border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#1E4B6B]">Claims & Recoverables</h1>
          <button onClick={handleAdd} className="rounded-lg bg-[#1E73BE] px-3 py-2 text-sm font-semibold text-white">+ Add</button>
        </div>
        {message ? <p className="mb-3 rounded-lg bg-[#EEF4FF] px-3 py-2 text-sm text-[#1E4B6B]">{message}</p> : null}
        <div className="mb-4 flex gap-2">
          {["All", "Claims", "Recoverables"].map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`rounded px-3 py-1.5 text-sm ${tab === item ? "bg-[#1E4B6B] text-white" : "bg-[#EEF4FF] text-[#1E4B6B]"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6EDF7] text-left text-[#5B6B7F]">
                <th className="py-2">Type</th>
                <th className="py-2">Society</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Reason</th>
                <th className="py-2">Cycle</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => (
                <tr key={`${row.society}-${index}`} className="border-b border-[#F2F6FC]">
                  <td className="py-2">{row.type}</td>
                  <td className="py-2 font-semibold">{row.society}</td>
                  <td className="py-2">{row.amount}</td>
                  <td className="py-2">{row.reason}</td>
                  <td className="py-2">{row.cycle}</td>
                  <td className="py-2">
                    <span className={`rounded px-2 py-1 text-xs ${row.status === "Applied" ? "bg-[#E6F5EE] text-[#1D7F50]" : "bg-[#FFF5DD] text-[#8A6A1F]"}`}>
                      {row.status}
                    </span>
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
